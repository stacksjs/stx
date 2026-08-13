/**
 * Two of the same widget on one page.
 *
 * Scope ids were assigned by looking each scope's state expression back up in
 * the template with a global regex. That is equivalent right up until two
 * elements carry the *same* `x-data` - which is what two of the same widget
 * looks like, and this page has two: an SSH key section and a GPG key section,
 * each `x-data="{ adding: false }"`.
 *
 * Both then matched the first scope's pattern and were tagged with the first
 * scope's id. They shared one set of signals, so opening one form opened the
 * other; and because the bridge addresses a scope with `querySelector`, only
 * the first element was ever initialised at all.
 *
 * Found in an app, by clicking the button.
 */

import { describe, expect, it } from 'bun:test'
import { processReactiveDirectives } from '../src/reactive'

/**
 * Every `data-stx-scope` on an *element*, in document order.
 *
 * The markup only: the injected bridge script names each scope again in a
 * `querySelector`, and counting those would make every assertion here pass for
 * the wrong reason.
 */
function scopeIds(html: string): string[] {
  const markup = html.slice(0, html.indexOf('<script') === -1 ? undefined : html.indexOf('<script'))

  return [...markup.matchAll(/data-stx-scope="([^"]*)"/g)].map(match => match[1]!)
}

describe('two elements with the same x-data', () => {
  it('get a scope each', () => {
    const output = processReactiveDirectives(
      `<html><body><div x-data="{ open: false }">a</div><div x-data="{ open: false }">b</div></body></html>`,
      {},
      'page.stx',
    )

    const ids = scopeIds(output)

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('are each initialised', () => {
    const output = processReactiveDirectives(
      `<html><body><div x-data="{ open: false }">a</div><div x-data="{ open: false }">b</div></body></html>`,
      {},
      'page.stx',
    )

    // One bridge call per element. With a shared id the second call selected
    // the first element and replaced its signals.
    expect(output.split('__stx_reactive.initScope(scopeEl').length - 1).toBe(2)

    for (const id of scopeIds(output))
      expect(output).toContain(`[data-stx-scope="${id}"]`)
  })

  it('keeps the ids in document order', () => {
    const output = processReactiveDirectives(
      `<html><body><div x-data="{ a: 1 }">a</div><div x-data="{ b: 2 }">b</div></body></html>`,
      {},
      'page.stx',
    )

    const [first, second] = scopeIds(output)
    const scopeOf = (id: string) => output.slice(output.indexOf(`data-stx-scope="${id}"`), output.indexOf(`data-stx-scope="${id}"`) + 120)

    // The nth element gets the nth scope, so its state expression is its own.
    expect(scopeOf(first!)).toContain('{ a: 1 }')
    expect(scopeOf(second!)).toContain('{ b: 2 }')
  })

  it('adopts a scope id an element already carries', () => {
    // From a partial's `<script client>`. The bridge has to address the element
    // that exists rather than add a second marker to it.
    const output = processReactiveDirectives(
      `<html><body><div data-stx-scope="from_partial" x-data="{ a: 1 }">a</div></body></html>`,
      {},
      'page.stx',
    )

    expect(scopeIds(output)).toEqual(['from_partial'])
    expect(output).toContain('[data-stx-scope="from_partial"]')
  })

  it('handles three of the same, which is where an off-by-one would show', () => {
    const output = processReactiveDirectives(
      `<html><body><div x-data="{ n: 0 }">a</div><div x-data="{ n: 0 }">b</div><div x-data="{ n: 0 }">c</div></body></html>`,
      {},
      'page.stx',
    )

    expect(new Set(scopeIds(output)).size).toBe(3)
    expect(output.split('__stx_reactive.initScope(scopeEl').length - 1).toBe(3)
  })
})

describe('two components rendered into one page', () => {
  /*
   * A page and each of its islands are separate calls into this module, and the
   * scope counter used to reset on every one - so each started again at
   * `__stx_scope_0`. Both elements then carried the same id, the bridge
   * addresses a scope with `querySelector`, and the second component's bindings
   * resolved against the first component's signals.
   *
   * The symptom in an application was a console line saying `summary is not
   * defined` about a scope whose element was on the page with `summary` in its
   * `x-data` - because the id pointed at the other component's element.
   */
  it('do not both claim the first scope id', () => {
    const first = processReactiveDirectives(`<div x-data="{ tail: '' }">a</div>`, {}, 'a.stx')
    const second = processReactiveDirectives(`<div x-data="{ summary: '' }">b</div>`, {}, 'b.stx')

    const ids = [...scopeIds(first), ...scopeIds(second)]

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('and a third call keeps going up rather than reusing either', () => {
    const seen = new Set<string>()

    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (const id of scopeIds(processReactiveDirectives(`<div x-data="{ n: 1 }">x</div>`, {}, 'x.stx')))
        seen.add(id)
    }

    expect(seen.size).toBe(3)
  })
})
