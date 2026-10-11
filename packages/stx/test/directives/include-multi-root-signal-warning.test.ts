/**
 * A partial that declares signals is scoped on its first element only.
 *
 * The runtime finds a partial's scope with
 * `document.querySelector('[data-stx-scope="id"]')`, and the id is stamped on
 * the partial's first element. Anything after that element at the top level is
 * outside it, so its bindings resolve against the scope around the include —
 * the layout's or the page's — where the partial's signals do not exist.
 *
 * The case that found it: a sidebar partial with an `<aside>` and, after it,
 * three dialogs gated by `:if` on the partial's own signals. The buttons in
 * the aside set the signals, and the dialogs never opened. No error, no
 * warning, a page that looked like it was waiting on data.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { resetUnscopedSignalWarnings, topLevelElements } from '../../src/includes'
import { processDirectives } from '../../src/process'

let dir = ''

const SCRIPT = `<script client>
const open = state(false)
</script>
`

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-multi-root-'))
  await Bun.write(path.join(dir, 'partials', 'two-roots.stx'), `${SCRIPT}<aside><button @click="open.set(true)">Open</button></aside>
<div :if="open"><p>Dialog</p></div>
`)
  await Bun.write(path.join(dir, 'partials', 'one-root.stx'), `${SCRIPT}<div>
  <aside><button @click="open.set(true)">Open</button></aside>
  <div :if="open"><p>Dialog</p></div>
</div>
<style>.x { color: red }</style>
`)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

afterEach(() => {
  resetUnscopedSignalWarnings()
})

async function warningsFor(partial: string, times = 1): Promise<string[]> {
  const warnings: string[] = []
  const realWarn = console.warn
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  try {
    for (let i = 0; i < times; i++) {
      await processDirectives(
        `<main>@include('${partial}')</main>`,
        {},
        path.join(dir, 'page.stx'),
        { ...defaultConfig, partialsDir: path.join(dir, 'partials'), componentsDir: dir } as any,
        new Set<string>(),
      )
    }
  }
  finally {
    console.warn = realWarn
  }
  return warnings.filter(w => w.includes('top-level elements'))
}

describe('a partial with signals and more than one root', () => {
  it('is warned about, naming the roots, once per file', async () => {
    const warnings = await warningsFor('two-roots', 3)
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain('two-roots.stx')
    expect(warnings[0]).toContain('<aside>, <div>')
  })

  it('is not, with one root and a trailing style', async () => {
    expect(await warningsFor('one-root')).toEqual([])
  })
})

describe('topLevelElements', () => {
  it('counts only the outermost elements', () => {
    expect(topLevelElements('<aside><div><br><img src="x"></div></aside>\n<div :if="a > b">x</div>')).toEqual(['aside', 'div'])
  })

  it('ignores scripts, styles, comments and interpolations', () => {
    expect(topLevelElements('<!-- <p> --><div>{{ a < b ? \'<i>\' : \'\' }}</div><style>p > i {}</style><script>if (a<b) x()</script>')).toEqual(['div'])
  })

  it('treats a self-closing component as an element that opens nothing', () => {
    expect(topLevelElements('<Icon name="x" /><span>a</span>')).toEqual(['Icon', 'span'])
  })
})
