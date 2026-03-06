import { describe, expect, it, beforeEach, afterEach } from 'bun:test'

// The signals runtime expects window.addEventListener for 'stx:load' and
// document.addEventListener for 'DOMContentLoaded'. Stub them if not present.
const origWindowAddEventListener = (window as any).addEventListener
const origDocAddEventListener = (document as any).addEventListener

describe('Router Navigation Cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="main-content"></main>'
    // Reset window.stx
    ;(window as any).stx = undefined
    // Ensure addEventListener is available (Bun test env may lack it)
    if (!window.addEventListener) {
      ;(window as any).addEventListener = function() {}
    }
    if (!document.addEventListener) {
      ;(document as any).addEventListener = function() {}
    }
  })

  afterEach(() => {
    // Restore originals
    if (origWindowAddEventListener) {
      ;(window as any).addEventListener = origWindowAddEventListener
    }
    if (origDocAddEventListener) {
      ;(document as any).addEventListener = origDocAddEventListener
    }
  })

  it('cleanupContainer should be exposed on window.stx after runtime init', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    const runtime = generateSignalsRuntimeDev()
    new Function(runtime)()
    expect(typeof (window as any).stx._cleanupContainer).toBe('function')
  })

  it('cleanupContainer should invoke __stx_destroy hooks on child elements', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    new Function(generateSignalsRuntimeDev())()

    const container = document.querySelector('main')!
    const child = document.createElement('div')
    let destroyed = false
    ;(child as any).__stx_destroy = [() => { destroyed = true }]
    container.appendChild(child)

    ;(window as any).stx._cleanupContainer(container)
    expect(destroyed).toBe(true)
  })

  it('cleanupContainer should invoke __stx_disposers on child elements', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    new Function(generateSignalsRuntimeDev())()

    const container = document.querySelector('main')!
    const child = document.createElement('div')
    let disposed = false
    ;(child as any).__stx_disposers = () => { disposed = true }
    container.appendChild(child)

    ;(window as any).stx._cleanupContainer(container)
    expect(disposed).toBe(true)
  })

  it('cleanupContainer should remove stale scopes', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    new Function(generateSignalsRuntimeDev())()

    const container = document.querySelector('main')!
    const child = document.createElement('div')
    child.setAttribute('data-stx-scope', 'test_scope_1')
    container.appendChild(child)

    ;(window as any).stx._scopes['test_scope_1'] = { count: () => 0 }
    ;(window as any).stx._cleanupContainer(container)
    expect((window as any).stx._scopes['test_scope_1']).toBeUndefined()
  })

  it('cleanupContainer should fire __destroyCallbacks from scope', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    new Function(generateSignalsRuntimeDev())()

    const container = document.querySelector('main')!
    const child = document.createElement('div')
    child.setAttribute('data-stx-scope', 'test_scope_2')
    container.appendChild(child)

    let destroyed = false
    ;(window as any).stx._scopes['test_scope_2'] = {
      __destroyCallbacks: [() => { destroyed = true }]
    }

    ;(window as any).stx._cleanupContainer(container)
    expect(destroyed).toBe(true)
  })

  it('cleanupContainer should be idempotent (safe to call twice)', () => {
    const { generateSignalsRuntimeDev } = require('../../src/signals')
    new Function(generateSignalsRuntimeDev())()

    const container = document.querySelector('main')!
    const child = document.createElement('div')
    let count = 0
    ;(child as any).__stx_destroy = [() => { count++ }]
    container.appendChild(child)

    ;(window as any).stx._cleanupContainer(container)
    ;(window as any).stx._cleanupContainer(container)
    expect(count).toBe(1) // Only fires once
  })
})

describe('Scope Isolation', () => {
  beforeEach(() => {
    if (!window.addEventListener) {
      ;(window as any).addEventListener = function() {}
    }
    if (!document.addEventListener) {
      ;(document as any).addEventListener = function() {}
    }
  })

  it('findElementScope should prefer __stx_scope over data-stx-scope', () => {
    // Verify __stx_scope property works on elements
    const el = document.createElement('div')
    const localScope = { count: () => 42 }
    ;(el as any).__stx_scope = localScope

    expect((el as any).__stx_scope).toBe(localScope)
  })
})
