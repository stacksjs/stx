import { describe, expect, it } from 'bun:test'
import { resolve } from 'node:path'
import { convertToCommonJS } from '../../src/variable-extractor'

/**
 * STX rewrites static `import` statements so the bundled stx serve.js can
 * resolve template-relative paths (`'../bar'`) to the user's project, not
 * stx's own dist directory. The dynamic form `await import('./foo')` is
 * just as common in `<script server>` blocks (especially for lazy-loading
 * heavy modules) and needs the same path treatment, otherwise every dynamic
 * import in a user template 404s.
 */
describe('convertToCommonJS — dynamic import path resolution', () => {
  const templateFile = '/Users/test/project/views/dashboard/page.stx'
  const templateDir = '/Users/test/project/views/dashboard'

  it('resolves a relative path in a top-level destructured await import', () => {
    const out = convertToCommonJS(
      `const { foo } = await import('../helpers/data')`,
      templateFile,
    )
    expect(out).toContain(`await import('${resolve(templateDir, '../helpers/data')}')`)
    expect(out).not.toContain(`await import('../helpers/data')`)
  })

  it('resolves a relative path in a top-level default await import', () => {
    const out = convertToCommonJS(
      `const data = await import('./local')`,
      templateFile,
    )
    expect(out).toContain(`await import('${resolve(templateDir, './local')}')`)
  })

  it('leaves bare-specifier dynamic imports untouched', () => {
    const out = convertToCommonJS(
      `const fs = await import('node:fs')`,
      templateFile,
    )
    expect(out).toContain(`await import('node:fs')`)
  })

  it('leaves absolute-path dynamic imports untouched', () => {
    const out = convertToCommonJS(
      `const m = await import('/abs/path/foo')`,
      templateFile,
    )
    expect(out).toContain(`await import('/abs/path/foo')`)
  })

  it('rewrites multiple dynamic imports in the same script', () => {
    const out = convertToCommonJS(
      [
        `const a = await import('./a')`,
        `const b = await import('../b')`,
        `const c = await import('./nested/c')`,
      ].join('\n'),
      templateFile,
    )
    expect(out).toContain(`await import('${resolve(templateDir, './a')}')`)
    expect(out).toContain(`await import('${resolve(templateDir, '../b')}')`)
    expect(out).toContain(`await import('${resolve(templateDir, './nested/c')}')`)
  })

  it('handles double-quoted dynamic imports', () => {
    const out = convertToCommonJS(
      `const m = await import("./double")`,
      templateFile,
    )
    expect(out).toContain(`await import("${resolve(templateDir, './double')}")`)
  })

  it('rewrites a dynamic import inside a function body', () => {
    const out = convertToCommonJS(
      `function load() { return await import('./lazy') }`,
      templateFile,
    )
    expect(out).toContain(`await import('${resolve(templateDir, './lazy')}')`)
  })

  it('rewrites a dynamic import in a chained expression', () => {
    const out = convertToCommonJS(
      `const m = (await import('./mod')).default`,
      templateFile,
    )
    expect(out).toContain(`await import('${resolve(templateDir, './mod')}')`)
  })

  it('does not touch literal "await import(" inside string content', () => {
    const out = convertToCommonJS(
      'const code = "await import(\'./foo\')"',
      templateFile,
    )
    expect(out).not.toContain(resolve(templateDir, './foo'))
    expect(out).toContain(`await import('./foo')`)
  })

  it('falls back to cwd when no filePath is provided', () => {
    const out = convertToCommonJS(`const m = await import('./local')`)
    expect(out).toContain(`await import('${resolve(process.cwd(), './local')}')`)
  })
})
