import { describe, expect, it } from 'bun:test'
import { SIGNALS_CLOAK_RUNTIME } from '../../src/client/signals-bootstrap-runtime'
import { SIGNALS_EXPRESSION_COMPILER_RUNTIME } from '../../src/client/signals-expression-compiler-runtime'
import { SIGNALS_FETCH_TRANSPORT_RUNTIME } from '../../src/client/signals-fetch-transport-runtime'
import { signalsReactiveCoreBootstrapRuntime } from '../../src/client/signals-reactive-core-bootstrap-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals reactive core bootstrap runtime boundary', () => {
  const fragment = signalsReactiveCoreBootstrapRuntime(
    SIGNALS_CLOAK_RUNTIME,
    SIGNALS_EXPRESSION_COMPILER_RUNTIME,
    SIGNALS_FETCH_TRANSPORT_RUNTIME,
  )

  it('assembles the reactive bootstrap fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(fragment)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
  })

  it('keeps effect state, devtools counters, and transport setup ordered', () => {
    expect(fragment).toContain('let activeEffect = null')
    expect(fragment).toContain('var __stxDevtoolsTracking = false')
    expect(fragment).toContain(SIGNALS_FETCH_TRANSPORT_RUNTIME)
    expect(fragment).toContain('let activeDisposers = null')
  })
})
