/**
 * A component that declares `<script server cache>` must earn it.
 *
 * That attribute is an author's promise to stx that the fragment is a pure
 * function of props and slots. stx takes the promise literally: on a hit it
 * returns the stored HTML and replays the render's other effects, keyed on
 * props, slot and scope id — but NOT on the caller's scope. A server block that
 * reads a binding the surrounding page declared would therefore be served one
 * page's render on another page. There is no runtime check; the promise is the
 * whole contract.
 *
 * It is worth a lot. Opting ten components in took a page using them from
 * 127ms to 18ms per render, byte-identical (stacksjs/stx#1945). Which is
 * exactly why the promise needs a guard: the incentive is to add the attribute,
 * and nothing else notices when a later edit quietly makes it false.
 *
 * So this reads every server block of every opted-in component and asserts it
 * references nothing beyond its own locals, its imports, `$props`/slots, the
 * bindings stx injects, and JS globals.
 *
 * The scan is deliberately crude — it works on text, not an AST — and it errs
 * toward reporting too much rather than too little. A false positive here costs
 * someone a minute of reading; a false negative ships stale HTML.
 */

import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { STX_ENGINE_BINDING_NAMES } from '../../stx/src/variable-extractor'

const UI_DIR = path.resolve(__dirname, '../src/ui')

const JS_GLOBALS = new Set([
  'Array', 'Object', 'String', 'Number', 'Boolean', 'Math', 'JSON', 'Date', 'RegExp', 'Map', 'Set',
  'WeakMap', 'WeakSet', 'Promise', 'Symbol', 'BigInt', 'Error', 'TypeError', 'RangeError', 'Infinity',
  'NaN', 'undefined', 'null', 'true', 'false', 'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'globalThis', 'structuredClone',
  'Intl', 'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder',
])
const STX_PROVIDED = new Set<string>([
  ...STX_ENGINE_BINDING_NAMES,
  '$props', '$slots', '$slot', '$attrs', '$el', '$uid', 'props', 'slot',
])
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 'for', 'of', 'in', 'while', 'do',
  'switch', 'case', 'default', 'break', 'continue', 'new', 'typeof', 'instanceof', 'delete', 'void',
  'this', 'super', 'export', 'import', 'from', 'as', 'async', 'await', 'yield', 'try', 'catch',
  'finally', 'throw', 'extends', 'static', 'get', 'set',
])

/** Server blocks of a `.stx` source, in order. */
function serverBlocks(source: string): string[] {
  return [...source.matchAll(/<script\b([^>]*\bserver\b[^>]*)>([\s\S]*?)<\/script>/gi)].map(m => m[2])
}

/** Names a block reads that it did not declare and stx does not provide. */
function freeIdentifiers(code: string): string[] {
  let src = code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    // Template literals keep `${` and `}` so interpolations still read.
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, m => m.replace(/[^${}]/g, ' '))
    .replace(/'(?:\\.|[^'\\])*'/g, '\'\'')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    // Regex literals, or the flags of `/\s+/g` read as the names `s` and `g`.
    .replace(/([([,=:!&|?+\-*%;{}]|return|typeof)(\s*)\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n])+\/[gimsuyd]*/g, '$1$2/0/')

  const declared = new Set<string>()
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))
    declared.add(m[1])
  for (const m of src.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g))
    for (const part of m[1].split(',')) {
      const name = part.split(':').pop()!.split('=')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name)
    }
  // Function and arrow parameters, single and multi.
  for (const m of src.matchAll(/(?:function\s*[A-Za-z_$\w]*\s*)?\(([^()]*)\)\s*(?:=>|\{)/g))
    for (const part of m[1].split(',')) {
      const name = part.split('=')[0].trim().replace(/^\.\.\./, '').split(':')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name)
    }
  for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1])
  // Imports are module bindings, not reads of the caller's scope.
  for (const m of src.matchAll(/\bimport\s+(?:\{([^}]*)\}|([A-Za-z_$][\w$]*))/g)) {
    if (m[2]) declared.add(m[2])
    for (const part of (m[1] || '').split(','))
      declared.add(part.split(/\bas\b/).pop()!.trim())
  }

  // A property is not a variable read, and neither is an object-literal key.
  src = src.replace(/\??\.\s*[A-Za-z_$][\w$]*/g, '').replace(/([A-Za-z_$][\w$]*)\s*:/g, '')

  const free = new Set<string>()
  for (const m of src.matchAll(/\$?\b[A-Za-z_$][\w$]*/g)) {
    const name = m[0]
    if (KEYWORDS.has(name) || JS_GLOBALS.has(name) || STX_PROVIDED.has(name) || declared.has(name))
      continue
    free.add(name)
  }
  return [...free].sort()
}

function optedInComponents(): string[] {
  return [...new Bun.Glob('**/*.stx').scanSync({ cwd: UI_DIR, absolute: true })]
    .sort()
    .filter(file => /<script\b[^>]*\bserver\b[^>]*\bcache\b/i.test(fs.readFileSync(file, 'utf8')))
}

describe('components that declare <script server cache>', () => {
  it('read nothing from the caller\'s scope', () => {
    const offenders: string[] = []

    for (const file of optedInComponents()) {
      const source = fs.readFileSync(file, 'utf8')
      const free = [...new Set(serverBlocks(source).flatMap(freeIdentifiers))].sort()
      if (free.length > 0)
        offenders.push(`${path.relative(UI_DIR, file)}: ${free.join(', ')}`)
    }

    // Named, not counted -- a failure should say which component and which
    // binding, because the fix is either to stop reading it or to drop `cache`.
    expect(offenders).toEqual([])
  })

  it('is actually guarding something', () => {
    // If the glob or the attribute test broke, the assertion above would pass
    // over an empty list and pin nothing.
    expect(optedInComponents().length).toBeGreaterThanOrEqual(10)
  })
})
