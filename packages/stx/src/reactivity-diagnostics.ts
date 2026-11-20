import type { ScriptBlock } from './stx-virtual-ts'
import type { TypecheckDiagnostic } from './typecheck'
import { topLevelDeclarationSites, unboundNames } from './client-parameter-bindings'
import { stripCommentsAndLiterals } from './strip-literals'
import { extractTemplateExpressions } from './stx-virtual-ts'

const signalFactories = new Set(['state', 'derived', 'memo', 'ref', 'computed'])

/** Find direct setup snapshots that are later read by a reactive template binding. */
export function stxReactivityDiagnostics(file: string, source: string, blocks: readonly ScriptBlock[]): TypecheckDiagnostic[] {
  const diagnostics: TypecheckDiagnostic[] = []
  let templateExpressions: ReturnType<typeof extractTemplateExpressions> | undefined
  for (const block of blocks) {
    if (block.kind === 'server') continue
    const masked = stripCommentsAndLiterals(block.code)
    const factories = unboundNames(block.code, signalFactories)
    for (const match of block.code.matchAll(/\bimport\s*\{([^}]*)\}\s*from\s*['"](?:stx|@stacksjs\/stx)['"]/g)) {
      if (!masked.slice(match.index).startsWith('import')) continue
      for (const specifier of match[1].split(',')) {
        const [name, alias] = specifier.trim().split(/\s+as\s+/)
        if (signalFactories.has(name)) factories.add(alias || name)
      }
    }
    if (!factories.size) continue
    const declarations = topLevelDeclarationSites(block.code)
    const signals = new Set<string>()
    const snapshots = []
    for (const site of declarations) {
      const initializer = /^\s*=\s*([A-Za-z_$][\w$]*)\s*/.exec(masked.slice(site.nameEnd))
      if (!initializer) continue
      const callee = initializer[1]
      const rest = masked.slice(site.nameEnd + initializer[0].length)
      if (factories.has(callee) && /^(?:<[^<>\n]+>\s*)?\(/.test(rest)) {
        signals.add(site.name)
        continue
      }
      if (signals.has(callee) && /^(?:\(\s*\)|\.\s*value(?![\w$]))/.test(rest)) {
        const offset = site.nameEnd + initializer[0].indexOf(callee, initializer[0].indexOf('=') + 1)
        snapshots.push({ name: site.name, signal: callee, offset })
      }
    }
    if (!snapshots.length) continue

    templateExpressions ??= extractTemplateExpressions(source)
    const names = new Set(snapshots.map(snapshot => snapshot.name))
    const used = new Set<string>()
    for (const expression of templateExpressions) {
      const attribute = expression.attribute
      if (attribute && /^(?:@|v-on:|x-on:)/.test(attribute)) continue
      for (const name of unboundNames(expression.code, names)) used.add(name)
    }
    for (const { name, signal, offset } of snapshots) {
      if (!used.has(name)) continue
      const before = block.code.slice(0, offset)
      const line = block.startLine + before.split('\n').length - 1
      const column = offset - before.lastIndexOf('\n') + (line === block.startLine ? (block.startColumn ?? 1) - 1 : 0)
      diagnostics.push({
        file, line, column, code: 0, diagnosticId: 'STX_UNTRACKED_SETUP_READ',
        category: 'warning', blockKind: block.kind,
        message: `"${name}" reads "${signal}" once during setup. Move the read into the template or wrap the expression in derived(). Use peek() for an intentional snapshot.`,
      })
    }
  }
  return diagnostics
}
