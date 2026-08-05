/**
 * Directive syntax quoted in a code sample does not make a page reactive
 * (stacksjs/stx#1835).
 *
 * `hasSignalsSyntax` scans raw template text, so a documentation page showing
 * `:if="open"` inside a `<pre><code>` block counted as reactive and shipped the
 * whole ~159KB signals runtime for markup that is inert text. The stx docs are
 * full of exactly that, and so is any consumer's docs site.
 *
 * It is not only weight. Since #1827 a fragment response declares whether the
 * destination needs the runtime, and that answer is derived from this same
 * predicate — so an over-shipping docs page also makes a runtime-less page hand
 * its navigation to a full browser load rather than swapping.
 *
 * The blanking keeps TAGS and blanks only TEXT, which is the whole design.
 * Dropping the region wholesale would have been simpler and wrong in the
 * expensive direction: a page whose only reactive element sits inside a `<pre>`
 * would lose its runtime and break, and shipping bytes you do not need is a
 * far better failure than a page that does not work.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { blankInertHtmlRegions, templateHasReactiveContext } from '../../src/runtime-globals'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
}

/** Does the rendered page carry the signals runtime? */
async function shipsRuntime(template: string): Promise<boolean> {
  return (await render(template)).includes('data-stx-runtime')
}

describe('documentation does not ship a runtime', () => {
  it('ignores an escaped sample in a code block', async () => {
    expect(await shipsRuntime(
      '<main><h1>The :if directive</h1><pre><code>&lt;div :if="open"&gt;&lt;/div&gt;</code></pre></main>',
    )).toBe(false)
  })

  it('ignores a syntax-highlighted sample', async () => {
    // Highlighters wrap every token in a span, so the block DOES contain real
    // tags. Blanking whole regions would be needed to catch this; blanking only
    // text catches it without that risk, because the directive is in the text.
    expect(await shipsRuntime(
      '<main><pre><code><span class="t">&lt;div :if="open"&gt;</span></code></pre></main>',
    )).toBe(false)
  })

  it('ignores an inline code span', async () => {
    expect(await shipsRuntime(
      '<main><p>Write <code>@click="submit()"</code> to bind a handler.</p></main>',
    )).toBe(false)
  })

  it('ignores directive syntax inside an HTML comment', async () => {
    expect(await shipsRuntime('<main><!-- <div :if="open"> --><p>hi</p></main>')).toBe(false)
  })

  it('drops the page from ~159KB to a few hundred bytes', async () => {
    // The number is the point: this is the entire runtime, on every docs page.
    const out = await render('<main><pre><code>&lt;div :if="open"&gt;</code></pre></main>')

    expect(out.length).toBeLessThan(5000)
  })
})

describe('real reactivity is untouched', () => {
  it('still ships for a client script using signals', async () => {
    expect(await shipsRuntime(
      '<script client>const n = state(0)</script><main><span :text="n"></span></main>',
    )).toBe(true)
  })

  it('still ships for a bound attribute with no script', async () => {
    expect(await shipsRuntime('<main><div :if="useStore(\'c\').n()">x</div></main>')).toBe(true)
  })

  it('still binds a REAL element written inside a <pre>', async () => {
    // The case that makes region-dropping unsafe. `<pre>` content is parsed as
    // HTML, so this button is a real button and must still be wired up.
    const out = await render('<main><pre><button @click="go()">run</button></pre></main>')

    expect(out).toContain('data-stx-events')
  })
})

describe('blankInertHtmlRegions', () => {
  it('keeps tags and blanks only the text between them', () => {
    const out = blankInertHtmlRegions('<pre><code><span>&lt;div :if="x"&gt;</span></code></pre>')

    expect(out).toContain('<span>')
    expect(out).not.toContain(':if=')
  })

  it('leaves a real directive-carrying tag intact', () => {
    const out = blankInertHtmlRegions('<pre><button @click="go()">run</button></pre>')

    expect(out).toContain('@click="go()"')
  })

  it('leaves markup outside pre/code alone', () => {
    const html = '<div :if="open">live</div>'

    expect(blankInertHtmlRegions(html)).toBe(html)
  })

  it('preserves length, so nothing downstream shifts', () => {
    for (const sample of [
      '<pre><code>&lt;div :if="x"&gt;</code></pre>',
      '<!-- <div :if="x"> -->',
      '<p>plain</p>',
    ])
      expect(blankInertHtmlRegions(sample)).toHaveLength(sample.length)
  })

  it('feeds the predicate the reported case', () => {
    expect(templateHasReactiveContext('<pre><code>&lt;div :if="open"&gt;</code></pre>')).toBe(false)
    expect(templateHasReactiveContext('<div :if="open">x</div>')).toBe(true)
  })
})
