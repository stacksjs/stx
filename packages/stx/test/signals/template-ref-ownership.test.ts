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

describe('template ref ownership', () => {
  beforeEach(() => {
    bootRuntime()
    document.body.innerHTML = ''
  })

  it('keeps each useRef bound to the component scope that created it', () => {
    const firstRoot = document.createElement('div')
    const secondRoot = document.createElement('div')
    firstRoot.setAttribute('data-stx-scope', 'first')
    secondRoot.setAttribute('data-stx-scope', 'second')
    document.body.append(firstRoot, secondRoot)

    const firstElement = document.createElement('button')
    const secondElement = document.createElement('input')
    const firstScope = { $refs: {} as Record<string, HTMLElement> }
    const secondScope = { $refs: {} as Record<string, HTMLElement> }
    window.stx._scopes = { first: firstScope, second: secondScope }

    window.__STX_CURRENT_ELEMENT__ = firstRoot
    const firstRef = window.stx.useRef('control')
    window.__STX_CURRENT_ELEMENT__ = secondRoot
    const secondRef = window.stx.useRef('control')

    firstScope.$refs.control = firstElement
    secondScope.$refs.control = secondElement

    expect(firstRef.current).toBe(firstElement)
    expect(firstRef.value).toBe(firstElement)
    expect(secondRef.current).toBe(secondElement)
    expect(secondRef.value).toBe(secondElement)
  })
})
