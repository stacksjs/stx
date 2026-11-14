import { scanHtmlScriptElements } from './html-masking'
/** The author checker uses the same metadata and method parser as the element emitter. */
import { clientMethods, componentScriptSource, componentMetadataBlock, componentDirectiveExpression, parseMetadata, parseNativeComponentLoop, typeForProperty } from './component-library'
import type { SourceMetadata, ClientMethodValidator } from './component-library'
import { scriptAttributes, scriptContainsCode } from './script-attributes'
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'
import { collectImportedNames, extractTypeDeclarations } from './stx-virtual-ts'
import type { ScriptColumnEdit } from './stx-virtual-ts'

export interface NativeComponentContext {
  declarations: string
  checks: Array<{ text: string, line: number, column: number, origin: 'client' | 'component' }>
  project(code: string): { code: string, columns: Map<number, ScriptColumnEdit[]> }
}

export function nativeComponentContext(source: string, validate?: ClientMethodValidator): NativeComponentContext | undefined {
  const scannable = componentScriptSource(source)
  const metadataBlock = componentMetadataBlock(source)
  if (!metadataBlock) return
  let metadata: SourceMetadata
  try { metadata = parseMetadata(source, 'component') }
  catch (error) {
    const at = metadataBlock.open
    const message = error instanceof Error ? error.message : 'Invalid component metadata'
    return { declarations: '', checks: [{ text: `({})[${JSON.stringify(message)}];`, line: source.slice(0, at).split('\n').length, column: at - source.lastIndexOf('\n', at - 1), origin: 'component' }], project: code => ({ code, columns: new Map() }) }
  }
  const blocks = scanHtmlScriptElements(scannable).filter(block => { const attributes = scriptAttributes(block.attrs); return scriptContainsCode(attributes) && attributes.has('client') && !attributes.has('server') && !attributes.has('component') && !attributes.has('stx:component') && !attributes.has('src') })
  const script = blocks.map(block => source.slice(block.bodyStart, block.bodyEnd)).join('\n')
  const methods = clientMethods(script, validate)
  const hasState = extractTypeDeclarations(script).some(type => type.name === 'ComponentState') || collectImportedNames(script).includes('ComponentState')
  const properties = Object.entries(metadata.properties || metadata.props || {}).map(([name, property]) => `${JSON.stringify(name)}: ${typeForProperty(property)}`).join('; ')
  const names = [...new Set(methods.map(method => method.name))]
  const declarations = [
    `interface __StxMetadataProperties { ${properties} }`,
    'type __StxNativeProperties = Omit<__StxMetadataProperties, keyof HTMLElement> & Pick<HTMLElement, Extract<keyof __StxMetadataProperties, keyof HTMLElement>>;',
    'type __StxAny<T> = 0 extends (1 & T) ? true : false;',
    'type __StxAnyFields<T> = { [K in keyof T]-?: __StxAny<T[K]> extends true ? K : never }[keyof T];',
    'type __StxSpecific<T> = __StxAny<T> extends true ? false : T extends object ? string extends keyof T ? false : number extends keyof T ? false : symbol extends keyof T ? false : __StxAnyFields<T> extends never ? true : false : false;',
    hasState ? 'type __StxState = __StxSpecific<ComponentState> extends true ? ComponentState : {};' : 'type __StxState = {};',
    hasState ? 'declare function __stxSpecificState(value: __StxSpecific<ComponentState> extends true ? true : "ComponentState requires named explicit fields without any or index signatures"): void;' : '',
    hasState ? 'declare const __stxStateProperties: Pick<ComponentState, Extract<keyof ComponentState, keyof __StxInstanceProperties>>;' : '',
    hasState ? 'declare function __stxStateMethods(value: Extract<keyof ComponentState, __StxMethodNames | "emit" | "requestUpdate" | "updateComplete" | "renderRoot"> extends never ? true : "ComponentState cannot redeclare component methods"): void;' : '',
    `type __StxMethodNames = ${names.map(name => JSON.stringify(name)).join(' | ') || 'never'};`,
    'type __StxInstanceProperties = Omit<HTMLElement, __StxMethodNames | keyof __StxNativeProperties> & __StxNativeProperties;',
    'type __StxPrivateKeys<T> = Exclude<keyof T, keyof HTMLElement | keyof __StxNativeProperties | __StxMethodNames | "emit" | "updateComplete" | "requestUpdate" | "renderRoot">;',
    hasState ? 'declare function __stxOptionalPrivate(value: { [K in __StxPrivateKeys<ComponentState>]-?: {} extends Pick<ComponentState, K> ? never : K }[__StxPrivateKeys<ComponentState>] extends never ? true : "Private ComponentState fields must be optional until initialized"): void;' : '',
    'type __StxRefinedProperties = { [K in keyof __StxNativeProperties]: K extends keyof __StxState ? __StxAny<__StxState[K]> extends true ? __StxNativeProperties[K] : __StxState[K] extends __StxNativeProperties[K] ? __StxState[K] : __StxNativeProperties[K] : __StxNativeProperties[K] };',
    'type __StxNativeComponent = Omit<HTMLElement, keyof __StxNativeProperties | __StxMethodNames> & __StxRefinedProperties & Partial<Pick<__StxState, __StxPrivateKeys<__StxState>>> & {',
    'readonly updateComplete: Promise<void>; requestUpdate(): Promise<void>; readonly renderRoot: HTMLElement | ShadowRoot;',
    'emit<T = unknown>(name: string, detail?: T, options?: CustomEventInit<T>): boolean;',
    ...names.map(name => `${JSON.stringify(name)}: typeof ${name};`),
    '}',
  ].filter(Boolean).join('\n')
  let stateOffset = -1
  for (const block of blocks) {
    const bodyStart = block.bodyStart
    const code = source.slice(bodyStart, block.bodyEnd), masked = stripCommentsAndLiterals(code), depths = bracketDepths(masked).depths
    const found = [...masked.matchAll(/\b(?:interface|type)\s+ComponentState\b/g)].find(match => depths[match.index!] === 0)
      ?? (collectImportedNames(code).includes('ComponentState') ? /\bComponentState\b/.exec(masked) : undefined)
    if (found) { stateOffset = bodyStart + found.index; break }
  }
  const checks: NativeComponentContext['checks'] = hasState && stateOffset >= 0 ? [{ origin: 'client', text: '__stxSpecificState(true); __stxStateMethods(true); __stxOptionalPrivate(true); __stxStateProperties satisfies Pick<__StxInstanceProperties, Extract<keyof ComponentState, keyof __StxInstanceProperties>>;', line: source.slice(0, stateOffset).split('\n').length, column: stateOffset - source.lastIndexOf('\n', stateOffset - 1) }] : []
  const metadataStart = metadataBlock.start
  const raw = metadataBlock.code, maskedMetadata = stripCommentsAndLiterals(raw), metadataDepths = bracketDepths(maskedMetadata).depths
  const positions = new Map<string, number>()
  let inProperties = false
  for (const token of raw.matchAll(/"(?:\\.|[^"\\])*"\s*:/g)) {
    const key: string = JSON.parse(token[0].slice(0, token[0].lastIndexOf(':')).trim())
    if (metadataDepths[token.index!] === 1 && ['properties', 'props'].includes(key)) { inProperties = true; continue }
    if (inProperties && metadataDepths[token.index!] === 1) inProperties = false
    if (inProperties && metadataDepths[token.index!] === 2 && !positions.has(key)) positions.set(key, metadataStart + token.index!)
  }
  for (const [name, property] of Object.entries(metadata.properties || metadata.props || {})) {
    const at = positions.get(name) ?? metadataStart
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
