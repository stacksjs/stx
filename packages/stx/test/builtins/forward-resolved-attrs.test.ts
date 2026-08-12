/**
 * A builtin forwards the `:prop` bindings it does not consume (stacksjs/stx#1930).
 *
 * `<StxLink>`, `<StxImage>` and `<SafeImage>` pass unconsumed attributes through
 * onto the element they render — but only the STATIC ones. A server-evaluated
 * binding was resolved, stored on the props, and then thrown away, so
 * `<StxLink to="/x" :title="pageTitle">` emitted an `<a>` with no title and said
 * nothing about it.
 *
 * The gap was easy to miss because it looked covered from two directions:
 * client-reactive `:prop` and `@event` bindings DO reach the element, by another
 * route entirely (the renderer re-applies parent bindings to the root), and the
 * static form has worked since #1816. Only the server-evaluated middle case fell
 * through — which is the one a component reaches for when it wants an attribute
 * to depend on a prop it already has.
 *
 * The conditional case is the reason this matters rather than being cosmetic.
 * `:aria-current="active ? 'page' : null"` is how a component says "this
 * attribute is present only sometimes", and it is what a component tag has to
 * use instead of an inline `@if(...)…@endif`, which does not survive attribute
 * parsing intact. Rendering `null` as the word "null" — or dropping the whole
 * binding — both turn that into a wrong page rather than a missing one.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const dir = join(import.meta.dir, '..', 'fixtures')

async function render(template: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: dir } as any
  const out = await processDirectives(template, {}, join(dir, 'probe.stx'), options, new Set<string>())
  // The injected crosswind <style> and the runtime <script> are not evidence
  // that anything rendered; assert on markup the component itself can emit.
  return out.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').trim()
}

describe('StxLink', () => {
  it('forwards a server-evaluated binding onto the anchor', async () => {
    const out = await render([
      '<script server>const pageTitle = "Home"</script>',
      '<StxLink to="/x" :title="pageTitle">Go</StxLink>',
    ].join('\n'))

    expect(out).toContain('title="Home"')
  })

  it('keeps the author\'s spelling for a data- or aria- binding', async () => {
    // These are DOM attributes by specification, not component props — emitting
    // `dataActive` would be an attribute no browser knows.
    const out = await render([
      '<script server>const active = true</script>',
      `<StxLink to="/x" :data-active="active ? 'true' : null">Go</StxLink>`,
    ].join('\n'))

    expect(out).toContain('data-active="true"')
    expect(out).not.toContain('dataActive')
  })

  it('drops the attribute when the binding resolves to null', async () => {
    // The load-bearing case: this is how a component expresses a conditional
    // attribute. Rendering the word "null" would put `aria-current="null"` on
    // every inactive link, which assistive technology reads as a current page.
    const out = await render([
      '<script server>const active = false</script>',
      `<StxLink to="/x" :aria-current="active ? 'page' : null">Go</StxLink>`,
    ].join('\n'))

    expect(out).not.toContain('aria-current')
    expect(out).not.toContain('null')
  })

  it('drops it for undefined and false too', async () => {
    const out = await render([
      '<script server>const nothing = undefined; const off = false</script>',
      '<StxLink to="/x" :title="nothing" :hidden="off">Go</StxLink>',
    ].join('\n'))

    expect(out).not.toContain('title=')
    expect(out).not.toContain('hidden')
  })

  it('renders true as a bare attribute, as HTML booleans work', async () => {
    const out = await render([
      '<script server>const on = true</script>',
      '<StxLink to="/x" :hidden="on">Go</StxLink>',
    ].join('\n'))

    expect(out).toMatch(/<a[^>]*\shidden[\s>]/)
    expect(out).not.toContain('hidden="true"')
  })

  it('does not forward a prop it consumed itself', async () => {
    // `to` becomes the href. Forwarding it as well would emit a stray `to=`.
    const out = await render([
      '<script server>const target = "/y"</script>',
      '<StxLink :to="target">Go</StxLink>',
    ].join('\n'))

    expect(out).toContain('href="/y"')
    expect(out).not.toMatch(/\sto="/)
  })
})

describe('StxImage', () => {
  it('forwards a server-evaluated binding onto the img', async () => {
    const out = await render([
      '<script server>const testId = "hero"</script>',
      '<StxImage src="/a.png" alt="A" width="10" height="10" :data-testid="testId" />',
    ].join('\n'))

    expect(out).toContain('data-testid="hero"')
  })
})
