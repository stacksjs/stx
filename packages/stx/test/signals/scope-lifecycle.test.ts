/**
 * Comprehensive tests for STX scope isolation and lifecycle handling
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

describe('Scope-specific lifecycle callbacks', () => {
  describe('Runtime code structure', () => {
    it('should include scope-specific mount callback handling in runtime', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should have window.stx._scopes initialization
      expect(runtime).toContain('_scopes: {}')

      // Should process [data-stx-scope] elements
      expect(runtime).toContain('[data-stx-scope]')

      // Should run scope-specific mount callbacks
      expect(runtime).toContain('__mountCallbacks')
      expect(runtime).toContain('scopeVars.__mountCallbacks.forEach')
    })

    it('should access scope by ID during processing', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should get scopeId from element attribute
      expect(runtime).toContain("getAttribute('data-stx-scope')")

      // Should look up scope variables
      expect(runtime).toContain('window.stx._scopes[scopeId]')
    })

    it('should process scoped elements after DOMContentLoaded', () => {
      const runtime = generateSignalsRuntimeDev()

      // Should have DOMContentLoaded listener
      expect(runtime).toContain("document.addEventListener('DOMContentLoaded'")

      // Should process scoped elements
      expect(runtime).toContain("document.querySelectorAll('[data-stx-scope]')")
    })
  })

  describe('findElementScope function', () => {
    it('should have findElementScope function in runtime', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function findElementScope(el)')
    })

    it('should traverse parent elements to find scope', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('current.parentElement')
      expect(runtime).toContain("hasAttribute('data-stx-scope')")
    })
  })

  describe('Minified runtime', () => {
    it('should produce valid minified output', () => {
      const minified = generateSignalsRuntime()
      expect(minified).toBeTruthy()
      expect(minified.length).toBeLessThan(generateSignalsRuntimeDev().length)
    })

    it('should preserve essential functionality in minified form', () => {
      const minified = generateSignalsRuntime()

      // Core functions should still be present
      expect(minified).toContain('state')
      expect(minified).toContain('derived')
      expect(minified).toContain('effect')
      expect(minified).toContain('onMount')
      expect(minified).toContain('onDestroy')
      expect(minified).toContain('window.stx')
    })
  })
})

describe('Signal scope isolation', () => {
  describe('Runtime scope lookup', () => {
    it('should have toValue function that uses scope', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function toValue(expr, el)')
      expect(runtime).toContain('findElementScope')
    })

    it('should merge componentScope with elementScope', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('...componentScope')
      expect(runtime).toContain('elementScope')
    })

    it('should have executeHandler function for event handling', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function executeHandler(expr, event, el)')
    })
  })

  describe('@for directive scoping', () => {
    it('should handle @for with scope lookup', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindFor(el)')
      expect(runtime).toContain('findElementScope')
    })

    it('should create item scope in @for loops', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('itemScope[itemName] = item')
      expect(runtime).toContain('itemScope[indexName] = index')
    })
  })

  describe('@if directive scoping', () => {
    it('should handle @if with scope', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindIf(el)')
      expect(runtime).toContain('toValue(expr, el)')
    })
  })
})

describe('Lifecycle hooks', () => {
  describe('onMount behavior', () => {
    it('should have onMount registration function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function onMount(fn)')
      expect(runtime).toContain('mountCallbacks.push(fn)')
    })

    it('should run mount callbacks for [data-stx] elements', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("querySelectorAll('[data-stx]')")
      expect(runtime).toContain('mountCallbacks.forEach(fn => fn())')
    })
  })

  describe('onDestroy behavior', () => {
    it('should have onDestroy registration function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function onDestroy(fn)')
      expect(runtime).toContain('destroyCallbacks.push(fn)')
    })
  })
})

describe('Directive bindings', () => {
  describe('@model directive', () => {
    it('should have bindModel function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindModel(el, expr)')
    })

    it('should handle checkbox/radio differently', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('type === \'checkbox\'')
      expect(runtime).toContain('type === \'radio\'')
      expect(runtime).toContain('el.checked')
    })

    it('should handle select elements', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("tag === 'select'")
    })

    it('should look up signal in scope for @model', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('scope[expr]._isSignal')
    })
  })

  describe('@show directive', () => {
    it('should have bindShow function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindShow(el, expr)')
    })

    it('should toggle display property', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("el.style.display")
      expect(runtime).toContain("'none'")
    })
  })

  describe('@class directive', () => {
    it('should have bindClass function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindClass(el, expr)')
    })

    it('should handle object syntax', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('classList.add')
      expect(runtime).toContain('classList.remove')
    })

    it('should handle array syntax', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('Array.isArray(value)')
      expect(runtime).toContain("filter(Boolean).join(' ')")
    })
  })

  describe('@style directive', () => {
    it('should have bindStyle function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function bindStyle(el, expr)')
    })

    it('should handle object and string syntax', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('Object.assign(el.style')
      expect(runtime).toContain('el.style.cssText')
    })
  })

  describe('@bind:attr directives', () => {
    it('should handle dynamic attribute binding', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("name.startsWith('@bind:')")
      expect(runtime).toContain('name.slice(6)')
    })

    it('should handle false/null/undefined by removing attribute', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('removeAttribute(attrName)')
    })

    it('should handle true as boolean attribute', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("setAttribute(attrName, '')")
    })
  })

  describe('@text and @html directives', () => {
    it('should handle @text', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("name === '@text'")
      expect(runtime).toContain('el.textContent = toValue')
    })

    it('should handle @html', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("name === '@html'")
      expect(runtime).toContain('el.innerHTML = toValue')
    })
  })

  describe('Event handlers', () => {
    it('should parse event modifiers', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain(".split('.')")
      expect(runtime).toContain('eventName')
      expect(runtime).toContain('modifiers')
    })

    it('should handle .prevent modifier', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("modifiers.includes('prevent')")
      expect(runtime).toContain('event.preventDefault()')
    })

    it('should handle .stop modifier', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("modifiers.includes('stop')")
      expect(runtime).toContain('event.stopPropagation()')
    })

    it('should handle .capture modifier', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("capture: modifiers.includes('capture')")
    })

    it('should handle .passive modifier', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("passive: modifiers.includes('passive')")
    })

    it('should handle .once modifier', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain("once: modifiers.includes('once')")
    })
  })
})

describe('Text interpolation', () => {
  it('should handle {{ }} syntax in text nodes', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('text.includes(\'{{\')')
    expect(runtime).toContain('split')
    expect(runtime).toContain('\\{\\{')
  })

  it('should create span elements for interpolated values', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("document.createElement('span')")
    expect(runtime).toContain('span.textContent')
  })

  it('should wrap interpolation in effect for reactivity', () => {
    const runtime = generateSignalsRuntimeDev()
    // The effect wrapper around interpolation
    expect(runtime).toContain('effect(() => {')
    expect(runtime).toContain('toValue(match[1]')
  })
})

describe('Reactive utilities', () => {
  describe('batch function', () => {
    it('should have batch function in runtime', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function batch(fn)')
    })

    it('should handle nested batching', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('if (isBatching)')
    })

    it('should run pending effects after batch', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('pendingEffects.forEach')
      expect(runtime).toContain('pendingEffects.clear()')
    })
  })

  describe('untrack function', () => {
    it('should have untrack function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function untrack(v)')
    })

    it('should unwrap signals', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('isSignal(v)')
      expect(runtime).toContain('v._isDerived')
    })
  })

  describe('peek function', () => {
    it('should have peek function', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function peek(fn)')
    })

    it('should temporarily disable tracking', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('activeEffect = null')
    })
  })

  describe('isSignal function', () => {
    it('should check _isSignal property', () => {
      const runtime = generateSignalsRuntimeDev()
      expect(runtime).toContain('function isSignal(v)')
      expect(runtime).toContain('v._isSignal === true')
    })
  })
})

describe('Auto-initialization', () => {
  it('should process [data-stx] elements', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("querySelectorAll('[data-stx]')")
  })

  it('should call setup function from data-stx attribute', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("getAttribute('data-stx')")
    expect(runtime).toContain('window[setupName]')
  })

  it('should process [data-stx-auto] elements', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain("querySelectorAll('[data-stx-auto]')")
  })

  it('should assign setup result to componentScope', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('Object.assign(componentScope, result)')
  })
})
