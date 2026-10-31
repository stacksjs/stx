/**
 * Modules a web page's bundles take another in place of.
 *
 * Views can be compiled twice, for the web and natively (Craft), and some
 * code they import runs only in the native compile: the phone's half of a
 * store, say, which a web page reaches only to find it is not on a phone.
 * Bun drops what such a page never calls, but it keeps every module on the
 * way for its side effects, and so whatever those import for theirs (an app's
 * message catalogs register themselves as they load). A page then ships
 * the phone's messages to run none of them, and no analysis of the built
 * code can tell that registration apart from one the page needs.
 *
 * The app knows, so it says: the `webModules` option names, for each such
 * module, the module a web page's bundles (the module registry, the stores,
 * the composables) load in its place. Native compiles never read it, so the
 * phone keeps the real module, and a stand-in that cannot be read leaves
 * every page with the real modules, as without the option.
 *
 * ```ts
 * // config/stx.ts
 * webModules: {
 *   // The website is never a phone: nativeAuthFor answers null there.
 *   'resources/functions/native-auth.ts': 'resources/web/native-auth.ts',
 * }
 * ```
 *
 * A stand-in is built in place of the module it replaces, so its own
 * relative imports would resolve from that module's directory: it may use
 * them only when it sits in the same directory. Anything else it imports
 * goes by package name.
 *
 * @module web-modules
 */

import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathSpellings } from './message-catalogs'

/** Each module (relative to the project root) and the module a web page loads instead. */
export type WebModulesOption = Record<string, string>

const loaded = new Map<string, { signature: string, standIns: Map<string, string> }>()

function loaderFor(file: string): 'ts' | 'tsx' | 'js' | 'jsx' {
  const extension = path.extname(file)
  if (extension === '.tsx') return 'tsx'
  if (extension === '.jsx') return 'jsx'
  if (extension === '.ts' || extension === '.mts' || extension === '.cts') return 'ts'
  return 'js'
}

/**
 * The stand-ins, as JavaScript by every spelling of each replaced module's
 * path (the bundler's substitutes, `withModuleSubstitutes`). Read again when
 * a stand-in changes. Throws on a module or stand-in that is not there, or a
 * stand-in whose relative imports would resolve elsewhere.
 */
export async function loadWebModules(root: string, option: WebModulesOption): Promise<Map<string, string>> {
  const pairs = Object.entries(option).map(([module, standIn]) => [path.resolve(root, module), path.resolve(root, standIn)] as const)
  const signature = pairs.map(([module, standIn]) => {
    try { return `${module}\0${standIn}\0${statSync(standIn).mtimeMs}` }
    catch { return `${module}\0${standIn}\0-` }
  }).join('\n')
  const cacheKey = `${root}\0${JSON.stringify(option)}`
  const cached = loaded.get(cacheKey)
  if (cached && cached.signature === signature) return cached.standIns

  const standIns = new Map<string, string>()
  for (const [module, standIn] of pairs) {
    const name = path.relative(root, module)
    if (!existsSync(module)) throw new Error(`webModules: ${name} does not exist`)
    if (!existsSync(standIn)) throw new Error(`webModules: ${path.relative(root, standIn)}, the stand-in for ${name}, does not exist`)
    if (module === standIn) throw new Error(`webModules: ${name} stands in for itself`)
    const source = await Bun.file(standIn).text()
    const transpiler = new Bun.Transpiler({ loader: loaderFor(standIn), target: 'browser' })
    if (path.dirname(standIn) !== path.dirname(module)) {
      const relative = transpiler.scanImports(source).find(entry => /^\.\.?\//.test(entry.path))
      if (relative)
        throw new Error(`webModules: ${path.relative(root, standIn)} imports ${relative.path}, which would resolve from ${path.relative(root, path.dirname(module)) || '.'}; a stand-in imports relatively only from the directory of the module it replaces`)
    }
    const code = transpiler.transformSync(source)
    for (const spelling of pathSpellings(module)) standIns.set(spelling, code)
  }
  loaded.set(cacheKey, { signature, standIns })
  return standIns
}
