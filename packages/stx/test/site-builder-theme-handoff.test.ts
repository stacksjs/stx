/**
 * Only one pre-paint theme system runs (stacksjs/stx#1812).
 *
 * stx shipped two, sharing no contract: the site-builder's FOUC guard
 * (`site.theme`, storage key `theme`, adds a `dark` class) and the color-mode
 * boot script (`app.colorMode`, configured key, sets a configured attribute).
 *
 * The guard was gated only on "have I already run", so an app that configures
 * `app.colorMode` and never configures `site.theme` still got it, running on
 * defaults it never chose. Because it reads a storage key nothing writes, it
 * always resolved to its own default and stamped `class="dark"` on the root
 * element at the very top of `<head>` — before the color-mode boot set the
 * correct value.
 *
 * So the FOUC guard CAUSED a FOUC: a light-preference user carried the dark
 * class from first paint until hydration. That is the exact thing it exists to
 * prevent, and `dark` on the root is the default dark-mode strategy for
 * Crosswind/Tailwind-style utilities.
 *
 * The browser-chrome `<meta>` tags are complementary — color-mode-boot does not
 * manage `theme-color` — so those still apply.
 */
import { describe, expect, it } from 'bun:test'
import { COLOR_MODE_BOOT_MARKER, generateColorModeBootScript } from '../src/color-mode-boot'
import { injectThemeBootstrap } from '../src/site-builder/theme'

const PAGE = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><main>hi</main></body></html>'

function withColorModeBoot(): string {
  const boot = generateColorModeBootScript({ storageKey: 'app_theme', attribute: 'data-theme', darkClass: null })
  return PAGE.replace('<head>', `<head>\n  ${boot}`)
}

describe('when app.colorMode owns the theme', () => {
  const site = { theme: {} } as never

  it('does not stamp a dark class on the root element', () => {
    // The measured symptom: the wrong class from first paint until hydration.
    const out = injectThemeBootstrap(withColorModeBoot(), site)
    expect(out).not.toMatch(/<html[^>]*class="[^"]*\bdark\b/)
  })

  it('does not inject the legacy FOUC guard', () => {
    const out = injectThemeBootstrap(withColorModeBoot(), site)
    expect(out).not.toContain('data-stx-theme-guard')
    expect(out).not.toContain('__stxThemeGuard')
  })

  it('does not inject the legacy toggle handler', () => {
    const out = injectThemeBootstrap(withColorModeBoot(), site)
    expect(out).not.toContain('__stxThemeToggle')
  })

  it('leaves the color-mode boot script alone', () => {
    const out = injectThemeBootstrap(withColorModeBoot(), site)
    expect(out).toContain(COLOR_MODE_BOOT_MARKER)
  })

  it('still emits the complementary browser-chrome meta tags', () => {
    // color-mode-boot does not manage theme-color, so these are additive
    // rather than conflicting.
    const out = injectThemeBootstrap(withColorModeBoot(), site)
    expect(out).toContain('data-stx-theme-meta')
    expect(out).toContain('name="color-scheme"')
  })
})

describe('when app.colorMode is not in use', () => {
  const site = { theme: {} } as never

  it('still applies the legacy guard, unchanged', () => {
    // Apps on site.theme alone must keep working exactly as before.
    const out = injectThemeBootstrap(PAGE, site)
    expect(out).toContain('data-stx-theme-guard')
    expect(out).toMatch(/<html[^>]*class="[^"]*\bdark\b/)
    expect(out).toContain('__stxThemeToggle')
  })

  it('still honours theme:false', () => {
    expect(injectThemeBootstrap(PAGE, { theme: false } as never)).toBe(PAGE)
  })
})
