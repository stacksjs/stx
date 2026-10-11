/** Parameter bindings shadow ambient helpers only inside their function. */
import { stripCommentsAndLiterals } from './strip-literals'

interface Token { text: string, start: number, end: number }
interface Scope { start: number, end: number, names: Set<string> }
interface Analysis { code: string, scopes: Scope[] }
let cachedSource = ''
let cached: Analysis | undefined

const identifier = /^[A-Za-z_$][\w$]*$/
const controls = new Set(['if', 'for', 'while', 'switch', 'with'])

/** The shared literal scanner preserves interpolation code and UTF-16 offsets. */
function tokenize(source: string): { code: string, tokens: Token[] } {
  const code = stripCommentsAndLiterals(source)
  const tokens: Token[] = []
  for (const match of code.matchAll(/[A-Za-z_$][\w$]*|=>|\.\.\.|[^\s]/g)) {
    const start = match.index ?? 0
    tokens.push({ text: match[0], start, end: start + match[0].length })
  }
  return { code, tokens }
}

function analyze(source: string): Analysis {
  if (cached && source === cachedSource) return cached
  const { code, tokens } = tokenize(source)
  const pairs = new Map<number, number>()
  const stack: number[] = []
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index].text
    if (['(', '[', '{'].includes(token)) stack.push(index)
    else if ([')', ']', '}'].includes(token)) {
      const open = stack.at(-1)
      if (open !== undefined && ['()', '[]', '{}'].includes(tokens[open].text + token)) {
        stack.pop()
        pairs.set(open, index)
        pairs.set(index, open)
      }
    }
  }

  function parts(start: number, end: number): Array<[number, number]> {
    const result: Array<[number, number]> = []
    let begin = start
    for (let index = start; index < end; index++) {
      if (['(', '[', '{'].includes(tokens[index].text) && (pairs.get(index) ?? end) < end) { index = pairs.get(index)!; continue }
      if (tokens[index].text === ',') { result.push([begin, index]); begin = index + 1 }
    }
    result.push([begin, end])
    return result
  }
  function pattern(start: number, end: number, names: Set<string>): void {
    if (tokens[start]?.text === '...') start++
    if (start >= end) return
    const first = tokens[start].text
    if (identifier.test(first)) { names.add(first); return }
    if (first !== '{' && first !== '[') return
    const close = pairs.get(start)
    if (close === undefined || close >= end) return
    for (const [begin, finish] of parts(start + 1, close)) {
      let binding = begin
      if (first === '{') {
        for (let index = begin; index < finish; index++) {
          if (tokens[index].text === ':') { binding = index + 1; break }
          if (tokens[index].text === '=') break
          if (['(', '[', '{'].includes(tokens[index].text) && pairs.has(index)) index = pairs.get(index)!
        }
      }
      pattern(binding, finish, names)
    }
  }
  function parameterNames(start: number, end: number): Set<string> {
    const names = new Set<string>()
    for (const [begin, finish] of parts(start, end)) pattern(begin, finish, names)
    return names
  }
  function expressionEnd(start: number): number {
    let index = start
    for (; index < tokens.length; index++) {
      const token = tokens[index].text
      if (['(', '[', '{'].includes(token) && pairs.has(index)) { index = pairs.get(index)!; continue }
      if ([',', ';', ')', ']', '}'].includes(token)) break
    }
    return tokens[Math.max(start, index - 1)]?.end ?? code.length
  }

  const scopes: Scope[] = []
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].text === '=>') {
      const previous = index - 1
      let begin = previous
      let names: Set<string>
      if (tokens[previous]?.text === ')' && pairs.has(previous)) {
        begin = pairs.get(previous)!
        names = parameterNames(begin + 1, previous)
      }
      else if (tokens[previous] && identifier.test(tokens[previous].text)) names = new Set([tokens[previous].text])
      else continue
      const body = index + 1
      const end = tokens[body]?.text === '{' && pairs.has(body) ? tokens[pairs.get(body)!].end : expressionEnd(body)
      scopes.push({ start: tokens[begin].start, end, names })
    }
    else if (tokens[index].text === '(' && pairs.has(index)) {
      const previous = tokens[index - 1]?.text
      if (!previous || controls.has(previous) || (!identifier.test(previous) && previous !== '*' && previous !== ']')) continue
      const close = pairs.get(index)!
      let body = close + 1
      // TypeScript return annotations are still present on the pre-bundle pass.
      if (tokens[body]?.text === ':') {
        body++
        while (body < tokens.length && !['{', '=>', ';', '='].includes(tokens[body].text)) body++
      }
      if (tokens[body]?.text !== '{' || !pairs.has(body)) continue
      scopes.push({ start: tokens[index].start, end: tokens[pairs.get(body)!].end, names: parameterNames(index + 1, close) })
    }
  }
  cachedSource = source
  cached = { code, scopes }
  return cached
}

export function parameterAnalysis(source: string): { code: string, shadows: (name: string, offset: number) => boolean } {
  const analysis = analyze(source)
  return { code: analysis.code, shadows: (name, offset) => analysis.scopes.some(scope => offset >= scope.start && offset < scope.end && scope.names.has(name)) }
}
