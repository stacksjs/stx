import { describe, expect, it } from 'bun:test'
import { absolutizeRelativeImports, absolutizeTemplateImports } from '../src/import-rebase'

const LAYOUT = '/app/resources/layouts/default.stx'

describe('absolutizeRelativeImports', () => {
  it('resolves a parent-relative import against the file that wrote it', () => {
    // The bug: written in resources/layouts, resolved from resources/views/trail.
    expect(absolutizeRelativeImports(`import { useWildLoopApp } from '../composables/useWildLoopApp'`, LAYOUT))
      .toBe(`import { useWildLoopApp } from '/app/resources/composables/useWildLoopApp'`)
  })

  it('handles every specifier position', () => {
    const code = [
      `import a from './a'`,
      `import { b } from '../b'`,
      `import '../../side-effect'`,
      `export { c } from './c'`,
      `export * from './d'`,
      `const e = await import('./e')`,
    ].join('\n')

    const out = absolutizeRelativeImports(code, LAYOUT)
    expect(out).toContain(`from '/app/resources/layouts/a'`)
    expect(out).toContain(`from '/app/resources/b'`)
    expect(out).toContain(`import '/app/side-effect'`)
    expect(out).toContain(`export { c } from '/app/resources/layouts/c'`)
    expect(out).toContain(`export * from '/app/resources/layouts/d'`)
    expect(out).toContain(`import('/app/resources/layouts/e')`)
  })

  it('leaves specifiers whose meaning does not depend on location', () => {
    const code = [
      `import { serve } from 'bun-plugin-stx'`,
      `import { thing } from '@stacksjs/browser'`,
      `import { alias } from '@/composables/alias'`,
      `import { abs } from '/already/absolute'`,
    ].join('\n')

    expect(absolutizeRelativeImports(code, LAYOUT)).toBe(code)
  })

  it('handles double quotes as readily as single', () => {
    expect(absolutizeRelativeImports(`import x from "../x"`, LAYOUT))
      .toBe(`import x from "/app/resources/x"`)
  })

  it('is a no-op without a source file, rather than resolving against the cwd', () => {
    const code = `import x from '../x'`
    expect(absolutizeRelativeImports(code, '')).toBe(code)
  })

  it('does not touch a word that merely ends in "import"', () => {
    const code = `const autoimport = './not-an-import'`
    expect(absolutizeRelativeImports(code, LAYOUT)).toBe(code)
  })
})

describe('absolutizeTemplateImports', () => {
  it('rewrites inside script blocks only', () => {
    const template = [
      `<a href="../not-an-import">link</a>`,
      `<script client>`,
      `  import { useFoo } from '../composables/useFoo'`,
      `</script>`,
      `<p>see '../docs' for more</p>`,
    ].join('\n')

    const out = absolutizeTemplateImports(template, LAYOUT)
    expect(out).toContain(`from '/app/resources/composables/useFoo'`)
    // Markup and prose are not code and must survive untouched.
    expect(out).toContain(`<a href="../not-an-import">link</a>`)
    expect(out).toContain(`<p>see '../docs' for more</p>`)
  })

  it('handles several script blocks', () => {
    const template = [
      `<script server>import { a } from '../a'</script>`,
      `<div></div>`,
      `<script client>import { b } from '../b'</script>`,
    ].join('\n')

    const out = absolutizeTemplateImports(template, LAYOUT)
    expect(out).toContain(`from '/app/resources/a'`)
    expect(out).toContain(`from '/app/resources/b'`)
  })

  it('leaves a template with no scripts exactly as it was', () => {
    const template = `<div class="../x">plain markup</div>`
    expect(absolutizeTemplateImports(template, LAYOUT)).toBe(template)
  })

  it('keeps the script tag and its attributes intact', () => {
    const out = absolutizeTemplateImports(`<script client lang="ts">import x from './x'</script>`, LAYOUT)
    expect(out).toStartWith('<script client lang="ts">')
    expect(out).toEndWith('</script>')
  })
})
