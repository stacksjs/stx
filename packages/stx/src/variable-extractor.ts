import path from 'node:path'
import process from 'node:process'
import { getSharedTranspiler } from './utils'

/**
 * The runtime bindings the engine hands a `<script server>` block as function
 * parameters, in the order the parameters are declared.
 *
 * This drives the `new Function` parameter list rather than sitting beside it,
 * because the two must not drift: the value list below it is positional, so a
 * name added in one place and not the other silently rebinds every argument
 * after it.
 *
 * It is also the set a `from 'stx'` import must not redeclare. A server script
 * writing the documented `import { defineProps } from 'stx'` was rewritten to
 * `const { defineProps } = await import('stx')`, and that `const` shadows the
 * parameter of the same name. The package's own `defineProps` reads
 * `globalThis.__STX_CURRENT_PROPS__`, which nothing on the server path ever
 * sets — so props came back `{}` and every component rendered empty.
 *
 * It went unnoticed because `stx` does not resolve inside this repo (the
 * published package is `@stacksjs/stx`; the root `stx` is private), so the
 * generated `await import('stx')` rejected and the shadowing binding was never
 * created. The failure needed a real install to appear.
 */
export const STX_ENGINE_BINDING_NAMES = [
  'module', 'exports', 'require', 'props', '$props', 'defineProps', 'withDefaults',
  'defineClientPayload',
  'state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy',
  'definePageMeta', 'useRoute', 'useRouter', 'useHead', 'useSeoMeta',
  // Deciding the response. Engine bindings rather than per-host context keys
  // because four hosts run server scripts and three of them had forgotten:
  // `setResponseStatus(404)` threw a ReferenceError *inside the script's own
  // IIFE*, taking every other binding in the file down with it, so the page
  // rendered its empty branch and read as a correct answer. A host that wants
  // the calls routed somewhere of its own still overrides them through the
  // context, which is appended after these. See page-response.ts.
  'setResponseStatus', 'setResponseHeader', 'notFound',
  'ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick',
  'defineEmits', 'defineExpose', 'defineSlots', 'provide', 'inject', 'useColorMode', 'useDark',
  'useMediaQuery', 'useScrollLock', 'usePreferredDark', 'usePreferredLight', 'usePreferredReducedMotion', 'usePreferredContrast',
  'window', 'document', 'console', 'confirm', 'alert', 'fetch',
  'params',
] as const

const ENGINE_BINDINGS = new Set<string>(STX_ENGINE_BINDING_NAMES)

/**
 * Engine bindings a context value must never be allowed to shadow.
 *
 * Context keys are appended to the script's parameter list AFTER the engine
 * bindings, so a context value of the same name wins. For most of the engine
 * set that is tolerable and occasionally wanted — `state` is a plausible name
 * for a US state, and a page that puts one in context should keep it.
 *
 * These three are different: they are bound per component, so an inherited one
 * is not merely a different value but the WRONG component's. A child whose
 * `defineProps` came from its parent reads the parent's props and finds none of
 * its own, so it renders every default and looks like it was passed nothing
 * (#1937). `props` was already excluded on exactly this reasoning; the other
 * two are the same binding under different names and were simply missed.
 *
 * Deliberately not the whole of `ENGINE_BINDINGS` — that would silently claim
 * every one of those names away from application code.
 */
const CONTEXT_RESERVED_BINDINGS = new Set(['props', '$props', 'defineProps'])

/**
 * Specifiers that mean "the stx runtime" — the module whose exports the engine
 * already injects.
 *
 * `@stacksjs/browser` is deliberately absent. Some of its composables are
 * injected too, but it is a real package a script may legitimately import for
 * exports the engine does not provide, and client-script.ts documents why it
 * is not treated as interchangeable with the runtime.
 */
const STX_RUNTIME_SPECIFIERS = new Set(['stx', '@stacksjs/stx'])

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
import { mergeHeadConfigs, seoMetaToHeadConfig } from './head'
import { getPublicEnvDefine } from './public-env'
import { safeEvaluate } from './safe-evaluator'
import { responseBindings } from './page-response'
import { contentKey, renderMemo } from './render-memo'

/**
 * Transpiled server scripts by source and public env. Only the EXECUTION of a
 * server script depends on the props; transpiling it was done per render (#1945).
 */
const transpiledServerScripts = renderMemo<string>(128)

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
    // A declaration is top-level if it STARTS at brace depth 0 — capture that
    // before the line's own braces move `depth`. Gating on the post-line depth
    // (as this did originally) silently dropped any top-level declaration whose
    // initializer opens a brace that only closes on a later line, e.g.
    //   const xs = items.map((x) => {  …  })
    //   const obj = {
    //     …
    //   }
    // leaving the variable absent from the render context — the page then
    // blanks with no error because the template references an undefined name.
    const depthAtLineStart = depth

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

    // Only match declarations that start at top level (depth 0)
    if (depthAtLineStart === 0) {
      const match = line.match(/(?:const|let|var)\s+(\w+)\s*=/)
      if (match) {
        names.push(match[1])
      }
      // Declaration without an initializer (e.g. hoisted `var row;`). Capture
      // the name so the final reSync still exports its value if it is assigned
      // later in the script.
      else if (/^\s*(?:const|let|var)\s+\w+\s*;?\s*$/.test(line)) {
        const declOnly = line.match(/(?:const|let|var)\s+(\w+)/)
        if (declOnly)
          names.push(declOnly[1])
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
  result = result.replace(/(\b(?:defineProps|withDefaults|defineEmits|defineSlots|Array|Promise|Map|Set|Record|Partial|Required|Readonly|Pick|Omit|Exclude|Extract))\s*<[^<>()]*>/g, '$1')
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
 * Whether a script failure was a module that could not be found.
 *
 * Matched on the message because the failure arrives as a plain Error from the
 * runtime's loader rather than a typed one, and the wording differs between
 * Bun and Node.
 */
export function isModuleResolutionFailure(message: string): boolean {
  return /cannot find module|could not resolve|module not found|failed to resolve/i.test(message)
}

/**
 * Whether a script failed because it named something that does not exist.
 *
 * The same category as a module that will not resolve, and worth the same
 * unconditional warning for the same reason: it is never the legitimate case
 * the silence exists for. A page that uses only client APIs fails here on
 * `document` or `window`, which is expected and quiet - but those are the
 * *only* names it fails on, and a script that trips over anything else has a
 * bug in it.
 *
 * A missing binding is particularly cruel because optional chaining does not
 * help. `foo?.bar` guards an undefined *property*; an undefined *identifier* is
 * a ReferenceError before the chain is reached, so a script that carefully
 * writes `someContext?.value` still throws and still takes every variable in
 * the file down with it. A page then renders its empty-state branch and reads
 * as a correct answer rather than as a failure, which is exactly the shape that
 * is expensive to find.
 */
export function isMissingBindingFailure(message: string): boolean {
  if (!/is not defined|can't find variable/i.test(message))
    return false

  // The genuinely legitimate ones: a server script reaching for a browser
  // global is the case the quiet fallback is for.
  return !/\b(document|window|navigator|localStorage|sessionStorage|self)\b/.test(message)
}

/**
 * Extract variables from script content and add them to context
 *
 * @param scriptContent - The JavaScript/TypeScript code from a <script> tag
 * @param context - The context object to populate with extracted variables
 * @param filePath - Path to the file (for error messages)
 */
export interface ExtractVariablesOptions {
  /**
   * Don't overwrite a context key that already has a value. Use this
   * when extracting from a LAYOUT or PARTIAL `<script server>` so the
   * child page's identifier wins — layouts can declare stubs/defaults
   * (`const user = { avatarInitials: 'JD' }`) without clobbering the
   * full object the page set on the same name.
   *
   * Off by default: page-level extraction (in render.ts) still
   * overrides caller-supplied context values, matching pre-flag
   * behaviour. Only the layout/partial extraction path in process.ts
   * passes this flag on.
   */
  preserveExisting?: boolean
}

export async function extractVariables(
  scriptContent: string,
  context: Record<string, unknown>,
  filePath: string,
  options: ExtractVariablesOptions = {},
): Promise<void> {
  if (!scriptContent.trim())
    return

  // Strip TypeScript syntax using Bun.Transpiler for full TS support. The
  // public env is part of the key because it is compiled in as defines.
  const define = getPublicEnvDefine()
  const transpileKey = contentKey(scriptContent, JSON.stringify(define))
  let jsContent = transpiledServerScripts.get(transpileKey)
  if (jsContent === undefined) {
    try {
      const transpiler = getSharedTranspiler({ loader: 'ts', target: 'browser', define })
      // Strip .stx component imports before transpiling
      let processedCode = scriptContent.replace(/^\s*import\s+\w+\s+from\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')
      processedCode = processedCode.replace(/^\s*import\s+['"][^'"]*\.stx['"]\s*;?\s*$/gm, '')
      jsContent = transpiler.transformSync(processedCode)
    }
    catch {
      // Fallback to regex-based stripping if Bun.Transpiler fails
      jsContent = stripTypeScript(scriptContent)
    }
    transpiledServerScripts.set(transpileKey, jsContent)
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
    .filter(id => !id.startsWith('node:')
      && !['fs', 'path', 'os', 'child_process', 'crypto', 'http', 'https', 'url', 'util', 'stream', 'events', 'buffer', 'net', 'querystring', 'zlib', 'tls'].includes(id))

  // A relative specifier means "next to this template", which is the one thing
  // the bundled runtime's own `require` cannot know: it resolves against stx's
  // module, so `require('../lib/analyze.ts')` in a page looked for a file
  // inside stx and quietly handed back an object with every export undefined.
  // Nothing threw, so the page rendered with every value blank — a whole UI of
  // empty stat cards and no error anywhere (pantry's inspector shipped like
  // that). Resolve them against the template instead, and record the failures
  // so `requireFn` can throw a specifier the author can act on.
  const unresolvable = new Map<string, string>()

  for (const id of serverRequires) {
    try {
      if (id.startsWith('.')) {
        preloaded[id] = await import(path.resolve(path.dirname(filePath), id))
        continue
      }

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
    catch (error) {
      // Bare specifiers fall through to the runtime's own require, which can
      // still find them (builtins, packages hoisted above the project). A
      // relative one has nowhere else to look, so remember why it failed.
      if (id.startsWith('.'))
        unresolvable.set(id, error instanceof Error ? error.message : String(error))
    }
  }

  const requireFn = (id: string) => {
    if (preloaded[id]) return preloaded[id]
    const reason = unresolvable.get(id)
    if (reason !== undefined) {
      throw new Error(
        `Cannot require '${id}' from ${filePath}: ${reason}`,
      )
    }
    return require(id)
  }

  // Provide STX stub functions for component scripts
  // These provide Vue-like defineProps/withDefaults but also support simpler patterns
  const propsObj = (context.props || {}) as Record<string, unknown>

  // Simple $props function for direct access with defaults
  // Usage: const { name = 'default' } = $props
  // Or: const { name } = $props({ name: 'default' })
  // eslint-disable-next-line pickier/no-unused-vars
  const $props = (defaults?: Record<string, unknown>) => {
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
  }
  // Spread props as properties for direct destructuring. Object.assign would
  // throw on props named after readonly function properties (`name`,
  // `length`), so define them instead — those are configurable, which is all
  // defineProperty needs to override them.
  for (const [key, value] of Object.entries(propsObj)) {
    Object.defineProperty($props, key, { value, enumerable: true, configurable: true, writable: true })
  }

  // `$props` is a callable, so any prop it does NOT carry falls through to
  // Function.prototype. That made an unpassed prop named after a function's own
  // property resolve to the function's internals instead of undefined:
  // `$props.name` returned the string "$props" (the arrow function's inferred
  // name) and `$props.length` returned its arity.
  //
  // `export const name = $props.name || ''` therefore produced "$props" rather
  // than "", so a component with an optional `name` prop rendered the branch
  // meant to be skipped — <SidebarFooter> showed a phantom profile row labelled
  // "$props" whenever it was used for actions only. Silent, and `name` is one
  // of the most common prop names there is.
  //
  // Blank them out so an unset prop reads as undefined. Only when the component
  // did not actually pass one — a real `name` prop still wins, having been
  // defined above.
  for (const shadowed of ['name', 'length', 'caller', 'arguments']) {
    if (Object.prototype.hasOwnProperty.call(propsObj, shadowed))
      continue
    try {
      Object.defineProperty($props, shadowed, { value: undefined, enumerable: false, configurable: true, writable: true })
    }
    catch {
      // Non-configurable in some engine — leave it rather than throw.
    }
  }

  // Vue-like defineProps. Supports the options-style defaults arg
  // (`{ count: { default: 0 } }`) for parity with the module (props.ts) and
  // client-runtime (signals.ts) impls. Defaults apply only when the prop is
  // undefined, so a passed `0`/`false`/`''` is never collapsed.
  const defineProps = (definitions?: Record<string, unknown>) => {
    if (!definitions)
      return propsObj
    const result: Record<string, unknown> = { ...propsObj }
    for (const [key, def] of Object.entries(definitions)) {
      const opts = (def && typeof def === 'object' && !Array.isArray(def))
        ? def as Record<string, unknown>
        : { type: def }
      if (result[key] === undefined && opts.default !== undefined) {
        result[key] = typeof opts.default === 'function'
          ? (opts.default as () => unknown)()
          : opts.default
      }
    }
    return result
  }

  // Type-only contract anchor at runtime; returns the live slots map.
  // eslint-disable-next-line pickier/no-unused-vars
  const defineSlots = () => (context.slots as Record<string, unknown>) || {}

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

  /*
   * setResponseStatus / setResponseHeader / notFound, recording on this
   * script's own context so whichever host is rendering can read back what the
   * page asked for. See page-response.ts for why all three live in one place.
   */
  const responseApi = responseBindings(context)

  // definePageMeta forwards title/description into the head, matching the real
  // implementation in head.ts. It used to be a no-op stub, so a documented API
  // — head.ts:340 shows `definePageMeta({ title: 'Dashboard' })` — silently did
  // nothing in a <script server> block, which is the only place it runs
  // (stacksjs/stx#1792 item 5). Declared as a function so it can call useHead
  // below it via hoisting.
  function definePageMeta(meta: unknown): void {
    const config = (meta as Record<string, unknown>) || {}
    if (config.title !== undefined || config.description !== undefined) {
      useSeoMeta({ title: config.title, description: config.description })
    }
  }
  /**
   * Declare exactly what crosses into `<script client>`.
   *
   * Without this the only bridge is name scraping: a server binding is
   * published if its name happens to appear as a free identifier in the client
   * source. So a page cannot state what it expects, client code defends with
   * `typeof x === 'number' ? x : 0`, and a server const that exists only to be
   * scraped reads as dead to every linter (#1868).
   *
   * Declaring makes the set explicit and deterministic: a name is either
   * declared or absent, never "present because you happened to mention it".
   * Values are captured here rather than names alone, so the payload is what
   * was declared rather than whatever the context held later.
   *
   *   defineClientPayload({ liveNow, range })
   */
  function defineClientPayload(payload: unknown): void {
    if (!payload || typeof payload !== 'object')
      return
    const declared = (context.__stxClientPayload as Record<string, unknown> | undefined) ?? {}
    // Merged, not replaced: a layout and the page it wraps each get to declare
    // their own crossings, and the page runs after the layout.
    Object.assign(declared, payload as Record<string, unknown>)
    context.__stxClientPayload = declared
  }

  // useRoute() mirrors what the browser's useRoute() reads from
  // window.stx._rp — the serve path passes real params/search via context
  // (stacksjs/stacks#1967), so `useRoute().params.id` agrees on both sides.
  const useRoute = () => {
    const serveCtx = context.__stxServeContext as { path?: string, search?: string } | undefined
    const search = (context.__stxServeSearch as string | undefined) ?? serveCtx?.search ?? ''
    const path = serveCtx?.path ?? ''

    /*
     * The query comes from whichever of the two the host actually supplied.
     *
     * `__stxServeSearch` and `__stxServeContext.search` are the raw string, and
     * only the dev server sets them. A file-based view mounted by bun-router's
     * `serve()` gets neither — but it does get `query` as an already-parsed
     * object, the same way it gets `params`, which the line above was already
     * reading directly. Parsing an empty string and returning `{}` meant every
     * page reading `useRoute().query` saw nothing on the boot a production
     * server and the e2e suite both use, with no error: a `?token=…` page
     * silently rendered its no-token branch.
     */
    const parsed = Object.fromEntries(new URLSearchParams(search))
    const supplied = context.query as Record<string, string> | undefined
    const query = Object.keys(parsed).length > 0 ? parsed : (supplied ?? {})

    // Rebuilt from the query when the raw string is the half that is missing,
    // so `fullPath` is not silently the path alone.
    const suffix = search || (Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : '')

    return {
      params: (context.params as Record<string, string> | undefined) ?? {},
      query,
      path,
      name: '',
      fullPath: path + suffix,
      hash: '',
      matched: [],
    }
  }
  const useRouter = () => ({ push: (_to: unknown) => {}, replace: (_to: unknown) => {}, back: () => {}, forward: () => {}, go: (_n: number) => {} })
  // Head composables in server scripts write only to this render context.
  // Module-global state would leak metadata between concurrent SSR requests.
  const useHead = (head: unknown) => {
    const existing = (context.__stx_runtime_head as Record<string, any>) || {}
    context.__stx_runtime_head = mergeHeadConfigs(existing, (head as Record<string, any>) || {})
  }
  const useSeoMeta = (meta: unknown) => {
    useHead(seoMetaToHeadConfig((meta as Record<string, any>) || {}))
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
  const useDark = () => state(false)
  const useMediaQuery = (_query: string) => state(false)
  const useScrollLock = () => state(false)
  const usePreferredDark = () => useMediaQuery('(prefers-color-scheme: dark)')
  const usePreferredLight = () => useMediaQuery('(prefers-color-scheme: light)')
  const usePreferredReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
  const usePreferredContrast = () => useMediaQuery('(prefers-contrast: more)')

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
    // Context keys become PARAMETER NAMES on the `new Function` below, so a key
    // that is not a bare JS identifier is a syntax error in the generated
    // function signature — and that error takes down the whole server script,
    // not just the offending name. Templates routinely put non-identifier keys
    // in context (`data-*` attributes, hyphenated slot names, `...`-prefixed
    // internals), which silently dropped every component's server script into
    // the static-extraction fallback: exports computed by calling a helper
    // came back undefined and the component rendered empty. Props were already
    // screened this way; context was not.
    const isIdentifier = (key: string) => /^[a-z_$][\w$]*$/i.test(key)
    const filteredContextKeys = Object.keys(context).filter(key =>
      !propsKeys.has(key) && !CONTEXT_RESERVED_BINDINGS.has(key) && isIdentifier(key))
    const filteredContextValues = filteredContextKeys.map(key => context[key])

    /*
     * `__stxServeContext` is declared here, not only in `render.ts`.
     *
     * The scope of a server script is built from the keys of whatever context
     * its caller assembled, so a key the caller did not set is not declared at
     * all - and an *undeclared* identifier is a ReferenceError, which optional
     * chaining does not save: `__stxServeContext?.cookies` throws before the
     * chain is reached. It throws inside the script's IIFE, so it takes every
     * other binding in that file down with it and the component or page renders
     * its empty branch, which reads as a correct answer.
     *
     * `render.ts` defaults it for a page render, and that was believed to be
     * enough. It is not: a component's server script is extracted with a
     * context the component renderer built, which has never carried the key -
     * so every `<CsrfField />` and every badge fell back to static extraction
     * on the boot a production server and the e2e suite both use, while a page
     * naming the same binding worked.
     *
     * Declared at this seam because it is the one every server script passes
     * through, whoever built the context. Only when the caller has not set it,
     * so a real request is untouched.
     */
    if (!filteredContextKeys.includes('__stxServeContext')) {
      filteredContextKeys.push('__stxServeContext')
      filteredContextValues.push(undefined)
    }

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
      // Positionally paired with the argument list below — see
      // STX_ENGINE_BINDING_NAMES.
      ...STX_ENGINE_BINDING_NAMES,
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
      defineClientPayload,
      state, derived, effect, batch, onMount, onDestroy,
      definePageMeta, useRoute, useRouter, useHead, useSeoMeta,
      responseApi.setResponseStatus, responseApi.setResponseHeader, responseApi.notFound,
      ref, reactive, computed, watch, onMounted, onUnmounted, nextTick,
      defineEmits, defineExpose, defineSlots, provide, inject, useColorMode, useDark,
      useMediaQuery, useScrollLock, usePreferredDark, usePreferredLight, usePreferredReducedMotion, usePreferredContrast,
      windowProxy, mockDocument, mockConsole, mockWindow.confirm, mockWindow.alert, mockWindow.fetch,
      paramsObj,
      ...propArgValues,
      ...scriptContextValues,
    )

    // Copy results to context. `preserveExisting` is set by the
    // layout/partial extraction path so a stub like
    // `const user = { avatarInitials: 'JD' }` in the layout doesn't
    // overwrite the full object the child page already extracted on
    // the same name. Without it the layout's last-write wins because
    // it runs AFTER the page's extraction in the rendering pipeline.
    if (options.preserveExisting) {
      for (const [key, value] of Object.entries(result)) {
        if (!(key in context) || context[key] === undefined)
          context[key] = value
      }
    }
    else {
      Object.assign(context, result)
    }

    // Also spread props directly into context for simplest usage
    // This allows: {{ siteName }} (from props) without any ceremony
    // Done AFTER script execution to not conflict with script declarations
    for (const [key, value] of Object.entries(propsObj)) {
      if (!(key in context)) {
        context[key] = value
      }
    }
  }
  catch (primaryError) {
    // The server <script> IIFE failed to execute, so we fall back to static
    // extraction below. This is sometimes legitimate (pages that only use
    // client-only APIs like reactive()/Chart.js), but a genuine server-script
    // bug looks identical from the outside — the page just renders with empty
    // variables and NO error, which is very hard to debug. Set STX_DEBUG=1 to
    // surface the real cause and the offending file.
    const msg = primaryError instanceof Error ? primaryError.message : String(primaryError)

    /*
     * A module that cannot be resolved is always a bug.
     *
     * The silence above is deliberate for scripts that legitimately fail here -
     * a page using only client APIs like reactive() or Chart.js - but an import
     * that does not resolve is never that. It means a wrong path, and every
     * binding in the script, not just the imported one, comes back undefined.
     * The page then renders its empty-state branch and reads as a correct
     * answer rather than a failure.
     *
     * That is worth an unconditional warning. An off-by-one in a relative
     * import - `../../../../` where the file needed five - cost hours to find,
     * because the only symptom was a repository browser calmly reporting that
     * a repository which plainly exists could not be found.
     */
    if (isModuleResolutionFailure(msg)) {
      console.warn(
        `[stx] server <script> in ${filePath ?? '<unknown>'} imports a module that does not resolve, `
        + `so every variable in that script is undefined. Cause: ${msg}`,
      )
    }
    else if (isMissingBindingFailure(msg)) {
      console.warn(
        `[stx] server <script> in ${filePath ?? '<unknown>'} names something that does not exist, `
        + `so every variable in that script is undefined. Optional chaining does not help here: `
        + `an undefined identifier throws before the chain is reached. Cause: ${msg}`,
      )
    }
    else if (process.env.STX_DEBUG) {
      console.warn(`[stx] server <script> did not execute in ${filePath ?? '<unknown>'} — falling back to static extraction. Cause: ${msg}`)
    }
    // Fallback: Try alternative parsing approaches
    try {
      await fallbackVariableExtraction(jsContent, context, filePath)
    }
    catch (fallbackError) {
      // Script execution failed — page will render without server variables.
      // This is expected for pages using client-only APIs (reactive(), Chart.js, etc.)
      if (process.env.STX_DEBUG) {
        const msg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.warn(`[stx] fallback extraction also failed in ${filePath ?? '<unknown>'}: ${msg}`)
      }
    }
  }
}

/**
 * Convert ES module syntax to CommonJS
 *
 * @param scriptContent - ES module style script content
 * @returns CommonJS compatible script
 */
/**
 * Whether an import statement is finished, or continues on the next line.
 *
 * Finished means the module specifier has been reached and its quotes are
 * closed, with no unclosed brace left over. A side-effect import
 * (`import './setup'`) is complete as soon as its string closes; a named
 * import is not complete until both the brace list and the specifier are.
 *
 * Exported for the tests, because the failure it prevents is invisible from
 * the outside: an unjoined import produces a syntax error in generated code,
 * and the page then renders with every server variable undefined.
 */
export function isCompleteImport(statement: string): boolean {
  let braces = 0
  let quote: string | null = null
  let sawFrom = false
  let closedSpecifier = false

  for (let index = 0; index < statement.length; index++) {
    const character = statement[index]

    if (quote) {
      if (character === quote) {
        quote = null
        // The specifier is the string that follows `from`, or the whole
        // statement for a side-effect import.
        if (sawFrom || braces === 0)
          closedSpecifier = true
      }
      continue
    }

    if (character === '\'' || character === '"' || character === '`') {
      quote = character
      continue
    }

    if (character === '{')
      braces++
    else if (character === '}')
      braces--
    else if (statement.startsWith('from', index) && braces === 0)
      sawFrom = true
  }

  return quote === null && braces === 0 && closedSpecifier
}

/**
 * A declaration with no initializer: `var row;`, `let i`, `var a, b;`.
 *
 * Bun's transpiler lifts these to the top level out of a `for`/`try`/`if`
 * block, and they have to be emitted as-is because `parseVariableDeclaration`
 * expects a `= value` and throws without one.
 *
 * The test used to be "declares something and has no `=` on this line", which
 * is also true of the FIRST line of a destructuring pattern written across
 * several lines:
 *
 *     const {
 *       stores,
 *       westla,
 *     } = await loadSiteModel()
 *
 * `const {` was therefore emitted raw and the loop moved on one line, so the
 * pattern never reached the destructuring path and none of its names were
 * exported. The script still ran and the remaining lines still emitted, so the
 * page rendered and anything computed from those names was correct - but the
 * template printed `{{ stores }}` as literal text and every `@foreach` over
 * one of them rendered nothing, with no error anywhere. Writing the same
 * declaration on one line worked, which made it look like a data problem.
 *
 * So match the shape rather than the absence of a character: one or more bare
 * identifiers and nothing else. A `{` or `[` after the keyword is a pattern,
 * and belongs to `parseVariableDeclaration`, however many lines it spans.
 */
const UNINITIALIZED_DECLARATION
  = /^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*\s*;?$/

export function convertToCommonJS(scriptContent: string, filePath?: string): string {
  const templateDir = filePath ? path.dirname(filePath) : process.cwd()
  const projectRoot = process.cwd()
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
      const callStart = i
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

      // The call is stripped because its object can hold Nuxt-style entries
      // (validate(){}, middleware: [...]) that mean nothing here, and executing
      // arbitrary identifiers would throw where it previously did not. But
      // title and description DO mean something — `definePageMeta({ title })`
      // is documented and forwards correctly in head.ts, and stripping it was
      // why it silently did nothing in a server script (#1792 item 5).
      //
      // So: lift those two out statically and re-emit them as a useSeoMeta call
      // the sandbox already implements. String literals only — an expression
      // cannot be evaluated safely at this point anyway.
      const callText = lines.slice(callStart, i).join('\n')
      const lifted: string[] = []
      for (const key of ['title', 'description']) {
        const match = new RegExp(`\\b${key}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`).exec(callText)
        if (match)
          lifted.push(`${key}: ${JSON.stringify(match[2])}`)
      }
      if (lifted.length > 0)
        convertedLines.push(`useSeoMeta({ ${lifted.join(', ')} });`)

      continue
    }

    // Convert ES import statements to require() with resolved paths
    if (line.startsWith('import ') || line === 'import' || line.startsWith('import{')) {
      /*
       * An import may span several lines, which is how anybody writes one with
       * more than three names:
       *
       *   import {
       *     alpha,
       *     beta,
       *   } from './somewhere'
       *
       * Parsed a line at a time, `import {` matched none of the patterns below
       * and fell through to be emitted verbatim, which is a syntax error in the
       * generated module. The script then failed to execute and the page
       * rendered with every server variable undefined and nothing logged. So
       * the statement is joined before it is matched.
       */
      let statement = line
      let consumed = 0

      while (!isCompleteImport(statement) && i + consumed + 1 < lines.length) {
        consumed++
        statement = `${statement} ${lines[i + consumed].trim()}`
      }

      i += consumed

      const defaultImportMatch = statement.match(/^import\s+(\w+)\s+from\s+['"](.+?)['"]/)
      const namedImportMatch = statement.match(/^import\s+\{([^}]*)\}\s+from\s+['"](.+?)['"]/)
      const sideEffectMatch = statement.match(/^import\s+['"](.+?)['"]/)
      const line_ = statement

      // Resolve relative paths against the template's directory
      const resolveSource = (source: string) => {
        if (source.startsWith('.')) {
          return path.resolve(templateDir, source)
        }
        if (source.startsWith('~/') || source.startsWith('@/')) {
          return path.resolve(projectRoot, source.slice(2))
        }
        return source
      }

      if (defaultImportMatch) {
        const [, name, source] = defaultImportMatch
        const resolved = resolveSource(source)

        /*
         * `.default`, not the namespace.
         *
         * `import x from 'y'` binds the module's DEFAULT export;
         * `await import('y')` gives the namespace object, whose `.default` holds
         * it. Binding the namespace meant every property read off `x` was
         * `undefined` — `services.github.clientId` on a config module returned
         * nothing, with no throw and no warning, so a config-gated feature
         * quietly turned itself off (stacksjs/stx#1910).
         *
         * No `?? namespace` fallback for the CommonJS case, which is what I
         * reached for first: measured, Bun synthesises `.default` for a CJS
         * module too, set to its `module.exports`. So the fallback was
         * unreachable, and a branch that cannot run is a claim about the
         * runtime that nothing checks.
         */
        convertedLines.push(`const ${name} = (await import('${resolved}')).default`)
        convertedLines.push(`module.exports.${name} = ${name};`)
      }
      else if (namedImportMatch) {
        const [, names, source] = namedImportMatch
        const resolved = resolveSource(source)

        /*
         * An import turns into destructuring, and the two spell renaming
         * differently: `import { a as b }` is `const { a: b }`. Pasting the
         * import spelling through produced `const { a as b } = await import(…)`,
         * which is a SyntaxError - so the whole script failed to parse and every
         * binding in it came back undefined, with nothing logged. A template
         * whose values all vanish renders its empty-state branch, which reads as
         * a correct answer rather than a failure.
         */
        const specifiers: string[] = []
        const exported: string[] = []

        /*
         * An import of the stx runtime must not redeclare what the engine
         * already passes in as a parameter — `const { defineProps } = await
         * import('stx')` shadows the injected binding with the package's own,
         * which reads a global the server path never sets, so props arrive
         * empty. See STX_ENGINE_BINDING_NAMES.
         *
         * Only engine-provided names are taken out of the import. Anything else
         * (`defineStore`, `useForm`, …) is a genuine export the engine does not
         * inject, so it stays in the import and keeps resolving as before.
         *
         * They are also not re-exported. `module.exports.defineProps` puts the
         * engine's per-component binding into the component's CONTEXT, and a
         * child component inherits its parent's context — so the child's script
         * received a `defineProps` parameter bound to the PARENT's props, which
         * shadows its own (context keys are appended after the engine
         * parameters, and the later parameter wins). Every prop the child was
         * passed came back undefined and it rendered its defaults, static
         * attributes included, with nothing logged (#1937).
         */
        const isStxRuntime = STX_RUNTIME_SPECIFIERS.has(source)

        for (const raw of names.split(',')) {
          const specifier = raw.trim()
          if (!specifier)
            continue

          const aliased = specifier.split(/\s+as\s+/)
          if (aliased.length === 2) {
            const [imported, local] = [aliased[0]!.trim(), aliased[1]!.trim()]
            if (isStxRuntime && ENGINE_BINDINGS.has(imported)) {
              // `import { defineProps as dp }` — the alias does not collide, so
              // bind it to the injected parameter instead of importing it. Not
              // exported: an alias leaks exactly what the original would.
              convertedLines.push(`const ${local} = ${imported};`)
              continue
            }
            specifiers.push(`${imported}: ${local}`)
            exported.push(local)
          }
          else {
            if (isStxRuntime && ENGINE_BINDINGS.has(specifier)) {
              // Already in scope as a parameter — emit no binding at all, and
              // publish nothing.
              continue
            }
            specifiers.push(specifier)
            exported.push(specifier)
          }
        }

        // With every name engine-provided there is nothing left to import, and
        // emitting the import anyway would reintroduce the failure in reverse:
        // `stx` does not resolve everywhere, and a rejected import takes the
        // whole script down.
        if (specifiers.length > 0)
          convertedLines.push(`const { ${specifiers.join(', ')} } = await import('${resolved}')`)
        for (const local of exported)
          convertedLines.push(`module.exports.${local} = ${local};`)
      }
      else if (sideEffectMatch) {
        const resolved = resolveSource(sideEffectMatch[1])
        convertedLines.push(`await import('${resolved}')`)
      }
      else {
        convertedLines.push(line_)
      }
      i++
      continue
    }

    if (UNINITIALIZED_DECLARATION.test(line)) {
      // Declaration without an initializer, e.g. a hoisted `var row;` / `var i;`
      // that Bun's transpiler lifts to the top level out of a `for`/`try`/`if`
      // block. parseVariableDeclaration expects `name = value` and would throw
      // on these (which silently strands the whole script in the fallback
      // extractor). Emit the line as-is; the trailing reSync exports the value.
      convertedLines.push(lines[i])
      i++
    }
    else if (line.startsWith('export const ') || line.startsWith('export let ') || line.startsWith('export var ')) {
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

  return resolveDynamicImports(convertedLines.join('\n'), templateDir, projectRoot)
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
function resolveDynamicImports(source: string, templateDir: string, projectRoot: string): string {
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
        if (importPath.startsWith('.') || importPath.startsWith('~/') || importPath.startsWith('@/')) {
          const resolved = importPath.startsWith('.')
            ? path.resolve(templateDir, importPath)
            : path.resolve(projectRoot, importPath.slice(2))
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
      /*
       * A nested pattern is read whole and its names collected, so depth is
       * unchanged either side of it.
       *
       * This used to `depth++` first and then `continue` out of the branch
       * without ever putting it back, so depth stayed at 1 for the rest of the
       * scan and the `depth > 0` skip below swallowed every remaining name:
       * `{ user: { name }, total }` yielded `name` and lost `total`. Silent,
       * and only for patterns that nest — the template simply rendered nothing
       * for the names that came after.
       */
      const nested = depth === 0 ? extractDestructuringPattern(inner, i) : null
      if (nested) {
        names.push(...extractDestructuredNames(nested.pattern))
        i = nested.endPos
        currentName = ''
        continue
      }

      depth++
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
/**
 * Split `const name: Type = value` into its parts.
 *
 * The pattern this supports used to require the `=` to follow the name
 * directly, so any TypeScript annotation made the declaration unparseable. That
 * is not a small failure: an unparseable declaration throws out of
 * `convertToCommonJS`, the whole server script falls back to static
 * extraction, and the page renders with every variable undefined and no error.
 * A single `const rows: any = await db...` was enough to blank a page.
 *
 * The annotation is erased at runtime, so it only has to be skipped. It is
 * scanned rather than matched because it can contain almost anything: `=` in a
 * generic default, braces in an object type, commas and angle brackets in a
 * generic argument list.
 *
 * Returns null when the line is not a simple declaration, which leaves the
 * destructuring and multi-line paths below to handle it as before.
 */
export function splitDeclaration(line: string): { type: string, name: string, value: string } | null {
  const head = /^(?:export\s+)?(const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line)
  if (!head)
    return null

  let index = head[0].length
  const isSpace = (character: string) => character === ' ' || character === '\t'

  while (index < line.length && isSpace(line[index]!))
    index++

  // An annotation runs from the colon to the `=` that starts the initializer.
  if (line[index] === ':') {
    let depth = 0
    let quote: string | null = null
    index++

    for (; index < line.length; index++) {
      const character = line[index]!

      if (quote) {
        if (character === '\\') {
          index++
          continue
        }
        if (character === quote)
          quote = null
        continue
      }

      if (character === '\'' || character === '"' || character === '`') {
        quote = character
        continue
      }

      if (character === '(' || character === '[' || character === '{' || character === '<') {
        depth++
        continue
      }

      if (character === ')' || character === ']' || character === '}' || character === '>') {
        depth--
        continue
      }

      // The initializer's `=`, but not `==`, `=>`, `<=`, `>=` or `!=`.
      if (character === '=' && depth <= 0) {
        const next = line[index + 1]
        const previous = line[index - 1]
        if (next !== '=' && next !== '>' && previous !== '=' && previous !== '!' && previous !== '<' && previous !== '>')
          break
      }
    }

    if (line[index] !== '=')
      return null
  }

  while (index < line.length && isSpace(line[index]!))
    index++

  if (line[index] !== '=')
    return null

  return {
    type: head[1]!,
    name: head[2]!,
    value: line.slice(index + 1).trim(),
  }
}

/**
 * Bracket depth after reading `text`, starting from `depth`.
 *
 * Quotes are tracked so a brace inside a default value — `const { sep = '}' }`
 * — does not close the pattern. Only the one bracket kind that opened the
 * pattern is counted: a `[` inside an object pattern is a computed key and
 * cannot end it.
 */
function countPatternDepth(text: string, openChar: string, closeChar: string, depth: number): number {
  let quote: string | null = null
  let escaped = false

  for (const character of text) {
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (quote) {
      if (character === quote)
        quote = null
      continue
    }
    if (character === '\'' || character === '"' || character === '`') {
      quote = character
      continue
    }
    if (character === openChar)
      depth++
    else if (character === closeChar)
      depth--
  }

  return depth
}

function parseVariableDeclaration(lines: string[], startIndex: number): VariableDeclarationResult {
  const firstLine = lines[startIndex].trim()

  // Extract type and check for simple pattern. `splitDeclaration` handles the
  // TypeScript annotation the old pattern could not see past.
  const split = splitDeclaration(firstLine)
  const match = split ? ([firstLine, split.type, split.name, split.value] as unknown as RegExpMatchArray) : null

  // Try destructuring pattern if simple doesn't match
  if (!match) {
    const destructuringPrefix = firstLine.match(/^(?:export\s+)?(const|let|var)\s+/)
    if (destructuringPrefix) {
      let afterKeyword = firstLine.slice(destructuringPrefix[0].length)

      /*
       * Join the lines a destructuring pattern is spread across.
       *
       * Depth-counted rather than "stop at the first line containing the
       * closing character", which ends a nested pattern one brace early:
       *
       *     const {
       *       user: { name },   <- this line closes the INNER brace
       *       total,
       *     } = model()
       *
       * The old rule stopped there and handed `{ user: { name },` to the
       * pattern parser, which cannot parse it. That used to be unreachable
       * because the caller misclassified `const {` before it ever got here;
       * with that fixed, an unbalanced join throws instead, and a throw takes
       * the whole script into the fallback extractor rather than just this
       * declaration.
       */
      let joinedEndIndex = startIndex
      if (afterKeyword.startsWith('{') || afterKeyword.startsWith('[')) {
        const openChar = afterKeyword[0]
        const closeChar = openChar === '{' ? '}' : ']'
        let depth = countPatternDepth(afterKeyword, openChar, closeChar, 0)
        let joined = afterKeyword

        for (let j = startIndex + 1; j < lines.length && depth > 0; j++) {
          joined += ` ${lines[j].trim()}`
          joinedEndIndex = j
          depth = countPatternDepth(lines[j], openChar, closeChar, depth)
        }

        // Unterminated: the pattern never closes before the end of the block.
        // Leave the original single line alone so the caller throws with the
        // real first line rather than a joined-up mangling of the whole script.
        if (depth > 0) {
          joined = afterKeyword
          joinedEndIndex = startIndex
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
/**
 * Index of the brace that opens a function's BODY, or -1 if it is not on this text.
 *
 * Not `indexOf('{')`: that finds the destructuring pattern's brace in
 * `async function g({ form }) {`, and since that one closes on the same line,
 * both callers below concluded the function was already complete. The damage:
 *
 *   async function g({ form }) {
 *   module.exports.g = g;      <- spliced in here; never runs, g not assigned
 *   return 1;
 *   }
 *
 * The export never happened and the declaration vanished from the render context
 * with no error at all. Every server-block function with a destructured
 * parameter was affected — `{ form }`, `{ request, params }`, the shape most
 * handlers are written in. See stacksjs/stx#1890.
 *
 * Returns -1 when the parameter list itself is unterminated, since there is no
 * body brace to find yet — both callers treat that as "keep reading".
 */
function findFunctionBodyBrace(functionLine: string): number {
  const parenPos = functionLine.indexOf('(')
  if (parenPos === -1)
    return functionLine.indexOf('{')

  const paramsEnd = findMatchingDelimiter(functionLine, '(', ')', parenPos)
  if (paramsEnd === -1)
    return -1

  return functionLine.indexOf('{', paramsEnd)
}

function needsMultilineFunctionReading(functionLine: string): boolean {
  const bracePos = findFunctionBodyBrace(functionLine)
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
    // Body brace, not the first brace — a destructured parameter's `{ form }`
    // closes on the signature line, so `indexOf('{')` made this break on the
    // very first iteration and return the signature with no body at all
    // (stacksjs/stx#1890).
    const bracePos = findFunctionBodyBrace(functionCode)
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
 * Evaluate a single top-level declaration's initializer for the fallback
 * extractor. Tries `safeEvaluate` first (the same sandboxed evaluator used
 * for user-facing template expressions), then — only on failure — retries
 * with `process` (env-only, read-only) exposed as an extra identifier.
 *
 * `safeEvaluate` deliberately rejects any expression containing the token
 * `process` (see DANGEROUS_PATTERNS in safe-evaluator.ts): that sanitizer
 * guards *user template expressions* (`{{ }}`, `@if`, …) which really must
 * never read `process.env` or reach `process.exit()`. But the fallback
 * extractor here evaluates *server-script source the developer already
 * wrote and trusted enough to execute* — the primary IIFE path (above)
 * already ran this exact source with full ambient access to `process`. If
 * the IIFE aborted (e.g. an unrelated later statement threw) and we're
 * down to per-line recovery, rejecting `process.env.APP_NAME || 'x'` here
 * just because it contains the word "process" silently drops the
 * variable — no error, no warning, template renders with an empty
 * interpolation. `process.env` is a near-universal pattern in
 * `<script server>` blocks (feature flags, API keys, mode switches), so
 * this is not an edge case.
 *
 * Only `process.env` is exposed (as a frozen shallow copy), not the full
 * `process` object — no `process.exit`, `process.binding`, `process.kill`,
 * etc. reach the fallback sandbox.
 */
function evaluateFallbackExpression(expression: string, context: Record<string, unknown>): unknown {
  const direct = safeEvaluate(expression, context) ?? safeEvaluate(`(${expression})`, context)
  if (direct !== undefined)
    return direct

  if (!/\bprocess\b/.test(expression))
    return undefined

  const processEnvContext = { ...context, process: Object.freeze({ env: { ...process.env } }) }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(processEnvContext), `'use strict'; return (${expression});`)
    return fn(...Object.values(processEnvContext))
  }
  catch {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(processEnvContext), `'use strict'; return ${expression};`)
      return fn(...Object.values(processEnvContext))
    }
    catch {
      return undefined
    }
  }
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
      const evaluated = evaluateFallbackExpression(cleanValue, context)
      if (evaluated !== undefined)
        context[name] = evaluated
    }
    catch (e2) {
      console.warn(`Failed to parse export ${name} in fallback:`, e2)
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
        const evaluated = evaluateFallbackExpression(cleanValue, context)
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
