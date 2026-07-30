import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

/**
 * Attribute pass-through on builtin components.
 *
 * A static attribute on a component tag is two things at once, and they
 * disagree about naming. To a `.stx` component it is a prop, and `active-class`
 * has to arrive as `$props.activeClass` because a kebab key cannot be
 * destructured. To a builtin that forwards unconsumed attributes onto real
 * markup it is an HTML attribute, and has to go out spelled the way the author
 * wrote it.
 *
 * Camelizing static props served the first and broke the second: `<StxLink
 * aria-label="Shop">` started emitting `ariaLabel="Shop"`, an attribute no
 * browser knows — and because the forwarded name no longer matched, the
 * XSS-escaping assertions on `aria-label` went quiet too. `staticNames` keeps
 * the author's spelling alongside the camelized key so both readings hold.
 */

const pagePath = path.resolve(__dirname, 'attr-forwarding-page.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, pagePath, { debug: false }, new Set<string>())
}

describe('builtin attribute forwarding', () => {
  it('forwards hyphenated attributes under the name the author wrote', async () => {
    const output = await render(
      '<StxLink to="/shop" aria-label="Shop now" data-testid="nav-shop" hreflang="en">Shop</StxLink>',
    )

    expect(output).toContain('aria-label="Shop now"')
    expect(output).toContain('data-testid="nav-shop"')
    expect(output).toContain('hreflang="en"')
    // The camelized prop key must never reach the DOM.
    expect(output).not.toContain('ariaLabel')
    expect(output).not.toContain('dataTestid')
  })

  it('still escapes forwarded values', async () => {
    const output = await render(
      '<StxLink to="/x" aria-label="<script>alert(1)</script>" data-note=\'a" onload="alert(1)\'>go</StxLink>',
    )

    expect(output).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt;"')
    expect(output).not.toContain('<script>alert(1)</script>')
    expect(output).not.toContain('onload="alert(1)"')
  })

  it('forwards on the image builtins too', async () => {
    const image = await render('<StxImage src="/a.png" alt="A" data-role="hero" />')
    expect(image).toContain('data-role="hero"')
    expect(image).not.toContain('dataRole')

    const safe = await render('<SafeImage src="/a.png" alt="A" aria-hidden="true" />')
    expect(safe).toContain('aria-hidden="true"')
    expect(safe).not.toContain('ariaHidden')
  })

  it('keeps camelizing names that are genuinely component props', async () => {
    // `active-class` is StxLink's own prop, not a DOM attribute: it is consumed
    // under its camelized name and must not also leak out as an attribute.
    const output = await render('<StxLink to="/x" active-class="on">go</StxLink>')
    const anchor = output.match(/<a\s[^>]*>/)?.[0] || ''

    expect(anchor).toContain('data-stx-active-class="on"')
    // Consumed, so it is not ALSO forwarded — in either spelling. Matched on
    // the tag with a leading space so the `data-stx-` prefixed attribute the
    // builtin does emit is not mistaken for a bare pass-through.
    expect(anchor).not.toContain(' active-class=')
    expect(anchor).not.toContain('activeClass=')
  })
})
