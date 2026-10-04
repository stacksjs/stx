/**
 * `from 'stx'` resolves for the checker, because the framework accepts it.
 *
 * Inside a `.stx` script block `stx` is a VIRTUAL specifier: `client-script.ts`
 * treats `'stx'` and `'@stacksjs/stx'` alike and strips the import, handing the
 * names to the block as runtime globals. It is also the house spelling — 164
 * uses across `docs/` and `src/` against 126 of the scoped name — so it is what
 * an author copies out of the documentation.
 *
 * The checker did not know that and reported `Cannot find module 'stx'` on the
 * documented form. The interesting part is not the false error, it is what the
 * false error HID: an unresolved module is `any`, so every signature behind it
 * stopped being enforced. Correcting the specifier in one real app turned 18
 * "Cannot find module" errors into 36 genuine constraint errors that had been
 * invisible the whole time (stacksjs/stx#1917) — including the one that issue
 * is about.
 *
 * So the assertion that matters is not "no error". It is that the names behind
 * the specifier are the REAL ones, still capable of rejecting bad code. An alias
 * that resolved to `any` would silence the false error and keep the blindness.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

// Inside the repo, unlike the other typecheck fixtures: resolving
// `@stacksjs/stx` is the whole point, and that needs a node_modules to walk up
// to. A subdirectory of the package under test is the closest stand-in for an
// installed app.
const dir = join(import.meta.dir, `.tmp-specifier-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, source: string): Promise<Awaited<ReturnType<typeof typecheckStxFiles>>> {
  const file = join(dir, name)
  await Bun.write(file, source)
  return typecheckStxFiles([file], { templates: false })
}

describe('the `stx` specifier', () => {
  it('is not reported as a missing module', async () => {
    const result = await check('bare.stx', `<script server>
import { defineProps } from 'stx'
type P = { title: string }
const { title } = defineProps<P>()
</script>
<h1>{{ title }}</h1>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2307)
  })

  it('resolves to the real declarations, not to `any`', async () => {
    // The load-bearing assertion. `defineProps` constrains its type parameter,
    // so a primitive has to be rejected — if this passes, the module resolved to
    // `any` and every signature behind the specifier is unenforced again, which
    // is exactly the state that hid #1917.
    const result = await check('enforced.stx', `<script server>
import { defineProps } from 'stx'
const p = defineProps<string>()
</script>
<div>{{ p }}</div>`)

    expect(result.diagnostics.some(d => d.message.includes('does not satisfy the constraint'))).toBe(true)
  })

  it('treats the scoped name the same way', async () => {
    // Both spellings work at runtime, so neither may be the one that type-checks.
    const result = await check('scoped.stx', `<script server>
import { defineProps } from '@stacksjs/stx'
const p = defineProps<number>()
</script>
<div>{{ p }}</div>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2307)
    expect(result.diagnostics.some(d => d.message.includes('does not satisfy the constraint'))).toBe(true)
  })

  it('leaves a genuinely unknown module reported as missing', async () => {
    // The alias is one specifier, not a blanket "resolve anything". A typo in an
    // import is a real error and has to stay one.
    const result = await check('typo.stx', `<script server>
import { defineProps } from 'stxx'
const p = defineProps<{ a: string }>()
</script>
<div>{{ p }}</div>`)

    expect(result.diagnostics.map(d => d.code)).toContain(2307)
  })

  it('declares what a client block gets: the window.stx runtime, typed', async () => {
    // A client block's `from 'stx'` is stripped and destructured off
    // window.stx, so the module has to be that surface and type it the same
    // way as the auto-imported globals (stacksjs/stx#2028).
    const result = await check('client.stx', `<script client>
import { onMount, state, useQuery } from 'stx'
const count = state(0)
const wrong: string = count()
onMount(() => count.set(1))
useQuery<{ id: number }>('/api')
</script>
<div>{{ count }}</div>`)

    expect(result.diagnostics.map(d => d.code)).not.toContain(2307)
    expect(result.diagnostics.filter(d => d.code === 2322).map(d => d.line)).toEqual([4])
    expect(result.diagnostics.filter(d => d.code !== 2322)).toEqual([])
  })

  it('reports a name the runtime does not bind for that kind of block', async () => {
    // `useServerData` is the engine's, server side only: in a client block the
    // import is stripped and nothing on window.stx replaces it. `useQuery` is
    // the reverse - in a server block it becomes `await import('stx')`, which
    // does not resolve. Both type-check against a module that blessed the whole
    // package; both fail at runtime.
    const result = await check('wrong-side.stx', `<script server>
import { useQuery, withDefaults } from 'stx'
</script>
<script client>
import { onMount, useServerData } from 'stx'
</script>
<div></div>`)

    const surface = result.diagnostics.filter(d => d.code === 0 && d.category === 'error')
    expect(surface.map(d => [d.line, d.column, d.blockKind])).toEqual([
      [2, 10, 'server'],
      [5, 19, 'client'],
    ])
    expect(surface[0].message).toContain(`'useQuery' is not provided by 'stx' in a <script server> block`)
    expect(surface[1].message).toContain(`'useServerData' is not provided by 'stx' in a client <script> block`)
  })

  it('does not export the rest of @stacksjs/stx', async () => {
    // `useForm` is a real export of the package and nothing either script path
    // binds for `from 'stx'`.
    const result = await check('not-runtime.stx', `<script server>
import { useForm } from 'stx'
</script>
<div></div>`)

    expect(result.diagnostics.map(d => d.code)).toContain(2305)
  })
})
