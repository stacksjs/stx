import type { StaticPath, StaticPathsResult } from './ssg'
import { classifyAllScripts } from './script-classifier'
import { declaresClientIdentifier } from './client-declarations'
import { bracketDepths, stripCommentsAndLiterals } from './strip-literals'
import { extractBalancedExpression, findMatchingDelimiter } from './parser/tokenizer'

export type StaticPathsOutcome =
  | { kind: 'absent' }
  | { kind: 'ok', value: StaticPathsResult }
  | { kind: 'error', phase: 'read' | 'parse' | 'execute' | 'result', error: Error }

/** Define static paths for dynamic routes (used in templates). */
export function defineStaticPaths(
  pathsFn: () => Promise<StaticPath[]> | StaticPath[],
): () => Promise<StaticPathsResult> {
  return async () => ({ paths: await pathsFn(), fallback: false })
}

let transpiler: InstanceType<typeof Bun.Transpiler> | undefined

/** Extract a top-level hook without executing unrelated page setup. */
function hookExpression(code: string): string {
  // Bun validates/transpiles TypeScript first. The shared lexer then masks
  // comments, strings, templates and regex literals without moving offsets.
  const masked = stripCommentsAndLiterals(code)
  const { depths } = bracketDepths(masked)
  const declarations = /\b(?:async\s+)?function\s+getStaticPaths\s*\(/g
  let match: RegExpExecArray | null
  while ((match = declarations.exec(masked)) !== null) {
    if (depths[match.index] !== 0)
      continue
    const paramsEnd = findMatchingDelimiter(masked, '(', ')', declarations.lastIndex - 1)
    const bodyStart = masked.indexOf('{', paramsEnd + 1)
    const bodyEnd = findMatchingDelimiter(masked, '{', '}', bodyStart)
    if (paramsEnd < 0 || bodyStart < 0 || bodyEnd < 0)
      break
    return code.slice(match.index, bodyEnd + 1)
  }
  // Also support the documented const/arrow/defineStaticPaths forms. The
  // transpiler prints statement terminators, so a balanced initializer ends
  // at its own semicolon rather than consuming the next declaration.
  const variables = /\b(?:const|let|var)\s+getStaticPaths\s*=/g
  while ((match = variables.exec(masked)) !== null) {
    if (depths[match.index] !== 0)
      continue
    const end = extractBalancedExpression(masked, variables.lastIndex).endPos
    return code.slice(variables.lastIndex, end).trim()
  }
  throw new SyntaxError('Could not extract getStaticPaths; use a top-level function or const declaration')
}

/**
 * Preserve failure provenance instead of collapsing it into "hook absent".
 * Hook evaluation remains isolated from the page's other server declarations;
 * this does not add imported/module-closure evaluation to the SSG.
 */
export async function readStaticPaths(filePath: string): Promise<StaticPathsOutcome> {
  let phase: Extract<StaticPathsOutcome, { kind: 'error' }>['phase'] = 'read'
  try {
    const content = await Bun.file(filePath).text()
    phase = 'parse'
    const scripts = classifyAllScripts(content)
    const serverScripts = [...scripts.server, ...scripts.client, ...scripts.signals]
      .filter(script => /(?:^|\s)server(?:\s|=|$)/i.test(stripCommentsAndLiterals(script.attrs)))
      .sort((a, b) => content.indexOf(a.fullTag) - content.indexOf(b.fullTag))
    for (const script of serverScripts) {
      if (!/\bgetStaticPaths\b/.test(stripCommentsAndLiterals(script.content)))
        continue
      const code = (transpiler ??= new Bun.Transpiler({ loader: 'ts', target: 'bun' })).transformSync(script.content)
      if (!/\bgetStaticPaths\b/.test(stripCommentsAndLiterals(code)))
        continue
      const expression = hookExpression(code)
      if (/\bdefineStaticPaths\b/.test(stripCommentsAndLiterals(expression)) && declaresClientIdentifier(code, 'defineStaticPaths'))
        throw new SyntaxError('Cannot evaluate a module-local defineStaticPaths binding during isolated hook extraction')
      phase = 'execute'
      const hook = new Function('defineStaticPaths', `return (${expression})`)(defineStaticPaths)
      if (typeof hook !== 'function')
        throw new TypeError('getStaticPaths must be a function')
      const returned: unknown = await hook()
      phase = 'result'
      const value = Array.isArray(returned) ? { paths: returned } : returned
      if (!value || typeof value !== 'object' || !('paths' in value) || !Array.isArray(value.paths))
        throw new TypeError('getStaticPaths must return { paths: [...] } or an array of paths')
      for (const entry of value.paths) {
        if (!entry || typeof entry !== 'object' || !entry.params || typeof entry.params !== 'object' || Array.isArray(entry.params))
          throw new TypeError('Each getStaticPaths path must contain a params object')
      }
      return { kind: 'ok', value: value as StaticPathsResult }
    }
    return { kind: 'absent' }
  }
  catch (error) {
    return { kind: 'error', phase, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
