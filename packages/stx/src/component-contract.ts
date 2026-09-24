import { stripCommentsAndLiterals } from './strip-literals'

export interface ComponentContract {
  declarations: string
  props: string | null
  events: string | null
}

/** Find a matching delimiter without interpreting delimiters in strings/comments. */
function closeAt(masked: string, start: number, open: string, close: string): number {
  let depth = 0
  for (let i = start; i < masked.length; i++) {
    if (masked[i] === open) depth++
    else if (masked[i] === close && !(close === '>' && masked[i - 1] === '=')) {
      if (--depth === 0) return i
    }
  }
  return -1
}

function argumentsOf(source: string): string[] {
  const masked = stripCommentsAndLiterals(source)
  let depth = 0
  let start = 0
  const args: string[] = []
  for (let i = 0; i < masked.length; i++) {
    if ('([{'.includes(masked[i])) depth++
    else if (')]}'.includes(masked[i])) depth--
    else if (masked[i] === ',' && depth === 0) {
      args.push(source.slice(start, i).trim())
      start = i + 1
    }
  }
  args.push(source.slice(start).trim())
  return args
}

function macroCall(code: string, names: string[]): { type: string, args: string[] } | null {
  const masked = stripCommentsAndLiterals(code)
  const pattern = new RegExp(`\\b(?:${names.map(name => name.replace(/[$]/g, '\\$&')).join('|')})\\s*(?=[<(])`, 'g')
  for (const match of masked.matchAll(pattern)) {
    let at = match.index! + match[0].length
    let type = ''
    if (masked[at] === '<') {
      const close = closeAt(masked, at, '<', '>')
      if (close < 0) continue
      type = code.slice(at + 1, close)
      at = close + 1
      while (/\s/.test(masked[at] || '') && at < masked.length) at++
    }
    if (masked[at] !== '(') continue
    const close = closeAt(masked, at, '(', ')')
    if (close >= 0) return { type, args: argumentsOf(code.slice(at + 1, close)) }
  }
  return null
}

export const COMPONENT_CONTRACT_HELPERS = `
type __StxCtor<T> = T extends StringConstructor ? string : T extends NumberConstructor ? number : T extends BooleanConstructor ? boolean : T extends ArrayConstructor ? unknown[] : T extends ObjectConstructor ? object : T extends readonly unknown[] ? __StxCtor<T[number]> : T extends abstract new (...args: any[]) => infer V ? V : unknown;
type __StxWiden<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
type __StxOption<T> = T extends { type: infer C } ? __StxCtor<C> : T extends { default: infer D } ? D extends (...args: any[]) => infer V ? V : __StxWiden<D> : __StxCtor<T>;
type __StxRequired<O> = { [K in keyof O]-?: O[K] extends { required: true } ? K : never }[keyof O];
type __StxDefaulted<O> = { [K in keyof O]-?: O[K] extends { default: unknown } ? K : never }[keyof O];
type __StxOptions<O> = { [K in Exclude<__StxRequired<O>, __StxDefaulted<O>>]: __StxOption<O[K]> } & { [K in Exclude<keyof O, Exclude<__StxRequired<O>, __StxDefaulted<O>>>]?: __StxOption<O[K]> };
type __StxDefaults<P, K> = Omit<P, Extract<keyof P, K>> & Partial<Pick<P, Extract<keyof P, K>>>;
`

/**
 * Project a child's declared contract into its parent's virtual TS module.
 * TypeScript, not this scanner, resolves aliases, imports and assignability.
 * Original script bodies stay isolated inside a namespace; they are never run.
 */
export function componentContract(code: string, namespace: string): ComponentContract {
  const imports: string[] = []
  const aliases = { defineProps: ['defineProps'], defineEmits: ['defineEmits'], withDefaults: ['withDefaults'] }
  const masked = stripCommentsAndLiterals(code)
  const body = code.replace(/\bimport\s+(?:type\s+)?(\{[^}]*\}|\*\s+as\s+[\w$]+|[\w$]+)\s+from\s*(['"])([^'"]+)\2\s*;?/g, (whole, bindings: string, _quote: string, specifier: string, offset: number) => {
    if (masked.slice(offset, offset + 6) !== 'import') return whole
    if (specifier.endsWith('.stx')) return ''
    const id = `${namespace}Import${imports.length}`
    imports.push(`import * as ${id} from ${JSON.stringify(specifier)};`)
    if (bindings.startsWith('*'))
      return `import ${bindings.replace(/^\*\s+as\s+/, '')} = ${id};`
    if (!bindings.startsWith('{'))
      return `import ${bindings} = ${id}.default;`
    return bindings.slice(1, -1).split(',').map((binding) => {
      const [original, local = original] = binding.trim().replace(/^type\s+/, '').split(/\s+as\s+/)
      if (!original) return ''
      if (/^(?:stx|@stacksjs\/stx)(?:\/|$)/.test(specifier) && original in aliases)
        aliases[original as keyof typeof aliases].push(local)
      return `import ${local} = ${id}.${original};`
    }).join('\n')
  })
  const props = macroCall(code, aliases.defineProps)
  const emits = macroCall(code, aliases.defineEmits)
  const defaults = macroCall(code, aliases.withDefaults)
  if (!props && !emits)
    return { declarations: '', props: null, events: null }
  const declarations: string[] = []
  let propType: string | null = null
  let eventType: string | null = null
  if (props) {
    declarations.push(`const __options = (${props.args[0] || '{}'}) as const;`)
    declarations.push(`const __defaults = (${defaults?.args[1] || '{}'});`)
    const raw = props.type || '__StxOptions<typeof __options>'
    declarations.push(`export type __StxProps = __StxDefaults<${raw}, keyof typeof __defaults | __StxDefaulted<typeof __options>>;`)
    propType = `${namespace}.__StxProps`
  }
  if (emits) {
    declarations.push(`const __events = (${emits.args[0] || '[]'}) as const;`)
    declarations.push(`export type __StxEvents = ${emits.type || 'Record<(typeof __events)[number], any[]>'};`)
    eventType = `${namespace}.__StxEvents`
  }
  return {
    declarations: `${imports.join('\n')}\nnamespace ${namespace} {\n${body}\n${declarations.join('\n')}\n}`,
    props: propType,
    events: eventType,
  }
}
