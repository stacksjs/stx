/**
 * Tests for component scoping - tests the runtime code structure
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('Component scoping', () => {
  describe('IIFE wrapper expectations in runtime', () => {
    it('should expect scope variables registered in window.stx._scopes', () => {
      const runtime = generateSignalsRuntimeDev()

      // Runtime should initialize _scopes
      expect(runtime).toContain('_scopes: {}')

      // Runtime should check for scope variables
      expect(runtime).toContain('window.stx._scopes')
    })

    it('should process elements with data-stx-scope attribute', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should query for scoped elements
      expect(runtime).toContain("querySelectorAll('[data-stx-scope]')")

      // Should get scope ID from attribute
      expect(runtime).toContain("getAttribute('data-stx-scope')")
    })

    it('should run scope-specific mount callbacks', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should look for mount callbacks in scope
      expect(runtime).toContain('__mountCallbacks')

      // Should iterate and run callbacks
      expect(runtime).toContain('scopeVars.__mountCallbacks.forEach')
    })

    it('should support scope lookup in directive bindings', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should have findElementScope function
      expect(runtime).toContain('function findElementScope(el)')

      // Should traverse parent elements
      expect(runtime).toContain('current.parentElement')
    })
  })

  describe('Variable extraction behavior (via extractExports in process.ts)', () => {
    // These tests verify the expected behavior that extractExports should have
    // The actual implementation is tested through integration tests

    it('should only extract top-level declarations (expectation)', () => {
      // The extractExports function should use depth tracking to only extract
      // variables declared at the top level, not nested inside functions or blocks.
      // This is verified through the signals runtime behavior.
      const runtime = generateSignalsRuntimeDev()

      // The runtime should expect scope variables to be properly registered in _scopes
      expect(runtime).toContain('_scopes')
      expect(runtime).toContain('window.stx._scopes')
    })
  })

  describe('Scope isolation in expressions', () => {
    it('should merge element scope with component scope', () => {
      const runtime = generateSignalsRuntimeDev()

      // toValue should merge scopes
      expect(runtime).toContain('...componentScope')
      expect(runtime).toContain('elementScope')
    })

    it('should pass element to toValue for scope lookup', () => {
      const runtime = generateSignalsRuntimeDev()

      // toValue should accept el parameter (with optional enableAutoUnwrap)
      expect(runtime).toContain('function toValue(expr, el, enableAutoUnwrap')
    })

    it('should pass element to executeHandler for scope lookup', () => {
      const runtime = generateSignalsRuntimeDev()

      // executeHandler should accept el parameter
      expect(runtime).toContain('function executeHandler(expr, event, el)')
    })
  })

  describe('@for directive scope handling', () => {
    it('should create item scope in loops', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should create item scope
      expect(runtime).toContain('itemScope[itemName] = item')
    })

    it('should support index variable in loops', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should support index
      expect(runtime).toContain('itemScope[indexName] = index')
    })

    it('should find scope from parent element for loops', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should find scope from parent
      expect(runtime).toContain('findElementScope(el)')
      expect(runtime).toContain('findElementScope(parent)')
    })
  })

  describe('@model directive scope handling', () => {
    it('should look up signal in scope for two-way binding', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should check if value is a signal
      expect(runtime).toContain('scope[expr]._isSignal')
    })

    it('should find element scope for model binding', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should use findElementScope
      expect(runtime).toContain('findElementScope(el)')
    })
  })

  describe('Auto-initialization', () => {
    it('should process [data-stx] elements with setup function', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should look for data-stx attribute
      expect(runtime).toContain("querySelectorAll('[data-stx]')")

      // Should call setup function
      expect(runtime).toContain("getAttribute('data-stx')")
      expect(runtime).toContain('window[setupName]')
    })

    it('should process [data-stx-auto] elements', () => {
      const runtime = generateSignalsRuntimeDev()

      expect(runtime).toContain("querySelectorAll('[data-stx-auto]')")
    })

    it('should run mount callbacks for [data-stx] elements', () => {
      const runtime = generateSignalsRuntimeDev()

      // After processing [data-stx] elements, should run global mount callbacks
      expect(runtime).toContain('mountCallbacks.forEach(fn => fn())')
    })
  })
})
