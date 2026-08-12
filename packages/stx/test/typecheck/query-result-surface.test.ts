/**
 * `useQuery`'s declared shape is the shape it returns (stacksjs/stx#1929).
 *
 * `useFetch` and `useQuery` shared one `StxQueryResult`, and it described
 * neither of them properly. `useQuery` returns `isStale` and `invalidate` —
 * both real, both load-bearing for a revalidating view — and the interface
 * omitted them, so reading either was a type error on a value that was
 * genuinely there. Same class as `useEventListener` (#1923) and the `navigate`
 * options object (#1807): `stx.d.ts` describing the registry by hand and
 * drifting from `signals.ts`.
 *
 * Widening the shared interface would have swapped one drift for a worse one.
 * `useFetch` does NOT return `invalidate`, so declaring it there would
 * type-check a call to `undefined` — an error the checker exists to catch,
 * introduced by the fix for a missing declaration. Hence a base shape plus an
 * extension, and both directions are pinned here: the query surface must be
 * reachable, and the fetch surface must not have grown things it does not have.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dir = join(tmpdir(), `stx-query-surface-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string) {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('what useQuery declares', () => {
  it('exposes isStale and invalidate', async () => {
    const result = await check('query-surface.stx', [
      `const q = useQuery<{ id: number }[]>('/api/rows')`,
      `const stale: boolean = q.isStale()`,
      `void q.invalidate()`,
      `void stale`,
    ].join('\n'))

    expect(result.diagnostics).toHaveLength(0)
  })

  it('exposes isFetching on both primitives', async () => {
    const result = await check('is-fetching.stx', [
      `const q = useQuery<number[]>('/api/rows')`,
      `const f = useFetch<number[]>('/api/rows')`,
      `const a: boolean = q.isFetching()`,
      `const b: boolean = f.isFetching()`,
      `void a; void b`,
    ].join('\n'))

    expect(result.diagnostics).toHaveLength(0)
  })

  it('accepts a background refetch on both', async () => {
    const result = await check('background.stx', [
      `const q = useQuery<number[]>('/api/rows')`,
      `const f = useFetch<number[]>('/api/rows')`,
      `void q.refetch({ background: true })`,
      `void f.refetch({ background: true })`,
      `void q.invalidate({ background: true })`,
    ].join('\n'))

    expect(result.diagnostics).toHaveLength(0)
  })

  it('rejects a misspelled run option, so the type is really in play', async () => {
    // An `any` options bag would accept this and pin nothing.
    const result = await check('typo.stx', [
      `const q = useQuery<number[]>('/api/rows')`,
      `void q.refetch({ backround: true })`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('what useFetch does not declare', () => {
  it('rejects invalidate, which useFetch does not return', async () => {
    // The inverse mistake, and the worse one: a declaration for something that
    // is `undefined` at runtime turns a crash into a clean type-check.
    const result = await check('no-invalidate.stx', [
      `const f = useFetch<number[]>('/api/rows')`,
      `void f.invalidate()`,
    ].join('\n'))

    expect(result.diagnostics.map(d => d.code)).toContain(2339)
  })

  it('rejects isStale, likewise', async () => {
    const result = await check('no-stale.stx', [
      `const f = useFetch<number[]>('/api/rows')`,
      `void f.isStale()`,
    ].join('\n'))

    expect(result.diagnostics.map(d => d.code)).toContain(2339)
  })
})
