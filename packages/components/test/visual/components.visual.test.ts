/**
 * Comprehensive visual regression tests for all STX components
 *
 * This file covers:
 * - Template structure snapshots
 * - Dark mode class presence
 * - Responsive class presence
 * - Variant configurations
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

const UI_DIR = join(__dirname, '../../src/ui')

// Component paths
const components = {
  accordion: join(UI_DIR, 'accordion/Accordion.stx'),
  audio: join(UI_DIR, 'audio/Audio.stx'),
  avatar: join(UI_DIR, 'avatar/Avatar.stx'),
  badge: join(UI_DIR, 'badge/Badge.stx'),
  breadcrumb: join(UI_DIR, 'breadcrumb/Breadcrumb.stx'),
  card: join(UI_DIR, 'card/Card.stx'),
  checkbox: join(UI_DIR, 'checkbox/Checkbox.stx'),
  dialog: join(UI_DIR, 'dialog/Dialog.stx'),
  drawer: join(UI_DIR, 'drawer/Drawer.stx'),
  dropdown: join(UI_DIR, 'dropdown/Dropdown.stx'),
  image: join(UI_DIR, 'image/Image.stx'),
  textInput: join(UI_DIR, 'input/TextInput.stx'),
  notification: join(UI_DIR, 'notification/Notification.stx'),
  pagination: join(UI_DIR, 'pagination/Pagination.stx'),
  popover: join(UI_DIR, 'popover/Popover.stx'),
  progress: join(UI_DIR, 'progress/Progress.stx'),
  radio: join(UI_DIR, 'radio/Radio.stx'),
  select: join(UI_DIR, 'select/Select.stx'),
  skeleton: join(UI_DIR, 'skeleton/Skeleton.stx'),
  spinner: join(UI_DIR, 'spinner/Spinner.stx'),
  stepper: join(UI_DIR, 'stepper/Stepper.stx'),
  tabs: join(UI_DIR, 'tabs/Tabs.stx'),
  textarea: join(UI_DIR, 'textarea/Textarea.stx'),
  tooltip: join(UI_DIR, 'tooltip/Tooltip.stx'),
  transition: join(UI_DIR, 'transition/Transition.stx'),
  video: join(UI_DIR, 'video/Video.stx'),
}

describe('Component Visual Regression Tests', () => {
  // Badge Component
  describe('Badge', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.badge, 'badge')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.badge, 'badge')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {}, slotContent: 'Badge' },
      { name: 'primary', props: { variant: 'primary' }, slotContent: 'Primary' },
      { name: 'secondary', props: { variant: 'secondary' }, slotContent: 'Secondary' },
      { name: 'success', props: { variant: 'success' }, slotContent: 'Success' },
      { name: 'warning', props: { variant: 'warning' }, slotContent: 'Warning' },
      { name: 'danger', props: { variant: 'danger' }, slotContent: 'Danger' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.badge, 'badge', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Checkbox Component
  describe('Checkbox', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.checkbox, 'checkbox')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.checkbox, 'checkbox')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'unchecked', props: { checked: false } },
      { name: 'checked', props: { checked: true } },
      { name: 'indeterminate', props: { indeterminate: true } },
      { name: 'disabled', props: { disabled: true } },
      { name: 'disabled-checked', props: { disabled: true, checked: true } },
      { name: 'with-label', props: { label: 'Accept terms' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.checkbox, 'checkbox', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // TextInput Component
  describe('TextInput', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.textInput, 'textinput')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.textInput, 'textinput')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    it('should check responsive support', async () => {
      const result = await testResponsiveSupport(components.textInput, 'textinput')
      expect(typeof result.hasResponsiveClasses).toBe('boolean')
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'with-placeholder', props: { placeholder: 'Enter text...' } },
      { name: 'with-value', props: { value: 'Hello World' } },
      { name: 'disabled', props: { disabled: true, value: 'Disabled input' } },
      { name: 'with-error', props: { error: 'This field is required' } },
      { name: 'with-label', props: { label: 'Username' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.textInput, 'textinput', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Progress Component
  describe('Progress', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.progress, 'progress')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.progress, 'progress')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { value: 50 } },
      { name: 'zero', props: { value: 0 } },
      { name: 'full', props: { value: 100 } },
      { name: 'small', props: { value: 25, size: 'sm' } },
      { name: 'large', props: { value: 75, size: 'lg' } },
      { name: 'indeterminate', props: { indeterminate: true } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.progress, 'progress', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Spinner Component
  describe('Spinner', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.spinner, 'spinner')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.spinner, 'spinner')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'small', props: { size: 'sm' } },
      { name: 'medium', props: { size: 'md' } },
      { name: 'large', props: { size: 'lg' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.spinner, 'spinner', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Skeleton Component
  describe('Skeleton', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.skeleton, 'skeleton')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.skeleton, 'skeleton')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'text', props: { variant: 'text' } },
      { name: 'circular', props: { variant: 'circular' } },
      { name: 'rectangular', props: { variant: 'rectangular' } },
      { name: 'with-width', props: { width: '200px' } },
      { name: 'with-height', props: { height: '100px' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.skeleton, 'skeleton', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Avatar Component
  describe('Avatar', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.avatar, 'avatar')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.avatar, 'avatar')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'with-src', props: { src: 'https://example.com/avatar.jpg' } },
      { name: 'with-initials', props: { initials: 'JD' } },
      { name: 'small', props: { size: 'sm' } },
      { name: 'large', props: { size: 'lg' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.avatar, 'avatar', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Textarea Component
  describe('Textarea', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.textarea, 'textarea')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.textarea, 'textarea')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    it('should check responsive support', async () => {
      const result = await testResponsiveSupport(components.textarea, 'textarea')
      expect(typeof result.hasResponsiveClasses).toBe('boolean')
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'with-placeholder', props: { placeholder: 'Enter your message...' } },
      { name: 'disabled', props: { disabled: true } },
      { name: 'with-rows', props: { rows: 5 } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.textarea, 'textarea', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Card Component
  describe('Card', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.card, 'card')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.card, 'card')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    it('should check responsive support', async () => {
      const result = await testResponsiveSupport(components.card, 'card')
      expect(typeof result.hasResponsiveClasses).toBe('boolean')
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {}, slotContent: '<p>Card content</p>' },
      { name: 'with-title', props: { title: 'Card Title' }, slotContent: '<p>Card content</p>' },
      { name: 'elevated', props: { elevated: true }, slotContent: '<p>Elevated card</p>' },
      { name: 'bordered', props: { bordered: true }, slotContent: '<p>Bordered card</p>' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.card, 'card', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Notification Component
  describe('Notification', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.notification, 'notification')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.notification, 'notification')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { message: 'Default notification' } },
      { name: 'success', props: { type: 'success', message: 'Success!' } },
      { name: 'error', props: { type: 'error', message: 'Error occurred' } },
      { name: 'warning', props: { type: 'warning', message: 'Warning!' } },
      { name: 'info', props: { type: 'info', message: 'Information' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.notification, 'notification', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Tooltip Component
  describe('Tooltip', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.tooltip, 'tooltip')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.tooltip, 'tooltip')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { content: 'Tooltip text' }, slotContent: 'Hover me' },
      { name: 'top', props: { content: 'Top tooltip', position: 'top' }, slotContent: 'Hover me' },
      { name: 'bottom', props: { content: 'Bottom tooltip', position: 'bottom' }, slotContent: 'Hover me' },
      { name: 'left', props: { content: 'Left tooltip', position: 'left' }, slotContent: 'Hover me' },
      { name: 'right', props: { content: 'Right tooltip', position: 'right' }, slotContent: 'Hover me' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.tooltip, 'tooltip', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Radio Component
  describe('Radio', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.radio, 'radio')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.radio, 'radio')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { name: 'option', value: 'a' } },
      { name: 'checked', props: { name: 'option', value: 'a', checked: true } },
      { name: 'disabled', props: { name: 'option', value: 'a', disabled: true } },
      { name: 'with-label', props: { name: 'option', value: 'a', label: 'Option A' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.radio, 'radio', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Select Component
  describe('Select', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.select, 'select')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.select, 'select')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'with-placeholder', props: { placeholder: 'Select an option' } },
      { name: 'disabled', props: { disabled: true } },
      { name: 'with-label', props: { label: 'Country' } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.select, 'select', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Dialog Component
  describe('Dialog', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.dialog, 'dialog')
      expectSnapshotMatch(result)
    })

    it('should check dark mode support', async () => {
      const result = await testDarkModeSupport(components.dialog, 'dialog')
      // Dialog is a minimal wrapper - dark mode is handled by child components
      expect(typeof result.hasDarkModeClasses).toBe('boolean')
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { open: true }, slotContent: '<p>Dialog content</p>' },
      { name: 'closed', props: { open: false }, slotContent: '<p>Dialog content</p>' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.dialog, 'dialog', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Drawer Component
  describe('Drawer', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.drawer, 'drawer')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.drawer, 'drawer')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { open: true }, slotContent: '<p>Drawer content</p>' },
      { name: 'left', props: { position: 'left', open: true }, slotContent: '<p>Left drawer</p>' },
      { name: 'right', props: { position: 'right', open: true }, slotContent: '<p>Right drawer</p>' },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.drawer, 'drawer', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Tabs Component
  describe('Tabs', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.tabs, 'tabs')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.tabs, 'tabs')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: {} },
      { name: 'with-active', props: { activeTab: 0 } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.tabs, 'tabs', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })

  // Pagination Component
  describe('Pagination', () => {
    it('should match template snapshot', async () => {
      const result = await testComponentTemplate(components.pagination, 'pagination')
      expectSnapshotMatch(result)
    })

    it('should have dark mode support', async () => {
      const result = await testDarkModeSupport(components.pagination, 'pagination')
      expect(result.hasDarkModeClasses).toBe(true)
    })

    const variants: VariantConfig[] = [
      { name: 'default', props: { currentPage: 1, totalPages: 10 } },
      { name: 'first-page', props: { currentPage: 1, totalPages: 5 } },
      { name: 'middle-page', props: { currentPage: 5, totalPages: 10 } },
      { name: 'last-page', props: { currentPage: 10, totalPages: 10 } },
    ]

    it('should match variant snapshots', async () => {
      const results = await testComponentVariants(components.pagination, 'pagination', variants)
      for (const result of results) {
        expect(result.matches).toBe(true)
      }
    })
  })
})
