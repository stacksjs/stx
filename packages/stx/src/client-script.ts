/**
 * Client Script Processor
 *
 * Transforms <script client> blocks in SFC (.stx) components:
 * 1. Resolves `import { store } from '@stores'` to runtime store access
 * 2. Injects event binding code (from @click, @input, etc.) into the script scope
 * 3. Auto-wraps in a scoped IIFE for isolation
 *
 * This enables clean component authoring:
 * ```stx
 * <template>
 *   <button @click="handleClick()">Send</button>
 * </template>
 *
 * <script client>
 * import { appStore } from '@stores'
 *
 * function handleClick() {
 *   appStore.setProcessing(true)
 * }
 * </script>
 * ```
 *
 * @module client-script
 */

import type { ParsedEvent, EventModifiers } from './events'
import { transformStoreImports } from './state-management'

// =============================================================================
// Types
// =============================================================================

export interface ClientScriptOptions {
  /** Event bindings collected from template @event attributes */
  eventBindings?: ParsedEvent[]
}

// =============================================================================
// Mouse button map (mirrors events.ts)
// =============================================================================

const MOUSE_BUTTONS: Record<string, number> = {
  left: 0,
  middle: 1,
  right: 2,
}

// =============================================================================
// Event Binding Code Generation
// =============================================================================

/**
 * Generate modifier checks for an event handler.
 * Produces guard statements like `if (!$event.ctrlKey) return`.
 */
function generateModifierChecks(modifiers: EventModifiers): string {
  const checks: string[] = []

  if (modifiers.self) {
    checks.push('if ($event.target !== $el) return')
  }

  for (const key of modifiers.systemKeys) {
    checks.push(`if (!$event.${key}Key) return`)
  }

  if (modifiers.keys.length > 0) {
    const keyChecks = modifiers.keys.map(k => `$event.key === '${k}'`).join(' || ')
    checks.push(`if (!(${keyChecks})) return`)
  }

  if (modifiers.mouse !== null) {
    const button = MOUSE_BUTTONS[modifiers.mouse]
    checks.push(`if ($event.button !== ${button}) return`)
  }

  if (modifiers.prevent) {
    checks.push('$event.preventDefault()')
  }
  if (modifiers.stop) {
    checks.push('$event.stopPropagation()')
  }

  return checks.join('; ')
}

/**
 * Generate inline event binding code for a single event.
 * This code lives inside the component's script scope,
 * so it can directly call functions defined in the script.
 */
function generateSingleEventBinding(binding: ParsedEvent, index: number): string {
  const { elementId, event, handler, modifiers } = binding
  const checks = generateModifierChecks(modifiers)

  const options: string[] = []
  if (modifiers.once) options.push('once: true')
  if (modifiers.capture) options.push('capture: true')
  if (modifiers.passive) options.push('passive: true')
  const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : ''

  // Build the handler body
  let handlerBody = ''
  if (checks) {
    handlerBody += `${checks}; `
  }

  // Wrap handler in debounce/throttle if specified
  if (modifiers.debounce !== null) {
    return `  ;(function() {
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __timer
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}clearTimeout(__timer)
      __timer = setTimeout(function() { ${handler} }, ${modifiers.debounce})
    }${optionsStr})
  })()`
  }

  if (modifiers.throttle !== null) {
    return `  ;(function() {
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __last = 0
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}var __now = Date.now()
      if (__now - __last >= ${modifiers.throttle}) {
        __last = __now
        ${handler}
      }
    }${optionsStr})
  })()`
  }

  // Standard event binding
  return `  var $el = document.getElementById('${elementId}')
  if ($el) $el.addEventListener('${event}', function($event) {
    ${handlerBody}${handler}
  }${optionsStr})`
}

/**
 * Generate all inline event bindings for injection into the client script scope.
 */
function generateInlineEventBindings(bindings: ParsedEvent[]): string {
  if (bindings.length === 0) return ''

  const code = bindings.map((b, i) => generateSingleEventBinding(b, i)).join('\n')

  return `\n  // STX: auto-generated event bindings\n${code}`
}

// =============================================================================
// Main Processing Function
// =============================================================================

/**
 * Transform a <script client> block's content into a fully processed <script> tag.
 *
 * - Resolves `import { x } from '@stores'` to runtime store access
 * - Appends event binding code inside the script scope
 * - Wraps everything in a scoped IIFE
 *
 * @param scriptContent - The raw content inside <script client>...</script>
 * @param options - Event bindings and other processing options
 * @returns A complete `<script>...</script>` tag ready for browser injection
 */
export function processClientScript(
  scriptContent: string,
  options: ClientScriptOptions = {},
): string {
  let code = scriptContent

  // 1. Transform store imports
  code = transformStoreImports(code)

  // 2. Generate event binding code
  const eventCode = generateInlineEventBindings(options.eventBindings || [])

  // 3. Wrap in scoped IIFE
  return `<script>
;(function() {
  'use strict'
${code}
${eventCode}
})()</script>`
}
