/**
 * The one-buffer-per-file form the editor plugin type-checks (stacksjs/stx#2028).
 *
 * Turning the plugin on for `.stx` files put every component of a real app
 * through `buildVirtualTypeScript`, and each rule below is a false error that
 * run produced on code that works - measured over the 620 files of one app and
 * the framework's own 611, where the editor now reports what `stx typecheck`
 * reports and nothing else.
 */
import { describe, expect, it } from 'bun:test'
import { STX_RUNTIME_GLOBALS } from '../../src/runtime-globals'
import {
  buildVirtualTypeScript,
  collectImportedNames,
  extractScriptBlocks,
  isTemplateArtefact,
  resolvePosition,
} from '../../src/stx-virtual-ts'

const lines = (source: string, options: Parameters<typeof buildVirtualTypeScript>[1] = {}) =>
  buildVirtualTypeScript(source, options).text.split('\n')

describe('positions', () => {
  it('keeps a body that starts on the tag line at its column', () => {
    const source = '<div></div>\n<script client>const a: number = "x"</script>'
    const [block] = extractScriptBlocks(source)
    expect(block.startColumn).toBe('<script client>'.length + 1)
    expect(lines(source)[1].indexOf('const')).toBe('<script client>'.length)
  })

  it('substitutes interpolations and directive lines in a body without moving anything', () => {
    // `const url = {{ blogUrl }}` is a server value interpolated into a client
    // script. As TypeScript it is a syntax error, and one parse error hides
    // every real diagnostic in the file.
    const source = '<script client>\nconst url = {{ blogUrl }}\n@if (x)\nconst n = 1\n@endif\n</script>'
    const virtual = lines(source)
    expect(virtual[1]).toBe(`const url = 0${' '.repeat('{{ blogUrl }}'.length - 1)}`)
    expect(virtual[2].trim()).toBe('')
    expect(virtual[3]).toBe('const n = 1')
  })
})

describe('the blocks share one buffer', () => {
  it('ends every block with a statement boundary', () => {
    // A server block ending `: 0` and a client block opening `(window as …)`
    // read as `0(window as …)` - "This expression is not callable".
    const source = [
      '<script server>',
      'const n = ok',
      '  ? 1',
      '  : 0',
      '</script>',
      '<script client>',
      '(window as any).x = 1',
      '</script>',
    ].join('\n')
    const virtual = lines(source)
    expect(virtual[4]).toBe(';')
    expect(virtual[6]).toBe('(window as any).x = 1')
  })

  it('does not declare a context name a block binds itself', () => {
    // `declare var query: any` beside `const { query } = defineProps()` is
    // "Cannot redeclare block-scoped variable"; so is an import of one.
    const source = '<script client>\nimport { definePageMeta } from \'stx\'\nconst { query = \'\' } = defineProps<{ query?: string }>()\n</script>'
    const text = buildVirtualTypeScript(source).text
    expect(text).not.toContain('declare var query: any')
    expect(text).not.toContain('declare var definePageMeta: any')
    expect(text).toContain('declare var params: any')
  })

  it('can declare the context globally, so a block binding shadows it', () => {
    // A destructuring the declaration scan cannot read still must not collide.
    const source = '<script>\nconst { items = [{ id: 1 }], query = \'\' } = defineProps()\n</script>'
    const text = buildVirtualTypeScript(source, { contextScope: 'global', runtimeGlobals: false }).text
    expect(text).toContain('declare global {\n  var params: any')
    expect(text).toContain('  var query: any')
    expect(text).not.toMatch(/^declare var query/m)
    // Typed by stx.d.ts when it is in the program; an `any` beside it would
    // conflict with its `declare function`.
    for (const name of STX_RUNTIME_GLOBALS)
      expect(text).not.toContain(`  var ${name}: any`)
  })
})

describe('the declaration reference', () => {
  it('is written on line 1 when that line is free', () => {
    const virtual = buildVirtualTypeScript('<script server>\nconst a = 1\n</script>', { reference: '/ext/types/stx-module.d.ts' })
    expect(virtual.referenced).toBe(true)
    expect(virtual.text.split('\n')[0]).toBe('/// <reference path="/ext/types/stx-module.d.ts" />')
    expect(virtual.text.split('\n')[1]).toBe('const a = 1')
  })

  it('is left out, and says so, when code sits on line 1', () => {
    const virtual = buildVirtualTypeScript('<script>const a = 1</script>', { reference: '/x.d.ts' })
    expect(virtual.referenced).toBe(false)
    expect(virtual.text).not.toContain('reference')
  })
})

describe('collectImportedNames', () => {
  it('returns every local name an import binds', () => {
    expect(collectImportedNames([
      'import a, { b as c, type D } from \'x\'',
      'import * as ns from "y"',
      'import type { T } from \'z\'',
      'import {',
      '  defineProps,',
      '  withDefaults,',
      '} from \'stx\'',
      'import \'side-effect\'',
      'const s = \'import q from "w"\'',
    ].join('\n'))).toEqual(['D', 'T', 'a', 'c', 'defineProps', 'ns', 'withDefaults'])
  })
})

describe('template artefacts', () => {
  const source = '<script client>\nconst ready = state(false)\n</script>\n@if (ready)\n<p x-class="ready ? \'\' : \'hidden\'">x</p>\n@endif'
  const virtual = buildVirtualTypeScript(source)
  const [line, mapped] = [...virtual.lineMap.entries()].find(([, m]) => m.expression?.code.includes('hidden'))!

  it('drops TS2774 on a template expression, which the unwrap makes wrong', () => {
    const at = resolvePosition(virtual, line, (mapped.prefixLength ?? 0) + 1)!
    expect(isTemplateArtefact(at, 2774)).toBe(true)
    expect(isTemplateArtefact(at, 2322)).toBe(false)
  })

  it('drops a hit inside the guard wrapper, which is about the condition', () => {
    const at = resolvePosition(virtual, line, 1)!
    expect(at.inGuard).toBe(true)
    expect(isTemplateArtefact(at, 18047)).toBe(true)
  })

  it('keeps TS2774 in a script block, where it is a true positive', () => {
    expect(isTemplateArtefact(resolvePosition(virtual, 2, 7)!, 2774)).toBe(false)
  })
})
