/**
 * Client Script Processor
 *
 * Transforms <script client> blocks in SFC (.stx) components:
 * 1. Auto-imports from 'stx' and '@stacksjs/browser' (no import statements needed)
 * 2. Resolves `import { store } from '@stores'` to runtime store access
 * 3. Injects event binding code (from @click, @input, etc.) into the script scope
 * 4. Auto-wraps in a scoped IIFE for isolation
 *
 * This enables clean component authoring:
 * ```stx
 * <template>
 *   <button @click="handleClick()">Count: {{ count() }}</button>
 * </template>
 *
 * <script>
 * // No imports needed! state, onMount, Trail, etc. are auto-imported
 * const count = state(0)
 *
 * onMount(async () => {
 *   const trails = await Trail.all()
 *   console.log(trails)
 * })
 *
 * function handleClick() {
 *   count.set(count() + 1)
 * }
 * </script>
 * ```
 *
 * @module client-script
 */

import type { ParsedEvent, EventModifiers } from './events'
import { transformStoreImports } from './state-management'

// =============================================================================
// Auto-Import Configuration
// =============================================================================

/**
 * Exports from 'stx' that are auto-imported
 */
const STX_AUTO_IMPORTS = [
  // Signals (modern reactivity)
  'state', 'derived', 'effect', 'batch', 'untrack', 'peek', 'isSignal', 'isDerived',
  // Lifecycle
  'onMount', 'onDestroy',
  // Vue-style reactivity (alternative API)
  'ref', 'reactive', 'computed', 'watch', 'watchEffect', 'watchMultiple',
  // Vue-style lifecycle hooks
  'onBeforeMount', 'onMounted', 'onBeforeUpdate', 'onUpdated', 'onBeforeUnmount', 'onUnmounted',
  // Component definition
  'defineProps', 'withDefaults', 'defineEmits', 'defineExpose',
  // Composition API (Vue-compatible)
  'provide', 'inject', 'nextTick', 'getCurrentInstance',
  'onErrorCaptured', 'useSlots', 'useAttrs',
  // Store/state management
  'createStore', 'defineStore', 'action', 'createSelector',
  // JSX
  'h', 'Fragment',
]

/**
 * Core exports from '@stacksjs/browser' that are auto-imported.
 * App-specific models are detected dynamically (PascalCase identifiers
 * used with query methods like .all(), .find(), .where(), etc.)
 */
const BROWSER_CORE_IMPORTS = [
  // Browser Query Builder
  'browserQuery', 'BrowserQueryBuilder', 'BrowserQueryError',
  'browserAuth', 'configureBrowser', 'getBrowserConfig',
  'createBrowserDb', 'createBrowserModel', 'isBrowser',
  // Auth
  'auth', 'useAuth', 'initApi',
  // Formatting utilities
  'formatAreaSize', 'formatDistance', 'formatElevation', 'formatDuration',
  'getRelativeTime', 'fetchData',
]

/**
 * Detect model usage in code.
 * Models are PascalCase identifiers used with query methods.
 * Returns array of detected model names.
 */
function detectModelUsage(code: string): string[] {
  const models: Set<string> = new Set()

  // Pattern: PascalCase identifier followed by query method
  // e.g., Trail.all(), User.find(1), Activity.where('type', 'run')
  const modelPattern = /\b([A-Z][a-zA-Z0-9]*)\s*\.\s*(all|find|first|get|where|orderBy|orderByDesc|limit|select|pluck|create|update|delete)\s*\(/g

  let match
  while ((match = modelPattern.exec(code)) !== null) {
    models.add(match[1])
  }

  return Array.from(models)
}

// =============================================================================
// Types
// =============================================================================

export interface ClientScriptOptions {
  /** Event bindings collected from template @event attributes */
  eventBindings?: ParsedEvent[]
  /** Whether to enable auto-imports (default: true) */
  autoImports?: boolean
  /** Original script tag attributes (e.g., 'type="module"') */
  attrs?: string
}

// =============================================================================
// Auto-Import Transformation
// =============================================================================

interface AutoImportResult {
  code: string
  stxImports: string[]
  browserImports: string[]
}

/**
 * Transform auto-imports from 'stx' and '@stacksjs/browser'
 *
 * This detects usage of auto-importable symbols and generates the
 * necessary import statements if they're not already present.
 *
 * Users can write code without imports:
 * ```
 * const count = state(0)  // 'state' is auto-imported from 'stx'
 * const trails = await Trail.all()  // 'Trail' is auto-imported from '@stacksjs/browser'
 * ```
 */
function transformAutoImports(code: string): AutoImportResult {
  const usedStxImports: Set<string> = new Set()
  const usedBrowserImports: Set<string> = new Set()
  let transformedCode = code

  // Track existing imports to avoid duplicates
  const existingImports = new Set<string>()

  // Pattern to match import statements from 'stx' or '@stacksjs/browser'
  const importRegex = /^\s*import\s+(?:type\s+)?{\s*([^}]+)\s*}\s+from\s+['"](@stacksjs\/browser|stx)['"]\s*;?\s*$/gm

  let match
  while ((match = importRegex.exec(code)) !== null) {
    const imports = match[1]
    const source = match[2]

    // Skip type-only imports
    if (match[0].includes('import type')) {
      continue
    }

    // Parse imported names
    const importedNames = imports
      .split(',')
      .map((s: string) => s.trim().split(/\s+as\s+/)[0]) // Get original name
      .filter((s: string) => s.length > 0)

    importedNames.forEach(name => {
      existingImports.add(name)
      if (source === 'stx') {
        usedStxImports.add(name)
      } else {
        usedBrowserImports.add(name)
      }
    })

    // Remove the import statement - will be re-added with all needed imports
    transformedCode = transformedCode.replace(match[0], '// [auto-import processed]')
  }

  // Detect usage of auto-importable symbols that weren't explicitly imported
  for (const symbol of STX_AUTO_IMPORTS) {
    if (existingImports.has(symbol)) continue
    // Check if symbol is used in code (as identifier boundary)
    const symbolRegex = new RegExp(`\\b${symbol}\\s*\\(`, 'g')
    if (symbolRegex.test(transformedCode)) {
      usedStxImports.add(symbol)
    }
  }

  // Check core browser utilities
  for (const symbol of BROWSER_CORE_IMPORTS) {
    if (existingImports.has(symbol)) continue
    const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g')
    if (symbolRegex.test(transformedCode)) {
      usedBrowserImports.add(symbol)
    }
  }

  // Dynamically detect app-specific models (PascalCase with query methods)
  const detectedModels = detectModelUsage(transformedCode)
  for (const model of detectedModels) {
    if (!existingImports.has(model)) {
      usedBrowserImports.add(model)
    }
  }

  return {
    code: transformedCode,
    stxImports: Array.from(usedStxImports),
    browserImports: Array.from(usedBrowserImports),
  }
}

/**
 * Generate destructuring statements for auto-imported symbols
 * These access globals set up by the STX runtime and @stacksjs/browser
 */
function generateAutoImportDestructuring(stxImports: string[], browserImports: string[]): string {
  const lines: string[] = []

  // STX symbols come from window.stx (set up by signals runtime)
  // They're also exposed directly on window (state, derived, effect, etc.)
  if (stxImports.length > 0) {
    lines.push(`  var { ${stxImports.join(', ')} } = window.stx || window`)
  }

  // Browser symbols come from window.StacksBrowser (set up by @stacksjs/browser auto-init)
  if (browserImports.length > 0) {
    lines.push(`  var { ${browserImports.join(', ')} } = window.StacksBrowser || {}`)
  }

  if (lines.length > 0) {
    return `  // STX: auto-imported from stx and @stacksjs/browser\n${lines.join('\n')}\n`
  }

  return ''
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
 * - Auto-imports from 'stx' and '@stacksjs/browser' (no explicit imports needed)
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
  let autoImportCode = ''

  // 1. Transform auto-imports from 'stx' and '@stacksjs/browser'
  if (options.autoImports !== false) {
    const autoImportResult = transformAutoImports(code)
    code = autoImportResult.code
    autoImportCode = generateAutoImportDestructuring(
      autoImportResult.stxImports,
      autoImportResult.browserImports,
    )
  }

  // 2. Transform store imports
  code = transformStoreImports(code)

  // 3. Generate event binding code
  const eventCode = generateInlineEventBindings(options.eventBindings || [])

  // 4. Build the output script tag
  const attrs = (options.attrs || '').trim()
  const isModule = /\btype\s*=\s*["']module["']/i.test(attrs)

  if (isModule) {
    // Module scripts: preserve type="module", no IIFE wrapping
    const extraAttrs = attrs.replace(/\btype\s*=\s*["']module["']/i, '').trim()
    const attrStr = `type="module" data-stx-scoped${extraAttrs ? ` ${extraAttrs}` : ''}`
    return `<script ${attrStr}>
${autoImportCode}${code}
${eventCode}
</script>`
  }

  // Regular scripts: wrap in scoped IIFE
  return `<script data-stx-scoped>
;(function() {
  'use strict';
${autoImportCode}${code}
${eventCode}
})()</script>`
}
