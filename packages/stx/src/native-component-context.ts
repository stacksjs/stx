/** The author checker uses the same metadata and method parser as the element emitter. */
import { clientMethods, componentScriptSource, componentDirectiveExpression, parseMetadata, parseNativeComponentLoop, typeForProperty } from './component-library'
import type { SourceMetadata, ClientMethodValidator } from './component-library'
import { stripCommentsAndLiterals } from './strip-literals'
import type { ScriptColumnEdit } from './stx-virtual-ts'

export interface NativeComponentContext {
  declarations: string
  checks: Array<{ text: string, line: number, column: number, origin: 'client' | 'component' }>
  project(code: string): { code: string, columns: Map<number, ScriptColumnEdit[]> }
}

export function nativeComponentContext(source: string, validate?: ClientMethodValidator): NativeComponentContext | undefined {
  const scannable = componentScriptSource(source)
  if (!/<script\b(?=[^>]*(?:\bcomponent\b|\bstx:component\b))/i.test(scannable)) return
  let metadata: SourceMetadata
  try { metadata = parseMetadata(source, 'component') }
  catch (error) {
    const at = source.search(/<script\b(?=[^>]*\bcomponent\b)/i)
    const message = error instanceof Error ? error.message : 'Invalid component metadata'
    return { declarations: '', checks: [{ text: `({})[${JSON.stringify(message)}];`, line: source.slice(0, at).split('\n').length, column: at - source.lastIndexOf('\n', at - 1), origin: 'component' }], project: code => ({ code, columns: new Map() }) }
  }
  const blocks = [...scannable.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(block => /\bclient\b/.test(block[1]!) && !/\bcomponent\b/.test(block[1]!))
  const script = blocks.map(block => { const at = block.index! + block[0].indexOf('>') + 1; return source.slice(at, at + block[2]!.length) }).join('\n')
  const methods = clientMethods(script, validate)
  const hasState = /\b(?:interface|type)\s+ComponentState\b/.test(stripCommentsAndLiterals(script))
  const properties = Object.entries(metadata.properties || metadata.props || {}).map(([name, property]) => `${JSON.stringify(name)}: ${typeForProperty(property)}`).join('; ')
  const names = [...new Set(methods.map(method => method.name))]
  const declarations = [
    `interface __StxNativeProperties { ${properties} }`,
    hasState ? 'declare const __stxStateProperties: Pick<ComponentState, Extract<keyof ComponentState, keyof __StxNativeProperties>>;' : '',
    `type __StxNativeComponent = Omit<HTMLElement, keyof __StxNativeProperties | ${hasState ? 'keyof ComponentState | ' : ''}${names.map(name => JSON.stringify(name)).join(' | ') || 'never'}> & ${hasState ? 'Omit<__StxNativeProperties, keyof ComponentState> & ComponentState' : '__StxNativeProperties'} & {`,
    'readonly updateComplete: Promise<void>; requestUpdate(): Promise<void>; readonly renderRoot: HTMLElement | ShadowRoot;',
    'emit<T = unknown>(name: string, detail?: T, options?: CustomEventInit<T>): boolean;',
    ...names.map(name => `${JSON.stringify(name)}: typeof ${name};`),
    '}',
  ].filter(Boolean).join('\n')
  let stateOffset = -1
  for (const block of blocks) {
    const bodyStart = block.index! + block[0].indexOf('>') + 1
    const found = /\b(?:interface|type)\s+ComponentState\b/.exec(stripCommentsAndLiterals(source.slice(bodyStart, bodyStart + block[2]!.length)))
    if (found) { stateOffset = bodyStart + found.index; break }
  }
  const checks: NativeComponentContext['checks'] = hasState && stateOffset >= 0 ? [{ origin: 'client', text: '__stxStateProperties satisfies Pick<__StxNativeProperties, Extract<keyof ComponentState, keyof __StxNativeProperties>>;', line: source.slice(0, stateOffset).split('\n').length, column: stateOffset - source.lastIndexOf('\n', stateOffset - 1) }] : []
  for (const [name, property] of Object.entries(metadata.properties || metadata.props || {})) {
    const at = source.indexOf(JSON.stringify(name), source.indexOf('<script'))
    const line = source.slice(0, at).split('\n').length, column = at - source.lastIndexOf('\n', at - 1)
    if (!property || typeof property !== 'object' || !['string', 'number', 'boolean', 'object', 'array'].includes(property.type)) checks.push({ text: `({})[${JSON.stringify(`Property ${name} must declare string, number, boolean, object or array`)}];`, line, column, origin: 'component' })
    if (property && property.default !== undefined) checks.push({ text: `const __stxDefault${checks.length}: ${typeForProperty(property)} = ${JSON.stringify(property.default)};`, line, column, origin: 'component' })
  }
  return {
    declarations, checks,
    project(code) {
      const columns = new Map<number, ScriptColumnEdit[]>()
      const chunks: string[] = []
      let cursor = 0
      for (const method of clientMethods(code, validate)) {
        if (/^\s*this\s*:/.test(method.parameters)) continue
        const at = method.parameterOffset
        const inserted = `this: __StxNativeComponent${method.parameters.trim() ? ', ' : ''}`
        chunks.push(code.slice(cursor, at), inserted)
        const line = code.slice(0, at).split('\n').length
        const column = at - code.lastIndexOf('\n', at - 1)
        const edits = columns.get(line) || []
        const previous = edits.at(-1)
        const generatedStart = column + (previous ? previous.generatedEnd - previous.sourceEnd : 0)
        edits.push({ sourceStart: column, sourceEnd: column, generatedStart, generatedEnd: generatedStart + inserted.length })
        columns.set(line, edits)
        cursor = at
      }
      chunks.push(code.slice(cursor))
      return { code: chunks.join(''), columns }
    },
  }
}

/** Native block loops are lexical, including sibling and nested aliases. */
export function nativeComponentLoops(masked: string): Array<{ start: number, end: number, iterable: string, binding: string }> {
  const scopes: Array<{ start: number, end: number, iterable: string, binding: string }> = []
  const stack: Array<{ start: number, end: number, iterable: string, binding: string }> = []
  const tokens = /@foreach\s*\(|@endforeach\b/g
  let token: RegExpExecArray | null
  while ((token = tokens.exec(masked))) {
    if (token[0].startsWith('@endforeach')) { const scope = stack.pop(); if (scope) { scope.end = token.index; scopes.push(scope) }; continue }
    const parsed = componentDirectiveExpression(masked, tokens.lastIndex - 1)
    if (!parsed) continue
    const loop = parseNativeComponentLoop(parsed.expression)
    const cursor = parsed.end
    if (loop) stack.push({ start: cursor, end: masked.length, iterable: loop.iterable, binding: loop.key ? `${loop.value}, ${loop.key}` : loop.value })
    tokens.lastIndex = cursor
  }
  return scopes.sort((a, b) => a.start - b.start)
}
