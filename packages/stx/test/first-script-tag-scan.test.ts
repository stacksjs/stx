/**
 * The runtime lands ahead of the first real script, without copying the page to
 * find it (stacksjs/stx#1945).
 *
 * `findFirstScriptTag` decides where the signals runtime is relocated to. It
 * looks at every `<` until it finds a script, and it used to slice the whole
 * remaining document at each one to run an anchored pattern over the copy --
 * 2.4MB on a plain page and 4.5MB on a component-dense one, per render, the
 * largest remaining site after the component scan. It matches at an offset now.
 *
 * The `<style>` skip is the part that had no coverage at all, and it is only
 * reachable on a page whose head holds a script the runtime has to get ahead of
 * -- on an ordinary page the runtime is already the first script and the
 * relocation returns early without ever consulting this function. Every test
 * here therefore puts a real `<script>` in the head after a `<style>`; a page
 * shape without one pins nothing, which is how an earlier draft of this file
 * passed while the `i` flags were sabotaged.
 *
 * One flag is deliberately NOT covered, rather than covered badly: the `i` on
 * the style OPENING tag. An uppercase `<STYLE>` never reaches this scan -- the
 * component pass gets there first, reads it as a PascalCase component tag and
 * replaces it with a component-not-found error. The flag is kept because the
 * code it replaces had it, not because a test here can reach it. The closing
 * tag's `i` IS reachable and is covered below.
 */

import type { StxOptions } from '../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../src/config'
import { processDirectives } from '../src/process'

const options = { ...defaultConfig } as StxOptions
const CLIENT_SCRIPT = '<script client>const open = state(false)</script>'

/** A page whose head holds a style and then a script, which is what reaches the skip. */
function page(styleBlock: string): string {
  return [
    '<html><head><meta charset="utf-8">',
    styleBlock,
    '<script>var headScript = 1</script>',
    '</head>',
    `<body><main>x</main>${CLIENT_SCRIPT}</body></html>`,
  ].join('\n')
}

async function render(body: string): Promise<string> {
  return processDirectives(body, {}, '/app/page.stx', options, new Set())
}

describe('locating the first script tag', () => {
  it('puts the runtime ahead of a script already in the head', async () => {
    const out = await render(page('<style>.a { color: red }</style>'))

    const runtime = out.indexOf('data-stx-runtime')
    expect(runtime).toBeGreaterThan(-1)
    expect(runtime).toBeLessThan(out.indexOf('var headScript'))
  })

  it('does not mistake a <script> mentioned inside a style block for one', async () => {
    // Walking into the stylesheet would land the runtime in the middle of a CSS
    // rule -- valid-looking output, broken page.
    const out = await render(page('<style>.a { color: red } /* <script> */ .b::after { content: "<script>" }</style>'))

    const runtime = out.indexOf('data-stx-runtime')
    expect(runtime).toBeGreaterThan(-1)
    expect(runtime > out.indexOf('<style') && runtime < out.indexOf('</style>')).toBe(false)
    expect(runtime).toBeLessThan(out.indexOf('var headScript'))
  })

  it('finds the SECOND style block\'s close, not the first one again', async () => {
    // The closing-tag search is a module-level global regex, so its lastIndex
    // has to be set before every use. Left at 0 it re-finds the first
    // `</style>`, which is behind the current position -- the scan then walks
    // backwards over ground it has already covered.
    const out = await render([
      '<html><head><meta charset="utf-8">',
      '<style>.a { color: red }</style>',
      '<style>.b::after { content: "<script>" }</style>',
      '<script>var headScript = 1</script>',
      '</head>',
      `<body><main>x</main>${CLIENT_SCRIPT}</body></html>`,
    ].join('\n'))

    const runtime = out.indexOf('data-stx-runtime')
    const secondBlockClose = out.indexOf('</style>', out.indexOf('.b::after'))

    expect(runtime).toBeGreaterThan(-1)
    // Past BOTH stylesheets, and still ahead of the script it has to precede.
    expect(runtime).toBeGreaterThan(secondBlockClose)
    expect(runtime).toBeLessThan(out.indexOf('var headScript'))
  })

  it('recognises a mixed-case closing </Style> tag', async () => {
    const out = await render(page('<style>.a { color: red } /* <script> */</Style>'))

    const runtime = out.indexOf('data-stx-runtime')
    expect(runtime).toBeGreaterThan(-1)
    expect(runtime > out.indexOf('<style') && runtime < out.indexOf('</Style>')).toBe(false)
    expect(runtime).toBeLessThan(out.indexOf('var headScript'))
  })

  it('steps over an HTML comment that mentions a script', async () => {
    const out = await render([
      '<html><head><meta charset="utf-8">',
      '<!-- <script>not a script</script> -->',
      '<script>var headScript = 1</script>',
      '</head>',
      `<body><main>x</main>${CLIENT_SCRIPT}</body></html>`,
    ].join('\n'))

    const runtime = out.indexOf('data-stx-runtime')
    expect(runtime).toBeGreaterThan(-1)
    expect(runtime > out.indexOf('<!--') && runtime < out.indexOf('-->')).toBe(false)
    expect(runtime).toBeLessThan(out.indexOf('var headScript'))
  })
})
