/**
 * Which names a client block declares for itself.
 *
 * Shared by the runtime bridge, which must not emit a `var` beside the
 * block's own top-level binding, and by the type checker, which must not
 * declare a bridged value the runtime will never inject. One rule in one
 * place, so the two cannot disagree about what a page does.
 */
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'
import { LRUCache } from './performance-utils'

const declarationsByScript = new LRUCache<string, { names: ReadonlySet<string>, bytes: number }>(32, {
  maxBytes: 1024 * 1024,
  sizeOf: result => result.bytes,
})

/**
 * Collect the local bindings introduced by a destructuring declaration.
 *
 * The bridge only needs this to avoid emitting a same-named `var`, so being
 * conservative for nested patterns is preferable to generating invalid
 * JavaScript. Object aliases use their local name (`source: local`), while
 * defaults are removed from either form.
 */
function collectDestructuredBindings(pattern: string, objectPattern: boolean, bindings: Set<string>): void {
  for (const rawPart of pattern.split(',')) {
    let part = rawPart.trim().replace(/^\.\.\./, '').trim()
    if (!part)
      continue

    if (objectPattern) {
      const colon = part.lastIndexOf(':')
      if (colon !== -1)
        part = part.slice(colon + 1).trim()
    }

    part = part.split('=')[0].trim()
    if (/^[A-Za-z_$][\w$]*$/.test(part))
      bindings.add(part)
  }
}

/**
 * Collect the client block declarations that would collide with the bridge.
 *
 * Only a depth-0 declaration counts (stacksjs/stx#1953). Emitting `var range`
 * beside a top-level `const range` is a duplicate-binding SyntaxError, so that
 * name is left alone. A declaration nested in a function, an `else if`, or a
 * loop head merely SHADOWS the bridge's binding inside its own scope, and
 * withholding the value there is what broke the page: a declared payload name
 * silently never arrived and the first top-level use threw
 * `ReferenceError: range is not defined`, with nothing at build time.
 *
 * Comments and string/template literals are stripped first, so the word
 * `const` inside a message cannot claim ownership of anything.
 */
export function clientDeclaredIdentifiers(code: string): ReadonlySet<string> {
  const cached = declarationsByScript.get(code)
  if (cached) return cached.names

  const stripped = stripCommentsAndLiterals(code)
  const { depths, balanced } = bracketDepths(stripped)
  // Unbalanced brackets (a regex literal holding a brace) make every depth
  // suspect. Treat each declaration as top-level then -- the behaviour before
  // #1953, which withholds the value rather than risk a duplicate binding.
  const atTopLevel = (index: number): boolean => !balanced || depths[index] === 0

  // The declaration is captured so depth is read at the KEYWORD. Reading it at
  // match.index instead put `for (const range of rows)` at depth 0, because the
  // character the boundary consumed was the `(` whose own depth is still 0.
  const names = new Set<string>()
  const keyword = /(?:^|[^\w$.])((?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*))/g
  for (const match of stripped.matchAll(keyword)) {
    const keywordIndex = match.index + match[0].length - match[1].length
    if (atTopLevel(keywordIndex))
      names.add(match[2])
  }

  for (const match of stripped.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) {
    if (atTopLevel(match.index))
      collectDestructuredBindings(match[1], true, names)
  }
  for (const match of stripped.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) {
    if (atTopLevel(match.index))
      collectDestructuredBindings(match[1], false, names)
  }
  let bytes = code.length * 2
  for (const name of names) bytes += name.length * 2 + 32
  declarationsByScript.set(code, { names, bytes })
  return names
}

export function declaresClientIdentifier(code: string, name: string): boolean {
  return clientDeclaredIdentifiers(code).has(name)
}
