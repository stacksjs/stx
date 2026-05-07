import path from 'node:path'

/**
 * Variable Extraction
 *
 * Extracts and processes variables from <script server> tags in stx templates.
 * Converts ES module syntax to CommonJS for execution in isolated contexts.
 *
 * SUPPORTED:
 *
 * 1. ASYNC/AWAIT
 *    Top-level await is supported in <script server> tags.
 *    Scripts are wrapped in an async IIFE and variables are re-synced after execution.
 *    Example: const res = await fetch('/api/data')
 *
 * 2. EXPORT KEYWORD IS OPTIONAL
 *    Both exported and non-exported variables are made available to templates.
 *
 * KNOWN LIMITATIONS:
 *
 * 1. NO IMPORT STATEMENTS
 *    ES module imports are stripped from <script server> tags.
 *    Data should be fetched via API calls using await fetch().
 *
 * 2. COMPLEX DESTRUCTURING MAY FAIL
 *    Deeply nested destructuring patterns may not parse correctly.
 *    The system creates __destructured_ temporary variables as a workaround.
 *
 * 3. TEMPLATE LITERALS WITH EXPRESSIONS
 *    Complex template literals with nested expressions may not parse correctly.
 */

// Import from tokenizer to avoid circular dependency
import { findMatchingDelimiter } from './parser/tokenizer'
// Import head module so server-side useHead() calls mutate the same currentHead
// instance that document-shell.ts reads from. Using require() inside the
// wrapped useHead would create a separate module instance with its own state.
import { useHead as headUseHead, useSeoMeta as headUseSeoMeta, getHead as headGetHead } from './head'
import { getPublicEnvDefine } from './public-env'
import { safeEvaluate } from './safe-evaluator'

/**
 * Extract declared variable names from converted CommonJS script.
 * Only extracts top-level declarations (brace depth 0).
 * Used to re-sync variables after async operations.
 */
function extractDeclaredVariableNames(script: string): string[] {
  const names: string[] = []
  let depth = 0
  const lines = script.split('\n')

  for (const line of lines) {
    // Track brace depth — count braces outside of strings/comments
    let inString: string | null = null
    let escaped = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (inString) {
        if (ch === inString) inString = null
        continue
      }
      if (ch === '\'' || ch === '"' || ch === '`') { inString = ch; continue }
      // Skip line comments
      if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') break
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }

    // Only match declarations at top level (depth 0)
    if (depth === 0) {
      const match = line.match(/(?:const|let|var)\s+(\w+)\s*=/)
      if (match) {
        names.push(match[1])
      }
      else {
        // Handle destructuring: const { a, b } = ... or const [a, b] = ...
        const destructMatch = line.match(/(?:const|let|var)\s+(\{[^}]+\}|\[[^\]]+\])\s*=/)
        if (destructMatch) {
          const inner = destructMatch[1].slice(1, -1) // Remove { } or [ ]
          const vars = inner.split(',').map(v => {
            // Handle renaming: { original: renamed } -> extract renamed
            const parts = v.split(':')
            return (parts.length > 1 ? parts[1] : parts[0]).trim()
          }).filter(v => /^\w+$/.test(v))
          names.push(...vars)
        }
      }
    }
  }
  return [...new Set(names)] // Remove duplicates
}

/**
 * Result of parsing a variable declaration
 */
interface VariableDeclarationResult {
  type: string
  name: string
  value: string
  nextIndex: number
}

/**
 * Result of parsing a function declaration
 */
interface FunctionDeclarationResult {
  name: string
  functionCode: string
  nextIndex: number
}

/**
 * Strip TypeScript-specific syntax to make it executable as JavaScript
 *
 * @param scriptContent - TypeScript/JavaScript code
 * @returns JavaScript code with TypeScript syntax stripped
 */
export function stripTypeScript(scriptContent: string): string {
  let result = scriptContent

  // Remove import statements (especially from 'stx' which is build-time only)
  result = result.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
  result = result.replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

  // Remove TypeScript interface declarations
  result = result.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\n\}\s*$/gm, '')

  // Remove TypeScript type alias declarations
  result = result.replace(/^\s*type\s+\w+\s*=[\s\S]*?(?=\n(?:const|let|var|function|export|interface|type|$))/gm, '')

  // Remove type annotations from variable declarations
  // e.g., "const foo: Type = value" -> "const foo = value"
  // e.g., "const foo: Type[] = value" -> "const foo = value"
  // e.g., "const { a, b }: Type = value" -> "const { a, b } = value"
  result = result.replace(
    /^(\s*(?:export\s+)?(?:const|let|var)\s+)(\w+|\{[^}]+\}|\[[^\]]+\])\s*:\s*[^=]+(\s*=)/gm,
    '$1$2$3',
  )

  // Remove type annotations from function parameters
  // e.g., "function foo(a: string, b: number)" -> "function foo(a, b)"
  // Handles complex generics like Record<string, any>, Map<K, V> etc.
  // Strategy: use a helper that strips type annotations from a param string,
  // properly handling nested angle brackets in generics.
  function stripParamTypes(params: string): string {
    if (!params.includes(':')) return params
    // Split params respecting angle brackets and nested generics
    const paramParts: string[] = []
    let current = ''
    let angleDepth = 0
    let parenDepth = 0
    let inStr: string | null = null
    for (let i = 0; i < params.length; i++) {
      const c = params[i]
      if (inStr) { current += c; if (c === inStr) inStr = null; continue }
      if (c === '"' || c === '\'' || c === '`') { inStr = c; current += c; continue }
      if (c === '<') angleDepth++
      else if (c === '>' && angleDepth > 0) angleDepth--
      else if (c === '(') parenDepth++
      else if (c === ')') parenDepth--
      if (c === ',' && angleDepth === 0 && parenDepth === 0) {
        paramParts.push(current)
        current = ''
        continue
      }
      current += c
    }
    if (current) paramParts.push(current)
    return paramParts.map((param: string) => {
      const trimmedParam = param.trim()
      // Handle rest params: ...args: string[]
      const isRest = trimmedParam.startsWith('...')
      const paramBody = isRest ? trimmedParam.slice(3) : trimmedParam
      // Split on first colon that's not inside angle brackets
      let colonIdx = -1
      let aDepth = 0
      for (let i = 0; i < paramBody.length; i++) {
        if (paramBody[i] === '<') aDepth++
        else if (paramBody[i] === '>') aDepth--
        else if (paramBody[i] === ':' && aDepth === 0) { colonIdx = i; break }
      }
      if (colonIdx === -1) return param // No type annotation
      const namePartRaw = paramBody.substring(0, colonIdx).trim()
      // Remove optional marker (?)
      const namePart = namePartRaw.replace(/\?$/, '')
      // Check for default value after the type
      // Find = sign after the type annotation (outside angle brackets)
      const afterColon = paramBody.substring(colonIdx + 1)
      let eqIdx = -1
      let eqADepth = 0
      for (let i = 0; i < afterColon.length; i++) {
        if (afterColon[i] === '<') eqADepth++
        else if (afterColon[i] === '>') eqADepth--
        else if (afterColon[i] === '=' && eqADepth === 0) { eqIdx = i; break }
      }
      const prefix = isRest ? '...' : ''
      if (eqIdx !== -1) {
        return `${prefix}${namePart} = ${afterColon.substring(eqIdx + 1).trim()}`
      }
      return `${prefix}${namePart}`
    }).join(', ')
  }

  // Apply to function declarations (match balanced parens)
  result = result.replace(
    /\b(function\s+\w*\s*)\(([^)]*)\)/g,
    (match, prefix, params) => {
      if (!params.includes(':')) return match
      return `${prefix}(${stripParamTypes(params)})`
    },
  )
  // Handle function params with generics (the simple regex [^)]* fails on Record<string, any>)
  // Process functions with complex params using balanced paren matching
  {
    const funcPattern = /\b(function\s+\w*\s*)\(/g
    let funcMatch: RegExpExecArray | null
    const replacements: Array<{ start: number, end: number, replacement: string }> = []
    while ((funcMatch = funcPattern.exec(result)) !== null) {
      const openParen = funcMatch.index + funcMatch[0].length - 1
      let depth = 1, pos = openParen + 1, aDepth = 0, inStr: string | null = null
      while (pos < result.length && depth > 0) {
        const ch = result[pos]
        if (inStr) { if (ch === inStr) inStr = null; pos++; continue }
        if (ch === '"' || ch === '\'' || ch === '`') { inStr = ch; pos++; continue }
        if (ch === '<') aDepth++
        else if (ch === '>' && aDepth > 0) aDepth--
        else if (aDepth === 0) { if (ch === '(') depth++; else if (ch === ')') depth-- }
        if (depth > 0) pos++
      }
      if (depth !== 0) continue
      const params = result.substring(openParen + 1, pos)
      if (!params.includes(':')) continue
      const cleaned = stripParamTypes(params)
      replacements.push({ start: openParen + 1, end: pos, replacement: cleaned })
    }
    // Apply from end to preserve positions
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, replacement } = replacements[i]
      result = result.substring(0, start) + replacement + result.substring(end)
    }
  }

  // Also handle arrow function parameters with type annotations
  // e.g., "(a: string, b: number) =>" -> "(a, b) =>"
  result = result.replace(
    /\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/g,
    (match, params) => {
      // Don't process if no type annotations
      if (!params.includes(':'))
        return match
      // Skip if it looks like an object literal (has { or } inside)
      if (params.includes('{') || params.includes('}'))
        return match
      const cleanedParams = params
        .split(',')
        .map((param: string) => {
          const [nameWithType, ...defaultParts] = param.split('=')
          const name = nameWithType.split(':')[0].trim()
          if (defaultParts.length > 0) {
            return `${name} = ${defaultParts.join('=').trim()}`
          }
          return name
        })
        .join(', ')
      return `(${cleanedParams}) =>`
    },
  )

  // Remove function return type annotations
  // e.g., "function foo(): Type {" -> "function foo() {"
  // Be careful not to match ternary expressions like ") : 0"
  // Only match when followed by type-like identifiers (capitalized or common types)
  result = result.replace(/(\))\s*:\s*([A-Z]\w*|void|string|number|boolean|any|unknown|never|null|undefined)(?:<[^>]+>)?(?:\s*\|\s*(?:[A-Z]\w*|void|string|number|boolean|any|unknown|never|null|undefined))*\s*(\{)/g, '$1$3')

  // Remove generic type parameters (carefully to avoid matching comparison operators)
  // Only match generics in specific contexts:
  // - After function/class names: function foo<T>() or class Foo<T>
  // - After type names like Promise, Array, Map: Promise<T>
  // - After defineProps/withDefaults: defineProps<Props>()
  // Pattern: identifier followed by <Type> where Type contains only valid type characters
  result = result.replace(/(\b(?:function|class|interface|type|extends|implements)\s+\w+)\s*<[^<>()]*>/g, '$1')
  result = result.replace(/(\b(?:defineProps|withDefaults|Array|Promise|Map|Set|Record|Partial|Required|Readonly|Pick|Omit|Exclude|Extract))\s*<[^<>()]*>/g, '$1')
  // Also handle simple generic calls like foo<T>() but only when followed by (
  result = result.replace(/(\w+)\s*<[A-Z][^<>()]*>\s*(?=\()/g, '$1')

  // Remove 'as Type' assertions (including 'as const', 'as any', complex types)
  result = result.replace(/\s+as\s+(?:const|[A-Za-z]\w*(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*)/g, '')

  // Remove 'satisfies Type' expressions (TypeScript 4.9+)
  result = result.replace(/\s+satisfies\s+\w+(?:<[^>]*>)?/g, '')

  // Remove non-null assertion operator (!)
  // Only match ! after identifiers/closings, not !== or !=
  result = result.replace(/(\w|\)|\])\s*!(?!=)/g, '$1')

  // Remove enum declarations (TypeScript-only)
  result = result.replace(/^\s*(?:export\s+)?(?:const\s+)?enum\s+\w+\s*\{[^}]*\}\s*$/gm, '')

  // Remove angle bracket type assertions: <Type>value (legacy syntax)
  // Only at expression boundaries (after = or after ( or at start of expression)
  result = result.replace(/(?<=[\s=,(])<[A-Z]\w*(?:\[\])?>/g, '')

  // Clean up any double spaces or empty lines created
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n')

  return result
}

/**
 * Extract variables from script content and add them to context
 *
 * @param scriptContent - The JavaScript/TypeScript code from a <script> tag
 * @param context - The context object to populate with extracted variables
 * @param filePath - Path to the file (for error messages)
 */
export async function extractVariables(
  scriptContent: string,
  context: Record<string, unknown>,
  filePath: string,
): Promise<void> {
  if (!scriptContent.trim())
    return

  // Strip TypeScript syntax using Bun.Transpiler for full TS support
  let jsContent: string
  try {
    const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser', define: getPublicEnvDefine() })
    // Strip .stx component imports before transpiling
    let processedCode = scriptContent.replace(/^\s*import\s+\w+\s+from\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')
    processedCode = processedCode.replace(/^\s*import\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')
    jsContent = transpiler.transformSync(processedCode)
  }
  catch {
    // Fallback to regex-based stripping if Bun.Transpiler fails
    jsContent = stripTypeScript(scriptContent)
  }

  // Create a safe execution environment
  const module = { exports: {} as Record<string, unknown> }
  const exports = module.exports

  // Pre-load workspace/project packages via import() before script execution.
  // The bundled CLI's require() can't resolve packages from the project's
  // node_modules (different resolution root), so we resolve and load them
  // here, then provide them through a custom require function.
  const projectRoot = process.cwd()
  const preloaded: Record<string, unknown> = {}

  const serverRequires = [...(jsContent.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [])]
    .map(m => m[1])
    .filter(id => !id.startsWith('node:') && !id.startsWith('.')
      && !['fs', 'path', 'os', 'child_process', 'crypto', 'http', 'https', 'url', 'util', 'stream', 'events', 'buffer', 'net', 'querystring', 'zlib', 'tls'].includes(id))

  for (const id of serverRequires) {
    try {
      const pkgDir = path.resolve(projectRoot, 'node_modules', id)
      const pkgJsonPath = path.join(pkgDir, 'package.json')
      const pkgJson = JSON.parse(require('fs').readFileSync(pkgJsonPath, 'utf8'))
      let entry = pkgJson.main || 'index.js'
      if (pkgJson.exports) {
        const exp = typeof pkgJson.exports === 'string' ? pkgJson.exports : pkgJson.exports['.']
        if (typeof exp === 'string') entry = exp
        else if (exp?.bun) entry = exp.bun
        else if (exp?.import) entry = exp.import
        else if (exp?.default) entry = exp.default
      }
      preloaded[id] = await import(path.resolve(pkgDir, entry))
    }
    catch { /* not in project node_modules — CLI require will handle it */ }
  }

  const requireFn = (id: string) => {
    if (preloaded[id]) return preloaded[id]
    return require(id)
  }

  // Provide STX stub functions for component scripts
  // These provide Vue-like defineProps/withDefaults but also support simpler patterns
  const propsObj = (context.props || {}) as Record<string, unknown>

  // Simple $props function for direct access with defaults
  // Usage: const { name = 'default' } = $props
  // Or: const { name } = $props({ name: 'default' })
  // eslint-disable-next-line pickier/no-unused-vars
  const $props = Object.assign(
    (defaults?: Record<string, unknown>) => {
      if (!defaults) return propsObj
      const result: Record<string, unknown> = {}
      for (const [key, defaultValue] of Object.entries(defaults)) {
        const propValue = propsObj[key]
        if (propValue !== undefined) {
          result[key] = propValue
        }
        else if (typeof defaultValue === 'function') {
          result[key] = (defaultValue as () => unknown)()
        }
        else {
          result[key] = defaultValue
        }
      }
      return result
    },
    propsObj, // Spread props as properties for direct destructuring
  )

  // Vue-like defineProps
  const defineProps = () => propsObj

  // Vue-like withDefaults - merge props with defaults
  const withDefaults = (props: Record<string, unknown>, defaults: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...props }
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (result[key] === undefined) {
        if (typeof defaultValue === 'function') {
          // Call factory functions to get default values
          result[key] = (defaultValue as () => unknown)()
        }
        else {
          result[key] = defaultValue
        }
      }
    }
    return result
  }

  // Provide mock signal functions for server-side extraction
  // These allow scripts with signals to be partially executed
  // The actual signal values will be computed client-side

  // Mock state() - returns a getter function that returns the initial value
  const state = (initialValue: unknown) => {
    const getter = () => initialValue
    getter.set = (_v: unknown) => {}
    getter.update = (_fn: (v: unknown) => unknown) => {}
    return getter
  }

  // Mock derived() - returns a getter that executes the derivation once
  const derived = (fn: () => unknown) => {
    let cached: unknown
    let computed = false
    return () => {
      if (!computed) {
        try {
          cached = fn()
          computed = true
        }
catch {
          // Derivation may fail during SSR if it depends on client-only values
          cached = undefined
        }
      }
      return cached
    }
  }

  // Mock effect() - no-op on server
  const effect = (_fn: () => void | (() => void)) => {}

  // Mock batch() - just execute the function
  const batch = (fn: () => void) => fn()

  // Mock onMount() - no-op on server
  const onMount = (_fn: () => void | (() => void)) => {}

  // Mock onDestroy() - no-op on server
  const onDestroy = (_fn: () => void) => {}

  // Mock Vue/Nuxt-like composables commonly used in dashboard pages
  const definePageMeta = (_meta: unknown) => {}
  const useRoute = () => ({ params: {}, query: {}, path: '', name: '', fullPath: '', hash: '', matched: [] })
  const useRouter = () => ({ push: (_to: unknown) => {}, replace: (_to: unknown) => {}, back: () => {}, forward: () => {}, go: (_n: number) => {} })
  // useHead is auto-injected so server scripts can call it without explicitly
  // importing from 'stx'. It mutates module-global currentHead in head.ts,
  // which the document-shell wrapper then merges into the rendered <head>.
  // useHead/useSeoMeta auto-injected for <script server>. We mutate the head
  // module's currentHead AND stash a copy on the context object. Bun's module
  // resolution can return separate instances of head.ts in some configurations
  // (symlinked workspace packages), so the context-bound copy is the reliable
  // path that document-shell.ts in process.ts can read back.
  const useHead = (head: unknown) => {
    headUseHead(head as any)
    const existing = (context.__stx_runtime_head as Record<string, any>) || {}
    const incoming = (head as Record<string, any>) || {}
    context.__stx_runtime_head = {
      ...existing,
      ...(incoming.title && { title: incoming.title }),
      meta: [...(existing.meta || []), ...(incoming.meta || [])],
      link: [...(existing.link || []), ...(incoming.link || [])],
      script: [...(existing.script || []), ...(incoming.script || [])],
      htmlAttrs: { ...(existing.htmlAttrs || {}), ...(incoming.htmlAttrs || {}) },
      bodyAttrs: { ...(existing.bodyAttrs || {}), ...(incoming.bodyAttrs || {}) },
    }
  }
  const useSeoMeta = (meta: unknown) => {
    headUseSeoMeta(meta as any)
    // useSeoMeta builds a meta array internally; read the latest currentHead
    // and snapshot it onto the context. We REPLACE `meta` (not merge) because
    // the underlying module-global already accumulates previous calls —
    // merging again would double every tag that was added before this call.
    const head = headGetHead()
    context.__stx_runtime_head = {
      ...(context.__stx_runtime_head || {}),
      ...(head.title && { title: head.title }),
      meta: head.meta ? [...head.meta] : [],
    }
  }
  const ref = (val: unknown) => ({ value: val })
  const reactive = (obj: unknown) => obj
  const computed = (fn: () => unknown) => ({ value: typeof fn === 'function' ? fn() : fn })
  const watch = (_source: unknown, _cb: unknown) => {}
  const onMounted = (_fn: () => void) => {}
  const onUnmounted = (_fn: () => void) => {}
  const nextTick = (fn?: () => void) => fn ? fn() : Promise.resolve()
  const defineEmits = (_events?: unknown) => (_event: string, ..._args: unknown[]) => {}
  const defineExpose = (_exposed?: unknown) => {}
  const provide = (_key: unknown, _value: unknown) => {}
  const inject = (_key: unknown, defaultValue?: unknown) => defaultValue
  const useColorMode = () => ({ value: 'light' })
  const useDark = () => ({ value: false })

  // Mock window object for browser-only code
  // This allows scripts that reference window to be parsed without errors
  const mockWindow: Record<string, unknown> = {
    // Common properties used in analytics components
    siteId: undefined,
    API_ENDPOINT: '',
    ANALYTICS_SITE_ID: undefined,
    location: {
      href: '',
      pathname: '',
      search: '',
      hash: '',
      origin: '',
      host: '',
      hostname: '',
      protocol: 'https:',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    fetch: globalThis.fetch, // Use real fetch for server-side data fetching
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    alert: () => {},
    confirm: () => false,
    prompt: () => null,
    getComputedStyle: () => ({}),
    matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    // Stub for common global functions
    getDateRangeParams: () => '',
    stx: {},
  }

  // Create a Proxy to handle dynamic property access on window
  const windowProxy = new Proxy(mockWindow, {
    get(target, prop) {
      if (prop in target) return target[prop as string]
      // Return undefined for unknown properties (common pattern)
      return undefined
    },
    set(target, prop, value) {
      target[prop as string] = value
      return true
    },
  })

  // Mock document object
  const mockDocument: Record<string, unknown> = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({}),
    createTextNode: () => ({}),
    body: {},
    head: {},
    documentElement: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }

  // Use real console for server-side scripts so we can see debug output
  const mockConsole = console

  try {
    // Parse and convert the script content
    const convertedScript = convertToCommonJS(jsContent, filePath)

    // Execute with context variables available
    // IMPORTANT: Filter out keys that are also in props to avoid duplicate variable declarations
    // when scripts use defineProps/withDefaults pattern like: const { title } = withDefaults(defineProps(), {...})
    const propsKeys = new Set(Object.keys(propsObj))
    const filteredContextKeys = Object.keys(context).filter(key => !propsKeys.has(key) && key !== 'props')
    const filteredContextValues = filteredContextKeys.map(key => context[key])

    // Expose each prop as a bare identifier (e.g. `car`, `rating`) in the
    // outer scope of the script IIFE — so components can reference props
    // directly without `const { car } = $props()` boilerplate. Skipped for
    // prop names that collide with JS reserved words or built-in globals,
    // and skipped when the script text already declares a same-named const
    // (inner `const` legally shadows an outer param, but our convertToCommonJS
    // pass may reorder declarations, so we play it safe).
    const jsReserved = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
      'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'enum', 'await', 'async', 'module', 'exports', 'require', 'params',
      'window', 'document', 'console', 'state', 'derived', 'effect',
    ])
    const propArgNames: string[] = []
    const propArgValues: unknown[] = []
    for (const [key, value] of Object.entries(propsObj)) {
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) continue // must be a valid JS identifier
      if (jsReserved.has(key)) continue
      // Skip names the script redeclares at the top level (shadowing would work,
      // but convertToCommonJS rewrites may leave them at the same scope).
      const redeclareRegex = new RegExp(`(?:^|[\\s;{])(?:const|let|var|function)\\s+${key}\\b`)
      if (redeclareRegex.test(convertedScript)) continue
      propArgNames.push(key)
      propArgValues.push(value)
    }

    // Extract variable names that need to be re-synced after async operations
    const varNames = extractDeclaredVariableNames(convertedScript)
    const reSyncCode = varNames.map(name => `module.exports.${name} = typeof ${name} !== 'undefined' ? ${name} : module.exports.${name};`).join('\n        ')

    // Ensure `params` is always defined for dynamic route pages — even when
    // the page is pre-built with no request in flight. Without this, any
    // `<script server>` that writes `const id = params?.id ?? ...` throws
    // ReferenceError, which aborts the IIFE and strands every subsequent
    // declaration in the fallback extractor (which can't execute imports
    // or function calls). Callers that know the real params pass them via
    // context; everyone else gets an empty object for safe optional chaining.
    const paramsObj = (context.params as Record<string, unknown> | undefined) ?? {}

    // Build the filtered context arrays while excluding `params` — we inject
    // it explicitly so it's always defined even if not in context.
    const scriptContextKeys: string[] = []
    const scriptContextValues: unknown[] = []
    for (let i = 0; i < filteredContextKeys.length; i++) {
      if (filteredContextKeys[i] === 'params') continue
      scriptContextKeys.push(filteredContextKeys[i])
      scriptContextValues.push(filteredContextValues[i])
    }

    // eslint-disable-next-line no-new-func
    const scriptFn = new Function(
      'module', 'exports', 'require', 'props', '$props', 'defineProps', 'withDefaults',
      'state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy',
      'definePageMeta', 'useRoute', 'useRouter', 'useHead', 'useSeoMeta',
      'ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick',
      'defineEmits', 'defineExpose', 'provide', 'inject', 'useColorMode', 'useDark',
      'window', 'document', 'console', 'confirm', 'alert', 'fetch',
      'params',
      ...propArgNames,
      ...scriptContextKeys,
      // Wrap in async IIFE to support top-level await
      // Re-sync variables at end to capture any async reassignments
      `return (async () => {
        ${convertedScript}
        ${reSyncCode}
        return module.exports
      })()`
    )
    const result = await scriptFn(
      module, exports, requireFn, propsObj, $props, defineProps, withDefaults,
      state, derived, effect, batch, onMount, onDestroy,
      definePageMeta, useRoute, useRouter, useHead, useSeoMeta,
      ref, reactive, computed, watch, onMounted, onUnmounted, nextTick,
      defineEmits, defineExpose, provide, inject, useColorMode, useDark,
      windowProxy, mockDocument, mockConsole, mockWindow.confirm, mockWindow.alert, mockWindow.fetch,
      paramsObj,
      ...propArgValues,
      ...scriptContextValues,
    )

    // Copy results to context
    Object.assign(context, result)

    // Also spread props directly into context for simplest usage
    // This allows: {{ siteName }} (from props) without any ceremony
    // Done AFTER script execution to not conflict with script declarations
    for (const [key, value] of Object.entries(propsObj)) {
      if (!(key in context)) {
        context[key] = value
      }
    }
  }
  catch {
    // Fallback: Try alternative parsing approaches
    try {
      await fallbackVariableExtraction(jsContent, context, filePath)
    }
    catch {
      // Script execution failed — page will render without server variables.
      // This is expected for pages using client-only APIs (reactive(), Chart.js, etc.)
    }
  }
}

/**
 * Convert ES module syntax to CommonJS
 *
 * @param scriptContent - ES module style script content
 * @returns CommonJS compatible script
 */
export function convertToCommonJS(scriptContent: string, filePath?: string): string {
  const templateDir = filePath ? path.dirname(filePath) : process.cwd()
  const lines = scriptContent.split('\n')
  const convertedLines: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Strip TypeScript interface/type declarations (no runtime effect)
    if (line.startsWith('interface ') || line.startsWith('export interface ') || line.startsWith('type ') || line.startsWith('export type ')) {
      // Skip until closing brace (for multi-line interfaces)
      if (line.includes('{') && !line.includes('}')) {
        let braceDepth = 0
        for (; i < lines.length; i++) {
          for (const ch of lines[i]) {
            if (ch === '{') braceDepth++
            else if (ch === '}') braceDepth--
          }
          if (braceDepth <= 0) break
        }
      }
      i++
      continue
    }

    // Strip definePageMeta() calls (metadata only, not runtime).
    // Paren-aware: the old `includes(')')` heuristic broke on nested parens
    // like `validate({ params }) { return getCar(params.id) !== undefined }` —
    // the first `)` in `params)` would end the skip early and leave the
    // closing `})` at the top level, poisoning the rest of the script.
    if (line.startsWith('definePageMeta(')) {
      let depth = 0
      let done = false
      for (let j = i; j < lines.length && !done; j++) {
        let inString: string | null = null
        let escaped = false
        const text = lines[j]
        for (let k = 0; k < text.length; k++) {
          const ch = text[k]
          if (escaped) { escaped = false; continue }
          if (ch === '\\') { escaped = true; continue }
          if (inString) {
            if (ch === inString) inString = null
            continue
          }
          if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue }
          if (ch === '(') depth++
          else if (ch === ')') {
            depth--
            if (depth === 0) { i = j + 1; done = true; break }
          }
        }
      }
      if (!done) i = lines.length
      continue
    }

    // Convert ES import statements to require() with resolved paths
    if (line.startsWith('import ')) {
      const defaultImportMatch = line.match(/^import\s+(\w+)\s+from\s+['"](.+)['"]/)
      const namedImportMatch = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"](.+)['"]/)
      const sideEffectMatch = line.match(/^import\s+['"](.+)['"]/)

      // Resolve relative paths against the template's directory
      const resolveSource = (source: string) => {
        if (source.startsWith('.')) {
          return path.resolve(templateDir, source)
        }
        return source
      }

      if (defaultImportMatch) {
        const [, name, source] = defaultImportMatch
        const resolved = resolveSource(source)
        convertedLines.push(`const ${name} = await import('${resolved}')`)
        convertedLines.push(`module.exports.${name} = ${name};`)
      }
      else if (namedImportMatch) {
        const [, names, source] = namedImportMatch
        const cleanNames = names.trim()
        const resolved = resolveSource(source)
        convertedLines.push(`const { ${cleanNames} } = await import('${resolved}')`)
        for (const n of cleanNames.split(',')) {
          const cleanName = n.trim().split(/\s+as\s+/).pop()?.trim()
          if (cleanName) {
            convertedLines.push(`module.exports.${cleanName} = ${cleanName};`)
          }
        }
      }
      else if (sideEffectMatch) {
        const resolved = resolveSource(sideEffectMatch[1])
        convertedLines.push(`await import('${resolved}')`)
      }
      else {
        convertedLines.push(line)
      }
      i++
      continue
    }

    if (line.startsWith('export const ') || line.startsWith('export let ') || line.startsWith('export var ')) {
      // Handle export variable declarations
      const result = parseVariableDeclaration(lines, i)
      const { type, name, value } = result

      convertedLines.push(`${type} ${name} = ${value};`)
      convertedLines.push(`module.exports.${name} = ${name};`)

      i = result.nextIndex
    }
    else if (line.startsWith('export function ') || line.startsWith('export async function ')) {
      // Handle export function declarations (including async)
      const result = parseFunctionDeclaration(lines, i)

      convertedLines.push(result.functionCode)
      convertedLines.push(`module.exports.${result.name} = ${result.name};`)

      i = result.nextIndex
    }
    else if (line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
      // Handle regular variable declarations (auto-export)
      const result = parseVariableDeclaration(lines, i)
      const { type, name, value } = result

      convertedLines.push(`${type} ${name} = ${value};`)
      convertedLines.push(`module.exports.${name} = ${name};`)

      i = result.nextIndex
    }
    else if (line.startsWith('function ') || line.startsWith('async function ')) {
      // Handle regular and async function declarations (auto-export)
      const result = parseFunctionDeclaration(lines, i)

      convertedLines.push(result.functionCode)
      convertedLines.push(`module.exports.${result.name} = ${result.name};`)

      i = result.nextIndex
    }
    else if (line.startsWith('export default function ') || line.startsWith('export default async function ')) {
      // Handle export default function - strip "export default" prefix before parsing
      const strippedLine = lines[i].replace(/^(\s*)export\s+default\s+/, '$1')
      const tempLines = [...lines]
      tempLines[i] = strippedLine
      const result = parseFunctionDeclaration(tempLines, i)
      convertedLines.push(result.functionCode)
      if (result.name) {
        convertedLines.push(`module.exports.default = ${result.name};`)
      }
      i = result.nextIndex
    }
    else if (line.startsWith('export default ')) {
      // Handle export default value
      const value = line.replace(/^export\s+default\s+/, '').replace(/;$/, '')
      convertedLines.push(`module.exports.default = ${value};`)
      i++
    }
    else if (line.startsWith('class ') || line.startsWith('export class ')) {
      // Handle class declarations (auto-export)
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/)
      if (classMatch) {
        const className = classMatch[1]
        // Collect the full class body by tracking braces
        let classCode = lines[i].replace(/^export\s+/, '')
        let braceDepth = 0
        let j = i
        for (; j < lines.length; j++) {
          const l = lines[j]
          for (const ch of l) {
            if (ch === '{') braceDepth++
            else if (ch === '}') braceDepth--
          }
          if (j > i) classCode += '\n' + l
          if (braceDepth <= 0 && j >= i) break
        }
        convertedLines.push(classCode)
        convertedLines.push(`module.exports.${className} = ${className};`)
        i = j + 1
      }
      else {
        convertedLines.push(line)
        i++
      }
    }
    else if (line.includes('module.exports')) {
      // Keep existing module.exports statements
      convertedLines.push(line)
      i++
    }
    else if (line.trim() && !line.startsWith('//')) {
      // Keep other non-empty, non-comment lines
      convertedLines.push(line)
      i++
    }
    else {
      i++
    }
  }

  return resolveDynamicImports(convertedLines.join('\n'), templateDir)
}

/**
 * Rewrite `await import('./relative')` calls to absolute paths so the
 * bundled stx serve.js resolves them against the template's directory
 * (mirroring what convertToCommonJS already does for static `import`
 * statements at lines 786–826).
 *
 * Why a post-pass: dynamic imports show up in a lot of expression
 * contexts — destructured top-level (`const { x } = await import('./y')`),
 * default top-level (`const m = await import('./y')`), function bodies,
 * chained access like `(await import('./y')).default`, and ternaries.
 * Trying to detect every shape during the line-by-line conversion above
 * leaves gaps; a single string-aware sweep at the end catches them all.
 *
 * Bare specifiers (`'node:fs'`, `'@stacksjs/foo'`), absolute paths, and
 * URLs are passed through unchanged. String/comment boundaries are
 * tracked so a literal `"await import('./foo')"` inside JS source
 * stays untouched.
 */
function resolveDynamicImports(source: string, templateDir: string): string {
  const len = source.length
  let out = ''
  let i = 0
  let inString: string | null = null
  let inLineComment = false
  let inBlockComment = false
  let inTemplateExpr = 0

  while (i < len) {
    const ch = source[i]
    const next = source[i + 1]

    // Comment handling
    if (inLineComment) {
      out += ch
      if (ch === '\n') inLineComment = false
      i++
      continue
    }
    if (inBlockComment) {
      out += ch
      if (ch === '*' && next === '/') { out += next; i += 2; inBlockComment = false; continue }
      i++
      continue
    }
    if (!inString && ch === '/' && next === '/') { inLineComment = true; out += ch; i++; continue }
    if (!inString && ch === '/' && next === '*') { inBlockComment = true; out += ch; i++; continue }

    // String handling
    if (inString) {
      out += ch
      if (ch === '\\') { out += next; i += 2; continue }
      if (ch === inString && inString !== '`') { inString = null; i++; continue }
      if (inString === '`') {
        if (ch === '$' && next === '{') { inTemplateExpr++; out += next; i += 2; continue }
        if (ch === '`') { inString = null; i++; continue }
      }
      i++
      continue
    }
    if (inTemplateExpr > 0) {
      if (ch === '{') inTemplateExpr++
      else if (ch === '}') inTemplateExpr--
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      inString = ch
      out += ch
      i++
      continue
    }

    // Look for `await import(<quote><path><quote>)` at the current position.
    // We require the `await` keyword (rather than just `import(`) to avoid
    // accidentally rewriting an unrelated function call named `import`.
    if (ch === 'a' && source.startsWith('await', i)) {
      const match = matchDynamicImportAt(source, i)
      if (match) {
        const { quote, path: importPath, end } = match
        if (importPath.startsWith('.')) {
          const resolved = path.resolve(templateDir, importPath)
          out += `await import(${quote}${resolved}${quote})`
          i = end
          continue
        }
      }
    }

    out += ch
    i++
  }

  return out
}

/**
 * Match `await<ws>import<ws>(<quote><path><quote>)` starting at position
 * `start`. Returns the parsed quote, path, and end index (the position
 * just past the closing paren) on success, or null on no match.
 */
function matchDynamicImportAt(src: string, start: number): { quote: string, path: string, end: number } | null {
  let pos = start + 'await'.length
  if (pos >= src.length) return null
  // Require whitespace separator (so `awaiting` doesn't match `await`)
  if (!/\s/.test(src[pos])) return null
  while (pos < src.length && /\s/.test(src[pos])) pos++
  if (!src.startsWith('import', pos)) return null
  pos += 'import'.length
  while (pos < src.length && /\s/.test(src[pos])) pos++
  if (src[pos] !== '(') return null
  pos++
  while (pos < src.length && /\s/.test(src[pos])) pos++
  const quote = src[pos]
  if (quote !== '\'' && quote !== '"') return null
  pos++
  const pathStart = pos
  while (pos < src.length && src[pos] !== quote) {
    if (src[pos] === '\\') pos += 2
    else pos++
  }
  if (pos >= src.length) return null
  const importPath = src.slice(pathStart, pos)
  pos++ // closing quote
  while (pos < src.length && /\s/.test(src[pos])) pos++
  if (src[pos] !== ')') return null
  return { quote, path: importPath, end: pos + 1 }
}

/**
 * Extract a destructuring pattern from a string
 */
function extractDestructuringPattern(str: string, startPos: number): { pattern: string, endPos: number } | null {
  const openChar = str[startPos]
  if (openChar !== '{' && openChar !== '[') {
    return null
  }

  const closeChar = openChar === '{' ? '}' : ']'
  const endPos = findMatchingDelimiter(str, openChar, closeChar, startPos)

  if (endPos === -1) {
    return null
  }

  return {
    pattern: str.slice(startPos, endPos + 1),
    endPos: endPos + 1,
  }
}

/**
 * Extract variable names from a destructuring pattern
 * e.g., "{ a, b: c, d: { e } }" -> ["a", "c", "e"]
 */
function extractDestructuredNames(pattern: string): string[] {
  const names: string[] = []

  // Remove outer braces/brackets
  const inner = pattern.slice(1, -1).trim()
  if (!inner)
    return names

  let i = 0
  let depth = 0
  let currentName = ''

  while (i < inner.length) {
    const char = inner[i]

    // Track nesting depth
    if (char === '{' || char === '[') {
      depth++
      if (depth === 1) {
        const nested = extractDestructuringPattern(inner, i)
        if (nested) {
          const nestedNames = extractDestructuredNames(nested.pattern)
          names.push(...nestedNames)
          i = nested.endPos
          currentName = ''
          continue
        }
      }
    }
    else if (char === '}' || char === ']') {
      depth--
    }

    // Skip nested content
    if (depth > 0) {
      i++
      continue
    }

    // Handle comma (end of item)
    if (char === ',') {
      if (currentName.trim()) {
        names.push(currentName.trim())
      }
      currentName = ''
      i++
      continue
    }

    // Handle colon (renaming: `a: b` means bind `b`)
    if (char === ':') {
      currentName = ''
      i++
      continue
    }

    // Handle default values (= something)
    if (char === '=') {
      if (currentName.trim()) {
        names.push(currentName.trim())
      }
      currentName = ''
      // Skip the default value expression
      i++
      while (i < inner.length && inner[i] !== ',' && depth === 0) {
        if (inner[i] === '{' || inner[i] === '[')
          depth++
        else if (inner[i] === '}' || inner[i] === ']')
          depth--
        i++
      }
      continue
    }

    // Accumulate identifier characters
    if (/[\w$]/.test(char)) {
      currentName += char
    }

    i++
  }

  // Don't forget the last name
  if (currentName.trim()) {
    names.push(currentName.trim())
  }

  return names
}

/**
 * Parse variable declarations (including multi-line objects and arrays)
 */
function parseVariableDeclaration(lines: string[], startIndex: number): VariableDeclarationResult {
  const firstLine = lines[startIndex].trim()

  // Extract type and check for simple pattern
  const match = firstLine.match(/^(?:export\s+)?(const|let|var)\s+(\w+)\s*=\s*(.*)$/)

  // Try destructuring pattern if simple doesn't match
  if (!match) {
    const destructuringPrefix = firstLine.match(/^(?:export\s+)?(const|let|var)\s+/)
    if (destructuringPrefix) {
      let afterKeyword = firstLine.slice(destructuringPrefix[0].length)

      // Join lines for multiline destructuring patterns (e.g., const {\n  a,\n  b\n} = ...)
      let joinedEndIndex = startIndex
      if ((afterKeyword.startsWith('{') || afterKeyword.startsWith('[')) && !afterKeyword.includes(afterKeyword.startsWith('{') ? '}' : ']')) {
        const closeChar = afterKeyword.startsWith('{') ? '}' : ']'
        let joined = afterKeyword
        for (let j = startIndex + 1; j < lines.length; j++) {
          joined += ' ' + lines[j].trim()
          joinedEndIndex = j
          if (lines[j].includes(closeChar)) break
        }
        afterKeyword = joined
      }

      const patternResult = extractDestructuringPattern(afterKeyword, 0)
      if (patternResult) {
        const type = destructuringPrefix[1]
        const destructuringPattern = patternResult.pattern

        const afterPattern = afterKeyword.slice(patternResult.endPos).trim()
        if (afterPattern.startsWith('=')) {
          const initialValue = afterPattern.slice(1).trim()
          let value = initialValue
          // Start reading from after the joined destructuring lines
          let currentIndex = Math.max(joinedEndIndex, startIndex)

          if (needsMultilineReading(initialValue)) {
            const result = readMultilineValue(lines, currentIndex, initialValue)
            value = result.value
            currentIndex = result.nextIndex
          }
          else {
            currentIndex = currentIndex + 1
          }

          value = value.trim().replace(/;$/, '')

          const destructuredNames = extractDestructuredNames(destructuringPattern)
          const uniqueName = `__stx_src_${startIndex}`

          const destructuredExports = destructuredNames
            .map(name => `module.exports.${name} = ${name};`)
            .join('\n')

          return {
            type,
            name: uniqueName,
            value: `${value}; ${type} ${destructuringPattern} = ${uniqueName};\n${destructuredExports}`,
            nextIndex: currentIndex,
          }
        }
      }
    }

    throw new Error(`Failed to parse variable declaration: ${firstLine}`)
  }

  const [, type, name, initialValue] = match
  let value = initialValue
  let currentIndex = startIndex

  if (needsMultilineReading(initialValue)) {
    const result = readMultilineValue(lines, startIndex, initialValue)
    value = result.value
    currentIndex = result.nextIndex
  }
  else {
    currentIndex = startIndex + 1
  }

  // Handle method chaining continuation lines (e.g., .map().filter().sort())
  while (currentIndex < lines.length) {
    const nextLine = lines[currentIndex].trim()
    if (nextLine.startsWith('.') || nextLine.startsWith('?.')) {
      value += `\n${lines[currentIndex]}`
      currentIndex++
    }
    else {
      break
    }
  }

  value = value.trim().replace(/;$/, '')

  return {
    type,
    name,
    value,
    nextIndex: currentIndex,
  }
}

/**
 * Parse function declarations (including multi-line functions and async functions)
 */
function parseFunctionDeclaration(lines: string[], startIndex: number): FunctionDeclarationResult {
  const firstLine = lines[startIndex].trim()

  // Match both regular and async function declarations
  const match = firstLine.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
  if (!match) {
    throw new Error(`Failed to parse function declaration: ${firstLine}`)
  }

  const [, name] = match
  let functionCode = firstLine.replace(/^export\s+/, '')
  let currentIndex = startIndex

  if (needsMultilineFunctionReading(firstLine)) {
    const result = readMultilineFunction(lines, startIndex, functionCode)
    functionCode = result.functionCode
    currentIndex = result.nextIndex
  }
  else {
    currentIndex = startIndex + 1
  }

  return {
    name,
    functionCode,
    nextIndex: currentIndex,
  }
}

/**
 * Check if a value needs multi-line reading
 */
function needsMultilineReading(value: string): boolean {
  const trimmed = value.trim()

  if (trimmed.startsWith('{')) {
    const closePos = findMatchingDelimiter(trimmed, '{', '}', 0)
    return closePos === -1
  }

  if (trimmed.startsWith('[')) {
    const closePos = findMatchingDelimiter(trimmed, '[', ']', 0)
    return closePos === -1
  }

  return !isValueComplete(trimmed)
}

/**
 * Check if a value expression is complete (all delimiters balanced)
 */
function isValueComplete(value: string): boolean {
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let inString: string | null = null
  let inTemplateExpr = 0

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const prevChar = i > 0 ? value[i - 1] : ''

    // Handle escape sequences
    if (prevChar === '\\' && inString) {
      continue
    }

    // Handle string entry/exit
    if ((char === '"' || char === '\'') && !inString) {
      inString = char
      continue
    }
    if (char === inString && inString !== '`') {
      inString = null
      continue
    }

    // Handle template string
    if (char === '`' && !inString) {
      inString = '`'
      continue
    }
    if (char === '`' && inString === '`' && inTemplateExpr === 0) {
      inString = null
      continue
    }

    // Handle template expression ${
    if (inString === '`' && char === '$' && value[i + 1] === '{') {
      inTemplateExpr++
      i++ // Skip {
      continue
    }
    if (inTemplateExpr > 0 && char === '{') {
      inTemplateExpr++
      continue
    }
    if (inTemplateExpr > 0 && char === '}') {
      inTemplateExpr--
      continue
    }

    // Skip if in string
    if (inString) {
      continue
    }

    // Track delimiters
    if (char === '(')
      depth.paren++
    else if (char === ')')
      depth.paren--
    else if (char === '[')
      depth.bracket++
    else if (char === ']')
      depth.bracket--
    else if (char === '{')
      depth.brace++
    else if (char === '}')
      depth.brace--
  }

  return depth.paren === 0 && depth.bracket === 0 && depth.brace === 0 && inString === null
}

/**
 * Check if a function needs multi-line reading
 */
function needsMultilineFunctionReading(functionLine: string): boolean {
  const bracePos = functionLine.indexOf('{')
  if (bracePos === -1) {
    return true
  }

  const closePos = findMatchingDelimiter(functionLine, '{', '}', bracePos)
  return closePos === -1
}

/**
 * Read multi-line values (objects, arrays)
 */
function readMultilineValue(lines: string[], startIndex: number, initialValue: string): {
  value: string
  nextIndex: number
} {
  let value = initialValue
  let i = startIndex + 1

  while (i < lines.length && !isValueComplete(value)) {
    const nextLine = lines[i]
    value += `\n${nextLine}`
    i++
  }

  // Continue reading method chaining continuation lines (e.g., .map().filter().sort())
  while (i < lines.length) {
    const nextLine = lines[i].trim()
    if (nextLine.startsWith('.') || nextLine.startsWith('?.')) {
      value += `\n${lines[i]}`
      i++
    }
    else {
      break
    }
  }

  return { value, nextIndex: i }
}

/**
 * Read multi-line functions
 */
function readMultilineFunction(lines: string[], startIndex: number, initialFunction: string): {
  functionCode: string
  nextIndex: number
} {
  let functionCode = initialFunction
  let i = startIndex + 1

  while (i < lines.length) {
    const bracePos = functionCode.indexOf('{')
    if (bracePos !== -1) {
      const closePos = findMatchingDelimiter(functionCode, '{', '}', bracePos)
      if (closePos !== -1) {
        break
      }
    }

    const nextLine = lines[i]
    functionCode += `\n${nextLine}`
    i++
  }

  return { functionCode, nextIndex: i }
}

/**
 * Fallback variable extraction for edge cases
 */
async function fallbackVariableExtraction(
  scriptContent: string,
  context: Record<string, unknown>,
  _filePath: string,
): Promise<void> {
  // Approach 1: Try evaluating individual export statements
  // eslint-disable-next-line regexp/optimal-lookaround-quantifier
  const exportMatches = scriptContent.matchAll(/export\s+(const|let|var)\s+(\w+)\s*=\s*([\s\S]*?)(?=\s*(?:export\s+|$))/g)

  for (const match of exportMatches) {
    const [, , name, value] = match

    try {
      const cleanValue = value.trim().replace(/;$/, '')
      const evaluated = safeEvaluate(cleanValue, context) ?? safeEvaluate(`(${cleanValue})`, context)
      if (evaluated !== undefined)
        context[name] = evaluated
    }
    catch {
      try {
        const cleanValue = value.trim().replace(/;$/, '')
        const evaluated = safeEvaluate(`(${cleanValue})`, context)
        if (evaluated !== undefined)
          context[name] = evaluated
      }
      catch (e2) {
        console.warn(`Failed to parse export ${name} in fallback:`, e2)
      }
    }
  }

  // Approach 2: Try evaluating regular variable declarations
  // eslint-disable-next-line regexp/optimal-lookaround-quantifier
  const varMatches = scriptContent.matchAll(/(?:^|\n)\s*(const|let|var)\s+(\w+)\s*=\s*([\s\S]*?)(?=\s*(?:(?:const|let|var|function|export)\s+|$))/g)

  for (const match of varMatches) {
    const [, , name, value] = match

    if (!(name in context)) {
      try {
        const cleanValue = value.trim().replace(/;$/, '')
        const evaluated = safeEvaluate(cleanValue, context) ?? safeEvaluate(`(${cleanValue})`, context)
        if (evaluated !== undefined)
          context[name] = evaluated
      }
      catch {
        // Ignore individual failures in fallback
      }
    }
  }
}

/**
 * Extract script content from an HTML template
 *
 * @param template - The template string
 * @returns Object with script content and template without script tags
 */
export function extractScriptFromTemplate(template: string): {
  scriptContent: string
  templateWithoutScript: string
} {
  const scriptMatch = template.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  const templateWithoutScript = scriptMatch
    ? template.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')
    : template

  return { scriptContent, templateWithoutScript }
}

/**
 * Check if script content has any variables to extract
 *
 * @param scriptContent - The script content
 * @returns Whether variables are present
 */
export function hasVariables(scriptContent: string): boolean {
  const trimmed = scriptContent.trim()
  if (!trimmed)
    return false

  return /(?:const|let|var|function)\s+\w+/.test(trimmed)
}
