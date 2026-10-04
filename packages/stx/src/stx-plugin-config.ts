/**
 * The stx entry in an app's `tsconfig.json`, which both checkers read.
 *
 *   "compilerOptions": {
 *     "plugins": [{ "name": "@stacksjs/stx-typescript-plugin", "libs": ["./types/request-context.d.ts"] }]
 *   }
 *
 * `libs` are ambient declaration files a `.stx` file is checked against, for
 * globals the app installs that the stx runtime does not know about — a
 * framework's per-request `requestContext`, say. `stx typecheck` took them only
 * as `--lib` flags, which the editor never sees, so the same page passed the
 * CI gate and showed "Cannot find name" in the editor (stacksjs/stx#2028).
 * Declared here, the gate and the editor read one list.
 *
 * Paths resolve against the tsconfig that declares the entry, which matters
 * when it sits in a base config an app `extends`. A config that sets
 * `compilerOptions.plugins` at all replaces its base's list, as TypeScript
 * does, so the search stops at the first config that has one.
 *
 * Takes its file access as arguments so the editor plugin can hand it
 * TypeScript's own JSONC reader and this module stays free of `fs`.
 *
 * @module stx-plugin-config
 */

import path from 'node:path'

/** The name the stx TypeScript plugin is contributed and configured under. */
export const STX_TS_PLUGIN_NAME = '@stacksjs/stx-typescript-plugin'

export interface StxPluginEntry {
  /** The tsconfig that declares the entry. */
  configPath: string
  /** `libs`, made absolute. */
  libs: string[]
}

/** Read a tsconfig file as an object, or undefined when it cannot be read. */
export type ReadConfig = (file: string) => Record<string, any> | undefined

/** The nearest `tsconfig.json` at or above `startDir`. */
export function findNearestTsconfig(startDir: string, exists: (file: string) => boolean): string | undefined {
  let dir = path.resolve(startDir)
  for (;;) {
    const candidate = path.join(dir, 'tsconfig.json')
    if (exists(candidate))
      return candidate
    const parent = path.dirname(dir)
    if (parent === dir)
      return undefined
    dir = parent
  }
}

/**
 * The stx plugin entry governing files under `startDir`, following `extends`.
 *
 * Only relative `extends` are followed; a package base (`@tsconfig/…`) does not
 * carry an app's stx configuration.
 */
export function findStxPluginEntry(startDir: string, read: ReadConfig, exists: (file: string) => boolean): StxPluginEntry | undefined {
  const leaf = findNearestTsconfig(startDir, exists)
  if (!leaf)
    return undefined

  const seen = new Set<string>()
  const visit = (configPath: string): StxPluginEntry | undefined | null => {
    if (seen.has(configPath))
      return undefined
    seen.add(configPath)
    const config = read(configPath)
    if (!config)
      return undefined

    const plugins = config.compilerOptions?.plugins
    if (Array.isArray(plugins)) {
      const entry = plugins.find((plugin: unknown) => (plugin as { name?: unknown })?.name === STX_TS_PLUGIN_NAME) as { libs?: unknown } | undefined
      const libs = Array.isArray(entry?.libs) ? entry.libs.filter((lib): lib is string => typeof lib === 'string') : []
      // `null`: this config decided, so its bases are not consulted.
      return entry ? { configPath, libs: libs.map(lib => path.resolve(path.dirname(configPath), lib)) } : null
    }

    const bases = typeof config.extends === 'string' ? [config.extends] : Array.isArray(config.extends) ? config.extends : []
    // Later bases win in TypeScript, so they are asked first.
    for (const base of [...bases].reverse()) {
      if (typeof base !== 'string' || !base.startsWith('.'))
        continue
      const resolved = path.resolve(path.dirname(configPath), base.endsWith('.json') ? base : `${base}.json`)
      const found = visit(resolved)
      if (found !== undefined)
        return found
    }
    return undefined
  }

  return visit(leaf) ?? undefined
}
