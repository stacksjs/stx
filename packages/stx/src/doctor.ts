/**
 * stx doctor — diagnose the framework-runtime resolution + staleness chain.
 *
 * Editing a `pantry/@stacksjs/stx/src/*.ts` file in a Stacks app means a change
 * has to survive several layers before it reaches the browser: the pantry dist
 * rebuild, the `node_modules/@stacksjs/stx` resolution (symlinked to pantry or
 * not), the dev server's in-memory runtime cache, and the browser. When one
 * layer is stale the symptom is silent — "my edit didn't show up". This module
 * inspects each layer and reports exactly which one is misaligned, with the
 * command to fix it.
 *
 * The framework-level cache (the signals runtime) is already invalidated on
 * source edits by the dev watcher (see caching.ts `clearDevCaches`, #1745 item
 * C); the remaining gap this addresses is *visibility* (#1745 Section D).
 *
 * @module doctor
 */

import fs from 'node:fs'
import path from 'node:path'

export type CheckStatus = 'ok' | 'warn' | 'error' | 'info'

export interface DoctorCheck {
  /** Short label for the layer being checked. */
  name: string
  status: CheckStatus
  /** Human-readable finding. */
  detail: string
  /** A shell command (or instruction) that resolves a warn/error. */
  fix?: string
}

export interface DoctorReport {
  checks: DoctorCheck[]
  /** false when any check is an `error` — suitable for a non-zero exit. */
  ok: boolean
}

export interface DoctorOptions {
  /** Directory to diagnose from (defaults to process.cwd()). */
  cwd?: string
  /**
   * Generator used for the runtime-length sanity check. Injectable so the
   * check (and tests) don't have to load the full signals module.
   */
  generateRuntime?: () => string
  /** Resolver for a package entry; injectable for tests. Defaults to Bun.resolveSync. */
  resolve?: (specifier: string, from: string) => string | null
}

function mtimeMs(p: string): number | null {
  try {
    return fs.statSync(p).mtimeMs
  }
  catch {
    return null
  }
}

function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 60)
    return `${s}s ago`
  if (s < 3600)
    return `${Math.round(s / 60)}m ago`
  return `${Math.round(s / 3600)}h ago`
}

function defaultResolve(specifier: string, from: string): string | null {
  try {
    // Bun.resolveSync resolves like the runtime does (respects exports + symlinks).
    return (globalThis as { Bun?: { resolveSync: (s: string, f: string) => string } }).Bun?.resolveSync(specifier, from) ?? null
  }
  catch {
    return null
  }
}

/**
 * Walk up from `cwd` looking for a `pantry/@stacksjs/<name>` directory.
 * Returns its absolute path, or null when there's no pantry (a standard install
 * or running inside the stx repo itself).
 */
export function findPantryPackage(cwd: string, name = 'stx'): string | null {
  let dir = path.resolve(cwd)
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'pantry', '@stacksjs', name)
    if (fs.existsSync(candidate))
      return candidate
    const parent = path.dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  return null
}

/**
 * Run the resolution/staleness diagnostics. Pure-ish: only reads the filesystem
 * and (optionally) generates the runtime — never mutates anything.
 */
export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()
  const resolve = options.resolve ?? defaultResolve
  const now = Date.now()
  const checks: DoctorCheck[] = []

  // 1. Where does @stacksjs/stx resolve from?
  const stxEntry = resolve('@stacksjs/stx', cwd)
  checks.push(stxEntry
    ? { name: '@stacksjs/stx resolves to', status: 'ok', detail: stxEntry }
    : { name: '@stacksjs/stx resolves to', status: 'info', detail: 'not resolvable from here (running inside the stx repo, or not installed)' })

  // 2. Where does bun-plugin-stx resolve from? (the dev server entry)
  const pluginEntry = resolve('bun-plugin-stx', cwd)
  if (pluginEntry)
    checks.push({ name: 'bun-plugin-stx resolves to', status: 'ok', detail: pluginEntry })

  // 3. Pantry presence + dist staleness.
  const pantry = findPantryPackage(cwd, 'stx')
  if (!pantry) {
    checks.push({ name: 'pantry', status: 'info', detail: 'no pantry/@stacksjs/stx found — standard install (nothing to rebuild)' })
  }
  else {
    const srcSignals = path.join(pantry, 'src/signals.ts')
    // Prefer the bundled dist entry; fall back to dist/signals.js if present.
    const distEntry = [path.join(pantry, 'dist/index.js'), path.join(pantry, 'dist/signals.js')].find(p => fs.existsSync(p)) || null
    const srcMtime = mtimeMs(srcSignals)
    const distMtime = distEntry ? mtimeMs(distEntry) : null

    if (srcMtime == null) {
      checks.push({ name: 'pantry dist freshness', status: 'info', detail: `found pantry at ${pantry} but no src/signals.ts to compare` })
    }
    else if (distMtime == null) {
      checks.push({
        name: 'pantry dist freshness',
        status: 'error',
        detail: 'pantry has src but no built dist — the dev server will resolve nothing (or a stale copy elsewhere)',
        fix: `cd ${pantry} && bun build.ts`,
      })
    }
    else if (distMtime < srcMtime) {
      const lagS = Math.round((srcMtime - distMtime) / 1000)
      checks.push({
        name: 'pantry dist freshness',
        status: 'error',
        detail: `dist (${ago(distMtime, now)}) is OLDER than src/signals.ts (${ago(srcMtime, now)}) by ${lagS}s — your edit isn't built`,
        fix: `cd ${pantry} && bun build.ts`,
      })
    }
    else {
      checks.push({ name: 'pantry dist freshness', status: 'ok', detail: `dist rebuilt after src (src ${ago(srcMtime, now)}, dist ${ago(distMtime, now)})` })
    }

    // 4. Is node_modules/@stacksjs/stx symlinked to pantry?
    const nm = path.join(cwd, 'node_modules/@stacksjs/stx')
    let lst: fs.Stats | null = null
    try {
      lst = fs.lstatSync(nm)
    }
    catch {
      lst = null
    }
    if (!lst) {
      checks.push({ name: 'node_modules → pantry', status: 'info', detail: 'node_modules/@stacksjs/stx not present (not installed here)' })
    }
    else if (lst.isSymbolicLink()) {
      let target: string | null = null
      try {
        target = fs.realpathSync(nm)
      }
      catch { /* dangling symlink */ }
      const pantryReal = (() => {
        try {
          return fs.realpathSync(pantry)
        }
        catch {
          return pantry
        }
      })()
      checks.push(target === pantryReal
        ? { name: 'node_modules → pantry', status: 'ok', detail: 'symlinked to pantry' }
        : { name: 'node_modules → pantry', status: 'warn', detail: `symlinked to ${target || '(dangling)'}, not pantry` })
    }
    else {
      checks.push({
        name: 'node_modules → pantry',
        status: 'warn',
        detail: 'is a real directory, NOT symlinked to pantry — edits to pantry src/dist won\'t be resolved',
        fix: 'rm -rf node_modules/@stacksjs/stx && ln -s ../../pantry/@stacksjs/stx node_modules/@stacksjs/stx',
      })
    }
  }

  // 5. Framework cache — informational: the dev watcher clears it on edits.
  checks.push({
    name: 'dev runtime cache',
    status: 'info',
    detail: 'cleared automatically on source edits by the dev watcher (clearDevCaches, #1745 item C)',
  })

  // 6. Signals runtime sanity (length).
  if (options.generateRuntime) {
    try {
      const rt = options.generateRuntime()
      const len = rt.length
      checks.push(len > 1000
        ? { name: 'signals runtime', status: 'ok', detail: `generated ${len.toLocaleString()} chars` }
        : { name: 'signals runtime', status: 'warn', detail: `generated only ${len} chars — suspiciously short` })
    }
    catch (e) {
      checks.push({ name: 'signals runtime', status: 'error', detail: `failed to generate: ${(e as Error).message}` })
    }
  }

  return { checks, ok: !checks.some(c => c.status === 'error') }
}

/** Render a {@link DoctorReport} as an aligned, icon-prefixed terminal block. */
export function formatDoctorReport(report: DoctorReport): string {
  const icon: Record<CheckStatus, string> = { ok: '✓', warn: '⚠', error: '✗', info: '·' }
  const lines: string[] = ['stx runtime resolution:']
  for (const c of report.checks) {
    lines.push(`  ${icon[c.status]} ${c.name}: ${c.detail}`)
    if (c.fix)
      lines.push(`     → ${c.fix}`)
  }
  lines.push('')
  lines.push(report.ok ? '✓ All framework-runtime layers are aligned.' : '✗ A runtime layer is stale — see the fixes above.')
  return lines.join('\n')
}
