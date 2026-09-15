import { describe, expect, it } from 'bun:test'
import { extractVariables } from '../../src/variable-extractor'

const fixture = '/tmp/stx-server-script-compile-cache.stx'

describe('compiled server script reuse', () => {
  it('executes the script again on every call instead of caching its result', async () => {
    let calls = 0
    const script = 'export const value = bump()'
    const first: Record<string, unknown> = { bump: () => ++calls }
    const second: Record<string, unknown> = { bump: () => ++calls }

    await extractVariables(script, first, fixture)
    await extractVariables(script, second, fixture)

    expect([first.value, second.value, calls]).toEqual([1, 2, 2])
  })

  it('keys the compiled code by ordered parameter names', async () => {
    const script = 'export const value = a * 10 + b'
    const first: Record<string, unknown> = { a: 1, b: 2 }
    const second: Record<string, unknown> = { b: 3, a: 4 }

    await extractVariables(script, first, fixture)
    await extractVariables(script, second, fixture)

    expect([first.value, second.value]).toEqual([12, 43])
  })

  it('compiles changed source instead of reusing the old function', async () => {
    const first: Record<string, unknown> = { number: 2 }
    const second: Record<string, unknown> = { number: 2 }

    await extractVariables('export const value = number + 1', first, fixture)
    await extractVariables('export const value = number + 2', second, fixture)

    expect([first.value, second.value]).toEqual([3, 4])
  })
})
