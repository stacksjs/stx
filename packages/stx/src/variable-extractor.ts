/**
 * Variable Extraction
 *
 * Extracts and processes variables from <script> tags in stx templates.
 * Converts ES module syntax to CommonJS for execution in isolated contexts.
 *
 * KNOWN LIMITATIONS:
 *
 * 1. NO ASYNC/AWAIT SUPPORT
 *    Top-level await is NOT supported in <script> tags.
 *    Workaround: Use synchronous data or pass async data via context.
 *
 * 2. NO IMPORT STATEMENTS
 *    ES module imports are not supported in <script> tags.
 *    Workaround: Import in server code and pass via context.
 *
 * 3. COMPLEX DESTRUCTURING MAY FAIL
 *    Deeply nested destructuring patterns may not parse correctly.
 *    The system creates __destructured_ temporary variables as a workaround.
 *
 * 4. TEMPLATE LITERALS WITH EXPRESSIONS
 *    Complex template literals with nested expressions may not parse correctly.
 *
 * 5. EXPORT KEYWORD IS OPTIONAL
 *    Both exported and non-exported variables are made available to templates.
 */

// Import from tokenizer to avoid circular dependency
import { findMatchingDelimiter } from './parser/tokenizer'

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
  // Only match function declarations, not arbitrary parentheses
  result = result.replace(
    /\b(function\s+\w*\s*)\(([^)]*)\)/g,
    (match, prefix, params) => {
      // Don't process if no type annotations
      if (!params.includes(':'))
        return match
      const cleanedParams = params
        .split(',')
        .map((param: string) => {
          // Remove type annotation but keep default values
          const [nameWithType, ...defaultParts] = param.split('=')
          const name = nameWithType.split(':')[0].trim()
          if (defaultParts.length > 0) {
            return `${name} = ${defaultParts.join('=').trim()}`
          }
          return name
        })
        .join(', ')
      return `${prefix}(${cleanedParams})`
    },
  )

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

  // Remove 'as Type' assertions
  result = result.replace(/\s+as\s+\w+(?:\[\])?/g, '')

  // Keep defineProps and withDefaults calls but remove generic type parameters
  // They will be handled by stub functions during execution
  // e.g., defineProps<SomeType>() -> defineProps()
  // (Generic removal already handled above)

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

  // Strip TypeScript syntax first
  const jsContent = stripTypeScript(scriptContent)

  // Create a safe execution environment
  const module = { exports: {} as Record<string, unknown> }
  const exports = module.exports

  // Create a require function for CommonJS compatibility (bun:sqlite, path, etc.)
  const requireFn = (id: string) => {
    // Use Bun's require for built-in and node modules
    return require(id)
  }

  // Provide STX stub functions for component scripts
  // These provide Vue-like defineProps/withDefaults but also support simpler patterns
  const propsObj = (context.props || {}) as Record<string, unknown>

  // Simple $props function for direct access with defaults
  // Usage: const { name = 'default' } = $props
  // Or: const { name } = $props({ name: 'default' })
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
        } catch {
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
    fetch: async () => new Response('{}'),
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

  // Mock console for scripts that use it
  const mockConsole = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  }

  try {
    // Parse and convert the script content
    const convertedScript = convertToCommonJS(jsContent)

    // Execute with context variables available
    const contextKeys = Object.keys(context)
    const contextValues = Object.values(context)

    // eslint-disable-next-line no-new-func
    const scriptFn = new Function(
      'module', 'exports', 'require', '$props', 'defineProps', 'withDefaults',
      'state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy',
      'window', 'document', 'console', 'confirm', 'alert', 'fetch',
      ...contextKeys,
      convertedScript
    )
    scriptFn(
      module, exports, requireFn, $props, defineProps, withDefaults,
      state, derived, effect, batch, onMount, onDestroy,
      windowProxy, mockDocument, mockConsole, mockWindow.confirm, mockWindow.alert, mockWindow.fetch,
      ...contextValues
    )

    // Copy results to context
    Object.assign(context, module.exports)

    // Also spread props directly into context for simplest usage
    // This allows: {{ siteName }} (from props) without any ceremony
    // Done AFTER script execution to not conflict with script declarations
    for (const [key, value] of Object.entries(propsObj)) {
      if (!(key in context)) {
        context[key] = value
      }
    }
  }
  catch (error) {
    console.warn(`Failed to execute script as CommonJS module in ${filePath}:`, error)

    // Fallback: Try alternative parsing approaches
    try {
      await fallbackVariableExtraction(jsContent, context, filePath)
    }
    catch (fallbackError) {
      console.warn(`Variable extraction issue in ${filePath}:`, fallbackError)
    }
  }
}

/**
 * Convert ES module syntax to CommonJS
 *
 * @param scriptContent - ES module style script content
 * @returns CommonJS compatible script
 */
export function convertToCommonJS(scriptContent: string): string {
  const lines = scriptContent.split('\n')
  const convertedLines: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

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

  return convertedLines.join('\n')
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
      const afterKeyword = firstLine.slice(destructuringPrefix[0].length)

      const patternResult = extractDestructuringPattern(afterKeyword, 0)
      if (patternResult) {
        const type = destructuringPrefix[1]
        const destructuringPattern = patternResult.pattern

        const afterPattern = afterKeyword.slice(patternResult.endPos).trim()
        if (afterPattern.startsWith('=')) {
          const initialValue = afterPattern.slice(1).trim()
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
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(`return ${cleanValue}`)
      context[name] = evalFn()
    }
    catch {
      try {
        const cleanValue = value.trim().replace(/;$/, '')
        // eslint-disable-next-line no-new-func
        const evalFn = new Function(`return (${cleanValue})`)
        context[name] = evalFn()
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
        // eslint-disable-next-line no-new-func
        const evalFn = new Function(`return ${cleanValue}`)
        context[name] = evalFn()
      }
      catch {
        // Ignore individual failures in fallback
      }
    }
  }

  // Approach 3: Try removing exports and executing directly
  try {
    const directScript = scriptContent.replace(/^export\s+/gm, '')

    // eslint-disable-next-line no-new-func
    const directFn = new Function(`
      ${directScript}
      const result = {};
      ${Array.from(scriptContent.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g))
        .map(match => `if (typeof ${match[1]} !== 'undefined') result.${match[1]} = ${match[1]};`)
        .join('\n')}
      return result;
    `)

    const vars = directFn() as Record<string, unknown>
    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined && !(key in context)) {
        context[key] = value
      }
    })
  }
  catch {
    // Final fallback failed - expected for some complex patterns
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
