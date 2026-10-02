/**
 * An installed component package answers to a bare tag (stacksjs/stx#2011).
 *
 * `@stacksjs/components` ships `./stx-plugin`, which registers `src/ui` and
 * `src/components` as component roots - and it worked, for anyone who knew to
 * write `plugins: ['@stacksjs/components/stx-plugin']` in their config.
 * Nothing said so. The guide shows `<Dialog :open="…">` with no import and no
 * plugin entry, and a reader following it got an HTML comment where the modal
 * should be, because resolution searched project directories only.
 *
 * `Badge`, `Card`, `Avatar`, `Image` and `Video` appeared to work, which made
 * it harder to spot: they are also in `@stacksjs/defaults`, so the components
 * a reader tries first resolve and the rest do not. `Dialog` is the one that
 * hurt - the documented way to build a modal, in the non-resolving group, and
 * an app could ship `<Dialog :open="…">` with nothing where the modal went.
 *
 * Rendered through a real project directory and the real config loader rather
 * than a hand-built options object, because the whole bug lived in what the
 * loader did or did not put on the config.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const REPO = path.resolve(import.meta.dir, '../../../..')
const ROOT = path.join(import.meta.dir, '.tmp-2011')

/** A project directory with stx.config.ts and the repo's node_modules. */
function project(name: string, config: string, files: Record<string, string> = {}): string {
  const dir = path.join(ROOT, name)
  mkdirSync(path.join(dir, 'resources/views'), { recursive: true })
  writeFileSync(path.join(dir, 'stx.config.ts'), config)
  try {
    symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'))
  }
  catch {
    // Already linked from a previous run in the same process.
  }
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    writeFileSync(path.join(dir, rel), body)
  }
  return dir
}

async function render(dir: string, template: string): Promise<string> {
  const config = await loadStxConfig(dir)
  return processDirectives(template, {}, path.join(dir, 'resources/views/index.stx'), config as any, new Set())
}

/** The five that were in the non-resolving group, and how each shows up. */
const PREVIOUSLY_BROKEN: Array<[string, RegExp]> = [
  ['Dialog', /role="dialog"|data-stx-dialog/],
  ['Spinner', /animate-spin/],
  ['Switch', /role="switch"|data-stx-switch/],
  ['Progress', /role="progressbar"|data-stx-progress/],
  ['Skeleton', /animate-pulse|data-stx-skeleton/],
]

beforeAll(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('#2011 — an installed component package resolves by bare tag', () => {
  it('renders every component that used to need a plugin entry', async () => {
    const dir = project('bare', `export default { root: 'resources', pagesDir: 'views' }\n`)
    const tags = PREVIOUSLY_BROKEN.map(([name]) => `<${name} />`).join('')
    const html = await render(dir, `<div>${tags}</div>`)

    for (const [name, marker] of PREVIOUSLY_BROKEN)
      expect(marker.test(html), `<${name} /> did not render`).toBe(true)

    // The quiet failure from 988a0e627f, which is what a reader saw instead.
    expect(html).not.toContain('could not be resolved')
  })

  /*
   * The ordering that makes this safe to do without being asked. An installed
   * package is a DEFAULT: a component the app wrote by the same name has to
   * win, or adding a dependency would silently restyle the app.
   */
  it('lets a component the project wrote win by name', async () => {
    const dir = project(
      'override',
      `export default { root: 'resources', pagesDir: 'views' }\n`,
      { 'resources/components/Spinner.stx': '<div data-mine>mine</div>' },
    )
    const html = await render(dir, '<div><Spinner /><Dialog :open="true" /></div>')

    expect(html).toContain('data-mine')
    expect(html).not.toContain('animate-spin')
    // …while the package still supplies what the project did not write.
    expect(/role="dialog"|data-stx-dialog/.test(html)).toBe(true)
  })

  it('opts out entirely on an empty componentPackages', async () => {
    const dir = project('optout', `export default { root: 'resources', pagesDir: 'views', componentPackages: [] }\n`)
    const html = await render(dir, '<div><Dialog :open="true" /></div>')

    expect(html).toContain('could not be resolved')
  })

  /*
   * Listing the plugin by hand still works and must not register it twice -
   * the component dirs are pushed into one array, and a duplicate would make
   * every resolution search the same two directories a second time.
   */
  it('does not double-register a plugin the config already lists', async () => {
    const dir = project(
      'listed',
      `export default { root: 'resources', pagesDir: 'views', plugins: ['@stacksjs/components/stx-plugin'] }\n`,
    )
    const config = await loadStxConfig(dir) as any
    const dirs: string[] = config._pluginComponentDirs ?? []

    expect(dirs.length).toBe(new Set(dirs).size)
    expect(dirs.some(d => d.endsWith(path.join('src', 'ui')))).toBe(true)
  })

  /*
   * Outside the repository on purpose. `require.resolve` walks UP the directory
   * tree, so a project nested anywhere under this checkout finds the hoisted
   * install and the package is never actually absent - this test asserted
   * `Array.isArray(...)` on a path that always resolved, which is a test that
   * checks nothing.
   */
  it('says nothing and breaks nothing when the package is absent', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stx-2011-nodeps-'))
    try {
      mkdirSync(path.join(dir, 'resources/views'), { recursive: true })
      writeFileSync(path.join(dir, 'stx.config.ts'), `export default { root: 'resources', pagesDir: 'views' }\n`)
      const config = await loadStxConfig(dir) as any

      // Nothing registered, nothing thrown, and no warning: an app that does
      // not depend on the package should not hear about it.
      expect(config._pluginComponentDirs ?? []).toEqual([])

      const html = await processDirectives(
        '<div><Dialog :open="true" /></div>',
        {},
        path.join(dir, 'resources/views/index.stx'),
        config,
        new Set(),
      )

      expect(html).toContain('could not be resolved')
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
