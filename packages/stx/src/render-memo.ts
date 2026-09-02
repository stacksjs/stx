/**
 * Memoisation for the pure, content-keyed stages of a render (stacksjs/stx#1945).
 *
 * SSR of an unchanged view re-ran every stage on the same bytes: the component
 * bundle was read from disk, re-wrapped and re-inlined; the DOM-API validator
 * re-scanned the same script; the composable scan and the crosswind class
 * extraction walked the same few hundred KB of page. The JS heap stayed flat —
 * nothing was retained — but each stage makes native copies of a large string,
 * and the allocator's high-water mark climbed by megabytes per render. The
 * output was already byte-identical (cbe08f0b4b); nothing remembered it.
 *
 * Every memo here is keyed on the content it is a function of and holds a
 * small, bounded number of entries. Where the result also depends on files,
 * the caller records them and re-stats them on every hit, so an edit under a
 * dev server invalidates exactly as the on-disk bundle cache does.
 *
 * @module render-memo
 */

import fs from 'node:fs'
import { LRUCache } from './performance-utils'

/** A file an artifact was built from, and its mtime when it was read. */
export interface DepSnapshot {
  path: string
  mtimeMs: number
}

const memos: Array<{ clear: () => void }> = []

/** A bounded memo that `clearRenderMemos` knows about. */
export function renderMemo<V>(maxSize: number): LRUCache<string, V> {
  const memo = new LRUCache<string, V>(maxSize)
  memos.push(memo)
  return memo
}

/** Forget everything. Wired into `clearDevCaches`. */
export function clearRenderMemos(): void {
  for (const memo of memos)
    memo.clear()
}

/**
 * A key for some content plus the parameters the result depends on.
 *
 * The content itself is not retained — a page is a few hundred KB — so it is
 * represented by its wyhash and its length together. Two inputs would have to
 * agree on both to share a key.
 */
export function contentKey(content: string, ...parts: Array<string | number | boolean | null | undefined>): string {
  return `${parts.map(part => String(part ?? '')).join('\0')}\0${content.length}\0${Bun.hash(content)}`
}

/** Record the mtimes of `paths` now. A path that cannot be stat'ed is not recorded. */
export function snapshotDeps(paths: Iterable<string>): DepSnapshot[] {
  const deps: DepSnapshot[] = []
  for (const path of new Set(paths)) {
    try {
      deps.push({ path, mtimeMs: fs.statSync(path).mtimeMs })
    }
    catch {
      // Not there to record, so nothing to invalidate on later either.
    }
  }
  return deps
}

/** Whether every recorded dep still has the mtime it had. A deleted dep counts as changed. */
export function depsUnchanged(deps: DepSnapshot[]): boolean {
  for (const dep of deps) {
    try {
      if (fs.statSync(dep.path).mtimeMs !== dep.mtimeMs)
        return false
    }
    catch {
      return false
    }
  }
  return true
}
