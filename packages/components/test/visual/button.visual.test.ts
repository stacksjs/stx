/**
 * Visual regression tests for Button component
 */

import type { VariantConfig } from './visual-test-utils'
import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { SEMANTIC_TOKENS } from '../../../stx/src/theme-tokens'
import {
  expectSnapshotMatch,
  testComponentTemplate,
  testComponentVariants,
  testDarkModeSupport,
  testResponsiveSupport,

} from './visual-test-utils'

const BUTTON_PATH = join(__dirname, '../../src/ui/button/Button.stx')

describe('Button Visual Regression', () => {
  describe('Template Snapshot', () => {
    it('should match template structure snapshot', async () => {
      const result = await testComponentTemplate(BUTTON_PATH, 'button')
      expectSnapshotMatch(result)
    })
  })

  describe('Dark Mode Support', () => {
    /*
     * This asserted `darkClasses.length > 0` - that the button carried at
     * least one `dark:` variant. Button now carries NONE, and that is the
     * goal rather than a regression: every colour it paints comes from a role
     * token, whose `.dark` block supplies the dark value, so there is nothing
     * left for a variant to override (stacksjs/stx#1993).
     *
     * A `dark:` variant was in fact the thing that made the library
     * unthemeable. `dark:bg-neutral-600` is a second hard-coded shade that an
     * app cannot redirect, and it wins over whatever `bg-<role>` resolves to,
     * so a themed app got its colour in light mode and Tailwind's in dark.
     *
     * So the property is "every painted colour is dark-mode aware", and a role
     * token satisfies it the same way a variant does. 56 of the 102 components
     * now carry no `dark:` at all.
     */
    it('is dark-mode aware without needing a single dark: variant', async () => {
      const result = await testDarkModeSupport(BUTTON_PATH, 'button')

      expect(result.hasDarkModeClasses).toBe(true)
      expect(result.tokenClasses.length).toBeGreaterThan(0)
      expect(result.darkClasses).toEqual([])
    })

    /*
     * This asserted the literal classes `dark:bg-blue-600` and
     * `dark:bg-red-600`, on the reasoning that a solid fill must keep an
     * explicit dark value because a role token's dark value LIGHTENS for
     * legible text, and folding them together made every primary button paler
     * in dark mode (stacksjs/stx#1930).
     *
     * That reasoning is intact and is now the job of a dedicated role. The
     * fills moved onto `accent-solid` / `danger-solid`, which exist precisely
     * because a fill and coloured text need different dark values - and their
     * dark values ARE blue-600 and red-600, the colours the `dark:` variants
     * produced (stacksjs/stx#1993).
     *
     * So the assertion is on the resolved colour rather than the spelling,
     * which is what #1930 was actually protecting. Checking the class name
     * would forbid the migration while proving nothing about what a reader
     * sees.
     */
    it('keeps the solid fills from lightening in dark mode', async () => {
      const result = await testDarkModeSupport(BUTTON_PATH, 'button')

      for (const expected of ['bg-accent-solid', 'bg-danger-solid'])
        expect(result.tokenClasses).toContain(expected)

      // One step DARKER than the light fill, not lighter.
      expect(SEMANTIC_TOKENS['accent-solid']).toMatchObject({ light: 'blue-500', dark: 'blue-600' })
      expect(SEMANTIC_TOKENS['danger-solid']).toMatchObject({ light: 'red-500', dark: 'red-600' })

      // The neutral surfaces moved onto role tokens, which carry their dark
      // value through `--stx-*` rather than a variant - the hovers included.
      // `hover:bg-surface-raised` was the ghost variant's highlight and
      // resolves to the same two shades as `surface-hover`; the rename is what
      // let the secondary variant drop its last `dark:` twin, since
      // `surface-sunken-hover` holds both halves of the pair it spelled out.
      for (const expected of ['bg-surface-sunken', 'hover:bg-surface-sunken-hover', 'hover:bg-surface-hover'])
        expect(result.tokenClasses).toContain(expected)
    })
  })

  describe('Responsive Support', () => {
    it('should check for responsive classes', async () => {
      const result = await testResponsiveSupport(BUTTON_PATH, 'button')
      // Button may or may not have responsive classes by design
      // This test documents the current state
      expect(typeof result.hasResponsiveClasses).toBe('boolean')
    })
  })

  describe('Variant Configurations', () => {
    const variants: VariantConfig[] = [
      { name: 'default', props: {}, slotContent: 'Click me' },
      { name: 'primary', props: { variant: 'primary' }, slotContent: 'Primary Button' },
      { name: 'secondary', props: { variant: 'secondary' }, slotContent: 'Secondary Button' },
      { name: 'outline', props: { variant: 'outline' }, slotContent: 'Outline Button' },
      { name: 'ghost', props: { variant: 'ghost' }, slotContent: 'Ghost Button' },
      { name: 'danger', props: { variant: 'danger' }, slotContent: 'Danger Button' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(BUTTON_PATH, 'button', variants)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('Size Configurations', () => {
    const sizes: VariantConfig[] = [
      { name: 'size-xs', props: { size: 'xs' }, slotContent: 'XS' },
      { name: 'size-sm', props: { size: 'sm' }, slotContent: 'SM' },
      { name: 'size-md', props: { size: 'md' }, slotContent: 'MD' },
      { name: 'size-lg', props: { size: 'lg' }, slotContent: 'LG' },
      { name: 'size-xl', props: { size: 'xl' }, slotContent: 'XL' },
    ]

    it('should match size snapshots', async () => {
      const results = await testComponentVariants(BUTTON_PATH, 'button', sizes)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('State Configurations', () => {
    const states: VariantConfig[] = [
      { name: 'disabled', props: { disabled: true }, slotContent: 'Disabled' },
      { name: 'loading', props: { loading: true }, slotContent: 'Loading' },
      { name: 'full-width', props: { fullWidth: true }, slotContent: 'Full Width' },
    ]

    it('should match state snapshots', async () => {
      const results = await testComponentVariants(BUTTON_PATH, 'button', states)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('Combined Props', () => {
    const combinations: VariantConfig[] = [
      { name: 'primary-lg-disabled', props: { variant: 'primary', size: 'lg', disabled: true }, slotContent: 'Disabled Large' },
      { name: 'danger-sm-loading', props: { variant: 'danger', size: 'sm', loading: true }, slotContent: 'Loading Small Danger' },
      { name: 'outline-full-width', props: { variant: 'outline', fullWidth: true }, slotContent: 'Full Width Outline' },
    ]

    it('should match combined props snapshots', async () => {
      const results = await testComponentVariants(BUTTON_PATH, 'button', combinations)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })
})
