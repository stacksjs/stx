/**
 * Resolve whatever a user typed — a directory, a file, or a glob — to `.stx` files.
 *
 * The CLI commands disagreed about which of those they took, and each was silent
 * about the shape it did not accept. `stx a11y` joined its argument into a scan
 * pattern (`path.join(arg, '**' + '/*.stx')`), so a FILE path became
 * `file.stx/**` + `/*.stx` and matched nothing, and a glob became
 * `'x/**' + '/*.stx/**' + '/*.stx'` and also matched nothing. Both then took the
 * empty branch, which printed
 *
 *     ✓ No accessibility issues found!
 *
 * and exited 0 — on a file with three SERIOUS findings. Meanwhile `typecheck`
 * globbed and, handed a directory, said it matched nothing. Both halves
 * inverted, and inverted silently in the direction that costs you: the natural
 * way to add a checker to CI is to copy the line that already works, so
 *
 *     - run: stx a11y 'resources/**' + '/*.stx'
 *
 * passes on every commit for the life of the project, indistinguishable from a
 * project with no accessibility problems (stacksjs/stx#1918).
 *
 * So there is one resolver and every command uses it. The separate half of that
 * fix lives at the call sites and matters more: **an empty match set is not a
 * pass.** A run that read no files has verified nothing, and has to say so.
 *
 * @module resolve-stx-targets
 */

import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

/** Characters that make an argument a pattern rather than a path. */
const GLOB_MAGIC = /[*?[\]{}]/

/** Is this argument a glob pattern rather than a plain path? */
export function looksLikeGlob(target: string): boolean {
  return GLOB_MAGIC.test(target)
}

export interface ResolveStxTargetsOptions {
  /** Directory to resolve relative targets against. Defaults to the cwd. */
  cwd?: string
  /** Recurse into subdirectories when the target is a directory. Default true. */
  recursive?: boolean
  /** Substrings that exclude a matched path. */
  ignorePaths?: readonly string[]
}

/**
 * Expand targets to absolute `.stx` file paths, de-duplicated and sorted.
 *
 * A named FILE is returned whether or not it ends in `.stx`: naming one is an
 * explicit request, and silently dropping it is the failure this module exists
 * to remove. Directories and globs are filtered to `.stx`.
 *
 * `node_modules` and `dist` are always excluded — a glob like `**` + `/*.stx`
 * otherwise sweeps up every template in every installed package.
 */
export async function resolveStxTargets(
  targets: readonly string[],
  options: ResolveStxTargetsOptions = {},
): Promise<string[]> {
  const cwd = options.cwd ?? process.cwd()
  const recursive = options.recursive !== false
  const ignorePaths = options.ignorePaths ?? []
  // `globalThis.Bun.Glob`, not `await import('bun')` — the bundler rewrites the
  // dynamic import in a way that fused `await Promise` into one identifier and
  // killed the CLI on its first line in every published build (#1896).
  const Glob = globalThis.Bun.Glob

  const found = new Set<string>()

  const accept = (file: string): void => {
    if (file.includes(`${path.sep}node_modules${path.sep}`) || file.includes(`${path.sep}dist${path.sep}`))
      return
    if (ignorePaths.some(ignore => ignore && file.includes(path.normalize(ignore))))
      return
    found.add(file)
  }

  /**
   * Scan a pattern, treating an unwalkable one as no matches.
   *
   * Measured asymmetry in `Bun.Glob`: a RELATIVE pattern whose base directory
   * does not exist yields nothing, while an ABSOLUTE one throws ENOENT. Letting
   * that escape would make `stx a11y '/abs/nope/**' + '/*.stx'` crash and
   * `stx a11y 'nope/**' + '/*.stx'` succeed, which is the same
   * inconsistent-with-itself failure #1918 describes for the old code.
   *
   * A pattern that cannot be walked matched nothing, and the caller reports
   * "no .stx files matched" and exits non-zero. That is the honest answer, and
   * it is the same one either spelling now gets.
   */
  const scan = async (pattern: string): Promise<void> => {
    try {
      for await (const file of new Glob(pattern).scan({ cwd, absolute: true }))
        accept(file)
    }
    catch {
      // Unwalkable: no matches.
    }
  }

  for (const target of targets) {
    if (!target)
      continue

    if (looksLikeGlob(target)) {
      await scan(target)
      continue
    }

    const absolute = path.resolve(cwd, target)
    if (!existsSync(absolute))
      continue

    if (statSync(absolute).isDirectory()) {
      // Scanned from the directory itself rather than by joining a pattern onto
      // it, so a path containing glob characters is still treated as the
      // directory the user named.
      for await (const file of new Glob(recursive ? '**/*.stx' : '*.stx').scan({ cwd: absolute, absolute: true }))
        accept(file)
      continue
    }

    accept(absolute)
  }

  return [...found].sort()
}
