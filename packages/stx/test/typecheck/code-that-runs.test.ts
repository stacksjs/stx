/**
 * Errors the checker reported on templates that render correctly.
 *
 * Measured across stx's own components and a 620-file application, each of
 * these was a whole class of false positive rather than a one-off, so each is
 * pinned here with the real error it must NOT hide beside it. A checker that
 * invents errors gets muted, and a muted gate catches nothing - but one that
 * stops reporting real mistakes to get there is no better.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// Outside the repo, so this repository's tsconfig cannot reach the fixture.
async function check(source: string, files: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stx-runs-'))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files))
    await Bun.write(join(dir, name), content)
  const page = join(dir, 'page.stx')
  await Bun.write(page, source)
  const result = await typecheckStxFiles([page])
  expect(result.failure).toBeUndefined()
  return result.diagnostics
}

describe('a client block may declare a name the server block also declares', () => {
  // The runtime bridge leaves a client-owned top-level binding alone, so the
  // server's value never arrives under that name. 166 such errors in stx's
  // components alone, CodeBlock's `const code` among them.
  it('is not a redeclaration', async () => {
    const diagnostics = await check(`<script server>
export const code = 'server'
</script>
<script client>
const code = 1
console.log(code)
</script>
<div></div>`)
    expect(diagnostics.filter(d => d.code === 2451)).toEqual([])
  })

  it('still types a bridged name the client only reads', async () => {
    const diagnostics = await check(`<script server>
const title = 'server'
</script>
<script client>
const length: number = title.nope
</script>
<div></div>`)
    // Scraped bridge values are `any`, so reading one is allowed; what must not
    // happen is the name going missing.
    expect(diagnostics.filter(d => d.code === 2304)).toEqual([])
  })
})

describe('server-block engine bindings', () => {
  it('declares $bool with its real signature, and $uid', async () => {
    const diagnostics = await check(`<script server>
export const open = $bool($props.open, false)
export const id = $uid + '-panel'
</script>
<div id="{{ id }}">{{ open }}</div>`)
    expect(diagnostics).toEqual([])
  })

  it('rejects a misuse of $bool rather than accepting anything', async () => {
    const diagnostics = await check(`<script server>
export const open: string = $bool($props.open)
</script>
<div>{{ open }}</div>`)
    expect(diagnostics.map(d => d.code)).toContain(2322)
  })
})

describe('loop variables', () => {
  it('binds `@foreach(item in items)` as the runtime does', async () => {
    const diagnostics = await check(`<script server>
export const items = [{ title: 'a' }]
</script>
@foreach(item in items)
  <p>{{ item.title }}</p>
@endforeach`)
    expect(diagnostics).toEqual([])
  })

  it('types the item, so a misspelt field is still caught', async () => {
    const diagnostics = await check(`<script server>
export const items = [{ title: 'a' }]
</script>
@foreach(item in items)
  <p>{{ item.titel }}</p>
@endforeach`)
    expect(diagnostics.map(d => d.code)).toContain(2551)
  })

  it('binds a bare `@for(item of items)` head', async () => {
    const diagnostics = await check(`<script server>
export const items = ['a', 'b']
</script>
@for(item of items)
  <p>{{ item.toUpperCase() }}</p>
@endfor`)
    expect(diagnostics).toEqual([])
  })
})

describe('a guard that narrows through a const alias', () => {
  // The template buffer re-binds script names as parameters, which cut the
  // alias from what it tests. Every read under `@else` was "possibly null".
  it('narrows in the branch the alias rules out', async () => {
    const diagnostics = await check(`<script server>
const event = Math.random() > 0.5 ? { slug: 'x', status: 'live' } : null
const notFound = !event || event.status === 'draft'
</script>
@if (notFound)
  <p>Not found</p>
@else
  <a href="/events/{{ event.slug }}">go</a>
@endif`)
    expect(diagnostics).toEqual([])
  })

  it('still reports the read the alias does not guard', async () => {
    const diagnostics = await check(`<script server>
const event = Math.random() > 0.5 ? { slug: 'x', status: 'live' } : null
const notFound = !event || event.status === 'draft'
</script>
@if (notFound)
  <a href="/events/{{ event.slug }}">go</a>
@endif`)
    expect(diagnostics.map(d => d.code)).toContain(18047)
  })

  it('leaves an alias with a string literal intact', async () => {
    // The literal is blanked in the stripped text; reading that copy made the
    // line end in a bare `===`, and the alias was refused as a continuation.
    const diagnostics = await check(`<script server>
const user = Math.random() > 0.5 ? { role: 'admin', name: 'a' } : undefined
const isAdmin = user !== undefined && user.role === 'admin'
</script>
@if (isAdmin)
  <p>{{ user.name }}</p>
@endif`)
    expect(diagnostics).toEqual([])
  })
})

describe('a bare component event handler', () => {
  const component = {
    'components/Field.stx': `<script client>
const emit = defineEmits<{ blur: [event: FocusEvent] }>()
</script><input />`,
  }

  it('may ignore the payload, as JavaScript allows', async () => {
    const diagnostics = await check(`<script client>
function validate(): boolean { return true }
</script>
<Field @blur="validate" />`, component)
    expect(diagnostics.filter(d => d.blockKind === 'template')).toEqual([])
  })

  it('may not require a payload of another type', async () => {
    const diagnostics = await check(`<script client>
function validate(value: number): boolean { return value > 0 }
</script>
<Field @blur="validate" />`, component)
    expect(diagnostics.filter(d => d.blockKind === 'template')).toHaveLength(1)
  })
})
