import { describe, expect, it } from 'bun:test'
import { extractVariables } from '../src/variable-extractor'

/**
 * Context keys are injected as PARAMETER NAMES on the generated `new Function`
 * that runs a `<script server>` block. A key that is not a bare JS identifier
 * therefore makes the function signature itself a syntax error, which takes
 * down the entire script — not just that one name.
 *
 * This is not a theoretical shape. Rendering contexts routinely carry
 * `data-*` attribute keys, hyphenated slot names, and `...`-prefixed
 * internals. When one of those reached a component, every export computed by
 * calling a local helper silently came back undefined (the failure falls back
 * to static extraction, which cannot invoke functions), and the component
 * rendered empty with no error anywhere.
 */
describe('extractVariables context key sanitisation', () => {
  const fixture = '/tmp/stx-context-keys-fixture.stx'

  it('runs the script when context carries non-identifier keys', async () => {
    const script = `
      function double(list) { return list.map(n => n * 2) }
      export const doubled = double([1, 2, 3])
      export const greeting = 'hi'
    `
    const context: Record<string, unknown> = {
      'data-v-stx-abc123': '',
      'aria-label': 'Sidebar',
      '...rest': undefined,
      '3invalid': 1,
      'valid': 'kept',
    }

    await extractVariables(script, context, fixture)

    // The helper-derived export is the canary: static fallback extraction
    // cannot call `double`, so a populated array proves the script really ran.
    expect(context.doubled).toEqual([2, 4, 6])
    expect(context.greeting).toBe('hi')
  })

  it('still exposes identifier-named context values to the script', async () => {
    const script = `export const shout = String(topic).toUpperCase()`
    const context: Record<string, unknown> = { topic: 'sidebar', 'data-x': 1 }

    await extractVariables(script, context, fixture)

    expect(context.shout).toBe('SIDEBAR')
  })
})
