/**
 * A cheap fingerprint of a set of source files, so a memoised bundle cannot
 * outlive its sources.
 *
 * The store and composable loaders memoised their built bundle per directory
 * and nothing ever invalidated it. `clearStoreCache()` and
 * `clearComposableCache()` existed and were exported, but the only callers in
 * the entire workspace were tests — so in dev, no edit to a store reached the
 * browser without restarting the server, including creating the first one
 * (stacksjs/stx#1877).
 *
 * A watcher alone is not enough: it fixes the common case but a missed event
 * still leaves a stale bundle serving indefinitely, with no symptom other than
 * an edit that seems not to have happened. Keying the memo on the sources means
 * the worst a missed event costs is one stale request, not the rest of the
 * session.
 *
 * Statting a handful of files is nothing next to the `Bun.build` it guards,
 * but on every render of a page it is not nothing, so in production a
 * signature is reused for a second (see `sourceSignature`).
 *
 * @module source-signature
 */

import fs from 'node:fs'

/**
 * Fingerprint `files` by path, size and mtime.
 *
 * Size is included because mtime resolution is coarse enough on some
 * filesystems that a fast rewrite of the same length can land in the same
 * millisecond. Sorted, so directory-scan order cannot change the result.
 *
 * A file that cannot be statted contributes a `missing` marker rather than
 * throwing — it is a difference from the last run either way.
 */
export function sourceSignature(files: readonly string[]): string {
  // Asked on every render by the store and composable loaders, which between
  // them stat every store, composable and file those import -- hundreds on
  // hq.training, ~12ms a request. In production, where the sources only
  // change with a deploy (a new process), the last stat answers for a
  // second. Development keeps statting every call: an edit must be seen on
  // the very next request even when a watcher event is missed (#1877).
  if (process.env.NODE_ENV !== 'production')
    return statSignature(files)
  const key = files.join('\n')
  const recent = recentSignatures.get(key)
  const now = Date.now()
  if (recent && now - recent.at < SIGNATURE_TTL_MS)
    return recent.signature
  const signature = statSignature(files)
  if (recentSignatures.size >= 64)
    recentSignatures.clear()
  recentSignatures.set(key, { at: now, signature })
  return signature
}

const SIGNATURE_TTL_MS = 1000
const recentSignatures = new Map<string, { at: number, signature: string }>()

/** Forget recent signatures, so the next call stats again. */
export function clearSourceSignatures(): void {
  recentSignatures.clear()
}

function statSignature(files: readonly string[]): string {
  return [...files]
    .sort()
    .map((file) => {
      try {
        const stat = fs.statSync(file)
        return `${file}:${stat.size}:${stat.mtimeMs}`
      }
      catch {
        return `${file}:missing`
      }
    })
    .join('\n')
}

/** A memo entry that knows which sources it was built from. */
export interface SignedCacheEntry<T> {
  signature: string
  value: T
}

/**
 * Read a memo entry, returning `undefined` when the sources have changed since
 * it was written.
 */
export function readSigned<T>(
  cache: Map<string, SignedCacheEntry<T>>,
  key: string,
  signature: string,
): T | undefined {
  const entry = cache.get(key)
  return entry !== undefined && entry.signature === signature ? entry.value : undefined
}

/** Write a memo entry stamped with the signature of its sources. */
export function writeSigned<T>(
  cache: Map<string, SignedCacheEntry<T>>,
  key: string,
  signature: string,
  value: T,
): T {
  cache.set(key, { signature, value })
  return value
}
