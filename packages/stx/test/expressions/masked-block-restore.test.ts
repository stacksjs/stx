/**
 * Masked <script>/<style> bodies come back intact, and in the right places
 * (stacksjs/stx#1945).
 *
 * `processExpressions` hides script and style bodies behind placeholder
 * comments so `{{ }}` interpolation cannot rewrite JS or CSS, then restores
 * them at the end. That restore used to be a loop with one whole-document
 * replace PER block -- 74 rebuilds of the page on a component-dense render. It
 * is one global replace now.
 *
 * Nothing covered the restore before this: a sabotage that made every
 * placeholder resolve to block 0 left the whole expression suite green. These
 * pin the part a single-block page cannot -- that block N gets block N's body.
 */

import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const options = { ...defaultConfig } as StxOptions

async function render(body: string): Promise<string> {
  return processDirectives(body, {}, '/app/page.stx', options, new Set())
}

describe('restoring masked blocks', () => {
  it('gives each script back its own body, in source order', async () => {
    const out = await render([
      '<html><head><meta charset="utf-8"></head><body>',
      '<script>var first = "SENTINEL_ONE"</script>',
      '<script>var second = "SENTINEL_TWO"</script>',
      '<script>var third = "SENTINEL_THREE"</script>',
      '</body></html>',
    ].join('\n'))

    expect(out).toContain('SENTINEL_ONE')
    expect(out).toContain('SENTINEL_TWO')
    expect(out).toContain('SENTINEL_THREE')
    expect(out.indexOf('SENTINEL_ONE')).toBeLessThan(out.indexOf('SENTINEL_TWO'))
    expect(out.indexOf('SENTINEL_TWO')).toBeLessThan(out.indexOf('SENTINEL_THREE'))
    // No block restored twice, which is what a wrong index looks like.
    expect(out.match(/SENTINEL_ONE/g)).toHaveLength(1)
  })

  it('leaves no placeholder comment behind', async () => {
    const out = await render([
      '<html><head><meta charset="utf-8">',
      '<style>.a { color: red }</style>',
      '<style>.b { color: blue }</style>',
      '</head><body>',
      '<script>var x = 1</script>',
      '</body></html>',
    ].join('\n'))

    expect(out).not.toContain('__STX_SCRIPT_EXPR_')
    expect(out).not.toContain('__STX_STYLE_')
    expect(out).toContain('color: red')
    expect(out).toContain('color: blue')
  })

  it('does not reinterpret $& and friends inside a script body', async () => {
    // A string replacement would expand these as replacement patterns; the
    // restore has to use the function form (8ebb172b2a).
    const out = await render([
      '<html><head><meta charset="utf-8"></head><body>',
      '<script>var re = "$& $` $\' $1"</script>',
      '</body></html>',
    ].join('\n'))

    expect(out).toContain('$& $` $\' $1')
  })
})
