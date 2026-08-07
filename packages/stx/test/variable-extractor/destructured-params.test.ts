/**
 * Regression tests for stacksjs/stx#1890 — a `<script server>` function with a
 * destructured parameter never reached the render context.
 *
 * Both readers looked for the function body with `indexOf('{')`, which finds the
 * DESTRUCTURING brace in `async function g({ form }) {`. That one closes on the
 * signature line, so:
 *
 *   - `needsMultilineFunctionReading` judged the function already complete, and
 *   - `readMultilineFunction` broke on its first iteration and returned the
 *     signature with no body,
 *
 * after which `module.exports.g = g;` was spliced in between the signature and
 * the body — inside the function, where it never runs:
 *
 *   async function g({ form }) {
 *   module.exports.g = g;
 *   return 1;
 *   }
 *
 * The failure was silent. No error, no warning: the declaration was simply
 * absent, and `{{ typeof g }}` rendered `undefined`. Destructured parameters are
 * how handlers are normally written (`{ form }`, `{ request, params }`), so this
 * removed a shape people reach for by default.
 */
import { describe, expect, it } from 'bun:test'
import { extractVariables } from '../../src/variable-extractor'

const FILE = '/tmp/destructured-params.stx'

async function extract(source: string): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {}
  await extractVariables(source, context, FILE)
  return context
}

describe('destructured parameters reach the render context (#1890)', () => {
  it('exports a function with a destructured parameter', async () => {
    const context = await extract('export async function g({ form }) {\n  return form\n}')
    expect(typeof context.g).toBe('function')
  })

  it('the exported function actually works', async () => {
    // The bug did not merely hide the name — the export statement landed inside
    // the body. Calling it proves the body survived intact.
    const context = await extract('export async function pick({ form }) {\n  return form.email\n}')
    const pick = context.pick as (arg: { form: { email: string } }) => Promise<string>
    expect(await pick({ form: { email: 'a@b.c' } })).toBe('a@b.c')
  })

  it('handles multiple destructured params, nesting and defaults', async () => {
    const context = await extract(
      'export function combine({ a, b = 2 }, { c: { d } }) {\n  return a + b + d\n}',
    )
    const combine = context.combine as (x: { a: number, b?: number }, y: { c: { d: number } }) => number
    expect(combine({ a: 1 }, { c: { d: 3 } })).toBe(6)
  })

  it('covers the non-exported and non-async forms too', async () => {
    const context = await extract(
      'function bare({ x }) {\n  return x\n}\nasync function bareAsync({ y }) {\n  return y\n}',
    )
    expect(typeof context.bare).toBe('function')
    expect(typeof context.bareAsync).toBe('function')
  })

  it('still exports the shapes that already worked', async () => {
    // The fix must not disturb the paths that were fine: no params, a plain
    // param, and an object return value.
    const context = await extract([
      'export function noParam() {\n  return 1\n}',
      'export function plainParam(x) {\n  return x\n}',
      'export function objReturn() {\n  return { a: 1 }\n}',
    ].join('\n'))
    expect(typeof context.noParam).toBe('function')
    expect(typeof context.plainParam).toBe('function')
    expect(typeof context.objReturn).toBe('function')
  })

  it('does not swallow the declaration that follows it', async () => {
    // The stray `module.exports` splice corrupted the emitted module, so what
    // came after a destructured function was at risk too.
    const context = await extract(
      'export function handler({ form }) {\n  return form\n}\nexport const after = 42',
    )
    expect(typeof context.handler).toBe('function')
    expect(context.after).toBe(42)
  })
})
