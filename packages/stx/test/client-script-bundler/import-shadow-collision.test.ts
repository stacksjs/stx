/**
 * Tests for the import/local name-shadow collision (stacksjs/stx#1767).
 *
 * When a `<script client>` imports from a module AND declares a top-level
 * `const` whose name equals a top-level export of that module, `Bun.build`
 * inlines the import under the bare name and RENAMES the component's local
 * (`items` -> `items2`). The catch-all export the bundler adds to defeat
 * tree-shaking then comes back as `export { items2 as items }`. Pre-fix,
 * that `as` mapping was stripped and discarded, so scope registration
 * re-harvested the bare `items` (now the raw import) and bound the template
 * to the wrong value — a silent misregistration.
 *
 * Fix: capture the rename map before stripping and re-expose it as
 * `var __stxScopeRenames = { "items": items2 }` so the scope registrar can
 * bind the ORIGINAL name to the renamed (correct) binding.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

const TMP = path.join(import.meta.dir, 'temp-shadow')

describe('client-script-bundler: import/local name shadow (#1767)', () => {
  let projectRoot: string
  let templatePath: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    templatePath = path.join(projectRoot, 'Widget.stx')
    await fs.promises.mkdir(projectRoot, { recursive: true })
    await Bun.write(path.join(projectRoot, 'data.ts'), `export const items = [{ id: 1, label: 'raw' }]\n`)
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('re-exposes a rename map when a local const shadows an inlined import export', async () => {
    // The component aliases the import (`allItems`) yet still declares a local
    // `const items` that collides with data.ts's `export const items`.
    const script = `import { items as allItems } from './data'\nconst items = derived(() => allItems.map(x => ({ ...x, extra: 'computed' })))`
    const out = await bundleClientScript(script, templatePath, { projectRoot })

    // Bun renamed the component's local:
    expect(out).toMatch(/\bitems2\b/)
    // ...and the fix re-exposes ORIGINAL name -> renamed binding, so the
    // registrar binds the template's `items` to the derived, not the import:
    expect(out).toMatch(/__stxScopeRenames\s*=\s*\{\s*"items":\s*items2\s*\}/)
  })

  it('emits no rename map when there is no name collision', async () => {
    const script = `import { items as allItems } from './data'\nconst list = derived(() => allItems.map(x => x))`
    const out = await bundleClientScript(script, templatePath, { projectRoot })
    expect(out).not.toContain('__stxScopeRenames')
  })
})
