/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * STX Reactive Bindings
 *
 * Provides reactive bindings for STX templates with store integration.
 *
 * Syntax:
 * - class="{{ $appStore.isActive ? 'active' : '' }}"
 * - text="{{ $appStore.message }}"
 * - disabled="{{ $appStore.isLoading }}"
 *
 * Store references:
 * - $storeName.property (e.g., $appStore.isRecording)
 *
 * Example:
 * <button
 *   class="{{ $appStore.isRecording ? 'border-pink' : 'border-gray' }}"
 *   disabled="{{ $appStore.isProcessing }}"
 *   @click="voide.toggleRecording()"
 * >
 *   <span text="{{ $appStore.isRecording ? '🔴' : '🎤' }}"></span>
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
 * Check if an expression contains store references (needs reactive binding)
 */
function hasStoreRefs(expression: string): boolean {
  return /\$\w+\./.test(expression)
}

/**
 * Process reactive bindings in HTML template
 * Detects {{ $store.value }} patterns in attribute values
 */
export function processReactiveBindings(html: string): ProcessedBindings {
  const bindings: BindingInfo[] = []
  const stores = new Set<string>()

  // Pattern to match opening tags with their attributes
  const tagPattern = /<(\w+)([^>]*?)(\s*\/?>)/g

  let result = html

  // Process each tag
  result = result.replace(tagPattern, (match, tagName, attributes, closing) => {
    // Skip script, style, and other non-element tags
    if (['script', 'style', 'template'].includes(tagName.toLowerCase())) {
      return match
    }

    const elementBindings: Array<{ attr: string, expr: string, fullMatch: string, originalAttr: string }> = []
    let hasBindings = false
    let processedAttrs = attributes

    // Find all attributes with {{ $store... }} patterns
    // Match attribute="value with {{ expr }}"
    const attrPattern = /(\w+(?:-\w+)*)\s*=\s*"([^"]*\{\{[^}]*\$\w+[^}]*\}\}[^"]*)"/g
    const attrMatches = [...attributes.matchAll(attrPattern)]

    for (const attrMatch of attrMatches) {
      const fullAttrMatch = attrMatch[0]
      const attrName = attrMatch[1]
      const attrValue = attrMatch[2]

      // Check if this attribute contains store references
      if (hasStoreRefs(attrValue)) {
        hasBindings = true

        // Extract the expression from {{ }}
        const exprMatch = attrValue.match(/\{\{\s*([\s\S]+?)\s*\}\}/)
        if (exprMatch) {
          const expression = exprMatch[1]

          elementBindings.push({
            attr: attrName,
            expr: expression,
            fullMatch: fullAttrMatch,
            originalAttr: attrName,
          })

          // Extract store references
          const storeRefs = extractStoreRefs(expression)
          storeRefs.forEach(s => stores.add(s))

          // Remove the reactive attribute (will be handled by JS)
          // But keep the attribute with an empty or default value for initial render
          if (attrName === 'text') {
            processedAttrs = processedAttrs.replace(fullAttrMatch, '')
          }
else if (attrName === 'class') {
            // Keep class but remove the {{ }} part for initial render
            processedAttrs = processedAttrs.replace(fullAttrMatch, `class=""`)
          }
else if (attrName === 'disabled' || attrName === 'hidden') {
            processedAttrs = processedAttrs.replace(fullAttrMatch, '')
          }
else {
            processedAttrs = processedAttrs.replace(fullAttrMatch, `${attrName}=""`)
          }
        }
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
    // eslint-disable-next-line pickier/no-unused-vars
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
      // text binding - update textContent
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.textContent = ${evalExpr};
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'html') {
      // html binding - update innerHTML
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.innerHTML = ${evalExpr};
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'class') {
      // class binding - can be string or object
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            var value = ${evalExpr};
            if (typeof value === 'string') {
              // Dynamic class string - merge with existing static classes
              // eslint-disable-next-line pickier/no-unused-vars
              var staticClasses = el.getAttribute('data-static-class') || el.className;
              if (!el.hasAttribute('data-static-class')) {
                el.setAttribute('data-static-class', el.className);
              }
              el.className = (el.getAttribute('data-static-class') + ' ' + value).trim();
            }
else if (typeof value === 'object') {
              // Object syntax: { 'class-name': condition }
              for (var cls in value) {
                if (value[cls]) {
                  el.classList.add(cls);
                }
else {
                  el.classList.remove(cls);
                }
              }
            }
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'show') {
      // show binding - toggle display
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.style.display = (${evalExpr}) ? '' : 'none';
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else if (attribute === 'if') {
      // if binding - toggle visibility
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            el.style.visibility = (${evalExpr}) ? 'visible' : 'hidden';
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
    else {
      // Generic attribute binding (disabled, value, src, etc.)
      code += `      (function() {
        var el = document.getElementById('${elementId}');
        if (el) {
          try {
            var value = ${evalExpr};
            if (value === false || value === null || value === undefined) {
              el.removeAttribute('${attribute}');
            }
else if (value === true) {
              el.setAttribute('${attribute}', '');
            }
else {
              el.setAttribute('${attribute}', value);
            }
          }
catch (e) { console.error('Binding error:', e); }
        }
      })();
`
    }
  }

  code += `    }

    // Subscribe to stores and update on changes. Capture the disposers so
    // SPA fragment swaps can tear down old bindings before the next page's
    // runtime takes over — without this, every navigation between pages
    // using reactive-bindings stacked another subscription on every store,
    // walking detached DOM forever. See stacksjs/stx#1709.
    var _disposers = [];
`

  // Generate subscriptions for each store, capturing each unsubscribe.
  for (const storeName of storeNames) {
    code += `    if (stores.${storeName}) {
      var _unsub_${storeName} = stores.${storeName}.subscribe(function(state) {
        $state.${storeName} = state;
        updateBindings();
      });
      // store.subscribe() may return the disposer (preferred) or void; both
      // are tolerated here.
      if (typeof _unsub_${storeName} === 'function') _disposers.push(_unsub_${storeName});
    }
`
  }

  code += `
    // Initial update
    updateBindings();

    // Register this runtime's cleanup so SPA navigation can run it before
    // swapping pages. The router (and any code) can call
    // window.__stxCleanupBindings() to dispose subscriptions; we also wire
    // 'popstate' and 'beforeunload' as a safety net for browser-driven nav.
    function _cleanup() {
      for (var i = 0; i < _disposers.length; i++) {
        try { _disposers[i](); } catch (e) { /* swallow */ }
      }
      _disposers.length = 0;
    }
    if (!window.__stxBindingsCleanups) window.__stxBindingsCleanups = [];
    window.__stxBindingsCleanups.push(_cleanup);
    if (!window.__stxCleanupBindings) {
      window.__stxCleanupBindings = function() {
        var fns = window.__stxBindingsCleanups || [];
        for (var i = 0; i < fns.length; i++) {
          try { fns[i](); } catch (e) { /* swallow */ }
        }
        window.__stxBindingsCleanups = [];
      };
      window.addEventListener('popstate', window.__stxCleanupBindings);
      window.addEventListener('beforeunload', window.__stxCleanupBindings);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBindings);
  }
else {
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

  // Insert runtime before the LAST </body> tag (earlier ones may be inside scripts)
  const bodyIdx = processedHtml.lastIndexOf('</body>')
  if (bodyIdx !== -1) {
    return processedHtml.slice(0, bodyIdx) + runtime + processedHtml.slice(bodyIdx)
  }

  return processedHtml + runtime
}
