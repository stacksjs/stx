/** First-evaluation diagnostics: let JavaScript, not an identifier heuristic, resolve names. */
export function createBindingDiagnostics(source: string) {
  const reported = new WeakMap<object, Set<string>>()
  const unowned = new Set<string>()
  return (error: unknown, expression: string, scope: Record<string, unknown>, node?: { __stxId?: string }): void => {
    if (!error || typeof error !== 'object' || !('name' in error) || error.name !== 'ReferenceError') return
    const message = 'message' in error ? String(error.message) : ''
    // V8 and JavaScriptCore use different messages for the same unresolved read.
    const match = /^(?:Can't find variable: ([\w$]+)|([\w$]+) is not defined)$/.exec(message)
    const name = match?.[1] ?? match?.[2]
    const mentioned: string[] = expression.match(/[A-Za-z_$][\w$]*/g) ?? []
    if (!name || name in scope || !mentioned.includes(name)) return
    let seen = node ? reported.get(node) : unowned
    if (!seen) reported.set(node!, seen = new Set())
    const key = `${name}\0${expression}`
    if (seen.has(key)) return
    // The owner is a weak key; cap ownerless diagnostics too on long-lived screens.
    if (seen.size >= 128) return
    seen.add(key)
    console.warn(`[STX Native] unknown-binding: ${source}: ${node?.__stxId ?? 'binding'}: ${name} is not in the setup scope (${JSON.stringify(expression)})`)
  }
}
