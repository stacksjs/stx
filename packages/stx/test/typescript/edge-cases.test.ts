/**
 * TypeScript stripping and CommonJS conversion edge case tests -
 * redistributed from bugs/ directory.
 *
 * Covers: stripTypeScript and convertToCommonJS bugs from discovered-bugs.ts.
 */
import { describe, expect, it } from 'bun:test'
import { stripTypeScript, convertToCommonJS } from '../../src/variable-extractor'

// =============================================================================
// 1. stripTypeScript complex generics (from discovered-bugs.ts)
// =============================================================================

describe('stripTypeScript complex generics', () => {
  it('BUG: should strip Record<string, any> from function params', () => {
    const result = stripTypeScript('function foo(x: Record<string, any>): void { return }')
    expect(result).not.toContain('any>')
    expect(result).not.toContain('Record')
  })

  it('BUG: should strip Map<string, number> from function params', () => {
    const result = stripTypeScript('function bar(m: Map<string, number>): void {}')
    expect(result).not.toContain('Map<')
    expect(result).not.toContain('number>')
  })

  it('BUG: should strip Promise<Array<string>> from function params', () => {
    const result = stripTypeScript('async function baz(p: Promise<Array<string>>): Promise<void> {}')
    expect(result).not.toContain('Promise<')
    expect(result).not.toContain('Array<')
  })

  it('BUG: should handle multiple params with generics', () => {
    const result = stripTypeScript('function multi(a: Map<string, any>, b: Set<number>): void {}')
    expect(result).not.toContain('Map<')
    expect(result).not.toContain('Set<')
    expect(result).toContain('function multi(a, b)')
  })
})

// =============================================================================
// 2. stripTypeScript additional edge cases (from discovered-bugs.ts)
// =============================================================================

describe('stripTypeScript additional edge cases', () => {
  it('should strip union types from declarations', () => {
    const r = stripTypeScript('const x: string | number = 42')
    expect(r.trim()).toBe('const x= 42')
  })

  it('should strip array types', () => {
    const r = stripTypeScript('const items: string[] = []')
    expect(r.trim()).toBe('const items= []')
  })

  it('should strip tuple types', () => {
    const r = stripTypeScript('const pair: [string, number] = ["a", 1]')
    expect(r.trim()).toBe('const pair= ["a", 1]')
  })

  it('BUG: should strip intersection types', () => {
    const r = stripTypeScript('const x: TypeA & TypeB = val')
    expect(r).not.toContain('TypeA')
    expect(r).not.toContain('TypeB')
  })

  it('BUG: should strip optional parameter marker', () => {
    const r = stripTypeScript('function foo(x?: string) {}')
    expect(r).toContain('function foo(x)')
    expect(r).not.toContain('?')
  })

  it('BUG: should strip readonly modifier', () => {
    const r = stripTypeScript('const arr: readonly string[] = []')
    expect(r).not.toContain('readonly')
  })

  it('angle bracket type assertions are a known limitation (ambiguous with JSX)', () => {
    const r = stripTypeScript('const x = <string>someValue')
    expect(typeof r).toBe('string')
  })

  it('BUG: should strip enum declarations', () => {
    const r = stripTypeScript('enum Color { Red, Green, Blue }')
    expect(r.trim()).not.toContain('enum')
  })

  it('BUG: should strip non-null assertion operator', () => {
    const r = stripTypeScript('const x = obj!.property')
    expect(r).not.toContain('!')
    expect(r).toContain('obj.property')
  })

  it('BUG: should strip satisfies keyword', () => {
    const r = stripTypeScript('const x = { a: 1 } satisfies Config')
    expect(r).not.toContain('satisfies')
  })
})

// =============================================================================
// 3. convertToCommonJS bugs (from discovered-bugs.ts)
// =============================================================================

describe('convertToCommonJS bugs', () => {
  it('BUG: should export class declarations', () => {
    const r = convertToCommonJS('class MyClass { constructor() {} }')
    expect(r).toContain('module.exports.MyClass')
  })

  it('BUG: should handle export default', () => {
    const r = convertToCommonJS('export default function greet() { return "hi" }')
    expect(r).toContain('module.exports.default')
  })

  it('should export async function declarations', () => {
    const r = convertToCommonJS('async function fetchData() { return [] }')
    expect(r).toContain('module.exports.fetchData')
  })

  it('should export arrow functions assigned to const', () => {
    const r = convertToCommonJS('const greet = (name) => `Hello ${name}`')
    expect(r).toContain('module.exports.greet')
  })

  it('should export all declarations', () => {
    const r = convertToCommonJS('const a = 1\nlet b = 2\nvar c = 3')
    expect(r).toContain('module.exports.a')
    expect(r).toContain('module.exports.b')
    expect(r).toContain('module.exports.c')
  })
})
