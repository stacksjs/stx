/**
 * Where stx keeps its generated state.
 *
 * Everything stx writes for a project that is neither source nor a build
 * artifact you ship — the compiled-template cache, the Crosswind CSS cache, the
 * client-script bundle cache and its temp directory, the generated route
 * manifest and route types, dev-server output, SSG and media caches, story
 * snapshots — lives under one directory. It defaults to a hidden `.stx/` in the
 * project root, which is the right shape for a standalone app.
 *
 * Projects that already have a home for generated state can point it elsewhere
 * instead of collecting a second cache directory in their root. A Stacks
 * application, for example, keeps every runtime-owned directory under
 * `storage/`, so it sets `stateDir: 'storage/framework/stx'`.
 *
 * Resolution order, highest priority first:
 *
 *  1. `STX_DIR` — an escape hatch that also survives the process boundary, so a
 *     CLI that shells out keeps every child in agreement. A framework driving
 *     stx should set it to an absolute path.
 *  2. `stateDir` in `stx.config.ts`, applied by {@link setStateDir} when the
 *     config is loaded.
 *  3. {@link DEFAULT_STATE_DIR}.
 *
 * A relative value is resolved against the project root at the point of use; an
 * absolute value is used as-is, which is what lets one setting cover code that
 * resolves against `process.cwd()` and code that resolves against an app
 * directory somewhere below it.
 */
import path from 'node:path'

/** The directory used when nothing configures one. */
export const DEFAULT_STATE_DIR = '.stx'

/** Environment variable that overrides both the config and the default. */
export const STATE_DIR_ENV_VAR = 'STX_DIR'

let configuredStateDir: string | null = null

/**
 * Records the `stateDir` coming from `stx.config.ts`.
 *
 * Called by the config loader. A nullish or blank value clears it, so a config
 * without `stateDir` cannot inherit a stale value from a previously loaded one
 * (the dev server loads a config per app directory).
 */
export function setStateDir(dir?: string | null): void {
  const trimmed = dir?.trim()
  configuredStateDir = trimmed || null
}

/**
 * The configured state directory, as written — relative or absolute.
 */
export function stateDirName(): string {
  const fromEnv = process.env[STATE_DIR_ENV_VAR]?.trim()
  return fromEnv || configuredStateDir || DEFAULT_STATE_DIR
}

/**
 * Absolute path to a file or directory inside the state directory.
 *
 * An absolute state directory wins over `root`, so a framework can pin every
 * cache to one place no matter which directory a given code path happens to
 * resolve against.
 */
export function stateDir(root: string = process.cwd(), ...segments: string[]): string {
  const dir = stateDirName()
  return path.isAbsolute(dir) ? path.join(dir, ...segments) : path.join(root, dir, ...segments)
}

/**
 * Rewrites a config path that still carries the default `.stx/` prefix onto the
 * configured state directory.
 *
 * The path-shaped config options (`cachePath`, `build.cacheDir`,
 * `media.cache.directory`, `story.outDir`) default to somewhere under `.stx/`.
 * Rather than make each one separately configurable, `stateDir` moves the whole
 * family: anything under the default prefix follows it, and a path the user
 * pointed somewhere else entirely is left alone.
 */
export function rebaseOntoStateDir(value: string): string
export function rebaseOntoStateDir(value: string | undefined): string | undefined
export function rebaseOntoStateDir(value: string | undefined): string | undefined {
  if (!value || path.isAbsolute(value))
    return value

  const normalized = value.replace(/\\/g, '/')
  if (normalized !== DEFAULT_STATE_DIR && !normalized.startsWith(`${DEFAULT_STATE_DIR}/`))
    return value

  const suffix = normalized.slice(DEFAULT_STATE_DIR.length + 1)
  return suffix ? path.join(stateDirName(), suffix) : stateDirName()
}
