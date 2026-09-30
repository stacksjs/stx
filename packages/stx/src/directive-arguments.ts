/**
 * Argument handling for directives whose arguments are expressions.
 *
 * Written for the SEO directives (`@seo`, `@meta`, `@metaTag`,
 * `@structuredData`), and kept free of anything SEO-specific so a custom
 * directive can use it too (`CustomDirective.rawParams`).
 *
 * Every one of these used to fail the same way: an argument that was not the
 * one shape its regex expected was either left in the page as literal text or
 * replaced with nothing, and no one was told. `@seo(seo)` never matched a
 * pattern that insisted on `{`; `@meta('author', post.author)` sent the words
 * "post.author" as the author; `@structuredData(prodcut)` emitted a JSON-LD
 * block holding nothing but `@context`. Each page looked fine and was wrong
 * where it counts, in a link preview or a search result.
 *
 * So the directives share one way to find their call (balanced and quote-aware,
 * so `'Smile :)'` does not end the call early), one way to tell a string literal
 * from an expression, one evaluator that can say WHY a value is missing, and one
 * way to report a failure: an inline comment where the tag would have been, plus
 * a console warning naming the file.
 */
import type { ErrorCode } from './errors/codes'
import path from 'node:path'
import { ErrorCodes, inlineError } from './error-handling'
import { findMatchingDelimiter } from './parser/tokenizer'
import { createSafeContext, createSafeFunction, freeIdentifiers, getExpressionSafetyRule } from './safe-evaluator'

// =============================================================================
// Finding calls
// =============================================================================

export interface DirectiveCall {
  /** Index of the `@`. */
  start: number
  /** Index one past the closing paren, or -1 when the call is never closed. */
  end: number
  /** The text between the parens, as written. */
  args: string
  /** The whole call, `@name(...)`, or its first 80 characters when unclosed. */
  call: string
}

/**
 * Every `@name(...)` call in `template` matched by `pattern`, in order.
 *
 * `pattern` must be global and end at the opening paren. The closing paren is
 * found by balance, skipping parens inside strings, so an argument may hold any
 * expression: `@seo(build({ title: 'Smile :)' }))` is one call.
 */
export function findDirectiveCalls(template: string, pattern: RegExp): DirectiveCall[] {
  const calls: DirectiveCall[] = []
  pattern.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(template)) !== null) {
    const start = match.index
    const openParen = start + match[0].length - 1
    const closeParen = findMatchingDelimiter(template, '(', ')', openParen)

    if (closeParen === -1) {
      calls.push({ start, end: -1, args: '', call: template.slice(start, Math.min(template.length, start + 80)) })
      pattern.lastIndex = openParen + 1
      continue
    }

    calls.push({
      start,
      end: closeParen + 1,
      args: template.slice(openParen + 1, closeParen),
      call: template.slice(start, closeParen + 1),
    })
    pattern.lastIndex = closeParen + 1
  }

  return calls
}

/**
 * Replace every call {@link findDirectiveCalls} finds.
 *
 * One left-to-right pass over the original text: a replacement is never
 * rescanned, so markup that happens to contain the directive's name cannot
 * loop. A call with no closing paren keeps its text, preceded by whatever
 * `onUnterminated` returns, so the author sees both the report and the call.
 */
export function replaceDirectiveCalls(
  template: string,
  pattern: RegExp,
  replace: (args: string, call: string) => string,
  onUnterminated: (call: string) => string,
): string {
  let output = ''
  let cursor = 0

  for (const found of findDirectiveCalls(template, pattern)) {
    output += template.slice(cursor, found.start)
    if (found.end === -1) {
      output += onUnterminated(found.call)
      cursor = found.start
      continue
    }
    output += replace(found.args, found.call)
    cursor = found.end
  }

  return output + template.slice(cursor)
}

/**
 * Split an argument list at its top-level commas.
 *
 * Commas inside strings, template literals, brackets, braces and parens belong
 * to the argument they sit in: `'a, b', fn(x, y)` is two arguments, not four.
 * Arguments come back trimmed and exactly as written, quotes included, so the
 * caller can still tell `'title'` (the word) from `title` (a variable).
 */
export function splitTopLevelArgs(args: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (let i = 0; i < args.length; i++) {
    const char = args[i]

    if (quote) {
      current += char
      if (char === '\\' && i + 1 < args.length) {
        current += args[++i]
        continue
      }
      if (char === quote)
        quote = null
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
    }
    else if (char === '(' || char === '[' || char === '{') {
      depth++
    }
    else if (char === ')' || char === ']' || char === '}') {
      depth--
    }
    else if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  if (current.trim())
    parts.push(current.trim())

  return parts
}

/**
 * The value of `raw` when it is exactly one string literal, otherwise `null`.
 *
 * `'a' + b`, `'a' || 'b'` and a template literal with `${}` in it are
 * expressions and return `null`. A literal is read here rather than handed to
 * the evaluator because the evaluator's safety screen reads words, and a
 * description is allowed to say "eval".
 */
export function parseStringLiteral(raw: string): string | null {
  const text = raw.trim()
  const quote = text[0]
  if ((quote !== '\'' && quote !== '"' && quote !== '`') || text.length < 2 || text.at(-1) !== quote)
    return null

  let value = ''
  for (let i = 1; i < text.length - 1; i++) {
    const char = text[i]
    if (char === '\\' && i + 1 < text.length - 1) {
      const next = text[++i]
      value += next === 'n' ? '\n' : next === 't' ? '\t' : next
      continue
    }
    // An unescaped quote closes the literal before the end: `'a' + 'b'`.
    if (char === quote)
      return null
    if (quote === '`' && char === '$' && text[i + 1] === '{')
      return null
    value += char
  }

  return value
}

// =============================================================================
// Evaluating
// =============================================================================

export type EvaluatedArgument =
  | { ok: true, value: unknown }
  | { ok: false, message: string, code: ErrorCode }

/** Words `freeIdentifiers` returns that are syntax, not variables. */
const NOT_VARIABLES = new Set([
  'true', 'false', 'null', 'undefined', 'typeof', 'void', 'new', 'in', 'of',
  'instanceof', 'this', 'delete', 'await', 'async', 'function', 'return',
  'NaN', 'Infinity',
])

/**
 * Evaluate a directive argument against the template's context.
 *
 * The shared evaluator turns every failure into `undefined`, which is right for
 * `{{ }}` and wrong here: a directive whose whole job is to produce a tag has
 * to be able to say why it produced none. So the three ways an expression
 * fails are told apart:
 *
 * - it is not allowed (the safety screen) or not JavaScript (a syntax error);
 * - it names a variable the template does not have, which is almost always a
 *   value declared in a plain (client) `<script>`, or a typo;
 * - it is an object or array literal that came back `undefined`, which only
 *   happens when something inside it threw.
 *
 * A defined variable that simply holds `null` or `undefined` is not a failure:
 * `@seo(page.seo)` on a page without one is allowed to render nothing.
 */
export function evaluateDirectiveArgument(expression: string, context: Record<string, unknown>): EvaluatedArgument {
  const source = expression.trim()
  if (!source)
    return { ok: false, message: 'the argument is empty', code: ErrorCodes.INVALID_DIRECTIVE_SYNTAX }

  const rule = getExpressionSafetyRule(source)
  if (rule)
    return { ok: false, message: `the expression is not allowed (${rule})`, code: ErrorCodes.UNSAFE_EXPRESSION }

  const safeContext = createSafeContext(context)
  let value: unknown
  try {
    const fn = createSafeFunction(source, Object.keys(safeContext))
    value = fn(...Object.values(safeContext))
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, message: `the expression could not be evaluated: ${message}`, code: ErrorCodes.EVALUATION_ERROR }
  }

  if (value !== undefined && value !== null)
    return { ok: true, value }

  const missing = [...new Set(freeIdentifiers(source))]
    .filter(name => !NOT_VARIABLES.has(name) && !(name in safeContext) && !(name in globalThis))
  if (missing.length > 0) {
    const names = missing.map(name => `"${name}"`).join(', ')
    return {
      ok: false,
      message: `${names} ${missing.length === 1 ? 'is' : 'are'} not defined here. `
        + 'Values a directive reads must come from <script server> or the render context; a plain <script> runs in the browser. '
        + 'To pass literal text, quote it.',
      code: ErrorCodes.UNDEFINED_VARIABLE,
    }
  }

  if (value === undefined && (source.startsWith('{') || source.startsWith('[')))
    return { ok: false, message: 'the expression threw while it was evaluated', code: ErrorCodes.EVALUATION_ERROR }

  return { ok: true, value }
}

/** How a value reads in an error message. */
export function describeValue(value: unknown): string {
  if (value === null)
    return 'null'
  if (Array.isArray(value))
    return 'an array'
  if (typeof value === 'object')
    return 'an object'
  if (typeof value === 'string')
    return `a string ("${value.length > 40 ? `${value.slice(0, 40)}...` : value}")`
  return `${/^[aeiou]/.test(typeof value) ? 'an' : 'a'} ${typeof value}`
}

/** A plain object: not null, not an array. */
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// =============================================================================
// Reporting
// =============================================================================

function displayPath(filePath: string): string {
  if (!filePath)
    return ''
  return path.isAbsolute(filePath) ? path.relative(process.cwd(), filePath) || filePath : filePath
}

/** The call as it reads in a message: one line, and not the whole object. */
export function shortCall(call: string): string {
  const flat = call.replace(/\s+/g, ' ').trim()
  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat
}

/**
 * Report a directive that produced nothing: a console warning naming the file,
 * and an inline comment where the tag would have been, for whoever reads the
 * built HTML (which is how most of these were found).
 */
export function reportDirectiveFailure(
  label: string,
  call: string,
  message: string,
  filePath: string,
  code: ErrorCode = ErrorCodes.EVALUATION_ERROR,
): string {
  const where = filePath ? ` in ${displayPath(filePath)}` : ''
  console.warn(`[stx] ${shortCall(call)}${where}: ${message}`)
  return inlineError(label, `${shortCall(call)}: ${message}`, code)
}

/** Warn without replacing anything: the directive rendered, but not all of it. */
export function warnDirective(call: string, message: string, filePath: string): void {
  const where = filePath ? ` in ${displayPath(filePath)}` : ''
  console.warn(`[stx] ${shortCall(call)}${where}: ${message}`)
}
