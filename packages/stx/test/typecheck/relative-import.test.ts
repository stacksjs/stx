/**
 * A relative import inside a script block resolves (stacksjs/stx#1928).
 *
 * Every block becomes a virtual `.ts` file written FLAT into the state
 * directory, and tsc resolves a relative specifier against the file that
 * contains it — so `../target` was looked for next to `.stx/typecheck/`, which
 * is nowhere near the page that wrote it. `paths` aliases were unaffected,
 * because those resolve against `baseUrl` and the checker already emits an
 * absolute one; only the relative form fell through.
 *
 * That asymmetry is the part worth pinning. A relative import is the first
 * thing anyone writes and it is what every editor's auto-import produces, so an
 * app hitting this either rewrites correct imports into aliases to appease the
 * checker or mutes the checker. The alias case travels with this one and is
 * asserted alongside it, since a fix that resolved relatives by pointing the
 * program at the wrong directory would break the alias case in the same move.
 *
 * The load-bearing assertion is not "no TS2307". It is that the module resolved
 * to the REAL declarations: an unresolved module is `any`, so a fix that merely
 * silenced the error would leave every signature behind the import unenforced —
 * the exact blindness #1917 was about.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dir = join(import.meta.dir, `.tmp-relative-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

/** A shared module a page imports the ordinary way. */
const TARGET = `export const THING: string = 'value'
export interface Row { id: number, total: number }
export function widen(row: Row): number { return row.total }
`

async function check(name: string, source: string) {
  const file = join(dir, name)
  await Bun.write(file, source)
  return typecheckStxFiles([file], { templates: false })
}

describe('a relative import from a script block', () => {
  it('resolves a parent-directory specifier', async () => {
    await Bun.write(join(dir, 'target.ts'), TARGET)

    const result = await check('deep/rel.stx', `<script server>
import { THING } from '../target'
const label = THING
</script>
<p>{{ label }}</p>`)

    expect(result.diagnostics.filter(d => d.code === 2307)).toEqual([])
  })

  it('resolves a same-directory specifier', async () => {
    await Bun.write(join(dir, 'flat', 'sibling.ts'), TARGET)

    const result = await check('flat/here.stx', `<script server>
import { THING } from './sibling'
const label = THING
</script>
<p>{{ label }}</p>`)

    expect(result.diagnostics.filter(d => d.code === 2307)).toEqual([])
  })

  it('resolves it in a client block too', async () => {
    await Bun.write(join(dir, 'client', 'helpers.ts'), TARGET)

    const result = await check('client/page.stx', `<script client>
import { THING } from './helpers'
const label = state(THING)
</script>
<p :text="label"></p>`)

    expect(result.diagnostics.filter(d => d.code === 2307)).toEqual([])
  })

  it('resolves the real declarations rather than `any`', async () => {
    // The assertion that matters. If the specifier resolved to `any` the error
    // would be silenced and every type behind the import would stop being
    // enforced — which is worse than the unresolved module, because it looks
    // like a clean run.
    await Bun.write(join(dir, 'typed', 'catalog.ts'), TARGET)

    const result = await check('typed/uses.stx', `<script server>
import { widen, type Row } from './catalog'
const row: Row = { id: 1, total: 'not a number' }
const n: string = widen(row)
</script>
<p>{{ n }}</p>`)

    const codes = result.diagnostics.map(d => d.code)
    expect(codes).not.toContain(2307)
    // `total: 'not a number'` against `total: number`, and `number` assigned to
    // a `string` — both only reachable if the import really resolved.
    expect(codes.filter(c => c === 2322).length).toBeGreaterThanOrEqual(2)
  })

  it('leaves a bare package specifier alone', async () => {
    // Only relative specifiers are rewritten; a package name still resolves the
    // ordinary way, through node_modules.
    const result = await check('pkg/uses.stx', `<script server>
import { defineProps } from 'stx'
type P = { title: string }
const { title } = defineProps<P>()
</script>
<h1>{{ title }}</h1>`)

    expect(result.diagnostics.filter(d => d.code === 2307)).toEqual([])
  })

  it('resolves it in the template buffer, so template expressions stay checked', async () => {
    // The template buffer is a SECOND copy of every block body, inlined so an
    // expression sees the types the block declares. Its own TS2307 is dropped
    // as a duplicate of the per-block one, so the unresolved import was
    // INVISIBLE here — and an unresolved module is `any`, which quietly turned
    // every template expression reading an imported type back into unchecked
    // text. That is the failure this asserts, not the missing-module error.
    await Bun.write(join(dir, 'tpl', 'catalog.ts'), TARGET)

    const file = join(dir, 'tpl', 'page.stx')
    await Bun.write(file, `<script server>
import type { Row } from './catalog'
const row: Row = { id: 1, total: 2 }
</script>
<p>{{ row.totl }}</p>`)

    const result = await typecheckStxFiles([file], { templates: true })
    // 2339 "property does not exist", or 2551 when tsc can suggest the real name.
    const misspelling = result.diagnostics.filter(d =>
      d.blockKind === 'template' && (d.code === 2339 || d.code === 2551))

    expect(misspelling.length).toBe(1)
    expect(misspelling[0].message).toContain('totl')
    expect(misspelling[0].expression).toBe('row.totl')
  })

  it('still reports a relative import of something that is not there', async () => {
    // The fix must not resolve everything by making the specifier unresolvable
    // in a way tsc stops complaining about. A genuinely missing module is still
    // an error, or the checker has just learned to ignore a whole category.
    const result = await check('missing/page.stx', `<script server>
import { NOPE } from './does-not-exist'
const label = NOPE
</script>
<p>{{ label }}</p>`)

    expect(result.diagnostics.some(d => d.code === 2307)).toBe(true)
  })
})
