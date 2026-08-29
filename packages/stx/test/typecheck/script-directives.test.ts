/**
 * A directive inside a script body is not JavaScript, and must not be read as it.
 *
 * A template can loop inside a script — building a lookup table from server
 * data is the obvious use — and the directive is expanded away long before the
 * browser sees the file:
 *
 *   const data = {
 *     (at)foreach(features as f)
 *       '{{ f.id }}': { title: '{{ f.title }}' },
 *     (at)endforeach
 *   }
 *
 * Handed to TypeScript verbatim, the directive line is a syntax error — and
 * checking bare `<script>` blocks (#1920) made one valid example page report 37
 * invented syntax errors. That is worse than the miss it replaced: a checker
 * that invents errors on working code gets muted, and a muted gate catches
 * nothing. The same class of failure the interpolation substitution already
 * exists to prevent (#1894).
 *
 * A syntax error also mutes SEMANTIC checking program-wide, so an invented one
 * does not merely add noise — it takes real diagnostics down with it.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { blankScriptDirectives } from '../../src/stx-virtual-ts'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = join(tmpdir(), `stx-dir-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

describe('blankScriptDirectives', () => {
  it('blanks a directive that owns its line', () => {
    const out = blankScriptDirectives('  @foreach(items as item)\nconst a = 1\n  @endforeach')

    expect(out).toBe('                         \nconst a = 1\n             ')
  })

  it('keeps every line number after it', () => {
    // Blanked rather than removed, so a diagnostic still points at the line the
    // author wrote. The right error on the wrong line is its own bug.
    const out = blankScriptDirectives('@if(x)\nconst a = 1\n@endif\nconst b = 2')

    expect(out.split('\n')).toHaveLength(4)
    expect(out.split('\n')[3]).toBe('const b = 2')
  })

  it('leaves an email address and a decorator alone', () => {
    // Only a KNOWN directive alone on its line is matched. Matching any
    // line-leading `@identifier` would blank a decorator, and matching anywhere
    // would eat the string.
    const source = [
      'const to = "hi@if.example.com"',
      '@Component({ selector: "x" })',
      'class Thing {}',
    ].join('\n')

    expect(blankScriptDirectives(source)).toBe(source)
  })

  it('leaves a directive that shares its line with code', () => {
    // Blanking the line would delete the code beside it, which is a silent
    // change of meaning rather than a missed check.
    const source = 'const a = 1 @endif'

    expect(blankScriptDirectives(source)).toBe(source)
  })
})

describe('a script that loops over server data', () => {
  it('reports no syntax error', async () => {
    const file = join(dir, 'loop.stx')
    await Bun.write(file, `<script server>
const features = [{ id: 'a', title: 'A' }]
</script>
<script>
const data = {
  @foreach(features as f)
    '{{ f.id }}': { title: '{{ f.title }}' },
  @endforeach
}
</script>`)

    const result = await typecheckStxFiles([file], { templates: false })

    expect(result.blockCount).toBe(2)
    // TS1xxx is TypeScript's syntax range; this checker's own warnings sit at 0.
    expect(result.diagnostics.filter(d => d.code >= 1000 && d.code < 2000)).toHaveLength(0)
  })

  it('still reports a real error on the line the author wrote it on', async () => {
    // The blanking must not cost the position. A directive above the mistake
    // shifts every line below it if the replacement is not the same height.
    const file = join(dir, 'position.stx')
    await Bun.write(file, `<script>
const rows = {
  @foreach(items as item)
  a: 1,
  @endforeach
}
const n: number = "definitely a string"
</script>`)

    const result = await typecheckStxFiles([file], { templates: false })
    const wrongType = result.diagnostics.find(d => d.code === 2322)

    expect(wrongType).toBeDefined()
    expect(wrongType!.line).toBe(7)
  })
})
