/**
 * `<component :is>` resolving to an ELEMENT (stacksjs/stx#1826).
 *
 * The polymorphic-`as` pattern the shipped component library is built on names
 * an HTML element, not a component: nine components in @stacksjs/components
 * render `<component :is="{{ as }}">` where `as` defaults to `div`, `h3`, `p`,
 * `span` or `label`. Not one of them names a component file.
 *
 * Two things were wrong, and either alone is fatal:
 *
 *   1. By the time processDynamicComponents runs, `{{ as }}` has already been
 *      interpolated, so the expression is the literal `div`. safeEvaluate read
 *      that as a VARIABLE name, found nothing, and took the "could not resolve"
 *      branch — which replaces the whole element AND swallows its slot content.
 *      A dialog lost its confirmation text, silently, on a 200.
 *   2. Even when the expression did resolve — `:is="as"` with `as = 'div'` in
 *      context — the resolved name went to the component loader, which looked
 *      for a FILE named `div` and rendered
 *      "[Error loading component: ENOENT … open 'div']" into the page.
 *
 * So the element path did not exist at all. These tests pin it, and pin the two
 * failure modes that must stay failures: an unresolvable name still yields the
 * placeholder comment rather than a component lookup whose ENOENT would put an
 * absolute filesystem path in the response body.
 */
import { describe, expect, it } from 'bun:test'
import { processDynamicComponents } from '../../src/dynamic-components'

const options = { componentsDir: '/nonexistent-on-purpose' } as any

async function render(template: string, context: Record<string, any> = {}): Promise<string> {
  return processDynamicComponents(template, context, 'probe.stx', options)
}

describe('<component :is="{{ as }}"> — the form the library actually writes', () => {
  // The premise above ("`{{ as }}` has already been interpolated by the time
  // processDynamicComponents runs") holds on the page path and NOT on the
  // component path, which is where all 26 of these live. There the mustache is
  // still raw, so evaluating the expression whole found nothing and the element
  // path — correct in every other respect — was never reached.
  //
  // The failure disguised itself. The placeholder comment embeds the expression
  // it could not resolve, the later expression pass then interpolated the
  // mustache INSIDE that comment, and the page read
  // `could not resolve "div"` — which looks like a resolver handed a tag name
  // and refusing it, rather than one that never saw the value.
  it('resolves the mustache against context and renders the element', async () => {
    const out = await render('<component :is="{{ as }}" class="panel">hello</component>', { as: 'div' })
    expect(out).toBe('<div class="panel">hello</div>')
  })

  it('keeps the slot content, which the placeholder used to swallow', async () => {
    const out = await render('<component :is="{{ as }}"><p>dialog-ok</p></component>', { as: 'section' })
    expect(out).toContain('dialog-ok')
  })

  it('covers each default the library passes', async () => {
    for (const tag of ['div', 'h3', 'p', 'span', 'label', 'button', 'ul', 'li']) {
      const out = await render('<component :is="{{ as }}" class="c">x</component>', { as: tag })
      expect(out).toBe(`<${tag} class="c">x</${tag}>`)
    }
  })

  it('handles the self-closing form', async () => {
    const out = await render('<component :is="{{ as }}" aria-hidden="true" />', { as: 'div' })
    expect(out).toContain('aria-hidden="true"')
    expect(out).not.toContain('could not resolve')
  })

  it('reports the inner expression when it cannot resolve, not a value', async () => {
    // Keeping the braces meant the diagnostic was itself interpolated, so it
    // named whatever the expression evaluated to elsewhere — the single most
    // misleading thing it could have said.
    const out = await render('<component :is="{{ nope }}">x</component>')
    expect(out).toContain('could not resolve "nope"')
    expect(out).not.toContain('{{')
  })
})

describe('<component :is> resolving to an element', () => {
  it('renders an already-interpolated literal tag and keeps the slot', async () => {
    const out = await render('<component :is="div" class="panel">hello</component>')
    expect(out).toBe('<div class="panel">hello</div>')
  })

  it('renders a tag held in a context variable', async () => {
    const out = await render('<component :is="as" class="panel">hello</component>', { as: 'section' })
    expect(out).toBe('<section class="panel">hello</section>')
  })

  it('keeps every attribute except the :is binding itself', async () => {
    const out = await render('<component :is="button" type="button" @click="go" aria-pressed="false">Go</component>')
    expect(out).toBe('<button type="button" @click="go" aria-pressed="false">Go</button>')
    expect(out).not.toContain(':is')
  })

  it('handles the self-closing form, which DialogBackdrop uses', async () => {
    const out = await render('<component :is="div" class="bd" aria-hidden="true" />')
    expect(out).toBe('<div class="bd" aria-hidden="true"></div>')
  })

  it('does not emit a closing tag for a void element', async () => {
    const out = await render('<component :is="img" src="/a.png" />')
    expect(out).toBe('<img src="/a.png">')
  })

  it('covers the tags the component library actually passes', async () => {
    for (const tag of ['div', 'button', 'ul', 'li', 'label', 'span', 'p', 'h3']) {
      const out = await render(`<component :is="${tag}" class="c">x</component>`)
      expect(out).toBe(`<${tag} class="c">x</${tag}>`)
    }
  })
})

describe('<component :is> that cannot resolve', () => {
  it('leaves the placeholder comment for an unknown identifier', async () => {
    const out = await render('<component :is="nope">x</component>')
    expect(out).toContain('could not resolve')
  })

  it('does not leak a filesystem path when the name is not a tag', async () => {
    // The literal fallback is deliberately limited to known element names. A
    // bare identifier reaching the component loader would render
    // "[Error loading component: ENOENT: no such file or directory, open …]"
    // with an absolute path, into the page.
    const out = await render('<component :is="nope">x</component>')
    expect(out).not.toContain('ENOENT')
    expect(out).not.toContain('/')
  })

  it('leaves the placeholder comment for a non-identifier expression', async () => {
    const out = await render('<component :is="1 + 1">x</component>')
    expect(out).toContain('could not resolve')
  })
})
