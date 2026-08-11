/**
 * A scan that read nothing is not a pass (stacksjs/stx#1918).
 *
 * `stx a11y` joined its argument into a scan pattern, so only a DIRECTORY
 * worked. A file path became `<file>.stx/**` + `/*.stx` and matched nothing; a
 * glob became a doubled pattern and matched nothing. Both then took the empty
 * branch, which printed `✓ No accessibility issues found!` and exited 0 — on a
 * file with three SERIOUS findings.
 *
 * Its siblings were inverted the other way: `typecheck` took a glob and, handed
 * a directory, said it matched nothing. So each command was silent about exactly
 * the shape the other one documented.
 *
 * The direction of the silence is what made it expensive. The natural way to add
 * a checker to CI is to copy the line that already works:
 *
 *     - run: stx typecheck 'resources/**' + '/*.stx'
 *     - run: stx a11y      'resources/**' + '/*.stx'    # green forever
 *
 * That second line passes on every commit for the life of the project, and
 * nothing distinguishes it from a project with no accessibility problems. The
 * reporter quoted "a11y: 3" for a week, re-ran with a glob, got 0, and wrote
 * "down from 3" into a commit message. The count had not moved; the argument
 * had.
 *
 * Two fixes, and the second is the one that generalises: accept whichever shape
 * was typed, and never report success over an empty match set.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scanA11yTargets } from '../../src/a11y'
import { resolveStxTargets } from '../../src/resolve-stx-targets'

let dir = ''
let bad = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-a11y-targets-'))
  bad = path.join(dir, 'emails', 'subscription-confirmation.stx')
  // Three findings: no alt, a data table with no headers, an empty link.
  await Bun.write(bad, `<html lang="en"><body><main>
<img src="/logo.png">
<table cellpadding="0"><tr><td>Data</td></tr></table>
<a href="#"></a>
</main></body></html>`)
  // Genuinely clean: `<main>` included, because the DOM path also checks for a
  // main landmark and a fixture that trips an unrelated rule would test nothing.
  await Bun.write(path.join(dir, 'emails', 'clean.stx'), `<html lang="en"><body><main><p>fine</p></main></body></html>`)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('every argument shape finds the same issues', () => {
  it('a directory', async () => {
    const { results } = await scanA11yTargets(dir)

    expect(Object.keys(results)).toHaveLength(1)
  })

  it('an exact file path', async () => {
    // The row that is the whole bug in one line: the exact path of a file with
    // findings, previously reported clean.
    const { results, scannedFiles } = await scanA11yTargets(bad)

    expect(scannedFiles).toHaveLength(1)
    expect(results[bad]?.length ?? 0).toBeGreaterThan(0)
  })

  it('a glob', async () => {
    const { results, scannedFiles } = await scanA11yTargets(path.join(dir, '**/*.stx'))

    expect(scannedFiles.length).toBeGreaterThan(1)
    expect(Object.keys(results)).toHaveLength(1)
  })

  it('and they agree with each other', async () => {
    // The three shapes describing the same file must produce the same verdict,
    // or the argument determines the answer — which is what happened.
    const viaDir = await scanA11yTargets(dir)
    const viaFile = await scanA11yTargets(bad)
    const viaGlob = await scanA11yTargets(path.join(dir, '**/*.stx'))

    expect(viaFile.results[bad]).toEqual(viaDir.results[bad])
    expect(viaGlob.results[bad]).toEqual(viaDir.results[bad])
  })
})

describe('a scan that matched nothing', () => {
  it('reports that it read no files, rather than no issues', async () => {
    // `results` only ever contains files WITH violations, so an empty map meant
    // both "everything is clean" and "nothing was scanned". `scannedFiles` is
    // what tells them apart, and the CLI exits non-zero on the second.
    const { results, scannedFiles } = await scanA11yTargets(path.join(dir, 'zzz/**/*.stx'))

    expect(scannedFiles).toEqual([])
    expect(Object.keys(results)).toEqual([])
  })

  it('does the same for a directory that does not exist', async () => {
    // This used to throw ENOENT while a non-matching glob printed success, so
    // the failure mode was not even consistent with itself.
    const { scannedFiles } = await scanA11yTargets(path.join(dir, 'nope'))

    expect(scannedFiles).toEqual([])
  })

  it('distinguishes that from a real scan of clean files', async () => {
    // The case the success banner is actually for.
    const { results, scannedFiles } = await scanA11yTargets(path.join(dir, 'emails', 'clean.stx'))

    expect(scannedFiles).toHaveLength(1)
    expect(Object.keys(results)).toEqual([])
  })
})

describe('resolveStxTargets', () => {
  it('takes a directory, a file, or a glob', async () => {
    expect((await resolveStxTargets([dir])).length).toBe(2)
    expect(await resolveStxTargets([bad])).toEqual([bad])
    expect((await resolveStxTargets([path.join(dir, '**/*.stx')])).length).toBe(2)
  })

  it('returns nothing for a path that is not there', async () => {
    expect(await resolveStxTargets([path.join(dir, 'nope')])).toEqual([])
    expect(await resolveStxTargets([path.join(dir, 'nope/**/*.stx')])).toEqual([])
  })

  it('honours --no-recursive for a directory', async () => {
    // The files live in `emails/`, so a non-recursive scan of the root finds
    // none — and must say so rather than quietly recursing anyway.
    expect(await resolveStxTargets([dir], { recursive: false })).toEqual([])
  })

  it('de-duplicates overlapping targets', async () => {
    // Passing both a directory and a file inside it must not check that file
    // twice and report its issues twice.
    expect(await resolveStxTargets([dir, bad])).toHaveLength(2)
  })
})
