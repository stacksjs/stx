import { expect, it } from 'bun:test'
import { precompileCspBindings } from '../src/csp-precompile'
import { processDirectives } from '../src/process'
const config = {enabled:true,precompile:true,useHashes:true,addMetaTag:true,directives:{'script-src':["'self'"]}}

it('collects binding aliases and memo dependencies but leaves escaped literals and transition classes inert', () => {
  const html = precompileCspBindings('<b @bind:title="value + 1" data-stx-memo="[value]" x-transition:enter="transition duration-200" title="{{ not valid JS }}">{<!--stx-literal-->{not valid JS}}</b>')
  expect(html).toContain('.expressions["return (value + 1)"]')
  expect(html).toContain('.expressions["return [value]"]')
  expect(html).not.toContain('.expressions["return not valid JS"]')
})

it('matches browser decoding for named references, encoded delimiters and legacy attribute decoding', () => {
  const html = precompileCspBindings(`<b x-text="'&copy;'" :title="'A &amp;amp; B'">&#123;&#123; count &#125;&#125;</b>`)
  expect(html).toContain('.expressions["return (\'©\')"]')
  expect(html).toContain('.expressions["return (\'A & B\')"]')
  expect(html).toContain('.expressions["return count"]')
})

it('preserves JavaScript escapes from browser-parsed attributes', () => {
  const expression = String.raw`'Postline\'s path is C:\\posts'`
  const html = precompileCspBindings(`<span :text="${expression}"></span>`)
  expect(html).toContain(`.expressions[${JSON.stringify(`return (${expression})`)}]`)
})

  it('compiles HTML entities and scoped-slot destructuring, without scanning script strings or comments as markup', () => {
    const html = precompileCspBindings(`<head><script>const prose='<p x-text="not valid syntax">{{ prose }}</p>'</script></head><b x-text="n &#x2b; 1"></b><!--{{ invalid syntax }}--><div data-stx-slot-scope='{"binding":"{row}","names":["row"]}'></div>`)
    expect(html).toContain('.expressions["return n + 1"]')
    expect(html).toContain('const {row} = __stx_slot_value; return {row};')
    expect(html).not.toContain('.expressions["return prose"]')
    expect(precompileCspBindings(html)).toBe(html)
  })
  it('fails rendering for invalid bindings instead of returning a production error page', async () => {
    await expect(processDirectives('<div x-text="value +"></div>', {}, '/tmp/csp-invalid.stx', { csp: config, debug: false, cache: false } as any, new Set())).rejects.toThrow('CSP precompilation failed')
  })
