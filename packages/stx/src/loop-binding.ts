/**
 * Split `@foreach(...)` / `@forelse(...)` params into the collection and the
 * item binding.
 *
 * Two spellings are documented and only one was implemented. Blade's
 * `items as item` worked; the JS-natural `item in items` — which
 * docs/SCRIPT_VARIABLES.md shows, and which matches the `:for="item in items"`
 * client directive — did not, and the failure was silent. An unrecognised
 * binding was skipped with `continue`, so the directive text survived into the
 * built page and every `{{ }}` inside it resolved against a variable that never
 * existed. The reported page shipped `data-variant-row="{{ p.id }}"` to the
 * browser: a literal no selector matches and no binding resolves
 * (stacksjs/stx#1842).
 *
 * The operands are the other way round between the two forms, which is the
 * whole reason this needs saying once rather than at each call site. Vue's
 * parenthesised `(item, index)` maps onto the comma form the item parser
 * already understands.
 */
export function parseLoopBinding(params: string): { arrayExpr: string, itemVar: string } | null {
  const asIndex = params.indexOf(' as ')
  if (asIndex !== -1) {
    const arrayExpr = params.slice(0, asIndex).trim()
    const itemVar = params.slice(asIndex + 4).trim()
    return arrayExpr && itemVar ? { arrayExpr, itemVar } : null
  }

  const inMatch = /^\s*(.+?)\s+in\s+([\s\S]+)$/.exec(params)
  if (!inMatch)
    return null

  const itemVar = inMatch[1].trim().replace(/^\(([\s\S]*)\)$/, '$1').trim()
  const arrayExpr = inMatch[2].trim()
  return itemVar && arrayExpr ? { arrayExpr, itemVar } : null
}

/**
 * Split `source` at its top-level commas, ignoring commas nested in brackets
 * or inside string literals.
 */
function splitTopLevel(source: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\')
        i++
      else if (ch === quote)
        quote = ''
      continue
    }
    if (ch === '\'' || ch === '"' || ch === '`')
      quote = ch
    else if (ch === '(' || ch === '[' || ch === '{')
      depth++
    else if (ch === ')' || ch === ']' || ch === '}')
      depth--
    else if (ch === ',' && depth === 0) {
      parts.push(source.slice(start, i))
      start = i + 1
    }
  }
  parts.push(source.slice(start))
  return parts
}

/** Index of the first top-level occurrence of `char` in `source`, or -1. */
function topLevelIndexOf(source: string, char: string): number {
  let depth = 0
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (ch === '(' || ch === '[' || ch === '{')
      depth++
    else if (ch === ')' || ch === ']' || ch === '}')
      depth--
    else if (ch === char && depth === 0)
      return i
  }
  return -1
}

/** Index of the bracket closing the one `source` opens with, or -1. */
function closingParen(source: string): number {
  let depth = 0
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (ch === '(' || ch === '[' || ch === '{')
      depth++
    else if ((ch === ')' || ch === ']' || ch === '}') && --depth === 0)
      return i
  }
  return -1
}

/** The names a binding pattern (`item`, `{ a, b: c }`, `[x, , y = 1]`, `...rest`) declares. */
function patternNames(pattern: string, out: string[]): void {
  let target = pattern.trim().replace(/^\.\.\./, '').trim()
  // A default value belongs to the pattern element, not to its names.
  const assign = topLevelIndexOf(target, '=')
  if (assign !== -1 && target[assign + 1] !== '>')
    target = target.slice(0, assign).trim()
  if (!target)
    return

  if (target.startsWith('{') && target.endsWith('}')) {
    for (const property of splitTopLevel(target.slice(1, -1))) {
      const element = property.trim()
      if (!element)
        continue
      if (element.startsWith('...')) {
        patternNames(element, out)
        continue
      }
      const colon = topLevelIndexOf(element, ':')
      patternNames(colon === -1 ? element : element.slice(colon + 1), out)
    }
    return
  }

  if (target.startsWith('[') && target.endsWith(']')) {
    for (const element of splitTopLevel(target.slice(1, -1)))
      patternNames(element, out)
    return
  }

  if (/^[A-Z_$][\w$]*$/i.test(target))
    out.push(target)
}

/**
 * Every name a client loop expression binds for its body.
 *
 * ```
 * loopBoundNames('item in items')                 → ['item']
 * loopBoundNames('(item, index) of items')        → ['item', 'index']
 * loopBoundNames('{ id, label: name } in rows')   → ['id', 'name']
 * loopBoundNames('([key, value], i) in entries')  → ['key', 'value', 'i']
 * loopBoundNames('items as idx => item')          → ['item', 'idx']
 * ```
 *
 * Inside the loop these names are the loop's, whatever the server context, an
 * app's auto-imported globals or `globalThis` hold under the same name, so
 * every server-side pass that would otherwise evaluate a descendant binding
 * asks this first. One answer for all of them: the passes used to keep their
 * own loop-head regexes, and each understood a different subset of the forms.
 */
export function loopBoundNames(expression: string): string[] {
  const trimmed = expression.trim()
  const names: string[] = []

  // JS-style `<pattern> in|of <iterable>`; the head is found at the top level
  // so a destructuring default or a parenthesised pair cannot hide it.
  let depth = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === '(' || ch === '[' || ch === '{')
      depth++
    else if (ch === ')' || ch === ']' || ch === '}')
      depth--
    else if (depth === 0 && /\s/.test(ch)) {
      const keyword = /^\s+(?:in|of)\s/.exec(trimmed.slice(i))
      if (!keyword)
        continue
      let head = trimmed.slice(0, i).trim()
      if (head.startsWith('(') && closingParen(head) === head.length - 1)
        head = head.slice(1, -1)
      for (const pattern of splitTopLevel(head))
        patternNames(pattern, names)
      if (names.length > 0)
        return names
      break
    }
  }

  // Blade-style `<iterable> as <spec>`: `item`, `idx => item`, `item, idx`, `(item, idx)`.
  const asMatch = /^[\s\S]+?\s+as\s+([\s\S]+)$/.exec(trimmed)
  if (asMatch) {
    let spec = asMatch[1].trim()
    if (spec.startsWith('(') && closingParen(spec) === spec.length - 1)
      spec = spec.slice(1, -1)
    const arrow = /^([\w$]+)\s*=>\s*([\s\S]+)$/.exec(spec)
    if (arrow) {
      patternNames(arrow[2], names)
      patternNames(arrow[1], names)
    }
    else {
      for (const pattern of splitTopLevel(spec))
        patternNames(pattern, names)
    }
  }

  return names
}

/**
 * Whether `expression` reads any of `names` as a variable — not as a property
 * after `.`, not as an object-literal key and not inside a string literal.
 */
export function readsAnyName(expression: string, names: Iterable<string>): boolean {
  const wanted = names instanceof Set ? names as Set<string> : new Set(names)
  if (wanted.size === 0)
    return false
  const withoutStrings = expression.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, ' ')
  // A template literal's text is not code, but its `${}` holes are.
  const withoutTemplateText = withoutStrings.replace(/`(?:[^`\\$]|\\.|\$(?!\{))*`/g, ' ')
  const withoutMembers = withoutTemplateText.replace(/\??\.\s*[a-zA-Z_$][\w$]*/g, ' ')
  const withoutKeys = withoutMembers.replace(/([{,]\s*)[a-zA-Z_$][\w$]*(\s*:(?!:))/g, '$1$2')
  for (const identifier of withoutKeys.match(/[a-zA-Z_$][\w$]*/g) || []) {
    if (wanted.has(identifier))
      return true
  }
  return false
}

/**
 * The context key naming the client loop variables in scope for markup that
 * was cut out of its loop to be rendered on its own.
 *
 * A `:for` on a component tag (`<Card :for="tile in tiles()">`) or on an
 * element around one wraps markup that is rendered in a separate pass: the
 * slot is expanded inside `renderComponentWithSlot`, away from the loop that
 * binds its names, so the lexical scans above see no loop at all. Without the
 * names carried here, a slot binding such as `:text="tile.label"` was judged
 * by the server alone, and an app global or server value called `tile` made it
 * look resolvable: it was evaluated, came back undefined, and the binding was
 * dropped from the output.
 */
export const CLIENT_LOOP_NAMES_KEY = '__stx_client_loop_names'

/** The client loop names `context` carries for its markup (see {@link CLIENT_LOOP_NAMES_KEY}). */
export function inheritedClientLoopNames(context: Record<string, unknown> | undefined): string[] {
  const names = context?.[CLIENT_LOOP_NAMES_KEY]
  return Array.isArray(names) ? names as string[] : []
}
