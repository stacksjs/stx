/**
 * The stx that produced a cached artifact: its version, and the state of its
 * source when run from source.
 *
 * Its own module, importing nothing of stx, because two caches read it: the
 * render cache in caching.ts and the client bundle cache in
 * client-script-bundler.ts, which caching.ts reaches (through utils and
 * client-script), so importing it from there would be a cycle.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let engineFingerprint: string | undefined

/**
 * Which stx rendered a cached template.
 *
 * The cache used to be checked against the template, its dependencies, the
 * options and a `cacheVersion` that never changes - never against stx itself.
 * So a render survived an upgrade: a project kept serving pages produced by
 * the previous release's directives until something touched the template.
 * That is how a stale `.stx/cache` made this repo's own suite assert against
 * SEO output two releases old, while CI, starting clean, passed.
 *
 * The published package is identified by its version. Running from source,
 * the code changes between releases without one, so the newest file time
 * under src/ is added. Worked out once per process. Inlined into a bundle,
 * where there is no package.json beside it, it is 'unknown' - no worse than
 * before, and such a server renders ahead of time anyway.
 */
export function cacheEngineFingerprint(): string {
  if (engineFingerprint)
    return engineFingerprint
  let fingerprint = 'unknown'
  try {
    // Beside src/ and dist/ alike, one directory up. (Read rather than
    // imported: a JSON import here derailed the declaration emit of other
    // modules in the build.)
    fingerprint = String(JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version)
  }
  catch {}
  if (import.meta.url.endsWith('.ts')) {
    try {
      const src = path.dirname(fileURLToPath(import.meta.url))
      let newest = 0
      for (const entry of fs.readdirSync(src, { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.ts'))
          newest = Math.max(newest, fs.statSync(path.join(entry.parentPath, entry.name)).mtimeMs)
      }
      fingerprint += `+src.${Math.trunc(newest)}`
    }
    catch {}
  }
  engineFingerprint = fingerprint
  return fingerprint
}
