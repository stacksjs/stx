import { afterEach, describe, expect, it } from 'bun:test'
import { transpileTypeScript } from '../src/utils'

/**
 * `transpileTypeScript` memoises its output. That is only sound because the
 * result map hangs off the pooled TRANSPILER, and the pool keys on the full
 * options -- including `define`, which bakes STX_PUBLIC_* env values into the
 * output. A cache keyed on the source alone would keep serving a value from an
 * env that no longer holds.
 *
 * The env case below was checked against exactly that broken cache before being
 * kept: keyed on source alone, it fails.
 */
describe('transpileTypeScript memo', () => {
  const KEY = 'STX_PUBLIC_MEMO_PROBE'

  afterEach(() => {
    delete process.env[KEY]
  })

  it('returns the same output for the same source', () => {
    const code = 'const n: number = 1; export const doubled = n * 2'
    expect(transpileTypeScript(code)).toBe(transpileTypeScript(code))
  })

  it('does not serve output baked with an env value that has since changed', () => {
    const code = `const target: string = import.meta.env.${KEY}; console.info(target)`

    process.env[KEY] = 'first-value'
    const first = transpileTypeScript(code)
    expect(first).toContain('first-value')

    process.env[KEY] = 'second-value'
    const second = transpileTypeScript(code)
    expect(second).toContain('second-value')
    expect(second).not.toContain('first-value')
  })

  it('restores template expressions identically on a cache hit', () => {
    const code = 'const label: string = "{{ user.name }}"; const raw = "{!! html !!}"'
    const first = transpileTypeScript(code)
    const second = transpileTypeScript(code)

    expect(first).toContain('{{ user.name }}')
    expect(first).toContain('{!! html !!}')
    expect(second).toBe(first)
  })

  it('still strips type annotations on a miss after many distinct sources', () => {
    // Push well past the entry cap so eviction runs, then check a fresh source
    // is transpiled rather than answered from a neighbour's entry.
    for (let i = 0; i < 300; i++)
      transpileTypeScript(`const v${i}: number = ${i}`)

    const out = transpileTypeScript('const fresh: string = "ok"; export { fresh }')
    expect(out).not.toContain(': string')
    expect(out).toContain('"ok"')
  })
})
