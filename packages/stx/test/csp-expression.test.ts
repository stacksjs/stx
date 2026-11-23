import { describe, expect, it } from 'bun:test'
import { compileCspExpression } from '../src/csp-expression'

function compiled(body: string, values: Record<string, unknown> = {}, args: unknown[] = []) {
  const entry = new Function(`return (${compileCspExpression(body)})`)()
  const scope = new Proxy(values, { get: (target, name: string) => name in target ? target[name] : entry.globals[name].get(), set: (target, name: string, value) => { if (name in target) target[name] = value; else entry.globals[name].set(value); return true } })
  return entry.run.call(globalThis, scope, args, (name: string) => name in values ? typeof values[name] : entry.globals[name].type())
}

describe('CSP expression generation', () => {
  it('respects lexical bindings, destructuring, shorthand and globals', () => {
    expect(compiled('return rows.map(({x}, i) => ({x, total: x + i + offset, n: Math.max(x, 2)}))', { rows: [{ x: 1 }], offset: 4 })).toEqual([{ x: 1, total: 5, n: 2 }])
    expect(compiled('const x = 8; { let x = 9; } return x + outside', { outside: 2 })).toBe(10)
  })
  it('keeps unresolved names lazy and typeof safe', () => {
    expect(compiled('return false && missing')).toBe(false)
    expect(compiled('return typeof __missing_csp_name__')).toBe('undefined')
    expect(() => compiled('return __missing_csp_name__')).toThrow()
    expect(compiled('return globalThis === this')).toBe(true)
  })
  it('preserves unbound calls, arguments and nested function arguments', () => {
    expect(compiled('return f()', { f: function (this: unknown) { return this === undefined } })).toBe(true)
    expect(compiled('return (() => arguments[0])() + (function(){return arguments[0]})(3)', {}, [7])).toBe(10)
  })
  it('writes assignments through scope without rewriting strings, keys or local names', () => {
    const scope = { count: 1 }
    expect(compiled('count += 2; return {count, text: "count", local: ((count) => count)(9)}', scope)).toEqual({ count: 3, text: 'count', local: 9 })
    expect(scope.count).toBe(3)
    expect(compiled('({count = 4} = {}); return count', scope)).toBe(4)
    expect(compiled('return {arguments}', {}, [1])).toEqual({ arguments: [1] })
  })
  it('rejects runtime code compilation', () => {
    expect(() => compileCspExpression('return eval(code)')).toThrow('eval')
    expect(() => compileCspExpression('return new Function(code)')).toThrow('Function')
  })
})
