/**
 * Visual regression tests for Switch component
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import {
  expectSnapshotMatch,
  testComponentTemplate,
  testComponentVariants,
  testDarkModeSupport,
  testResponsiveSupport,
  type VariantConfig,
} from './visual-test-utils'

const SWITCH_PATH = join(__dirname, '../../src/ui/switch/Switch.stx')

describe('Switch Visual Regression', () => {
  describe('Template Snapshot', () => {
    it('should match template structure snapshot', async () => {
      const result = await testComponentTemplate(SWITCH_PATH, 'switch')
      expectSnapshotMatch(result)
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', async () => {
      const result = await testDarkModeSupport(SWITCH_PATH, 'switch')
      expect(result.hasDarkModeClasses).toBe(true)
      expect(result.darkClasses.length).toBeGreaterThan(0)
    })

    it('should have dark mode classes for track and label', async () => {
      const result = await testDarkModeSupport(SWITCH_PATH, 'switch')
      // Switch should have dark mode classes for track background and label text
      expect(result.darkClasses.some(c => c.includes('dark:bg-'))).toBe(true)
    })
  })

  describe('Responsive Support', () => {
    it('should check for responsive classes', async () => {
      const result = await testResponsiveSupport(SWITCH_PATH, 'switch')
      expect(typeof result.hasResponsiveClasses).toBe('boolean')
    })
  })

  describe('Variant Configurations', () => {
    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'checked', props: { checked: true } },
      { name: 'unchecked', props: { checked: false } },
      { name: 'with-label', props: { label: 'Enable feature' } },
      { name: 'checked-with-label', props: { checked: true, label: 'Enabled' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(SWITCH_PATH, 'switch', variants)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('Size Configurations', () => {
    const sizes: VariantConfig[] = [
      { name: 'size-sm', props: { size: 'sm' } },
      { name: 'size-md', props: { size: 'md' } },
      { name: 'size-lg', props: { size: 'lg' } },
      { name: 'size-sm-checked', props: { size: 'sm', checked: true } },
      { name: 'size-lg-checked', props: { size: 'lg', checked: true } },
    ]

    it('should match size snapshots', async () => {
      const results = await testComponentVariants(SWITCH_PATH, 'switch', sizes)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('State Configurations', () => {
    const states: VariantConfig[] = [
      { name: 'disabled-off', props: { disabled: true, checked: false } },
      { name: 'disabled-on', props: { disabled: true, checked: true } },
      { name: 'disabled-with-label', props: { disabled: true, label: 'Disabled option' } },
    ]

    it('should match state snapshots', async () => {
      const results = await testComponentVariants(SWITCH_PATH, 'switch', states)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  describe('Combined Props', () => {
    const combinations: VariantConfig[] = [
      { name: 'sm-checked-label', props: { size: 'sm', checked: true, label: 'Small on' } },
      { name: 'lg-disabled-label', props: { size: 'lg', disabled: true, label: 'Large disabled' } },
      { name: 'md-checked-disabled', props: { size: 'md', checked: true, disabled: true } },
    ]

    it('should match combined props snapshots', async () => {
      const results = await testComponentVariants(SWITCH_PATH, 'switch', combinations)

      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })
})
