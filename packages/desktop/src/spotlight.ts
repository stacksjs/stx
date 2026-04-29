/**
 * Spotlight indexing.
 *
 * Surfaces app content (notes, contacts, conversations) in macOS
 * system search. Each item gets a stable identifier the app provides
 * — apps later use that id to remove or update entries as content
 * changes.
 *
 * Backend: `CSSearchableIndex` (Core Spotlight). Items are
 * permission-free to write; the index lives per-app in the user's
 * library directory and is queryable from Spotlight as soon as the
 * write completes.
 */

import { hasBridge } from './_bridge'

export interface SpotlightItem {
  /** Stable id; pass back to `remove(...)` to drop this entry. */
  id: string
  /** Title shown in the Spotlight result. */
  title: string
  /** Secondary text (subtitle / one-line description). */
  description?: string
  /** Keywords to match on, in addition to title + description. */
  keywords?: string[]
}

export interface SpotlightAPI {
  index: (items: SpotlightItem[]) => Promise<{ ok: boolean, reason?: string }>
  remove: (ids: string[]) => Promise<{ ok: boolean }>
  removeAll: () => Promise<{ ok: boolean }>
}

export const spotlight: SpotlightAPI = {
  async index(items) {
    if (!hasBridge('spotlight')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.spotlight.index(items)
  },
  async remove(ids) {
    if (!hasBridge('spotlight')) return { ok: false }
    return await window.craft!.spotlight.remove(ids)
  },
  async removeAll() {
    if (!hasBridge('spotlight')) return { ok: false }
    return await window.craft!.spotlight.removeAll()
  },
}
