import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

describe('useClickOutside runtime', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves a template ref when each pointer event occurs', () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    const outside = document.createElement('button')
    document.body.append(first, second, outside)

    let current: HTMLElement | null = first
    let calls = 0
    const target = {
      get current() {
        return current
      },
    }
    const listener = window.stx.useClickOutside(target, () => calls++)

    first.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(calls).toBe(0)

    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(calls).toBe(1)

    current = second
    first.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(calls).toBe(2)
    second.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(calls).toBe(2)

    listener.remove()
  })

  it('resolves value-based refs', () => {
    const targetElement = document.createElement('div')
    const outside = document.createElement('button')
    document.body.append(targetElement, outside)

    let calls = 0
    const listener = window.stx.useClickOutside({ value: targetElement }, () => calls++)

    targetElement.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

    expect(calls).toBe(1)
    listener.remove()
  })
})
