/**
 * Build many entrypoints without letting one bad file take down the batch
 * (stacksjs/stx#1810).
 *
 * `Bun.build` over a list of entrypoints is all-or-nothing: one unparseable
 * file throws and nothing is emitted. For a static-site build that means a
 * single malformed view — often one the app never references, inherited from a
 * framework defaults directory — fails the whole build, and the message names no
 * file.
 *
 * Isolating by building each entrypoint separately would cost a build per page
 * on every run, including the overwhelmingly common case where nothing is
 * wrong. So: build the batch, and only if it fails fall back to per-entrypoint
 * builds to find out which ones are actually broken. The happy path pays
 * nothing; the broken path pays one extra pass and returns a precise list.
 *
 * @module isolated-build
 */

import { formatBuildFailure } from './build-message'

export interface IsolatedBuildResult {
  /** Entrypoints that built. */
  succeeded: string[]
  /** Entrypoints that failed, with a located, human-readable message each. */
  failed: Array<{ entrypoint: string, error: string }>
}

/**
 * Run `build` over `entrypoints`, falling back to one-at-a-time on failure.
 *
 * @param entrypoints absolute paths to build
 * @param build performs a Bun.build over the given subset; should throw or
 * reject on failure, which is what Bun.build does by default
 */
export async function buildIsolatingFailures(
  entrypoints: string[],
  build: (subset: string[]) => Promise<unknown>,
): Promise<IsolatedBuildResult> {
  if (entrypoints.length === 0)
    return { succeeded: [], failed: [] }

  try {
    await build(entrypoints)
    return { succeeded: [...entrypoints], failed: [] }
  }
  catch {
    // Fall through — the batch says nothing about WHICH entrypoint broke, and
    // Bun's own message names the temp entry rather than the source file.
  }

  const succeeded: string[] = []
  const failed: Array<{ entrypoint: string, error: string }> = []

  for (const entrypoint of entrypoints) {
    try {
      await build([entrypoint])
      succeeded.push(entrypoint)
    }
    catch (error) {
      failed.push({ entrypoint, error: formatBuildFailure(error, entrypoint) })
    }
  }

  return { succeeded, failed }
}
