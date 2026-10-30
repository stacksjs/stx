import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Where the native primitive components (`View`, `Text`, `Button`, ...) live.
 *
 * Resolved by looking, because the answer differs between running from source,
 * the per-module build and the bundled CLI. A path that is merely plausible
 * would fail only in the built binary, which is the one users run.
 *
 * Both render targets use it: a native screen resolves primitives ahead of the
 * convention directories, and the web server resolves them last, so a page
 * written with `<View>` and `<Text>` renders as plain HTML where the app has
 * not defined a component of that name.
 */
export function nativePrimitivesDir(): string {
  // `src/native/primitives` from source and `dist/native/primitives` from the
  // per-module build; the bundled CLI (chunks in `dist/`) reaches them as
  // `native/primitives`.
  const candidates = [
    path.join(import.meta.dir, 'primitives'),
    path.join(import.meta.dir, 'native', 'primitives'),
  ]
  for (const candidate of candidates)
    if (existsSync(path.join(candidate, 'View.stx')))
      return candidate
  return candidates[0]!
}
