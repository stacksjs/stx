/**
 * Which names a client block declares for itself.
 *
 * Shared by the runtime bridge, which must not emit a `var` beside the
 * block's own top-level binding, and by the type checker, which must not
 * declare a bridged value the runtime will never inject. One rule in one
 * place, so the two cannot disagree about what a page does.
 */
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'

/**
 * Return the local bindings introduced by a destructuring declaration.
 *
 * The bridge only needs this to avoid emitting a same-named `var`, so being
 * conservative for nested patterns is preferable to generating invalid
 * JavaScript. Object aliases use their local name (`source: local`), while
 * defaults are removed from either form.
 */
function extractDestructuredBindings(pattern: string, objectPattern: boolean): Set<string> {
  const bindings = new Set<string>()
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
  return bindings
}

/**
 * Detect whether client code already owns an identifier.
 *
 * Direct declarations were always handled, but Vue-style prop declarations
 * are normally destructured. Without this check the bridge emitted
 * `var title = ...` immediately before
 * `const { title } = defineProps()`, which is a parse-time error.
 */

/**
 * Does the client block declare `name` AT THE TOP LEVEL, so the bridge would
 * clobber it?
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
export function declaresClientIdentifier(code: string, name: string): boolean {
  const stripped = stripCommentsAndLiterals(code)
  const { depths, balanced } = bracketDepths(stripped)
  // Unbalanced brackets (a regex literal holding a brace) make every depth
  // suspect. Treat each declaration as top-level then -- the behaviour before
  // #1953, which withholds the value rather than risk a duplicate binding.
  const atTopLevel = (index: number): boolean => !balanced || depths[index] === 0

  // The declaration is captured so depth is read at the KEYWORD. Reading it at
  // match.index instead put `for (const range of rows)` at depth 0, because the
  // character the boundary consumed was the `(` whose own depth is still 0.
  const keyword = new RegExp(`(?:^|[^\\w$.])((?:const|let|var|function|class)\\s+${name}\\b)`, 'g')
  for (const match of stripped.matchAll(keyword)) {
    const keywordIndex = (match.index ?? 0) + match[0].length - match[1].length
    if (atTopLevel(keywordIndex))
      return true
  }

  for (const match of stripped.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) {
    if (atTopLevel(match.index ?? 0) && extractDestructuredBindings(match[1], true).has(name))
      return true
  }
  for (const match of stripped.matchAll(/(?:const|let|var)\s*\[([^\]]*)\]/g)) {
    if (atTopLevel(match.index ?? 0) && extractDestructuredBindings(match[1], false).has(name))
      return true
  }
  return false
}
