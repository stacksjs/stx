import { describe, expect, it } from 'bun:test'
import { SIGNALS_PROXY_RUNTIME } from '../../src/client/signals-proxy-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadProxies(): Record<string, any> {
  return new Function(`${SIGNALS_PROXY_RUNTIME}\nreturn { createAutoUnwrapProxy, createModelWriteProxy }`)() as any
}

function signal<T>(initial: T): any {
  let value = initial
  const read = () => value
  read._isSignal = true
  read.set = (next: T) => { value = next }
  return read
}

describe('signals proxy runtime boundary', () => {
  it('assembles the proxy fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_PROXY_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_PROXY_RUNTIME, first + 1)).toBe(-1)
  })

  it('unwraps reads and writes through nested model signals', () => {
    const { createAutoUnwrapProxy, createModelWriteProxy } = loadProxies()
    const name = signal('Ada')
    const form = signal({ name })

    expect(createAutoUnwrapProxy({ name }).name).toBe('Ada')
    createModelWriteProxy({ form }).form.name = 'Grace'
    expect(name()).toBe('Grace')
  })
})
