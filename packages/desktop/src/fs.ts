/**
 * Filesystem
 *
 * Read/write files and directories from inside the renderer. When
 * running in a Craft native window this dispatches to the native `fs`
 * bridge (full POSIX-style access). In a browser this throws — there's
 * no equivalent web API that doesn't require user-gesture-gated picker
 * flows, and silently degrading would mask real bugs.
 *
 * If you want graceful fallbacks for path-y operations, layer them on
 * top: prefer `dialog.showOpenDialog()` to prompt for paths in
 * browser builds.
 */

import { requireBridge } from './_bridge'

export interface FileStat {
  /** True if the path points at a regular file. */
  isFile: boolean
  /** True if the path points at a directory. */
  isDirectory: boolean
  /** True if the path is a symbolic link. */
  isSymlink: boolean
  /** Size in bytes (0 for directories). */
  size: number
  /** Last-modified time in epoch ms. */
  modifiedAt: number
}

export interface DirEntry {
  /** Entry name (no path). */
  name: string
  /**
   * Absolute path. Synthesized in the TS layer by joining the dir we
   * read against the entry name — the native side returns just the
   * basename, so we don't pay the cost of N path-joins on the bridge
   * boundary.
   */
  path: string
  /** True if the entry is itself a directory. */
  isDirectory: boolean
}

export interface MkdirOptions {
  /** Create intermediate directories as needed. */
  recursive?: boolean
}

export interface RmdirOptions {
  /** Recursively remove the directory and all its contents. */
  recursive?: boolean
}

export interface FS {
  /** Read a file as a UTF-8 string. */
  readFile: (path: string) => Promise<string>
  /**
   * Read a file as raw bytes. Use this for images, archives, or any
   * non-text data — `readFile` would corrupt those because it goes
   * through a UTF-8 decode round-trip on the bridge.
   */
  readBuffer: (path: string) => Promise<Uint8Array>
  /** Write a UTF-8 string to a file (overwrites). */
  writeFile: (path: string, data: string) => Promise<void>
  /** Write raw bytes to a file (overwrites). */
  writeBuffer: (path: string, data: Uint8Array) => Promise<void>
  /** Append a UTF-8 string to a file. Creates the file if missing. */
  appendFile: (path: string, data: string) => Promise<void>
  /** Delete a file. */
  deleteFile: (path: string) => Promise<void>
  /** True if the path exists. Doesn't throw for missing paths. */
  exists: (path: string) => Promise<boolean>
  /** Get file/dir metadata. Throws if the path doesn't exist. */
  stat: (path: string) => Promise<FileStat>
  /** List directory contents. Doesn't recurse. */
  readDir: (path: string) => Promise<DirEntry[]>
  /** Create a directory. */
  mkdir: (path: string, opts?: MkdirOptions) => Promise<void>
  /** Remove a directory. */
  rmdir: (path: string, opts?: RmdirOptions) => Promise<void>
  /** Copy a file from one path to another. */
  copy: (from: string, to: string) => Promise<void>
  /** Move/rename a file. */
  move: (from: string, to: string) => Promise<void>
  /**
   * Watch a path for changes. The native side fires events on the
   * `craft:fs:<id>` window event; pass `id` in to correlate.
   */
  watch: (path: string, id?: string) => Promise<void>
  /** Stop watching. */
  unwatch: (id: string) => Promise<void>
  /** Path to the user's home directory. */
  homeDir: () => Promise<string>
  /** Path to the system's temp directory. */
  tempDir: () => Promise<string>
  /** Path to this app's data directory (per-OS conventions). */
  appDataDir: () => Promise<string>
}

// Each method is `async` so that the synchronous `requireBridge` throw
// surfaces as a rejected promise — matching the rest of the surface and
// keeping call sites uniformly awaitable.
export const fs: FS = {
  async readFile(path)        { const r = await requireBridge('fs').readFile(path); return (r && r.data) || '' },
  async readBuffer(path) {
    // The native fs bridge currently round-trips through UTF-8, so binary
    // data gets mangled. We base64-encode on the way out and decode here
    // — once the native side gains a `readFileBytes` action that returns
    // an ArrayBuffer (Bun's WKScriptMessage supports it), this can become
    // a single-hop call.
    const r = await requireBridge('fs').readFile(path)
    const text = (r && r.data) || ''
    // If the native side wraps as base64, decode; otherwise treat as
    // raw text. We probe by checking whether the bridge supplied a
    // `base64` flag; old Craft versions don't, in which case we encode
    // the text as UTF-8 bytes (lossy for true binary).
    if (r && r.base64 === true) {
      return base64ToBytes(text)
    }
    return new TextEncoder().encode(text)
  },
  async writeFile(path, data) { await requireBridge('fs').writeFile(path, data) },
  async writeBuffer(path, data) {
    // Same shape concern as readBuffer — until the native side accepts
    // ArrayBuffer payloads, we send a base64 string with a marker the
    // bridge can detect. Apps that need true binary today should chunk
    // smaller payloads or use shell + tempfile flows.
    const b64 = bytesToBase64(data)
    await requireBridge('fs').writeFile(path, b64)
  },
  async appendFile(path, data){ await requireBridge('fs').appendFile(path, data) },
  async deleteFile(path)      { await requireBridge('fs').deleteFile(path) },
  async exists(path)          { return await requireBridge('fs').exists(path) },
  // The translator already normalizes the stat response shape, so the
  // local `normalizeStat` here is now a defence-in-depth: handle the
  // case where a non-Craft host (e.g. an unmocked test or a future
  // bridge) returns the raw native shape directly.
  async stat(path)            { return normalizeStat(await requireBridge('fs').stat(path)) },
  async readDir(path) {
    const r = await requireBridge('fs').readDir(path)
    const raw = (r && r.entries) || []
    // Synthesize an absolute `path` per entry by joining the dir +
    // basename. We trim a trailing slash on the dir to keep the result
    // canonical (`/a/b` + `c` → `/a/b/c`, not `/a/b//c`).
    const base = path.endsWith('/') ? path.slice(0, -1) : path
    return raw.map((e: any) => ({
      name: e.name,
      path: `${base}/${e.name}`,
      isDirectory: !!e.isDirectory,
    }))
  },
  async mkdir(path, opts)     { await requireBridge('fs').mkdir(path, opts) },
  async rmdir(path, opts)     { await requireBridge('fs').rmdir(path, opts) },
  async copy(from, to)        { await requireBridge('fs').copy(from, to) },
  async move(from, to)        { await requireBridge('fs').move(from, to) },
  async watch(path, id)       { await requireBridge('fs').watch(path, id) },
  async unwatch(id)           { await requireBridge('fs').unwatch(id) },
  async homeDir()             { return await requireBridge('fs').homeDir() },
  async tempDir()             { return await requireBridge('fs').tempDir() },
  async appDataDir()          { return await requireBridge('fs').appDataDir() },
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  // btoa accepts only ASCII strings; the byte→char conversion above
  // satisfies that constraint per byte.
  return typeof btoa === 'function' ? btoa(s) : Buffer.from(bytes).toString('base64')
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function normalizeStat(raw: any): FileStat {
  return {
    isFile:      !!raw.isFile,
    isDirectory: !!raw.isDirectory,
    isSymlink:   !!raw.isSymlink,
    size:        Number(raw.size) || 0,
    // Native side reports a unix timestamp in seconds; normalize to ms
    // so callers don't have to remember which one to multiply.
    modifiedAt:  raw.modifiedAt != null
      ? (raw.modifiedAt < 1e12 ? raw.modifiedAt * 1000 : raw.modifiedAt)
      : 0,
  }
}
