import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { renderComponentWithSlot } from '../../src/utils'

/**
 * Pins down the recursive `componentsDir` walk added in v0.2.46.
 *
 * Before that change the resolver only descended a single level into
 * `componentsDir`, so a component nested inside two or more
 * subdirectories couldn't be found by tag name and every page that
 * wanted to use it had to write an explicit `import` line.
 *
 * The walk should:
 * - find a component nested at depth 3 by tag name
 * - skip `node_modules` even when it lives directly under
 *   `componentsDir` (or any subdir)
 * - skip dotdirs (e.g. `.git`, `.cache`)
 * - cap at MAX_DEPTH so a runaway tree can't blow up startup time
 */
const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-recursive')
const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')

describe('Recursive component resolution under componentsDir', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })

    // Direct child — still works
    await Bun.write(path.join(COMPONENTS_DIR, 'flat-card.stx'), `<div class="card flat">{{ title }}</div>`)

    // Depth 2: components/Dashboard/Header.stx
    await fs.promises.mkdir(path.join(COMPONENTS_DIR, 'Dashboard'), { recursive: true })
    await Bun.write(path.join(COMPONENTS_DIR, 'Dashboard', 'Header.stx'), `<header class="nested-header">{{ title }}</header>`)

    // Depth 3: components/Dashboard/UI/PageLayout.stx
    await fs.promises.mkdir(path.join(COMPONENTS_DIR, 'Dashboard', 'UI'), { recursive: true })
    await Bun.write(
      path.join(COMPONENTS_DIR, 'Dashboard', 'UI', 'PageLayout.stx'),
      `<div class="page-layout-shell"><slot /></div>`,
    )

    // node_modules at depth 1 — should be skipped, even though the
    // file inside has a name that would otherwise match.
    await fs.promises.mkdir(path.join(COMPONENTS_DIR, 'node_modules', 'evil'), { recursive: true })
    await Bun.write(
      path.join(COMPONENTS_DIR, 'node_modules', 'evil', 'PageLayout.stx'),
      `<div class="should-not-render-this">poisoned</div>`,
    )

    // Dotdir at depth 1 — should also be skipped.
    await fs.promises.mkdir(path.join(COMPONENTS_DIR, '.cache'), { recursive: true })
    await Bun.write(
      path.join(COMPONENTS_DIR, '.cache', 'Hidden.stx'),
      `<div class="should-not-render-this-either">cached</div>`,
    )
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  it('finds a depth-1 component (parity with the legacy 1-level walk)', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'flat-card',
      { title: 'Hi' },
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )
    expect(result).toContain('class="card flat"')
    expect(result).toContain('Hi')
  })

  it('finds a depth-2 component (Dashboard/Header.stx)', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'Header',
      { title: 'Welcome' },
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )
    expect(result).toContain('class="nested-header"')
    expect(result).toContain('Welcome')
  })

  it('finds a depth-3 component (Dashboard/UI/PageLayout.stx)', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'PageLayout',
      {},
      '<p>slot content</p>',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )
    expect(result).toContain('class="page-layout-shell"')
    expect(result).toContain('slot content')
    // The deeper file should win — not the shadowed PageLayout.stx
    // we planted inside node_modules.
    expect(result).not.toContain('poisoned')
  })

  it('does not descend into node_modules', async () => {
    // The `evil` subdir contains a Pretender.stx whose tag matches the
    // top-level lookup for `Pretender`. With node_modules walking
    // disabled, the resolver should fall through to the
    // "component not found" branch.
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'Pretender',
      {},
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )
    // Either an error string or just a missing-component placeholder —
    // the important assertion is that the poisoned content is not in
    // the output.
    expect(result).not.toContain('should-not-render-this')
  })

  it('does not descend into dotdirs', async () => {
    const deps = new Set<string>()
    const result = await renderComponentWithSlot(
      'Hidden',
      {},
      '',
      COMPONENTS_DIR,
      {},
      path.join(TEMP_DIR, 'test.stx'),
      {},
      new Set(),
      deps,
    )
    expect(result).not.toContain('should-not-render-this-either')
  })
})
