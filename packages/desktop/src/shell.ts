/**
 * Shell
 *
 * Open URLs/paths in the user's default app, reveal files in Finder/
 * Explorer, and spawn child processes. When running in a Craft native
 * window this uses NSWorkspace / xdg-open / ShellExecute under the hood.
 *
 * `openExternal` has a sensible browser fallback (`window.open`); the
 * filesystem-touching APIs (`openPath`, `showInFinder`, `spawn`) throw
 * if the bridge isn't available — they have no meaningful web fallback.
 */
import { hasBridge, onCraftEvent, requireBridge } from './_bridge'

export interface SpawnOptions {
  /** Working directory for the spawned process. Defaults to cwd. */
  cwd?: string
  /** Environment variable overrides; merged on top of process env. */
  env?: Record<string, string>
  /** Stream stdout/stderr to JS via `craft:shell:<id>` events. */
  streamOutput?: boolean
}

export interface Shell {
  /**
   * Open a URL in the user's default browser.
   * Browser fallback uses `window.open(url, '_blank')`.
   */
  openExternal: (url: string) => Promise<void>
  /** Open a file/directory in its default app (Finder, etc). */
  openPath: (path: string) => Promise<void>
  /** Reveal a file in Finder / Explorer. */
  showInFinder: (path: string) => Promise<void>
  /**
   * Spawn a process. Use `kill(id)` to terminate it later. Output
   * streams to `craft:shell:<id>` window events when `streamOutput` is
   * true.
   */
  spawn: (id: string, command: string, args?: string[], opts?: SpawnOptions) => Promise<void>
  /** Kill a previously spawned process by id. */
  kill: (id: string) => Promise<void>
  /** Read an environment variable. Returns undefined if unset. */
  getEnv: (name: string) => Promise<string | undefined>
  /** Set an environment variable for this process and its children. */
  setEnv: (name: string, value: string) => Promise<void>
  /** Subscribe to stdout for a spawned process. */
  onStdout: (cb: (event: ShellOutputEvent) => void) => () => void
  /** Subscribe to stderr for a spawned process. */
  onStderr: (cb: (event: ShellOutputEvent) => void) => () => void
  /** Subscribe to process-exit events. */
  onExit: (cb: (event: ShellExitEvent) => void) => () => void
}

/** Output chunk from a spawned process. */
export interface ShellOutputEvent {
  /** id passed to `spawn()`. */
  id: string
  /** UTF-8 chunk. May or may not align with line boundaries. */
  data: string
}

export interface ShellExitEvent {
  id: string
  /** Process exit code (0 = success). null when the process was killed by signal. */
  exitCode: number | null
  /** Termination signal name (e.g. "SIGTERM"), if killed. */
  signal?: string
}

/**
 * Set of currently-active spawn ids. Tracked in JS so we can fail
 * fast on duplicate ids before the call hits native — the native side
 * silently overwrites a previous spawn under the same id, which
 * leaks processes and orphans their event streams.
 *
 * Auto-clean: an exit event from the native side removes the id; the
 * `kill()` wrapper does the same on demand. If the native fires an
 * exit without our wrapper (rare race), the id stays in the set —
 * worst case is a misleading "already in use" error on a subsequent
 * spawn, which is recoverable.
 */
const activeSpawnIds = new Set<string>()

// Lazy-attach the exit-event listener on first spawn. Attaching at
// module-load time runs before the test environment's window-event
// polyfill is ready (very-happy-dom doesn't ship `addEventListener`),
// which silently dropped the cleanup hook and made id-reuse tests
// flake. Doing it on demand sidesteps the load-order race.
let exitListenerAttached = false
function ensureExitListener(): void {
  if (exitListenerAttached) return
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('craft:shell:exit', (e) => {
    const detail = (e as CustomEvent).detail as { id?: string } | undefined
    if (detail?.id) activeSpawnIds.delete(detail.id)
  })
  exitListenerAttached = true
}

// Schemes blocked outright in `openExternal`. `javascript:` is the
// classic XSS vector; `data:` is also dangerous because attacker-
// controlled HTML can be loaded by the system handler. `file:` is a
// less obvious one — opening a local file via the OS handler can
// execute scripts from disk.
const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'file:', 'vbscript:'])

export const shell: Shell = {
  async openExternal(url: string): Promise<void> {
    // Reject obviously dangerous schemes — `javascript:` and `data:`
    // can be used by attacker-controlled URLs to execute code in
    // whatever app the OS resolves them to. `file:` is conservative
    // but matches Electron's default behaviour for the same reason.
    const lc = url.trim().toLowerCase()
    for (const s of BLOCKED_SCHEMES) {
      if (lc.startsWith(s)) {
        throw new Error(`shell.openExternal: ${s} URLs are blocked for safety`)
      }
    }
    if (hasBridge('shell')) {
      await window.craft!.shell.openExternal(url)
      return
    }
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  },

  // These have no sensible web fallback, so they throw via requireBridge.
  // Wrap each in async so the throw arrives as a rejected promise.
  async openPath(path) { await requireBridge('shell').openPath(path) },
  async showInFinder(path) { await requireBridge('shell').showInFinder(path) },
  async spawn(id, command, args = [], opts = {}) {
    ensureExitListener()
    if (!id || typeof id !== 'string') throw new Error('shell.spawn: id must be a non-empty string')
    if (!command || typeof command !== 'string') throw new Error('shell.spawn: command must be a non-empty string')
    if (!Array.isArray(args)) throw new Error('shell.spawn: args must be an array')
    for (const a of args) {
      if (typeof a !== 'string') throw new Error('shell.spawn: args entries must be strings')
    }
    // Track active ids in JS to fail fast on duplicates. Earlier the
    // native side silently overwrote a previous spawn under the same
    // id, leaking the original process and orphaning its event stream.
    if (activeSpawnIds.has(id)) {
      throw new Error(`shell.spawn: id "${id}" is already in use — call kill(id) first or pick a different id`)
    }
    activeSpawnIds.add(id)
    try {
      await requireBridge('shell').spawn(id, command, args, opts)
    }
    catch (e) {
      activeSpawnIds.delete(id)
      throw e
    }
  },
  async kill(id) {
    await requireBridge('shell').kill(id)
    activeSpawnIds.delete(id)
  },

  async getEnv(name: string): Promise<string | undefined> {
    if (hasBridge('shell')) {
      const v = await window.craft!.shell.getEnv(name)
      return v == null ? undefined : String(v)
    }
    return undefined
  },

  async setEnv(name, value) { await requireBridge('shell').setEnv(name, value) },
  onStdout(cb) { return onCraftEvent<ShellOutputEvent>('craft:shell:stdout', cb) },
  onStderr(cb) { return onCraftEvent<ShellOutputEvent>('craft:shell:stderr', cb) },
  onExit(cb) { return onCraftEvent<ShellExitEvent>('craft:shell:exit', cb) },
}
