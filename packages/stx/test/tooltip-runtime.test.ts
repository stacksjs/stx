/**
 * `x-tooltip` ships the runtime that makes it work (stacksjs/stx#1922).
 *
 * `getTooltipRuntime()` was written, exported from `builtins/index.ts`, and
 * called by nothing — two definitions and zero call sites, in stx and in
 * `bun-plugin-stx`. `registerBuiltins()` registers ten builtins and tooltip was
 * not one of them. So the attribute reached the DOM and nothing ever acted on
 * it: hovering showed the native `title` tooltip, which would have shown anyway.
 *
 * The dead export was not merely unused. The codemod's largest and only
 * auto-fixable rule rewrites `title=` into `x-tooltip=`, so every consuming
 * codebase was being pointed at an attribute that had never worked — one
 * downstream tree had 169 findings, all of which would have been no-ops. It read
 * as an adoption problem (`codemod.d.ts` records `x-tooltip` as "delivered and
 * used zero times") when the cause was that there was nothing to adopt.
 *
 * Asked of the finished OUTPUT, for the reason `outputNeedsSignalsRuntime` is:
 * both the attribute and every rewrite that could have produced it have happened
 * by then, so no processing order can hide the answer.
 */

import { describe, expect, it } from 'bun:test'
import { getTooltipRuntime } from '../src/builtins/tooltip'
import { processDirectives } from '../src/process'
import { injectTooltipRuntime, outputNeedsTooltipRuntime } from '../src/runtime-injection'

async function render(body: string): Promise<string> {
  return processDirectives(
    `<!DOCTYPE html><html><body>${body}</body></html>`,
    {},
    `${import.meta.dir}/tooltip-fixture.stx`,
    { debug: false, cache: false } as any,
    new Set(),
  )
}

describe('a page that uses x-tooltip', () => {
  it('gets the runtime', async () => {
    const html = await render(`<button x-tooltip="Bold" title="Bold">B</button>`)

    expect(html).toContain('data-stx-tooltip-runtime')
  })

  it('gets the real runtime, not just a marker', async () => {
    // The whole defect was a runtime that existed and was never delivered. A
    // tag with the right attribute and no code in it would reproduce it exactly.
    const html = await render(`<button x-tooltip="Bold">B</button>`)

    expect(html).toContain('stx-tooltip')
    expect(html).toContain('mouseover')
    expect(html).toContain('[x-tooltip]')
  })

  it('keeps the attribute, since the runtime reads it from the DOM', async () => {
    const html = await render(`<button x-tooltip="Bold" title="Bold">B</button>`)

    expect(html).toContain('x-tooltip="Bold"')
  })

  it('injects it once, not once per element', async () => {
    const html = await render(
      `<button x-tooltip="One">1</button><button x-tooltip="Two">2</button>`,
    )

    expect(html.split('data-stx-tooltip-runtime').length - 1).toBe(1)
  })
})

describe('a page that does not', () => {
  it('gets nothing', async () => {
    const html = await render(`<p>no tooltips here</p>`)

    expect(html).not.toContain('data-stx-tooltip-runtime')
  })
})

describe('deciding whether the attribute is present', () => {
  it('requires it to be inside a tag', () => {
    // Documentation that names the attribute is prose, not markup — the same
    // distinction `blankInertHtmlRegions` draws for the signals runtime, and the
    // reason a docs page does not ship a runtime it never uses (#1835).
    expect(outputNeedsTooltipRuntime('<p>Use x-tooltip="..." to add one.</p>')).toBe(false)
    expect(outputNeedsTooltipRuntime('<button x-tooltip="Save">S</button>')).toBe(true)
  })

  it('allows a `>` inside the tooltip text', () => {
    // A tooltip reading `a > b` is ordinary, and stopping the scan at the first
    // `>` would miss it — the same trap that silently killed bindings in #1771.
    expect(outputNeedsTooltipRuntime('<button x-tooltip="a > b">x</button>')).toBe(true)
  })
})

describe('where the runtime is placed', () => {
  it('goes before the LAST </body>, never the first', () => {
    /*
     * CLAUDE.md item 24. The first `</body>` in a document is routinely inside
     * a script's string content — the router and x-element runtimes both carry
     * one — so `.replace('</body>', …)` injects into the middle of another
     * script and breaks the page. This fixture is that shape exactly.
     */
    const page = `<html><body><script>var t = "</body>";</script>`
      + `<button x-tooltip="Save">S</button></body></html>`

    const out = injectTooltipRuntime(page)
    const runtimeAt = out.indexOf('data-stx-tooltip-runtime')
    const decoyAt = out.indexOf('var t =')

    expect(runtimeAt).toBeGreaterThan(decoyAt)
    expect(out).toContain('var t = "</body>";')
    expect(runtimeAt).toBeLessThan(out.lastIndexOf('</body>'))
  })

  it('appends when there is no body to close', () => {
    // A fragment has no `</body>`. Dropping the runtime there would make the
    // attribute silently dead again, which is the bug.
    const out = injectTooltipRuntime(`<button x-tooltip="Save">S</button>`)

    expect(out).toContain('data-stx-tooltip-runtime')
  })

  it('does not add a second copy to a page that already has one', () => {
    const once = injectTooltipRuntime(`<button x-tooltip="Save">S</button>`)

    expect(injectTooltipRuntime(once)).toBe(once)
  })
})

describe('the runtime source itself', () => {
  it('binds by delegation, so elements added later are covered', () => {
    // Delegation is why this is not a registered builtin: one listener pair on
    // `document` costs nothing when nothing matches, and needs no per-element
    // wiring for content that arrives after hydration or an SPA swap.
    const source = getTooltipRuntime()

    expect(source).toContain('document.addEventListener')
    expect(source).toContain('closest("[x-tooltip]")')
  })

  it('responds to keyboard focus, not only to hover', () => {
    // A tooltip only reachable by mouse is not reachable by everyone.
    const source = getTooltipRuntime()

    expect(source).toContain('focusin')
    expect(source).toContain('focusout')
  })
})
