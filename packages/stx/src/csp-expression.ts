import { parse, type Node } from 'acorn'
import { analyze } from 'eslint-scope'

/** Server-only code generation. No expression is evaluated while compiling. */
export function compileCspExpression(body: string): string {
  const prefix = '(function(){\n'
  const source = prefix + body + '\n})'
  const ast = parse(source, { ecmaVersion: 'latest', ranges: true })
  const scopes = analyze(ast as Parameters<typeof analyze>[0], { ecmaVersion: 2024, sourceType: 'script', optimistic: true, ignoreEval: true })
  const parents = new Map<Node, Node>()
  const visit = (node: Node): void => {
    for (const value of Object.values(node)) {
      for (const child of Array.isArray(value) ? value : [value]) {
        if (child && typeof child === 'object' && typeof child.type === 'string') {
          parents.set(child, node)
          visit(child)
        }
      }
    }
  }
  visit(ast)
  const unique = (name: string): string => {
    while (source.includes(name)) name += '_'
    return name
  }
  const frame = unique('__stx_csp_frame__')
  const args = unique('__stx_csp_arguments__')
  const typeOf = unique('__stx_csp_typeof__')
  const assigned = unique('__stx_csp_assigned__')
  const edits = new Map<number, { end: number, text: string }>()
  const globals = new Map<string, boolean>()
  for (const reference of scopes.globalScope!.through) {
    const id = reference.identifier as unknown as Node & { name: string, range: [number, number] }
    const name = id.name
    if (name === 'eval' || name === 'Function') throw new Error(`CSP precompilation does not allow ${name} in a template expression`)
    globals.set(name, globals.get(name) || reference.isWrite())
    const parent = parents.get(id) as (Node & { operator?: string, shorthand?: boolean, key?: Node, callee?: Node, tag?: Node, left?: Node }) | undefined
    let start = id.range![0]
    let end = id.range![1]
    let text = `${frame}[${JSON.stringify(name)}]`
    if (parent?.type === 'UnaryExpression' && parent.operator === 'typeof') {
      start = parent.start
      end = parent.end
      text = `${typeOf}(${JSON.stringify(name)})`
    }
    else if (parent?.type === 'Property' && parent.shorthand) text = `${name}: ${text}`
    else if (parent?.type === 'AssignmentPattern' && parent.left === id) {
      const property = parents.get(parent) as Node & { shorthand?: boolean }
      if (property?.type === 'Property' && property.shorthand) text = `${name}: ${text}`
    }
    else if (parent?.callee === id || parent?.tag === id) text = `(0, ${text})`
    edits.set(start, { end, text })
  }
  // Preserve the outer function's arguments, including references captured by
  // arrows. Nested ordinary functions keep their own arguments object.
  const fnScope = scopes.scopes.find(scope => scope.type === 'function')!
  for (const reference of fnScope.variables.find(variable => variable.name === 'arguments')?.references ?? []) {
    const id = reference.identifier as unknown as Node & { range: [number, number] }
    const parent = parents.get(id) as Node & { shorthand?: boolean }
    edits.set(id.range[0], { end: id.range[1], text: parent?.type === 'Property' && parent.shorthand ? 'arguments: ' + args : args })
  }
  let rewritten = source
  for (const [start, edit] of [...edits].sort((a, b) => b[0] - a[0])) rewritten = rewritten.slice(0, start) + edit.text + rewritten.slice(edit.end)
  rewritten = rewritten.slice(prefix.length, -3)
  const fallbacks = [...globals].map(([name, writes]) => `[${JSON.stringify(name)}]:{get:function(){return ${name}},type:function(){return typeof ${name}}${writes ? `,set:function(${assigned}){${name}=${assigned}}` : ''}}`).join(',')
  const result = `{run:function(${frame},${args},${typeOf}){\n${rewritten}\n},globals:{${fallbacks}}}`
  parse('(' + result + ')', { ecmaVersion: 'latest' })
  return result
}
