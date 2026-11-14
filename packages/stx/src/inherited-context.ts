/** Checked contracts for the lexical server context copied by includes/layouts. */
import fs from 'node:fs'
import path from 'node:path'
import { componentContract, COMPONENT_CONTRACT_HELPERS } from './component-contract'
import { STX_ENGINE_BINDING_NAMES } from './engine-bindings'
import { componentDirectiveExpression } from './component-library'
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'
import { absolutizeRelativeSpecifiers, blankScriptDirectives, collectBlockDeclarations, extractScriptBlocks, extractTypeDeclarations, maskNonTemplateRegions, typeScopeImports } from './stx-virtual-ts'
import type { ContractCheck } from './component-contract-checks'

const engineBindings = new Set<string>(STX_ENGINE_BINDING_NAMES)

interface Contract { keys: string[], types: string, unsupported?: string, offset: number }
export function inheritedContextContract(code: string): Contract | undefined {
  const types = extractTypeDeclarations(code)
  const declaration = types.find(type => type.name === 'InheritedContext')
  if (!declaration) return
  const supported = /^(?:interface\s+InheritedContext|type\s+InheritedContext\s*=)\s*\{/.test(stripCommentsAndLiterals(declaration.text).trim())
  const maskedCode = stripCommentsAndLiterals(code), codeDepths = bracketDepths(maskedCode).depths
  const offset = [...maskedCode.matchAll(/\b(?:interface|type)\s+InheritedContext\b/g)].find(match => codeDepths[match.index!] === 0)?.index ?? 0
  const body = declaration.text.slice(declaration.text.indexOf('{') + 1, declaration.text.lastIndexOf('}'))
  const masked = stripCommentsAndLiterals(body), depths = bracketDepths(masked).depths
  const keys = [...masked.matchAll(/(?:^|[;,\n])\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/g)].filter(match => depths[match.index!] === 0).map(match => match[1]!)
  return { keys: supported ? keys : [], types: types.map(type => type.text).join('\n'), offset: Math.max(0, offset), ...(!supported ? { unsupported: 'InheritedContext requires a local non-generic object interface or object type alias with named properties' } : {}) }
}

/** The server extractor republishes value-only named/default imports, excluding its own bindings. */
function inheritedValueImports(code: string): string[] {
  const result: string[] = [], masked = stripCommentsAndLiterals(code)
  for (const match of code.matchAll(/\bimport\s+(type\s+)?([\w$*{}\s,]+?)\s+from\s*(['"])([^'"]+)\3/g)) {
    if (match[1] || masked.slice(match.index!, match.index! + 6) !== 'import') continue
    const clause = match[2]!.trim(), fromStx = ['stx', '@stacksjs/stx'].includes(match[4]!)
    if (/^[A-Za-z_$][\w$]*$/.test(clause)) { result.push(clause); continue }
    if (!clause.startsWith('{') || !clause.endsWith('}')) continue
    for (const entry of clause.slice(1, -1).split(',')) {
      if (/^\s*type\s+/.test(entry)) continue
      const [imported, local = imported] = entry.trim().split(/\s+as\s+/)
      if (local && !(fromStx && engineBindings.has(imported!))) result.push(local)
    }
  }
  return result
}

/** These names are already present at runtime; only an explicit contract types them. */
export function inheritedContextBindings(code: string): string {
  const contract = inheritedContextContract(code)
  if (!contract || contract.unsupported) return ''
  const own = new Set(collectBlockDeclarations(code))
  return contract.keys.filter(key => !own.has(key)).map(key => `declare const ${key}: InheritedContext[${JSON.stringify(key)}];`).join('\n')
}

export interface InheritedContextOptions {
  filePath: string
  partialsDir?: string
  layoutsDir?: string
  contractsKnown?: boolean
  readTemplate?: (file: string) => string | undefined
}

export function inheritedContextChecks(source: string, options: InheritedContextOptions): { declarations: string, checks: ContractCheck[], dependencies: Map<string, string> } {
  const declarations = [COMPONENT_CONTRACT_HELPERS]
  const checks: ContractCheck[] = []
  const dependencies = new Map<string, string>()
  const file = path.resolve(options.filePath)
  const views = file.split(path.sep).lastIndexOf('views')
  const inferredRoot = views >= 0 ? file.split(path.sep).slice(0, views).join(path.sep) : path.dirname(file)
  const partials = path.resolve(options.partialsDir || path.join(inferredRoot, 'partials'))
  const layouts = path.resolve(options.layoutsDir || path.join(inferredRoot, 'views/layouts'))
  // A layout/partial is checked in the contexts of its leaf pages, not as an
  // imaginary render without the values its real callers supply.
  if ([partials, layouts].some(directory => file === directory || file.startsWith(directory + path.sep))) return { declarations: '', checks, dependencies }
  const read = (target: string) => options.readTemplate?.(target) ?? (fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : undefined)
  let next = 0, foundContract = false
  const limitations: Array<{ offset: number, message: string }> = []
  function check(offset: number, text: string) {
    const line = source.slice(0, offset).split('\n').length
    const column = offset - source.lastIndexOf('\n', offset - 1)
    const expression = { code: source.slice(offset, source.indexOf('\n', offset) < 0 ? source.length : source.indexOf('\n', offset)), line, column, kind: 'directive' as const, offset, anchor: true }
    checks.push({ expression, statement: { text: `;${text}`, prefixLength: 1 } })
  }
  function visit(text: string, currentFile: string, parentType: string, parentKeys: string[], anchor: number | undefined, stack: string[]): string {
    let id = `__StxInherited${next++}`
    while ((source + text + [...dependencies.values()].join('')).includes(id)) id += '_'
    const code = extractScriptBlocks(text).filter(block => block.kind === 'server').map(block => block.code).join('\n')
    const parentValue = `${id}ParentValue`, parentAlias = `${id}ParentType`
    declarations.push(`type ${parentAlias} = ${parentType};`)
    const scope = typeScopeImports(absolutizeRelativeSpecifiers(code, path.dirname(currentFile)), id)
    declarations.push(...scope.imports)
    const contract = inheritedContextContract(code)
    if (contract && anchor !== undefined) {
      foundContract = true
      const imports = scope.imports.length ? scope.aliases.join('\n') : ''
      const projected = componentContract(`${imports}\n${contract.types}\nconst __contract = defineProps<InheritedContext>();`, `${id}Contract`)
      declarations.push(projected.declarations)
      // Imported aliases are already bound in the scope namespace; expose the
      // contract there so imported types retain their actual module identity.
      declarations.push(`declare const ${id}Input: ${parentAlias};`)
      check(anchor, contract.unsupported ? `({})[${JSON.stringify(contract.unsupported)}];` : `${id}Input satisfies ${projected.props};`)
    }
    const own = [...new Set([...collectBlockDeclarations(code), ...inheritedValueImports(code)])]
    const input = [...new Set([...parentKeys, ...(contract?.keys || [])])].filter(key => !own.includes(key))
    const inheritedType = contract ? `${parentAlias} & ${id}Contract.__StxProps` : parentAlias
    const body = blankScriptDirectives(scope.body).replace(/^[ \t]*export[ \t]+(?=(?:const|let|var|function|async|class|interface|type)\b)/gm, '')
    const edges: Array<{ name: string, target: string, kind: string, args: string, offset: number }> = []
    const masked = maskNonTemplateRegions(text)
    const directive = /@(include|extends|layout)\s*\(/g
    let match: RegExpExecArray | null
    while ((match = directive.exec(masked))) {
      const parsed = componentDirectiveExpression(masked, directive.lastIndex - 1)
      if (!parsed) continue
      directive.lastIndex = parsed.end
      const literal = /^\s*(['"])(.*?)\1\s*(?:,\s*([\s\S]*))?$/.exec(parsed.expression)
      if (!literal) { limitations.push({ offset: anchor ?? match.index, message: `Inherited context cannot be checked across dynamic @${match[1]}` }); continue }
      const name = literal[2]!, kind = match[1]!
      if (kind !== 'include' && literal[3]) limitations.push({ offset: anchor ?? match.index, message: `Inherited context cannot be checked for unsupported @${kind} data arguments` })
      const directory = kind === 'include' ? partials : layouts
      const target = path.resolve(name.startsWith('.') ? path.dirname(currentFile) : directory, name.endsWith('.stx') ? name : name + '.stx')
      if (read(target) === undefined) { limitations.push({ offset: anchor ?? match.index, message: `Inherited context target cannot be resolved: ${name}` }); continue }
      edges.push({ name: `edge${edges.length}`, target, kind, args: kind === 'include' ? literal[3] || '{}' : '{}', offset: anchor ?? match.index })
    }
    const context = `{ ...${parentValue}${own.length ? ', ' + own.join(', ') : ''} }`
    declarations.push(`namespace ${id} {\n${scope.aliases.join('\n')}\nexport async function read(${parentValue}: ${anchor === undefined ? '{}' : inheritedType}) {\n${input.length ? `const { ${input.join(', ')} } = ${parentValue};` : ''}\n${body}\nreturn { context: ${context}${edges.map(edge => `, ${edge.name}: { ...${context}, ...(${edge.args}) }`).join('')} };\n}\n}`)
    for (const edge of edges) {
      if (stack.includes(edge.target) || stack.length >= 32) { limitations.push({ offset: edge.offset, message: 'Inherited context cannot be checked across a cyclic or overly deep template graph' }); continue }
      const target = read(edge.target)!
      dependencies.set(edge.target, target)
      visit(target, edge.target, `Awaited<ReturnType<typeof ${id}.read>>[${JSON.stringify(edge.name)}]`, [...new Set([...parentKeys, ...own])], edge.offset, [...stack, edge.target])
    }
    return id
  }
  visit(source, file, '{}', [], undefined, [file])
  if (foundContract || options.contractsKnown) for (const limit of limitations) check(limit.offset, `({})[${JSON.stringify(limit.message)}];`)
  return { declarations: foundContract ? declarations.join('\n') : '', checks, dependencies }
}
