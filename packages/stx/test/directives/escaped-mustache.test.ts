/**
 * `@{{ … }}` renders the braces instead of evaluating them.
 *
 * It did not. The pipeline rewrote `@{{ name }}` to `{{ name }}` *before* the
 * expression processor ran, so the escape did nothing whatsoever and
 * `@{{ name }}` rendered `Alice`, byte for byte the same as the unescaped
 * form. `docs/api/directives.md` and `ARCHITECTURE.md` have always documented
 * it as emitting a literal.
 *
 * Two tests were named after the feature and neither asserted it. One built a
 * page and checked `<div class="literal"></div>` -- the EMPTY div -- with a
 * comment calling that "the current implementation"; the other asserted
 * `toBeDefined()`. So the behaviour was pinned backwards and the real
 * behaviour was never covered.
 *
 * Both halves matter and the second is the subtle one. Restoring a plain
 * `{{ name }}` into the HTML is not enough: the signals runtime interpolates
 * text nodes at hydration, and it BLANKS an expression it cannot resolve --
 * measured -- so a documented `@{{ variableName }}` would come out as empty
 * text on any page that ships signals. The restored form splits the braces
 * with an HTML comment, which the browser renders as `{{ name }}` and the
 * runtime cannot match, because its scan is per text node.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const FIXTURE = path.join(import.meta.dir, 'escaped-mustache.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, FIXTURE, { root: import.meta.dir, buildMode: 'serve', cache: false } as never, new Set<string>())
}

describe('the server does not evaluate an escaped mustache', () => {
  it('leaves the expression unevaluated', async () => {
    const html = await render('<script server>\nconst name = \'Alice\'\n</script>\n<p id="e">@{{ name }}</p>')
    // The bug in one assertion: this used to be "Alice".
    expect(html).not.toContain('>Alice<')
    expect(html).toContain('{ name }}')
  })

  it('still evaluates the unescaped form beside it', async () => {
    const html = await render('<script server>\nconst name = \'Alice\'\n</script>\n<p id="l">{{ name }}</p><p id="e">@{{ name }}</p>')
    expect(html).toContain('<p id="l">Alice</p>')
    expect(html).not.toContain('<p id="e">Alice</p>')
  })

  it('does not leave the at-sign in the output', async () => {
    const html = await render('<p id="e">@{{ name }}</p>')
    expect(html).not.toContain('@{{')
  })

  it('keeps the expression text verbatim, spacing included', async () => {
    const html = await render('<p id="e">@{{ user.name | upper }}</p>')
    expect(html).toContain('{ user.name | upper }}')
  })

  it('handles the multi-line spelling', async () => {
    const html = await render('<p id="e">@{{\n  complexExpression\n}}</p>')
    expect(html).toContain('complexExpression')
    expect(html).not.toContain('@{{')
  })

  it('leaves @@ alone, which is a different escape', async () => {
    const html = await render('<p id="e">@@if(x) y @@endif</p>')
    expect(html).toContain('@if(x) y @endif')
  })
})

describe('the browser sees the braces', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
  let booted = 0

  /** Hydrate rendered markup the way a page would, and read the text back. */
  async function hydrated(markup: string, scope: Record<string, unknown>): Promise<string> {
    const name = `esc_mustache_${++booted}`
    window[`__stx_setup_${name}`] = () => scope
    document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await settle()
    return document.querySelector('#e').textContent
  }

  it('reads as the literal braces, not as empty text', async () => {
    // The failure this form exists to prevent. A plain restored `{{ name }}`
    // would be interpolated here and blanked, because the runtime cannot
    // resolve a name that was never meant to be one.
    const text = await hydrated('<p id="e">{<!--stx-literal-->{ variableName }}</p>', { who: window.stx.state('Alice') })
    expect(text).toBe('{{ variableName }}')
  })

  it('is not bound even when the name IS in client scope', async () => {
    // The stricter case: the runtime could resolve it, and must not try.
    const text = await hydrated('<p id="e">{<!--stx-literal-->{ who }}</p>', { who: window.stx.state('Alice') })
    expect(text).toBe('{{ who }}')
    expect(text).not.toContain('Alice')
  })

  it('does not stop a real mustache in the same element from binding', async () => {
    const text = await hydrated(
      '<p id="e">{<!--stx-literal-->{ who }} and {{ who }}</p>',
      { who: window.stx.state('Alice') },
    )
    expect(text).toBe('{{ who }} and Alice')
  })

  it('confirms the unescaped form really would have been blanked', async () => {
    // Establishes the premise of the first test rather than asserting it from
    // the outside: an unresolvable mustache is blanked, so the comment is
    // load-bearing and not decoration.
    const text = await hydrated('<p id="e">{{ variableName }}</p>', { who: window.stx.state('Alice') })
    expect(text).toBe('')
  })
})
