import { describe, expect, it } from 'bun:test'
import { transformAutoImports } from '../../src/client-script'

/**
 * Bun's bundle output separates runtime imports with blank lines, and renames
 * a colliding import (`state as state2`). Rewriting those imports must keep
 * each replacement on its own line: when one landed after the `//` comment
 * that replaces a plain import, its `var state2 = state` was commented out,
 * and every call to `state2(...)` threw ReferenceError — the activity page's
 * setup died and its <main> rendered empty.
 */
describe('auto-import rewrites keep their line breaks', () => {
  const declared = (code: string, name: string) => {
    // A declaration only counts when no line comment precedes it on its line.
    return code.split('\n').some((line) => {
      const at = line.search(new RegExp(`\\bvar\\b[^;]*\\b${name}\\s*=`))
      return at !== -1 && !line.slice(0, at).includes('//')
    })
  }

  it('does not comment out an aliased import that follows a plain one across a blank line', () => {
    const code = [
      'import { onMount } from "stx";',
      '',
      'import { state as state2 } from "stx";',
      '',
      'import { state as state3 } from "stx";',
      'const sharePreset = state2("square");',
      'const canPrompt = state3(false);',
    ].join('\n')

    const { code: out } = transformAutoImports(code)
    expect(declared(out, 'state2')).toBe(true)
    expect(declared(out, 'state3')).toBe(true)
    // Running it proves the bindings exist, not just that the text looks right.
    const run = new Function('state', 'onMount', `${out}\nreturn [sharePreset, canPrompt]`)
    expect(run((v: unknown) => ({ v }), () => {})).toEqual([{ v: 'square' }, { v: false }])
  })

  it('does not comment out an aliased import that follows a stripped type import', () => {
    const code = [
      'import type { Store } from "stx";',
      '',
      'import { state as state2 } from "stx";',
      'const open = state2(true);',
    ].join('\n')

    const { code: out } = transformAutoImports(code)
    expect(declared(out, 'state2')).toBe(true)
    const run = new Function('state', `${out}\nreturn open`)
    expect(run((v: unknown) => ({ v }))).toEqual({ v: true })
  })

  it('still rewrites indented imports', () => {
    const code = '  import { state as s2 } from "stx";\n  const x = s2(1);'
    const { code: out } = transformAutoImports(code)
    expect(out).not.toContain('import {')
    expect(declared(out, 's2')).toBe(true)
  })
})
