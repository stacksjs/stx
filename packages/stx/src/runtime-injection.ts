/**
 * Runtime Injection Module
 *
 * Handles injecting the signals runtime, browser runtime, and SPA router
 * script into rendered HTML templates.
 *
 * @module runtime-injection
 */

import type { StxOptions } from './types'

/**
 * Inject @stacksjs/browser initialization script into the template.
 * This sets up window.StacksBrowser for auto-imports to work.
 *
 * IMPORTANT: Only checks CLIENT scripts (not <script server>).
 * Server scripts should use the server ORM directly, not browser functions.
 */
export function injectBrowserRuntime(template: string): string {
  // Don't inject if already present
  if (template.includes('window.StacksBrowser') || template.includes('StacksBrowser =')) {
    return template
  }

  // Extract only CLIENT script content (exclude <script server> blocks)
  // Client scripts are: <script>, <script client>, <script type="module">, etc.
  // Server scripts are: <script server>
  // eslint-disable-next-line no-super-linear-backtracking
  const clientScriptRegex = /<script\b(?![^>]*\bserver\b)[^>]*>([\s\S]*?)<\/script>/gi
  let clientCode = ''
  let match: RegExpExecArray | null

  while ((match = clientScriptRegex.exec(template)) !== null) {
    clientCode += match[1] + '\n'
  }

  // Also check template expressions ({{ }}) which execute on client
  const templateExprRegex = /\{\{([\s\S]*?)\}\}/g
  while ((match = templateExprRegex.exec(template)) !== null) {
    clientCode += match[1] + '\n'
  }

  // If no client code, no need for browser runtime
  if (!clientCode.trim()) {
    return template
  }

  // Core browser utilities (framework-provided, not app-specific)
  // Only include symbols that are truly unique to @stacksjs/browser
  // and wouldn't appear in normal application code
  const coreSymbols = [
    'browserQuery', 'BrowserQueryBuilder', 'configureBrowser', 'createBrowserModel',
  ]

  // Check for core browser utilities in CLIENT code only
  const usesCoreSymbols = coreSymbols.some(sym => {
    const regex = new RegExp(`\\b${sym}\\b`)
    return regex.test(clientCode)
  })

  // Check for model usage in CLIENT code only (PascalCase + query methods)
  // Exclude JS built-ins that are PascalCase (Promise.all, Object.keys, Array.from, etc.)
  const jsBuiltins = new Set(['Promise', 'Object', 'Array', 'Map', 'Set', 'Date', 'Error', 'JSON', 'Math', 'Number', 'String', 'RegExp', 'Symbol', 'WeakMap', 'WeakSet', 'Proxy', 'Reflect', 'Intl', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response', 'AbortController', 'EventTarget', 'Element', 'Document', 'Node', 'Window', 'Console', 'Storage', 'Navigator', 'Blob', 'File', 'FileReader', 'HTMLElement', 'SVGElement', 'Event', 'CustomEvent', 'DOMParser', 'XMLSerializer', 'WebSocket', 'Worker', 'SharedWorker', 'IntersectionObserver', 'MutationObserver', 'ResizeObserver', 'PerformanceObserver', 'Notification', 'Bun', 'Buffer', 'Process'])
  const modelPattern = /\b([A-Z][a-zA-Z0-9]*)\s*\.\s*(all|find|first|get|where|orderBy|orderByDesc|limit|select|pluck|create|update|delete)\s*\(/g
  let modelMatch: RegExpExecArray | null
  let usesModels = false
  while ((modelMatch = modelPattern.exec(clientCode)) !== null) {
    if (!jsBuiltins.has(modelMatch[1])) {
      usesModels = true
      break
    }
  }

  if (!usesCoreSymbols && !usesModels) {
    return template
  }

  // Inject a module script that loads @stacksjs/browser
  // The browser module auto-initializes and loads all app models dynamically
  // This must run before component scripts
  const browserScript = `<script type="module">
// STX: Auto-load @stacksjs/browser (auto-initializes API and loads models)
import '@stacksjs/browser'
</script>`

  // Inject before other scripts in <head>, or before </head>
  if (template.includes('</head>')) {
    const headEndPos = template.indexOf('</head>')
    const headSection = template.slice(0, headEndPos)
    const firstScriptPos = headSection.indexOf('<script')

    if (firstScriptPos !== -1) {
      return template.slice(0, firstScriptPos) + browserScript + '\n' + template.slice(firstScriptPos)
    }
    return template.replace('</head>', `${browserScript}\n</head>`)
  }

  if (template.includes('<body')) {
    return template.replace(/<body([^>]*)>/, `<body$1>\n${browserScript}`)
  }

  return browserScript + '\n' + template
}

/**
 * Inject STX signals runtime into the template.
 * The runtime provides client-side reactivity.
 */
export async function injectSignalsRuntime(template: string, options: StxOptions): Promise<string> {
  // Don't inject if actual signals runtime is already present
  // Check for the runtime's unique signature (state, derived, effect assignment),
  // not just any 'window.stx =' which could be scope registration from includes
  if (template.includes('window.stx.state') || template.includes('STX Signals Runtime')) {
    return template
  }

  // Build mode: emit a placeholder reference instead of inlining the full runtime.
  // The production builder will replace this with a fingerprinted <script src> tag.
  if (options.buildMode === 'compile') {
    const runtimeScript = `<script src="/__stx/runtime.__STX_HASH__.js"></script>`
    const firstScriptInDoc = template.indexOf('<script')
    if (firstScriptInDoc !== -1) {
      return template.slice(0, firstScriptInDoc) + runtimeScript + '\n' + template.slice(firstScriptInDoc)
    }
    if (template.includes('</head>')) {
      const idx = template.indexOf('</head>')
      return template.slice(0, idx) + runtimeScript + '\n' + template.slice(idx)
    }
    return runtimeScript + '\n' + template
  }

  // Use cached runtime (identical for every page, never changes during dev session)
  const { getCachedSignalsRuntime } = await import('./caching')
  const runtime = await getCachedSignalsRuntime(options.debug)
  const runtimeScript = `<script data-stx-scoped>${runtime}</script>`

  // Inject before the first <script in the ENTIRE document, not just <head>.
  // Layout scripts (e.g. <script client>) may appear before <head>.
  // Use string concatenation to avoid $ replacement pattern issues in String.replace()
  const firstScriptInDoc = template.indexOf('<script')
  if (firstScriptInDoc !== -1) {
    return template.slice(0, firstScriptInDoc) + runtimeScript + '\n' + template.slice(firstScriptInDoc)
  }

  // Fallback: no scripts in document — use string concat to avoid $ replacement patterns
  if (template.includes('</head>')) {
    const idx = template.indexOf('</head>')
    return template.slice(0, idx) + runtimeScript + '\n' + template.slice(idx)
  }

  if (template.includes('<body')) {
    const idx = template.indexOf('<body')
    const closeIdx = template.indexOf('>', idx)
    return template.slice(0, closeIdx + 1) + '\n' + runtimeScript + template.slice(closeIdx + 1)
  }

  // Prepend to output
  return runtimeScript + '\n' + template
}

/**
 * Inject the SPA router script into the template.
 * The router is provided by the canonical router in packages/router/src/client.ts.
 * It guards against double-initialization so it's safe to inject alongside @stxRouter.
 */
export async function injectRouterScript(template: string, options?: StxOptions): Promise<string> {
  // Only inject into full HTML pages (not template fragments or components)
  if (!template.includes('</body>')) {
    return template
  }

  // Don't inject if already present (check for the router's own guard, not config references)
  if (template.includes('__stxRouter)return') || template.includes('__stxRouter=true')) {
    return template
  }

  // Inject router config from stx.config.ts (replaces manual window.STX_ROUTER_OPTIONS scripts)
  const routerConfig = options?.router
  let configScript = ''
  if (routerConfig) {
    const configObj: Record<string, any> = {}
    if (routerConfig.container) configObj.container = routerConfig.container
    if (routerConfig.viewTransitions !== undefined) configObj.viewTransitions = routerConfig.viewTransitions
    if (routerConfig.viewTransitionDuration !== undefined) configObj.viewTransitionDuration = routerConfig.viewTransitionDuration
    if (routerConfig.viewTransitionEasing !== undefined) configObj.viewTransitionEasing = routerConfig.viewTransitionEasing
    if (routerConfig.scrollToTop !== undefined) configObj.scrollToTop = routerConfig.scrollToTop
    if (routerConfig.prefetch !== undefined) configObj.prefetch = routerConfig.prefetch
    if (routerConfig.cache !== undefined) configObj.cache = routerConfig.cache
    if (routerConfig.progressColor !== undefined) configObj.progressColor = routerConfig.progressColor
    if (routerConfig.progressHeight !== undefined) configObj.progressHeight = routerConfig.progressHeight
    if (Object.keys(configObj).length > 0) {
      configScript = `<script>window.__stxRouterConfig=${JSON.stringify(configObj)};</script>\n`
    }
  }

  // Build mode: emit a placeholder reference instead of inlining the full router script.
  const { getCachedRouterScript } = await import('./caching')
  const routerScript = options?.buildMode === 'compile'
    ? `<script src="/__stx/router.__STX_HASH__.js"></script>`
    : `<script>${await getCachedRouterScript()}</script>`

  // Use string concatenation to avoid $-interpretation in .replace()
  const bodyCloseIdx = template.lastIndexOf('</body>')
  return template.slice(0, bodyCloseIdx) + configScript + routerScript + '\n</body>' + template.slice(bodyCloseIdx + 7)
}
