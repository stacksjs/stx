/**
 * `stx doctor` — runtime resolution + staleness diagnostics (stacksjs/stx#1745, Section D).
 *
 * Simulates a Stacks app's pantry layout in a temp dir and asserts the doctor
 * flags each staleness layer (stale dist, missing dist, non-symlinked
 * node_modules) and stays quiet when everything's aligned.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { findPantryPackage, formatDoctorReport, runDoctor } from '../../src/doctor'

let dir: string

async function touchFile(p: string, content = '// x', mtimeSecondsAgo = 0): Promise<void> {
  await writeFile(p, content)
  if (mtimeSecondsAgo > 0) {
    const t = new Date(Date.now() - mtimeSecondsAgo * 1000)
    await utimes(p, t, t)
  }
}

// Build a pantry skeleton: pantry/@stacksjs/stx/{src/signals.ts, dist/index.js}.
async function makePantry(root: string, opts: { distAgeSeconds?: number, srcAgeSeconds?: number, noDist?: boolean } = {}): Promise<string> {
  const pkg = join(root, 'pantry/@stacksjs/stx')
  await mkdir(join(pkg, 'src'), { recursive: true })
  await mkdir(join(pkg, 'dist'), { recursive: true })
  await touchFile(join(pkg, 'src/signals.ts'), '// src', opts.srcAgeSeconds ?? 0)
  if (!opts.noDist)
    await touchFile(join(pkg, 'dist/index.js'), '// dist', opts.distAgeSeconds ?? 0)
  return pkg
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'stx-doctor-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('runDoctor (#1745 Section D)', () => {
  const noResolve = () => null // pretend nothing is installed; isolate the pantry checks

  it('reports info (no error) when there is no pantry', async () => {
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    expect(report.ok).toBe(true)
    expect(report.checks.find(c => c.name === 'pantry')?.status).toBe('info')
  })

  it('flags a stale pantry dist (older than src) as an error with a rebuild fix', async () => {
    // src is recent, dist is 2 hours old → stale.
    await makePantry(dir, { srcAgeSeconds: 0, distAgeSeconds: 7200 })
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    const c = report.checks.find(ck => ck.name === 'pantry dist freshness')!
    expect(c.status).toBe('error')
    expect(c.detail).toContain('OLDER')
    expect(c.fix).toContain('bun build.ts')
    expect(report.ok).toBe(false)
  })

  it('passes when the pantry dist is newer than src', async () => {
    // src is 2h old, dist is fresh → ok.
    await makePantry(dir, { srcAgeSeconds: 7200, distAgeSeconds: 0 })
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    const c = report.checks.find(ck => ck.name === 'pantry dist freshness')!
    expect(c.status).toBe('ok')
    expect(report.ok).toBe(true)
  })

  it('errors when the pantry has src but no built dist', async () => {
    await makePantry(dir, { noDist: true })
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    const c = report.checks.find(ck => ck.name === 'pantry dist freshness')!
    expect(c.status).toBe('error')
    expect(c.fix).toContain('bun build.ts')
  })

  it('warns when node_modules/@stacksjs/stx is a real dir, not a pantry symlink', async () => {
    await makePantry(dir, { srcAgeSeconds: 7200, distAgeSeconds: 0 })
    // A real (non-symlinked) node_modules entry.
    await mkdir(join(dir, 'node_modules/@stacksjs/stx'), { recursive: true })
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    const c = report.checks.find(ck => ck.name === 'node_modules → pantry')!
    expect(c.status).toBe('warn')
    expect(c.fix).toContain('ln -s')
  })

  it('passes node_modules check when it is symlinked to pantry', async () => {
    const pkg = await makePantry(dir, { srcAgeSeconds: 7200, distAgeSeconds: 0 })
    await mkdir(join(dir, 'node_modules/@stacksjs'), { recursive: true })
    await symlink(pkg, join(dir, 'node_modules/@stacksjs/stx'))
    const report = await runDoctor({ cwd: dir, resolve: noResolve })
    const c = report.checks.find(ck => ck.name === 'node_modules → pantry')!
    expect(c.status).toBe('ok')
    expect(report.ok).toBe(true)
  })

  it('runs the injected runtime sanity check', async () => {
    const report = await runDoctor({ cwd: dir, resolve: noResolve, generateRuntime: () => 'x'.repeat(50_000) })
    const c = report.checks.find(ck => ck.name === 'signals runtime')!
    expect(c.status).toBe('ok')
    expect(c.detail).toContain('50,000')
  })

  it('flags a suspiciously short runtime', async () => {
    const report = await runDoctor({ cwd: dir, resolve: noResolve, generateRuntime: () => 'tiny' })
    expect(report.checks.find(ck => ck.name === 'signals runtime')?.status).toBe('warn')
  })

  it('reports the resolved entry path when resolvable', async () => {
    const report = await runDoctor({ cwd: dir, resolve: spec => (spec === '@stacksjs/stx' ? '/somewhere/dist/index.js' : null) })
    expect(report.checks.find(c => c.name === '@stacksjs/stx resolves to')?.detail).toBe('/somewhere/dist/index.js')
  })
})

describe('findPantryPackage', () => {
  it('finds a pantry package by walking up from a nested cwd', async () => {
    const pkg = await makePantry(dir)
    const nested = join(dir, 'apps/web/src')
    await mkdir(nested, { recursive: true })
    expect(findPantryPackage(nested, 'stx')).toBe(pkg)
  })

  it('returns null when no pantry exists', () => {
    expect(findPantryPackage(dir, 'stx')).toBeNull()
  })
})

describe('formatDoctorReport', () => {
  it('renders icons + fix hints and a summary line', () => {
    const out = formatDoctorReport({
      ok: false,
      checks: [
        { name: 'pantry dist freshness', status: 'error', detail: 'stale', fix: 'bun build.ts' },
        { name: 'pantry', status: 'info', detail: 'none' },
      ],
    })
    expect(out).toContain('✗ pantry dist freshness: stale')
    expect(out).toContain('→ bun build.ts')
    expect(out).toContain('· pantry: none')
    expect(out).toContain('A runtime layer is stale')
  })
})
