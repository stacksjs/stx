import { describe, expect, it } from 'bun:test'
import { SIGNALS_PIPE_RUNTIME } from '../../src/client/signals-pipe-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadPipeRuntime(): Record<string, any> {
  const prelude = `
    const globalHelpers = { upper: value => String(value).toUpperCase() };
    function __stxCompileScoped(scope, extra, body) {
      const names = Object.keys(scope);
      const fn = new Function(...names, body);
      fn.__stxNames = names;
      return fn;
    }
    function __stxArgs(fn, scope) { return fn.__stxNames.map(name => scope[name]); }
  `
  return new Function(`${prelude}\n${SIGNALS_PIPE_RUNTIME}\nreturn { parsePipeExpression, executePipeExpression }`)() as any
}

describe('signals pipe runtime boundary', () => {
  it('assembles the pipe fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_PIPE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_PIPE_RUNTIME, first + 1)).toBe(-1)
  })

  it('parses and executes chained pipes without mistaking logical OR', () => {
    const { parsePipeExpression, executePipeExpression } = loadPipeRuntime()
    const parsed = parsePipeExpression('(name || fallback) | upper', {})

    expect(parsed.pipes).toEqual([{ name: 'upper', args: [] }])
    expect(executePipeExpression(parsed.valueExpr, parsed.pipes, { name: '', fallback: 'ada' })).toBe('ADA')
  })
})
