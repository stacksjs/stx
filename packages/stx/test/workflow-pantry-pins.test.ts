/**
 * Every workflow provisions its runtime from the same pinned Pantry.
 *
 * The pins drifted: eleven pairs sat at v0.11.163, five at v0.11.92 and one at
 * v0.11.99, so what a job installed depended on which workflow it ran in. The
 * v0.2.809 source CI then failed in native setup before any signing test, with
 * an immutable Pantry restoring a native cache and git returning
 * PathAlreadyExists (stacksjs/stx#2166).
 *
 * The invariant is consistency and immutability, not any particular version:
 * a 40-character commit SHA rather than a movable tag, the `# vX.Y.Z` comment
 * telling the truth about that SHA, and one version across every workflow. A
 * bump stays a one-line edit per pair and this test keeps them in step.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

const ACTION = 'pantry-pm/pantry/packages/action@'
const root = resolve(import.meta.dir, '../../..')
const workflows = join(root, '.github/workflows')

interface Step { uses?: string, with?: Record<string, unknown> }
interface Workflow { jobs?: Record<string, { steps?: Step[] }> }

interface Pin { file: string, sha: string, comment: string, version: string }

async function pins(): Promise<Pin[]> {
  const found: Pin[] = []
  for (const file of (await readdir(workflows)).filter(name => name.endsWith('.yml'))) {
    const text = await readFile(join(workflows, file), 'utf8')
    const parsed = Bun.YAML.parse(text) as Workflow

    // The declared version comes from the parsed step; the SHA and its comment
    // come from the raw text, because YAML parsing discards comments.
    const declared: string[] = []
    for (const job of Object.values(parsed.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        if (typeof step.uses === 'string' && step.uses.startsWith(ACTION))
          declared.push(String(step.with?.version ?? ''))
      }
    }

    const written = [...text.matchAll(/pantry-pm\/pantry\/packages\/action@([0-9a-f]+)\s*#\s*v([\d.]+)/g)]
    expect(written.length, `${file}: parsed steps and written refs disagree`).toBe(declared.length)
    written.forEach((match, index) => {
      found.push({ file, sha: match[1]!, comment: match[2]!, version: declared[index]! })
    })
  }
  return found
}

describe('pantry pins across owned workflows', () => {
  it('pins every provisioning step to an immutable commit, not a tag', async () => {
    const all = await pins()
    expect(all.length).toBeGreaterThan(0)

    for (const pin of all)
      expect(pin.sha, `${pin.file} is not pinned to a 40-character commit`).toHaveLength(40)
  })

  it('agrees between the pinned SHA, its comment and the installed CLI', async () => {
    for (const pin of await pins())
      expect(pin.version, `${pin.file}: CLI version disagrees with the ref comment`).toBe(pin.comment)
  })

  it('provisions one and the same Pantry in every workflow', async () => {
    const all = await pins()
    const versions = [...new Set(all.map(pin => pin.version))]
    const shas = [...new Set(all.map(pin => pin.sha))]

    expect(versions, `workflows disagree on the Pantry version: ${versions.join(', ')}`).toHaveLength(1)
    expect(shas, `workflows disagree on the pinned commit: ${shas.join(', ')}`).toHaveLength(1)
  })
})
