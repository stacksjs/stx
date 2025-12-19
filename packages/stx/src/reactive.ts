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
  type: 'model' | 'show' | 'hide' | 'text' | 'html' | 'bind' | 'class' | 'style' | 'if' | 'for'
  /** Expression to evaluate */
  expression: string
  /** For x-bind, the attribute name */
  attribute?: string
  /** For x-model, the input type */
  inputType?: string
  /** For x-for, the loop variable name */
  loopVar?: string
  /** For x-for, the index variable name */
  loopIndex?: string
  /** For x-if/x-for, the original template HTML */
  template?: string
  /** For x-if, linked else/else-if element IDs */
  elseId?: string
  /** For x-else/x-else-if, the parent if ID */
  parentIfId?: string
  /** For x-else-if, the condition */
  elseIfCondition?: string
  /** For x-show/x-hide/x-if, transition configuration */
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

    // Find all bindings within this scope
    const bindings = findBindingsInScope(scopeContent, startIndex)

    // Find all refs within this scope
    const refs = findRefsInScope(scopeContent)

    scopes.push({
      id: scopeId,
      selector: `[data-stx-scope="${scopeId}"]`,
      stateExpr,
      initExpr,
      bindings,
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

  // Helper to find bindings with a specific attribute
  function findBindings(attrName: string, type: ReactiveBinding['type']) {
    // Double-quoted version
    const doubleRegex = new RegExp(`<([a-z][a-z0-9-]*)\\s+([^>]*${attrName}\\s*=\\s*"([^"]*)"[^>]*)>`, 'gi')
    let match
    while ((match = doubleRegex.exec(scopeContent)) !== null) {
      const [, tagName, attributesStr, expression] = match
      const elementId = extractOrGenerateId(attributesStr)
      const inputType = type === 'model' ? extractInputType(attributesStr, tagName) : undefined
      // Extract transition config for show/hide bindings
      const transition = (type === 'show' || type === 'hide') ? extractTransitionConfig(attributesStr) : undefined

      bindings.push({ elementId, type, expression, inputType, transition })
    }

    // Single-quoted version
    const singleRegex = new RegExp(`<([a-z][a-z0-9-]*)\\s+([^>]*${attrName}\\s*=\\s*'([^']*)'[^>]*)>`, 'gi')
    while ((match = singleRegex.exec(scopeContent)) !== null) {
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
  while ((match = bindDoubleRegex.exec(scopeContent)) !== null) {
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
  while ((match = bindSingleRegex.exec(scopeContent)) !== null) {
    const [, attributesStr, attribute, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    bindings.push({
      elementId,
      type: attribute === 'class' ? 'class' : attribute === 'style' ? 'style' : 'bind',
      expression,
      attribute,
    })
  }

  // Find x-if bindings (double quotes)
  const ifDoubleRegex = /<([a-z][a-z0-9-]*)\s+([^>]*x-if\s*=\s*"([^"]*)"[^>]*)>/gi
  while ((match = ifDoubleRegex.exec(scopeContent)) !== null) {
    const [fullMatch, tagName, attributesStr, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    // Extract the full element including content for template
    const template = extractElementWithContent(scopeContent, match.index, tagName)
    bindings.push({
      elementId,
      type: 'if',
      expression,
      template,
    })
  }

  // Find x-if bindings (single quotes)
  const ifSingleRegex = /<([a-z][a-z0-9-]*)\s+([^>]*x-if\s*=\s*'([^']*)'[^>]*)>/gi
  while ((match = ifSingleRegex.exec(scopeContent)) !== null) {
    const [fullMatch, tagName, attributesStr, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    const template = extractElementWithContent(scopeContent, match.index, tagName)
    bindings.push({
      elementId,
      type: 'if',
      expression,
      template,
    })
  }

  // Find x-for bindings (double quotes) - syntax: "item in items" or "(item, index) in items"
  const forDoubleRegex = /<([a-z][a-z0-9-]*)\s+([^>]*x-for\s*=\s*"([^"]*)"[^>]*)>/gi
  while ((match = forDoubleRegex.exec(scopeContent)) !== null) {
    const [fullMatch, tagName, attributesStr, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    const template = extractElementWithContent(scopeContent, match.index, tagName)
    const { loopVar, loopIndex, iterableExpr } = parseForExpression(expression)
    bindings.push({
      elementId,
      type: 'for',
      expression: iterableExpr,
      template,
      loopVar,
      loopIndex,
    })
  }

  // Find x-for bindings (single quotes)
  const forSingleRegex = /<([a-z][a-z0-9-]*)\s+([^>]*x-for\s*=\s*'([^']*)'[^>]*)>/gi
  while ((match = forSingleRegex.exec(scopeContent)) !== null) {
    const [fullMatch, tagName, attributesStr, expression] = match
    const elementId = extractOrGenerateId(attributesStr)
    const template = extractElementWithContent(scopeContent, match.index, tagName)
    const { loopVar, loopIndex, iterableExpr } = parseForExpression(expression)
    bindings.push({
      elementId,
      type: 'for',
      expression: iterableExpr,
      template,
      loopVar,
      loopIndex,
    })
  }

  return bindings
}

/**
 * Parse x-for expression like "item in items" or "(item, index) in items"
 */
function parseForExpression(expr: string): { loopVar: string, loopIndex: string | undefined, iterableExpr: string } {
  // Match "(item, index) in items" or "item in items"
  const match = expr.match(/^\s*(?:\(([^,]+),\s*([^)]+)\)|([^\s]+))\s+in\s+(.+)$/)
  if (!match) {
    return { loopVar: 'item', loopIndex: undefined, iterableExpr: expr }
  }

  if (match[1] && match[2]) {
    // (item, index) in items
    return { loopVar: match[1].trim(), loopIndex: match[2].trim(), iterableExpr: match[4].trim() }
  } else {
    // item in items
    return { loopVar: match[3].trim(), loopIndex: undefined, iterableExpr: match[4].trim() }
  }
}

/**
 * Extract a full element including its content and closing tag
 */
function extractElementWithContent(html: string, startIndex: number, tagName: string): string {
  // Find the end of the opening tag
  const openTagEnd = html.indexOf('>', startIndex)
  if (openTagEnd === -1) return ''

  // Check if self-closing
  if (html[openTagEnd - 1] === '/') {
    return html.slice(startIndex, openTagEnd + 1)
  }

  // Find the matching closing tag
  let depth = 1
  let pos = openTagEnd + 1
  const openPattern = new RegExp(`<${tagName}(?:\\s|>)`, 'gi')
  const closePattern = new RegExp(`</${tagName}>`, 'gi')

  while (depth > 0 && pos < html.length) {
    openPattern.lastIndex = pos
    closePattern.lastIndex = pos

    const openMatch = openPattern.exec(html)
    const closeMatch = closePattern.exec(html)

    if (!closeMatch) {
      // No closing tag found, return to end of string
      return html.slice(startIndex)
    }

    if (openMatch && openMatch.index < closeMatch.index) {
      depth++
      pos = openMatch.index + openMatch[0].length
    } else {
      depth--
      if (depth === 0) {
        return html.slice(startIndex, closeMatch.index + closeMatch[0].length)
      }
      pos = closeMatch.index + closeMatch[0].length
    }
  }

  return html.slice(startIndex)
}

/**
 * Find all x-ref elements in scope
 */
function findRefsInScope(scopeContent: string): Map<string, string> {
  const refs = new Map<string, string>()
  const refRegex = /<[a-z][a-z0-9-]*\s+([^>]*x-ref\s*=\s*["']([^"']*)["'][^>]*)>/gi
  let match

  while ((match = refRegex.exec(scopeContent)) !== null) {
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
window.__stx_reactive = (function() {
  'use strict';

  // Default transition classes (similar to Alpine.js)
  var defaultTransition = {
    enter: 'stx-enter-active stx-enter-to',
    enterStart: 'stx-enter stx-enter-start',
    enterEnd: 'stx-enter-active stx-enter-to',
    leave: 'stx-leave-active stx-leave-to',
    leaveStart: 'stx-leave stx-leave-start',
    leaveEnd: 'stx-leave-active stx-leave-to',
    duration: 150
  };

  // Apply classes to element
  function applyClasses(el, classes) {
    if (!classes) return;
    classes.split(/\\s+/).forEach(function(cls) {
      if (cls) el.classList.add(cls);
    });
  }

  // Remove classes from element
  function removeClasses(el, classes) {
    if (!classes) return;
    classes.split(/\\s+/).forEach(function(cls) {
      if (cls) el.classList.remove(cls);
    });
  }

  // Get transition duration from element's computed style or config
  function getTransitionDuration(el, config) {
    if (config && config.duration) return config.duration;
    var style = window.getComputedStyle(el);
    var duration = style.transitionDuration || style.animationDuration || '0s';
    var match = duration.match(/([\\d.]+)(s|ms)/);
    if (match) {
      var value = parseFloat(match[1]);
      return match[2] === 's' ? value * 1000 : value;
    }
    return defaultTransition.duration;
  }

  // Transition element in (show)
  function transitionIn(el, config, callback) {
    if (!config || !config.enabled) {
      el.style.display = '';
      if (callback) callback();
      return;
    }

    var enterClasses = config.enter || defaultTransition.enter;
    var enterStartClasses = config.enterStart || defaultTransition.enterStart;
    var enterEndClasses = config.enterEnd || defaultTransition.enterEnd;

    // Apply start classes before showing
    applyClasses(el, enterStartClasses);
    el.style.display = '';

    // Force reflow
    el.offsetHeight;

    // Remove start classes and add end classes
    requestAnimationFrame(function() {
      removeClasses(el, enterStartClasses);
      applyClasses(el, enterClasses);
      applyClasses(el, enterEndClasses);

      var duration = getTransitionDuration(el, config);
      setTimeout(function() {
        removeClasses(el, enterClasses);
        removeClasses(el, enterEndClasses);
        if (callback) callback();
      }, duration);
    });
  }

  // Transition element out (hide)
  function transitionOut(el, config, callback) {
    if (!config || !config.enabled) {
      el.style.display = 'none';
      if (callback) callback();
      return;
    }

    var leaveClasses = config.leave || defaultTransition.leave;
    var leaveStartClasses = config.leaveStart || defaultTransition.leaveStart;
    var leaveEndClasses = config.leaveEnd || defaultTransition.leaveEnd;

    // Apply start classes
    applyClasses(el, leaveStartClasses);

    // Force reflow
    el.offsetHeight;

    // Remove start classes and add end classes
    requestAnimationFrame(function() {
      removeClasses(el, leaveStartClasses);
      applyClasses(el, leaveClasses);
      applyClasses(el, leaveEndClasses);

      var duration = getTransitionDuration(el, config);
      setTimeout(function() {
        removeClasses(el, leaveClasses);
        removeClasses(el, leaveEndClasses);
        el.style.display = 'none';
        if (callback) callback();
      }, duration);
    });
  }

  // Create a reactive proxy that triggers updates on change
  function reactive(obj, onChange) {
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return reactive(value, onChange);
        }
        return value;
      },
      set(target, prop, value) {
        const oldValue = target[prop];
        if (oldValue !== value) {
          target[prop] = value;
          onChange(prop, value, oldValue);
        }
        return true;
      }
    });
  }

  // Safely evaluate an expression in a given context
  function evaluate(expr, ctx) {
    try {
      const keys = Object.keys(ctx);
      const values = Object.values(ctx);
      const fn = new Function(...keys, 'return (' + expr + ')');
      return fn(...values);
    } catch (e) {
      console.warn('[stx-reactive] Error evaluating:', expr, e);
      return undefined;
    }
  }

  // Execute a statement in a given context
  function execute(stmt, ctx, $event, $el) {
    try {
      const keys = Object.keys(ctx);
      const values = Object.values(ctx);
      const fn = new Function(...keys, '$event', '$el', stmt);
      fn(...values, $event, $el);
    } catch (e) {
      console.warn('[stx-reactive] Error executing:', stmt, e);
    }
  }

  // Initialize a reactive scope
  function initScope(scopeEl, initialState, bindings, refs, initExpr) {
    // Parse initial state
    let state;
    try {
      state = new Function('return (' + initialState + ')')();
    } catch (e) {
      console.error('[stx-reactive] Invalid x-data:', initialState, e);
      return;
    }

    // Build refs object
    const $refs = {};
    for (const [name, id] of Object.entries(refs)) {
      Object.defineProperty($refs, name, {
        get: () => document.getElementById(id)
      });
    }

    // Add $refs and $el to state context
    const ctx = { ...state, $refs, $el: scopeEl };

    // Update function that re-evaluates all bindings
    function update(changedProp) {
      for (const binding of bindings) {
        const el = document.getElementById(binding.elementId);
        if (!el) continue;

        const value = evaluate(binding.expression, ctx);

        switch (binding.type) {
          case 'text':
            el.textContent = value ?? '';
            break;

          case 'html':
            el.innerHTML = value ?? '';
            break;

          case 'show':
            // Track previous state to determine if we need to transition
            var wasVisible = el.style.display !== 'none';
            if (value && !wasVisible) {
              transitionIn(el, binding.transition);
            } else if (!value && wasVisible) {
              transitionOut(el, binding.transition);
            }
            break;

          case 'hide':
            // Inverse of show
            var wasHidden = el.style.display === 'none';
            if (value && !wasHidden) {
              transitionOut(el, binding.transition);
            } else if (!value && wasHidden) {
              transitionIn(el, binding.transition);
            }
            break;

          case 'class':
            if (typeof value === 'object') {
              for (const [cls, active] of Object.entries(value)) {
                el.classList.toggle(cls, !!active);
              }
            } else if (typeof value === 'string') {
              el.className = value;
            }
            break;

          case 'style':
            if (typeof value === 'object') {
              Object.assign(el.style, value);
            } else if (typeof value === 'string') {
              el.style.cssText = value;
            }
            break;

          case 'bind':
            if (binding.attribute) {
              if (value === false || value === null || value === undefined) {
                el.removeAttribute(binding.attribute);
              } else if (value === true) {
                el.setAttribute(binding.attribute, '');
              } else {
                el.setAttribute(binding.attribute, value);
              }
            }
            break;

          case 'model':
            // Only update if value changed externally (not from input)
            if (document.activeElement !== el) {
              if (binding.inputType === 'checkbox') {
                el.checked = !!value;
              } else if (binding.inputType === 'radio') {
                el.checked = el.value === value;
              } else {
                el.value = value ?? '';
              }
            }
            break;

          case 'if':
            // x-if: conditionally render element
            handleIfBinding(el, binding, value, ctx);
            break;

          case 'for':
            // x-for: render list
            handleForBinding(el, binding, value, ctx);
            break;
        }
      }
    }

    // Track rendered elements for x-if and x-for
    const ifState = new Map(); // elementId -> { rendered: boolean, placeholder: Comment }
    const forState = new Map(); // elementId -> { items: any[], renderedEls: Element[] }

    // Handle x-if binding
    function handleIfBinding(el, binding, value, ctx) {
      let state = ifState.get(binding.elementId);

      if (!state) {
        // First render - create placeholder and save template
        const placeholder = document.createComment('x-if: ' + binding.elementId);
        state = {
          rendered: true,
          placeholder,
          template: binding.template || el.outerHTML
        };
        ifState.set(binding.elementId, state);

        if (!value) {
          // Initially hidden - replace with placeholder
          el.parentNode.replaceChild(placeholder, el);
          state.rendered = false;
        }
        return;
      }

      if (value && !state.rendered) {
        // Show: replace placeholder with element
        const temp = document.createElement('div');
        temp.innerHTML = processTemplate(state.template, ctx);
        const newEl = temp.firstElementChild;
        if (newEl) {
          newEl.id = binding.elementId;
          state.placeholder.parentNode.replaceChild(newEl, state.placeholder);
          state.rendered = true;
        }
      } else if (!value && state.rendered) {
        // Hide: replace element with placeholder
        const currentEl = document.getElementById(binding.elementId);
        if (currentEl) {
          currentEl.parentNode.replaceChild(state.placeholder, currentEl);
          state.rendered = false;
        }
      }
    }

    // Handle x-for binding
    function handleForBinding(el, binding, items, ctx) {
      if (!Array.isArray(items)) {
        console.warn('[stx-reactive] x-for requires an array, got:', typeof items);
        return;
      }

      let state = forState.get(binding.elementId);

      if (!state) {
        // First render - save template and create container
        const placeholder = document.createComment('x-for: ' + binding.elementId);
        state = {
          placeholder,
          template: binding.template || el.outerHTML,
          renderedEls: [],
          parentNode: el.parentNode
        };
        forState.set(binding.elementId, state);

        // Replace original element with placeholder
        el.parentNode.insertBefore(placeholder, el);
        el.parentNode.removeChild(el);
      }

      // Remove old rendered elements
      state.renderedEls.forEach(oldEl => {
        if (oldEl.parentNode) {
          oldEl.parentNode.removeChild(oldEl);
        }
      });
      state.renderedEls = [];

      // Render new elements
      const fragment = document.createDocumentFragment();
      items.forEach((item, index) => {
        // Create context with loop variables
        const loopCtx = { ...ctx };
        loopCtx[binding.loopVar || 'item'] = item;
        if (binding.loopIndex) {
          loopCtx[binding.loopIndex] = index;
        }

        // Process template with loop context
        const temp = document.createElement('div');
        temp.innerHTML = processTemplate(state.template, loopCtx);
        const newEl = temp.firstElementChild;
        if (newEl) {
          // Give each element a unique ID
          newEl.id = binding.elementId + '_' + index;
          fragment.appendChild(newEl);
          state.renderedEls.push(newEl);
        }
      });

      // Insert all new elements after placeholder
      state.placeholder.parentNode.insertBefore(fragment, state.placeholder.nextSibling);
    }

    // Process template string, replacing expressions with values
    function processTemplate(template, ctx) {
      // Replace x-text content
      let result = template.replace(/x-text="([^"]*)"/g, (match, expr) => {
        return 'x-text="' + expr + '"';
      });

      // Process inline expressions {{ expr }}
      result = result.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
        const value = evaluate(expr.trim(), ctx);
        return value !== undefined ? String(value) : '';
      });

      return result;
    }

    // Create reactive proxy
    const reactiveState = reactive(state, (prop, newVal, oldVal) => {
      // Update context with new values
      Object.assign(ctx, state);
      update(prop);
    });

    // Copy reactive state back to ctx for expression evaluation
    Object.assign(ctx, reactiveState);

    // Set up x-model event listeners
    for (const binding of bindings) {
      if (binding.type !== 'model') continue;

      const el = document.getElementById(binding.elementId);
      if (!el) continue;

      const eventType = binding.inputType === 'checkbox' || binding.inputType === 'radio'
        ? 'change'
        : 'input';

      el.addEventListener(eventType, function(e) {
        let value;
        if (binding.inputType === 'checkbox') {
          value = e.target.checked;
        } else if (binding.inputType === 'radio') {
          value = e.target.value;
        } else if (binding.inputType === 'number' || binding.inputType === 'range') {
          value = e.target.valueAsNumber;
        } else {
          value = e.target.value;
        }

        // Update the reactive state
        const props = binding.expression.split('.');
        let target = reactiveState;
        for (let i = 0; i < props.length - 1; i++) {
          target = target[props[i]];
        }
        target[props[props.length - 1]] = value;
      });
    }

    // Expose execute function for event handlers
    scopeEl.__stx_execute = function(stmt, $event, $el) {
      execute(stmt, ctx, $event, $el);
      // Sync reactive state changes
      Object.assign(ctx, reactiveState);
      update();
    };

    // Expose state for debugging
    scopeEl.__stx_state = reactiveState;

    // Run x-init if present
    if (initExpr) {
      setTimeout(() => {
        execute(initExpr, ctx, null, scopeEl);
        Object.assign(ctx, reactiveState);
        update();
      }, 0);
    }

    // Initial render
    update();

    // Remove x-cloak from all elements in scope (reactive system is now initialized)
    scopeEl.querySelectorAll('[x-cloak]').forEach(function(el) {
      el.removeAttribute('x-cloak');
    });
    scopeEl.removeAttribute('x-cloak');

    return reactiveState;
  }

  return { initScope, evaluate, execute, reactive, transitionIn, transitionOut };
})();
`
}

/**
 * Generate initialization code for all scopes
 */
function generateScopeInitializers(scopes: ReactiveScope[]): string {
  if (scopes.length === 0) return ''

  const initializers = scopes.map((scope) => {
    const bindingsJson = JSON.stringify(
      scope.bindings.map(b => ({
        elementId: b.elementId,
        type: b.type,
        expression: b.expression,
        attribute: b.attribute,
        inputType: b.inputType,
        transition: b.transition,
        loopVar: b.loopVar,
        loopIndex: b.loopIndex,
        template: b.template,
      })),
    )

    const refsJson = JSON.stringify(Object.fromEntries(scope.refs))

    return `
  (function() {
    var scopeEl = document.querySelector('${scope.selector}');
    if (!scopeEl) return;
    var bindings = ${bindingsJson};
    var refs = ${refsJson};
    __stx_reactive.initScope(scopeEl, '${scope.stateExpr.replace(/'/g, "\\'")}', bindings, refs, ${scope.initExpr ? `'${scope.initExpr.replace(/'/g, "\\'")}'` : 'null'});
  })();`
  }).join('\n')

  return `
<script data-stx-reactive>
${generateReactiveRuntime()}

// Initialize all reactive scopes
document.addEventListener('DOMContentLoaded', function() {
${initializers}
});
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

  // Remove x-data, x-init, x-model, x-show, x-hide, x-text, x-html, x-ref, x-if, x-for
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
    /\s*x-if\s*=\s*"[^"]*"/g,
    /\s*x-for\s*=\s*"[^"]*"/g,
    /\s*x-bind:[a-z][a-z0-9-]*\s*=\s*"[^"]*"/g,
    /\s*:[a-z][a-z0-9-]*\s*=\s*"[^"]*"/g,
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
    /\s*x-if\s*=\s*'[^']*'/g,
    /\s*x-for\s*=\s*'[^']*'/g,
    /\s*x-bind:[a-z][a-z0-9-]*\s*=\s*'[^']*'/g,
    /\s*:[a-z][a-z0-9-]*\s*=\s*'[^']*'/g,
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
  _context: Record<string, unknown>,
  _filePath: string,
): string {
  // Reset counters
  scopeCounter = 0
  elementCounter = 0

  // Check if template has any reactive directives
  if (!hasReactiveDirectives(template)) {
    return template
  }

  // First pass: Add IDs to elements that need them (before binding detection)
  let output = addAllReactiveIds(template)

  // Second pass: Find all reactive scopes and bindings (elements now have IDs)
  const scopes = findReactiveScopes(output)

  if (scopes.length === 0) {
    return template
  }

  // Third pass: Add scope markers and remove x- attributes
  output = finalizeTemplate(output, scopes)

  // Generate and inject the reactive runtime script
  const script = generateScopeInitializers(scopes)

  // Inject before </body> if exists, otherwise at the end
  if (output.includes('</body>')) {
    output = output.replace('</body>', `${script}\n</body>`)
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

  // Add IDs to all elements that need them
  output = addIdsToElements(output, /x-model\s*=\s*["']/)
  output = addIdsToElements(output, /x-show\s*=\s*["']/)
  output = addIdsToElements(output, /x-hide\s*=\s*["']/)
  output = addIdsToElements(output, /x-text\s*=\s*["']/)
  output = addIdsToElements(output, /x-html\s*=\s*["']/)
  output = addIdsToElements(output, /(?:x-bind:|:)[a-z]/)
  output = addIdsToElements(output, /x-ref\s*=\s*["']/)
  output = addIdsToElements(output, /x-if\s*=\s*["']/)
  output = addIdsToElements(output, /x-for\s*=\s*["']/)

  return output
}

/**
 * Finalize template - add scope markers and remove attributes (third pass)
 */
function finalizeTemplate(template: string, scopes: ReactiveScope[]): string {
  let output = template

  // Add data-stx-scope to x-data elements
  for (const scope of scopes) {
    // Match x-data with double quotes
    output = output.replace(
      new RegExp(`(<[a-z][a-z0-9-]*\\s+)([^>]*)(x-data\\s*=\\s*"${escapeRegex(scope.stateExpr)}")([^>]*>)`, 'gi'),
      `$1data-stx-scope="${scope.id}" $2$3$4`,
    )
    // Match x-data with single quotes
    output = output.replace(
      new RegExp(`(<[a-z][a-z0-9-]*\\s+)([^>]*)(x-data\\s*=\\s*'${escapeRegex(scope.stateExpr)}')([^>]*>)`, 'gi'),
      `$1data-stx-scope="${scope.id}" $2$3$4`,
    )
  }

  // Remove x- attributes from output
  output = removeReactiveAttributes(output)

  return output
}

/**
 * Check if a template contains reactive directives
 */
export function hasReactiveDirectives(template: string): boolean {
  return /x-data\s*=\s*["']/.test(template)
}
