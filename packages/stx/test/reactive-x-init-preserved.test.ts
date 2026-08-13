/**
 * `x-init` has to survive into the markup, not only into the bridge script.
 *
 * `finalizeTemplate` renamed `x-data` to `data-stx-xdata` - so a scope can be
 * re-initialized after an SPA swap, where the bridge `<script>` does not run
 * again - and *deleted* `x-init`, on the reasoning that the bridge carries it.
 *
 * The bridge carries it only where the bridge runs. It does not run again after
 * an SPA navigation, and it does not reach a component rendered as an island:
 * its selectors are generated per render, so a page with three islands emits
 * three scripts all addressing `__stx_scope_0`. In both cases the element
 * arrived carrying its state and nothing else, and the hydrator initialized a
 * scope with no setup.
 *
 * Nothing errors when that happens, which is what makes it expensive. Every
 * binding renders its initial value and whatever `x-init` was supposed to start
 * - a poll, a subscription, a fetch - never starts. A live region shows its
 * empty state forever, which is exactly what it shows when nothing has happened
 * yet. Found in an application whose "somebody commented while you were
 * reading" banner had never once appeared.
 */

import { describe, expect, it } from 'bun:test'
import { processReactiveDirectives } from '../src/reactive'

const TEMPLATE = `<div x-data="{ tail: '' }" x-init="handle = watch({ onOutput: (t) => { tail = tail + t } })">
  <pre x-text="tail"></pre>
</div>`

describe('x-init on a scope element', () => {
  it('is kept in the markup, where a hydrator can find it', () => {
    const html = processReactiveDirectives(TEMPLATE, {}, 'test.stx')
    const markup = html.slice(0, html.indexOf('<script') === -1 ? undefined : html.indexOf('<script'))

    expect(markup).toContain('data-stx-xinit=')
    expect(markup).toContain('watch({ onOutput')
  })

  it('and the element still carries its state expression', () => {
    // Both, or neither is any use: a scope needs its data to render and its
    // init to do anything.
    const markup = processReactiveDirectives(TEMPLATE, {}, 'test.stx')

    expect(markup).toContain('data-stx-xdata=')
  })

  it('the original attribute is gone, so nothing runs it twice', () => {
    const html = processReactiveDirectives(TEMPLATE, {}, 'test.stx')
    const markup = html.slice(0, html.indexOf('<script') === -1 ? undefined : html.indexOf('<script'))

    expect(markup).not.toMatch(/\sx-init\s*=/)
    expect(markup).not.toMatch(/\sx-data\s*=/)
  })

  it('the bridge script still initializes the scope itself', () => {
    // The renaming is a safety net for the paths the bridge cannot reach, not
    // a replacement for it. Where it does run, it is still what starts the
    // scope - and it passes the init expression, as it always did.
    const html = processReactiveDirectives(TEMPLATE, {}, 'test.stx')

    expect(html).toContain('initScope')
    expect(html).toContain('onOutput')
  })

  it('a scope with no init is unaffected', () => {
    const html = processReactiveDirectives('<div x-data="{ open: false }"><b x-text="open"></b></div>', {}, 'test.stx')

    expect(html).toContain('data-stx-xdata=')
    expect(html).not.toContain('data-stx-xinit=')
  })
})
