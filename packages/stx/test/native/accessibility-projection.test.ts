import { expect, it } from 'bun:test'
import { accessibilityChanges, authoredAccessibilityProps, projectAccessibility } from '../../src/native/accessibility'

it('merges boolean ARIA state with per-field native overrides without mutating either input', () => {
  const explicit = Object.freeze({ checked: false, disabled: true })
  const props = Object.freeze({
    'aria-checked': true, 'aria-disabled': false, 'aria-selected': 'false',
    'aria-label': 'Web', 'aria-valuetext': 'Off', role: 'switch',
    accessibilityLabel: 'Native', accessibilityState: explicit,
  })
  expect(projectAccessibility(props)).toEqual({
    accessibilityLabel: 'Native', accessibilityRole: 'switch', accessibilityValue: 'Off',
    accessibilityState: { checked: false, disabled: true, selected: false },
  })
  expect(projectAccessibility({ 'aria-checked': 'mixed', 'aria-selected': 'undefined', 'aria-hidden': true })).toEqual({ accessibilityState: { checked: 'mixed' } })
})

it('clears stale projections without resetting unrelated accessibility fields', () => {
  expect(accessibilityChanges({}, { accessibilityLabel: 'Old' }, 'aria-label')).toEqual({ accessibilityLabel: null })
  expect(accessibilityChanges({ accessibilityLabel: 'New' }, {}, 'accessibilityLabel')).toEqual({ accessibilityLabel: 'New' })
  // Removing an explicit override equal to its ARIA fallback still writes the
  // fallback, rather than allowing the generic remove-attribute null through.
  expect(accessibilityChanges({ 'aria-label': 'Same' }, { accessibilityLabel: 'Same' }, 'accessibilityLabel')).toEqual({ accessibilityLabel: 'Same' })
  expect(accessibilityChanges({ 'aria-checked': true, accessibilityState: { selected: true } },
    { accessibilityState: { checked: true, selected: true } }, 'accessibilityState')).toEqual({
    accessibilityState: { checked: true, selected: true },
  })
})

it('recovers authored props without treating generated compiler fields as overrides', () => {
  const compiled = Object.freeze({ 'aria-label': 'Web', accessibilityLabel: 'Web', accessibilityRole: 'switch' })
  expect(authoredAccessibilityProps(compiled, { accessibilityRole: 'switch' })).toEqual({
    'aria-label': 'Web', accessibilityRole: 'switch',
  })
  expect(authoredAccessibilityProps(compiled, {})).toEqual({ 'aria-label': 'Web' })
  expect(authoredAccessibilityProps(compiled)).toEqual(compiled)
  expect(compiled.accessibilityLabel).toBe('Web')
})
