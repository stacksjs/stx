import { describe, expect, it } from 'bun:test'
import { SIGNALS_DOM_READY_RUNTIME } from '../../src/client/signals-dom-ready-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals DOM-ready runtime boundary', () => {
  it('assembles the DOM-ready fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_DOM_READY_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_DOM_READY_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps page, component, and global mount initialization together', () => {
    expect(SIGNALS_DOM_READY_RUNTIME).toContain('const stxDomReadyHandler = () => {')
    expect(SIGNALS_DOM_READY_RUNTIME).toContain('mountQueue.forEach(function(fn) { fn(); })')
    expect(SIGNALS_DOM_READY_RUNTIME).toContain("document.querySelectorAll('[data-stx-scope]')")
    expect(SIGNALS_DOM_READY_RUNTIME).toContain("document.addEventListener('DOMContentLoaded', stxDomReadyHandler)")
  })
})
