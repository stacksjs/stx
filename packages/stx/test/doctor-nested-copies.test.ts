/**
 * `stx doctor` reports the copy that actually renders, not just the one at the
 * app root (stacksjs/stx#2052).
 *
 * An app served every page through
 * `node_modules/@stacksjs/buddy/node_modules/@stacksjs/stx` at 0.2.343 while
 * its top level was 0.2.401 — **58 versions** apart — and doctor reported all
 * layers aligned. Both of its resolution checks were correct and both answered
 * the wrong question: they ask what a specifier means from the app root, and
 * Bun resolves from the importing file, so a CLI executing inside its own
 * package gets its own nested copy.
 *
 * The symptom was a config flag that appeared inert in production. It was not
 * inert; the renderer predated it. Nothing in the stack said so, and the usual
 * way of looking — `grep -r` — does not follow symlinks, so a symlinked layer
 * hides from the first search anyone reaches for.
 */
import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { findInstalledCopies, runDoctor, versionAgreementChecks } from '../src/doctor'

/** Write a package.json at `dir` with just a name and version. */
function pkg(dir: string, name: string, version: string): void {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }))
}

/** The layout the issue found: a stale stx nested inside the serve tool. */
function appWithNestedStx(topVersion: string, nestedVersion: string | null): string {
  const root = mkdtempSync(path.join(tmpdir(), 'stx-doctor-'))
  pkg(path.join(root, 'node_modules', '@stacksjs', 'stx'), '@stacksjs/stx', topVersion)
  pkg(path.join(root, 'node_modules', 'bun-plugin-stx'), 'bun-plugin-stx', topVersion)
  pkg(path.join(root, 'node_modules', '@stacksjs', 'buddy'), '@stacksjs/buddy', '1.0.0')
  if (nestedVersion !== null) {
    pkg(
      path.join(root, 'node_modules', '@stacksjs', 'buddy', 'node_modules', '@stacksjs', 'stx'),
      '@stacksjs/stx',
      nestedVersion,
    )
  }
  return root
}

describe('finding every installed copy', () => {
  it('finds a copy nested inside another package', () => {
    const root = appWithNestedStx('0.2.401', '0.2.343')
    const copies = findInstalledCopies(root).filter(copy => copy.name === '@stacksjs/stx')
    expect(copies.map(copy => copy.version).sort()).toEqual(['0.2.343', '0.2.401'])
  })

  it('says which one is nested, since that is the one a tool resolves', () => {
    const root = appWithNestedStx('0.2.401', '0.2.343')
    const nested = findInstalledCopies(root).find(copy => copy.version === '0.2.343')
    expect(nested?.nested).toBe(true)
    expect(nested?.dir).toContain('buddy')
  })

  it('finds a copy reached through a symlink', () => {
    // `grep -r` does not follow symlinks, which is the second blind spot this
    // had: the layer is present and the obvious search cannot see it.
    const root = appWithNestedStx('0.2.401', null)
    const real = mkdtempSync(path.join(tmpdir(), 'stx-linked-'))
    pkg(path.join(real, '@stacksjs', 'stx'), '@stacksjs/stx', '0.2.343')
    const toolModules = path.join(root, 'node_modules', '@stacksjs', 'buddy', 'node_modules')
    fs.mkdirSync(path.dirname(toolModules), { recursive: true })
    fs.symlinkSync(real, toolModules)

    const versions = findInstalledCopies(root)
      .filter(copy => copy.name === '@stacksjs/stx')
      .map(copy => copy.version)
      .sort()
    expect(versions).toEqual(['0.2.343', '0.2.401'])
  })

  it('reports one copy when there is only one', () => {
    const root = appWithNestedStx('0.2.401', null)
    expect(findInstalledCopies(root).filter(copy => copy.name === '@stacksjs/stx')).toHaveLength(1)
  })
})

describe('what doctor says about it', () => {
  it('errors when two versions are installed', async () => {
    const root = appWithNestedStx('0.2.401', '0.2.343')
    const report = await runDoctor({ cwd: root, generateRuntime: () => 'x'.repeat(100_000) })
    const disagreement = report.checks.find(check => check.name.includes('copies disagree'))

    expect(disagreement).toBeTruthy()
    expect(disagreement!.status).toBe('error')
    // Both versions named, so the report is actionable without another command.
    expect(disagreement!.detail).toContain('0.2.343')
    expect(disagreement!.detail).toContain('0.2.401')
    expect(report.ok).toBe(false)
  })

  it('offers a check that follows symlinks, unlike the one people try', async () => {
    const root = appWithNestedStx('0.2.401', '0.2.343')
    const report = await runDoctor({ cwd: root, generateRuntime: () => 'x'.repeat(100_000) })
    const disagreement = report.checks.find(check => check.name.includes('copies disagree'))
    expect(disagreement!.fix).toContain('find -L')
  })

  it('stays quiet when the only copy is the top-level one', async () => {
    const root = appWithNestedStx('0.2.401', null)
    const report = await runDoctor({ cwd: root, generateRuntime: () => 'x'.repeat(100_000) })
    expect(report.checks.some(check => check.name.includes('disagree'))).toBe(false)
  })

  it('does not call duplication a failure when the versions match', async () => {
    // A nested copy at the same version is harmless. Flagging it would train
    // people to ignore this check, which is how a real one gets missed.
    const root = appWithNestedStx('0.2.401', '0.2.401')
    const report = await runDoctor({ cwd: root, generateRuntime: () => 'x'.repeat(100_000) })
    const note = report.checks.find(check => check.name.includes('copies'))
    expect(note?.status).toBe('info')
    expect(report.ok).toBe(true)
  })
})

describe('agreement, decided on the copies alone', () => {
  it('names every path so the stale layer is identifiable', () => {
    const checks = versionAgreementChecks([
      { name: '@stacksjs/stx', version: '0.2.401', dir: 'node_modules/@stacksjs/stx', nested: false },
      { name: '@stacksjs/stx', version: '0.2.343', dir: 'node_modules/@stacksjs/buddy/node_modules/@stacksjs/stx', nested: true },
    ])
    expect(checks).toHaveLength(1)
    expect(checks[0].detail).toContain('node_modules/@stacksjs/buddy/node_modules/@stacksjs/stx')
  })

  it('checks the renderer package too, not only the framework', () => {
    // Two of the six apps in the report served through a stale bun-plugin-stx
    // rather than a stale stx, so both packages have to be covered.
    const checks = versionAgreementChecks([
      { name: 'bun-plugin-stx', version: '0.2.401', dir: 'node_modules/bun-plugin-stx', nested: false },
      { name: 'bun-plugin-stx', version: '0.2.315', dir: 'node_modules/@stacksjs/buddy/node_modules/bun-plugin-stx', nested: true },
    ])
    expect(checks).toHaveLength(1)
    expect(checks[0].status).toBe('error')
  })
})
