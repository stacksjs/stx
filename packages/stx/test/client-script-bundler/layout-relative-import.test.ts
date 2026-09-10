import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'
import { absolutizeTemplateImports } from '../../src/import-rebase'

/**
 * A layout's relative imports, after its content is merged into a page.
 *
 * The merged result carries ONE file path — the page's — so a specifier
 * written against the layout's directory is resolved against the page's. The
 * real shape from a deployed app: `resources/layouts/default.stx` imports
 * `../composables/useApp`, `resources/views/trail/[id].stx` extends it, and
 * the bundler looked for `resources/views/composables/useApp`.
 *
 * It failed for every page using that layout, and only in the boot log — the
 * page still rendered, because the layout's script is not what the markup
 * depends on.
 */

const TMP = path.join(import.meta.dir, 'temp-layout-relative-import')

describe('layout-authored relative imports', () => {
  let projectRoot: string
  let layoutFile: string
  let pageFile: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

    // resources/composables/useApp.ts — a sibling of the LAYOUT's directory,
    // two levels up from the page.
    await fs.promises.mkdir(path.join(projectRoot, 'resources/composables'), { recursive: true })
    await fs.promises.mkdir(path.join(projectRoot, 'resources/layouts'), { recursive: true })
    await fs.promises.mkdir(path.join(projectRoot, 'resources/views/trail'), { recursive: true })

    await Bun.write(
      path.join(projectRoot, 'resources/composables/useApp.ts'),
      'export function useApp() { return { booted: true } }\n',
    )

    layoutFile = path.join(projectRoot, 'resources/layouts/default.stx')
    pageFile = path.join(projectRoot, 'resources/views/trail/[id].stx')
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('resolves once rebased onto the layout, though the page is the bundle root', async () => {
    const layout = [
      '<script client>',
      `  import { useApp } from '../composables/useApp'`,
      '  const app = useApp()',
      '</script>',
    ].join('\n')

    // What process.ts now does before merging the layout into the page.
    const merged = absolutizeTemplateImports(layout, layoutFile)
    const script = merged.replace(/<\/?script[^>]*>/g, '')

    // Bundled under the PAGE's path, which is the situation that broke it.
    const output = await bundleClientScript(script, pageFile, { projectRoot })

    expect(output).toContain('booted')
    expect(output).not.toContain('resources/views/composables')
  })

  it('still resolves a page-authored relative import, which is the half that worked', async () => {
    // The previous fix chose the page's directory for exactly this. Rebasing
    // the layout must not take it away again.
    await fs.promises.mkdir(path.join(projectRoot, 'resources/views/trail'), { recursive: true })
    await Bun.write(
      path.join(projectRoot, 'resources/views/trail/local.ts'),
      'export const LOCAL_MARKER = "page-local"\n',
    )

    const output = await bundleClientScript(
      [`import { LOCAL_MARKER } from './local'`, 'const used = LOCAL_MARKER'].join('\n'),
      pageFile,
      { projectRoot },
    )

    expect(output).toContain('page-local')
  })

  it('handles both in one script, which is what a merged page actually is', async () => {
    await Bun.write(
      path.join(projectRoot, 'resources/views/trail/local.ts'),
      'export const LOCAL_MARKER = "page-local"\n',
    )

    const layoutPart = absolutizeTemplateImports(
      `<script client>import { useApp } from '../composables/useApp'</script>`,
      layoutFile,
    ).replace(/<\/?script[^>]*>/g, '')

    const output = await bundleClientScript(
      [
        layoutPart,
        `import { LOCAL_MARKER } from './local'`,
        // One declaration per line: the binding scan is line-anchored, so a
        // second `const` after a semicolon is never exported and Bun
        // tree-shakes it out of the bundle.
        'const app = useApp()',
        'const used = LOCAL_MARKER',
      ].join('\n'),
      pageFile,
      { projectRoot },
    )

    expect(output).toContain('booted')
    expect(output).toContain('page-local')
  })
})
