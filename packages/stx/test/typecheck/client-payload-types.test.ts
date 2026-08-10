/**
 * Typing what crosses from `<script server>` into `<script client>` (#1868).
 *
 * The bridge publishes a server binding when its name appears as a free
 * identifier in the client source, so a page could not state what it expects
 * and client code defended with `typeof liveNow === 'number' ? liveNow : 0`.
 * `defineClientPayload({ liveNow, range })` made the set explicit; this makes
 * it checked.
 *
 * Two things had to be true before any of that was worth shipping, and neither
 * was:
 *
 * 1. `defineClientPayload` was not in the checker's global surface, so using
 *    the API the typed bridge is built on was itself "Cannot find name".
 * 2. A client block is checked in its own buffer, so every bridged value was
 *    "Cannot find name" too — `stx typecheck` reported an error on every page
 *    that used the bridge at all.
 *
 * Measured over 268 `.stx` files in this repo: 438 diagnostics before, 0 after,
 * with the two survivors turning out to be real bugs in example apps (a
 * single-quoted string spanning lines, and a misplaced quote putting a value
 * where a key belonged). A gate that invents errors gets muted, and a muted
 * gate catches nothing.
 */

import { describe, expect, it } from 'bun:test'
import {
  clientPayloadDeclarations,
  extractClientPayloadNames,
  splitTopLevelImports,
  substituteInterpolationsInPlace,
} from '../../src/stx-virtual-ts'
import { typecheckStxFiles } from '../../src/typecheck'

/** Type-check one `.stx` source and return its diagnostics. */
async function check(source: string) {
  const file = `${import.meta.dir}/.tmp-payload-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)
  try {
    const result = await typecheckStxFiles([file])
    return (result.diagnostics ?? []).map(d => ({ line: d.line, message: d.message }))
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

describe('reading the declared payload', () => {
  it('takes the keys, shorthand or not', () => {
    expect(extractClientPayloadNames(`defineClientPayload({ liveNow, range: computeRange() })`))
      .toEqual(['liveNow', 'range'])
  })

  it('is not confused by a comma inside a call', () => {
    // A plain split(',') publishes a name of `y)` here, and drops nothing —
    // which shows up as a missing binding at runtime rather than as an error.
    expect(extractClientPayloadNames(`defineClientPayload({ a: pick(x, y), b })`))
      .toEqual(['a', 'b'])
  })

  it('merges several calls, the way the runtime does', () => {
    // A layout and the page it wraps each declare their own crossings.
    expect(extractClientPayloadNames(`defineClientPayload({ a })\ndefineClientPayload({ b })`))
      .toEqual(['a', 'b'])
  })

  it('distinguishes "declared nothing" from "never declared"', () => {
    // `null` still gets the scraping bridge; `[]` publishes nothing on purpose.
    expect(extractClientPayloadNames(`const a = 1`)).toBeNull()
    expect(extractClientPayloadNames(`defineClientPayload({})`)).toEqual([])
  })
})

describe('projecting the payload into a client block', () => {
  it('types a name from the server block rather than annotating it', async () => {
    // The point of the whole thing: `liveNow` is a number because the server
    // block says so, with no annotation to drift from the code above it.
    const diagnostics = await check(`<script server>
const liveNow = 5
defineClientPayload({ liveNow })
</script>
<script client>
const label: string = liveNow
</script>`)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].message).toContain(`Type 'number' is not assignable to type 'string'`)
  })

  it('infers through a function call, not just a literal', async () => {
    const diagnostics = await check(`<script server>
function loadRange() { return { from: 1, to: 2 } }
const range = loadRange()
defineClientPayload({ range })
</script>
<script client>
const from: string = range.from
</script>`)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].message).toContain('not assignable')
  })

  it('rejects a server name the payload does not publish', async () => {
    // The half that makes declaring worth doing. At runtime this name is simply
    // absent, because the declared set is published in full and nothing else.
    const diagnostics = await check(`<script server>
const shown = 1
const hidden = 2
defineClientPayload({ shown })
</script>
<script client>
const a = shown
const b = hidden
</script>`)

    expect(diagnostics.map(d => d.message)).toEqual([`Cannot find name 'hidden'.`])
  })

  it('does not report the declaration API itself', async () => {
    // It was absent from the checker's globals, so the one call the typed
    // bridge is built on was an error.
    expect(await check(`<script server>
const a = 1
defineClientPayload({ a })
</script>`)).toEqual([])
  })
})

describe('a page that declares nothing', () => {
  it('gets its bridged names as any rather than an error', async () => {
    /*
     * The scraping bridge publishes on textual reference, which cannot be
     * typed. Reporting them instead would make the checker unusable on every
     * page written before `defineClientPayload` existed — so the incentive runs
     * the right way: declare and they are checked, or do not and they are any.
     */
    expect(await check(`<script server>
const range = '7d'
const siteId = 42
</script>
<script client>
const label = \`\${range}/\${siteId}\`
</script>`)).toEqual([])
  })

  it('still catches a name that comes from nowhere at all', async () => {
    const diagnostics = await check(`<script server>
const range = '7d'
</script>
<script client>
const typo = missingEntirely
</script>`)

    expect(diagnostics.map(d => d.message)).toEqual([`Cannot find name 'missingEntirely'.`])
  })
})

describe('an interpolation inside a script block', () => {
  it('parses, instead of failing the whole file', async () => {
    /*
     * `const duration = {{ duration }}` is a supported stx pattern and 48 of
     * the framework's own 95 components use it. As TypeScript it is a syntax
     * error, and a parse failure suppresses every other diagnostic in the file
     * — so the checker was not strict there, it was blind.
     */
    expect(await check(`<script server>
const duration = 300
</script>
<script client>
const ms = {{ duration }}
const raw = {!! duration !!}
</script>`)).toEqual([])
  })

  it('keeps the code around it at the same line and column', () => {
    const before = `const a = {{ x }}\nconst b: string = 1`
    const after = substituteInterpolationsInPlace(before)

    expect(after.split('\n')).toHaveLength(2)
    expect(after.split('\n')[0]).toHaveLength(before.split('\n')[0].length)
    expect(after.split('\n')[1]).toBe('const b: string = 1')
  })

  it('fits the shortest interpolation anyone writes', () => {
    // `{{a}}` is five characters. A named placeholder cannot be padded DOWN to
    // fit, so it would shift every column after it on that line.
    expect(substituteInterpolationsInPlace('x={{a}};')).toHaveLength('x={{a}};'.length)
  })

  it('preserves the line count of a multi-line interpolation', () => {
    const source = 'const a = {{ one\n  || two }}\nconst b = 2'

    expect(substituteInterpolationsInPlace(source).split('\n')).toHaveLength(3)
  })

  it('reports a real error on the line the author wrote it', async () => {
    // The position guarantee, end to end: a diagnostic after an interpolation
    // has to keep pointing at the right line.
    const diagnostics = await check(`<script server>
const duration = 300
</script>
<script client>
const ms = {{ duration }}
const oops: string = 42
</script>`)

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].line).toBe(6)
  })
})

describe('hoisting the server block into the projection', () => {
  it('lifts imports out of the wrapper function', () => {
    const { imports, body } = splitTopLevelImports(`import { db } from './db'\nconst a = db.x`)

    expect(imports).toBe(`import { db } from './db'`)
    expect(body.split('\n')).toHaveLength(2)
    expect(body).toContain('const a = db.x')
  })

  it('keeps the line count when it lifts them', () => {
    // The body still feeds a buffer whose diagnostics point at source lines.
    const { body } = splitTopLevelImports(`import a from 'a'\nimport b from 'b'\nconst c = 1`)

    expect(body.split('\n')).toHaveLength(3)
    expect(body.split('\n')[2]).toBe('const c = 1')
  })

  it('strips the export keyword, which is illegal inside a function', () => {
    const declarations = clientPayloadDeclarations(`export const a = 1\ndefineClientPayload({ a })`)

    expect(declarations).toContain('const a = 1')
    expect(declarations).not.toContain('export const a')
  })

  it('emits nothing at all for a server block with no bindings', () => {
    expect(clientPayloadDeclarations('')).toBe('')
  })
})
