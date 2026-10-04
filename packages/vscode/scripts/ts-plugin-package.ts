/**
 * The stx TypeScript server plugin, as the package tsserver loads it.
 *
 * tsserver loads plugins by package name only: it refuses any name that is a
 * path ("Skipped loading plugin ./dist/typescript-stx-plugin.js because only
 * package name is allowed plugin name") and resolves the rest from
 * `<extension>/node_modules`, the probe location VS Code passes for every
 * extension contributing `typescriptServerPlugins`. The plugin was contributed
 * as `./dist/typescript-stx-plugin.js` and so never loaded.
 *
 * build.ts writes the package; scripts/package.ts adds it to the VSIX, because
 * `vsce package --no-dependencies` leaves out everything under node_modules.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TS_PLUGIN_NAME } from '../src/ts-plugin-config'

/** The name `contributes.typescriptServerPlugins` declares. */
export const TS_PLUGIN_PACKAGE = TS_PLUGIN_NAME

/** Where tsserver looks for it, relative to the extension root. */
export const TS_PLUGIN_DIR = `node_modules/${TS_PLUGIN_PACKAGE}`

/** The bundle build.ts emits, relative to the extension root. */
export const TS_PLUGIN_BUNDLE = 'dist/typescript-stx-plugin.js'

/** The declaration files build.ts writes for the plugin, relative to the extension root. */
export const TS_PLUGIN_TYPES_DIR = 'dist/types'

/** The files of the plugin package, relative to its directory. */
export function tsPluginPackageFiles(version: string): Record<string, string> {
  return {
    'package.json': `${JSON.stringify({ name: TS_PLUGIN_PACKAGE, version, private: true, main: 'index.js' }, null, 2)}\n`,
    // A forwarder rather than a second copy: the bundle stays in dist/, where
    // the extension's `./plugin` export points. It also tells the bundle where
    // the declaration files are, which the bundle cannot work out itself: Bun
    // inlines `__dirname` at build time (stacksjs/stx#2028).
    'index.js': [
      `const path = require('path')`,
      `const init = require('../../../${TS_PLUGIN_BUNDLE}')`,
      `module.exports = modules => init(modules, { declarationsDir: path.join(__dirname, '../../../${TS_PLUGIN_TYPES_DIR}') })`,
      '',
    ].join('\n'),
  }
}

/** Write the plugin package under `<root>/node_modules`. */
export function writeTsPluginPackage(root: string, version: string): string {
  const dir = join(root, TS_PLUGIN_DIR)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(tsPluginPackageFiles(version)))
    writeFileSync(join(dir, file), content)
  return dir
}
