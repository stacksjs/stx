/**
 * Memoised render stages still see an edit (stacksjs/stx#1945).
 *
 * #1945 is fixed by remembering the compiled artifacts of an unchanged render
 * instead of rebuilding them — the component island, the client bundle, the
 * transpiled server script, the page's CSS. That is only correct while every
 * memo can tell that its inputs changed, and the property it can break is the
 * one the dev server is built on: it deliberately holds no template cache, so
 * editing a file and refreshing the browser shows the edit without a restart
 * (CLAUDE.md, "Dev Server No-Cache"). A memo that outlives the edit turns that
 * into "restart the server to see your change", which reads as the framework
 * being broken rather than as a cache needing a key.
 *
 * Two shapes, and they invalidate for different reasons:
 *
 *   - the edited file is the one the key is computed FROM (a page, a
 *     component's own script). Content-keyed, so the key changes with it.
 *   - the edited file is one the artifact was BUILT from but is not in the key
 *     (a helper a client script imports). Those are recorded when the bundle is
 *     built and re-stat'ed on every hit — the same mechanism the on-disk bundle
 *     cache already used, which is why it is checked here rather than trusted.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderView } from '../src/build-views'
import { clearDevCaches } from '../src/caching'
import { extractAndStripCssImports } from '../src/client-script'

const made: string[] = []

afterEach(() => {
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

function app(): { dir: string, componentsDir: string, options: Record<string, unknown> } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-memo-'))
  made.push(dir)
  const componentsDir = path.join(dir, 'components')
  fs.mkdirSync(componentsDir, { recursive: true })
  return { dir, componentsDir, options: { componentsDir } }
}

/**
 * Write a file with an mtime strictly newer than anything already recorded.
 *
 * Invalidation is by mtime, and a same-millisecond rewrite is indistinguishable
 * from no edit at all on a coarse filesystem clock. A real editor never lands
 * inside the same tick as the render before it; this makes the test agree with
 * that rather than depending on how fast the machine is.
 */
function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
  const future = new Date(Date.now() + 2000)
  fs.utimesSync(file, future, future)
}

describe('an edit to the rendered page', () => {
  it('is not hidden by the memo', async () => {
    const { dir, options } = app()
    const page = path.join(dir, 'page.stx')

    write(page, `<script server>\nconst title = 'first'\n</script>\n<h1>{{ title }}</h1>`)
    expect(await renderView(page, {}, options)).toContain('first')

    write(page, `<script server>\nconst title = 'second'\n</script>\n<h1>{{ title }}</h1>`)
    expect(await renderView(page, {}, options)).toContain('second')
  })
})

describe('an edit to a component', () => {
  it('is not hidden by the island memo', async () => {
    const { dir, componentsDir, options } = app()
    const page = path.join(dir, 'page.stx')
    const component = path.join(componentsDir, 'Widget.stx')
    write(page, `<div><Widget /></div>`)

    write(component, `<script client>\nconst label = state('before')\n</script>\n<p :text="label()"></p>`)
    expect(await renderView(page, {}, options)).toContain('before')

    write(component, `<script client>\nconst label = state('after')\n</script>\n<p :text="label()"></p>`)
    expect(await renderView(page, {}, options)).toContain('after')
  })

  it('is visible through the path a dev server actually takes', async () => {
    // The dev server answers an edit with clearDevCaches() from its file
    // watcher, because component CONTENT has been cached by path since long
    // before any of this, with no mtime check (utils.ts, componentsCache).
    // This walks that whole path — edit, clear, re-render — and checks the
    // markup as well as the script, which the case above does not.
    //
    // It is a smoke test of the real sequence, not a test of the memos: every
    // memo here is keyed on content or re-stats its dependencies, so each one
    // already invalidates itself and this still passes with clearRenderMemos()
    // removed. That call is there to release the memory on a rebuild, and to
    // keep the memos honest if a future one is ever keyed on something less
    // self-evident.
    const { dir, componentsDir, options } = app()
    const page = path.join(dir, 'page.stx')
    const component = path.join(componentsDir, 'Markup.stx')
    write(page, `<div><Markup /></div>`)

    write(component, `<script client>\nconst n = state('ORIGINAL')\n</script>\n<p :text="n()">original markup</p>`)
    expect(await renderView(page, {}, options)).toContain('ORIGINAL')

    write(component, `<script client>\nconst n = state('EDITED')\n</script>\n<p :text="n()">edited markup</p>`)
    clearDevCaches()
    const second = await renderView(page, {}, options)
    expect(second).toContain('EDITED')
    expect(second).not.toContain('ORIGINAL')
    expect(second).toContain('edited markup')
  })
})

describe('an edit to a helper a client script imports', () => {
  it('is not hidden by the bundle memo', async () => {
    // The helper is not in any memo key — it is not known until Bun.build has
    // resolved it. It is recorded as a dependency and re-stat'ed on every hit,
    // and this is the test that the recording actually happens: if it did not,
    // the first render's bundle would be served forever.
    const { dir, componentsDir, options } = app()
    const page = path.join(dir, 'page.stx')
    const component = path.join(componentsDir, 'Imports.stx')
    const helper = path.join(dir, 'helper.ts')
    write(page, `<div><Imports /></div>`)
    write(component, `<script client>\nimport { greeting } from '../helper'\nconst label = state(greeting)\n</script>\n<p :text="label()"></p>`)

    write(helper, `export const greeting = 'HELPER_BEFORE'\n`)
    expect(await renderView(page, {}, options)).toContain('HELPER_BEFORE')

    write(helper, `export const greeting = 'HELPER_AFTER'\n`)
    const second = await renderView(page, {}, options)
    expect(second).toContain('HELPER_AFTER')
    expect(second).not.toContain('HELPER_BEFORE')
  })
})

describe('a vendor CSS import that does not resolve', () => {
  it('is reported, so the island is not remembered', async () => {
    // What the island memo needs in order to decline. A resolution failure is
    // otherwise invisible in the result — the import is stripped either way
    // and `styles` simply has one fewer entry — and the file that is missing
    // cannot be recorded as a dependency, because it is not there to stat. An
    // island built from it would be remembered with nothing able to
    // invalidate it, so creating the stylesheet (or installing the package)
    // would never take effect until the process restarted.
    const { dir } = app()
    const component = path.join(dir, 'Styled.stx')
    write(component, 'placeholder')

    const missing = extractAndStripCssImports(`import './theme.css'\nconst n = 1\n`, {
      filePath: component,
      projectRoot: dir,
    })
    expect(missing.unresolved).toEqual(['./theme.css'])
    expect(missing.styles).toHaveLength(0)

    // And a resolvable one reports nothing, so that island IS remembered.
    write(path.join(dir, 'theme.css'), `.sentinel { color: red }\n`)
    const found = extractAndStripCssImports(`import './theme.css'\nconst n = 1\n`, {
      filePath: component,
      projectRoot: dir,
    })
    expect(found.unresolved).toEqual([])
    expect(found.styles.map(s => s.source)).toEqual(['./theme.css'])
  })
})

describe('the memo itself', () => {
  it('does not merge two components that differ only in file', async () => {
    // Same script text, two files. Keyed on content alone they would share one
    // island — and the island carries the component's own identity.
    const { dir, componentsDir, options } = app()
    const page = path.join(dir, 'page.stx')
    const script = `<script client>\nconst n = state(1)\n</script>\n`
    write(path.join(componentsDir, 'Alpha.stx'), `${script}<p class="alpha">a</p>`)
    write(path.join(componentsDir, 'Beta.stx'), `${script}<p class="beta">b</p>`)
    write(page, `<div><Alpha /><Beta /></div>`)

    const html = await renderView(page, {}, options)

    expect(html).toContain('class="alpha"')
    expect(html).toContain('class="beta"')
    // The page carries a scope of its own, so this asserts what matters: the
    // two components did not collapse onto one id.
    const scopes = [...html.matchAll(/data-stx-scope="(stx_(?:alpha|beta)_[^"]+)"/g)].map(m => m[1])
    expect(scopes).toHaveLength(2)
    expect(new Set(scopes).size).toBe(2)
  })
})
