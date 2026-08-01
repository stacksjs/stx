import { describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { convertToCommonJS, extractVariables } from '../../src/variable-extractor'

/**
 * `import { a as b }` in a `<script server>`.
 *
 * An import becomes destructuring, and the two spell renaming differently:
 * `import { a as b }` is `const { a: b }`. The import spelling was pasted
 * straight through, producing `const { a as b } = await import(…)` - a
 * SyntaxError. The whole script then failed to parse, so every binding in it
 * came back undefined, with nothing logged.
 *
 * That is the expensive part. A template whose values have all vanished renders
 * its empty-state branch, so the page reads as a correct answer to a question
 * nobody asked - a repository browser reporting "no such repository" for a
 * repository that plainly exists - rather than as a failure. And it only bites
 * when a barrel module re-exports under aliases, which is exactly the shape
 * `resources/functions` uses, because stx cannot parse `export … from`.
 */
describe('aliased named imports', () => {
  it('rewrites `as` into destructuring form, not the import form', () => {
    const out = convertToCommonJS(
      `import { tagNames as tagNamesImpl } from './mod'\nconst a = 1\n`,
      'test.stx',
    )

    expect(out).toContain('tagNames: tagNamesImpl')
    expect(out).not.toContain('tagNames as tagNamesImpl')
  })

  it('leaves an unaliased name alone', () => {
    const out = convertToCommonJS(
      `import { branchNames } from './mod'\nconst a = 1\n`,
      'test.stx',
    )

    expect(out).toContain('{ branchNames }')
  })

  it('handles a list mixing aliased and plain names', () => {
    const out = convertToCommonJS(
      `import { alpha, beta as betaLocal, gamma } from './mod'\nconst a = 1\n`,
      'test.stx',
    )

    expect(out).toContain('alpha')
    expect(out).toContain('beta: betaLocal')
    expect(out).toContain('gamma')
  })

  /**
   * The end-to-end shape: the local name has to actually hold the value. One
   * unbound name is enough to strand the script, and the neighbouring names
   * going missing with it is what makes the cause so hard to see.
   */
  it('binds every local name to its export', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-alias-'))
    try {
      await Bun.write(
        path.join(dir, 'mod.ts'),
        'export function tagNames() { return ["v1"] }\n'
        + 'export function branchNames() { return ["main"] }\n'
        + 'export const MAX = 7\n',
      )

      const ctx: Record<string, any> = {}
      await extractVariables(
        `import { tagNames as tagNamesImpl, branchNames, MAX as MAX_IMPL } from './mod'\n`
        + `const tagKind = typeof tagNamesImpl\n`
        + `const branchKind = typeof branchNames\n`
        + `const max = MAX_IMPL\n`,
        ctx,
        path.join(dir, 'page.stx'),
      )

      expect(ctx.tagKind).toBe('function')
      expect(ctx.branchKind).toBe('function')
      expect(ctx.max).toBe(7)
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
