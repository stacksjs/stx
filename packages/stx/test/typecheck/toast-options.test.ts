/**
 * The toast surface is typed the way it is implemented (stacksjs/stx#1932).
 *
 * `title`, `id` and `dark` all shipped in the runtime for #1913 and none of them
 * reached `stx.d.ts`, so the feature built to unblock a migration was
 * unreachable from any typechecked call site — `stx typecheck` rejected the
 * exact snippet #1913 was closed with. `dismiss` is the other half: the runtime
 * branches on `typeof id === 'string'` to look up `[data-stx-toast-key]`, which
 * is the whole point of replace-by-id, and the declaration accepted `number`
 * only.
 *
 * Third instance of one failure: `stx.d.ts` describes the runtime by hand and
 * falls behind it. `useEventListener` (#1923) was the same shape, and
 * `StxQueryResult` (#1929) was too. The companion to this file is
 * `test/signals/toast-declaration-drift.test.ts`, which reads the option names
 * out of the runtime rather than restating them — a list nobody maintains cannot
 * fall behind.
 *
 * What is asserted here is the call sites an author writes. A declaration that
 * merely stopped erroring would satisfy that with `options?: any`, so the last
 * test checks a typo is still rejected: if it is not, the type resolved to
 * something that enforces nothing and the drift is back with a passing test.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dir = join(tmpdir(), `stx-toast-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string) {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('the snippet #1913 was closed with', () => {
  it('type-checks', async () => {
    const result = await check('repro.stx', [
      `toast.success('Post published.', { title: 'Published', id: 'publish' })`,
      `toast.dismiss('publish')`,
      `toast.error('Nope.', { duration: 12000 })`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })
})

describe('every option the runtime reads', () => {
  it('accepts title', async () => {
    const result = await check('title.stx', `toast.info('Body', { title: 'Heading' })`)
    expect(result.diagnostics).toEqual([])
  })

  it('accepts id as a string or a number', async () => {
    // `String(opts.id)` in the runtime, so both are meaningful.
    const result = await check('id.stx', [
      `toast.info('a', { id: 'publish' })`,
      `toast.info('b', { id: 7 })`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts dark', async () => {
    const result = await check('dark.stx', `toast.warning('a', { dark: true })`)
    expect(result.diagnostics).toEqual([])
  })

  it('accepts duration, which was the one that was declared', async () => {
    const result = await check('duration.stx', `toast.error('a', { duration: 0 })`)
    expect(result.diagnostics).toEqual([])
  })
})

describe('dismiss', () => {
  it('takes the semantic key, the numeric handle, or nothing', async () => {
    const result = await check('dismiss.stx', [
      `const handle: number = toast.success('a', { id: 'publish' })`,
      `toast.dismiss('publish')`,
      `toast.dismiss(handle)`,
      `toast.dismiss()`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })
})

describe('the declaration still enforces something', () => {
  it('rejects an option the runtime does not read', async () => {
    // The assertion that makes the rest meaningful. `options?: any` would let
    // every test above pass while restoring exactly the blindness #1917 was
    // about — an unchecked bag looks identical to a correct one until you
    // misspell something.
    const result = await check('typo.stx', `toast.success('a', { titel: 'Heading' })`)

    // 2353 "unknown property", or 2561 when tsc can suggest the real name —
    // which it can precisely because `title` is now declared.
    const codes = result.diagnostics.map(d => d.code)
    expect(codes.includes(2353) || codes.includes(2561)).toBe(true)
    expect(result.diagnostics[0].message).toContain('title')
  })

  it('still rejects a wrong value type', async () => {
    const result = await check('wrong-type.stx', `toast.success('a', { duration: 'soon' })`)

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})
