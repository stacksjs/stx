import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { declaredNames, parameterAnalysis, unboundNames } from '../../src/client-parameter-bindings'
import * as literals from '../../src/strip-literals'

let scanner: ReturnType<typeof spyOn> | undefined
afterEach(() => scanner?.mockRestore())

describe('shared client-script analysis (#2158)', () => {
  test('tokenizes once across consumers even when another script intervenes', () => {
    scanner = spyOn(literals, 'stripCommentsAndLiterals')
    const source = 'const cacheFixture = 1; function run(delay) { return delay(cacheFixture) }; delay(5)'
    const other = 'const otherCacheFixture = 2'
    expect(declaredNames(source).has('cacheFixture')).toBe(true)
    declaredNames(other)
    const analysis = parameterAnalysis(source)
    expect(analysis.shadows('delay', source.indexOf('return'))).toBe(true)
    expect(unboundNames(source, new Set(['delay', 'cacheFixture']))).toEqual(new Set(['delay']))
    expect(scanner).toHaveBeenCalledTimes(2)
  })

  test('source edits invalidate analysis and returned declaration sets cannot poison it', () => {
    const before = 'const editedCacheFixture = state(0)'
    const after = 'const editedCacheFixture = state => state(0)'
    declaredNames(before).add('state')
    expect(declaredNames(before).has('state')).toBe(false)
    expect(unboundNames(before, new Set(['state']))).toEqual(new Set(['state']))
    expect(unboundNames(after, new Set(['state']))).toEqual(new Set())
    expect(unboundNames(before, new Set(['state']))).toEqual(new Set(['state']))
  })

  test('evicts old scripts instead of retaining an unbounded source history', () => {
    scanner = spyOn(literals, 'stripCommentsAndLiterals')
    const first = 'const firstEvictionFixture = 0'
    declaredNames(first)
    for (let i = 0; i < 40; i++) declaredNames(`const evictionFixture${i} = ${i}`)
    scanner.mockClear()
    expect(declaredNames(first)).toEqual(new Set(['firstEvictionFixture']))
    expect(scanner).toHaveBeenCalledTimes(1)
  })

  test('oversized scripts remain correct without displacing the working set', () => {
    scanner = spyOn(literals, 'stripCommentsAndLiterals')
    const small = 'const retainedSmallFixture = 1'
    const large = `const oversizedFixture = 2; /*${'x'.repeat(600_000)}*/`
    declaredNames(small)
    expect(declaredNames(large)).toEqual(new Set(['oversizedFixture']))
    scanner.mockClear()
    declaredNames(small)
    expect(scanner).not.toHaveBeenCalled()
    declaredNames(large)
    expect(scanner).toHaveBeenCalledTimes(1)
  })
})
