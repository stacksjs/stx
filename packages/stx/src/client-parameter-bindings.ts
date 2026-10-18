/** Parameter bindings shadow ambient helpers only inside their function. */
import { stripCommentsAndLiterals } from './strip-literals'

interface Token { text: string, start: number, end: number }
interface Scope { start: number, end: number, bodyStart: number, functionBody: boolean, names: Set<string> }
interface Site { name: string, token: number, file?: boolean, functionScoped?: boolean }
interface LoopScope { headStart: number, headEnd: number, start: number, end: number }
interface Analysis { code: string, scopes: Scope[], loops: LoopScope[], declarations: Set<string>, sites: Site[], tokens: Token[], pairs: Map<number, number> }
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
  // Where each declared name is declared, for unboundNames.
  const sites: Site[] = []
  function pattern(start: number, end: number, names: Set<string>, functionScoped = false): void {
    if (tokens[start]?.text === '...') start++
    if (start >= end) return
    const first = tokens[start].text
    if (identifier.test(first)) {
      names.add(first)
      if (names === declarations) sites.push({ name: first, token: start, functionScoped })
      return
    }
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
      pattern(binding, finish, names, functionScoped)
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

  const declarations = new Set<string>()
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
      scopes.push({ start: tokens[begin].start, end, bodyStart: tokens[body]?.start ?? end, functionBody: true, names })
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
      scopes.push({ start: tokens[index].start, end: tokens[pairs.get(body)!].end, bodyStart: tokens[body].start, functionBody: previous !== 'catch', names: parameterNames(index + 1, close) })
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
  // A let/const in a for head belongs to the loop, not the surrounding
  // function/file. Keeping that range separate preserves a free use after it.
  const loops: LoopScope[] = []
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].text !== 'for') continue
    const head = tokens[index + 1]?.text === 'await' ? index + 2 : index + 1
    if (tokens[head]?.text !== '(' || !pairs.has(head)) continue
    const close = pairs.get(head)!
    const body = close + 1
    const finish = tokens[body]?.text === '{' && pairs.has(body)
      ? pairs.get(body)!
      : declarationEnd(body)
    const end = tokens[finish]?.text === ';' || tokens[finish]?.text === '}'
      ? tokens[finish].end
      : tokens[Math.max(body, finish - 1)]?.end ?? code.length
    loops.push({ headStart: head, headEnd: close, start: tokens[head].start, end })
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
          pattern(begin, at, declarations, token === 'var')
          begin = at + 1
          inType = false
          initialised = false
        }
      }
    }
    else if (token === 'function' || token === 'class') {
      let name = index + 1
      if (tokens[name]?.text === '*') name++
      if (tokens[name] && identifier.test(tokens[name].text) && tokens[name].text !== 'extends') {
        declarations.add(tokens[name].text)
        sites.push({ name: tokens[name].text, token: name })
      }
    }
    else if (token === 'import') {
      // `import X from`, `import * as X from`, `import X, { … } from`. Named
      // specifiers are read by the callers, which know their aliases.
      let name = index + 1
      if (tokens[name]?.text === '*' && tokens[name + 1]?.text === 'as') name += 2
      const binding = tokens[name]?.text
      if (binding && identifier.test(binding) && binding !== 'type' && tokens[name + 1]?.text !== '(' && tokens[name + 1]?.text !== '.') {
        declarations.add(binding)
        sites.push({ name: binding, token: name, file: true })
      }
      // Named specifiers bind too, for the whole file: `{ a, b as c }`.
      const brace = tokens[name]?.text === '{' ? name : tokens[name + 1]?.text === ',' && tokens[name + 2]?.text === '{' ? name + 2 : -1
      if (brace !== -1 && pairs.has(brace)) {
        const close = pairs.get(brace)!
        for (const [begin, finish] of parts(brace + 1, close)) {
          let local = finish - 1
          while (local >= begin && !identifier.test(tokens[local].text)) local--
          if (local >= begin && tokens[local].text !== 'type')
            sites.push({ name: tokens[local].text, token: local, file: true })
        }
      }
    }
  }

  cachedSource = source
  cached = { code, scopes, loops, declarations, sites, tokens, pairs }
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

/**
 * Which of `candidates` the source uses without binding them itself: a
 * mention that no declaration of the same name encloses, and no parameter
 * shadows. Block declarations bind their block, loop-head declarations their
 * loop, and var declarations their enclosing function (or the file). A
 * property (`x.name`), a key (`{ name: … }`) and a declaration itself are not uses.
 *
 * What it is for: a bundle that inlined a module refers to that module's
 * functions by name, and those mentions must not pull in a second, global
 * copy of the same functions (composable-loader's reachability scan).
 */
export function unboundNames(source: string, candidates: ReadonlySet<string>): Set<string> {
  const { scopes, loops, sites, tokens, pairs } = analyze(source)
  // The innermost '{' enclosing each token, or -1 for the file.
  const enclosing = Array.from({ length: tokens.length }, () => -1)
  const open: number[] = []
  for (let index = 0; index < tokens.length; index++) {
    enclosing[index] = open.length ? open[open.length - 1]! : -1
    const text = tokens[index].text
    if (text === '{' && pairs.has(index)) open.push(index)
    else if (text === '}' && open.length && pairs.get(index) === open[open.length - 1]) open.pop()
  }
  const declaredAt = new Set<number>()
  const ranges = new Map<string, Array<[number, number]>>()
  for (const site of sites) {
    if (!candidates.has(site.name)) continue
    declaredAt.add(site.token)
    const brace = site.file ? -1 : enclosing[site.token]!
    let range: [number, number] = brace === -1 ? [0, Number.POSITIVE_INFINITY] : [tokens[brace].start, tokens[pairs.get(brace)!].end]
    if (site.functionScoped) {
      const at = tokens[site.token].start
      const owner = scopes.filter(scope => scope.functionBody && at >= scope.bodyStart && at < scope.end)
        .sort((a, b) => (a.end - a.bodyStart) - (b.end - b.bodyStart))[0]
      range = owner ? [owner.bodyStart, owner.end] : [0, Number.POSITIVE_INFINITY]
    }
    else if (!site.file) {
      const owner = loops.filter(loop => site.token > loop.headStart && site.token < loop.headEnd)
        .sort((a, b) => (a.headEnd - a.headStart) - (b.headEnd - b.headStart))[0]
      if (owner) range = [owner.start, owner.end]
    }
    const list = ranges.get(site.name)
    if (list) list.push(range)
    else ranges.set(site.name, [range])
  }
  // `import { a as b }`: the imported name is a module's export, not a use.
  const inImport = new Set<number>()
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].text !== 'import' || tokens[index - 1]?.text === '.') continue
    // Only `import {`, `import type {` or `import X, {`: anything else
    // (a side-effect import, `import(`) has no specifier braces to skip.
    let at = index + 1
    if (tokens[at]?.text === 'type') at++
    if (tokens[at] && identifier.test(tokens[at].text) && tokens[at + 1]?.text === ',') at += 2
    if (tokens[at]?.text === '{' && pairs.has(at)) {
      for (let inner = at + 1; inner < pairs.get(at)!; inner++) inImport.add(inner)
    }
  }
  const found = new Set<string>()
  for (let index = 0; index < tokens.length; index++) {
    const name = tokens[index].text
    if (!candidates.has(name) || found.has(name) || declaredAt.has(index) || inImport.has(index)) continue
    const previous = tokens[index - 1]?.text
    if (previous === '#' || previous === '.' && tokens[index - 2]?.text !== '..') continue
    if (tokens[index + 1]?.text === ':' && (previous === '{' || previous === ',')) continue
    const at = tokens[index].start
    if (ranges.get(name)?.some(([from, to]) => at >= from && at < to)) continue
    if (scopes.some(scope => at >= scope.start && at < scope.end && scope.names.has(name))) continue
    found.add(name)
  }
  return found
}
