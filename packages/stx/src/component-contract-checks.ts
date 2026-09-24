import fs from 'node:fs'
import path from 'node:path'
import type { TemplateExpression } from './stx-virtual-ts'
import { componentContract, COMPONENT_CONTRACT_HELPERS } from './component-contract'
import { buildStxIndex, componentImportCandidates, resolveComponentFileSync, resolvePackageDir } from './component-resolution'
import { rendersAsElement } from './component-tags'
import { stripCommentsAndLiterals } from './strip-literals'

interface ComponentAttribute {
  name: string
  value: string | true
  offset: number
  braced: boolean
}

/** Scan opening tags without treating > or } inside expressions as delimiters. */
function* componentOpenTags(source: string): Generator<{ name: string, offset: number, attributes: ComponentAttribute[] }> {
  const starts = /<([A-Za-z][\w.-]*)(?=[\s/>])/g
  let tag: RegExpExecArray | null
  while ((tag = starts.exec(source))) {
    let cursor = starts.lastIndex
    const attributes: ComponentAttribute[] = []
    while (cursor < source.length) {
      while (/\s/.test(source[cursor] || '')) cursor++
      if (source[cursor] === '>' || source.slice(cursor, cursor + 2) === '/>') {
        cursor += source[cursor] === '>' ? 1 : 2
        break
      }
      const name = /^[^\s=/>]+/.exec(source.slice(cursor))?.[0]
      if (!name) { cursor++; continue }
      const nameStart = cursor
      cursor += name.length
      while (/\s/.test(source[cursor] || '')) cursor++
      if (source[cursor] !== '=') {
        attributes.push({ name, value: true, offset: nameStart, braced: false })
        continue
      }
      cursor++
      while (/\s/.test(source[cursor] || '')) cursor++
      const delimiter = source[cursor]
      const braced = delimiter === '{'
      const quoted = delimiter === '"' || delimiter === "'"
      if (quoted || braced) cursor++
      const offset = cursor
      if (braced) {
        const masked = stripCommentsAndLiterals(source.slice(cursor))
        let depth = 1
        let i = 0
        for (; i < masked.length; i++) {
          if (masked[i] === '{') depth++
          if (masked[i] === '}' && --depth === 0) break
        }
        cursor += i
      }
      else if (quoted) {
        while (cursor < source.length && source[cursor] !== delimiter) cursor++
      }
      else {
        while (cursor < source.length && !/[\s/>]/.test(source[cursor])) cursor++
      }
      attributes.push({ name, value: source.slice(offset, cursor), offset, braced })
      if (quoted || braced) cursor++
    }
    starts.lastIndex = cursor
    yield { name: tag[1], offset: tag.index, attributes }
  }
}

export interface ContractCheck {
  expression: TemplateExpression
  statement: { text: string, prefixLength: number }
}

export interface ContractCheckOptions {
  filePath: string
  componentsDir?: string
  projectRoot?: string
  readComponent?: (file: string) => string | undefined
  scriptCode: (source: string, file: string) => string
}

/** Parent call-site checks; shared unchanged by CLI and editor virtual buffers. */
export function componentContractChecks(source: string, masked: string, options: ContractCheckOptions): {
  declarations: string
  checks: ContractCheck[]
  events: Map<number, string>
  dependencies: Map<string, string>
} {
  const checks: ContractCheck[] = []
  const declarations = [COMPONENT_CONTRACT_HELPERS,
    'type __StxAssignedValue<T> = T extends { readonly _isSignal: true } | { readonly _isDerived: true } ? T extends () => infer V ? V : T : T;',
    'type __StxProp<P, K> = K extends keyof P ? P[K] : unknown;',
    'type __StxEvent<E, K> = K extends keyof E ? E[K] extends readonly unknown[] ? Exclude<E[K]["length"], 0 | 1> extends never ? E[K][0] : E[K] : E[K] : any;']
  const events = new Map<number, string>()
  const dependencies = new Map<string, string>()
  const imported = new Map<string, string>()
  // Explicit local component aliases, including a named import from a folder.
  const scripts = options.scriptCode(source, options.filePath)
  const maskedScripts = stripCommentsAndLiterals(scripts)
  for (const match of scripts.matchAll(/\bimport\s+(\{[^}]+\}|[\w$]+)\s+from\s*['"]([^'"]+)['"]/g)) {
    if (maskedScripts.slice(match.index, match.index! + 6) !== 'import') continue
    const specifier = match[2]
    const absolute = path.isAbsolute(specifier) || specifier.startsWith('.')
      ? path.resolve(path.dirname(options.filePath), specifier)
      : resolvePackageDir(specifier, path.dirname(options.filePath))
    if (!absolute) continue
    const singleFile = absolute.endsWith('.stx') ? absolute
      : fs.existsSync(`${absolute}.stx`) ? `${absolute}.stx` : undefined
    const index = singleFile ? null : buildStxIndex(absolute, false)
    const bindings = match[1].startsWith('{') ? match[1].slice(1, -1).split(',') : [match[1]]
    for (const binding of bindings) {
      const [name, alias = name] = binding.trim().split(/\s+as\s+/)
      const file = singleFile || index?.get(name) || index?.get(name.toLowerCase())
      if (file) {
        imported.set(alias, file)
        imported.set(alias.toLowerCase(), file)
        imported.set(alias.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(), file)
      }
    }
  }
  for (const match of masked.matchAll(/@import\s*\(([^)]+)\)/g)) {
    for (const specifier of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
      const file = componentImportCandidates(specifier[1], options.filePath, options)
        .find(candidate => fs.statSync(candidate, { throwIfNoEntry: false })?.isFile())
      if (file) imported.set(path.basename(specifier[1]).replace(/\.stx$/, ''), file)
    }
  }
  const context = { __importedComponents: imported }
  const contracts = new Map<string, ReturnType<typeof componentContract>>()
  const position = (offset: number, code: string, attribute?: string): TemplateExpression => {
    const before = source.slice(0, offset)
    return { code, offset, attribute, anchor: true, kind: 'directive', line: before.split('\n').length, column: offset - before.lastIndexOf('\n') }
  }
  const check = (expression: TemplateExpression, prefix: string, suffix: string) =>
    checks.push({ expression, statement: { text: prefix + expression.code + suffix, prefixLength: prefix.length } })

  // Quoted > characters remain within the opening tag, not its terminator.
  for (const tag of componentOpenTags(masked)) {
    if (rendersAsElement(tag.name) || tag.name === 'component') continue
    const file = resolveComponentFileSync(tag.name, options.filePath, options, context)
    if (!file) continue
    let contract = contracts.get(file)
    if (!contract) {
      let child: string | undefined
      try { child = options.readComponent ? options.readComponent(file) : fs.readFileSync(file, 'utf8') }
      catch { continue }
      if (child === undefined) continue
      dependencies.set(file, child)
      contract = componentContract(options.scriptCode(child, file), `__StxComponent${contracts.size}`)
      contracts.set(file, contract)
      declarations.push(contract.declarations)
    }
    const present: string[] = []
    for (const attribute of tag.attributes) {
      const { name, offset } = attribute
      const value = attribute.value === true ? 'true' : attribute.value
      if (name.startsWith('@') || name.startsWith('v-on:')) {
        if (contract.events && attribute.value !== true)
          events.set(offset, `__StxEvent<${contract.events}, ${JSON.stringify(name.replace(/^@|^v-on:/, '').split('.')[0])}>`)
        continue
      }
      const model = /^v-model(?::([\w-]+))?(?:\.[\w-]+)*$/.exec(name)
      if (name.startsWith('v-') && !name.startsWith('v-bind:') && !model) continue
      if (/^(?:x-|:)(?:if|for|show|key|else)(?:$|[.:-])/.test(name)) continue
      const prop = (model ? model[1] || 'modelValue' : name.replace(/^:|^v-bind:/, '')).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      present.push(prop)
      if (!contract.props) continue
      const dynamic = name.startsWith(':') || name.startsWith('v-bind:') || !!model || attribute.braced
      const code = dynamic ? value : attribute.value !== true ? JSON.stringify(value) : 'true'
      check(position(offset, code, name), ';void ((', `) satisfies __StxProp<${contract.props}, ${JSON.stringify(prop)}>);`)
    }
    if (contract.props) {
      // Values are checked individually above so errors map to their attribute.
      // This separate shape check reports omitted required props on the tag.
      const fields = [...new Set(present)].map(name => `${JSON.stringify(name)}: undefined as any`).join(', ')
      const expression = position(tag.offset, `<${tag.name}>`)
      checks.push({ expression, statement: { text: `;void ({ ${fields} } satisfies ${contract.props} & Record<string, unknown>);`, prefixLength: 0 } })
    }
  }
  return { declarations: contracts.size ? declarations.join('\n') : '', checks, events, dependencies }
}
