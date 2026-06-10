/**
 * Finder colour tags.
 *
 * Read and write the tag list users see in Finder's sidebar — the
 * coloured dots next to file names. Stored as a binary plist xattr
 * (`com.apple.metadata:_kMDItemUserTags`).
 *
 * Tag entries often look like `"Red\n0"` where the trailing `\nN`
 * encodes the colour index. We pass them through unchanged so apps
 * can preserve or strip the suffix as they like.
 */
import { hasBridge } from './_bridge'

export interface TagsAPI {
  /** Read the Finder tag list for `path`. Empty array if untagged. */
  get: (path: string) => Promise<string[]>
  /** Replace the tag list. Pass `[]` to clear (or use `clear`). */
  set: (path: string, tags: string[] | string) => Promise<boolean>
  /** Remove the tags xattr entirely. */
  clear: (path: string) => Promise<boolean>
}

export const tags: TagsAPI = {
  async get(path) {
    if (!path) throw new Error('tags.get: path is required')
    if (!hasBridge('tags')) return []
    return await window.craft!.tags.get(path)
  },
  async set(path, t) {
    if (!path) throw new Error('tags.set: path is required')
    if (!hasBridge('tags')) return false
    // Normalize at the TS boundary so the bridge always sees an array
    // regardless of whether the caller passed a single string or list.
    const arr = Array.isArray(t) ? t : [String(t)]
    return await window.craft!.tags.set(path, arr)
  },
  async clear(path) {
    if (!path) throw new Error('tags.clear: path is required')
    if (!hasBridge('tags')) return false
    return await window.craft!.tags.clear(path)
  },
}
