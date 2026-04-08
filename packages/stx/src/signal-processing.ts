/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Signal Processing Module
 *
 * Handles detection, conversion, and setup of STX signals in templates.
 * Converts directive-style syntax (@if, @for) to attribute-style for the
 * client-side signals runtime, and wraps signal scripts in setup functions.
 *
 * @module signal-processing
 */

import type { StxOptions } from './types'
import { transformStoreImports } from './store-imports'
import { shouldTranspileTypeScript, transpileTypeScript } from './utils'
import { injectSignalsRuntime, injectBrowserRuntime } from './runtime-injection'

// Counter for unique signal setup function names (avoids Date.now() collisions)
let signalSetupCounter = 0

/**
 * Check if template uses STX signals syntax.
 *
 * STX directives work seamlessly on both server and client:
 * - `@if`, `@else` - Conditional rendering
 * - `@for` - List iteration
 * - `@show` - Toggle visibility (keeps element in DOM)
 * - `@model` - Two-way binding
 * - `@bind:attr` - Dynamic attribute binding
 * - `@class`, `@style` - Dynamic class/style binding
 * - `@click`, `@submit` - Event handling
 * - Scripts containing `state(`, `derived(`, `effect(` - Signal APIs
 *
 * Server-side directives are processed at build time.
 * Remaining directives with reactive values are handled by the client runtime.
 */
export function hasSignalsSyntax(template: string): boolean {
  // Check for STX reactive syntax that needs client runtime
  const signalsPatterns = [
    /@if\s*=/, // @if="condition"
    /@for\s*=/, // @for="item in items"
    /@show\s*=/, // @show="visible"
    /@model\s*=/, // @model="value"
    /@bind:/, // @bind:attr="value"
    /@class\s*=/, // @class="{ active: isActive }"
    /@style\s*=/, // @style="{ color: textColor }"
    /\bx-data\s*=/, // x-data="{ ... }" Alpine-style (reactive bridge needs signals runtime)
    /\bstate\s*(?:<[^>]*>)?\s*\(/, // state() signal API
    /\bderived\s*(?:<[^>]*>)?\s*\(/, // derived() signal API
    /\beffect\s*(?:<[^>]*>)?\s*\(/, // effect() signal API
    /\bref\s*(?:<[^>]*>)?\s*\(/, // ref() Vue-compat alias
    /\bcomputed\s*(?:<[^>]*>)?\s*\(/, // computed() Vue-compat alias
    /\breactive\s*(?:<[^>]*>)?\s*\(/, // reactive() Vue-compat alias
    /\bwatch\s*(?:<[^>]*>)?\s*\(/, // watch() Vue-compat alias
    /\bwatchEffect\s*(?:<[^>]*>)?\s*\(/, // watchEffect() Vue-compat alias
    /data-stx(?:-auto)?(?![-\w])/, // data-stx or data-stx-auto (not data-stx-ref, data-stx-id, etc.)
    /data-stx-scoped/, // client scripts need the signals runtime
  ]

  return signalsPatterns.some(pattern => pattern.test(template))
}

/**
 * Convert @if(expr)...@endif directive blocks to attribute-style for signal templates.
 *
 * This allows the signals runtime to handle reactive conditionals instead of
 * evaluating them at build time with mock values.
 *
 * Converts:
 *   @if(loading())
 *     <div>Loading...</div>
 *   @endif
 *
 * To:
 *   <template @if="loading()">
 *     <div>Loading...</div>
 *   </template>
 *
 * Note: Uses <template> wrapper for blocks with multiple children or text nodes.
 */
export function convertSignalDirectivesToAttributes(template: string): string {
  let output = template

  // Pattern to match @if(expr)...@endif blocks (handles nested parens in expr)
  // We use a simpler approach: find @if( and then parse balanced parens
  const ifDirectiveStart = /@if\s*\(/g
  let match: RegExpExecArray | null
  const replacements: Array<{ start: number, end: number, replacement: string }> = []

  while ((match = ifDirectiveStart.exec(output)) !== null) {
    const startIdx = match.index
    const exprStart = startIdx + match[0].length

    // Find balanced closing paren for the condition
    let depth = 1
    let i = exprStart
    while (i < output.length && depth > 0) {
      if (output[i] === '(') depth++
      else if (output[i] === ')') depth--
      i++
    }

    if (depth !== 0) continue // Unbalanced parens, skip

    const condition = output.substring(exprStart, i - 1).trim()
    const afterCondition = i

    // Find the matching @endif (handle nested @if)
    let ifDepth = 1
    let endIdx = afterCondition
    const endifRegex = /@(if\s*\(|endif)/g
    endifRegex.lastIndex = afterCondition

    let endMatch: RegExpExecArray | null
    while ((endMatch = endifRegex.exec(output)) !== null) {
      if (endMatch[1].startsWith('if')) {
        ifDepth++
      }
      else if (endMatch[1] === 'endif') {
        ifDepth--
        if (ifDepth === 0) {
          endIdx = endMatch.index + endMatch[0].length
          break
        }
      }
    }

    if (ifDepth !== 0) continue // No matching @endif, skip

    // Extract content between ) and @endif
    const content = output.substring(afterCondition, endIdx - '@endif'.length).trim()

    // Check if content is a single element or needs wrapper
    // Handle > in attribute values by matching quoted attrs properly
    const singleElementMatch = content.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b((?:\s+[^=\s>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*)>([\s\S]*)<\/\1>$/s)

    let replacement: string
    if (singleElementMatch) {
      // Single root element - add @if attribute directly
      const [, tag, attrs, innerContent] = singleElementMatch
      // Escape double quotes in condition to avoid breaking the attribute
      const escapedCondition = condition.replace(/"/g, '&quot;')
      replacement = `<${tag}${attrs} @if="${escapedCondition}">${innerContent}</${tag}>`
    }
    else {
      // Multiple elements or text - wrap in template
      const escapedCondition = condition.replace(/"/g, '&quot;')
      replacement = `<template @if="${escapedCondition}">${content}</template>`
    }

    replacements.push({ start: startIdx, end: endIdx, replacement })
  }

  // Apply replacements from end to start to preserve indices
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    output = output.substring(0, start) + replacement + output.substring(end)
  }

  return output
}

/**
 * Convert @for(item in items())...@endfor directive blocks to attribute-style.
 *
 * Converts:
 *   @for(item in items())
 *     <div>{{ item.name }}</div>
 *   @endfor
 *
 * To:
 *   <template @for="item in items()">
 *     <div>{{ item.name }}</div>
 *   </template>
 */
export function convertSignalLoopsToAttributes(template: string, context?: Record<string, any>): string {
  let output = template

  // Pattern to match @for(expr)...@endfor or @foreach(expr)...@endforeach
  const forDirectiveStart = /@(for|foreach)\s*\(/g
  let match: RegExpExecArray | null
  const replacements: Array<{ start: number, end: number, replacement: string }> = []

  while ((match = forDirectiveStart.exec(output)) !== null) {
    const directive = match[1] // 'for' or 'foreach'
    const startIdx = match.index
    const exprStart = startIdx + match[0].length

    // Find balanced closing paren
    let depth = 1
    let i = exprStart
    while (i < output.length && depth > 0) {
      if (output[i] === '(') depth++
      else if (output[i] === ')') depth--
      i++
    }

    if (depth !== 0) continue

    let expr = output.substring(exprStart, i - 1).trim()
    const afterExpr = i

    // Check if the iterable comes from server context — if so, leave it for
    // server-side processLoops() instead of converting to a client-side @for attribute.
    // "list as item" → iterable is "list"; "item in list" → iterable is "list"
    const asMatch = expr.match(/^(.+?)\s+as\s+(\w+(?:\s*,\s*\w+)?)\s*$/)
    const inMatch = !asMatch ? expr.match(/^\w+(?:\s*,\s*\w+)?\s+(?:in|of)\s+(.+)$/) : null
    const iterableExpr = asMatch ? asMatch[1].trim() : (inMatch ? inMatch[1].trim() : null)
    if (iterableExpr && context) {
      // Extract the root variable name (e.g. "items" from "items" or "obj.items")
      const rootVar = iterableExpr.split(/[.[]/)[0]
      if (rootVar && rootVar in context) {
        // This iterable is server-side data — skip conversion, let processLoops handle it
        continue
      }
    }

    // Convert "list as item" (Blade-style) to "item in list" (JS-style) for bindFor
    if (asMatch) {
      expr = `${asMatch[2]} in ${asMatch[1]}`
    }

    // Find matching @endfor or @endforeach
    const endTag = directive === 'for' ? '@endfor' : '@endforeach'
    let forDepth = 1
    let endIdx = afterExpr
    const endRegex = directive === 'for'
      ? new RegExp(`@(for(?!each)\\s*\\(|endfor(?!each))`, 'g')
      : new RegExp(`@(${directive}\\s*\\(|end${directive})`, 'g')
    endRegex.lastIndex = afterExpr

    let endMatch: RegExpExecArray | null
    while ((endMatch = endRegex.exec(output)) !== null) {
      if (endMatch[1].startsWith(directive)) {
        forDepth++
      }
      else {
        forDepth--
        if (forDepth === 0) {
          endIdx = endMatch.index + endMatch[0].length
          break
        }
      }
    }

    if (forDepth !== 0) continue

    const content = output.substring(afterExpr, endIdx - endTag.length).trim()

    // Check for single root element
    // Handle > in attribute values by matching quoted attrs properly
    const singleElementMatch = content.match(/^<([a-zA-Z][a-zA-Z0-9-]*)\b((?:\s+[^=\s>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*)>([\s\S]*)<\/\1>$/s)

    let replacement: string
    if (singleElementMatch) {
      const [, tag, attrs, innerContent] = singleElementMatch
      replacement = `<${tag}${attrs} @for="${expr}">${innerContent}</${tag}>`
    }
    else {
      replacement = `<template @for="${expr}">${content}</template>`
    }

    replacements.push({ start: startIdx, end: endIdx, replacement })
  }

  // Apply replacements from end to start
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    output = output.substring(0, start) + replacement + output.substring(end)
  }

  return output
}

/**
 * Process scripts that use STX signal APIs.
 *
 * Automatically detects scripts using state(), derived(), effect() and
 * transforms them into setup functions for the signals runtime.
 *
 * ```html
 * <script>
 *   const count = state(0)
 *   const doubled = derived(() => count() * 2)
 * </script>
 * ```
 */
export async function processScriptSetup(template: string, filePath?: string): Promise<{ output: string, setupCode: string | null }> {
  // Find client-side scripts (not server, not src, not type=module for external, not already scoped)
  // Scripts with data-stx-scoped are already wrapped by component processing
  // Capture attributes to check for TypeScript
  const scriptRegex = /<script\b(?![^>]*\bserver\b)(?![^>]*\bsrc\s*=)(?![^>]*\bdata-stx-scoped\b)(?![^>]*\bdata-stx-router\b)([^>]*)>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  let signalScript: { fullMatch: string, attrs: string, content: string } | null = null

  while ((match = scriptRegex.exec(template)) !== null) {
    const attrs = match[1]
    let content = match[2]

    // Transpile TypeScript if needed
    if (shouldTranspileTypeScript(attrs)) {
      content = transpileTypeScript(content)
    }

    // Check if this script uses signal APIs
    if (/\b(?:state|derived|effect|ref|reactive|computed|watch|watchEffect)\s*(?:<[^>]*>)?\s*\(/.test(content)) {
      signalScript = { fullMatch: match[0], attrs, content }
      break
    }
  }

  if (!signalScript) {
    return { output: template, setupCode: null }
  }

  const setupFnName = `__stx_setup_${Date.now()}_${signalSetupCounter++}`

  // Bundle user imports before wrapping (import statements can't be inside functions)
  let scriptContent = signalScript.content
  const { hasUserImports, bundleClientScript } = await import('./client-script-bundler')
  if (hasUserImports(scriptContent)) {
    console.log('[stx:bundler] bundling signal script imports')
    scriptContent = await bundleClientScript(scriptContent, filePath || '', {
      projectRoot: process.cwd(),
    })
  }

  // Transform store imports before wrapping in function
  const resolvedContent = transformStoreImports(scriptContent)

  // Generate the setup function that provides signal APIs
  // Mark with data-stx-scoped so the client script processing loop skips it
  const setupCode = `
<script data-stx-scoped>
function ${setupFnName}() {
  const { state, derived, effect, batch, onMount, onDestroy, defineStore, useStore, useFetch, useRef, useQuery, useMutation, useDebounce, useDebouncedValue, useThrottle, useInterval, useTimeout, useToggle, useCounter, useClickOutside, useFocus, useAsync, useLocalStorage, useEventListener, useWebSocket, useColorMode, useDark, useHead, useSeoMeta, useRoute, useSearchParams, navigate, goBack, goForward, provide, ref, reactive, computed, watch, watchEffect } = window.stx;
${resolvedContent}
  return { ${extractExports(resolvedContent)} };
}
if(window.stx)window.stx._latestSetup=${setupFnName};
</script>`

  // Remove the original script and add data-stx attribute to the root element
  // Use split/join to replace ALL occurrences, not just the first
  let output = template.split(signalScript.fullMatch).join('')

  // Try to add data-stx to body or first content element
  if (output.includes('<body')) {
    output = output.replace(/<body([^>]*)>/, `<body$1 data-stx="${setupFnName}">`)
  }
  else {
    // Find the first non-meta element and add data-stx
    const skipTags = ['script', 'style', 'html', 'head', 'meta', 'link', 'title', '!doctype']
    output = output.replace(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/i, (match, tag, attrs) => {
      if (skipTags.includes(tag.toLowerCase())) {
        return match
      }
      return `<${tag}${attrs} data-stx="${setupFnName}">`
    })
  }

  return { output, setupCode }
}

/**
 * Extract exported variable names from setup script.
 * Returns variables that should be exposed to the template.
 * Only extracts TOP-LEVEL declarations, not variables inside nested functions.
 */
export function extractExports(setupContent: string): string {
  const code = setupContent
  const names: string[] = []
  const seen = new Set<string>()

  // Track brace depth to only capture top-level declarations
  let depth = 0
  let i = 0
  const len = code.length

  // Skip string literals
  const skipString = (quote: string): void => {
    i++ // Skip opening quote
    while (i < len) {
      if (code[i] === '\\') {
        i += 2 // Skip escaped character
        continue
      }
      if (code[i] === quote) {
        i++ // Skip closing quote
        return
      }
      i++
    }
  }

  // Skip template literals with nested expressions
  const skipTemplateLiteral = (): void => {
    i++ // Skip opening backtick
    while (i < len) {
      if (code[i] === '\\') {
        i += 2
        continue
      }
      if (code[i] === '`') {
        i++
        return
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        i += 2
        let templateDepth = 1
        while (i < len && templateDepth > 0) {
          if (code[i] === '{') templateDepth++
          else if (code[i] === '}') templateDepth--
          else if (code[i] === '\'' || code[i] === '"') skipString(code[i])
          else if (code[i] === '`') skipTemplateLiteral()
          else i++
        }
        continue
      }
      i++
    }
  }

  // Skip comments
  const skipComment = (): boolean => {
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < len && code[i] !== '\n') i++
      return true
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      return true
    }
    return false
  }

  // Check for variable/function declaration at current position (only at depth 0)
  const checkDeclaration = (): void => {
    if (depth !== 0) return

    // Check for const/let/var declarations
    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (declMatch) {
      const varName = declMatch[2]
      if (!seen.has(varName)) {
        names.push(varName)
        seen.add(varName)
      }
      return
    }

    // Check for function declarations
    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
      return
    }

    // Check for async function declarations
    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
    }
  }

  while (i < len) {
    // Skip comments
    if (skipComment()) continue

    // Skip string literals
    if (code[i] === '\'' || code[i] === '"') {
      skipString(code[i])
      continue
    }

    // Skip template literals
    if (code[i] === '`') {
      skipTemplateLiteral()
      continue
    }

    // Track brace depth
    if (code[i] === '{') {
      depth++
      i++
      continue
    }
    if (code[i] === '}') {
      depth--
      i++
      continue
    }

    // Check for declarations at word boundaries (only at depth 0)
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }

    i++
  }

  return names.join(', ')
}

/**
 * Main orchestrator for signal processing.
 *
 * Detects signal syntax, wraps scripts in setup functions,
 * injects the signals runtime and browser runtime.
 */
export async function processSignals(template: string, options: StxOptions, filePath?: string): Promise<string> {
  if (!hasSignalsSyntax(template)) {
    return template
  }

  let output = template

  // Skip full processing for nested components - they just keep their scripts
  // The parent template will inject the runtime once
  if (options.skipSignalsRuntime) {
    return output
  }

  // Process <script setup> blocks
  const { output: processedOutput, setupCode } = await processScriptSetup(output, filePath)
  output = processedOutput

  // Inject the signals runtime
  output = await injectSignalsRuntime(output, options)

  // Inject browser runtime if needed (for auto-imports from @stacksjs/browser)
  output = injectBrowserRuntime(output)

  // Inject setup code after runtime
  if (setupCode) {
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${setupCode}\n</head>`)
    }
    else if (output.includes('<body')) {
      output = output.replace(/<body([^>]*)>/, `<body$1>\n${setupCode}`)
    }
    else {
      output = output + '\n' + setupCode
    }
  }

  // If no setup code but has signals syntax, add data-stx-auto to body for auto-processing
  // Check if body already has data-stx attribute (not just any occurrence in the template)
  const bodyMatch = output.match(/<body([^>]*)>/i)
  const bodyHasDataStx = bodyMatch && /data-stx/.test(bodyMatch[1])

  if (!setupCode && !bodyHasDataStx) {
    if (output.includes('<body') && bodyMatch && !/data-stx-auto/.test(bodyMatch[1])) {
      output = output.replace(/<body([^>]*)>/, '<body$1 data-stx-auto>')
    }
  }

  return output
}
