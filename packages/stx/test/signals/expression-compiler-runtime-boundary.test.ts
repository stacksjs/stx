import { describe, expect, it } from 'bun:test'
import { SIGNALS_EXPRESSION_COMPILER_RUNTIME } from '../../src/client/signals-expression-compiler-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals expression compiler runtime boundary', () => {
  it('assembles the compiler cache fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_EXPRESSION_COMPILER_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_EXPRESSION_COMPILER_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps compilation, identifier selection, and argument mapping together', () => {
    expect(SIGNALS_EXPRESSION_COMPILER_RUNTIME).toContain('function __stxCompile(')
    expect(SIGNALS_EXPRESSION_COMPILER_RUNTIME).toContain('function __stxCompileScoped')
    expect(SIGNALS_EXPRESSION_COMPILER_RUNTIME).toContain('function __stxArgs')
  })
})
