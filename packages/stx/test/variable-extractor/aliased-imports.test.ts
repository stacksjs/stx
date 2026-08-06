import { describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { convertToCommonJS, extractVariables, isMissingBindingFailure, isModuleResolutionFailure } from '../../src/variable-extractor'

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

/**
 * An import that does not resolve must never be silent.
 *
 * When a server script throws, stx falls back to static extraction and says
 * nothing - deliberately, because a page using only client APIs legitimately
 * lands there. An unresolvable import is not that case: it means a wrong path,
 * and it takes every binding in the script down with it, not just the imported
 * one. The page then renders its empty-state branch and reads as a correct
 * answer rather than a failure.
 *
 * An off-by-one in a relative import - four `../` where the file needed five -
 * cost hours to find for exactly this reason.
 */
describe('isModuleResolutionFailure', () => {
  it('recognises the wordings Bun and Node use', () => {
    expect(isModuleResolutionFailure('Cannot find module \'../x\'')).toBe(true)
    expect(isModuleResolutionFailure('Could not resolve: "../x"')).toBe(true)
    expect(isModuleResolutionFailure('Module not found')).toBe(true)
    expect(isModuleResolutionFailure('Failed to resolve entry')).toBe(true)
  })

  it('does not claim an ordinary runtime error', () => {
    // These are the failures the silence exists for.
    expect(isModuleResolutionFailure('document is not defined')).toBe(false)
    expect(isModuleResolutionFailure('x.map is not a function')).toBe(false)
  })
})

describe('an unresolvable import is reported', () => {
  it('warns rather than falling through quietly', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-badimport-'))
    const warnings: string[] = []
    const original = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')) }

    try {
      const ctx: Record<string, any> = {}
      await extractVariables(
        `import { nope } from './does-not-exist'\nconst value = 1\n`,
        ctx,
        path.join(dir, 'page.stx'),
      )

      expect(warnings.some(w => w.includes('does not resolve'))).toBe(true)
    }
    finally {
      console.warn = original
      await rm(dir, { recursive: true, force: true })
    }
  })
})

/**
 * A script that names something which does not exist.
 *
 * The same category as an unresolvable import, and it earns the same
 * unconditional warning for the same reason: a page using only client APIs
 * fails on `document` or `window`, and on nothing else. Anything else that is
 * "not defined" is a bug, and it takes every binding in the script with it.
 *
 * What makes it worth naming separately is that optional chaining looks like it
 * should help and does not. `ctx?.value` guards an undefined *property*; an
 * undefined *identifier* throws before the chain is reached. A view written
 * carefully in that style still renders every variable undefined, and every
 * page reads as a correct empty answer.
 */
describe('isMissingBindingFailure', () => {
  it('recognises the wordings the engines use', () => {
    expect(isMissingBindingFailure('__stxServeContext is not defined')).toBe(true)
    expect(isMissingBindingFailure("Can't find variable: someHelper")).toBe(true)
  })

  it('leaves the browser globals alone, which are the legitimate case', () => {
    expect(isMissingBindingFailure('document is not defined')).toBe(false)
    expect(isMissingBindingFailure('window is not defined')).toBe(false)
    expect(isMissingBindingFailure('localStorage is not defined')).toBe(false)
  })

  it('does not claim an ordinary runtime error', () => {
    expect(isMissingBindingFailure('x.map is not a function')).toBe(false)
    expect(isMissingBindingFailure('Cannot find module \'../x\'')).toBe(false)
  })
})
