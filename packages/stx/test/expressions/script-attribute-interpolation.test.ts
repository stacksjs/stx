/**
 * `{{ }}` in a script tag's ATTRIBUTES.
 *
 * Script bodies were interpolated; attributes were explicitly not
 * ("Attributes and tag structure are never modified"). For a plain `<script>`
 * that is invisible, because the client-script emitter rewrites the tag and
 * drops the attributes anyway. For `<script type="module">` the tag is emitted
 * verbatim — no IIFE, no server-data bridge — so attributes are the *only*
 * channel for server data into a module island, and they shipped the literal
 * text `{{ id }}` to the browser.
 *
 * The failure is silent in the worst way: the markup looks correct and the
 * page renders, but the island reads `dataset.session` and gets a mustache.
 * Found by opening the harness page in a browser, not by reading it.
 */
import { describe, expect, it } from 'bun:test'
import { interpolateScriptAttributes, interpolateScriptsInTemplate } from '../../src/expressions'

const context = { id: 7, name: 'harness', url: 'ws://127.0.0.1:3789/ws', nothing: null }

describe('attributes get HTML rules, not JavaScript rules', () => {
  it('splices a string without quoting it', () => {
    // The body interpolator JSON-stringifies, which inside an attribute would
    // produce data-name=""harness"" and end the value at the first quote.
    expect(interpolateScriptAttributes(' data-name="{{ name }}"', context))
      .toBe(' data-name="harness"')
  })

  it('renders a number as its digits', () => {
    expect(interpolateScriptAttributes(' data-id="{{ id }}"', context)).toBe(' data-id="7"')
  })

  it('renders null as empty rather than the word null', () => {
    expect(interpolateScriptAttributes(' data-x="{{ nothing }}"', context)).toBe(' data-x=""')
  })

  it('escapes anything that could break out of the attribute', () => {
    const escaped = interpolateScriptAttributes(' data-x="{{ evil }}"', { evil: `" onload="alert(1)` })

    expect(escaped).not.toContain('onload="')
    expect(escaped).toContain('&quot;')
  })

  it('escapes a value that could close the tag', () => {
    const escaped = interpolateScriptAttributes(' data-x="{{ evil }}"', { evil: '</script><img src=x>' })

    expect(escaped).not.toContain('</script>')
    expect(escaped).toContain('&lt;')
  })

  it('splices {!! !!} verbatim, for a value the caller already escaped', () => {
    expect(interpolateScriptAttributes(' data-x="{!! raw !!}"', { raw: 'a&b' })).toBe(' data-x="a&b"')
  })

  it('leaves an expression it cannot resolve for the client', () => {
    // Same "preserve for the client" rule the rest of the pipeline uses: a
    // client-only signal must survive to the browser, not be blanked.
    expect(interpolateScriptAttributes(' data-x="{{ clientOnlySignal }}"', context))
      .toBe(' data-x="{{ clientOnlySignal }}"')
  })

  it('leaves build-time placeholders alone', () => {
    expect(interpolateScriptAttributes(' data-x="{{ __TITLE__ }}"', context))
      .toBe(' data-x="{{ __TITLE__ }}"')
  })

  it('does no work when there is nothing to interpolate', () => {
    const attrs = ' type="module" data-stx-scoped'
    expect(interpolateScriptAttributes(attrs, context)).toBe(attrs)
  })
})

describe('through the template pass', () => {
  it('interpolates a module island\'s attributes', () => {
    const out = interpolateScriptsInTemplate(
      '<script type="module" data-session="{{ id }}" data-url="{{ url }}">const x = 1</script>',
      context,
    )

    expect(out).toContain('data-session="7"')
    expect(out).toContain('data-url="ws://127.0.0.1:3789/ws"')
  })

  it('still interpolates the body', () => {
    const out = interpolateScriptsInTemplate('<script>const id = {{ id }}</script>', context)

    expect(out).toContain('const id = 7')
  })

  it('interpolates a src, whose body it cannot template', () => {
    // An external script has no body to interpolate, but `src="{{ url }}"` is
    // exactly the kind of thing the attribute channel is for.
    const out = interpolateScriptsInTemplate('<script src="{{ url }}"></script>', context)

    expect(out).toContain('src="ws://127.0.0.1:3789/ws"')
  })

  it('templates a json block\'s attributes but not its data', () => {
    const out = interpolateScriptsInTemplate(
      '<script type="application/json" data-id="{{ id }}">{"a": "{{ id }}"}</script>',
      context,
    )

    expect(out).toContain('data-id="7"')
    // The body is data, not code — it must survive byte for byte.
    expect(out).toContain('{"a": "{{ id }}"}')
  })

  it('respects data-raw on the whole tag', () => {
    const raw = '<script data-raw data-id="{{ id }}">{{ id }}</script>'

    expect(interpolateScriptsInTemplate(raw, context)).toBe(raw)
  })

  it('skips a server script when asked to', () => {
    // Its body is executed, not emitted; templating either half would corrupt it.
    const server = '<script server data-id="{{ id }}">const a = 1</script>'

    expect(interpolateScriptsInTemplate(server, context, { skipServer: true })).toBe(server)
  })

  it('leaves a script with no expressions byte-identical', () => {
    const plain = '<script type="module" data-stx-scoped>const a = 1</script>'

    expect(interpolateScriptsInTemplate(plain, context)).toBe(plain)
  })
})
