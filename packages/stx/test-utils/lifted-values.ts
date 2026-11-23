/**
 * Read a value a component's script receives from the server (#2219).
 *
 * A component script no longer has its server values written into its code:
 * `{{ x }}` and the data bridge's `var name = …` read `__stxValues[i]`, and
 * the call passes the values (`, /*stx-values*\/[…]`). A test that asserted
 * `var name = "value"` in the page asks this for the value instead.
 *
 * Finds the first script declaring `<name> = __stxValues[i]` (var, let or
 * const) and returns
 * entry `i` of the values its call passes; `undefined` when there is none.
 */
export function bridgedValue(html: string, name: string): unknown {
  const declaration = new RegExp(`(?:var|let|const) ${name.replace(/\$/g, '\\$')} = __stxValues\\[(\\d+)\\]`)
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const code = match[1]!
    const at = declaration.exec(code)
    if (!at)
      continue
    const values = /\/\*stx-values\*\/(\[[\s\S]*\])\);\s*$/.exec(code)
    return values ? (JSON.parse(values[1]!) as unknown[])[Number(at[1])] : undefined
  }
  return undefined
}
