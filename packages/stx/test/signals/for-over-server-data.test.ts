/**
 * A `:for` over `<script server>` data renders its rows (stacksjs/stx#2051).
 *
 * It rendered zero. `:for` is expanded by the client runtime, against the
 * scope the client script declares, and a server-block const has never been in
 * that scope — so the list was silently empty, with one console warning that
 * guessed at signals.
 *
 * The framework already made this decision in the other direction:
 * `convertSignalLoopsToAttributes` leaves an `@foreach` server-side when its
 * iterable is server data, and converts it to a client `:for` when it is a
 * signal. The missing half was the author who writes `:for` directly. So the
 * two spellings of "iterate a list" now agree, which is the second suggestion
 * on the issue; the first (the warning that names the cause) shipped earlier.
 *
 * Narrow on purpose. Only an iterable whose ROOT identifier is a server
 * context key converts — the case that cannot work any other way. A literal, a
 * signal, and an unknown name all stay on the client, the last so a typo still
 * reaches the runtime warning instead of disappearing into a server loop.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const options = { ...defaultConfig, buildMode: 'serve', cache: false } as StxOptions

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, path.join(import.meta.dir, 'for-server.stx'), options, new Set<string>())
}

/** The markup, without the injected runtime and styles. */
function markup(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<link[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const SERVER = `<script server>
const rows = [{ id: 1, name: 'alpha' }, { id: 2, name: 'beta' }]
const groups = [{ label: 'g1', items: ['a', 'b'] }]
</script>
`

describe('a server array, in each spelling of the loop', () => {
  it('renders rows from :for on the element', async () => {
    const html = markup(await render(`${SERVER}<ul><li :for="row in rows" :key="row.id">{{ row.name }}</li></ul>`))
    expect(html).toContain('<li>alpha</li>')
    expect(html).toContain('<li>beta</li>')
  })

  it('renders rows from :for on a template wrapper', async () => {
    // The spelling the issue reported. Both were equally unexpanded, so
    // "use the element form instead" was never the fix.
    const html = markup(await render(`${SERVER}<ul><template :for="row in rows"><li>{{ row.name }}</li></template></ul>`))
    expect(html).toContain('<li>alpha</li>')
    expect(html).toContain('<li>beta</li>')
    // The template element itself renders nothing, so it is unwrapped.
    expect(html).not.toContain('<template')
  })

  it('agrees with @foreach over the same data', async () => {
    const viaFor = markup(await render(`${SERVER}<ul><li :for="row in rows">{{ row.name }}</li></ul>`))
    const viaForeach = markup(await render(`${SERVER}<ul>@foreach(rows as row)<li>{{ row.name }}</li>@endforeach</ul>`))
    expect(viaFor).toBe(viaForeach)
  })

  it('leaves no binding attribute behind', async () => {
    const html = markup(await render(`${SERVER}<ul><li :for="row in rows" :key="row.id">{{ row.name }}</li></ul>`))
    expect(html).not.toContain(':for=')
    expect(html).not.toContain(':key=')
    expect(html).not.toContain('{{')
  })

  it('binds the index when the loop asks for one', async () => {
    const html = markup(await render(`${SERVER}<ul><li :for="(row, i) in rows">{{ i }}:{{ row.name }}</li></ul>`))
    expect(html).toContain('<li>0:alpha</li>')
    expect(html).toContain('<li>1:beta</li>')
  })

  it('iterates a nested server loop over the outer binding', async () => {
    const html = markup(await render(
      `${SERVER}<ul><li :for="g in groups"><span :for="item in g.items">{{ item }}</span></li></ul>`,
    ))
    expect(html).toContain('<span>a</span><span>b</span>')
  })

  it('keeps other attributes on the repeated element', async () => {
    const html = markup(await render(`${SERVER}<ul><li :for="row in rows" class="row" data-k="x">{{ row.name }}</li></ul>`))
    expect(html).toContain('class="row"')
    expect(html).toContain('data-k="x"')
  })
})

describe('what must stay on the client', () => {
  it('a signal, which is the whole point of :for', async () => {
    const html = markup(await render(
      '<script client>\nconst rows = state([{ id: 1, name: \'a\' }])\n</script>\n<ul><li :for="row in rows" :key="row.id">x</li></ul>',
    ))
    expect(html).toContain(':for="row in rows"')
  })

  it('a called signal, the other spelling', async () => {
    const html = markup(await render(
      '<script client>\nconst rows = state([{ id: 1 }])\n</script>\n<ul><li :for="row in rows()">x</li></ul>',
    ))
    expect(html).toContain(':for="row in rows()"')
  })

  it('a literal, which already worked', async () => {
    // Converting this would move working markup to the server for no gain.
    const html = markup(await render(
      '<script client>\nconst n = state(1)\n</script>\n<ul><li :for="v in [1, 2]">x</li></ul>',
    ))
    expect(html).toContain(':for="v in [1, 2]"')
  })

  it('an unknown name, so a typo still reaches the runtime warning', async () => {
    const html = markup(await render(
      '<script client>\nconst n = state(1)\n</script>\n<ul><li :for="v in typoName">x</li></ul>',
    ))
    expect(html).toContain(':for="v in typoName"')
  })

  it('a signal that shadows a server name of its own', async () => {
    // Both scopes hold `rows`; the signal is what the author is iterating, so
    // the client keeps it and the server copy is not substituted underneath.
    const html = markup(await render(
      `${SERVER}<script client>\nconst rows = state([{ name: 'client' }])\n</script>\n<ul><li :for="row in rows">{{ row.name }}</li></ul>`,
    ))
    expect(html).toContain(':for="row in rows"')
    expect(html).not.toContain('alpha')
  })

  it('a page with no server context at all', async () => {
    const html = markup(await render('<ul><li :for="row in whatever">x</li></ul>'))
    expect(html).toContain(':for="row in whatever"')
  })
})
