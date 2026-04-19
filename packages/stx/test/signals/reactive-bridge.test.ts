/**
 * Tests for the x-data / reactive bridge system.
 *
 * The reactive bridge (reactive.ts) parses x-data, handles init(), and registers
 * scope vars into window.stx._scopes. The signals runtime then processes all
 * directives (x-for, x-text, :bind, x-show, etc.) within those scopes.
 *
 * These tests verify:
 * 1. x-for / x-if / x-show / x-text / x-html / x-model / x-bind / x-ref support in signals runtime
 * 2. Parenthesized x-for syntax: (item, index) in array
 * 3. processReactiveDirectives output (scope markers, attribute preservation)
 * 4. Error resilience (TypeError suppression for async init patterns)
 * 5. Pre-initialization shim for onMount/onDestroy
 */

import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { processReactiveDirectives, hasReactiveDirectives } from '../../src/reactive'

// =============================================================================
// Runtime: Alpine x-* directive support in signals runtime
// =============================================================================

describe('Alpine x-* directive support in signals runtime', () => {
  const runtime = generateSignalsRuntimeDev()

  it('should handle x-for alongside @for and :for', () => {
    expect(runtime).toContain("el.hasAttribute('x-for')")
    expect(runtime).toContain("el.hasAttribute('@for')")
    expect(runtime).toContain("el.hasAttribute(':for')")
  })

  it('should handle x-if alongside @if and :if', () => {
    expect(runtime).toContain("el.hasAttribute('x-if')")
    expect(runtime).toContain("el.hasAttribute('@if')")
    expect(runtime).toContain("el.hasAttribute(':if')")
  })

  it('should handle x-show alongside @show and :show', () => {
    expect(runtime).toContain("el.hasAttribute('x-show')")
    expect(runtime).toContain("el.hasAttribute('@show')")
    expect(runtime).toContain("el.hasAttribute(':show')")
  })

  it('should handle x-model alongside @model and :model', () => {
    expect(runtime).toContain("el.hasAttribute('x-model')")
    expect(runtime).toContain("el.hasAttribute('@model')")
    expect(runtime).toContain("el.hasAttribute(':model')")
  })

  it('should handle x-text and x-html in attribute processing', () => {
    expect(runtime).toContain("name === 'x-text'")
    expect(runtime).toContain("name === 'x-html'")
  })

  it('should handle x-bind:attr syntax', () => {
    expect(runtime).toContain("name.startsWith('x-bind:')")
    expect(runtime).toContain("name.slice(7)")
  })

  it('should handle x-ref for element references', () => {
    expect(runtime).toContain("name === 'x-ref'")
  })
})

// =============================================================================
// x-for parenthesized syntax
// =============================================================================

describe('x-for parenthesized syntax support', () => {
  const runtime = generateSignalsRuntimeDev()

  it('should support (item, index) in array syntax via regex', () => {
    // The regex should handle optional parens: \\(?\\s*(\\w+)...\\)?
    expect(runtime).toContain('\\(?\\s*')
    expect(runtime).toContain('\\)?\\s+')
  })

  it('regex should match all x-for patterns', () => {
    // Extract the regex pattern used in bindFor
    const re = /^\s*\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?\s+(?:in|of)\s+(.+)\s*$/

    // Pattern 1: item in items
    const m1 = re.exec('item in items')
    expect(m1).not.toBeNull()
    expect(m1![1]).toBe('item')
    expect(m1![2]).toBeUndefined()
    expect(m1![3]).toBe('items')

    // Pattern 2: item, index in items
    const m2 = re.exec('item, index in items')
    expect(m2).not.toBeNull()
    expect(m2![1]).toBe('item')
    expect(m2![2]).toBe('index')
    expect(m2![3]).toBe('items')

    // Pattern 3: (item, index) in items (Alpine style)
    const m3 = re.exec('(item, index) in items')
    expect(m3).not.toBeNull()
    expect(m3![1]).toBe('item')
    expect(m3![2]).toBe('index')
    expect(m3![3]).toBe('items')

    // Pattern 4: (s, i) in summary.sports
    const m4 = re.exec('(s, i) in summary.sports')
    expect(m4).not.toBeNull()
    expect(m4![1]).toBe('s')
    expect(m4![2]).toBe('i')
    expect(m4![3]).toBe('summary.sports')

    // Pattern 5: item of items (for-of)
    const m5 = re.exec('item of items')
    expect(m5).not.toBeNull()
    expect(m5![1]).toBe('item')
    expect(m5![3]).toBe('items')
  })
})

// =============================================================================
// processReactiveDirectives: template transformation
// =============================================================================

describe('processReactiveDirectives', () => {
  it('should detect x-data as a reactive directive', () => {
    expect(hasReactiveDirectives('<div x-data="{ count: 0 }">')).toBe(true)
    expect(hasReactiveDirectives('<div class="foo">')).toBe(false)
  })

  it('should add data-stx-scope to x-data elements', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('data-stx-scope=')
  })

  it('should NOT add data-stx-reactive-owner', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).not.toContain('data-stx-reactive-owner')
  })

  it('should rename x-data to data-stx-xdata in output', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    // x-data is renamed (not removed) so SPA navigation can re-initialize scopes
    expect(result).toContain('data-stx-xdata="{ count: 0 }"')
    // Raw x-data= should not exist (only data-stx-xdata=)
    expect(result).not.toMatch(/\bx-data\s*=/)
  })

  it('should remove x-init attribute from output', () => {
    const template = '<div x-data="{ items: [] }" x-init="items = [1,2,3]"><p x-text="items.length"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).not.toContain('x-init=')
  })

  it('should preserve x-for attributes in output (signals runtime processes them)', () => {
    const template = '<div x-data="{ items: [1,2,3] }"><template x-for="item in items"><p x-text="item"></p></template></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('x-for="item in items"')
  })

  it('should preserve x-text attributes in output', () => {
    const template = '<div x-data="{ msg: \'hello\' }"><p x-text="msg"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('x-text="msg"')
  })

  it('should preserve x-show attributes in output', () => {
    const template = '<div x-data="{ visible: true }"><p x-show="visible">hi</p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('x-show="visible"')
  })

  it('should preserve :attr bindings in output', () => {
    const template = '<div x-data="{ color: \'red\' }"><p :style="\'color:\' + color">hi</p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain(':style=')
  })

  it('should preserve @click event bindings in output', () => {
    const template = '<div x-data="{ count: 0 }"><button @click="count++">+</button></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('@click="count++"')
  })

  it('should inject reactive bridge runtime script', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('window.__stx_reactive')
    expect(result).toContain('initScope')
  })

  it('should register scope into window.stx._scopes', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('stx._scopes')
  })

  it('should handle x-data with single quotes', () => {
    const template = `<div x-data='{ count: 0 }'><p x-text="count"></p></div>`
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('data-stx-scope=')
    expect(result).toContain("data-stx-xdata='{ count: 0 }'")
  })

  it('should return template unchanged when no x-data present', () => {
    const template = '<div><p>hello</p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toBe(template)
  })
})

// =============================================================================
// Error resilience: TypeError suppression
// =============================================================================

describe('Error resilience for async init patterns', () => {
  const runtime = generateSignalsRuntimeDev()

  it('should suppress TypeError in expression evaluation (for null.property access)', () => {
    // All catch blocks should suppress both ReferenceError and TypeError
    expect(runtime).toContain('!(e instanceof TypeError)')
    expect(runtime).toContain('!(e2 instanceof TypeError)')
  })

  it('should suppress TypeError in show expression', () => {
    // The catch variable name (e vs e2) is an implementation detail — assert
    // the TypeError guard wraps the warn call regardless.
    expect(runtime).toMatch(/!\(e2? instanceof TypeError\)\)\s*console\.warn\(['"]\[STX\] Show expression error:/)
  })

  it('should suppress TypeError in style expression', () => {
    expect(runtime).toContain("!(e instanceof TypeError)) console.warn('[STX] Style expression error:'")
  })

  it('should suppress TypeError in class expression', () => {
    expect(runtime).toContain("!(e instanceof TypeError)) console.warn('[STX] Class expression error:'")
  })
})

// =============================================================================
// Pre-initialization shim
// =============================================================================

describe('Pre-initialization shim for onMount/onDestroy', () => {
  const runtime = generateSignalsRuntimeDev()

  it('should set up early mount capture array', () => {
    expect(runtime).toContain('window.__stx_early_mounts')
  })

  it('should set up early destroy capture array', () => {
    expect(runtime).toContain('window.__stx_early_destroys')
  })

  it('should provide shim onMount before IIFE', () => {
    // The shim should appear BEFORE the IIFE
    const shimPos = runtime.indexOf('window.__stx_early_mounts')
    const iifePos = runtime.indexOf("(function() {")
    expect(shimPos).toBeLessThan(iifePos)
  })

  it('should drain early mounts into mountCallbacks', () => {
    expect(runtime).toContain('window.__stx_early_mounts.forEach')
    expect(runtime).toContain('mountCallbacks.push(fn)')
  })

  it('should drain early destroys into destroyCallbacks', () => {
    expect(runtime).toContain('window.__stx_early_destroys.forEach')
    expect(runtime).toContain('destroyCallbacks.push(fn)')
  })
})

// =============================================================================
// x-data scope merging in processElement
// =============================================================================

describe('x-data scope merging in signals processElement', () => {
  const runtime = generateSignalsRuntimeDev()

  it('should not skip x-data elements entirely', () => {
    // Old behavior was: if (el.hasAttribute('x-data')) return;
    // New behavior should merge scope and continue processing
    expect(runtime).not.toContain("if (el.hasAttribute('x-data') || el.__stx_reactive_initialized) {\n        return;")
  })

  it('should merge x-data scope into processing scope', () => {
    expect(runtime).toContain("el.hasAttribute('data-stx-xdata')")
    expect(runtime).toContain("el.__stx_scope")
    expect(runtime).toContain('xdScope')
  })
})

// =============================================================================
// Reactive bridge runtime content
// =============================================================================

describe('Reactive bridge runtime', () => {
  it('should generate bridge runtime with signal wrapping', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    // Bridge should wrap state properties in signals
    expect(result).toContain('stx.state(')
  })

  it('should handle init() method extraction', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('state.init')
    expect(result).toContain('initMethod')
  })

  it('should handle async init() with promise error catching', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('maybePromise')
    expect(result).toContain('.catch(')
  })

  it('should create ctxProxy for this binding in methods', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    expect(result).toContain('ctxProxy')
    expect(result).toContain('new Proxy')
  })

  it('should run initializers synchronously (not in DOMContentLoaded)', () => {
    const template = '<div x-data="{ count: 0 }"><p x-text="count"></p></div>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    // Should NOT have DOMContentLoaded wrapper for initializers
    expect(result).not.toContain("document.addEventListener('DOMContentLoaded'")
  })

  it('should inject before the LAST </body> not the first', () => {
    // Template with </body> inside a script (like x-element runtime)
    const template = '<html><body><script>var x = "</body>";</script><div x-data="{ open: false }"><p x-show="open">hi</p></div></body></html>'
    const result = processReactiveDirectives(template, {}, 'test.stx')
    // The script inside the first <script> should be untouched
    expect(result).toContain('var x = "</body>"')
    // The bridge should appear before the real </body>, not inside the script
    const bridgePos = result.indexOf('__stx_reactive.initScope')
    const lastBodyClose = result.lastIndexOf('</body>')
    expect(bridgePos).toBeLessThan(lastBodyClose)
    expect(bridgePos).toBeGreaterThan(result.indexOf('x-show="open"'))
  })
})
