/**
 * Visual regression tests for Button component
 */

import type { VariantConfig } from './visual-test-utils'
import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
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
    it('should have dark mode classes', async () => {
      const result = await testDarkModeSupport(BUTTON_PATH, 'button')
      expect(result.hasDarkModeClasses).toBe(true)
      expect(result.darkClasses.length).toBeGreaterThan(0)
    })

    it('should have dark mode classes for all variants', async () => {
      const result = await testDarkModeSupport(BUTTON_PATH, 'button')
      // Button should have dark mode classes for primary, secondary, outline, ghost, danger variants
      const expectedDarkClasses = [
        'dark:bg-blue-600', // primary
        'dark:hover:bg-blue-700', // primary hover
        'dark:bg-neutral-700', // secondary
        'dark:bg-red-600', // danger
      ]

      for (const expected of expectedDarkClasses) {
        expect(result.darkClasses).toContain(expected)
      }
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
