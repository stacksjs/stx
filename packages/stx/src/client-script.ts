/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Client Script Processor
 *
 * Transforms <script client> blocks in SFC (.stx) components:
 * 1. Auto-imports from 'stx' and '@stacksjs/browser' (no import statements needed)
 * 2. Resolves `import { store } from '@stores'` to runtime store access
 * 3. Transpiles TypeScript to JavaScript (strips type annotations, interfaces, import type)
 * 4. Injects event binding code (from @click, @input, etc.) into the script scope
 * 5. Auto-wraps in a scoped IIFE for isolation
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
import { transformStoreImports } from './store-imports'
import { shouldTranspileTypeScript, transpileTypeScript } from './utils'

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
  // Template refs
  'useRef',
  // Navigation
  'navigate', 'goBack', 'goForward', 'useRoute', 'setRouteParams', 'useSearchParams',
  // Data fetching
  'useQuery', 'useMutation',
  // DOM utilities
  'useEventListener', 'useMeta',
  // Timers
  'useDebounce', 'useDebouncedValue', 'useThrottle', 'useInterval', 'useTimeout',
  // Utilities
  'useToggle', 'useCounter', 'useClickOutside', 'useFocus', 'useAsync',
  // Color Mode
  'useColorMode', 'useDark',
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
  // Browser Query Builder - only symbols truly unique to @stacksjs/browser
  'browserQuery', 'BrowserQueryBuilder', 'BrowserQueryError',
  'browserAuth', 'configureBrowser', 'getBrowserConfig',
  'createBrowserDb', 'createBrowserModel', 'isBrowser',
]

/**
 * Detect model usage in code.
 * Models are PascalCase identifiers used with query methods.
 * Returns array of detected model names.
 */
// JS built-ins that are PascalCase and could match model patterns
// e.g., Promise.all(), Object.keys(), Array.from(), Map.get(), Set.delete()
const JS_BUILTINS = new Set([
  'Promise', 'Object', 'Array', 'Map', 'Set', 'Date', 'Error', 'JSON', 'Math',
  'Number', 'String', 'RegExp', 'Symbol', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect',
  'Intl', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response',
  'AbortController', 'EventTarget', 'Element', 'Document', 'Node', 'Window',
  'Console', 'Storage', 'Navigator', 'Blob', 'File', 'FileReader', 'HTMLElement',
  'SVGElement', 'Event', 'CustomEvent', 'DOMParser', 'XMLSerializer', 'WebSocket',
  'Worker', 'SharedWorker', 'IntersectionObserver', 'MutationObserver',
  'ResizeObserver', 'PerformanceObserver', 'Notification', 'Bun', 'Buffer', 'Process',
  'Modal', 'Intl',
])

function detectModelUsage(code: string): string[] {
  const models: Set<string> = new Set()

  // Pattern: PascalCase identifier followed by query method
  // e.g., Trail.all(), User.find(1), Activity.where('type', 'run')
  const modelPattern = /\b([A-Z][a-zA-Z0-9]*)\s*\.\s*(all|find|first|get|where|orderBy|orderByDesc|limit|select|pluck|create|update|delete)\s*\(/g

  let match
  while ((match = modelPattern.exec(code)) !== null) {
    // Skip JS built-ins that happen to have matching method names
    if (!JS_BUILTINS.has(match[1])) {
      models.add(match[1])
    }
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
  /** Whether the component template contains : prefix directives */
  hasColonDirectives?: boolean
  /** Template HTML content for auto-binding analysis (Phase 2: auto-detect which scripts need stx.mount()) */
  templateContent?: string
  /** File path of the template (for relative import resolution in bundler) */
  filePath?: string
  /** Project root directory (for @/ path resolution in bundler) */
  projectRoot?: string
  /** Whether this is a production build (enables minification in bundler) */
  production?: boolean
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

  // Strip all `import type` statements from any source — these are type-only
  // and will be erased during TypeScript transpilation, but we strip them early
  // to prevent interference with auto-import detection and IIFE wrapping
  transformedCode = transformedCode.replace(
    /^\s*import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm,
    '// [type import stripped]',
  )

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
      }
else {
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
    lines.push(`  var { ${stxImports.join(', ')} } = window.stx || window;`)
  }

  // Browser symbols come from window.StacksBrowser (set up by @stacksjs/browser auto-init)
  if (browserImports.length > 0) {
    lines.push(`  var { ${browserImports.join(', ')} } = window.StacksBrowser || {};`)
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
// eslint-disable-next-line pickier/no-unused-vars
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

  // Escape handler for use in string context (scope.__stx_execute calls)
  const escapedHandler = handler.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  // Helper: wrap handler to check for reactive scope (x-data) before bare execution
  function scopeAwareHandler(h: string): string {
    return `var scope = $el.closest('[data-stx-scope]');
      if (scope && scope.__stx_execute) {
        scope.__stx_execute('${escapedHandler}', $event, $el);
      }
else {
        ${h}
      }`
  }

  // Wrap handler in debounce/throttle if specified
  if (modifiers.debounce !== null) {
    return `  ;(function() {
    // eslint-disable-next-line pickier/no-unused-vars
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __timer
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}clearTimeout(__timer)
      __timer = setTimeout(function() { ${scopeAwareHandler(handler)} }, ${modifiers.debounce})
    }${optionsStr})
  })()`
  }

  if (modifiers.throttle !== null) {
    return `  ;(function() {
    // eslint-disable-next-line pickier/no-unused-vars
    var $el = document.getElementById('${elementId}')
    if (!$el) return
    var __last = 0
    $el.addEventListener('${event}', function($event) {
      ${checks ? checks + '; ' : ''}var __now = Date.now()
      if (__now - __last >= ${modifiers.throttle}) {
        __last = __now
        ${scopeAwareHandler(handler)}
      }
    }${optionsStr})
  })()`
  }

  // Standard event binding — check for reactive scope (x-data) first
  return `  var $el = document.getElementById('${elementId}')
  if ($el) $el.addEventListener('${event}', function($event) {
    ${handlerBody}var scope = $el.closest('[data-stx-scope]');
    if (scope && scope.__stx_execute) {
      scope.__stx_execute('${escapedHandler}', $event, $el);
    }
else {
      ${handler}
    }
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
// Top-Level Declaration Extraction (for stx.mount() return statement)
// =============================================================================

/**
 * Extract top-level variable/function declarations from script code.
 * Used to auto-generate the return statement for stx.mount() wrappers.
 */
function extractTopLevelDeclarations(code: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  // Remove import lines (handled separately by transform)
  const cleaned = code.replace(/^\s*import\s+.*$/gm, '')

  // Track brace/paren depth to only capture top-level declarations
  let depth = 0
  const len = cleaned.length
  let i = 0

  while (i < len) {
    const ch = cleaned[i]

    // Skip string literals
    if (ch === '\'' || ch === '"' || ch === '`') {
      const quote = ch
      i++
      if (quote === '`') {
        // Template literal with nested expressions
        let tplDepth = 0
        while (i < len) {
          if (cleaned[i] === '\\') { i += 2; continue }
          if (cleaned[i] === '`' && tplDepth === 0) { i++; break }
          if (cleaned[i] === '$' && cleaned[i + 1] === '{') { tplDepth++; i += 2; continue }
          if (cleaned[i] === '}' && tplDepth > 0) { tplDepth--; i++; continue }
          i++
        }
      }
      else {
        while (i < len) {
          if (cleaned[i] === '\\') { i += 2; continue }
          if (cleaned[i] === quote) { i++; break }
          i++
        }
      }
      continue
    }

    // Skip comments
    if (ch === '/' && cleaned[i + 1] === '/') {
      while (i < len && cleaned[i] !== '\n') i++
      continue
    }
    if (ch === '/' && cleaned[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(cleaned[i] === '*' && cleaned[i + 1] === '/')) i++
      i += 2
      continue
    }

    // Track brace depth
    if (ch === '{') { depth++; i++; continue }
    if (ch === '}') { depth--; i++; continue }

    // Only extract declarations at depth 0
    if (depth === 0) {
      const rest = cleaned.slice(i)

      // Simple declarations: const x = ..., let x = ..., var x = ...
      const simpleMatch = rest.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*(?::[^=]*)?=/)
      if (simpleMatch) {
        const name = simpleMatch[1]
        if (!name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        i += simpleMatch[0].length
        continue
      }

      // Destructured: const { a, b: alias } = ...
      const destructMatch = rest.match(/^(?:const|let|var)\s+\{([^}]+)\}\s*=/)
      if (destructMatch) {
        destructMatch[1].split(',').forEach(s => {
          const trimmed = s.trim()
          // Handle rename: "data: stats" -> use "stats", "loading" -> use "loading"
          const colonIdx = trimmed.indexOf(':')
          const name = colonIdx >= 0 ? trimmed.slice(colonIdx + 1).trim().split(/[\s=]/)[0] : trimmed.split(/[\s=]/)[0]
          if (name && !name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        })
        i += destructMatch[0].length
        continue
      }

      // Function declarations: function x() { ... }
      const fnMatch = rest.match(/^(?:async\s+)?function\s+([a-zA-Z_$]\w*)/)
      if (fnMatch) {
        const name = fnMatch[1]
        if (!name.startsWith('_') && !seen.has(name)) { names.push(name); seen.add(name) }
        i += fnMatch[0].length
        continue
      }
    }

    i++
  }

  return names
}

// =============================================================================
// Template Reference Analyzer (Phase 2: Auto-Binding)
// =============================================================================

/**
 * JS keywords and built-ins to exclude from template reference extraction.
 * These appear in expressions but are not user-defined identifiers.
 */
const JS_KEYWORDS = new Set([
  'if', 'else', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'in', 'of', 'new', 'this', 'return', 'void', 'delete', 'throw', 'switch',
  'case', 'break', 'continue', 'for', 'while', 'do', 'try', 'catch', 'finally',
  'const', 'let', 'var', 'function', 'class', 'import', 'export', 'default',
  'async', 'await', 'yield', 'with', 'debugger',
  // Common globals that aren't user declarations
  'console', 'window', 'document', 'Math', 'JSON', 'Date', 'Array', 'Object',
  'String', 'Number', 'Boolean', 'Symbol', 'Map', 'Set', 'Promise', 'Error',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'fetch', 'alert', 'confirm', 'prompt', 'event',
])

/**
 * Extract all identifiers referenced in template binding expressions.
 *
 * Scans for:
 * - {{ expression }} mustache expressions
 * - :attribute="expression" bindings (:class, :style, :if, :show, etc.)
 * - @event="handler" event handlers (@click, @input, etc.)
 * - @model="value" two-way bindings
 * - @for="item in items" loop directives (extracts the iterable)
 *
 * Returns a Set of identifier names (excluding JS keywords/built-ins).
 */
function extractTemplateReferences(templateHtml: string): Set<string> {
  const refs = new Set<string>()
  const identifierRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g

  function addIdentifiers(expr: string) {
    let match
    while ((match = identifierRegex.exec(expr)) !== null) {
      const name = match[0]
      if (!JS_KEYWORDS.has(name)) {
        refs.add(name)
      }
    }
  }

  // {{ expression }}
  const mustacheRegex = /\{\{([\s\S]*?)\}\}/g
  let m
  while ((m = mustacheRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // :attribute="expression" (covers :class, :style, :if, :show, :bind, etc.)
  const colonBindRegex = /:[a-z][\w.-]*\s*=\s*"([^"]*)"/gi
  while ((m = colonBindRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }
  const colonBindSingleRegex = /:[a-z][\w.-]*\s*=\s*'([^']*)'/gi
  while ((m = colonBindSingleRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @event="handler" (covers @click, @input, @submit.prevent, etc.)
  const eventRegex = /@[a-z]+(?:\.[a-z]+)*\s*=\s*"([^"]*)"/gi
  while ((m = eventRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }
  const eventSingleRegex = /@[a-z]+(?:\.[a-z]+)*\s*=\s*'([^']*)'/gi
  while ((m = eventSingleRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @model="value"
  const modelRegex = /@model\s*=\s*["']([^"']*)["']/gi
  while ((m = modelRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  // @for="item in items" — extract the iterable (right side of 'in')
  const forRegex = /@for\s*=\s*["'][^"']*\bin\s+([^"']+)["']/gi
  while ((m = forRegex.exec(templateHtml)) !== null) {
    addIdentifiers(m[1])
  }

  return refs
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
export async function processClientScript(
  scriptContent: string,
  options: ClientScriptOptions = {},
): Promise<string> {
  let code = scriptContent
  let autoImportCode = ''
  let wasBundled = false

  // 0. Bundle user imports via Bun.build (if any detected)
  const { hasUserImports, bundleClientScript } = await import('./client-script-bundler')
  if (hasUserImports(code)) {
    console.log('[stx:bundler] user imports detected, bundling...')
    code = await bundleClientScript(code, options.filePath || '', {
      projectRoot: options.projectRoot,
      minify: options.production,
    })
    wasBundled = true
  }

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

  // 3. Transpile TypeScript to JavaScript (strips type annotations, interfaces, etc.)
  // Skip if Bun.build already handled TS, or if attrs indicate plain JS
  if (!wasBundled && shouldTranspileTypeScript(options.attrs || '')) {
    code = transpileTypeScript(code)
  }

  // 4. Generate event binding code
  const eventCode = generateInlineEventBindings(options.eventBindings || [])

  // 5. Build the output script tag
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

  // 6. Determine wrapping strategy:
  //    - Explicit stx.mount()/stx.mountEl() → don't double-wrap (IIFE)
  //    - SFC __stx_setup_ wrapped → don't double-wrap (IIFE)
  //    - Uses signal APIs → auto-mount (existing behavior)
  //    - Has template-referenced declarations → auto-mount (Phase 2: auto-binding)
  //    - Otherwise → legacy IIFE
  const usesSignals = /\b(state|derived|effect|ref|reactive|computed|watch|watchEffect|useLocalStorage|useSessionStorage|useRef|useEventListener|useFetch|useDebounce|useDebouncedValue|useThrottle|useInterval|useTimeout|useToggle|useCounter|useClickOutside|useFocus|useAsync|useColorMode|useDark|useWebSocket|useRoute|useSearchParams|onMount|onDestroy|batch|untrack|peek)\s*(?:<[^>]*>)?\s*\(/.test(scriptContent)
  const isSfcWrapped = /function __stx_setup_/.test(code)
  const alreadyMounts = /\bstx\.mount\s*\(|\bstx\.mountEl\s*\(/.test(scriptContent)

  // Helper: generate stx.mount() wrapper with auto-extracted return statement
  function wrapInMount(declarations: string[]): string {
    const returnStmt = declarations.length > 0
      ? `\n  return { ${declarations.join(', ')} };`
      : ''

    return `<script data-stx-scoped>
window.stx.mount(function() {
  'use strict';
${autoImportCode}${code}
${eventCode}${returnStmt}
})</script>`
  }

  // Don't double-wrap scripts that already call mount or are SFC-wrapped
  if (!alreadyMounts && !isSfcWrapped) {
    // Scripts using signal APIs → always auto-mount
    if (usesSignals) {
      return wrapInMount(extractTopLevelDeclarations(scriptContent))
    }

    // Phase 2 auto-binding: non-signal scripts with template-referenced declarations
    if (options.templateContent) {
      const declarations = extractTopLevelDeclarations(scriptContent)
      if (declarations.length > 0) {
        const templateRefs = extractTemplateReferences(options.templateContent)
        const hasMatchingBindings = declarations.some(name => templateRefs.has(name))
        if (hasMatchingBindings) {
          return wrapInMount(declarations)
        }
      }
    }
  }

  // Fallback: legacy IIFE (no template bindings, or explicit mount, or SFC-wrapped)
  return `<script data-stx-scoped>
;(function() {
  'use strict';
${autoImportCode}${code}
${eventCode}
})()</script>`
}
