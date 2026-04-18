/**
 * Tests for server-expression interpolation inside `<script>` bodies.
 *
 * This fills a previously-missing feature: `{{ }}` / `{!! !!}` inside a
 * client-side `<script>` tag weren't substituted with server data, forcing
 * users to pipe data via hidden `<div data-*>` islands. Now server values
 * are JS-safely spliced into script content.
 */

import { describe, expect, it } from 'bun:test'
import {
  interpolateScriptExpressions,
  interpolateScriptsInTemplate,
} from '../src/expressions'

describe('interpolateScriptExpressions — JS-safe substitution', () => {
  it('JSON-stringifies strings for {{ expr }}', () => {
    const out = interpolateScriptExpressions(
      'const name = {{ user }}',
      { user: 'Alice' },
    )
    expect(out).toBe('const name = "Alice"')
  })

  it('passes numbers through as JSON literals', () => {
    const out = interpolateScriptExpressions(
      'const PRICE = {{ price }}',
      { price: 89.5 },
    )
    expect(out).toBe('const PRICE = 89.5')
  })

  it('handles booleans', () => {
    const out = interpolateScriptExpressions(
      'const ok = {{ flag }}',
      { flag: true },
    )
    expect(out).toBe('const ok = true')
  })

  it('serializes arrays/objects as JSON for {{ expr }}', () => {
    const out = interpolateScriptExpressions(
      'const DATA = {{ data }}',
      { data: [{ id: 1 }, { id: 2 }] },
    )
    expect(out).toBe('const DATA = [{"id":1},{"id":2}]')
  })

  it('emits valid JS for strings containing quotes', () => {
    const out = interpolateScriptExpressions(
      'const label = {{ label }}',
      { label: 'He said "hi"' },
    )
    // JSON.stringify escapes embedded double quotes — so the result
    // round-trips through eval as the original string.
    expect(out).toBe('const label = "He said \\"hi\\""')
    // Sanity-check: the emitted JS actually parses back to the original value.
    // eslint-disable-next-line no-eval
    expect(eval(out.replace('const label = ', ''))).toBe('He said "hi"')
  })

  it('{!! raw !!} emits the value verbatim (user takes responsibility)', () => {
    const out = interpolateScriptExpressions(
      'const DATA = {!! json !!}',
      { json: '[1,2,3]' },
    )
    expect(out).toBe('const DATA = [1,2,3]')
  })

  it('leaves {{ expr }} untouched when expression fails to evaluate', () => {
    // Client-side signal refs / loop vars aren't in server context —
    // they must survive for the client runtime to handle them.
    const out = interpolateScriptExpressions(
      'effect(() => console.log({{ clientSignal() }}))',
      { user: 'Alice' },
    )
    expect(out).toBe('effect(() => console.log({{ clientSignal() }}))')
  })

  it('leaves {{ expr }} untouched when the value is undefined', () => {
    const out = interpolateScriptExpressions(
      'const x = {{ missing }}',
      { other: 1 },
    )
    expect(out).toBe('const x = {{ missing }}')
  })

  it('preserves build-time placeholders like __TITLE__', () => {
    const out = interpolateScriptExpressions(
      'const t = {{ __TITLE__ }}',
      { __TITLE__: 'should not substitute' },
    )
    expect(out).toBe('const t = {{ __TITLE__ }}')
  })

  it('interpolates multiple expressions in one script', () => {
    const out = interpolateScriptExpressions(
      'const a = {{ a }}, b = {{ b }}, c = {!! c !!}',
      { a: 1, b: 'two', c: 'raw3' },
    )
    expect(out).toBe('const a = 1, b = "two", c = raw3')
  })

  it('handles expressions with property access', () => {
    const out = interpolateScriptExpressions(
      'const PRICE = {{ car.price }}',
      { car: { price: 89 } },
    )
    expect(out).toBe('const PRICE = 89')
  })

  it('handles expressions with method calls', () => {
    const out = interpolateScriptExpressions(
      'const IDS = {{ items.map(i => i.id) }}',
      { items: [{ id: 'a' }, { id: 'b' }] },
    )
    expect(out).toBe('const IDS = ["a","b"]')
  })
})

describe('interpolateScriptsInTemplate — tag-level handling', () => {
  it('processes expressions inside <script> tags', () => {
    const html = `
      <p>Hello {{ name }}</p>
      <script>
        const user = {{ name }}
      </script>
    `
    const out = interpolateScriptsInTemplate(html, { name: 'Alice' })
    // The {{ }} outside the script is NOT touched by this function — that's
    // the caller's job. Only script bodies get processed here.
    expect(out).toContain('<p>Hello {{ name }}</p>')
    expect(out).toContain('const user = "Alice"')
  })

  it('processes both <script> and <script client> tags', () => {
    const html = `
      <script client>const a = {{ val }}</script>
      <script>const b = {{ val }}</script>
    `
    const out = interpolateScriptsInTemplate(html, { val: 42 })
    expect(out).toContain('const a = 42')
    expect(out).toContain('const b = 42')
  })

  it('skips external scripts with src=', () => {
    const html = '<script src="/external.js">{{ wontBeTouched }}</script>'
    const out = interpolateScriptsInTemplate(html, { wontBeTouched: 'x' })
    expect(out).toBe(html)
  })

  it('skips scripts with data-raw opt-out', () => {
    const html = '<script data-raw>const k = {{ shouldNotSubstitute }}</script>'
    const out = interpolateScriptsInTemplate(html, { shouldNotSubstitute: 'x' })
    expect(out).toBe(html)
  })

  it('skips <script type="application/json">', () => {
    const html = '<script type="application/json" id="data">{{ x }}</script>'
    const out = interpolateScriptsInTemplate(html, { x: 1 })
    // JSON scripts are data payloads, not code — don't touch them.
    expect(out).toBe(html)
  })

  it('preserves all attributes on script tags', () => {
    const html = '<script client type="module" async defer>const v = {{ v }}</script>'
    const out = interpolateScriptsInTemplate(html, { v: 'ok' })
    expect(out).toContain('<script client type="module" async defer>')
    expect(out).toContain('const v = "ok"')
  })

  it('handles multiple scripts with mixed opts-in and opts-out', () => {
    const html = `
      <script>const a = {{ x }}</script>
      <script data-raw>const b = {{ x }}</script>
      <script>const c = {{ x }}</script>
    `
    const out = interpolateScriptsInTemplate(html, { x: 99 })
    expect(out).toContain('const a = 99')
    expect(out).toContain('const b = {{ x }}') // opted out
    expect(out).toContain('const c = 99')
  })

  it('does not corrupt scripts with curly-brace JS syntax that looks like {{ }}', () => {
    // `{a:1}` is fine; `{ {a:1} }` has a space between braces — our regex
    // greedily matches `{{` → `}}`, but the content must be a valid expression
    // for substitution to happen. Invalid content falls through.
    const html = '<script>if (x) { {a:1} }</script>'
    const out = interpolateScriptsInTemplate(html, {})
    // With nothing evaluable, the script should be unchanged.
    expect(out).toBe(html)
  })
})
