const NAME = /^--[\w\u0080-\uFFFF-]+$/u
const LIMIT = 65_536

/** Visit var() tokens without interpreting quoted text as a function. */
function substitute(input: string, lookup: (name: string, fallback?: string) => string | undefined): string | undefined {
  if (!/var\(/i.test(input)) return input
  let output = ''
  let quote = ''
  let replaced = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === '\\') { output += input.slice(i, i + 2); i++; continue }
    if (quote) {
      output += char
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") { quote = char; output += char; continue }
    if (input.slice(i, i + 4).toLowerCase() !== 'var(' || (i > 0 && /[\w-]/.test(input[i - 1]))) { output += char; continue }
    let depth = 1
    let comma = -1
    let innerQuote = ''
    let end = i + 4
    for (; end < input.length; end++) {
      const next = input[end]
      if (next === '\\') { end++; continue }
      if (innerQuote) { if (next === innerQuote) innerQuote = ''; continue }
      if (next === '"' || next === "'") { innerQuote = next; continue }
      if (next === '(') depth++
      if (next === ')' && --depth === 0) break
      if (next === ',' && depth === 1 && comma === -1) comma = end
    }
    if (depth !== 0) return undefined
    const name = input.slice(i + 4, comma === -1 ? end : comma).trim()
    if (!NAME.test(name)) return undefined
    const replacement = lookup(name, comma === -1 ? undefined : input.slice(comma + 1, end).trim())
    if (replacement === undefined || output.length + replacement.length > LIMIT) return undefined
    output += replacement
    replaced = true
    i = end
  }
  return replaced && output.length > LIMIT ? undefined : output
}

export type NativeStyleVariables = ReadonlyMap<string, string | undefined>

export interface NativeStyleVariableResolver {
  resolve: (text: string) => string | undefined
  used: Set<string>
  computed: () => NativeStyleVariables
}

/** Inherited values are already computed at their declaring element. */
export function createStyleVariables(entries: Array<[string, unknown]>, inherited?: NativeStyleVariables): NativeStyleVariableResolver {
  const values = new Map<string, string>()
  const used = new Set<string>()
  for (const [rawName, value] of entries) {
    const name = rawName.trim()
    if (!NAME.test(name)) continue
    if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) values.set(name, String(value).trim())
  }
  const dependencies = new Map<string, Set<string>>()
  const invalid = new Set<string>()
  for (const [name, value] of values) {
    const refs = new Set<string>()
    const inspect = (text: string, depth = 0): string | undefined => depth > 64 ? undefined : substitute(text, (ref, fallback) => {
      refs.add(ref)
      return fallback === undefined ? '' : inspect(fallback, depth + 1)
    })
    if (inspect(value) === undefined) invalid.add(name)
    dependencies.set(name, refs)
  }
  // A strongly connected component includes overlapping cycles and references
  // in unused fallbacks. Merely marking the first DFS back-edge misses members.
  const indices = new Map<string, number>()
  const lows = new Map<string, number>()
  const stack: string[] = []
  const active = new Set<string>()
  let index = 0
  function visit(name: string, depth = 0): void {
    if (depth > 64) { invalid.add(name); return }
    indices.set(name, index)
    lows.set(name, index++)
    stack.push(name)
    active.add(name)
    for (const ref of dependencies.get(name) ?? []) {
      if (!values.has(ref)) continue
      if (!indices.has(ref)) {
        visit(ref, depth + 1)
        if (lows.has(ref)) lows.set(name, Math.min(lows.get(name)!, lows.get(ref)!))
      }
      else if (active.has(ref)) lows.set(name, Math.min(lows.get(name)!, indices.get(ref)!))
    }
    if (lows.get(name) !== indices.get(name)) return
    const group: string[] = []
    let member: string
    do {
      member = stack.pop()!
      active.delete(member)
      group.push(member)
    } while (member !== name)
    if (group.length > 1 || dependencies.get(name)?.has(name)) group.forEach(ref => invalid.add(ref))
  }
  for (const name of values.keys()) if (!indices.has(name)) visit(name)

  const cache = new Map<string, string | undefined>()
  function lookup(name: string, depth: number): string | undefined {
    used.add(name)
    if (cache.has(name)) return cache.get(name)
    const value = values.get(name)
    const result = value === undefined || /^(?:inherit|unset)$/i.test(value)
      ? inherited?.get(name)
      : invalid.has(name) || /^(?:initial|revert|revert-layer)$/i.test(value)
        ? undefined : resolve(value, depth + 1)
    cache.set(name, result)
    return result
  }
  function resolve(text: string, depth = 0): string | undefined {
    if (depth > 64) return undefined
    return substitute(text, (name, fallback) => {
      return lookup(name, depth) ?? (fallback === undefined ? undefined : resolve(fallback, depth + 1))
    })
  }
  return { resolve, used, computed(): NativeStyleVariables {
    const result = new Map(inherited)
    for (const name of values.keys()) result.set(name, lookup(name, 0))
    return result
  } }
}
