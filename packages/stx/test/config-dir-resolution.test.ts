/**
 * Directory resolution probes the right tree, and says so when it misses
 * (stacksjs/stx#1792 part one item 8 / part two P1).
 *
 * Two defects, one visible symptom.
 *
 * 1. `root` is INFERRED from filesystem existence, and the probe read
 *    `process.cwd()` rather than the cwd the caller passed — even though
 *    `loadStxConfig` computes an `effectiveCwd` for exactly this reason and its
 *    own docstring says the parameter exists so `stx <app-dir>` invoked from
 *    outside the app does not read a parent's config. So running the dev server
 *    against another directory auto-detected against the WRONG tree.
 *
 * 2. Directory keys are prefixed with `root`, so a value that already contains
 *    it gets it twice — `componentsDir: 'resources/components'` under an
 *    inferred `root: 'resources'` becomes `resources/resources/components`.
 *    Components and layouts then fail SILENTLY: the lookup misses and the tag
 *    renders as-is. Six separate findings in the reporting audit trace back to
 *    one unnoticed config line.
 *
 * The doubling was left alone here originally — un-prefixing is a breaking
 * change to how every consumer resolves paths, and belonged in its own change.
 * That change is #1851: prefixing is now idempotent, so the assertions below
 * expect the un-doubled path. What this file still pins is the diagnostic.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadStxConfig } from '../src/config'

let root: string
let warnings: string[] = []
const realWarn = console.warn

function captureWarnings() {
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
}

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-cfg-'))

  // A Stacks-shaped app: resources/views + resources/layouts is what triggers
  // the root inference.
  for (const d of ['resources/views', 'resources/layouts', 'resources/components', 'resources/partials'])
    fs.mkdirSync(path.join(root, 'stacksy', d), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'stacksy', 'stx.config.ts'),
    `export default { componentsDir: 'resources/components', layoutsDir: 'resources/layouts', partialsDir: 'resources/partials' }\n`,
  )

  // A second Stacks-shaped app, used only by the warning test: loadStxConfig
  // caches per cwd and warns once per load, so reusing a directory another test
  // already loaded would find the warning already spent.
  for (const d of ['resources/views', 'resources/layouts'])
    fs.mkdirSync(path.join(root, 'warned', d), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'warned', 'stx.config.ts'),
    `export default { componentsDir: 'resources/components' }\n`,
  )

  // A plain app with none of the Stacks markers.
  fs.mkdirSync(path.join(root, 'plain', 'pages'), { recursive: true })
  fs.mkdirSync(path.join(root, 'plain', 'components'), { recursive: true })
  fs.writeFileSync(path.join(root, 'plain', 'stx.config.ts'), 'export default {}\n')
})

afterAll(() => {
  console.warn = realWarn
  fs.rmSync(root, { recursive: true, force: true })
})

afterEach(() => {
  console.warn = realWarn
})

describe('root inference uses the requested directory', () => {
  it('detects the Stacks layout in the directory it was asked about', async () => {
    // Reading process.cwd() here meant `stx dev ./my-app` from a parent
    // resolved every directory key against the parent instead.
    const config = await loadStxConfig(path.join(root, 'stacksy'))
    expect(config.root).toBe('resources')
    expect(config.pagesDir).toBe('views')
  })

  it('does not infer a root for a directory without the markers', async () => {
    const config = await loadStxConfig(path.join(root, 'plain'))
    expect(config.root).toBe('.')
  })
})

describe('a directory that does not exist is reported', () => {
  it('names the resolved path', async () => {
    captureWarnings()
    await loadStxConfig(path.join(root, 'warned'))
    console.warn = realWarn

    const misses = warnings.filter(w => w.includes('resolves to'))
    expect(misses.length).toBeGreaterThan(0)
    // The resolved path is the point — it is what makes the cause obvious.
    expect(misses.join('\n')).toContain('componentsDir')
    // Resolved ONCE under the root now (#1851). The old expectation here was
    // `resources/resources/components`, which is what the bug produced.
    expect(misses.join('\n')).toContain('/warned/resources/components')
    expect(misses.join('\n')).not.toContain('resources/resources')
  })

  it('stays quiet when every configured directory exists', async () => {
    // A warning that fires on correct projects is a warning people turn off.
    captureWarnings()
    await loadStxConfig(path.join(root, 'plain'))
    console.warn = realWarn

    expect(warnings.filter(w => w.includes('resolves to'))).toEqual([])
  })
})
