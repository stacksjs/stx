/**
 * STX Reactive Bindings
 *
 * Provides Vue-style reactive bindings for STX templates with store integration.
 *
 * Supported syntaxes:
 * - :class="expression"           (Vue shorthand)
 * - stx-class="expression"        (STX-specific)
 * - stx-bind:class="expression"   (explicit STX bind)
 *
 * Store references:
 * - $storeName.property           (e.g., $appStore.isRecording)
 *
 * Example:
 * <button
 *   :class="$appStore.isRecording ? 'border-pink' : 'border-gray'"
 *   :disabled="$appStore.isProcessing"
 *   @click="voide.toggleRecording()"
 * >
 *   <span :text="$appStore.isRecording ? '🔴' : '🎤'"></span>
 * </button>
 */

import * as crypto from 'node:crypto'

interface BindingInfo {
  elementId: string
  attribute: string
  expression: string
  stores: string[]
}

interface ProcessedBindings {
  html: string
  bindings: BindingInfo[]
  stores: Set<string>
}

/**
 * Extract store references from an expression
 * e.g., "$appStore.isRecording" -> ["appStore"]
 */
function extractStoreRefs(expression: string): string[] {
  const storePattern = /\$(\w+)\./g
  const stores: string[] = []
  let match

  while ((match = storePattern.exec(expression)) !== null) {
    if (!stores.includes(match[1])) {
      stores.push(match[1])
    }
  }

  return stores
}

/**
 * Generate a short unique ID for elements without an ID
 */
function generateElementId(): string {
  return `stx-${crypto.randomBytes(4).toString('hex')}`
}

/**
 * Parse binding attributes from an element
 * Supports: :attr, stx-attr, stx-bind:attr
 */
function parseBindingAttribute(attrName: string): { attribute: string, isBinding: boolean } {
  // :class -> class
  if (attrName.startsWith(':') && !attrName.startsWith('::')) {
    return { attribute: attrName.slice(1), isBinding: true }
  }

  // stx-bind:class -> class
  if (attrName.startsWith('stx-bind:')) {
    return { attribute: attrName.slice(9), isBinding: true }
  }

  // stx-class -> class (shorthand)
  if (attrName.startsWith('stx-') && !attrName.startsWith('stx-bind:')) {
    return { attribute: attrName.slice(4), isBinding: true }
  }

  return { attribute: attrName, isBinding: false }
}

/**
 * Process reactive bindings in HTML template
 */
export function processReactiveBindings(html: string): ProcessedBindings {
  const bindings: BindingInfo[] = []
  const stores = new Set<string>()

  // Pattern to match elements with binding attributes
  // Matches: :attr="value", stx-attr="value", stx-bind:attr="value"
  const bindingAttrPattern = /(?:^|\s)(:|stx-bind:|stx-)(\w+(?::\w+)?)\s*=\s*"([^"]*)"/g

  // Pattern to match opening tags with their attributes
  const tagPattern = /<(\w+)([^>]*?)(\s*\/?>)/g

  let result = html
  let offset = 0

  // Process each tag
  result = result.replace(tagPattern, (match, tagName, attributes, closing, index) => {
    // Skip script, style, and other non-element tags
    if (['script', 'style', 'template'].includes(tagName.toLowerCase())) {
      return match
    }

    const elementBindings: Array<{ attr: string, expr: string, fullMatch: string }> = []
    let hasBindings = false
    let processedAttrs = attributes

    // Find all binding attributes in this element
    const attrMatches = [...attributes.matchAll(/(?:^|\s)((?::|stx-bind:|stx-)[\w:-]+)\s*=\s*"([^"]*)"/g)]

    for (const attrMatch of attrMatches) {
      const fullAttrMatch = attrMatch[0]
      const attrName = attrMatch[1]
      const attrValue = attrMatch[2]

      const { attribute, isBinding } = parseBindingAttribute(attrName)

      if (isBinding) {
        hasBindings = true
        elementBindings.push({
          attr: attribute,
          expr: attrValue,
          fullMatch: fullAttrMatch,
        })

        // Extract store references
        const storeRefs = extractStoreRefs(attrValue)
        storeRefs.forEach(s => stores.add(s))

        // Remove the binding attribute (will be handled by JS)
        processedAttrs = processedAttrs.replace(fullAttrMatch, '')
      }
    }

    if (!hasBindings) {
      return match
    }

    // Check if element has an ID, if not add one
    const idMatch = processedAttrs.match(/\bid\s*=\s*"([^"]+)"/)
    let elementId: string

    if (idMatch) {
      elementId = idMatch[1]
    }
    else {
      elementId = generateElementId()
      processedAttrs = ` id="${elementId}"${processedAttrs}`
    }

    // Record bindings for this element
    for (const binding of elementBindings) {
      bindings.push({
        elementId,
        attribute: binding.attr,
        expression: binding.expr,
        stores: extractStoreRefs(binding.expr),
      })
    }

    return `<${tagName}${processedAttrs}${closing}`
  })

  return { html: result, bindings, stores }
}

/**
 * Generate the client-side JavaScript for reactive bindings
 */
export function generateBindingsRuntime(bindings: BindingInfo[], stores: Set<string>): string {
  if (bindings.length === 0) {
    return ''
  }

  const storeNames = Array.from(stores)

  // Group bindings by store for efficient subscriptions
  const bindingsByStore = new Map<string, BindingInfo[]>()

  for (const binding of bindings) {
    for (const store of binding.stores) {
      if (!bindingsByStore.has(store)) {
        bindingsByStore.set(store, [])
      }
      bindingsByStore.get(store)!.push(binding)
    }
  }

  // Generate the runtime code
  let code = `
<script>
(function() {
  'use strict';

  // Wait for stores to be available
  function initBindings() {
    var stores = window.VoideStores;
    if (!stores) {
      setTimeout(initBindings, 10);
      return;
    }

    // Store references for expressions
    var $state = {};
`

  // Add store state references
  for (const storeName of storeNames) {
    code += `    $state.${storeName} = stores.${storeName} ? stores.${storeName}.get() : {};\n`
  }

  code += `
    // Binding update functions
    function updateBindings() {
`

  // Generate update code for each binding
  for (const binding of bindings) {
    const { elementId, attribute, expression } = binding

    // Convert $store.prop to $state.store.prop for evaluation
    const evalExpr = expression.replace(/\$(\w+)\./g, '$state.$1.')

    if (attribute === 'text') {
      // :text binding - update textContent
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.textContent = ${evalExpr};
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'html') {
      // :html binding - update innerHTML
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.innerHTML = ${evalExpr};
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'class') {
      // :class binding - can be string or object
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            var value = ${evalExpr};
            if (typeof value === 'string') {
              // Dynamic class string - merge with existing static classes
              var staticClasses = el.getAttribute('data-static-class') || el.className;
              if (!el.hasAttribute('data-static-class')) {
                el.setAttribute('data-static-class', el.className);
              }
              el.className = (el.getAttribute('data-static-class') + ' ' + value).trim();
            } else if (typeof value === 'object') {
              // Object syntax: { 'class-name': condition }
              for (var cls in value) {
                if (value[cls]) {
                  el.classList.add(cls);
                } else {
                  el.classList.remove(cls);
                }
              }
            }
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'show') {
      // :show binding - toggle display
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.style.display = (${evalExpr}) ? '' : 'none';
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'if') {
      // :if binding - toggle visibility (different from show)
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.style.visibility = (${evalExpr}) ? 'visible' : 'hidden';
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else {
      // Generic attribute binding (:disabled, :value, :src, etc.)
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            var value = ${evalExpr};
            if (value === false || value === null || value === undefined) {
              el.removeAttribute('${attribute}');
            } else if (value === true) {
              el.setAttribute('${attribute}', '');
            } else {
              el.setAttribute('${attribute}', value);
            }
          } catch(e) { console.error('Binding error:', e); }
        }
      })();
`
    }
  }

  code += `    }

    // Subscribe to stores and update on changes
`

  // Generate subscriptions for each store
  for (const storeName of storeNames) {
    code += `    if (stores.${storeName}) {
      stores.${storeName}.subscribe(function(state) {
        $state.${storeName} = state;
        updateBindings();
      });
    }
`
  }

  code += `
    // Initial update
    updateBindings();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBindings);
  } else {
    initBindings();
  }
})();
</script>
`

  return code
}

/**
 * Process template with reactive bindings and generate runtime
 */
export function processTemplateBindings(html: string): string {
  const { html: processedHtml, bindings, stores } = processReactiveBindings(html)

  if (bindings.length === 0) {
    return html
  }

  const runtime = generateBindingsRuntime(bindings, stores)

  // Insert runtime before closing </body> tag, or at the end
  if (processedHtml.includes('</body>')) {
    return processedHtml.replace('</body>', `${runtime}</body>`)
  }

  return processedHtml + runtime
}
