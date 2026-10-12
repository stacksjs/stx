/** Parameter bindings shadow ambient helpers only inside their function. */
import { stripCommentsAndLiterals } from './strip-literals'

interface Token { text: string, start: number, end: number }
interface Scope { start: number, end: number, names: Set<string> }
interface Analysis { code: string, scopes: Scope[], declarations: Set<string> }
let cachedSource = ''
let cached: Analysis | undefined

const identifier = /^[A-Za-z_$][\w$]*$/
const controls = new Set(['if', 'for', 'while', 'switch', 'with'])
const openers = ['(', '[', '{']
const closers = [')', ']', '}']
// Words that can only start a statement. `function`, `class` and `import(…)`
// can also be an initialiser (`var a=function(){},b=1`), so they are not here.
const statements = new Set(['const', 'let', 'var', 'return', 'if', 'for', 'while', 'do', 'switch', 'try', 'throw', 'export'])

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
  // Every name the script declares, wherever it is declared.
  //
  // A regex over `const|let|var NAME` saw the first declarator of a list and
  // no other. Minified code declares in lists - `var bi=0,Fr=new Map` - so
  // `Fr` went unseen, and its `Fr.get(s)` read as a model query
  // (`Trail.get(…)`). @stacksjs/mobile's image cache, minified to `J` in
  // the phone build, was auto-imported from @stacksjs/browser that way, and
  // every phone page reported a "J" the client runtime does not provide.
  const declarations = new Set<string>()
  // Where a declaration list ends: a `;`, the bracket that encloses it (a
  // `for (…)` head), or a line break between two statements under ASI.
  function declarationEnd(start: number): number {
    let index = start
    for (; index < tokens.length; index++) {
      const token = tokens[index].text
      if (openers.includes(token) && pairs.has(index)) { index = pairs.get(index)!; continue }
      if (token === ';' || closers.includes(token)) break
      const previous = tokens[index - 1]
      // The next statement, whatever the previous line ended with (a string
      // is blanked to spaces, so `'x'\nlet b` reaches here after a bare `=`).
      if (index > start && statements.has(token) && previous.text !== '.') break
      if (index > start && /[\n\r]/.test(code.slice(previous.end, tokens[index].start))
        && (/^[\w$]+$/.test(previous.text) || closers.includes(previous.text) || ['"', '\'', '`'].includes(previous.text))
        && identifier.test(token) && !['in', 'of', 'instanceof'].includes(token))
        break
    }
    return index
  }
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index].text
    // `obj.var`, `{ let: 1 }` - a property name, not a keyword.
    const previous = tokens[index - 1]?.text
    if (previous === '.' || tokens[index + 1]?.text === ':') continue
    // `as const`, `<const T>` - TypeScript, not a declaration.
    if (previous === 'as' || previous === '<') continue
    if (token === 'const' || token === 'let' || token === 'var') {
      const end = declarationEnd(index + 1)
      // Split on the list's own commas: not those in brackets, nor in a type
      // annotation's arguments (`const m: Map<string, Trail> = …`).
      let begin = index + 1
      let inType = false
      let initialised = false
      let angles = 0
      for (let at = index + 1; at <= end; at++) {
        const text = tokens[at]?.text
        if (at < end && openers.includes(text) && pairs.has(at) && pairs.get(at)! < end) { at = pairs.get(at)!; continue }
        // Only the annotation before the initialiser: a ternary's `:` is not one.
        if (at < end && text === ':' && !initialised) inType = true
        else if (at < end && text === '=' && angles === 0) { inType = false; initialised = true }
        else if (at < end && inType && text === '<') angles++
        else if (at < end && inType && text === '>' && angles > 0) angles--
        else if (at === end || (text === ',' && angles === 0)) {
          pattern(begin, at, declarations)
          begin = at + 1
          inType = false
          initialised = false
        }
      }
    }
    else if (token === 'function' || token === 'class') {
      let name = index + 1
      if (tokens[name]?.text === '*') name++
      if (tokens[name] && identifier.test(tokens[name].text) && tokens[name].text !== 'extends') declarations.add(tokens[name].text)
    }
    else if (token === 'import') {
      // `import X from`, `import * as X from`, `import X, { … } from`. Named
      // specifiers are read by the callers, which know their aliases.
      let name = index + 1
      if (tokens[name]?.text === '*' && tokens[name + 1]?.text === 'as') name += 2
      const binding = tokens[name]?.text
      if (binding && identifier.test(binding) && binding !== 'type' && tokens[name + 1]?.text !== '(' && tokens[name + 1]?.text !== '.')
        declarations.add(binding)
    }
  }

  cachedSource = source
  cached = { code, scopes, declarations }
  return cached
}

export function parameterAnalysis(source: string): { code: string, shadows: (name: string, offset: number) => boolean } {
  const analysis = analyze(source)
  return { code: analysis.code, shadows: (name, offset) => analysis.scopes.some(scope => offset >= scope.start && offset < scope.end && scope.names.has(name)) }
}

/**
 * Every name the script declares: each declarator of a `const`/`let`/`var`
 * list (destructuring included), function and class names, and default or
 * namespace imports. Parameters are scoped instead; see parameterAnalysis.
 */
export function declaredNames(source: string): Set<string> {
  return new Set(analyze(source).declarations)
}
