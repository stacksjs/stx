import { describe, expect, it } from 'bun:test'
import { SIGNALS_HOST_RUNTIME } from '../../src/client/signals-host-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function evaluateHost(windowValue: Record<string, unknown>, documentValue: Record<string, unknown> = {}): Record<string, unknown> {
  const loadHost = new Function('window', 'document', `${SIGNALS_HOST_RUNTIME}\nreturn stxHost`)
  return loadHost(windowValue, documentValue) as Record<string, unknown>
}

describe('signals host runtime boundary', () => {
  it('assembles the host fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HOST_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HOST_RUNTIME, first + 1)).toBe(-1)
  })

  it('uses a host supplied before the runtime starts', () => {
    const nativeHost = { isNative: true, setText() {} }

    expect(evaluateHost({ __stx_host: nativeHost })).toBe(nativeHost)
  })

  it('keeps DOM mutations behind the default host surface', () => {
    const host = evaluateHost({})

    expect(Object.keys(host).sort()).toEqual([
      'anchor',
      'clone',
      'descendants',
      'emitComponentEvent',
      'getAttribute',
      'insert',
      'listen',
      'observeAttributes',
      'observeChildren',
      'onFormReset',
      'parent',
      'remove',
      'removeAttribute',
      'scopeOf',
      'scopesIn',
      'setAttribute',
      'setMarkup',
      'setStyle',
      'setText',
      'setVisible',
    ])
  })

  it('observes only the requested DOM attributes and disconnects on cleanup', () => {
    const calls: unknown[] = []
    const callback = () => {}
    class Observer {
      constructor(fn: () => void) { expect(fn).toBe(callback) }
      observe(node: unknown, options: unknown) { calls.push([node, options]) }
      disconnect() { calls.push('disconnect') }
    }
    const host = new Function('window', 'MutationObserver', `${SIGNALS_HOST_RUNTIME}\nreturn stxHost`)({}, Observer)
    const node = {}
    const stop = host.observeAttributes(node, ['open', 'model-value'], callback)
    expect(calls).toEqual([[node, { attributes: true, attributeFilter: ['open', 'model-value'] }]])
    stop()
    expect(calls[1]).toBe('disconnect')
  })

  it('preserves the DOM event and its cancellation result', () => {
    const host = evaluateHost({})
    const event = new Event('saved', { cancelable: true })
    const node = { dispatchEvent(received: Event) { expect(received).toBe(event); return false } }
    const emit = host.emitComponentEvent as (node: unknown, event: Event) => boolean
    expect(emit(node, event)).toBe(false)
  })

  it('observes child-list changes and cancels queued delivery when unsubscribed', () => {
    let deliver = () => {}
    let calls = 0
    let disconnected = false
    const node = { parentElement: {}, getAttribute: (name: string) => name === 'role' ? 'tab' : null }
    class Observer {
      constructor(callback: () => void) { deliver = callback }
      observe(target: unknown, options: unknown) {
        expect(target).toBe(node)
        expect(options).toEqual({ childList: true, subtree: true })
      }
      disconnect() { disconnected = true }
    }
    const host = new Function('window', 'MutationObserver', `${SIGNALS_HOST_RUNTIME}\nreturn stxHost`)({}, Observer)
    expect(host.parent(node)).toBe(node.parentElement)
    expect(host.getAttribute(node, 'role')).toBe('tab')
    const stop = host.observeChildren(node, () => calls++)
    deliver()
    expect(calls).toBe(1)
    stop()
    deliver()
    expect(calls).toBe(1)
    expect(disconnected).toBe(true)
  })
})
