/**
 * A declaration with no initializer still reaches the client scope (stacksjs/stx#1919).
 *
 * `extractExports` builds the object the setup function returns — the client
 * scope every template expression is evaluated against. It matched
 * `const|let|var NAME =`, requiring the `=`, so a binding declared in one
 * statement and assigned in another was never published. A template reading it
 * evaluated to nothing: no console error, no diagnostic, the element just
 * renders empty.
 *
 * The form that costs the most is the typed one, because ADDING TYPES is what
 * produces it. In a production view:
 *
 *     let providerRows = null            -> 2 rows rendered
 *     let providerRows!: () => Row[]     -> 0 rows rendered
 *
 * with the assignment (`providerRows = derived(…)`) and the template
 * (`x-for="row in providerRows()"`) untouched, and zero console errors either
 * way. `stx typecheck`, `stx codemod`, `tsc`, lint and the unit suite were all
 * green — the failure existed only in the rendered DOM.
 *
 * ## Where the bug was not
 *
 * The report pointed at `variable-extractor.ts`, whose two declaration branches
 * have the same shape. That extractor handles `<script server>` blocks, and it
 * already published every one of these forms: its later assignment re-sync
 * picks up the value whether or not the declaration was matched, including when
 * the assignment sits inside an `if` or a `try`. Measured before changing
 * anything, which is why nothing here touches it.
 *
 * The client scope has no such re-sync. `extractExports` is the only thing that
 * decides what the template can see, so a name it misses is simply gone.
 */

import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { extractExports } from '../../src/signal-processing'

const names = (code: string): string[] =>
  extractExports(code).split(',').map(s => s.trim()).filter(Boolean)

describe('extractExports publishes a declaration without an initializer', () => {
  it('with a definite-assignment annotation — the reported form', () => {
    expect(names('let rows!: () => string[]\nrows = () => ["a"]')).toContain('rows')
  })

  it('with a plain type annotation', () => {
    expect(names('let rows: (() => string[]) | null\nrows = () => ["a"]')).toContain('rows')
  })

  it('with no annotation at all', () => {
    expect(names('let rows\nrows = () => ["a"]')).toContain('rows')
  })

  it('when the annotation contains a fat arrow', () => {
    // The reason the terminator is matched instead of the type being consumed:
    // an annotation can contain `=`, so anything scanning past it stops on the
    // arrow of `() => string[]` and the declaration is lost again.
    expect(names('let fn!: (a: string) => Promise<number>\nfn = async () => 1')).toContain('fn')
  })

  it('and still publishes the initialized forms it always did', () => {
    const found = names([
      'const a = 1',
      'let b = 2',
      'var c = 3',
      'const { d, e: f } = obj',
      'const [g] = arr',
      'function h() {}',
      'async function i() {}',
    ].join('\n'))

    expect(found).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i']))
  })

  it('does not invent a name from a comparison or a nested declaration', () => {
    // The terminator list includes `=`, so it has to exclude `==`; and only
    // top-level declarations belong in the scope.
    const found = names('const ok = 1\nif (ok == 1) { const hidden = 2 }')

    expect(found).toContain('ok')
    expect(found).not.toContain('hidden')
  })
})

describe('the rendered page', () => {
  it('puts a later-assigned signal in the scope the template reads', async () => {
    // End to end, because `extractExports` returning the name is only useful if
    // it reaches the generated setup function's return object.
    const html = await processDirectives(
      `<script client>
  const src = state(['a', 'b'])
  let withInit = null
  let noInit!: () => string[]

  withInit = derived(() => src())
  noInit = derived(() => src())
</script>
<ul><li x-for="x in withInit()" :text="x"></li></ul>
<ul><li x-for="x in noInit()" :text="x"></li></ul>`,
      {},
      `${import.meta.dir}/decl-fixture.stx`,
      { debug: false, cache: false } as any,
      new Set(),
    )

    const returned = html.match(/return \{[^}]*\}/)?.[0] ?? ''

    expect(returned).toContain('withInit')
    // The one that was missing. `withInit` differs only in having an
    // initializer, so it is the control.
    expect(returned).toContain('noInit')
  })
})
