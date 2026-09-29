/**
 * The page registry bundles a package together with the packages it re-exports.
 *
 * @stacksjs/browser re-exports its composables from @stacksjs/composables, a
 * `sideEffects: false` package, and calls one of them (useStorage) when it
 * loads. The registry's build registered the component builds' bare-package
 * hook and passed every import through it with `undefined`; Bun 1.4.0, handed
 * that back for such a re-export, left @stacksjs/composables out of the bundle.
 * The registry then threw at load, before registering anything, and every page
 * that auto-imported a browser composable failed to hydrate with "module is
 * not registered on this page". This is that chain in miniature, evaluated.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any

afterEach(() => {
  delete g.__stxModules
})

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'stx-registry-reexports-'))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

const pkg = (name: string) => JSON.stringify({ name, type: 'module', sideEffects: false, exports: { '.': './dist/index.js' } })

describe('the page registry and re-exported packages', () => {
  it('bundles a package re-exported from a side-effect-free one, and loads', async () => {
    const dir = project({
      'node_modules/shell-pkg/package.json': pkg('shell-pkg'),
      // Re-exports the composables, and uses one when it loads, as
      // @stacksjs/browser's useAuth does with useStorage.
      'node_modules/shell-pkg/dist/index.js': `export * from './composables/index.js'\nexport * from './session.js'\n`,
      'node_modules/shell-pkg/dist/composables/index.js': `export { useStorage, useVisibility } from 'composables-pkg'\n`,
      'node_modules/shell-pkg/dist/session.js': `import { useStorage } from 'composables-pkg'\nexport const token = useStorage('token', 'none')\n`,
      'node_modules/composables-pkg/package.json': pkg('composables-pkg'),
      'node_modules/composables-pkg/dist/index.js': `export { useStorage } from './useStorage.js'\nexport { useVisibility } from './useVisibility.js'\n`,
      'node_modules/composables-pkg/dist/useStorage.js': `export function useStorage(key, fallback) { return { key, value: fallback } }\n`,
      'node_modules/composables-pkg/dist/useVisibility.js': `export function useVisibility() { return 'visible' }\n`,
    })
    const entry = [
      'import * as __stxRegistered0 from "shell-pkg";',
      'globalThis.__stxModules = globalThis.__stxModules || {};',
      'if (!globalThis.__stxModules["npm:shell-pkg"]) globalThis.__stxModules["npm:shell-pkg"] = __stxRegistered0;',
    ].join('\n')

    const code = await bundleClientScript(entry, path.join(dir, '.stx-module-registry.ts'), {
      projectRoot: dir,
      cacheDir: path.join(dir, 'cache'),
      externalizeUserModules: false,
    })

    expect(code).toContain('function useStorage(')
    // eslint-disable-next-line no-new-func
    new Function(code)()
    const registered = g.__stxModules['npm:shell-pkg']
    expect(registered.token).toEqual({ key: 'token', value: 'none' })
    expect(registered.useVisibility()).toBe('visible')
  })
})
