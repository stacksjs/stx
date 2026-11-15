import { scanHtmlScriptElements } from './html-masking'
import { parseEmitsDeclaration } from './emits-declaration'
import type {
  ComponentLibraryBuildResult,
  ComponentLibraryComponent,
  ComponentLibraryConfig,
  ComponentLibraryEvent,
  ComponentLibraryProperty,
} from './types'
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { builtinModules } from 'node:module'
import { scriptAttributes, scriptContainsCode } from './script-attributes'
import { topLevelDeclarationSites } from './client-parameter-bindings'
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'
import { Tokenizer } from './parser/tokenizer'
import { literalValue, localType, parseDefaults, parsePropsDeclaration, skipBalanced, splitTopLevel } from './props-declaration'
export { parseDefaults } from './props-declaration'

export interface SourceMetadata {
  name?: string
  tag?: string
  description?: string
  shadowDOM?: boolean | 'open' | 'closed'
  progressive?: boolean
  properties?: Record<string, ComponentLibraryProperty>
  props?: Record<string, ComponentLibraryProperty>
  events?: Record<string, ComponentLibraryEvent>
  methods?: Record<string, string>
}

interface CompiledComponent {
  file: string
  sourcePath: string
  name: string
  tag: string
  description: string
  template: string
  styles: string
  shadowMode: false | 'open' | 'closed'
  progressive: boolean
  properties: Record<string, ComponentLibraryProperty>
  events: Record<string, ComponentLibraryEvent>
  methods: Record<string, string>
  methodDeclarations: Record<string, string[]>
  declarationTypes: string
  declarationImports: string
  eventTypes: string[]
  handlers: string[]
  scopeMethods: string[]
  bindings: Array<{ id: number, name: string, expression: string }>
  slots: Array<{ name: string, description?: string }>
  cssProperties: Array<{ name: string, description?: string }>
  /** The component's script, compiled: hoisted imports and the derived scope. */
  scope: { imports: string[], body: string, propNames: string[], propBindings: Record<string, string>, defaults: Record<string, string>, apis: string[] }
  /** The template's control flow, compiled into a render function body. */
  render: string
}

/**
 * Why a name cannot be a component method, and what to write instead.
 *
 * The two custom-element reactions stay reserved because the generated element
 * defines them: a component that redefined one would override the framework's
 * own initialization or its listener cleanup and lose it with no diagnostic.
 * What was missing was anywhere else to put the work, so the reservation read
 * as "you cannot clean up" rather than "not here" (stacksjs/stx#2010).
 *
 * `onConnect` and `onDisconnect` are called from inside those reactions, which
 * gives a component the same two moments without taking the reaction over.
 */
function reservedMethodMessage(name: string): string {
  if (name === 'connectedCallback')
    return `method "${name}" is reserved; define "onConnect" instead, which the element calls once it is connected, rendered and bound`
  if (name === 'disconnectedCallback')
    return `method "${name}" is reserved; define "onDisconnect" instead, which the element calls as it leaves the DOM, before it releases its own listeners`

  return `method "${name}" is reserved`
}

const RESERVED_METHODS = new Set([
  'constructor',
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
])
const SERVER_MODULES = new Set(builtinModules)

function toPascalCase(value: string): string {
  return value
    .replace(/\.stx$/i, '')
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function validCustomElementTag(tag: string): boolean {
  return /^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/.test(tag)
    && !tag.startsWith('xml')
    && !/[A-Z]/.test(tag)
}

function normalizeShadowMode(value: boolean | 'open' | 'closed' | undefined): false | 'open' | 'closed' {
  if (value === true) return 'open'
  if (value === 'open' || value === 'closed') return value
  return false
}

async function discoverStxFiles(inputDir: string): Promise<string[]> {
  const files: string[] = []

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') await visit(entryPath)
      }
      else if (entry.isFile() && entry.name.endsWith('.stx') && !/\.(?:test|spec)\.stx$/i.test(entry.name)) {
        files.push(entryPath)
      }
    }
  }

  await visit(inputDir)
  return files
}

export function componentScriptSource(source: string): string {
  return source.replace(/<!--[\s\S]*?-->|\{\{--[\s\S]*?--\}\}/g, comment => comment.replace(/[^\n]/g, ' '))
}

export function componentMetadataBlock(source: string): { code: string, start: number, open: number } | undefined {
  for (const script of scanHtmlScriptElements(componentScriptSource(source))) {
    const attributes = scriptAttributes(script.attrs)
    if (!attributes.has('component') && !attributes.has('stx:component')) continue
    return { code: source.slice(script.bodyStart, script.bodyEnd), start: script.bodyStart, open: script.start }
  }
}

export function parseMetadata(source: string, file: string): SourceMetadata {
  const block = componentMetadataBlock(source)
  if (!block) return {}
  const raw = block.code.trim()
  if (!raw) return {}

  try {
    const metadata: SourceMetadata = JSON.parse(raw)
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('expected a JSON object')
    return metadata
  }
  catch (error) {
    throw new Error(`${file}: <script component> must contain JSON metadata (${(error as Error).message})`)
  }
}

export interface ClientMethod {
  parameterOffset: number
  name: string
  header: string
  parameters: string
  generic: string
  returns: string
  async: boolean
  source?: string
}

export type ClientMethodValidator = (header: string, token: '{' | ';', name: string) => boolean

/** Use Bun's TS parser to distinguish a return object type from the method body. */
export function clientMethods(code: string, validate?: ClientMethodValidator): ClientMethod[] {
  const masked = stripCommentsAndLiterals(code)
  const declarations = new Set(topLevelDeclarationSites(code).map(site => site.start))
  const pattern = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
  const result: ClientMethod[] = []
  const parser = validate ? undefined : new Bun.Transpiler({ loader: 'ts' })
  let match: RegExpExecArray | null
  while ((match = pattern.exec(masked))) {
    if (!declarations.has(match.index + match[0].indexOf('function'))) continue
    let cursor = pattern.lastIndex
    while (/\s/.test(masked[cursor] || '')) cursor++
    const genericStart = cursor
    if (masked[cursor] === '<') cursor = skipBalanced(masked, cursor, '<', '>')
    if (cursor < 0) continue
    const generic = code.slice(genericStart, cursor).trim()
    while (/\s/.test(masked[cursor] || '')) cursor++
    if (masked[cursor] !== '(') continue
    const parameterStart = cursor
    const parameterEnd = skipBalanced(masked, cursor, '(', ')')
    if (parameterEnd < 0) continue
    for (cursor = parameterEnd; cursor < code.length; cursor++) {
      const token = masked[cursor]
      if (token !== '{' && token !== ';') continue
      const header = code.slice(match.index, cursor).trim()
      if (validate) { if (!validate(header, token, match[1]!)) continue }
      else {
        let compiled: string
        try { compiled = parser!.transformSync(header + (token === '{' ? '{}' : ';')) }
        catch { continue }
        // An overload is erased; a valid implementation retains its function.
        if (token === '{' && !compiled.includes(`function ${match[1]}(`)) continue
        if (token === ';' && compiled.trim()) continue
      }
      const bodyEnd = token === '{' ? skipBalanced(masked, cursor, '{', '}') : cursor + 1
      if (bodyEnd < 0) break
      result.push({
        name: match[1]!, header, generic, parameterOffset: parameterStart + 1,
        parameters: code.slice(parameterStart + 1, parameterEnd - 1),
        returns: code.slice(parameterEnd, cursor).trim().replace(/^:\s*/, ''),
        async: /\basync\s+function/.test(match[0]),
        ...(token === '{' ? { source: code.slice(match.index, bodyEnd) } : {}),
      })
      pattern.lastIndex = bodyEnd
      break
    }
  }
  return result
}

export function methodDeclaration(method: ClientMethod): string {
  const parameters = splitTopLevel(method.parameters, ',', true).flatMap((raw, index) => {
    const masked = stripCommentsAndLiterals(raw)
    let depth = 0, assignment = -1
    for (let i = 0; i < masked.length; i++) {
      const token = masked[i]!
      if ('([{<'.includes(token)) depth++
      else if (')]}>' .includes(token) && !(token === '>' && masked[i - 1] === '=')) depth--
      if (token === '=' && depth === 0 && masked[i + 1] !== '>') { assignment = i; break }
    }
    const declaration = (assignment < 0 ? raw : raw.slice(0, assignment)).trim()
    const parts = splitTopLevel(declaration, ':', true)
    const binding = parts.shift()!.trim()
    if (binding === 'this') return []
    const name = /^[A-Za-z_$]|^\.\.\./.test(binding) ? binding : `argument${index}`
    const fallback = assignment < 0 ? '' : raw.slice(assignment + 1).trim()
    const inferred = fallback === 'true' || fallback === 'false' ? 'boolean' : /^-?\d+(?:\.\d+)?$/.test(fallback) ? 'number' : /^['"`]/.test(fallback) ? 'string' : name.startsWith('...') ? 'unknown[]' : 'unknown'
    const type = parts.join(':').trim() || inferred
    const optional = assignment >= 0 && !name.endsWith('?') && !name.startsWith('...') ? '?' : ''
    return [`${name}${optional}: ${type}`]
  }).join(', ')
  return `${method.name}${method.generic}(${parameters}): ${method.returns || (method.async ? 'Promise<unknown>' : 'unknown')}`
}

function extractClientMethods(source: string, file: string): { methods: Record<string, string>, declarations: Record<string, string[]>, types: string, typeImports: string } {
  const methods: Record<string, string> = {}, declarations: Record<string, string[]> = {}, types: string[] = [], imports: Array<{ binding: string, module: string }> = []
  const scripts = scanHtmlScriptElements(componentScriptSource(source)).map(script => ({
    code: source.slice(script.bodyStart, script.bodyEnd),
    attributes: scriptAttributes(script.attrs),
  })).filter(({ attributes }) => !['src', 'server', 'component', 'stx:component'].some(name => attributes.has(name)) && scriptContainsCode(attributes))
  const combined = scripts.map(script => script.code).join('\n')
  const publicProps = parsePropsDeclaration(combined)
  const publicEmits = parseEmitsDeclaration(combined)
  for (const script of scripts) {
    const { code } = script
    try { new Bun.Transpiler({ loader: 'ts' }).transformSync(code) }
    catch (error) { throw new Error(`${file}: failed to transpile <script client> (${(error as Error).message})`) }
    const extracted = clientMethods(code)
    const overloads = new Set(extracted.filter(method => !method.source).map(method => method.name))
    for (const method of extracted) {
      if (RESERVED_METHODS.has(method.name)) throw new Error(`${file}: client ${reservedMethodMessage(method.name)}`)
      if (method.source) {
        methods[method.name] = `${method.name}(...args) { return this._callScopeMethod(${JSON.stringify(method.name)}, args); }`
      }
      if (!method.source || !overloads.has(method.name)) (declarations[method.name] ??= []).push(methodDeclaration(method))
    }
    for (const imported of code.matchAll(/^\s*import\s+(?:type\s+)?([\s\S]*?)\s+from\s*(['"])([^'"]+)\2\s*;?/gm)) imports.push({ binding: imported[1]!.trim(), module: imported[3]! })
    const masked = stripCommentsAndLiterals(code)
    const depths = bracketDepths(masked).depths
    const typePattern = /(?:export\s+)?(interface|type)\s+[A-Za-z_$][\w$]*/g
    let match: RegExpExecArray | null
    while ((match = typePattern.exec(masked))) {
      if (depths[match.index] !== 0) continue
      let cursor = typePattern.lastIndex, depth = 0
      for (; cursor < masked.length; cursor++) {
        const token = masked[cursor]!
        if (token === '{') {
          const end = skipBalanced(masked, cursor, '{', '}')
          if (end < 0) break
          cursor = end - 1
          if (match[1] === 'interface' && depth === 0) { cursor++; break }
          continue
        }
        if ('([<'.includes(token)) depth++
        else if (')]>'.includes(token) && !(token === '>' && masked[cursor - 1] === '=')) depth--
        if (match[1] === 'type' && depth === 0 && (token === ';' || token === '\n')) {
          if (token === '\n' && /^[\s]*[|&]/.test(masked.slice(cursor + 1))) continue
          try { new Bun.Transpiler({ loader: 'ts' }).transformSync(code.slice(match.index, cursor)); break }
          catch { /* The alias continues on its next line. */ }
        }
      }
      // A private type consumed only by defineProps is compile-time input, not
      // a public method type. Re-emitting `interface FieldProps` beside the
      // generated `export interface FieldProps` creates an invalid declaration
      // merge (and wrongly joins required source props to optional DOM props).
      const declaration = code.slice(match.index, cursor)
      const declarationStart = match.index
      const name = /(?:interface|type)\s+([A-Za-z_$][\w$]*)/.exec(match[0])?.[1]
      // All public scripts share the component's declaration scope. A method
      // in a separate client block can still need this props-support type.
      const remaining = scripts.map(other => {
        const body = other === script ? code.slice(0, declarationStart) + code.slice(cursor) : other.code
        return stripCommentsAndLiterals(body.replace(parsePropsDeclaration(other.code)?.text ?? '\0', '').replace(parseEmitsDeclaration(other.code)?.text ?? '\0', ''))
      }).join('\n')
      const macroOnly = (publicProps?.typeName === name || publicEmits?.typeName === name) && !/^export\s/.test(declaration) && name && !new RegExp(`\\b${name}\\b`).test(remaining)
      if (!macroOnly) types.push(declaration.replace(/^export\s+/, '').trim())
      typePattern.lastIndex = cursor + 1
    }
  }
  const referenced = Object.values(declarations).flat().join('\n') + '\n' + types.join('\n') + '\n' + Object.values(publicEmits?.events || {}).map(event => event.detailType).join('\n')
  const referenceTokens = new Tokenizer(referenced, 'javascript').tokenize().filter(token => !['WHITESPACE', 'COMMENT'].includes(token.type))
  const typeReferences = new Set(referenceTokens.filter((token, index) => {
    if (referenceTokens[index - 1]?.value === '.') return false
    const next = referenceTokens[index + 1]?.value
    return next !== ':' && !(next === '?' && referenceTokens[index + 2]?.value === ':')
  }).map(token => token.value))
  const usedImports = imports.filter(imported => (imported.binding.match(/[A-Za-z_$][\w$]*/g) || []).filter(name => !['type', 'as'].includes(name)).some(name => typeReferences.has(name)))
  for (const imported of usedImports) {
    if (imported.module.startsWith('.') || path.isAbsolute(imported.module)) throw new Error(`${file}: public method types import ${JSON.stringify(imported.module)} outside the generated package; declare these types in the component or import them from a published dependency`)
  }
  const typeImports = [...new Set(usedImports.map(imported => `import type ${imported.binding.replace(/\btype\s+/g, '')} from ${JSON.stringify(imported.module)}`))]
  return { methods, declarations, types: types.join('\n\n'), typeImports: typeImports.join('\n') }
}

function extractTemplate(source: string): string {
  const templateMatch = source.match(/<template\b(?![^>]*\bshadowrootmode\b)[^>]*>([\s\S]*?)<\/template>/i)
  const template = templateMatch ? templateMatch[1] : source
  return template
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim()
}

function extractStyles(source: string): string {
  return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    // Runtime innerHTML and SSR parsing normalize HTML newlines and replace
    // NUL before CSP checks a style. Emit those same bytes so the public
    // metadata can be hashed directly, including CRLF, lone CR and NUL input.
    .map(match => match[1].replace(/\r\n?/g, '\n').replaceAll('\u0000', '\uFFFD').trim())
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Compile the template's control flow into a render function.
 *
 * The build compiles; the runtime executes. Everything a component needs to
 * decide is decided here, in Node, and what ships is a plain JavaScript
 * function that concatenates a string. Nothing is interpreted in the browser.
 *
 * That is not only about speed. Evaluating a template at runtime means either
 * `new Function` or an interpreter, and the first is refused outright by any
 * page with a Content Security Policy worth having, which is exactly the sort
 * of page a component library is dropped into. Compiling ahead of time means a
 * component works under `script-src 'self'` with no exception carved for it.
 *
 * Handles `@if` / `@elseif` / `@else` / `@endif` and `@foreach (xs as x)`,
 * nested to any depth, plus `{{ }}` and `{!! !!}` interpolation. Anything it
 * does not recognise is left as literal text rather than guessed at, so an
 * unsupported directive is visible in the output instead of silently dropped.
 */
/**
 * What kind of thing a prop holds, read from the default it was given.
 *
 * A default is the only evidence available: the TypeScript interface that
 * declared the prop is gone by now, and guessing from the name would be worse
 * than guessing from the value. With no default at all the answer is `object`,
 * because an undeclared prop is far more often a payload than a string, and an
 * object property round-trips a string unchanged while the reverse loses the
 * structure.
 */
/**
 * The property type a component declared, or null when it declared nothing.
 *
 * Preferred over inference because it is a statement rather than a guess. A
 * union or anything exotic falls through to `object`, which round-trips a JSON
 * payload and is the safe answer for a type this does not understand.
 */
function typeFromDeclaration(declaration: string | undefined): 'string' | 'number' | 'boolean' | 'object' | null {
  if (!declaration) return null

  const type = declaration.replace(/\s*\|\s*(?:undefined|null)\b/g, '').trim()

  if (/^string$/.test(type)) return 'string'
  if (/^number$/.test(type)) return 'number'
  if (/^boolean$/.test(type)) return 'boolean'
  // A string union is still a string as far as an attribute is concerned.
  if (/^(?:'[^']*'|"[^"]*")(?:\s*\|\s*(?:'[^']*'|"[^"]*"))*$/.test(type)) return 'string'

  return 'object'
}

function inferPropertyType(fallback: string | undefined): 'string' | 'number' | 'boolean' | 'object' {
  if (fallback === undefined) return 'object'
  if (fallback === 'true' || fallback === 'false') return 'boolean'
  if (/^-?\d+(?:\.\d+)?$/.test(fallback)) return 'number'
  if (/^['"`]/.test(fallback)) return 'string'
  return 'object'
}

export function componentDirectiveExpression(source: string, open: number): { expression: string, end: number } | null {
  if (source[open] !== '(')
    return null

  let depth = 0
  let quote = ''

  for (let index = open; index < source.length; index++) {
    const char = source[index]

    if (quote !== '') {
      if (char === '\\')
        index++
      else if (char === quote)
        quote = ''
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '(') {
      depth++
    }
    else if (char === ')') {
      depth--
      if (depth === 0)
        return { expression: source.slice(open + 1, index), end: index + 1 }
    }
  }

  // Unbalanced. Left to the caller to treat as a directive without an
  // expression rather than silently swallowing the rest of the template.
  return null
}


export function parseNativeComponentLoop(expression: string): { iterable: string, key?: string, value: string } | undefined {
  const pair = /^([\s\S]+?)\s+as\s+(?:([A-Za-z_$][\w$]*)\s*=>\s*)?([A-Za-z_$][\w$]*)$/.exec(expression.trim())
  return pair ? { iterable: pair[1]!, key: pair[2], value: pair[3]! } : undefined
}

function compileTemplateToRender(template: string, handlers: string[]): string {
  const parts: string[] = []
  let cursor = 0

  // The comment form is stripped rather than emitted: it is a note to whoever
  // reads the component, not to whoever loads the page.
  const source = template.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  const directive = /@(if|elseif|else|endif|foreach|endforeach)\s*/g
  let match: RegExpExecArray | null

  /**
   * The expression inside a directive's parentheses.
   *
   * Scanned by balancing parentheses, the way the page renderer's loop parser
   * already does. A lazy `\(([\s\S]*?)\)` stops at the FIRST `)`, so any
   * expression that calls something was cut in half: `@foreach(page().metrics
   * as metric)` yielded `page(`, which is not a loop header, so the directive
   * was emitted as literal text and its `@endforeach` closed a block nothing
   * had opened - and the component failed to compile with "Unexpected }",
   * naming the file and nothing else. `@if(ready())` became `if (ready( ) {`.
   *
   * Quotes are tracked so a `)` inside a string is not counted, which is what
   * lets `@if(suffix === ')')` through.
   */

  const text = (raw: string): void => {
    if (raw === '') return
    // Interpolation splits the literal, so the pieces around it are emitted as
    // string constants and the expressions as real JavaScript.
    let index = 0
    const interpolation = /\{!!\s*([\s\S]*?)\s*!!\}|\{\{\s*([\s\S]*?)\s*\}\}|(data-stx-on-[\w:-]+=")(\d+)(")/g
    let hit: RegExpExecArray | null
    while ((hit = interpolation.exec(raw))) {
      if (hit.index > index) parts.push(`out += ${JSON.stringify(raw.slice(index, hit.index))};`)
      // `{!! !!}` is the author saying "this is markup". `{{ }}` is the author
      // saying "this is a value", and a value is escaped, always.
      parts.push(hit[3] !== undefined
        ? `out += ${JSON.stringify(hit[3])} + (this._handlers.push(${handlers[Number(hit[4])]}) - 1) + ${JSON.stringify(hit[5])};`
        : hit[1] !== undefined
          ? `out += __raw(${hit[1]});`
          : `out += __escape(${hit[2]});`)
      index = hit.index + hit[0].length
    }
    if (index < raw.length) parts.push(`out += ${JSON.stringify(raw.slice(index))};`)
  }

  while ((match = directive.exec(source))) {
    text(source.slice(cursor, match.index))
    cursor = match.index + match[0].length

    // `@else`, `@endif` and `@endforeach` take no expression, so a `(` that
    // happens to follow one is markup and stays markup.
    const takesExpression = match[1] === 'if' || match[1] === 'elseif' || match[1] === 'foreach'
    const parsed = takesExpression ? componentDirectiveExpression(source, cursor) : null

    if (parsed) {
      cursor = parsed.end
      directive.lastIndex = parsed.end
    }

    const expression = parsed?.expression

    switch (match[1]) {
      case 'if':
        parts.push(`if (${expression}) {`)
        break
      case 'elseif':
        parts.push(`} else if (${expression}) {`)
        break
      case 'else':
        parts.push('} else {')
        break
      case 'endif':
      case 'endforeach':
        parts.push('}')
        break
      case 'foreach': {
        // `xs as x` and `xs as key => value`, which is the form the templates
        // use. Written as a for-of over entries so an object iterates as
        // happily as an array; a loop that only works on arrays is a trap the
        // author finds at runtime.
        const pair = parseNativeComponentLoop(expression || '')
        if (!pair) {
          parts.push(`out += ${JSON.stringify(match[0] + (parsed ? `(${expression})` : ''))};`)
          break
        }
        const { iterable, key, value } = pair
        parts.push(key
          ? `for (const [${key}, ${value}] of __entries(${iterable})) {`
          : `for (const ${value} of __values(${iterable})) {`)
        break
      }
    }
  }

  text(source.slice(cursor))

  return parts.join('\n    ')
}

/** Keep real module imports from every authored script, including method blocks. */
function hoistScriptImports(code: string): { imports: string[], body: string } {
  const masked = stripCommentsAndLiterals(code)
  const depths = bracketDepths(masked).depths
  const imports: string[] = []
  const spans: Array<{ start: number, end: number }> = []
  for (const match of masked.matchAll(/\bimport\b/g)) {
    const start = match.index!
    if (depths[start] !== 0) continue
    // Use source tokens, keeping the declaration verbatim. Comment punctuation
    // is not syntax, and a string-named binding is not the module specifier.
    const tokens = new Tokenizer(code.slice(start)).tokenize().filter(token => !['COMMENT', 'WHITESPACE'].includes(token.type))
    // Dynamic import() and import.meta are expressions, not declarations.
    if (tokens[1]?.value === '(' || tokens[1]?.value === '.') continue
    let specifierIndex = tokens[1]?.type === 'STRING' ? 1 : -1
    let depth = 0
    for (let index = 1; specifierIndex === -1 && index < tokens.length; index++) {
      const token = tokens[index]!
      if (token.value === ';' || token.type === 'EOF') break
      if (token.value === '{') depth++
      else if (token.value === '}') depth--
      else if (depth === 0 && token.value === 'from' && tokens[index + 1]?.type === 'STRING') specifierIndex = index + 1
    }
    if (specifierIndex === -1) continue
    const specifier = tokens[specifierIndex]!
    let last = specifierIndex
    if (tokens[last + 1]?.value === 'with' && tokens[last + 2]?.value === '{') {
      last += 2
      let attributesDepth = 1
      while (attributesDepth && tokens[last + 1]?.type !== 'EOF') {
        last++
        if (tokens[last]?.value === '{') attributesDepth++
        else if (tokens[last]?.value === '}') attributesDepth--
      }
    }
    if (tokens[last + 1]?.value === ';') last++
    const end = start + tokens[last]!.end
    spans.push({ start, end })
    if (!['stx', '@stacksjs/stx'].includes(specifier.value.slice(1, -1))) imports.push(code.slice(start, end))
  }
  let body = code
  for (const span of spans.reverse()) body = body.slice(0, span.start) + body.slice(span.end)
  return { imports, body }
}

/**
 * Carry the component's computed values into the element.
 *
 * A component's script is where its thinking lives: the formatted total, the
 * colour that says whether a number moved the right way, the geometry of a
 * path. Dropping it and keeping only the markup, which is what this build did
 * before, leaves a component that can display a value but cannot derive one,
 * and every real component derives something.
 *
 * Top-level `const` and `let` declarations become the scope the template reads.
 * Imports are hoisted to the generated module so a component can share helpers
 * with the rest of a codebase rather than restating them, which is the whole
 * reason to write the component in stx and not in the consuming language.
 *
 * `defineProps` / `withDefaults` are recognised and removed: they declare the
 * element's public surface, which is already expressed as properties, and
 * leaving the call in would reference an import that does not exist at runtime.
 */
function compileScriptScope(source: string): {
  imports: string[]
  body: string
  propNames: string[]
  propBindings: Record<string, string>
  defaults: Record<string, string>
  declared: Record<string, string>
  apis: string[]
} {
  const scripts = scanHtmlScriptElements(componentScriptSource(source))
  const blocks = scripts.filter(script => { const attrs = scriptAttributes(script.attrs); return scriptContainsCode(attrs) && !['component', 'stx:component', 'server', 'src'].some(name => attrs.has(name)) })

  if (!blocks.length) return { imports: [], body: '', propNames: [], propBindings: {}, defaults: {}, declared: {}, apis: [] }

  let code = blocks.map(block => source.slice(block.bodyStart, block.bodyEnd)).join('\n')
  const imports: string[] = []
  const propNames: string[] = []
  const propBindings: Record<string, string> = Object.create(null)
  const defaults: Record<string, string> = Object.create(null)
  /** Prop name to the TypeScript type the component declared for it. */
  const declared: Record<string, string> = Object.create(null)

  const hoisted = hoistScriptImports(code)
  imports.push(...hoisted.imports)
  code = hoisted.body

  // The props declaration tells us the public surface and the defaults, in
  // whichever form it is written, and is then removed rather than compiled: it
  // declares a surface already expressed as properties, and leaving the call in
  // would reference an import that does not exist at runtime.
  //
  // The statement is found by balanced scanning rather than by one regex. The
  // regex required both a destructuring assignment and an explicit type
  // argument, so four of the five documented spellings matched nothing and the
  // component silently had no public surface (stacksjs/stx#2009).
  const props = parsePropsDeclaration(code)
  if (props) {
    propNames.push(...props.propNames)
    Object.assign(propBindings, props.propBindings)
    Object.assign(defaults, props.defaults)
    Object.assign(declared, props.declared)
    code = code.replace(props.text, props.identifier ? `const ${props.identifier} = this._props();` : '')
  }

  /*
   * Read the declared types before the interface is stripped.
   *
   * This is the only place a prop's type is actually stated. Inferring it from
   * a default guesses, and guesses wrongly for the common case: a `title?:
   * string` has no default, so it was typed as an object, and the attribute
   * "Revenue" was then JSON-parsed, failed, and rendered as [object Object] on
   * the page. The interface says `string`; there is no reason to guess.
   */
  if (props?.typeName) {
    const type = localType(code, props.typeName)
    if (type) {
      for (const member of splitTopLevel(type.slice(1, -1), ';,\n', true)) {
        const parsed = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:\s*([\s\S]+)$/.exec(member)
        if (!parsed) continue
        declared[parsed[1]!] = parsed[2]!.trim()
        if (!propNames.includes(parsed[1]!)) propNames.push(parsed[1]!)
      }
    }
  }

  const emits = parseEmitsDeclaration(code)
  if (emits) code = code.replace(emits.text, 'this._emitScope.bind(this)')
  // Public script exports become declarations in the generated lexical scope.
  const publicMask = stripCommentsAndLiterals(code)
  const publicDepths = bracketDepths(publicMask).depths
  for (const match of [...publicMask.matchAll(/\bexport\s+(?=(?:interface|type|const|let|var|async|function)\b)/g)].reverse()) {
    if (publicDepths[match.index!] === 0) code = code.slice(0, match.index!) + ' '.repeat(match[0].length) + code.slice(match.index! + match[0].length)
  }

  // Returned as TypeScript, deliberately unbuilt. Transpiling the script on its
  // own hands the compiler a set of declarations nothing reads, and it removes
  // them as dead: the template that uses them has not been attached yet. The
  // two are built together further down, where `const doubled = total * 2` is
  // visibly used by the line that prints it and survives.
  const locals = new Set(topLevelDeclarationSites(code).map(site => site.name))
  const masked = stripCommentsAndLiterals(code)
  const apis = ['state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy'].filter(name => !locals.has(name) && new RegExp(`\\b${name}\\s*(?:<|\\()`).test(masked))
  return { imports, body: code.trim(), propNames, propBindings, defaults, declared, apis }
}

function compileEventDirectives(template: string): { template: string, eventTypes: string[], handlers: string[] } {
  const eventTypes = new Set<string>()
  const handlers: string[] = []
  const compiled = template.replace(
    /\s@([a-z][\w:-]*)(\.[\w.-]+)?\s*=\s*(["'])([\s\S]*?)\3/gi,
    (_match, eventName: string, modifiers: string | undefined, _quote: string, expression: string) => {
      const event = eventName.toLowerCase()
      eventTypes.add(event)
      const normalizedModifiers = (modifiers || '').split('.').filter(Boolean).join(' ')
      const id = handlers.length
      // Expressions are compiled here, never read back and executed as strings.
      handlers.push(/^[A-Za-z_$][\w$]*$/.test(expression.trim())
        ? `($event) => (typeof ${expression} === 'function' ? ${expression} : this[${JSON.stringify(expression.trim())}]).call(this, $event)` : `($event) => { ${expression} }`)
      return ` data-stx-on-${event}="${id}"${normalizedModifiers ? ` data-stx-mod-${event}="${normalizedModifiers}"` : ''}`
    },
  )
  return { template: compiled, eventTypes: [...eventTypes].sort(), handlers }
}

function compileDynamicBindings(template: string): {
  template: string
  bindings: Array<{ id: number, name: string, expression: string }>
} {
  const bindings: Array<{ id: number, name: string, expression: string }> = []
  const compiled = template.replace(
    /\s:([a-z][\w:-]*)\s*=\s*(["'])([\w$.]+)\2/gi,
    (_match, name: string, _quote: string, expression: string) => {
      const id = bindings.length
      bindings.push({ id, name, expression })
      return ` data-stx-bind-${id}=""`
    },
  )
  return { template: compiled, bindings }
}

function extractSlots(template: string): Array<{ name: string }> {
  const names = new Set<string>()
  for (const match of template.matchAll(/<slot\b([^>]*)>/gi)) {
    names.add(match[1].match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1] || '')
  }
  return [...names].map(name => ({ name }))
}

function extractCssProperties(styles: string): Array<{ name: string }> {
  return [...new Set([...styles.matchAll(/(--[a-z0-9_-]+)\s*:/gi)].map(match => match[1]))]
    .sort()
    .map(name => ({ name }))
}

function normalizeProperty(name: string, property: ComponentLibraryProperty): ComponentLibraryProperty {
  const supported = new Set(['string', 'number', 'boolean', 'object', 'array'])
  if (!property || !supported.has(property.type)) {
    throw new Error(`Property "${name}" must declare one of: string, number, boolean, object, array`)
  }
  return {
    ...property,
    reflect: property.reflect ?? property.attribute !== false,
  }
}

async function compileComponent(
  inputDir: string,
  entry: ComponentLibraryComponent,
  defaults: Pick<ComponentLibraryConfig, 'prefix' | 'shadowDOM' | 'progressive' | 'outputDir'>,
): Promise<CompiledComponent> {
  const sourcePath = path.isAbsolute(entry.file) ? entry.file : path.resolve(inputDir, entry.file)
  const source = await readFile(sourcePath, 'utf8')
  const metadata = parseMetadata(source, sourcePath)
  const baseName = path.basename(sourcePath, '.stx')
  const name = entry.name || metadata.name || toPascalCase(baseName)
  const inferredTag = `${toKebabCase(defaults.prefix || 'stx')}-${toKebabCase(baseName)}`
  const tag = entry.tag || metadata.tag || inferredTag

  if (!name || !/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`${sourcePath}: invalid component class name "${name}"`)
  if (!validCustomElementTag(tag)) throw new Error(`${sourcePath}: invalid custom-element tag "${tag}"; tags must be lowercase and contain a hyphen`)

  const propertyInput = entry.properties || metadata.properties || metadata.props || {}
  const properties = Object.fromEntries(
    Object.entries(propertyInput).map(([propertyName, property]) => [propertyName, normalizeProperty(propertyName, property)]),
  )
  const eventCompilation = compileEventDirectives(extractTemplate(source))
  const bindingCompilation = compileDynamicBindings(eventCompilation.template)
  const scope = compileScriptScope(source)
  for (const script of scanHtmlScriptElements(componentScriptSource(source))) {
    const attrs = scriptAttributes(script.attrs)
    if (!attrs.has('client') || ['server', 'component', 'stx:component', 'src'].some(name => attrs.has(name)) || !scriptContainsCode(attrs)) continue
    scope.imports.push(...hoistScriptImports(source.slice(script.bodyStart, script.bodyEnd)).imports)
  }
  scope.imports = [...new Set(scope.imports)]
  const render = compileTemplateToRender(bindingCompilation.template, eventCompilation.handlers)

  // A prop declared with defineProps is part of the element's public surface,
  // so it becomes a real property here. Without this the component compiles
  // perfectly and then reads undefined for everything, because assigning to an
  // undeclared name stores a value the element never looks at: a failure that
  // looks like the compiler is broken when it is the declaration that is
  // missing. Anything named explicitly in the component's own metadata wins,
  // since that is the author being deliberate.
  for (const propertyName of scope.propNames) {
    if (properties[propertyName]) continue
    const fallback = scope.defaults[propertyName]
    properties[propertyName] = normalizeProperty(propertyName, {
      type: typeFromDeclaration(scope.declared[propertyName]) ?? inferPropertyType(fallback),
      ...(fallback === undefined ? {} : { default: literalValue(fallback) }),
    })
  }
  const metadataMethods = metadata.methods || {}
  const configuredMethods = entry.methods || {}
  const extractedMethods = extractClientMethods(source, sourcePath)

  return {
    file: path.relative(inputDir, sourcePath),
    sourcePath,
    name,
    tag,
    description: entry.description || metadata.description || '',
    template: bindingCompilation.template,
    styles: extractStyles(source),
    shadowMode: normalizeShadowMode(entry.shadowDOM ?? metadata.shadowDOM ?? defaults.shadowDOM),
    progressive: entry.progressive ?? metadata.progressive ?? defaults.progressive ?? true,
    properties,
    events: { ...(parseEmitsDeclaration(scanHtmlScriptElements(componentScriptSource(source)).filter(script => { const attrs = scriptAttributes(script.attrs); return scriptContainsCode(attrs) && !['server', 'component', 'stx:component', 'src'].some(name => attrs.has(name)) }).map(script => source.slice(script.bodyStart, script.bodyEnd)).join('\n'))?.events || {}), ...(entry.events || metadata.events || {}) },
    methods: { ...metadataMethods, ...configuredMethods, ...extractedMethods.methods },
    methodDeclarations: extractedMethods.declarations,
    declarationTypes: extractedMethods.types,
    declarationImports: extractedMethods.typeImports,
    eventTypes: eventCompilation.eventTypes,
    handlers: eventCompilation.handlers,
    scopeMethods: Object.keys(extractedMethods.methods),
    bindings: bindingCompilation.bindings,
    slots: extractSlots(bindingCompilation.template),
    cssProperties: extractCssProperties(extractStyles(source)),
    scope,
    render,
  }
}

function runtimeModule(signals = false): string {
  const rawInterpolation = JSON.stringify('\\{!!\\s*([\\w$.]+)\\s*!!\\}')
  const escapedInterpolation = JSON.stringify('\\{\\{\\s*([\\w$.]+)\\s*\\}\\}')
  return `${signals ? `import { state as nativeState, derived as nativeDerived, effect as nativeEffect, batch as nativeBatch } from './signals.js';\n` : ''}const HTMLElementBase = globalThis.HTMLElement || class {};

const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const valueAt = (host, path) => {
  const parts = path.trim().split('.');
  if (parts[0] === 'this') parts.shift();
  if (!parts.length) return host;
  const first = parts.shift();
  // Render bindings read declared props, including attributes whose names
  // also belong to the native DOM API. The public element keeps that API.
  let value = host._values && Object.prototype.hasOwnProperty.call(host._values, first)
    ? host._values[first]
    : host[first];
  for (const part of parts) value = value?.[part];
  return typeof value === 'function' ? value.call(host) : value;
};

const deserialize = (value, type, fallback) => {
  if (value === null) return type === 'boolean' ? false : fallback;
  if (type === 'boolean') return value !== 'false' && value !== '0';
  if (type === 'number') return Number(value);
  if (type === 'object' || type === 'array') {
    try { return JSON.parse(value); }
    catch { return fallback; }
  }
  return value;
};

const serialize = (value, type) => {
  if (value == null || value === false) return null;
  if (type === 'boolean') return '';
  if (type === 'object' || type === 'array') return JSON.stringify(value);
  return String(value);
};

const cloneDefault = (value, type) => {
  if (value == null || (type !== 'object' && type !== 'array')) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const defaultFor = property => cloneDefault(
  property.default ?? ({ string: '', number: 0, boolean: false, object: {}, array: [] })[property.type],
  property.type,
);

export class StxElement extends HTMLElementBase {
  static definition = {};
  static get observedAttributes() { return this.definition.observedAttributes || []; }

  constructor() {
    super();
    this._values = Object.create(null);
    this._reflecting = false;
    this._connected = false;
    this._hasConnected = false;
    this._initializing = false;
    this._updatePending = false;
    this._listeners = new Map();
    this._scopeStates = [];
    this._scopeDerived = [];
    this._scopeEffects = [];
    this._scopeSubscriptions = [];
    this._scopeMounts = [];
    this._scopeDestroys = [];
    this._scopeConnectionDestroys = [];
    this._scopeMountCleanups = [];
    const definition = this.constructor.definition;
    for (const [name, property] of Object.entries(definition.properties || {})) {
      this._values[name] = defaultFor(property);
    }
    if (definition.shadowMode && this.attachShadow && !this.shadowRoot) {
      this._closedRoot = this.attachShadow({ mode: definition.shadowMode });
    }
  }

  get updateComplete() { return this._updateComplete || Promise.resolve(); }
  get renderRoot() { return this._closedRoot || this.shadowRoot || this; }

  connectedCallback() {
    if (this._connected) return;
    this._connected = true;
    this._initializing = true;
    const definition = this.constructor.definition;
    for (const [name, property] of Object.entries(definition.properties || {})) {
      const attribute = property.attribute === false ? null : (property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));
      if (attribute && this.hasAttribute?.(attribute)) this._values[name] = deserialize(this.getAttribute(attribute), property.type, defaultFor(property));
    }
    // Properties assigned before customElements.define() become own properties.
    // Upgrade them after attributes so imperative state wins, matching the
    // platform's property-first custom-element initialization convention.
    for (const name of Object.keys(definition.properties || {})) this._upgradeProperty(name);
    this._initializing = false;
    const root = this.renderRoot;
    const hasMarkup = [...(root.childNodes || [])].some(node => node.nodeType !== 3 || node.textContent.trim());
    const firstConnection = !this._hasConnected;
    if (!(firstConnection && definition.progressive && hasMarkup)) this._render();
    else {
      if (typeof this.render === 'function') this.render(RENDER_HELPERS);
      this._upgradeDeclarativeEvents();
    }
    this._bindEvents();
    if (firstConnection) {
      this._hasConnected = true;
      this.setAttribute?.('hydrated', '');
      this.dispatchEvent?.(new CustomEvent('stx:hydrated', { bubbles: true, composed: true }));
    }
    // Called last, so a component that acquires something sees its own rendered
    // markup and its events already bound. Reported rather than rethrown: a
    // component that fails to set up must not take the element down with it.
    this._runScopeMounts();
    try { this.onConnect?.(); }
    catch (error) { console.error('[stx] onConnect failed', error); }
  }

  disconnectedCallback() {
    this._connected = false;
    // Called before the framework releases anything, so the element is still
    // intact for a component that needs to read it on the way out, and inside
    // try/finally so a throwing hook cannot leak the framework's own listeners.
    try { this.onDisconnect?.(); }
    catch (error) { console.error('[stx] onDisconnect failed', error); }
    finally {
      this._disposeScopeEffects();
      for (const dispose of this._scopeSubscriptions.splice(0)) {
        try { dispose?.(); } catch (error) { console.error('[stx] scope subscription cleanup failed', error); }
      }
      for (const cleanup of [...this._scopeDestroys.splice(0), ...this._scopeConnectionDestroys.splice(0), ...this._scopeMountCleanups.splice(0)]) {
        try { cleanup(); } catch (error) { console.error('[stx] scope cleanup failed', error); }
      }
      for (const [event, listener] of this._listeners) this.renderRoot.removeEventListener(event, listener);
      this._listeners.clear();
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue || this._reflecting) return;
    const definition = this.constructor.definition;
    const name = definition.attributeToProperty?.[attribute];
    if (!name) return;
    const property = definition.properties[name];
    const value = deserialize(newValue, property.type, defaultFor(property));
    if (!Object.is(this._values[name], value)) {
      this._values[name] = value;
      this.requestUpdate();
    }
  }

  /**
   * The props a compiled render reads.
   *
   * Its own method rather than _values directly, so a component that sets a
   * property before upgrade still sees it, and so the generated code has one
   * name to depend on rather than a private field's shape.
   */
  _props() {
    return this._values;
  }

  requestUpdate() {
    if (!this._connected || this._initializing || this._updatePending) return this.updateComplete;
    this._updatePending = true;
    this._updateComplete = new Promise((resolve) => {
      queueMicrotask(() => {
        this._updatePending = false;
        if (this._connected) this._render();
        resolve();
      });
    });
    return this._updateComplete;
  }

  emit(name, detail, options = {}) {
    return this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true, ...options,
    }));
  }

  _disposeScopeEffects() {
    for (const dispose of this._scopeEffects.splice(0)) {
      try { dispose(); } catch (error) { console.error('[stx] effect cleanup failed', error); }
    }
  }

  _runScopeMounts() {
    for (const mount of this._scopeMounts) {
      try { const cleanup = mount(); if (typeof cleanup === 'function') this._scopeMountCleanups.push(cleanup); }
      catch (error) { console.error('[stx] onMount failed', error); }
    }
  }

${signals ? `  _beginScope() {
    this._disposeScopeEffects();
    this._scopeMounts = [];
    this._scopeDestroys = [];
    let stateIndex = 0, derivedIndex = 0;
    let rendering = true;
    return {
      finish: () => { rendering = false; },
      state: (initial) => {
        const index = stateIndex++;
        const value = this._scopeStates[index] ||= nativeState(initial);
        if (this._connected && !this._scopeSubscriptions[index]) this._scopeSubscriptions[index] = value.subscribe(() => this.requestUpdate());
        return value;
      },
      derived: (compute, options) => {
        const index = derivedIndex++;
        let entry = this._scopeDerived[index];
        if (!entry) {
          entry = { compute, revision: nativeState(0) };
          entry.value = nativeDerived(() => { entry.revision(); return entry.compute(); }, options);
          this._scopeDerived[index] = entry;
        } else {
          entry.compute = compute;
          entry.revision.update(value => value + 1);
        }
        return entry.value;
      },
      effect: (callback, options) => {
        const dispose = nativeEffect(callback, options);
        this._scopeEffects.push(dispose);
        return dispose;
      },
      batch: nativeBatch,
      onMount: callback => this._scopeMounts.push(callback),
      onDestroy: callback => (rendering ? this._scopeDestroys : this._scopeConnectionDestroys).push(callback),
    };
  }

` : ''}  _emitScope(name, ...args) {
    return this.emit(name, args.length === 1 ? args[0] : args, { cancelable: true });
  }

  _callScopeMethod(name, args) {
    if (!this._scopeMethods || this._updatePending) this.render(RENDER_HELPERS);
    return this._scopeMethods[name].apply(this, args);
  }

  _upgradeProperty(name) {
    if (!Object.prototype.hasOwnProperty.call(this, name)) return;
    const value = this[name];
    delete this[name];
    this[name] = value;
  }

  _upgradeDeclarativeEvents() {
    for (const element of this.renderRoot.querySelectorAll?.('*') || []) {
      const names = element.getAttributeNames?.() || [...(element.attributes || [])].filter(Boolean).map(attribute => attribute.name);
      for (const attributeName of names) {
        if (!attributeName?.startsWith('@')) continue;
        const [event, ...modifiers] = attributeName.slice(1).split('.');
        element.setAttribute('data-stx-on-' + event, element.getAttribute(attributeName));
        if (modifiers.length) element.setAttribute('data-stx-mod-' + event, modifiers.join(' '));
        element.removeAttribute(attributeName);
      }
    }
  }

  _bindEvents() {
    for (const event of this.constructor.definition.eventTypes || []) {
      if (this._listeners.has(event)) continue;
      const listener = ($event) => {
        const selector = '[data-stx-on-' + event + ']';
        const target = $event.target?.closest?.(selector);
        if (!target || !this.renderRoot.contains(target)) return;
        const modifiers = (target.getAttribute('data-stx-mod-' + event) || '').split(' ');
        if (modifiers.includes('self') && target !== $event.target) return;
        if (modifiers.includes('prevent')) $event.preventDefault();
        if (modifiers.includes('stop')) $event.stopPropagation();
        const method = target.getAttribute('data-stx-on-' + event);
        if (this._handlers?.[method]) this._handlers[method]($event);
        else if (typeof this[method] === 'function') this[method]($event);
      };
      this.renderRoot.addEventListener(event, listener);
      this._listeners.set(event, listener);
    }
  }

  _render() {
    const definition = this.constructor.definition;
    const root = this.renderRoot;
    const active = root.activeElement || (root.contains?.(globalThis.document?.activeElement) ? globalThis.document.activeElement : null);
    const focusAttribute = active?.getAttribute?.('data-key') ? 'data-key' : active?.id ? 'id' : 'name';
    const focusKey = active?.getAttribute?.(focusAttribute);
    const focusValue = focusAttribute === 'name' && active?.type === 'radio' ? active.value : null;
    const selectionStart = active?.selectionStart, selectionEnd = active?.selectionEnd;
    const selection = Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)
      ? [selectionStart, selectionEnd, active.selectionDirection] : null;
    // A compiled component renders itself: the control flow and the derived
    // values were turned into JavaScript at build time, so there is nothing to
    // interpret here and nothing that needs an eval the page's CSP forbids.
    // The string template remains for components that carry no logic.
    let html = typeof this.render === 'function'
      ? this.render(RENDER_HELPERS)
      : definition.template
        .replace(new RegExp(${rawInterpolation}, 'g'), (_match, expression) => String(valueAt(this, expression) ?? ''))
        .replace(new RegExp(${escapedInterpolation}, 'g'), (_match, expression) => escapeHTML(valueAt(this, expression)));
    if (definition.shadowMode && definition.styles) html = '<style>' + definition.styles + '</style>' + html;
    root.innerHTML = html;
    this._applyBindings();
    this._bindEvents();
    if (focusKey) {
      const escaped = globalThis.CSS?.escape ? globalThis.CSS.escape(focusKey) : focusKey.replace(/["\\\\]/g, '\\$&');
      const selector = '[' + focusAttribute + '="' + escaped + '"]';
      // Name-only radio groups share a name, but their chosen member must stay focused.
      const next = focusValue === null ? root.querySelector(selector)
        : [...root.querySelectorAll(selector)].find(element => element.type === 'radio' && element.value === focusValue);
      next?.focus?.();
      // Several input types expose this method but reject text selection. A
      // rerender can also change a text input into one of those types.
      if (selection && Number.isInteger(next?.selectionStart) && Number.isInteger(next?.selectionEnd) && typeof next?.setSelectionRange === 'function')
        next.setSelectionRange(selection[0], selection[1], selection[2] || 'none');
    }
    this.dispatchEvent?.(new CustomEvent('stx:updated', { bubbles: false }));
  }

  _applyBindings() {
    for (const binding of this.constructor.definition.bindings || []) {
      const element = this.renderRoot.querySelector('[data-stx-bind-' + binding.id + ']');
      if (!element) continue;
      const value = valueAt(this, binding.expression);
      if (binding.name === 'class') element.className = value || '';
      else if (binding.name === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      }
      else if (typeof value === 'boolean') {
        element.toggleAttribute(binding.name, value);
        if (binding.name in element) element[binding.name] = value;
      }
      else if (value == null || value === false) element.removeAttribute(binding.name);
      else element.setAttribute(binding.name, String(value));
    }
  }
}

/**
 * What a compiled render is handed.
 *
 * Passed in rather than closed over so the generated code names no globals, and
 * a component module stays readable on its own: __escape is visibly a
 * parameter, not something the bundler happened to leave in scope.
 */
const RENDER_HELPERS = {
  escape: escapeHTML,
  // The raw form is the author declaring the value is markup. Null becomes an
  // empty string rather than the word "null", which is the only sensible
  // reading of a missing fragment.
  raw: (value) => String(value ?? ''),
  // A loop over something absent runs zero times. Throwing here would fail a
  // whole page over one empty list, which is never what the author meant.
  values: (value) => value == null ? [] : (value[Symbol.iterator] ? value : Object.values(value)),
  entries: (value) => value == null ? [] : (Array.isArray(value) ? value.entries() : Object.entries(value)),
};

export function defineComponent(Component, definition) {
  const properties = definition.properties || {};
  const attributeToProperty = {};
  const observedAttributes = [];
  for (const [name, property] of Object.entries(properties)) {
    const attribute = property.attribute === false ? null : (property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));
    if (attribute) {
      attributeToProperty[attribute] = name;
      observedAttributes.push(attribute);
    }
    // A style prop is an attribute value, not a replacement for the browser's
    // CSSStyleDeclaration. Native event handler accessors must survive too.
    if (name in HTMLElementBase.prototype) {
      if (!attribute) throw new TypeError('STX prop "' + name + '" overlaps the native DOM API and needs an attribute binding');
      continue;
    }
    Object.defineProperty(Component.prototype, name, {
      configurable: true,
      enumerable: true,
      get() { return this._values[name]; },
      set(value) {
        const oldValue = this._values[name];
        if (Object.is(oldValue, value)) return;
        this._values[name] = value;
        if (property.reflect && attribute && !this._reflecting) {
          const serialized = serialize(value, property.type);
          this._reflecting = true;
          if (serialized === null) this.removeAttribute(attribute);
          else this.setAttribute(attribute, serialized);
          this._reflecting = false;
        }
        this.requestUpdate();
        this.dispatchEvent?.(new CustomEvent(name + '-changed', {
          detail: { value, oldValue }, bubbles: true, composed: true,
        }));
      },
    });
  }
  Component.definition = { ...definition, attributeToProperty, observedAttributes };
  const registry = globalThis.customElements || globalThis.window?.customElements;
  if (registry && !registry.get(definition.tag)) {
    registry.define(definition.tag, Component);
  }
  return Component;
}
`
}

function componentModule(component: CompiledComponent, runtimeImport = './runtime.js'): string {
  const definition = JSON.stringify({
    tag: component.tag,
    template: component.template,
    styles: component.styles,
    shadowMode: component.shadowMode,
    progressive: component.progressive,
    properties: component.properties,
    eventTypes: component.eventTypes,
    bindings: component.bindings,
  }, null, 2)
  const methodCode = Object.entries(component.methods).map(([name, body]) => {
    if (RESERVED_METHODS.has(name)) throw new Error(`${component.sourcePath}: ${reservedMethodMessage(name)}`)
    if (/^(?:async\s+)?[A-Za-z_$][\w$]*\s*\(/.test(body.trim())) return `  ${body.trim()}`
    return `  ${name}($event) {\n${body}\n  }`
  }).join('\n\n')

  const scope = component.scope
  const localNames = new Set(new Tokenizer([scope.body, ...scope.imports, ...Object.keys(component.properties), ...Object.values(scope.propBindings)].join('\n')).tokenize().map(token => token.value))
  let scopeOwner = '__stxScope'
  while (localNames.has(scopeOwner)) scopeOwner += '$'

  // Every declared property, not only the ones defineProps named. A component
  // may declare its surface in script metadata instead, and those templates
  // reference the prop by bare name exactly the same way; destructuring only
  // the defineProps set leaves the others as free identifiers and the render
  // throws a ReferenceError for a prop that is declared and working.
  const destructured = [...new Set([...Object.keys(component.properties), ...scope.propNames])]
    .map(name => {
      const binding = scope.propBindings[name] || name
      return scope.defaults[name] === undefined ? binding : `${binding} = ${scope.defaults[name]}`
    })
    .join(', ')
  const indent = (code: string): string =>
    code.split('\n').map(line => line.trim() === '' ? line : `    ${line}`).join('\n')

  // A component with no control flow and no script keeps the string template it
  // had before, so a purely presentational element gains nothing it does not
  // use and nothing that already worked changes shape.
  let renderMethod = ''

  if (component.render.trim() !== '' || scope.body !== '' || destructured !== '') {
    const inner = [
      scope.apis.length ? `const ${scopeOwner} = this._beginScope();\nconst { ${scope.apis.join(', ')} } = ${scopeOwner};` : '',
      destructured ? `const { ${destructured} } = this._props();` : '',
      scope.body,
      component.scopeMethods.length ? `this._scopeMethods = { ${component.scopeMethods.join(', ')} };` : '',
      component.handlers.length ? 'this._handlers = [];' : '',
      `let out = '';`,
      component.render,
      scope.apis.length ? `${scopeOwner}.finish();` : '',
      'return out;',
    ].filter(Boolean).join('\n')

    // Wrapped in an exported function before it is transpiled, for two
    // reasons that both bite silently. A bare statement list is treated as a
    // module body, so `this` is rewritten to `exports` and the element's own
    // props accessor stops resolving; and nothing in that body is reachable
    // from an export, so the compiler removes the derived values as dead code
    // and the render prints undefined for every one of them. Inside an
    // exported function, `this` is left alone and every declaration is kept.
    let compiled: string
    try {
      const wrapped = new Bun.Transpiler({ loader: 'ts' })
        .transformSync(`export function __render(__helpers) {\n${inner}\n}`)
      const opening = wrapped.indexOf('{')
      const closing = wrapped.lastIndexOf('}')
      compiled = wrapped.slice(opening + 1, closing).trim()
    }
    catch (error) {
      throw new Error(`${component.sourcePath}: failed to compile render (${(error as Error).message})`)
    }

    renderMethod = `
  render(__helpers) {
    const { escape: __escape, raw: __raw, values: __values, entries: __entries } = __helpers;
${indent(compiled.trim())}
  }
`
  }

  return `import { StxElement, defineComponent } from ${runtimeImport === './runtime.js' ? "'./runtime.js'" : JSON.stringify(runtimeImport)};
${scope.imports.length ? `${scope.imports.join('\n')}\n` : ''}
/** ${component.description || `${component.name} web component generated from ${component.file}.`} */
export class ${component.name} extends StxElement {
${methodCode}${renderMethod}
}

defineComponent(${component.name}, ${definition});
export default ${component.name};
`
}

export function typeForProperty(property: ComponentLibraryProperty): string {
  if (!property || typeof property !== 'object') return 'unknown'
  switch (property.type) {
    case 'boolean': return 'boolean'
    case 'number': return 'number'
    case 'array': return 'unknown[]'
    case 'object': return 'Record<string, unknown>'
    default: return 'string'
  }
}

function componentDeclaration(component: CompiledComponent): string {
  // Authored support types keep their names in a private scope. In particular,
  // a tuple map named FooEventMap must never merge with the DOM FooEventMap.
  const authoredTypes = [component.declarationTypes, component.declarationImports, component.name, ...Object.values(component.methodDeclarations).flat(), ...Object.values(component.events).map(event => event.detailType)].join('\n')
  const identifiers = new Set(new Tokenizer(authoredTypes).tokenize().map(token => token.value))
  const unique = (base: string): string => { let name = base; while (identifiers.has(name)) name += '$'; identifiers.add(name); return name }
  const support = unique('__StxSupport'), publicMethods = unique('__Methods'), eventDetails = unique('__Details')
  const scoped = !!component.declarationTypes
  const props = Object.entries(component.properties).map(([name, property]) =>
    `  ${name}${property.required ? '' : '?'}: ${typeForProperty(property)}`,
  ).join('\n')
  const events = Object.entries(component.events).map(([name, event]) =>
    `  ${JSON.stringify(name)}: CustomEvent<${scoped ? `${support}.${eventDetails}[${JSON.stringify(name)}]` : event.detailType || 'unknown'}>`).join('\n')
  const methods = Object.keys(component.methods).flatMap(name => component.methodDeclarations[name] || [`${name}($event?: Event): unknown`]).map(signature => `  ${signature}`).join('\n')

  const supportDeclaration = scoped ? `declare namespace ${support} {
${component.declarationTypes}
export interface ${publicMethods} {
${methods}
}
export interface ${eventDetails} {
${Object.entries(component.events).map(([name, event]) => `  ${JSON.stringify(name)}: ${event.detailType || 'unknown'}`).join('\n')}
}
}\n\n` : ''
  return `${component.declarationImports ? component.declarationImports + '\n\n' : ''}${supportDeclaration}export interface ${component.name}Props {
${props}
}

export interface ${component.name}EventMap {
${events}
}

export interface ${component.name} extends Required<Pick<${component.name}Props, Exclude<keyof ${component.name}Props, keyof HTMLElement>>>${scoped ? `, ${support}.${publicMethods}` : ''} {}

export declare class ${component.name} extends HTMLElement {
${scoped ? '' : methods}
  addEventListener<K extends keyof ${component.name}EventMap>(type: K, listener: (this: ${component.name}, event: ${component.name}EventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void
  removeEventListener<K extends keyof ${component.name}EventMap>(type: K, listener: (this: ${component.name}, event: ${component.name}EventMap[K]) => unknown, options?: boolean | EventListenerOptions): void
  removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void
  readonly updateComplete: Promise<void>
  requestUpdate(): Promise<void>
  emit<T = unknown>(name: string, detail?: T, options?: CustomEventInit<T>): boolean
}

declare global {
  interface HTMLElementTagNameMap {
    ${JSON.stringify(component.tag)}: ${component.name}
  }
}

export default ${component.name}
`
}

function customElementsDeclaration(components: CompiledComponent[]): string {
  const intrinsic = components.map((component) => {
    const props = Object.entries(component.properties).map(([name, property]) =>
      `      ${JSON.stringify(name)}?: ${typeForProperty(property)}`).join('\n')
    const events = Object.keys(component.events).map((event) => {
      const handler = `on${event.split(/[-:]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`
      return `      ${handler}?: (event: import('./${component.tag}.js').${component.name}EventMap[${JSON.stringify(event)}]) => void`
    }).join('\n')
    return `    ${JSON.stringify(component.tag)}: {
${props}
${events}
      children?: unknown
      slot?: string
      class?: string
      className?: string
    }`
  }).join('\n')

  return `declare global {
  namespace JSX {
    interface IntrinsicElements {
${intrinsic}
    }
  }
}

export {}
`
}

function customElementsManifest(components: CompiledComponent[]): Record<string, unknown> {
  return {
    schemaVersion: '1.0.0',
    modules: components.map(component => ({
      kind: 'javascript-module',
      path: `./${component.tag}.js`,
      declarations: [{
        kind: 'class',
        name: component.name,
        description: component.description || undefined,
        customElement: true,
        tagName: component.tag,
        members: Object.entries(component.properties).map(([name, property]) => ({
          kind: 'field',
          name,
          description: property.description,
          type: { text: typeForProperty(property) },
          default: property.default === undefined ? undefined : JSON.stringify(property.default),
          attribute: property.attribute === false ? undefined : (property.attribute || toKebabCase(name)),
          reflects: property.reflect,
        })),
        events: Object.entries(component.events).map(([name, event]) => ({
          name,
          description: event.description,
          type: { text: `CustomEvent<${event.detailType || 'unknown'}>` },
        })),
        slots: component.slots,
        cssProperties: component.cssProperties,
      }],
      exports: [{ kind: 'js', name: component.name, declaration: { name: component.name, module: `./${component.tag}.js` } }],
    })),
  }
}

function scopeLightDomCss(component: CompiledComponent): string {
  if (!component.styles) return ''
  const lightDomStyles = component.styles.replace(/:host\b/g, ':scope')
  if (/\@scope\s*\(/.test(lightDomStyles)) return lightDomStyles
  return `@scope (${component.tag}) {\n${lightDomStyles}\n}`
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

function ssrModule(components: CompiledComponent[]): string {
  const rawInterpolation = JSON.stringify('\\{!!\\s*([\\w$.]+)\\s*!!\\}')
  const escapedInterpolation = JSON.stringify('\\{\\{\\s*([\\w$.]+)\\s*\\}\\}')
  const slotPattern = JSON.stringify('<slot(?:\\s+name=["\\\']([^"\\\']+)["\\\'])?\\s*\\/?>(?:<\\/slot>)?')
  const definitions = Object.fromEntries(components.map(component => [component.tag, {
    template: component.template,
    styles: component.styles,
    shadowMode: component.shadowMode,
    properties: component.properties,
  }]))
  const renderers = components.map(component =>
    `export const render${component.name} = (props = {}, slots = {}) => renderComponent('${component.tag}', props, slots);`,
  ).join('\n')

  return `const definitions = ${JSON.stringify(definitions, null, 2)};
const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const valueAt = (values, path) => path.trim().split('.').reduce((value, part) => value?.[part], values);

export function renderComponent(tag, props = {}, slots = {}) {
  const definition = definitions[tag];
  if (!definition) throw new Error('Unknown STX component: ' + tag);
  const values = Object.fromEntries(Object.entries(definition.properties).map(([name, property]) => [name, property.default]));
  Object.assign(values, props);
  let template = definition.template
    .replace(new RegExp(${rawInterpolation}, 'g'), (_match, expression) => String(valueAt(values, expression) ?? ''))
    .replace(new RegExp(${escapedInterpolation}, 'g'), (_match, expression) => escapeHTML(valueAt(values, expression)))
    .replace(new RegExp(${slotPattern}, 'gi'), (_match, name) => String(slots[name || 'default'] ?? ''));
  const attributes = Object.entries(definition.properties).flatMap(([name, property]) => {
    if (property.attribute === false || !(name in props)) return [];
    const attribute = property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
    const value = props[name];
    if (value == null || value === false) return [];
    if (value === true) return [attribute];
    const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
    return [attribute + '=\\"' + escapeHTML(serialized) + '\\"'];
  }).join(' ');
  if (definition.shadowMode) {
    template = '<template shadowrootmode="' + definition.shadowMode + '">' +
      (definition.styles ? '<style>' + definition.styles + '</style>' : '') + template + '</template>' +
      String(slots.default ?? '');
  }
  return '<' + tag + (attributes ? ' ' + attributes : '') + '>' + template + '</' + tag + '>';
}

${renderers}
`
}

/**
 * Compile a directory of .stx single-file components into a progressive,
 * framework-agnostic custom-element library.
 */
export async function buildComponentLibrary(config: ComponentLibraryConfig): Promise<ComponentLibraryBuildResult> {
  const inputDir = path.resolve(config.inputDir)
  const outputDir = path.resolve(config.outputDir)
  const inputStats = await stat(inputDir).catch(() => null)
  if (!inputStats?.isDirectory()) throw new Error(`Component-library input directory does not exist: ${inputDir}`)

  const entries: ComponentLibraryComponent[] = config.components?.length
    ? config.components
    : (await discoverStxFiles(inputDir)).map(file => ({ file }))
  if (!entries.length) throw new Error(`No .stx components found in ${inputDir}`)

  const components = await Promise.all(entries.map(entry => compileComponent(inputDir, entry, config)))
  components.sort((a, b) => a.tag.localeCompare(b.tag))
  const duplicateTags = components.filter((component, index) => components.findIndex(item => item.tag === component.tag) !== index)
  if (duplicateTags.length) throw new Error(`Duplicate custom-element tag: ${duplicateTags[0].tag}`)
  const duplicateNames = components.filter((component, index) => components.findIndex(item => item.name === component.name) !== index)
  if (duplicateNames.length) throw new Error(`Duplicate component class name: ${duplicateNames[0].name}`)

  await mkdir(outputDir, { recursive: true })
  const files: string[] = []
  const emit = async (filename: string, content: string | Uint8Array): Promise<string> => {
    const target = path.join(outputDir, filename)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, typeof content === 'string' && !content.endsWith('\n') ? `${content}\n` : content)
    if (!files.includes(target)) files.push(target)
    return target
  }

  const signals = components.some(component => component.scope.apis.length)
  const extension = import.meta.url.endsWith('.ts') ? '.ts' : '.js'
  const nativeSignals = new URL(`./signals-api${extension}`, import.meta.url).pathname
  if (signals) await emit('signals.js', `export * from ${JSON.stringify(nativeSignals)};`)
  await emit('runtime.js', runtimeModule(signals))
  for (const component of components) {
    await emit(`${component.tag}.js`, componentModule(component))
    if (config.declarations !== false) await emit(`${component.tag}.d.ts`, componentDeclaration(component))
    if (config.css !== false && component.styles) {
      const css = component.shadowMode ? component.styles : scopeLightDomCss(component)
      await emit(`${component.tag}.css`, config.minify ? minifyCss(css) : css)
    }
  }

  // Literal import() dependencies need the same source-context build even
  // when the component has no static declarations. Scan compiled browser code
  // so server scripts, type syntax and import-looking text cannot activate it.
  const importScanner = new Bun.Transpiler({ loader: 'ts' })
  if (signals || components.some(component => component.scope.imports.length || importScanner.scanImports(componentModule(component)).some(imported => imported.kind === 'dynamic-import'))) {
    // Resolve TS/npm/transitive browser dependencies before distribution. A
    // single split build preserves shared module identity between elements;
    // separately bundling each entry would duplicate imported stores/effects.
    const entrypoints = components.map(component => path.join(outputDir, `${component.tag}.js`))
    const canonicalEntries = new Map(await Promise.all(entrypoints.map(async (file, index) => [await realpath(file), components[index]!] as const)))
    for (const [index, file] of entrypoints.entries()) canonicalEntries.set(file, components[index]!)
    const sourceEntries = new Map(components.map(component => [path.join(path.dirname(component.sourcePath), `.stx-library-${component.tag}.ts`), component]))
    const runtimePath = path.join(outputDir, 'runtime.js')
    entrypoints.push(runtimePath)
    if (signals) entrypoints.push(path.join(outputDir, 'signals.js'))
    // Bun resolves from its module identity (onLoad has no resolveDir option).
    // Give each generated entry an identity beside its authored component,
    // without writing there. Bun then applies the source package's browser
    // exports/import maps and nested dependencies through its native resolver.
    const built = await Bun.build({
      entrypoints, outdir: outputDir, root: outputDir,
      target: 'browser', format: 'esm', splitting: true,
      naming: { entry: '[name].js', chunk: 'chunks/[name]-[hash].js' },
      minify: false, loader: { '.js': 'ts' },
      plugins: [{ name: 'stx-element-runtime', setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => {
          if (args.path === 'bun' || args.path.startsWith('bun:') || args.path.startsWith('node:') || SERVER_MODULES.has(args.path)) throw new Error(`Server-only import ${JSON.stringify(args.path)} is not available in a browser component (${args.importer})`)
          const entry = canonicalEntries.get(args.path)
          if (!args.importer && entry) return { path: path.join(path.dirname(entry.sourcePath), `.stx-library-${entry.tag}.ts`) }
          if (args.path === runtimePath && sourceEntries.has(args.importer)) return { path: runtimePath }
          // Authored module helpers and element scope primitives participate in
          // this same split build, using the owner's canonical signals module.
          if (/^(?:@stacksjs\/stx|stx)\/signals-api(?:\.[jt]s)?$/.test(args.path)) return { path: nativeSignals }
        })
        builder.onLoad({ filter: /\.ts$/ }, args => {
          const component = sourceEntries.get(args.path)
          if (component) return { contents: componentModule(component, runtimePath), loader: 'ts' }
        })
      } }],
    }).catch(error => {
      const details = (error instanceof AggregateError ? error.errors : [error]).map(String).join('\n')
      throw new Error(`Failed to bundle browser component imports\n${details}`)
    })
    if (!built.success) throw new Error(`Failed to bundle component imports\n${built.logs.map(String).join('\n')}`)
    for (const output of built.outputs) await emit(path.relative(outputDir, output.path), new Uint8Array(await output.arrayBuffer()))
  }

  const indexSource = components.map(component =>
    `export { ${component.name}, default as ${component.name}Element } from './${component.tag}.js';`,
  ).join('\n')
  await emit('index.js', indexSource)
  await emit('ssr.js', ssrModule(components))

  if (config.declarations !== false) {
    await emit('index.d.ts', components.map(component => `export * from './${component.tag}.js'`).join('\n'))
    await emit('custom-elements.d.ts', customElementsDeclaration(components))
    await emit('ssr.d.ts', `${components.map(component => `export declare const render${component.name}: (props?: ${component.name}Props, slots?: Record<string, string>) => string`).join('\n')}\nexport declare function renderComponent(tag: string, props?: Record<string, unknown>, slots?: Record<string, string>): string\n${components.map(component => `import type { ${component.name}Props } from './${component.tag}.js'`).join('\n')}`)
  }

  let manifest: string | undefined
  if (config.manifest !== false) manifest = await emit('custom-elements.json', JSON.stringify(customElementsManifest(components), null, 2))

  let cssBundle: string | undefined
  if (config.css !== false) {
    const bundledCss = components.filter(component => !component.shadowMode && component.styles).map(scopeLightDomCss).join('\n\n')
    if (bundledCss) cssBundle = await emit('bundle.css', config.minify ? minifyCss(bundledCss) : bundledCss)
  }

  let bundle: string | undefined
  if (config.bundle !== false) {
    bundle = path.join(outputDir, 'bundle.js')
    let result: Awaited<ReturnType<typeof Bun.build>>
    try {
      result = await Bun.build({
        entrypoints: [path.join(outputDir, 'index.js')],
        outdir: outputDir,
        naming: 'bundle.js',
        target: 'browser',
        format: 'esm',
        minify: config.minify ?? true,
        sourcemap: config.sourcemap || 'none',
      })
    }
    catch (error) {
      const logs = error instanceof AggregateError ? error.errors : [error]
      const details = logs.map(log => String(log).trim()).filter(Boolean).join('\n')
      throw new AggregateError(
        logs,
        `Failed to bundle component library${details ? `\n${details}` : ''}`,
      )
    }
    if (!result.success) {
      const details = result.logs.map(log => String(log).trim()).filter(Boolean).join('\n')
      throw new AggregateError(
        result.logs,
        `Failed to bundle component library${details ? `\n${details}` : ''}`,
      )
    }
    files.push(bundle)
    if (config.sourcemap === 'external') files.push(`${bundle}.map`)
  }

  const sizes = await Promise.all(files.map(async file => (await stat(file)).size))
  return {
    components: components.map(component => ({
      name: component.name,
      tag: component.tag,
      source: component.sourcePath,
      module: path.join(outputDir, `${component.tag}.js`),
      styles: component.styles,
      shadowMode: component.shadowMode,
    })),
    files,
    manifest,
    bundle,
    cssBundle,
    totalBytes: sizes.reduce((total, size) => total + size, 0),
  }
}
