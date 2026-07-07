/**
 * Regression test for `{{ expr }}` splicing inside x-data expressions when
 * the server-side value is a pre-stringified JSON payload.
 *
 * Context: `substituteExpressionsInExpr` splices `{{ expr }}` as
 * JSON.stringify(value) so the embedded runtime scope is always a valid JS
 * literal. But when the template author already passed JSON.stringify
 * output (a very common pattern: `meta: {{ metaJson }}`), stringifying
 * again double-encodes it — the runtime scope property becomes a plain
 * string, and `meta[0]` yields a character instead of an object (observed
 * as `meta[hover].sub` resolving to String.prototype.sub on oddsbeacon's
 * /markets page). Meanwhile the same `{{ }}` inside the element's
 * attribute renders as raw text, so the DOM and the runtime scope
 * disagreed about the same expression.
 *
 * Fix: a string value that is itself a JSON object/array literal splices
 * raw, matching the attribute rendering; everything else keeps the
 * JSON-safe quoting.
 */

import { describe, expect, it } from 'bun:test'
import { processReactiveDirectives } from '../../src/reactive'

function page(xdata: string): string {
  return `<!DOCTYPE html><html><body x-data="${xdata}"><div x-text="probe"></div></body></html>`
}

describe('x-data {{ }} splicing — JSON string payloads', () => {
  it('splices a JSON array string as an array literal, not a quoted string', () => {
    const metaJson = JSON.stringify([{ kind: 'trader', label: 'a' }, { kind: 'market', label: 'b' }])
    const out = processReactiveDirectives(page('{ meta: {{ metaJson }}, probe: 1 }'), { metaJson }, 'test.stx')
    // The embedded initScope state must contain the array literal…
    expect(out).toContain('meta: [{')
    // …and must NOT contain the double-encoded quoted form.
    expect(out).not.toContain('meta: \\"[')
  })

  it('splices a JSON object string as an object literal', () => {
    const mapJson = JSON.stringify({ 'a:1': 2.5, 'b:2': 3 })
    const out = processReactiveDirectives(page('{ live: {{ mapJson }} }'), { mapJson }, 'test.stx')
    expect(out).toContain('live: {')
    expect(out).not.toContain('live: \\"{')
  })

  it('still quotes plain strings', () => {
    const out = processReactiveDirectives(page('{ label: {{ title }} }'), { title: 'hello world' }, 'test.stx')
    expect(out).toContain('label: \\"hello world\\"')
  })

  it('still quotes strings that merely look bracket-ish but are not JSON', () => {
    const out = processReactiveDirectives(page('{ label: {{ title }} }'), { title: '[not json' }, 'test.stx')
    expect(out).toContain('label: \\"[not json\\"')
  })

  it('still splices arrays/objects passed as values (not strings) as literals', () => {
    const out = processReactiveDirectives(page('{ ids: {{ ids }} }'), { ids: [1, 2, 3] }, 'test.stx')
    expect(out).toContain('ids: [1,2,3]')
  })

  it('keeps numbers bare', () => {
    const out = processReactiveDirectives(page('{ port: {{ port }} }'), { port: 6001 }, 'test.stx')
    expect(out).toContain('port: 6001')
  })
})
