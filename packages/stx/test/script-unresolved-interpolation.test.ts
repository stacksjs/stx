/**
 * A server value that is missing becomes `undefined` in a script, not a
 * mustache.
 *
 * Leaving `{{ }}` in place is right for HTML - the client runtime may bind it
 * later - and is the only possible wrong answer inside JavaScript, where
 * nothing ever re-reads a mustache. `const stepNumber = {{ stepNumber }};` is
 * a SyntaxError, and ONE syntax error takes the whole scoped IIFE down: every
 * handler it declared is never registered, so the component renders perfectly
 * and does nothing, with nothing logged. stacksjs/stx#1989.
 *
 * The narrow part of the fix is what counts as "a server value that is
 * missing". A script body can legitimately contain something mustache-shaped -
 * a regex matching stx's own markers is in this codebase - so the test is what
 * the author wrote, not what it evaluated to: an identifier or property path
 * is a server value, anything else is left exactly as it was.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { interpolateScriptExpressions } from '../src/expressions'

let warnings: string[]
let originalWarn: typeof console.warn

beforeEach(() => {
  warnings = []
  originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '))
  }
})

afterEach(() => {
  console.warn = originalWarn
})

/** A unique path per case, so the once-per-cause memo cannot cross tests. */
function uniquePath(): string {
  return `/tmp/stx-script-${crypto.randomUUID()}/Widget.stx`
}

/** Whether the emitted script is JavaScript at all. */
function parses(code: string): boolean {
  try {
    // eslint-disable-next-line no-new-func
    new Function(code)
    return true
  }
  catch {
    return false
  }
}

describe('an unresolved server value in a script body (#1989)', () => {
  it('becomes undefined, so the script still parses', () => {
    const emitted = interpolateScriptExpressions('const stepNumber = {{ stepNumber }};', {}, uniquePath())

    expect(emitted).toBe('const stepNumber = undefined;')
    expect(parses(emitted)).toBe(true)
  })

  it('was a SyntaxError before, which is the whole point', () => {
    // The thing being prevented, stated as an assertion rather than as prose.
    expect(parses('const stepNumber = {{ stepNumber }};')).toBe(false)
  })

  it('keeps every other statement in the script alive', () => {
    const emitted = interpolateScriptExpressions(
      'const n = {{ missing }};\nfunction onClick() { return n }',
      {},
      uniquePath(),
    )

    expect(parses(emitted)).toBe(true)
    expect(emitted).toContain('function onClick()')
  })

  it('says so, naming the file and what to do about it', () => {
    const file = uniquePath()

    interpolateScriptExpressions('const n = {{ missing }};', {}, file)

    const reported = warnings.filter(line => line.includes(file))

    expect(reported.length).toBe(1)
    expect(reported[0]).toContain('missing')
    expect(reported[0]).toContain('<script server>')
  })

  it('does not repeat itself for the same expression', () => {
    const file = uniquePath()

    for (let i = 0; i < 3; i++)
      interpolateScriptExpressions('const n = {{ missing }};', {}, file)

    expect(warnings.filter(line => line.includes(file)).length).toBe(1)
  })

  it('handles a property path, which is the other spelling of a prop', () => {
    const emitted = interpolateScriptExpressions('const n = {{ props.count }};', {}, uniquePath())

    expect(emitted).toBe('const n = undefined;')
  })

  it('does the same for the raw marker', () => {
    const emitted = interpolateScriptExpressions('const n = {!! missing !!};', {}, uniquePath())

    expect(emitted).toBe('const n = undefined;')
  })

  it('still resolves a value that exists', () => {
    const emitted = interpolateScriptExpressions('const n = {{ count }};', { count: 3 }, uniquePath())

    expect(emitted).toBe('const n = 3;')
    expect(warnings).toEqual([])
  })
})

describe('a mustache-shaped expression that is not a server value is left alone', () => {
  /*
   * The regex that broke if this fix were applied blindly. stx's own code
   * contains one, and rewriting a working script to fix a broken one is not a
   * trade worth making.
   */
  it('leaves a regex matching stx markers untouched', () => {
    const source = String.raw`const re = /\{\{\s*|\s*\}\}/g;`
    const emitted = interpolateScriptExpressions(source, {}, uniquePath())

    expect(emitted).toBe(source)
    expect(warnings).toEqual([])
  })

  it('leaves a call it cannot evaluate untouched', () => {
    const source = 'const n = {{ somethingWithArgs(1, 2) }};'

    expect(interpolateScriptExpressions(source, {}, uniquePath())).toBe(source)
  })

  it('still preserves a build-time placeholder', () => {
    const source = 'const t = {{ __TITLE__ }};'

    expect(interpolateScriptExpressions(source, {}, uniquePath())).toBe(source)
  })
})
