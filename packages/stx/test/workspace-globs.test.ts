/**
 * A built artifact must not become a workspace member.
 *
 * `workspaces` is `packages/**`, and `**` reaches inside `dist/`. Building
 * `stx-vscode` writes `packages/stx-vscode/dist/typescript-plugin/package.json`,
 * so the next `bun install` adopted it as a workspace and wrote two entries
 * into `bun.lock` -- including a resolution pointing at a **gitignored** path,
 * which does not exist in a fresh clone.
 *
 * The effect is a lockfile whose contents depend on whether you have built,
 * in a repo where several sessions commit to one tree and the standing rule is
 * to revert lockfile churn before committing. That makes the churn impossible
 * to tell apart from a real dependency change without reading it.
 *
 * Found by rebasing onto another session's work: `bun install` for their
 * lockfile produced six lines of diff that were nothing to do with them.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'

const ROOT = path.join(import.meta.dir, '..', '..', '..')

interface Patterns {
  include: string[]
  exclude: string[]
}

function workspacePatterns(): Patterns {
  // eslint-disable-next-line ts/no-require-imports
  const globs: string[] = require(path.join(ROOT, 'package.json')).workspaces
  return {
    include: globs.filter(glob => !glob.startsWith('!')),
    exclude: globs.filter(glob => glob.startsWith('!')).map(glob => glob.slice(1)),
  }
}

/** Whether the workspace globs would adopt this directory. */
function isWorkspace(dir: string, patterns: Patterns): boolean {
  const matches = (glob: string): boolean => new Bun.Glob(glob).match(dir)
  return patterns.include.some(matches) && !patterns.exclude.some(matches)
}

describe('the workspace globs', () => {
  it('adopt the real packages', () => {
    const patterns = workspacePatterns()
    for (const dir of ['packages/stx', 'packages/router', 'packages/components'])
      expect(isWorkspace(dir, patterns), dir).toBe(true)
  })

  it('do not adopt anything under a dist directory', () => {
    const patterns = workspacePatterns()
    // The exact path that caused the churn, plus the shape in general.
    for (const dir of [
      'packages/stx-vscode/dist/typescript-plugin',
      'packages/stx/dist',
      'packages/anything/dist/nested/deeper',
    ])
      expect(isWorkspace(dir, patterns), dir).toBe(false)
  })

  it('do not adopt any built package.json that exists right now', () => {
    // Behavioural rather than hypothetical: whatever is on disk in this
    // checkout, nothing under a dist may be a member. Passes trivially on a
    // clean tree and catches the real case after a build.
    const patterns = workspacePatterns()
    const built = [...new Bun.Glob('packages/**/dist/**/package.json').scanSync(ROOT)]
    for (const file of built) {
      const dir = path.dirname(file).split(path.sep).join('/')
      expect(isWorkspace(dir, patterns), dir).toBe(false)
    }
  })

  it('still excludes packages/vscode, which was already deliberate', () => {
    expect(isWorkspace('packages/vscode', workspacePatterns())).toBe(false)
  })
})
