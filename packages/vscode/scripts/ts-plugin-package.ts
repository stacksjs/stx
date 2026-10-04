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
 *
 * `@stacksjs/stx-vscode` ships a self-contained copy of the package
 * (`dist/typescript-plugin/`, see {@link writeTsPluginStandalone}), so the
 * Stacks extension, which builds stx support in, can contribute the same
 * plugin without the stx extension installed.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { writeStxDeclarations } from '../src/ts-plugin-declarations'
import { TS_PLUGIN_NAME } from '../src/ts-plugin-config'

/** The name `contributes.typescriptServerPlugins` declares. */
export const TS_PLUGIN_PACKAGE = TS_PLUGIN_NAME

/** Where tsserver looks for it, relative to the extension root. */
export const TS_PLUGIN_DIR = `node_modules/${TS_PLUGIN_PACKAGE}`

/** The bundle build.ts emits, relative to the extension root. */
export const TS_PLUGIN_BUNDLE = 'dist/typescript-stx-plugin.js'

/** The declaration files build.ts writes for the plugin, relative to the extension root. */
export const TS_PLUGIN_TYPES_DIR = 'dist/types'

/** The bundle's file name, wherever it is written. */
export const TS_PLUGIN_BUNDLE_FILE = 'typescript-stx-plugin.js'

/**
 * A plugin package's two files. `index.js` requires the bundle and tells it
 * where the declaration files are, which the bundle cannot work out itself:
 * Bun inlines `__dirname` at build time (stacksjs/stx#2028). Both paths are
 * relative to the package directory.
 */
function pluginPackage(version: string, bundle: string, typesDir: string): Record<string, string> {
  return {
    'package.json': `${JSON.stringify({ name: TS_PLUGIN_PACKAGE, version, private: true, main: 'index.js' }, null, 2)}\n`,
    'index.js': [
      `const path = require('path')`,
      `const init = require('${bundle}')`,
      `module.exports = modules => init(modules, { declarationsDir: path.join(__dirname, '${typesDir}') })`,
      '',
    ].join('\n'),
  }
}

/** The files of the plugin package, relative to its directory. */
export function tsPluginPackageFiles(version: string): Record<string, string> {
  // A forwarder rather than a second copy: the bundle stays in dist/, where
  // the extension's `./plugin` export points.
  return pluginPackage(version, `../../../${TS_PLUGIN_BUNDLE}`, `../../../${TS_PLUGIN_TYPES_DIR}`)
}

/** The files of the self-contained package, beside its bundle and `types/`. */
export function tsPluginStandaloneFiles(version: string): Record<string, string> {
  return pluginPackage(version, `./${TS_PLUGIN_BUNDLE_FILE}`, './types')
}

/**
 * Bundle the plugin into `outdir` as {@link TS_PLUGIN_BUNDLE_FILE}: CommonJS
 * for tsserver, with `module.exports` the factory (typescript-plugin-entry.ts).
 */
export async function buildTsPluginBundle(outdir: string, sourcemap: 'external' | 'none' = 'none'): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, '../src/typescript-plugin-entry.ts')],
    outdir,
    naming: TS_PLUGIN_BUNDLE_FILE.replace(/\.js$/, '.[ext]'),
    target: 'node',
    format: 'cjs',
    external: ['typescript', 'typescript/lib/tsserverlibrary'],
    minify: true,
    sourcemap,
  })
  if (!result.success)
    throw new AggregateError(result.logs, 'TypeScript plugin build failed')
}

/**
 * Write the whole plugin as one package directory: `package.json`,
 * `index.js`, the bundle and the declaration files. An extension that ships it
 * puts it where tsserver resolves the name from (or forwards to it from
 * there); this is what `@stacksjs/stx-vscode` publishes.
 */
export async function writeTsPluginStandalone(dir: string, version: string): Promise<string> {
  mkdirSync(dir, { recursive: true })
  await buildTsPluginBundle(dir)
  writeStxDeclarations(join(dir, 'types'))
  for (const [file, content] of Object.entries(tsPluginStandaloneFiles(version)))
    writeFileSync(join(dir, file), content)
  return dir
}

/** Write the plugin package under `<root>/node_modules`. */
export function writeTsPluginPackage(root: string, version: string): string {
  const dir = join(root, TS_PLUGIN_DIR)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(tsPluginPackageFiles(version)))
    writeFileSync(join(dir, file), content)
  return dir
}
