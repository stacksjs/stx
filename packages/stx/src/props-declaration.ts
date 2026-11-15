/** Shared compile-time public prop declarations; never executes component code. */
import { topLevelDeclarationSites } from './client-parameter-bindings'
import { Tokenizer } from './parser/tokenizer'
import { parseStringLiteral } from './directive-arguments'

function withoutComments(source: string): string {
  const tokens = new Tokenizer(source, 'javascript').tokenize()
  let code = source
  for (const token of tokens.reverse()) {
    if (token.type === 'COMMENT') code = code.slice(0, token.start) + token.value.replace(/[^\r\n]/g, ' ') + code.slice(token.end)
  }
  return code
}

/**
 * The index just past a balanced bracket pair starting at `index`, or -1 when
 * it never closes.
 *
 * Quotes and template literals are skipped, so a bracket inside a string
 * default does not unbalance the scan.
 */
export function skipBalanced(source: string, index: number, open: string, close: string): number {
  if (source[index] !== open)
    return -1

  let depth = 0
  let quote: string | null = null

  for (let i = index; i < source.length; i++) {
    const char = source[i]!
    if (quote) {
      if (char === '\\') {
        i++
        continue
      }
      if (char === quote)
        quote = null
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === open) {
      depth++
    }
    else if (char === close) {
      // `=>` is not a closing angle bracket. A type argument holding a function
      // type, `<{ make?: () => object }>`, otherwise ended at the arrow, and the
      // declaration after it failed to parse and read as no props at all.
      if (close === '>' && source[i - 1] === '=')
        continue
      depth--
      if (depth === 0)
        return i + 1
    }
  }

  return -1
}

/**
 * Split a list on separators that are not nested inside brackets or quotes.
 *
 * `angles` decides whether `<` and `>` nest. They must in a type literal, so
 * `Array<string, number>` stays one member, and must NOT in a value, where
 * `>` is a comparison and `=>` an arrow and counting either unbalances
 * everything after it.
 */
export function splitTopLevel(body: string, separators: string, angles: boolean): string[] {
  const opening = angles ? '([{<' : '([{'
  const closing = angles ? ')]}>' : ')]}'
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (let i = 0; i < body.length; i++) {
    const char = body[i]!
    if (quote) {
      current += char
      if (char === '\\') {
        current += body[++i] ?? ''
        continue
      }
      if (char === quote)
        quote = null
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      current += char
      continue
    }
    if (opening.includes(char))
      depth++
    else if (closing.includes(char) && !(angles && char === '>' && body[i - 1] === '='))
      depth--
    if (depth === 0 && separators.includes(char)) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)

  return parts.map(part => part.trim()).filter(Boolean)
}

/**
 * The index of the `=` that introduces a destructuring default, or -1.
 *
 * Only a bare `=` at depth zero counts. `==`, `===`, `!=`, `<=`, `>=` and the
 * `=>` of an arrow all contain one and none of them starts a default, so a
 * default of `() => fallback()` has to survive the scan intact.
 */
function defaultAssignmentIndex(entry: string): number {
  let depth = 0
  let quote: string | null = null

  for (let i = 0; i < entry.length; i++) {
    const char = entry[i]!
    if (quote) {
      if (char === '\\') {
        i++
        continue
      }
      if (char === quote)
        quote = null
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if ('([{'.includes(char))
      depth++
    else if (')]}'.includes(char))
      depth--
    if (depth !== 0 || char !== '=')
      continue
    const previous = entry[i - 1]
    const next = entry[i + 1]
    if (next === '=' || previous === '=' || previous === '!' || previous === '<' || previous === '>')
      continue
    return i
  }

  return -1
}

/** The TypeScript a `type:` constructor in the object form stands for. */
function typeFromConstructor(value: string): string | undefined {
  switch (value.trim()) {
    case 'String': return 'string'
    case 'Number': return 'number'
    case 'Boolean': return 'boolean'
    case 'Array': return 'unknown[]'
    case 'Object': return 'Record<string, unknown>'
    default: return undefined
  }
}

interface PropsDeclaration {
  /** The source text of the whole statement, so the caller can remove it. */
  text: string
  propNames: string[]
  propBindings: Record<string, string>
  localBindings: Record<string, string>
  defaults: Record<string, string>
  declared: Record<string, string>
  /** A named type argument, when the props were typed by `defineProps<Props>()`. */
  typeName?: string
  identifier?: string
}

/**
 * Read a `defineProps` declaration, in every form it is written
 * (stacksjs/stx#2009).
 *
 * This used to be one regex that required a destructuring assignment AND an
 * explicit type argument, so four of the five documented spellings produced no
 * properties at all and the component silently had no public surface. The one
 * that did match split its names on `:` only, so
 *
 *   const { label = 'Hello' } = defineProps<{ label?: string }>()
 *
 * produced a property literally named `label = 'Hello'`, documented as the
 * attribute `label-hello`, and nothing a page wrote as `label="x"` ever
 * arrived. That is worse than not reading it, because it looks like it worked.
 *
 * Handled here:
 *
 *   const { a, b = 1 } = defineProps<{ a?: string, b?: number }>()
 *   const { a } = defineProps(['a'])
 *   const props = defineProps<{ a?: string }>()
 *   const props = defineProps<Props>()
 *   const props = withDefaults(defineProps<{ a?: string }>(), { a: 'x' })
 *   const props = defineProps({ a: { type: String, default: 'x' } })
 *
 * Names come from the destructuring pattern when there is one, since that is
 * the author naming them, and otherwise from whichever of the type literal,
 * the object form or the array form is present. Types come from the type
 * literal or the object form's `type:`, never inferred from a default: a
 * `title?: string` with no default was being typed as an object, and the
 * attribute `"Revenue"` was then JSON-parsed, failed, and reached the page as
 * `[object Object]`.
 */
export function parsePropsDeclaration(source: string): PropsDeclaration | null {
  // Share the binding lexer with the client compiler. Nested functions, quoted
  // examples and comments cannot declare a component's public props.
  const code = withoutComments(source)
  for (const start of new Set(topLevelDeclarationSites(code).map(site => site.start))) {
    const declaration = parsePropsAt(code, start)
    if (declaration) return { ...declaration, text: source.slice(start, start + declaration.text.length) }
  }
  return null
}

function parsePropsAt(code: string, start: number): PropsDeclaration | null {
  const declared: Record<string, string> = Object.create(null)
  const defaults: Record<string, string> = Object.create(null)
  const propNames: string[] = []
  const propBindings: Record<string, string> = Object.create(null)
  const localBindings: Record<string, string> = Object.create(null)
  let cursor = start + (/^(?:const|let|var)\s+/.exec(code.slice(start))?.[0].length ?? 0)
  const skipSpace = (): void => {
    while (cursor < code.length && /\s/.test(code[cursor]!)) cursor++
  }

  let pattern: string
  if (code[cursor] === '{') {
    const end = skipBalanced(code, cursor, '{', '}')
    if (end === -1)
      return null
    pattern = code.slice(cursor, end)
    cursor = end
  }
  else {
    const identifier = /^[A-Za-z_$][\w$]*/.exec(code.slice(cursor))
    if (!identifier)
      return null
    pattern = identifier[0]
    cursor += identifier[0].length
  }

  skipSpace()
  if (code[cursor] !== '=')
    return null
  cursor++
  skipSpace()

  const wrapper = /^withDefaults\s*\(\s*/.exec(code.slice(cursor))
  const wrapped = Boolean(wrapper)
  if (wrapper)
    cursor += wrapper[0].length
  const marker = /^defineProps\b/.exec(code.slice(cursor))
  if (!marker)
    return null
  cursor += marker[0].length

  // The type argument, when written. Balanced so a nested generic survives.
  let typeText = ''
  skipSpace()
  if (code[cursor] === '<') {
    const end = skipBalanced(code, cursor, '<', '>')
    if (end === -1)
      return null
    typeText = code.slice(cursor + 1, end - 1).trim()
    cursor = end
  }

  skipSpace()
  if (code[cursor] !== '(')
    return null
  const callEnd = skipBalanced(code, cursor, '(', ')')
  if (callEnd === -1)
    return null
  const runtimeArgument = code.slice(cursor + 1, callEnd - 1).trim()
  cursor = callEnd

  // `withDefaults(defineProps<…>(), { … })` carries the defaults in its second
  // argument, and its closing paren belongs to the statement being removed.
  if (wrapped) {
    skipSpace()
    if (code[cursor] === ',') {
      cursor++
      skipSpace()
    }
    if (code[cursor] === '{') {
      const end = skipBalanced(code, cursor, '{', '}')
      if (end === -1)
        return null
      for (const [name, value] of parseDefaults(code.slice(cursor, end)))
        defaults[name] = value
      cursor = end
    }
    skipSpace()
    if (code[cursor] === ',') {
      cursor++
      skipSpace()
    }
    if (code[cursor] === ')')
      cursor++
  }
  if (code[cursor] === ';')
    cursor++

  // A type literal states the types. A bare identifier names an interface the
  // caller resolves once it has scanned them.
  const typeName = /^[A-Za-z_$][\w$]*$/.test(typeText) ? typeText : undefined
  if (typeText.startsWith('{')) {
    for (const member of splitTopLevel(typeText.replace(/^\{/, '').replace(/\}$/, ''), ',;', true)) {
      const parsed = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*:\s*([\s\S]+)$/.exec(member)
      if (parsed)
        declared[parsed[1]!] = parsed[2]!.trim()
    }
  }

  // The object form states both, under each key.
  if (runtimeArgument.startsWith('{')) {
    for (const [name, value] of parseDefaults(runtimeArgument)) {
      propNames.push(name)
      if (!value.startsWith('{')) {
        const fromConstructor = typeFromConstructor(value)
        if (fromConstructor)
          declared[name] = fromConstructor
        continue
      }
      for (const [key, inner] of parseDefaults(value)) {
        if (key === 'default') {
          defaults[name] = inner
        }
        else if (key === 'type') {
          const fromConstructor = typeFromConstructor(inner)
          if (fromConstructor)
            declared[name] = fromConstructor
        }
      }
    }
  }
  else if (runtimeArgument.startsWith('[')) {
    for (const entry of splitTopLevel(runtimeArgument.slice(1, -1), ',', false))
      propNames.push(entry.replace(/^['"`]/, '').replace(/['"`]$/, ''))
  }

  // The destructuring pattern wins, because it is the author writing the names
  // out. `{ a: local }` renames, so the property is `a`, and `{ a = 1 }` is a
  // default rather than part of the name.
  if (pattern.startsWith('{')) {
    propNames.length = 0
    for (const entry of splitTopLevel(pattern.replace(/^\{/, '').replace(/\}$/, ''), ',', false)) {
      const assignment = defaultAssignmentIndex(entry)
      const binding = assignment === -1 ? entry : entry.slice(0, assignment)
      const name = binding.split(':')[0]!.trim().replace(/^\.\.\./, '')
      if (!name)
        continue
      propNames.push(name)
      propBindings[name] = binding.trim()
      const local = binding.split(':').at(-1)!.trim()
      if (/^[A-Za-z_$][\w$]*$/.test(local)) localBindings[name] = local
      if (assignment !== -1)
        defaults[name] = entry.slice(assignment + 1).trim()
    }
  }
  else if (propNames.length === 0) {
    propNames.push(...Object.keys(declared))
  }

  return { text: code.slice(start, cursor), propNames, propBindings, localBindings, defaults, declared, typeName, identifier: pattern.startsWith('{') ? undefined : pattern }
}

export function parseDefaults(object: string): Array<[string, string]> {
  const body = object.trim().replace(/^\{/, '').replace(/\}$/, '')
  const pairs: Array<[string, string]> = []

  let index = 0

  while (index < body.length) {
    const key = /\s*([A-Za-z_$][\w$]*)\s*:/y

    key.lastIndex = index
    const match = key.exec(body)

    if (!match) break

    index = key.lastIndex

    let depth = 0
    let quote = ''
    const start = index

    while (index < body.length) {
      const char = body[index] as string

      if (quote) {
        if (char === '\\') index++
        else if (char === quote) quote = ''
      }
      else if (char === '\'' || char === '"' || char === '`') {
        quote = char
      }
      else if (char === '{' || char === '[' || char === '(') {
        depth++
      }
      else if (char === '}' || char === ']' || char === ')') {
        depth--
      }
      else if (char === ',' && depth === 0) {
        break
      }

      index++
    }

    const value = body.slice(start, index).trim()

    if (value) pairs.push([match[1], value])

    index++
  }

  return pairs
}

/** Literal defaults only: no client functions, imports, identifiers or getters run in SSR. */
export function literalValue(source: string): unknown {
  const tokens = new Tokenizer(source, 'javascript').tokenize().filter(token => !['COMMENT', 'WHITESPACE', 'EOF'].includes(token.type))
  let cursor = 0
  function read(depth: number): unknown {
    if (depth > 64) throw new Error('Prop literal too deep')
    const token = tokens[cursor++]
    if (!token) throw new Error('Missing prop literal')
    if (token.type === 'STRING' || token.type === 'TEMPLATE_STRING') {
      const value = parseStringLiteral(token.value)
      if (value === null) throw new Error('Dynamic prop string')
      return value
    }
    if (token.type === 'NUMBER') return Number(token.value)
    if (token.value === '-' || token.value === '+') {
      const number = tokens[cursor++]
      if (number?.type !== 'NUMBER') throw new Error('Dynamic prop number')
      return Number(token.value + number.value)
    }
    if (token.value === 'true') return true
    if (token.value === 'false') return false
    if (token.value === 'null') return null
    if (token.value === 'undefined') return undefined
    if (token.value !== '[' && token.value !== '{') throw new Error('Dynamic prop default')
    const array = token.value === '['
    const close = array ? ']' : '}'
    const entries: Array<[string, unknown]> = [], values: unknown[] = []
    while (tokens[cursor]?.value !== close) {
      if (array) values.push(read(depth + 1))
      else {
        const key = tokens[cursor++]
        if (!key || !['STRING', 'IDENTIFIER', 'NUMBER'].includes(key.type)) throw new Error('Dynamic prop key')
        const name = key.type === 'STRING' ? parseStringLiteral(key.value) : key.value
        if (name === null || tokens[cursor++]?.value !== ':') throw new Error('Dynamic prop key')
        entries.push([name, read(depth + 1)])
      }
      if (tokens[cursor]?.value !== ',') break
      cursor++
    }
    if (tokens[cursor++]?.value !== close) throw new Error('Unclosed prop literal')
    return array ? values : Object.fromEntries(entries)
  }
  try {
    const result = read(0)
    return cursor === tokens.length ? result : undefined
  }
  catch { return undefined }
}
