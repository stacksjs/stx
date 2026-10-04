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
