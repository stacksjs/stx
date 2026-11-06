/**
 * An interpolation ends at the delimiter that CLOSES it, not the first one.
 *
 * The scanner matched with a non-greedy `{{([\s\S]*?)}}`, so a balanced
 * expression whose own braces happen to close together ended early:
 *
 *   {{ wrap({inner:{depth:data.inner.depth}}) }}
 *                                        ^^ matched here
 *
 * The expression was sliced mid-term and the checker reported "',' expected"
 * and "Declaration or statement expected" against source that is correct
 * (stacksjs/stx#2154). Nested object literals in an interpolation are ordinary
 * -- passing options through to a server helper reaches this immediately.
 */
import { afterAll, expect, it } from 'bun:test'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const root = createTempDir('stx-interpolation-balance-')
afterAll(() => rmSync(root, { recursive: true, force: true }))

const server = `<script server>
const data = { inner: { depth: 2 } }
const obj = { a: { b: 1 } }
function wrap(input: { inner: { depth: number } }): number { return input.inner.depth }
</script>`

async function check(name: string, client: string) {
  const file = join(root, `${name}.stx`)
  writeFileSync(file, `${server}\n<script client>\n${client}\n</script>\n`, 'utf8')
  const result = await typecheckStxFiles([file], { templates: false })
  expect(result.failure).toBeFalsy()
  return result.diagnostics.filter(diagnostic => diagnostic.category === 'error')
}

it('reads a nested object literal whose braces close against the delimiter', async () => {
  const errors = await check('adjacent', 'const depth: number = {{ wrap({inner:{depth:data.inner.depth}}) }}')

  expect(errors).toEqual([])
})

it('reads the same expression in the raw form', async () => {
  const errors = await check('raw', 'const copy: string = {!! JSON.stringify({wrapped:{inner:obj.a}}) !!}')

  expect(errors).toEqual([])
})

it('still reports a genuine error inside a nested interpolation', async () => {
  // The guard against over-correcting: ending late must not swallow real ones.
  const errors = await check('genuine', 'const bad: number = {{ wrap({inner:{depth:\'not a number\'}}) }}')

  expect(errors).toHaveLength(1)
  expect(errors[0]!.code).toBe(2322)
  expect(errors[0]!.message).toContain('not assignable')
})

it('names an unknown identifier inside nested braces at its authored line', async () => {
  const errors = await check('unknown', 'const n: number = {{ wrap({inner:{depth:missingThing}}) }}')

  expect(errors).toHaveLength(1)
  expect(errors[0]!.code).toBe(2304)
  // Line 7: four server lines, the closing tag, the client tag, then this.
  expect(errors[0]!.line).toBe(7)
})

it('keeps two nested interpolations on one line independent', async () => {
  const errors = await check('pair', 'const a: number = {{ wrap({inner:{depth:1}}) }}; const b: number = {{ wrap({inner:{depth:2}}) }}')

  expect(errors).toEqual([])
})
