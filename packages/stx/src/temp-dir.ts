/**
 * Scratch directories that do not outlive the process that made them.
 *
 * Every stx temp directory goes through here: the Linux packaging steps of
 * the native build, the image pipeline's scratch files, the CLI's test
 * report, the build scripts and every test suite. A bare
 * `mkdtempSync(join(tmpdir(), 'stx-…'))` with no cleanup, or a `finally`
 * that a killed run never reaches, left about 590 `stx-*` directories in the
 * macOS per-user temp folder per full test run.
 *
 * The same three layers as Craft's `temp-dir.ts` (craft-native/craft#357),
 * because each one misses something the next one catches:
 *
 * 1. The caller removes the directory when it is done (`withTempDir`, or
 *    `removeTempDir` in a `finally` / `afterAll`).
 * 2. Every live directory is also removed on process exit and on SIGINT,
 *    SIGTERM and SIGHUP, which is what a Ctrl-C, a CI timeout or a tool's
 *    kill sends. Node skips `exit` listeners on a signal's default action,
 *    so the signals need their own handlers. `bun test` ends without
 *    emitting `exit`, so the test suites also call `removeAllTempDirs` from
 *    a preloaded `afterAll` (test-utils/temp-dirs.ts); that is what catches
 *    an assertion that throws past a test's own cleanup.
 * 3. SIGKILL cannot be caught. So each name carries the owning pid
 *    (`stx-native-cli-p4242-a1B2c3`), and the first directory a later process
 *    creates sweeps up any whose owner is gone.
 */

import { existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { constants as osConstants, tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

/** `stx-<label>-p<pid>-<mkdtemp suffix>`: what the sweep recognises as ours. */
const OWNED_NAME = /^stx-(?:.+-)?p(\d+)-\w{6}$/

/** A directory holding this file was kept on purpose and is never swept. */
export const KEEP_MARKER = '.stx-keep'

/** A directory younger than this is left alone even if its pid looks dead. */
const SWEEP_MIN_AGE_MS = 60_000

const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
type CleanupSignal = typeof SIGNALS[number]

const live = new Set<string>()
const kept = new Set<string>()
let hooked = false
const sweptRoots = new Set<string>()

function removeQuietly(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true })
  }
  catch {
    // Already gone, or busy on Windows; the next sweep gets it.
  }
}

/** Remove every directory this process created and has not removed yet. */
export function removeAllTempDirs(): void {
  for (const dir of live) removeQuietly(dir)
  live.clear()
  unhook()
}

function onExit(): void {
  for (const dir of live) removeQuietly(dir)
  live.clear()
}

function onSignal(signal: CleanupSignal): void {
  removeAllTempDirs()
  // Our listener replaced the signal's default action. If nobody else is
  // listening, do what the default would have done: end the process with
  // the conventional 128 + signal number status.
  if (process.listenerCount(signal) === 0)
    process.exit(128 + (osConstants.signals[signal] ?? 1))
}

const signalHandlers = new Map<CleanupSignal, () => void>(
  SIGNALS.map(signal => [signal, () => onSignal(signal)]),
)

function hook(): void {
  if (hooked)
    return
  hooked = true
  process.on('exit', onExit)
  for (const [signal, handler] of signalHandlers) {
    // Some runtimes have no SIGHUP on Windows; skip what throws.
    try {
      process.on(signal, handler)
    }
    catch {
      // Unsupported on this platform.
    }
  }
}

function unhook(): void {
  if (!hooked)
    return
  hooked = false
  process.off('exit', onExit)
  for (const [signal, handler] of signalHandlers) process.off(signal, handler)
}

function pidIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    // EPERM: it exists, it is just not ours to signal.
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

export interface SweepOptions {
  /** Directory to sweep. Defaults to the OS temp directory. */
  root?: string
  /** Whether a pid still runs. Injected by tests. */
  isAlive?: (pid: number) => boolean
  /** Minimum age before an orphan is removed. */
  minAgeMs?: number
  now?: number
}

/**
 * Remove stx temp directories whose owning process has exited.
 *
 * Only names this module produced are considered (`stx-…-p<pid>-XXXXXX`),
 * so another tool's `stx-something` directory is never touched, and neither
 * is one holding the keep marker. Returns the paths it removed.
 */
export function sweepOrphanedTempDirs(options: SweepOptions = {}): string[] {
  const root = options.root ?? tmpdir()
  const isAlive = options.isAlive ?? pidIsAlive
  const minAge = options.minAgeMs ?? SWEEP_MIN_AGE_MS
  const now = options.now ?? Date.now()
  const removed: string[] = []

  let names: string[]
  try {
    names = readdirSync(root)
  }
  catch {
    return removed
  }

  for (const name of names) {
    const match = OWNED_NAME.exec(name)
    if (!match)
      continue
    const pid = Number(match[1])
    if (pid === process.pid || isAlive(pid))
      continue
    const path = join(root, name)
    try {
      if (!statSync(path).isDirectory())
        continue
      if (now - statSync(path).mtimeMs < minAge)
        continue
      if (existsSync(join(path, KEEP_MARKER)))
        continue
    }
    catch {
      continue
    }
    removeQuietly(path)
    removed.push(path)
  }
  return removed
}

/**
 * The mkdtemp prefix for a label: `native-cli`, `stx-native-cli-` and
 * `stx-native-cli` all become `stx-native-cli-p<pid>-`.
 */
export function tempDirPrefix(label: string): string {
  const bare = label.replace(/^stx-/, '').replace(/-+$/, '')
  return bare ? `stx-${bare}-p${process.pid}-` : `stx-p${process.pid}-`
}

/**
 * The keep-for-inspection switch: `STX_KEEP_TEMP=1` keeps every directory
 * this process creates (a failing test's project, a build's staging tree),
 * marks it so no sweep removes it, and prints where it is.
 */
export function keepTempDirsRequested(env: Record<string, string | undefined> = process.env): boolean {
  const value = env.STX_KEEP_TEMP?.trim().toLowerCase()
  return !!value && value !== '0' && value !== 'false'
}

/**
 * Create a scratch directory in the OS temp folder (or `root`) that is
 * removed when this process ends, however it ends. Remove it sooner with
 * `removeTempDir`.
 */
export function createTempDir(label: string = 'stx', root: string = tmpdir()): string {
  if (!sweptRoots.has(root)) {
    sweptRoots.add(root)
    sweepOrphanedTempDirs({ root })
  }
  const dir = mkdtempSync(join(root, tempDirPrefix(label)))
  if (keepTempDirsRequested()) {
    keepTempDir(dir)
    console.warn(`[stx] STX_KEEP_TEMP: keeping ${dir}`)
    return dir
  }
  hook()
  live.add(dir)
  return dir
}

/**
 * Remove a directory from `createTempDir` now rather than at exit. One kept
 * with `keepTempDir` (or under `STX_KEEP_TEMP`) stays.
 */
export function removeTempDir(dir: string): void {
  if (kept.has(dir))
    return
  removeQuietly(dir)
  live.delete(dir)
  if (live.size === 0)
    unhook()
}

/**
 * Let a directory from `createTempDir` outlive the process, for a harness
 * asked to keep its output for inspection. The caller now owns it: the keep
 * marker stops a later sweep from removing it, so delete it by hand.
 */
export function keepTempDir(dir: string): void {
  try {
    writeFileSync(join(dir, KEEP_MARKER), `kept by pid ${process.pid}\n`)
  }
  catch {
    // The directory is gone; nothing to keep.
  }
  kept.add(dir)
  live.delete(dir)
  if (live.size === 0)
    unhook()
}

/** Run `fn` with a fresh scratch directory that is removed when it settles. */
export async function withTempDir<T>(label: string, fn: (dir: string) => T | Promise<T>): Promise<T> {
  const dir = createTempDir(label)
  try {
    return await fn(dir)
  }
  finally {
    removeTempDir(dir)
  }
}

/** Directories created here and not yet removed. For tests and diagnostics. */
export function liveTempDirs(): string[] {
  return [...live]
}
