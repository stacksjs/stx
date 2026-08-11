import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

function bootRuntime(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

describe('bindIf dependency tracking', () => {
  beforeEach(() => {
    bootRuntime()
    document.body.innerHTML = ''
  })

  it('subscribes only to signals referenced by its expression', () => {
    const root = document.createElement('section')
    root.setAttribute('data-stx-scope', 'conditional')
    root.innerHTML = '<div :if="open()">Visible</div>'
    document.body.append(root)

    const open = window.stx.state(false)
    const unrelated = window.stx.state(false)
    window.stx._scopes = { conditional: { open, unrelated } }

    window.__stxDomReadyHandler()

    expect(open._effects.size).toBe(1)
    expect(unrelated._effects.size).toBe(0)

    unrelated.set(true)
    expect(root.textContent).not.toContain('Visible')

    open.set(true)
    expect(root.textContent).toContain('Visible')
  })
})
