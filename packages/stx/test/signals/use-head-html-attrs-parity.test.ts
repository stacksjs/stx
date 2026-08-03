/**
 * `useHead({ htmlAttrs })` applies EVERY attribute, in both reactive impls
 * (stacksjs/stx#1798).
 *
 * The runtime impl (the template literal in signals.ts, which owns
 * `window.stx.useHead`) only ever read `htmlAttrs.lang` and dropped the rest,
 * while the module impl (head.ts `applyHead`) applied all of them — the exact
 * kind of drift CLAUDE.md's "dual reactive implementations" note exists to
 * catch. A root-level `class` is the main reason to reach for `htmlAttrs` at
 * all, and it was the one thing the client runtime ignored.
 *
 * `class` merges rather than replaces in both, because the pre-paint
 * color-mode boot script owns a class on this same element — `setAttribute
 * ('class', …)` would drop `dark` and flash the wrong theme on hydration.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { applyHead } from '../../src/head'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

type Apply = (config: Record<string, any>) => void

// Installs window.stx. The runtime impl below resolves it lazily, at test time.
beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

const IMPLS: Array<[string, Apply]> = [
  ['runtime (window.stx)', cfg => g.window.stx.useHead(cfg)],
  ['module (head.ts)', cfg => applyHead(cfg)],
]

function root(): HTMLElement {
  return g.document.documentElement
}

function reset(): void {
  for (const name of root().getAttributeNames())
    root().removeAttribute(name)
}

afterEach(reset)
afterAll(reset)

describe('useHead htmlAttrs — dual-impl parity', () => {
  for (const [name, apply] of IMPLS) {
    describe(name, () => {
      it('sets a class on the root element', () => {
        apply({ htmlAttrs: { class: 'marketing' } })
        expect(root().classList.contains('marketing')).toBe(true)
      })

      it('sets non-class attributes', () => {
        apply({ htmlAttrs: { 'data-theme': 'sunset', 'dir': 'rtl' } })
        expect(root().getAttribute('data-theme')).toBe('sunset')
        expect(root().getAttribute('dir')).toBe('rtl')
      })

      it('still sets lang', () => {
        apply({ htmlAttrs: { lang: 'fr' } })
        expect(root().getAttribute('lang')).toBe('fr')
      })

      it('merges class instead of clobbering the boot script\'s', () => {
        // The pre-paint color-mode script put `dark` here before hydration ran.
        root().classList.add('dark')
        apply({ htmlAttrs: { class: 'marketing' } })
        expect(root().classList.contains('dark')).toBe(true)
        expect(root().classList.contains('marketing')).toBe(true)
      })

      it('accepts multiple classes in one string', () => {
        apply({ htmlAttrs: { class: 'marketing wide' } })
        expect(root().classList.contains('marketing')).toBe(true)
        expect(root().classList.contains('wide')).toBe(true)
      })

      it('is a no-op without htmlAttrs', () => {
        root().classList.add('dark')
        apply({ title: 'Just a title' })
        expect(root().getAttribute('class')).toBe('dark')
      })
    })
  }
})
