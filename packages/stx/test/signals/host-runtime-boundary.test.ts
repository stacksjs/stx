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
      'insert',
      'listen',
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
})
