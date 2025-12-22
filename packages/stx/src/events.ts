/**
 * Event Directives Module
 *
 * Provides Alpine.js-style event handling for STX templates.
 * Transforms `@click`, `@keydown.enter`, etc. into client-side event listeners.
 *
 * ## Supported Syntax
 *
 * ### Basic Events
 * ```html
 * <button @click="count++">Increment</button>
 * <button @click="handleClick()">Click me</button>
 * <form @submit="handleSubmit()">...</form>
 * ```
 *
 * ### Event Modifiers
 * ```html
 * <form @submit.prevent="handleSubmit()">...</form>
 * <a @click.prevent.stop="navigate()">Link</a>
 * <button @click.once="initialize()">Init</button>
 * <div @click.self="onlyThis()">...</div>
 * <input @keydown.capture="log()">
 * ```
 *
 * ### Key Modifiers
 * ```html
 * <input @keydown.enter="submit()">
 * <input @keyup.escape="cancel()">
 * <input @keydown.space="toggle()">
 * <input @keydown.ctrl.s="save()">
 * <input @keydown.meta.enter="send()">
 * ```
 *
 * ### Mouse Modifiers
 * ```html
 * <div @click.left="handleLeft()">
 * <div @click.right="handleRight()">
 * <div @click.middle="handleMiddle()">
 * ```
 *
 * ### Special Variables
 * ```html
 * <input @input="value = $event.target.value">
 * <button @click="handleClick($el)">Uses element</button>
 * ```
 *
 * @module events
 */

// =============================================================================
// Types
// =============================================================================

export interface ParsedEvent {
  /** Original attribute string (e.g., "@click.prevent") */
  attribute: string
  /** Event name (e.g., "click", "keydown") */
  event: string
  /** Handler expression (e.g., "count++", "handleClick()") */
  handler: string
  /** Event modifiers */
  modifiers: EventModifiers
  /** Unique element ID for binding */
  elementId: string
}

export interface EventModifiers {
  /** Call preventDefault() */
  prevent: boolean
  /** Call stopPropagation() */
  stop: boolean
  /** Only fire once */
  once: boolean
  /** Use capture mode */
  capture: boolean
  /** Only fire if event.target === element */
  self: boolean
  /** Passive event listener */
  passive: boolean
  /** Key modifiers (enter, escape, space, etc.) */
  keys: string[]
  /** System modifiers (ctrl, alt, shift, meta) */
  systemKeys: string[]
  /** Mouse button (left, right, middle) */
  mouse: string | null
  /** Debounce delay in ms */
  debounce: number | null
  /** Throttle delay in ms */
  throttle: number | null
}

interface ElementWithEvents {
  originalTag: string
  elementId: string
  events: ParsedEvent[]
  startIndex: number
  endIndex: number
}

// =============================================================================
// Constants
// =============================================================================

/** Standard DOM events */
const DOM_EVENTS = new Set([
  // Mouse events
  'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
  'mouseenter', 'mouseleave', 'mouseover', 'mouseout',
  'contextmenu', 'wheel',
  // Keyboard events
  'keydown', 'keyup', 'keypress',
  // Form events
  'submit', 'reset', 'change', 'input', 'focus', 'blur',
  'focusin', 'focusout', 'select', 'invalid',
  // Touch events
  'touchstart', 'touchend', 'touchmove', 'touchcancel',
  // Drag events
  'drag', 'dragstart', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop',
  // Other events
  'scroll', 'resize', 'load', 'error', 'abort',
  'animationstart', 'animationend', 'animationiteration',
  'transitionstart', 'transitionend', 'transitionrun', 'transitioncancel',
  // Lifecycle events (custom)
  'mounted', 'unmounted',
])

/** Key aliases for common keys */
const KEY_ALIASES: Record<string, string> = {
  enter: 'Enter',
  tab: 'Tab',
  delete: 'Delete',
  backspace: 'Backspace',
  esc: 'Escape',
  escape: 'Escape',
  space: ' ',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
}

/** System key modifiers */
const SYSTEM_KEYS = new Set(['ctrl', 'alt', 'shift', 'meta'])

/** Mouse button modifiers */
const MOUSE_BUTTONS: Record<string, number> = {
  left: 0,
  middle: 1,
  right: 2,
}

// =============================================================================
// Parser
// =============================================================================

/**
 * Parse event modifiers from an attribute like "@click.prevent.stop"
 */
function parseModifiers(parts: string[]): EventModifiers {
  const modifiers: EventModifiers = {
    prevent: false,
    stop: false,
    once: false,
    capture: false,
    self: false,
    passive: false,
    keys: [],
    systemKeys: [],
    mouse: null,
    debounce: null,
    throttle: null,
  }

  for (const part of parts) {
    const lowerPart = part.toLowerCase()

    if (lowerPart === 'prevent') {
      modifiers.prevent = true
    }
    else if (lowerPart === 'stop') {
      modifiers.stop = true
    }
    else if (lowerPart === 'once') {
      modifiers.once = true
    }
    else if (lowerPart === 'capture') {
      modifiers.capture = true
    }
    else if (lowerPart === 'self') {
      modifiers.self = true
    }
    else if (lowerPart === 'passive') {
      modifiers.passive = true
    }
    else if (SYSTEM_KEYS.has(lowerPart)) {
      modifiers.systemKeys.push(lowerPart)
    }
    else if (lowerPart in MOUSE_BUTTONS) {
      modifiers.mouse = lowerPart
    }
    else if (lowerPart in KEY_ALIASES || /^[a-z]$/.test(lowerPart)) {
      modifiers.keys.push(KEY_ALIASES[lowerPart] || lowerPart.toUpperCase())
    }
    else if (lowerPart.startsWith('debounce')) {
      const match = lowerPart.match(/debounce(?:\.(\d+))?/)
      modifiers.debounce = match?.[1] ? Number.parseInt(match[1], 10) : 300
    }
    else if (lowerPart.startsWith('throttle')) {
      const match = lowerPart.match(/throttle(?:\.(\d+))?/)
      modifiers.throttle = match?.[1] ? Number.parseInt(match[1], 10) : 300
    }
  }

  return modifiers
}

/**
 * Find all elements with event attributes in the template
 */
function findElementsWithEvents(template: string): ElementWithEvents[] {
  const elements: ElementWithEvents[] = []
  let idCounter = 0

  // Match opening tags with @ attributes
  // This regex finds tags like <button @click="handler"> or <div @keydown.enter="fn()">
  const tagRegex = /<([a-z][a-z0-9-]*)\s+([^>]*@[a-z][^>]*)>/gi
  let match

  while ((match = tagRegex.exec(template)) !== null) {
    const [fullMatch, _tagName, attributesStr] = match
    const startIndex = match.index
    const endIndex = startIndex + fullMatch.length

    // Generate a single ID for this element
    const elementId = `__stx_evt_${idCounter++}`

    // Find all @event attributes in this tag
    // Use two separate regexes for double and single quoted values
    const events: ParsedEvent[] = []

    // Match double-quoted handlers: @event="handler"
    const doubleQuoteRegex = /@([a-z][a-z0-9.]*)\s*=\s*"([^"]*)"/gi
    let attrMatch

    while ((attrMatch = doubleQuoteRegex.exec(attributesStr)) !== null) {
      const [, eventWithModifiers, handler] = attrMatch
      const parts = eventWithModifiers.split('.')
      const eventName = parts[0]

      if (!DOM_EVENTS.has(eventName)) continue

      events.push({
        attribute: `@${eventWithModifiers}`,
        event: eventName,
        handler,
        modifiers: parseModifiers(parts.slice(1)),
        elementId,
      })
    }

    // Match single-quoted handlers: @event='handler'
    const singleQuoteRegex = /@([a-z][a-z0-9.]*)\s*=\s*'([^']*)'/gi

    while ((attrMatch = singleQuoteRegex.exec(attributesStr)) !== null) {
      const [, eventWithModifiers, handler] = attrMatch
      const parts = eventWithModifiers.split('.')
      const eventName = parts[0]

      if (!DOM_EVENTS.has(eventName)) continue

      events.push({
        attribute: `@${eventWithModifiers}`,
        event: eventName,
        handler,
        modifiers: parseModifiers(parts.slice(1)),
        elementId,
      })
    }

    if (events.length > 0) {
      elements.push({
        originalTag: fullMatch,
        elementId,
        events,
        startIndex,
        endIndex,
      })
    }
  }

  return elements
}

// =============================================================================
// Code Generator
// =============================================================================

/**
 * Generate the condition check for modifiers
 */
function generateModifierChecks(event: ParsedEvent): string {
  const checks: string[] = []
  const { modifiers } = event

  // Self modifier
  if (modifiers.self) {
    checks.push('if ($event.target !== $el) return')
  }

  // System key checks
  for (const key of modifiers.systemKeys) {
    checks.push(`if (!$event.${key}Key) return`)
  }

  // Key checks (for keyboard events)
  if (modifiers.keys.length > 0) {
    const keyChecks = modifiers.keys.map(k => `$event.key === '${k}'`).join(' || ')
    checks.push(`if (!(${keyChecks})) return`)
  }

  // Mouse button check
  if (modifiers.mouse !== null) {
    const button = MOUSE_BUTTONS[modifiers.mouse]
    checks.push(`if ($event.button !== ${button}) return`)
  }

  // Prevent and stop
  if (modifiers.prevent) {
    checks.push('$event.preventDefault()')
  }
  if (modifiers.stop) {
    checks.push('$event.stopPropagation()')
  }

  return checks.join('; ')
}

/**
 * Generate handler wrapper with debounce/throttle
 */
function wrapHandler(handler: string, modifiers: EventModifiers): string {
  let wrapped = handler

  if (modifiers.debounce !== null) {
    wrapped = `__stx_debounce(() => { ${wrapped} }, ${modifiers.debounce})`
  }
  else if (modifiers.throttle !== null) {
    wrapped = `__stx_throttle(() => { ${wrapped} }, ${modifiers.throttle})`
  }

  return wrapped
}

/**
 * Generate the event listener code for a single event
 */
function generateEventListener(event: ParsedEvent): string {
  const { elementId, modifiers } = event
  const checks = generateModifierChecks(event)
  const handler = wrapHandler(event.handler, modifiers)

  const options: string[] = []
  if (modifiers.once) options.push('once: true')
  if (modifiers.capture) options.push('capture: true')
  if (modifiers.passive) options.push('passive: true')
  const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : ''

  // Escape the handler for use in string
  const escapedHandler = handler.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  // Handle lifecycle events specially
  if (event.event === 'mounted') {
    return `
  (function() {
    var $el = document.getElementById('${elementId}');
    if (!$el) return;
    // Run mounted handler immediately (DOM is ready)
    var scope = $el.closest('[data-stx-scope]');
    if (scope && scope.__stx_execute) {
      scope.__stx_execute('${escapedHandler}', null, $el);
    } else {
      ${handler}
    }
  })();`
  }

  if (event.event === 'unmounted') {
    return `
  (function() {
    var $el = document.getElementById('${elementId}');
    if (!$el) return;
    // Set up MutationObserver to detect removal
    var observer = new MutationObserver(function(mutations) {
      for (var m of mutations) {
        for (var node of m.removedNodes) {
          if (node === $el || (node.contains && node.contains($el))) {
            observer.disconnect();
            var scope = $el.closest('[data-stx-scope]');
            if (scope && scope.__stx_execute) {
              scope.__stx_execute('${escapedHandler}', null, $el);
            } else {
              ${handler}
            }
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Store observer for cleanup
    $el.__stx_unmount_observer = observer;
  })();`
  }

  return `
  (function() {
    var $el = document.getElementById('${elementId}');
    if (!$el) return;
    $el.addEventListener('${event.event}', function($event) {
      ${checks ? checks + ';' : ''}
      // Find the closest reactive scope and execute within its context
      var scope = $el.closest('[data-stx-scope]');
      if (scope && scope.__stx_execute) {
        scope.__stx_execute('${escapedHandler}', $event, $el);
      } else {
        // Fallback for non-reactive context
        ${handler}
      }
    }${optionsStr});
  })();`
}

/**
 * Generate the complete runtime script
 */
function generateRuntimeScript(elements: ElementWithEvents[]): string {
  if (elements.length === 0) {
    return ''
  }

  const listeners = elements
    .flatMap(el => el.events)
    .map(generateEventListener)
    .join('\n')

  return `
<script data-stx-events>
(function() {
  'use strict';

  // Utility functions
  function __stx_debounce(fn, delay) {
    var timeout;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timeout);
      timeout = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  }

  function __stx_throttle(fn, delay) {
    var last = 0;
    return function() {
      var now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  // Event listeners
  ${listeners}
})();
</script>`
}

// =============================================================================
// Main Processing Function
// =============================================================================

/**
 * Process event directives in a template.
 *
 * Transforms `@click`, `@keydown.enter`, etc. attributes into
 * client-side event listeners.
 *
 * @param template - The HTML template string
 * @param context - Template context (for future use with x-data)
 * @param filePath - Source file path for error messages
 * @returns Processed template with event binding script
 */
export function processEventDirectives(
  template: string,
  _context: Record<string, unknown>,
  _filePath: string,
): string {
  // Find all elements with event attributes
  const elements = findElementsWithEvents(template)

  if (elements.length === 0) {
    return template
  }

  let output = template

  // Process elements from end to start to preserve indices
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]

    // Add ID to the element and remove @ attributes
    let newTag = element.originalTag

    // Add data-stx-id if no id exists
    if (!newTag.includes(' id=')) {
      newTag = newTag.replace(/^<([a-z][a-z0-9-]*)/, `<$1 id="${element.elementId}"`)
    }
    else {
      // Element has an ID, use that instead
      const idMatch = newTag.match(/id=["']([^"']+)["']/)
      if (idMatch) {
        // Update all events to use the existing ID
        for (const evt of element.events) {
          evt.elementId = idMatch[1]
        }
      }
    }

    // Remove @ attributes from the tag
    for (const evt of element.events) {
      const escapedAttr = evt.attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Try to remove double-quoted version first, then single-quoted
      const doubleQuotePattern = new RegExp(`\\s*${escapedAttr}\\s*=\\s*"[^"]*"`, 'g')
      const singleQuotePattern = new RegExp(`\\s*${escapedAttr}\\s*=\\s*'[^']*'`, 'g')
      newTag = newTag.replace(doubleQuotePattern, '')
      newTag = newTag.replace(singleQuotePattern, '')
    }

    // Replace the original tag
    output = output.slice(0, element.startIndex) + newTag + output.slice(element.endIndex)
  }

  // Generate and inject the runtime script
  const script = generateRuntimeScript(elements)

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
 * Check if a template contains event directives
 */
export function hasEventDirectives(template: string): boolean {
  return /@[a-z]+(?:\.[a-z]+)*\s*=\s*["'][^"']*["']/i.test(template)
}
