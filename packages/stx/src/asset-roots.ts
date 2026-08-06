/**
 * The conventional asset root, shared by the serve path and every build path.
 *
 * `serve()` resolves `/assets/*` from `resources/assets/*` as well as from
 * `publicDir` — the Stacks/Laravel-style layout that `buddy make:*` produces.
 * No build path had ever heard of it: they copy `publicDir` and nothing else.
 *
 * So `<script src="/assets/scripts/site-mode.js">` resolved under `stx dev` and
 * 404'd in `dist/`, with nothing in the build reporting it. The only way to
 * notice was to diff the build output against the served tree
 * (stacksjs/stx#1876).
 *
 * It lives here rather than in one of the three builders because there are
 * three of them — ssg.ts, site-builder/build.ts and production-builder.ts —
 * each with its own copy mechanism, and a convention restated three times is
 * one that will be fixed in one place and left behind in the others.
 *
 * @module asset-roots
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Directory whose contents are served at `/assets/*`, in addition to
 * `publicDir`. Relative to the project root, and deliberately not a config
 * option — it mirrors what `serve()` hardcodes.
 */
export const CONVENTIONAL_ASSET_ROOT = 'resources/assets'

/** Where its contents must land so `/assets/*` resolves in built output. */
export const CONVENTIONAL_ASSET_OUTPUT = 'assets'

/**
 * Absolute path to the conventional asset root, or `null` when the project
 * does not use that layout.
 */
export function resolveConventionalAssetRoot(root: string = process.cwd()): string | null {
  const dir = path.resolve(root, CONVENTIONAL_ASSET_ROOT)
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? dir : null
}
