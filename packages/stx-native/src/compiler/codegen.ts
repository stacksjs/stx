/**
 * A parsed screen as one TypeScript module, for `Bun.build`.
 *
 * The screen's `<script>` is the top of the module, unchanged, so its imports
 * resolve from the `.stx` file's own directory and its TypeScript is stripped
 * by the bundler like any other file. Below it, every expression in the
 * template becomes a real function in the same module:
 *
 *   <Text>{v.title}</Text>           ->  function (__s) { return (v.title) }
 *   <View :for="day in week">        ->  function (__s) { return (week) }, and the
 *     <Text>{day.label}</Text>            child: function (__s) { const { day } = __s; return (day.label) }
 *   onPress={open(item.id)}          ->  function (__s, $event) { const { item } = __s; ... }
 *
 * so expressions close over the script's state through ordinary lexical
 * scope. The bundler can rename and minify both sides consistently, nothing is
 * `eval`ed on the device, and JavaScriptCore compiles each function once.
 *
 * The template itself stays data: the IR with each expression replaced by its
 * index (`{ "$x": 3 }`), handed to the runtime's `mount()` with the functions.
 */
import type { STXDocument, STXNode } from './ir'

/** The import specifier the generated module uses for the runtime. */
export const RUNTIME_SPECIFIER = 'stx-native:runtime'

const REFERENCE = /^[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*$/

interface Context {
  functions: string[]
  warnings: string[]
  source: string
}

const transpiler = new Bun.Transpiler({ loader: 'ts' })

function parses(code: string): boolean {
  try {
    transpiler.transformSync(code)
    return true
  }
  catch {
    return false
  }
}

function prologue(scope: string[]): string {
  const names = [...new Set(scope)]
  return names.length ? `const { ${names.join(', ')} } = __s; ` : ''
}

function where(node: STXNode): string {
  return node._source ? `<${node.type}> at ${node._source.file}:${node._source.line}` : `<${node.type}>`
}

function addExpression(ctx: Context, expression: string, scope: string[], node: STXNode, what: string): number {
  const code = expression.trim()
  if (!code || !parses(`(${code}\n)`))
    throw new Error(`Cannot compile ${what} "${expression}" on ${where(node)}`)
  ctx.functions.push(`function (__s) { ${prologue(scope)}return (${code}\n) }`)
  return ctx.functions.length - 1
}

/**
 * A handler: a function to call with the event (`refresh`, `form.submit`), an
 * expression to evaluate (`open(item.id)`, `selected = day`), an arrow
 * (`() => open(item.id)`), or statements (`count++; save()`). An expression
 * that evaluates to a function is called with the event, so a handler factory
 * (`onPress={opener(item)}`) works too.
 */
function addHandler(ctx: Context, expression: string, scope: string[], node: STXNode, event: string): number {
  const code = expression.trim()
  let body: string
  if (REFERENCE.test(code))
    body = `return typeof ${code} === 'function' ? ${code}($event) : undefined`
  else if (parses(`(${code}\n)`))
    body = `const __r = (${code}\n); return typeof __r === 'function' ? __r($event) : __r`
  else if (parses(code))
    body = code
  else
    throw new Error(`Cannot compile handler ${event}="${expression}" on ${where(node)}`)
  ctx.functions.push(`function (__s, $event) { ${prologue(scope)}${body}\n}`)
  return ctx.functions.length - 1
}

/** `{...}` segments at the top level of a string, braces balanced. */
function segments(value: string): Array<{ text: string } | { expression: string }> | null {
  const parts: Array<{ text: string } | { expression: string }> = []
  let depth = 0
  let start = -1
  let last = 0
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === '{') {
      if (depth === 0) start = i
      depth++
    }
    else if (char === '}' && depth > 0) {
      depth--
      if (depth === 0) {
        if (start > last) parts.push({ text: value.slice(last, start) })
        parts.push({ expression: value.slice(start + 1, i) })
        last = i + 1
      }
    }
  }
  if (!parts.some(part => 'expression' in part)) return null
  if (last < value.length) parts.push({ text: value.slice(last) })
  return parts
}

/**
 * A literal or a reference. `"{x}"` keeps x's type (an array for `data`, a
 * number for `numColumns`); `"Day {n} of {total}"` is a string.
 */
function compileValue(ctx: Context, value: unknown, scope: string[], node: STXNode, what: string): unknown {
  if (typeof value !== 'string') return value
  const parts = segments(value)
  if (!parts) return value
  if (parts.length === 1 && 'expression' in parts[0])
    return { $x: addExpression(ctx, parts[0].expression, scope, node, what) }
  const code = parts.map(part => ('text' in part ? JSON.stringify(part.text) : `__stxText(${part.expression.trim()}\n)`)).join(' + ')
  return { $x: addExpression(ctx, code, scope, node, what) }
}

function compileNode(ctx: Context, node: STXNode, outer: string[]): Record<string, unknown> {
  const directives = node.directives
  const out: Record<string, unknown> = { type: node.type, props: {}, style: node.style ?? {}, events: {}, children: [] }
  if (node.darkStyle) out.darkStyle = node.darkStyle

  // A :for's list is read outside the loop; everything else on the node,
  // its own :if included, sees the loop's names.
  let scope = outer
  if (directives?.for) {
    const loop = directives.for
    out.directives = { for: { source: addExpression(ctx, loop.source, outer, node, ':for'), item: loop.item, ...(loop.index ? { index: loop.index } : {}) } }
    scope = [...outer, loop.item, ...(loop.index ? [loop.index] : [])]
  }
  if (directives) {
    const compiled = (out.directives ?? {}) as Record<string, unknown>
    if (directives.if !== undefined) compiled.if = addExpression(ctx, directives.if, scope, node, ':if')
    if (directives.elseIf !== undefined) compiled.elseIf = addExpression(ctx, directives.elseIf, scope, node, ':else-if')
    if (directives.else) compiled.else = true
    if (directives.show !== undefined) compiled.show = addExpression(ctx, directives.show, scope, node, ':show')
    if (Object.keys(compiled).length) out.directives = compiled
  }
  if (node.bindings) {
    const bindings: Record<string, number> = {}
    for (const [name, expression] of Object.entries(node.bindings)) {
      if (name !== 'class' && name !== 'style') continue
      bindings[name] = addExpression(ctx, expression, scope, node, `:${name}`)
    }
    if (Object.keys(bindings).length) out.bindings = bindings
  }
  if (node.key !== undefined) out.key = compileValue(ctx, node.key, scope, node, 'key')

  // A FlatList's rows (and its keyExtractor) see `item` and `index`.
  const isDataList = node.type === 'FlatList' && node.props.data !== undefined
  const rowScope = isDataList ? [...scope, 'item', 'index'] : scope
  const props = out.props as Record<string, unknown>
  for (const [name, value] of Object.entries(node.props)) {
    props[name] = compileValue(ctx, value, name === 'keyExtractor' && isDataList ? rowScope : scope, node, name)
  }
  const events = out.events as Record<string, number>
  for (const [name, expression] of Object.entries(node.events))
    events[name] = addHandler(ctx, expression, scope, node, name)

  out.children = node.children.map(child => (typeof child === 'string'
    ? compileValue(ctx, child, rowScope, node, 'text')
    : compileNode(ctx, child, rowScope)))
  return out
}

export interface ScreenModule {
  /** The module source, TypeScript. */
  code: string
  /** The template as the runtime reads it, for tests and debugging. */
  template: Record<string, unknown>
  warnings: string[]
}

/** The generated module for one parsed screen. */
export function generateScreenModule(document: STXDocument): ScreenModule {
  const ctx: Context = { functions: [], warnings: [...(document.meta.warnings ?? [])], source: document.meta.source }
  const template = compileNode(ctx, document.root, [])
  const named = document.script.functions
    .filter(name => /^[A-Za-z_$][\w$]*$/.test(name))
    .map(name => `${JSON.stringify(name)}: typeof ${name} === 'function' ? ${name} : undefined`)

  const code = [
    `import { mount as __stxMount } from ${JSON.stringify(RUNTIME_SPECIFIER)}`,
    '',
    document.script.code,
    '',
    '// Generated by stx-native from the template below the script.',
    'function __stxText(value: any): string { return value == null || value === false ? \'\' : String(value) }',
    '__stxMount({',
    `  document: { root: ${JSON.stringify(template)} },`,
    `  expressions: [\n    ${ctx.functions.join(',\n    ')}\n  ] as any[],`,
    `  functions: { ${named.join(', ')} },`,
    '})',
    '',
  ].join('\n')
  return { code, template, warnings: ctx.warnings }
}
