/**
 * A server value interpolated into a component's client script is a JS literal
 * (stacksjs/stx#1894, and #1757 before it).
 *
 * `const persistKeyProp = {{ persistKey }}` has to emit
 * `const persistKeyProp = "stacks-dashboard-sidebar";`. Emitting the raw text
 * produces `= stacks-dashboard-sidebar;`, which is a ReferenceError, and an
 * empty string produces `= ;`, which is a SyntaxError — and ONE syntax error
 * kills the whole block, so every statement after it silently never runs. The
 * component renders, the page answers 200, and its controller is simply absent.
 *
 * ## Why this is easy to get wrong twice
 *
 * Booleans and numbers survive raw substitution, because their text happens to
 * be valid JavaScript. So the failure looks selective — `collapsed = false` and
 * `width = 250` are fine while every string is broken — which reads like a
 * problem with those particular props rather than with the encoding.
 *
 * #1757 was the same class through a different door: `processExpressions`
 * HTML-escapes, so a value containing a quote emitted `&quot;` into the JS and
 * the bundle died with `Unexpected token '&'`. It broke every component that
 * seeds a client signal from a server prop. The fix was to route the component
 * path through `interpolateScriptExpressions`, which applies JSON rules.
 *
 * These pin the encoding at the boundary rather than the plumbing behind it, so
 * they hold whichever pass ends up doing the substitution.
 */

import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'

/** Render a page that uses a component, from a temp tree with a components dir. */
async function renderWithComponent(component: string, page: string): Promise<string> {
  const dir = `${import.meta.dir}/.tmp-cs-${crypto.randomUUID()}`
  await Bun.write(`${dir}/components/Widget.stx`, component)
  await Bun.write(`${dir}/page.stx`, page)

  try {
    return await renderTemplate(`${dir}/page.stx`, { context: {} } as any)
  }
  finally {
    await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
  }
}

const WIDGET = `<script server>
export const persistKey = $props.persistKey || ''
export const shellSelector = $props.shellSelector || ''
export const widthVar = $props.widthVar || '--stx-sidebar-width'
export const collapsedClass = $props.collapsedClass || ''
export const width = $props.width || 250
export const collapsed = $props.collapsed ?? false
</script>
<script client>
const persistKeyProp = {{ persistKey }}
const shellSelectorProp = {{ shellSelector }}
const widthVarProp = {{ widthVar }}
const collapsedClassProp = {{ collapsedClass }}
const widthProp = {{ width }}
const collapsedProp = {{ collapsed }}
</script>
<div data-widget></div>`

describe('a component\'s client script is valid JavaScript', () => {
  it('quotes every string prop, and never emits a bare assignment', async () => {
    const html = await renderWithComponent(WIDGET, `<div><Widget
      persistKey="stacks-dashboard-sidebar"
      shellSelector="[data-stx-content]"
    /></div>`)

    expect(html).toContain('const persistKeyProp = "stacks-dashboard-sidebar"')
    expect(html).toContain('const shellSelectorProp = "[data-stx-content]"')
    expect(html).toContain('const widthVarProp = "--stx-sidebar-width"')

    // The reported unconditional failure: `collapsedClass` defaults to '', so
    // EVERY use of the component emitted `= ;` whether or not it was passed.
    expect(html).toContain('const collapsedClassProp = ""')
    expect(html).not.toMatch(/[A-Za-z]+Prop\s*=\s*;/)
  })

  it('leaves numbers and booleans as numbers and booleans', async () => {
    // These survive raw substitution too, which is what made the bug look
    // selective. They still have to be right.
    const html = await renderWithComponent(WIDGET, `<div><Widget /></div>`)

    expect(html).toContain('const widthProp = 250')
    expect(html).toContain('const collapsedProp = false')
  })

  it('emits no unresolved interpolation into the script', async () => {
    // A surviving `{{ … }}` is not valid JavaScript either, and it is the
    // shape that turns into raw text if a later pass substitutes it.
    const html = await renderWithComponent(WIDGET, `<div><Widget persistKey="k" /></div>`)
    // Narrowed to the component's own block: the injected signals runtime is
    // also a <script>, and it legitimately contains brace pairs of its own.
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
      .map(m => m[1])
      .filter(body => body.includes('persistKeyProp'))

    expect(scripts.length).toBeGreaterThan(0)
    for (const body of scripts)
      expect(body).not.toMatch(/\{\{|\}\}/)
  })

  it('survives a value that would break out of the script or the literal', async () => {
    /*
     * The #1757 half. A quote must not end the literal, and `</script>` inside
     * a value must not close the tag — `interpolateScriptExpressions` escapes
     * `<` as `\\u003c` for exactly this.
     */
    const html = await renderWithComponent(WIDGET, `<div><Widget persistKey='he said "hi" </script>' /></div>`)

    expect(html).not.toContain('const persistKeyProp = "he said "hi"')
    expect(html).not.toMatch(/const persistKeyProp = [^;\n]*<\/script>/)
  })
})
