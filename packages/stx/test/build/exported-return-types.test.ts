/**
 * Every exported function that returns a value must annotate its return type
 * (stacksjs/stx#1796).
 *
 * The shipped declarations are emitted by bun-plugin-dtsx, which is a syntactic
 * emitter — it does not run a type checker, so it cannot resolve an inferred
 * return type and falls back to `void`. An exported function that returns a
 * value without annotating it is therefore published to consumers as returning
 * nothing:
 *
 *   export function useLocalStorage<T>(key, defaultValue, options?) {
 *     return useStorage(key, defaultValue, { ...options, storage: 'local' })
 *   }
 *
 *   // dist/composables/use-storage.d.ts
 *   export declare function useLocalStorage<T>(…): void;   // ← wrong
 *
 * which surfaces in apps as `Property 'value' does not exist on type 'void'`
 * for a function that plainly returns a StorageRef. Nineteen exports shipped
 * that way before this guard existed.
 *
 * The check is deliberately source-level rather than build-level: it runs in
 * milliseconds and pins the exact precondition dtsx needs, so the failure
 * arrives when the function is written instead of after it ships.
 */
import { describe, expect, it } from 'bun:test'
import { Glob } from 'bun'
import path from 'node:path'

const SRC = path.resolve(__dirname, '../../src')

interface Offender {
  file: string
  name: string
  line: number
}

/**
 * Find the matching close brace for the `{` at `openIndex`, skipping strings,
 * template literals, comments and regex-ish slashes well enough to locate a
 * function body's end.
 */
function findBodyEnd(src: string, openIndex: number): number {
  let depth = 0
  let i = openIndex
  let quote: string | null = null
  let inLine = false
  let inBlock = false

  for (; i < src.length; i++) {
    const c = src[i]
    const next = src[i + 1]

    if (inLine) {
      if (c === '\n')
        inLine = false
      continue
    }
    if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i++ }
      continue
    }
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote)
        quote = null
      continue
    }
    if (c === '/' && next === '/') { inLine = true; i++; continue }
    if (c === '/' && next === '*') { inBlock = true; i++; continue }
    if (c === '"' || c === '\'' || c === '`') { quote = c; continue }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0)
        return i
    }
  }
  return src.length
}

/**
 * Blank out the contents of strings, template literals and comments, keeping
 * length and newlines so offsets and line numbers still line up.
 *
 * Without this the scan matches `export function …` inside generated-code
 * template literals — component-library.ts emits a client-side bundle as a
 * template string containing its own exports, which are not TypeScript
 * declarations and are not subject to dtsx at all.
 */
function maskLiterals(src: string): string {
  const out = src.split('')
  let i = 0
  let quote: string | null = null
  let inLine = false
  let inBlock = false

  const blank = (idx: number) => { if (out[idx] !== '\n') out[idx] = ' ' }

  for (; i < src.length; i++) {
    const c = src[i]
    const next = src[i + 1]

    if (inLine) {
      if (c === '\n') { inLine = false; continue }
      blank(i)
      continue
    }
    if (inBlock) {
      if (c === '*' && next === '/') { blank(i); blank(i + 1); i++; inBlock = false; continue }
      blank(i)
      continue
    }
    if (quote) {
      if (c === '\\') { blank(i); blank(i + 1); i++; continue }
      if (c === quote) { quote = null; continue }
      blank(i)
      continue
    }
    if (c === '/' && next === '/') { inLine = true; i++; continue }
    if (c === '/' && next === '*') { inBlock = true; i++; continue }
    if (c === '"' || c === '\'' || c === '`') { quote = c; continue }
  }

  return out.join('')
}

function scanFile(rawSrc: string, rel: string): Offender[] {
  const src = maskLiterals(rawSrc)
  const found: Offender[] = []
  // `export function name<T>(…)` — the only form dtsx emits as a declared
  // function. Arrow consts are emitted from their initialiser and aren't
  // subject to this failure mode.
  const re = /^export\s+(?:async\s+)?function\s+(\*?\s*)([A-Za-z_$][\w$]*)\s*(?:<[^{]*?>)?\s*\(/gm
  let m: RegExpExecArray | null

  while ((m = re.exec(src)) !== null) {
    const isGenerator = m[1].includes('*')
    const name = m[2]

    // Walk to the body brace, tracking parenthesis depth so a default value
    // containing `)` doesn't end the parameter list early.
    let i = re.lastIndex
    let depth = 1
    let quote: string | null = null
    for (; i < src.length && depth > 0; i++) {
      const c = src[i]
      if (quote) {
        if (c === '\\') { i++; continue }
        if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === '\'' || c === '`') { quote = c; continue }
      if (c === '(') depth++
      else if (c === ')') depth--
    }

    const braceIdx = src.indexOf('{', i)
    if (braceIdx === -1)
      continue

    // Between the closing paren and the body brace: `: SomeType` if annotated.
    const between = src.slice(i, braceIdx)
    if (between.includes(':'))
      continue

    // Unannotated. Does the body actually return a value?
    const bodyEnd = findBodyEnd(src, braceIdx)
    const body = src.slice(braceIdx, bodyEnd)
    // `return` followed by something other than `;`/newline. Nested functions
    // inside the body can produce a false positive; that is acceptable for a
    // guard whose remedy (annotate the return type) is harmless either way.
    if (!/\breturn\s+(?![;\n])/.test(body))
      continue
    // A generator's declared return type is an iterator, not the yielded value.
    if (isGenerator)
      continue

    found.push({ file: rel, name, line: src.slice(0, m.index).split('\n').length })
  }

  return found
}

describe('exported functions annotate their return types', () => {
  it('has no exported function that returns a value without an annotation', async () => {
    const offenders: Offender[] = []

    for await (const file of new Glob('**/*.ts').scan({ cwd: SRC, absolute: true })) {
      if (file.endsWith('.d.ts'))
        continue
      const rel = path.relative(SRC, file)
      offenders.push(...scanFile(await Bun.file(file).text(), rel))
    }

    const report = offenders
      .map(o => `  ${o.file}:${o.line}  ${o.name}()`)
      .sort()
      .join('\n')

    expect(
      offenders.length === 0
        ? ''
        : `These exported functions return a value but do not annotate the return type,\n`
          + `so bun-plugin-dtsx will ship them as \`: void\` (stacksjs/stx#1796):\n\n${report}\n`,
    ).toBe('')
  })
})
