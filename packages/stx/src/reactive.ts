/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
import { evaluateExpression } from './expressions'

/**
 * Reactive Directives Module
 *
 * Provides Alpine.js-style reactive state management for STX templates.
 * Transforms `x-data`, `x-model`, `x-show`, `x-text`, `x-bind` into client-side reactivity.
 *
 * ## Supported Syntax
 *
 * ### x-data - Define reactive state
 * ```html
 * <div x-data="{ count: 0, name: '' }">
 *   <p x-text="count"></p>
 *   <button @click="count++">Increment</button>
 * </div>
 * ```
 *
 * ### x-model - Two-way binding
 * ```html
 * <input x-model="name" type="text">
 * <textarea x-model="message"></textarea>
 * <select x-model="selected">...</select>
 * <input x-model="checked" type="checkbox">
 * ```
 *
 * ### x-show / x-hide - Toggle visibility
 * ```html
 * <div x-show="isOpen">Visible when isOpen is true</div>
 * <div x-hide="isLoading">Hidden when isLoading is true</div>
 * ```
 *
 * ### x-text / x-html - Bind content
 * ```html
 * <span x-text="message"></span>
 * <div x-html="htmlContent"></div>
 * ```
 *
 * ### x-bind / :attr - Bind attributes
 * ```html
 * <button x-bind:disabled="isLoading">Submit</button>
 * <div :class="{ active: isActive, hidden: !isVisible }">...</div>
 * <img :src="imageUrl" :alt="imageAlt">
 * ```
 *
 * ### x-ref - Element references
 * ```html
 * <input x-ref="input">
 * <button @click="$refs.input.focus()">Focus</button>
 * ```
 *
 * ### x-init - Run code on mount
 * ```html
 * <div x-data="{ items: [] }" x-init="items = await fetchItems()">
 * ```
 *
 * @module reactive
 */

// =============================================================================
// Types
// =============================================================================

export interface ReactiveScope {
  /** Unique scope ID */
  id: string
  /** Element selector */
  selector: string
  /** Initial state expression */
  stateExpr: string
  /** x-init expression if present */
  initExpr: string | null
  /** Child bindings within this scope */
  bindings: ReactiveBinding[]
  /** Element references (x-ref) */
  refs: Map<string, string>
}

export interface ReactiveBinding {
  /** Element ID or selector */
  elementId: string
  /** Binding type */
  type: 'model' | 'show' | 'hide' | 'text' | 'html' | 'bind' | 'class' | 'style' | 'event'
  /** Expression to evaluate */
  expression: string
  /** For x-bind, the attribute name */
  attribute?: string
  /** For x-model, the input type */
  inputType?: string
  /** For x-show/x-hide, transition configuration */
  transition?: TransitionConfig
}

export interface TransitionConfig {
  /** Simple transition (uses default classes) */
  enabled: boolean
  /** Enter transition classes */
  enter?: string
  /** Enter start classes (applied before insert) */
  enterStart?: string
  /** Enter end classes (applied one frame after insert) */
  enterEnd?: string
  /** Leave transition classes */
  leave?: string
  /** Leave start classes (applied immediately when leaving) */
  leaveStart?: string
  /** Leave end classes (applied one frame after leave starts) */
  leaveEnd?: string
  /** Duration in ms (optional, defaults to CSS transition duration) */
  duration?: number
}

interface ParsedElement {
  fullMatch: string
  tagName: string
  attributes: string
  startIndex: number
  endIndex: number
}

// =============================================================================
// Constants
// =============================================================================

let scopeCounter = 0
let elementCounter = 0

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// =============================================================================
// Parser
// =============================================================================

/**
 * Extract attribute value handling both quote types
 */
function extractAttributeValue(attributesStr: string, attrName: string): string | null {
  // Try double quotes first
  const doubleMatch = attributesStr.match(new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i'))
  if (doubleMatch) return doubleMatch[1]

  // Try single quotes
  const singleMatch = attributesStr.match(new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, 'i'))
  if (singleMatch) return singleMatch[1]

  return null
}

/**
 * Find elements with x-data attribute (reactive scopes)
 */
function findReactiveScopes(template: string): ReactiveScope[] {
  const scopes: ReactiveScope[] = []

  // Match elements with x-data attribute (both quote types)
  const xDataRegex = /<([a-z][a-z0-9-]*)\s+([^>]*x-data\s*=\s*(?:"[^"]*"|'[^']*')[^>]*)>/gi
  let match

  while ((match = xDataRegex.exec(template)) !== null) {
    const [fullMatch, tagName, attributesStr] = match
    const startIndex = match.index

    // Extract x-data value
    const stateExpr = extractAttributeValue(attributesStr, 'x-data')
    if (!stateExpr) continue

    const scopeId = `__stx_scope_${scopeCounter++}`

    // Extract x-init if present
    const initExpr = extractAttributeValue(attributesStr, 'x-init')

    // Find the closing tag to determine scope boundaries
    const closingTag = findClosingTag(template, tagName, startIndex + fullMatch.length)
    const scopeContent = template.slice(startIndex, closingTag.endIndex)

    // Find refs within this scope (for $refs support)
    const refs = findRefsInScope(scopeContent)

    // No need to find bindings — the signals runtime handles all directives
    scopes.push({
      id: scopeId,
      selector: `[data-stx-scope="${scopeId}"]`,
      stateExpr,
      initExpr,
      bindings: [],
      refs,
    })
  }

  return scopes
}

/**
 * Find the closing tag for an element
 */
function findClosingTag(template: string, tagName: string, startFrom: number): { endIndex: number } {
  let depth = 1
  let pos = startFrom
  const openPattern = new RegExp(`<${tagName}(?:\\s|>)`, 'gi')
  const closePattern = new RegExp(`</${tagName}>`, 'gi')
  const selfClosePattern = new RegExp(`<${tagName}[^>]*/\\s*>`, 'gi')

  while (depth > 0 && pos < template.length) {
    openPattern.lastIndex = pos
    closePattern.lastIndex = pos
    selfClosePattern.lastIndex = pos

    const openMatch = openPattern.exec(template)
    const closeMatch = closePattern.exec(template)

    // Check for self-closing tags
    const selfCloseMatch = selfClosePattern.exec(template)
    if (selfCloseMatch && selfCloseMatch.index < (openMatch?.index ?? Infinity)) {
      // Self-closing tag, skip it
      pos = selfCloseMatch.index + selfCloseMatch[0].length
      continue
    }

    if (!closeMatch) {
      // No closing tag found, return end of template
      return { endIndex: template.length }
    }

    if (openMatch && openMatch.index < closeMatch.index) {
      depth++
      pos = openMatch.index + openMatch[0].length
    }
    else {
      depth--
      if (depth === 0) {
        return { endIndex: closeMatch.index + closeMatch[0].length }
      }
      pos = closeMatch.index + closeMatch[0].length
    }
  }

  return { endIndex: template.length }
}

/**
 * Find all reactive bindings within a scope
 */
function findBindingsInScope(scopeContent: string, _scopeStart: number): ReactiveBinding[] {
  const bindings: ReactiveBinding[] = []

  // Strip x-data attribute values to prevent HTML strings inside JS methods
  // from being matched as real DOM elements by the tag-matching regexes
  let content = scopeContent
    .replace(/x-data\s*=\s*"[^"]*"/gi, 'x-data="__stripped__"')
    .replace(/x-data\s*=\s*'[^']*'/gi, "x-data='__stripped__'")

  // Helper to find bindings with a specific attribute
  function findBindings(attrName: string, type: ReactiveBinding['type']) {
    // Double-quoted version
    const doubleRegex = new RegExp(`<([a-z][a-z0-9-]*)\\s+([^>]*${attrName}\\s*=\\s*"([^"]*)"[^>]*)>`, 'gi')
    let match
    while ((match = doubleRegex.exec(content)) !== null) {
      const [, tagName, attributesStr, expression] = match
      const elementId = extractOrGenerateId(attributesStr)
      const inputType = type === 'model' ? extractInputType(attributesStr, tagName) : undefined
      // Extract transition config for show/hide bindings
      const transition = (type === 'show' || type === 'hide') ? extractTransitionConfig(attributesStr) : undefined

      bindings.push({ elementId, type, expression, inputType, transition })
    }

    // Single-quoted version
    const singleRegex = new RegExp(`<([a-z][a-z0-9-]*)\\s+([^>]*${attrName}\\s*=\\s*'([^']*)'[^>]*)>`, 'gi')
    while ((match = singleRegex.exec(content)) !== null) {
      const [, tagName, attributesStr, expression] = match
      const elementId = extractOrGenerateId(attributesStr)
      const inputType = type === 'model' ? extractInputType(attributesStr, tagName) : undefined
      // Extract transition config for show/hide bindings
      const transition = (type === 'show' || type === 'hide') ? extractTransitionConfig(attributesStr) : undefined

      bindings.push({ elementId, type, expression, inputType, transition })
    }
  }

  // Find all binding types
  findBindings('x-model', 'model')
  findBindings('x-show', 'show')
  findBindings('x-hide', 'hide')
  findBindings('x-text', 'text')
  findBindings('x-html', 'html')

  // Find x-bind and :attr bindings (double quotes)
  const bindDoubleRegex = /<[a-z][a-z0-9-]*\s+([^>]*(?:x-bind:|:)([a-z][a-z0-9-]*)\s*=\s*"([^"]*)"[^>]*)>/gi
  let match
  while ((match = bindDoubleRegex.exec(content)) !== null) {
    const [, attributesStr, attribute, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    bindings.push({
      elementId,
      type: attribute === 'class' ? 'class' : attribute === 'style' ? 'style' : 'bind',
      expression,
      attribute,
    })
  }

  // Find x-bind and :attr bindings (single quotes)
  const bindSingleRegex = /<[a-z][a-z0-9-]*\s+([^>]*(?:x-bind:|:)([a-z][a-z0-9-]*)\s*=\s*'([^']*)'[^>]*)>/gi
  while ((match = bindSingleRegex.exec(content)) !== null) {
    const [, attributesStr, attribute, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    bindings.push({
      elementId,
      type: attribute === 'class' ? 'class' : attribute === 'style' ? 'style' : 'bind',
      expression,
      attribute,
    })
  }

  // Find event bindings (@click, @submit.prevent, etc.)
  // Use a tag-by-tag approach to handle multiline attribute values
  const tagRegex = /<([a-z][a-z0-9-]*)((?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)*)>/gis
  let tagMatch
  while ((tagMatch = tagRegex.exec(content)) !== null) {
    const attrsStr = tagMatch[2]
    if (!attrsStr) continue

    // Find @event attributes in this tag's attributes
    const eventAttrRegex = /@([a-z]+(?:\.[a-z]+)*)\s*=\s*"([\s\S]*?)"/gi
    let evtMatch
    while ((evtMatch = eventAttrRegex.exec(attrsStr)) !== null) {
      const [, eventAttr, expression] = evtMatch
      const elementId = extractOrGenerateId(attrsStr)
      bindings.push({
        elementId,
        type: 'event',
        expression: expression.replace(/\s+/g, ' ').trim(),
        attribute: eventAttr,
      })
    }

    // Single-quoted version
    const eventAttrSingleRegex = /@([a-z]+(?:\.[a-z]+)*)\s*=\s*'([\s\S]*?)'/gi
    while ((evtMatch = eventAttrSingleRegex.exec(attrsStr)) !== null) {
      const [, eventAttr, expression] = evtMatch
      const elementId = extractOrGenerateId(attrsStr)
      bindings.push({
        elementId,
        type: 'event',
        expression: expression.replace(/\s+/g, ' ').trim(),
        attribute: eventAttr,
      })
    }
  }

  return bindings
}

/**
 * Find all x-ref elements in scope
 */
function findRefsInScope(scopeContent: string): Map<string, string> {
  const refs = new Map<string, string>()
  // Strip x-data values to prevent matching HTML inside JS strings
  const content = scopeContent
    .replace(/x-data\s*=\s*"[^"]*"/gi, 'x-data="__stripped__"')
    .replace(/x-data\s*=\s*'[^']*'/gi, "x-data='__stripped__'")
  const refRegex = /<[a-z][a-z0-9-]*\s+([^>]*x-ref\s*=\s*["']([^"']*)["'][^>]*)>/gi
  let match

  while ((match = refRegex.exec(content)) !== null) {
    const [, attributesStr, refName] = match
    const elementId = extractOrGenerateId(attributesStr)
    refs.set(refName, elementId)
  }

  return refs
}

/**
 * Extract existing ID or generate a new one
 */
function extractOrGenerateId(attributesStr: string): string {
  const idMatch = attributesStr.match(/\bid\s*=\s*["']([^"']*)["']/)
  if (idMatch) {
    return idMatch[1]
  }
  return `__stx_el_${elementCounter++}`
}

/**
 * Extract input type from attributes
 */
function extractInputType(attributesStr: string, tagName: string): string {
  if (tagName.toLowerCase() === 'select') return 'select'
  if (tagName.toLowerCase() === 'textarea') return 'textarea'

  const typeMatch = attributesStr.match(/\btype\s*=\s*["']([^"']*)["']/)
  return typeMatch ? typeMatch[1].toLowerCase() : 'text'
}

/**
 * Extract transition configuration from element attributes
 */
function extractTransitionConfig(attributesStr: string): TransitionConfig | undefined {
  // Check for simple x-transition (no value)
  if (/\bx-transition(?:\s|>|$|=)/.test(attributesStr)) {
    const config: TransitionConfig = { enabled: true }

    // Check for x-transition with no value (simple transition)
    const simpleMatch = /\bx-transition(?:\s|>|$)/.test(attributesStr)
    if (simpleMatch && !/\bx-transition\s*=/.test(attributesStr)) {
      // Simple transition - use default classes
      return config
    }

    // Check for x-transition:enter, x-transition:leave, etc.
    const enterMatch = attributesStr.match(/x-transition:enter\s*=\s*["']([^"']*)["']/)
    if (enterMatch) config.enter = enterMatch[1]

    const enterStartMatch = attributesStr.match(/x-transition:enter-start\s*=\s*["']([^"']*)["']/)
    if (enterStartMatch) config.enterStart = enterStartMatch[1]

    const enterEndMatch = attributesStr.match(/x-transition:enter-end\s*=\s*["']([^"']*)["']/)
    if (enterEndMatch) config.enterEnd = enterEndMatch[1]

    const leaveMatch = attributesStr.match(/x-transition:leave\s*=\s*["']([^"']*)["']/)
    if (leaveMatch) config.leave = leaveMatch[1]

    const leaveStartMatch = attributesStr.match(/x-transition:leave-start\s*=\s*["']([^"']*)["']/)
    if (leaveStartMatch) config.leaveStart = leaveStartMatch[1]

    const leaveEndMatch = attributesStr.match(/x-transition:leave-end\s*=\s*["']([^"']*)["']/)
    if (leaveEndMatch) config.leaveEnd = leaveEndMatch[1]

    // Check for duration modifier x-transition.duration.500ms
    const durationMatch = attributesStr.match(/x-transition\.duration\.(\d+)(?:ms)?/)
    if (durationMatch) config.duration = parseInt(durationMatch[1], 10)

    return config
  }

  return undefined
}

// =============================================================================
// Code Generator
// =============================================================================

/**
 * Generate the reactive runtime script
 */
function generateReactiveRuntime(): string {
  return `
// STX Reactive Runtime - x-cloak and transition CSS
(function() {
  var style = document.createElement('style');
  style.textContent = [
    '[x-cloak] { display: none !important; }',
    // Default transition classes
    '.stx-enter { opacity: 0; transform: scale(0.95); }',
    '.stx-enter-start { opacity: 0; transform: scale(0.95); }',
    '.stx-enter-active { transition: opacity 150ms ease-out, transform 150ms ease-out; }',
    '.stx-enter-to { opacity: 1; transform: scale(1); }',
    '.stx-leave { opacity: 1; transform: scale(1); }',
    '.stx-leave-start { opacity: 1; transform: scale(1); }',
    '.stx-leave-active { transition: opacity 100ms ease-in, transform 100ms ease-in; }',
    '.stx-leave-to { opacity: 0; transform: scale(0.95); }'
  ].join('\\n');
  document.head.appendChild(style);
})();

// STX Reactive Runtime
/* eslint-disable pickier/no-unused-vars, no-console, prefer-const */
window.__stx_reactive = (function() {
  'use strict';

  // Deep reactive proxy that triggers onChange for any mutation
  function reactive(obj, onChange) {
    if (!obj || typeof obj !== 'object') return obj;
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Promise)) {
          return reactive(value, onChange);
        }
        return value;
      },
      set(target, prop, value) {
        target[prop] = value;
        onChange(prop, value);
        return true;
      }
    });
  }

  // Initialize an x-data scope: parse state, run init(), register into window.stx._scopes,
  // then let the signals runtime handle all directive processing (x-for, x-text, :bind, etc.)
  function initScope(scopeEl, initialState, bindings, refs, initExpr) {
    // Parse initial state (may contain methods including async init())
    var state;
    try {
      state = new Function('return (' + initialState + ')')();
    } catch (e) {
      console.error('[stx-reactive] Invalid x-data:', initialState, e);
      return;
    }

    // Build $refs object
    var $refs = {};
    for (var name in refs) {
      if (Object.prototype.hasOwnProperty.call(refs, name)) {
        (function(refName, refId) {
          Object.defineProperty($refs, refName, {
            get: function() { return document.getElementById(refId); }
          });
        })(name, refs[name]);
      }
    }

    // Extract init method from state if present (Alpine.js convention)
    var initMethod = state.init;
    if (typeof initMethod === 'function') {
      delete state.init;
    }

    // Make state reactive — mutations trigger re-render via signals
    var scopeId = scopeEl.getAttribute('data-stx-scope');
    var stx = window.stx;

    // Create signals for each state property so the signals runtime can track dependencies
    var signalState = {};
    var rawState = {};
    for (var key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        if (typeof state[key] === 'function') {
          // Methods — bind to a proxy so 'this.prop = val' triggers signal updates
          signalState[key] = state[key];
        } else {
          // Data properties — wrap in signals for reactivity
          signalState[key] = stx.state(state[key]);
          rawState[key] = true;
        }
      }
    }

    // Create a proxy context that auto-unwraps signals and writes back through them.
    // Methods get 'this' bound to this proxy so this.foo = bar triggers reactivity.
    var ctx = {};
    var ctxProxy = new Proxy(ctx, {
      get: function(target, prop) {
        if (prop === '$refs') return $refs;
        if (prop === '$el') return scopeEl;
        if (prop === '$nextTick') return function(fn) { requestAnimationFrame(fn); };
        var s = signalState[prop];
        if (!s) return undefined;
        if (rawState[prop] && s && typeof s === 'function' && typeof s.value !== 'undefined') {
          return s.value; // unwrap signal
        }
        if (typeof s === 'function' && !rawState[prop]) {
          return s.bind(ctxProxy); // bind methods to proxy
        }
        return s;
      },
      set: function(target, prop, value) {
        var s = signalState[prop];
        if (rawState[prop] && s && typeof s === 'function') {
          s.value = value; // write through signal — triggers effects
        } else {
          signalState[prop] = value;
        }
        return true;
      },
      has: function(target, prop) {
        return prop in signalState || prop === '$refs' || prop === '$el' || prop === '$nextTick';
      },
      ownKeys: function() {
        return Object.keys(signalState).concat(['$refs', '$el', '$nextTick']);
      },
      getOwnPropertyDescriptor: function(target, prop) {
        if (prop in signalState || prop === '$refs' || prop === '$el' || prop === '$nextTick') {
          return { configurable: true, enumerable: true, writable: true, value: ctxProxy[prop] };
        }
        return undefined;
      }
    });

    // Build scope vars for the signals runtime — it reads these for expression evaluation.
    // We need to provide getter/setter descriptors so signals track properly.
    var scopeVars = {};
    for (var k in signalState) {
      if (Object.prototype.hasOwnProperty.call(signalState, k)) {
        if (rawState[k]) {
          // Data: expose the signal directly so expressions trigger dependency tracking
          scopeVars[k] = signalState[k];
        } else {
          // Method: bind to ctxProxy so 'this' works
          scopeVars[k] = (typeof signalState[k] === 'function') ? signalState[k].bind(ctxProxy) : signalState[k];
        }
      }
    }
    scopeVars.$refs = $refs;
    scopeVars.$el = scopeEl;
    scopeVars.$nextTick = function(fn) { requestAnimationFrame(fn); };

    // Register scope — merge with any existing vars from partial signal scripts
    if (!stx._scopes) stx._scopes = {};
    stx._scopes[scopeId] = Object.assign(stx._scopes[scopeId] || {}, scopeVars);

    // Store on element for findElementScope
    scopeEl.__stx_scope = scopeVars;

    // Run init() if present (supports async)
    function runInit() {
      var maybePromise;
      if (initMethod) {
        maybePromise = initMethod.call(ctxProxy);
      }
      if (initExpr) {
        try {
          var keys = Object.keys(scopeVars);
          var vals = keys.map(function(k) { return scopeVars[k]; });
          var fn = new Function(keys.join(','), initExpr);
          var result = fn.apply(ctxProxy, vals);
          if (result && typeof result.then === 'function') maybePromise = result;
        } catch (e) {
          console.warn('[stx-reactive] init expression error:', e);
        }
      }
      // If init is async, signal updates will trigger effects automatically
      // when init() resolves and sets this.prop = value (writes through signal)
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(function(e) {
          console.error('[stx-reactive] async init() error:', e);
        });
      }
    }

    // Run init before the signals runtime processes this scope
    runInit();

    // Expose for debugging
    scopeEl.__stx_state = ctxProxy;
    scopeEl.__stx_execute = function(stmt, $event, $el) {
      try {
        // Run the statement with the reactive proxy as the lexical scope.
        // Wrapping in a with-block on the proxy makes bare reads/writes go
        // through it (so foo = bar triggers signal.set()) instead of treating
        // each state key as a local function parameter — bare assignments
        // would otherwise just rebind the local and never reach the signal.
        var fn = new Function('$event', '$el', 'with(this){' + stmt + ';}');
        fn.call(ctxProxy, $event, $el);
      } catch (e) {
        console.warn('[stx-reactive] execute error:', e);
      }
    };
  }

  return { initScope: initScope, reactive: reactive };
})();
`
}

/**
 * Substitute `{{ expr }}` and `{!! expr !!}` patterns inside an expression
 * string (an x-data or x-init JavaScript snippet) using the server-side
 * context.
 *
 * Why: Reactive directives are processed BEFORE `processExpressions` runs, so
 * the raw `stateExpr` we capture here still contains `{{ }}` placeholders.
 * The outer attribute is fixed up later by `processExpressions`, but the
 * value we embed into the runtime `__stx_reactive.initScope(...)` script is
 * a JS string literal — `processExpressions` won't reach inside it. Without
 * this pass, a line like `disabledItems: {{ ids }}` ends up in the runtime
 * as the literal `disabledItems: {{ ids }}` and crashes the reactivity
 * engine with a syntax error on the `{`.
 *
 * Substitution rules mirror script-body interpolation:
 *   - `{{ expr }}` emits `JSON.stringify(value)` so the result is always a
 *     valid JS literal (string→quoted, array/object→JSON literal,
 *     number→bare).
 *   - `{!! expr !!}` emits raw `String(value)` for callers that want to
 *     splice a pre-formatted JS expression.
 *   - Unresolved expressions are left as-is so client-side signal handling
 *     can pick them up later if applicable.
 */
function substituteExpressionsInExpr(expr: string, context: Record<string, any>): string {
  // {!! expr !!} — raw splice
  let out = expr.replace(/\{!!([\s\S]*?)!!\}/g, (match, inner) => {
    try {
      const value = evaluateExpression(inner, context, true)
      if (value === undefined) return match
      return String(value)
    }
    catch {
      return match
    }
  })

  // {{ expr }} — JSON-safe splice (so the result is a valid JS expression)
  out = out.replace(/\{\{([\s\S]*?)\}\}/g, (match, inner) => {
    try {
      const value = evaluateExpression(inner, context, true)
      if (value === undefined) return match
      // A string that is itself a JSON object/array literal (the server
      // passed JSON.stringify output, e.g. `meta: {{ metaJson }}`) must
      // splice as the literal it encodes — JSON.stringify-ing it again
      // would double-encode and leave the scope property a plain string.
      // This also keeps the runtime scope consistent with how the same
      // `{{ }}` renders as raw text inside the element's attribute.
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            JSON.parse(trimmed)
            return trimmed
          }
          catch {
            // Not valid JSON after all — fall through to the quoted splice.
          }
        }
      }
      return JSON.stringify(value)
    }
    catch {
      return match
    }
  })

  return out
}

/**
 * Generate initialization code for all scopes
 */
function generateScopeInitializers(scopes: ReactiveScope[], context: Record<string, any>): string {
  if (scopes.length === 0) return ''

  const initializers = scopes.map((scope) => {
    const refsJson = JSON.stringify(Object.fromEntries(scope.refs))
    const resolvedStateExpr = substituteExpressionsInExpr(scope.stateExpr, context)
    const resolvedInitExpr = scope.initExpr ? substituteExpressionsInExpr(scope.initExpr, context) : null
    const stateExprJson = JSON.stringify(resolvedStateExpr)
    const initExprJson = resolvedInitExpr ? JSON.stringify(resolvedInitExpr) : 'null'

    return `
  (function() {
    var scopeEl = document.querySelector('${scope.selector}');
    if (!scopeEl) return;
    var refs = ${refsJson};
    __stx_reactive.initScope(scopeEl, ${stateExprJson}, [], refs, ${initExprJson});
  })();`
  }).join('\n')

  return `
<script data-stx-scoped data-stx-reactive>
${generateReactiveRuntime()}
${initializers}
</script>`
}

// =============================================================================
// Template Transformation
// =============================================================================

/**
 * Add IDs to elements matching a pattern that don't already have IDs
 */
function addIdsToElements(template: string, pattern: RegExp): string {
  const tagRegex = new RegExp(`<([a-z][a-z0-9-]*)\\s+([^>]*${pattern.source}[^>]*)>`, 'gi')

  return template.replace(tagRegex, (match, tagName, attrs) => {
    // Check if already has an ID
    if (/\bid\s*=\s*["']/.test(attrs)) {
      return match
    }
    const newId = `__stx_el_${elementCounter++}`
    return `<${tagName} id="${newId}" ${attrs}>`
  })
}

/**
 * Remove reactive attributes from the output (x-data, x-model, etc.)
 */
function removeReactiveAttributes(template: string): string {
  let output = template

  // Remove x-data, x-init, x-model, x-show, x-hide, x-text, x-html, x-ref
  // Handle both double and single quoted values separately
  const attrsToRemove = [
    // Double-quoted versions
    /\s*x-data\s*=\s*"[^"]*"/g,
    /\s*x-init\s*=\s*"[^"]*"/g,
    /\s*x-model\s*=\s*"[^"]*"/g,
    /\s*x-show\s*=\s*"[^"]*"/g,
    /\s*x-hide\s*=\s*"[^"]*"/g,
    /\s*x-text\s*=\s*"[^"]*"/g,
    /\s*x-html\s*=\s*"[^"]*"/g,
    /\s*x-ref\s*=\s*"[^"]*"/g,
    /\s*x-bind:[a-z][a-z0-9-]*\s*=\s*"[^"]*"/g,
    /\s*:(?!click|dblclick|submit|input|change|keydown|keyup|keypress|focus|blur|mousedown|mouseup|mousemove|mouseenter|mouseleave|scroll|resize|touchstart|touchend|touchmove|contextmenu|wheel|pointerdown|pointerup|pointermove|if|for|show|model|class|text|html|ref|style)[a-z][a-z0-9-]*\s*=\s*"[^"]*"/g,
    // x-transition variants (double quotes)
    /\s*x-transition:enter\s*=\s*"[^"]*"/g,
    /\s*x-transition:enter-start\s*=\s*"[^"]*"/g,
    /\s*x-transition:enter-end\s*=\s*"[^"]*"/g,
    /\s*x-transition:leave\s*=\s*"[^"]*"/g,
    /\s*x-transition:leave-start\s*=\s*"[^"]*"/g,
    /\s*x-transition:leave-end\s*=\s*"[^"]*"/g,
    /\s*x-transition\s*=\s*"[^"]*"/g,
    // Single-quoted versions
    /\s*x-data\s*=\s*'[^']*'/g,
    /\s*x-init\s*=\s*'[^']*'/g,
    /\s*x-model\s*=\s*'[^']*'/g,
    /\s*x-show\s*=\s*'[^']*'/g,
    /\s*x-hide\s*=\s*'[^']*'/g,
    /\s*x-text\s*=\s*'[^']*'/g,
    /\s*x-html\s*=\s*'[^']*'/g,
    /\s*x-ref\s*=\s*'[^']*'/g,
    /\s*x-bind:[a-z][a-z0-9-]*\s*=\s*'[^']*'/g,
    /\s*:(?!click|dblclick|submit|input|change|keydown|keyup|keypress|focus|blur|mousedown|mouseup|mousemove|mouseenter|mouseleave|scroll|resize|touchstart|touchend|touchmove|contextmenu|wheel|pointerdown|pointerup|pointermove|if|for|show|model|class|text|html|ref|style)[a-z][a-z0-9-]*\s*=\s*'[^']*'/g,
    // x-transition variants (single quotes)
    /\s*x-transition:enter\s*=\s*'[^']*'/g,
    /\s*x-transition:enter-start\s*=\s*'[^']*'/g,
    /\s*x-transition:enter-end\s*=\s*'[^']*'/g,
    /\s*x-transition:leave\s*=\s*'[^']*'/g,
    /\s*x-transition:leave-start\s*=\s*'[^']*'/g,
    /\s*x-transition:leave-end\s*=\s*'[^']*'/g,
    /\s*x-transition\s*=\s*'[^']*'/g,
    // Simple x-transition (no value) and duration modifiers
    /\s*x-transition\.duration\.\d+(?:ms)?/g,
    /\s*x-transition(?=[\s>\/])/g,
    // Event directives (@click, @submit.prevent, etc.) - may span multiple lines
    // Exclude @for, @if, @show, @model — those are reactive directives handled by the signals runtime
    /\s*@(?!for\b|if\b|show\b|model\b|class\b|style\b)[a-z]+(?:\.[a-z]+)*\s*=\s*"[^"]*"/gs,
    /\s*@(?!for\b|if\b|show\b|model\b|class\b|style\b)[a-z]+(?:\.[a-z]+)*\s*=\s*'[^']*'/gs,
  ]

  for (const regex of attrsToRemove) {
    output = output.replace(regex, '')
  }

  return output
}

// =============================================================================
// Main Processing Function
// =============================================================================

/**
 * Process reactive directives in a template.
 *
 * Transforms `x-data`, `x-model`, `x-show`, etc. into client-side reactivity.
 *
 * @param template - The HTML template string
 * @param context - Template context
 * @param filePath - Source file path for error messages
 * @returns Processed template with reactive runtime script
 */
export function processReactiveDirectives(
  template: string,
  context: Record<string, unknown>,
  _filePath: string,
): string {
  // Reset counters
  scopeCounter = 0

  // Check if template has any reactive directives
  if (!hasReactiveDirectives(template)) {
    return template
  }

  // Find all x-data scopes (we only need the state expression and init expression)
  // No need to add IDs or collect bindings — the signals runtime handles all directives
  const scopes = findReactiveScopes(template)

  if (scopes.length === 0) {
    return template
  }

  // Add scope markers (data-stx-scope) and remove consumed attributes (x-data, x-init)
  // All other attributes (x-for, x-text, :bind, x-show, @click, etc.) are preserved
  // for the signals runtime to process
  let output = finalizeTemplate(template, scopes)

  // Generate and inject the reactive bridge runtime script. Pass context so
  // server-side {{ expr }} placeholders inside x-data / x-init expressions
  // get substituted before being embedded in the runtime script — otherwise
  // the unsubstituted `{{ }}` ends up inside a string literal that
  // `processExpressions` (which runs later, on attribute values) never
  // reaches.
  const script = generateScopeInitializers(scopes, context as Record<string, any>)

  // Inject before the LAST </body> — earlier occurrences may be inside <script> tags
  const bodyCloseIdx = output.lastIndexOf('</body>')
  if (bodyCloseIdx !== -1) {
    output = output.slice(0, bodyCloseIdx) + script + '\n' + output.slice(bodyCloseIdx)
  }
  else {
    output += script
  }

  return output
}

/**
 * Add IDs to all elements with reactive attributes (first pass)
 */
function addAllReactiveIds(template: string): string {
  let output = template
  elementCounter = 0

  // Protect x-data attribute values from being parsed as HTML.
  // x-data values can contain HTML string literals (e.g. in methods that return HTML).
  // Without this, addIdsToElements would match <tags> inside those JS strings
  // because its [^>]* pattern can't handle > inside quoted attribute values.
  const xDataPlaceholders: string[] = []
  output = output.replace(
    /x-data\s*=\s*"[^"]*"/gi,
    (match) => {
      const idx = xDataPlaceholders.length
      xDataPlaceholders.push(match)
      return `__XDATA_PLACEHOLDER_${idx}__`
    },
  )
  output = output.replace(
    /x-data\s*=\s*'[^']*'/gi,
    (match) => {
      const idx = xDataPlaceholders.length
      xDataPlaceholders.push(match)
      return `__XDATA_PLACEHOLDER_${idx}__`
    },
  )

  // Add IDs to all elements that need them
  output = addIdsToElements(output, /x-model\s*=\s*["']/)
  output = addIdsToElements(output, /x-show\s*=\s*["']/)
  output = addIdsToElements(output, /x-hide\s*=\s*["']/)
  output = addIdsToElements(output, /x-text\s*=\s*["']/)
  output = addIdsToElements(output, /x-html\s*=\s*["']/)
  output = addIdsToElements(output, /(?:x-bind:|:)[a-z]/)
  output = addIdsToElements(output, /x-ref\s*=\s*["']/)
  output = addIdsToElements(output, /@[a-z]+(?:\.[a-z]+)*\s*=\s*["']/)

  // Restore x-data values
  for (let i = 0; i < xDataPlaceholders.length; i++) {
    output = output.replace(`__XDATA_PLACEHOLDER_${i}__`, xDataPlaceholders[i])
  }

  return output
}

/**
 * Finalize template - add scope markers and remove attributes (third pass)
 */
function finalizeTemplate(template: string, scopes: ReactiveScope[]): string {
  let output = template

  // Add data-stx-scope to x-data elements so the signals runtime processes them.
  // Do NOT add data-stx-reactive-owner — we WANT the signals runtime to handle
  // all directives (x-for, x-text, :bind, x-show, etc.) within these scopes.
  // The reactive bridge runtime will parse x-data, run init(), and register
  // scope vars into window.stx._scopes for the signals runtime to pick up.
  for (const scope of scopes) {
    // Check if the x-data element already has data-stx-scope (from a partial's <script client>).
    // If so, reuse that scope ID instead of adding a duplicate attribute.
    const existingCheck = new RegExp(`<[a-z][a-z0-9-]*\\s+[^>]*data-stx-scope="([^"]*)"[^>]*x-data\\s*=\\s*["']${escapeRegex(scope.stateExpr)}["']`, 'gi')
    const existingMatch = existingCheck.exec(output)
    if (existingMatch) {
      // Element already has a scope — use that ID for the bridge initScope call
      scope.id = existingMatch[1]
      scope.selector = `[data-stx-scope="${scope.id}"]`
      // Don't add data-stx-scope — it's already there
    }
    else {
      // Also check reverse order (x-data before data-stx-scope)
      const reverseCheck = new RegExp(`<[a-z][a-z0-9-]*\\s+[^>]*x-data\\s*=\\s*["']${escapeRegex(scope.stateExpr)}["'][^>]*data-stx-scope="([^"]*)"`, 'gi')
      const reverseMatch = reverseCheck.exec(output)
      if (reverseMatch) {
        scope.id = reverseMatch[1]
        scope.selector = `[data-stx-scope="${scope.id}"]`
      }
      else {
        // No existing scope — add one
        output = output.replace(
          new RegExp(`(<[a-z][a-z0-9-]*\\s+)([^>]*)(x-data\\s*=\\s*"${escapeRegex(scope.stateExpr)}")([^>]*>)`, 'gi'),
          `$1data-stx-scope="${scope.id}" $2$3$4`,
        )
        output = output.replace(
          new RegExp(`(<[a-z][a-z0-9-]*\\s+)([^>]*)(x-data\\s*=\\s*'${escapeRegex(scope.stateExpr)}')([^>]*>)`, 'gi'),
          `$1data-stx-scope="${scope.id}" $2$3$4`,
        )
      }
    }
  }

  // Rename x-data → data-stx-xdata so the SPA handler can re-initialize scopes
  // after fragment swap (the bridge <script> only runs on full page load).
  // Remove x-init since it's consumed by the bridge runtime.
  output = output.replace(/\s*x-data\s*=\s*"([^"]*)"/g, ' data-stx-xdata="$1"')
  output = output.replace(/\s*x-data\s*=\s*'([^']*)'/g, " data-stx-xdata='$1'")
  output = output.replace(/\s*x-init\s*=\s*"[^"]*"/g, '')
  output = output.replace(/\s*x-init\s*=\s*'[^']*'/g, '')

  return output
}

/**
 * Check if a template contains reactive directives
 */
export function hasReactiveDirectives(template: string): boolean {
  return /x-data\s*=\s*["']/.test(template)
}
