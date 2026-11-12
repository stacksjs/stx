/**
 * What a type hint is made of, before anything is drawn.
 *
 * Three questions an editor asks a language server, and the text handling each
 * one needs on this side: which word is under a point (hover), which call the
 * caret is inside and at which argument (signature help), and how the answer
 * that comes back is cut up for display. None of it touches the DOM, so it is
 * tested as plain functions.
 */

const WORD_CHARACTER = /[\p{L}\p{N}_$]/u

export interface WordRange {
  /** Columns in the line: `from` inclusive, `to` exclusive. */
  from: number
  to: number
  word: string
}

/**
 * The word at a column, or null when the column is not on one.
 *
 * A column is on a word when the character at it is part of one. The position
 * just past a word's last character counts too when `inclusiveEnd` is set,
 * which is where a caret rests after typing the word.
 */
export function wordAt(text: string, column: number, inclusiveEnd: boolean = false): WordRange | null {
  if (column < 0 || column > text.length)
    return null

  let at = column
  if (at >= text.length || !WORD_CHARACTER.test(text.charAt(at))) {
    if (!inclusiveEnd || at === 0 || !WORD_CHARACTER.test(text.charAt(at - 1)))
      return null
    at--
  }

  let from = at
  while (from > 0 && WORD_CHARACTER.test(text.charAt(from - 1)))
    from--
  let to = at + 1
  while (to < text.length && WORD_CHARACTER.test(text.charAt(to)))
    to++

  return { from, to, word: text.slice(from, to) }
}

export interface HoverSegment {
  kind: 'code' | 'text'
  text: string
  /** The fence's language for a code segment. Empty when it named none. */
  language: string
}

const FENCE = /^(`{3,}|~{3,})[ \t]*([\w+#.-]*)[^\n]*\n([\s\S]*?)\n?^\1[ \t]*$/gm

/**
 * Hover content as the pieces it is drawn in.
 *
 * A language server answers in Markdown, and the part worth keeping exactly is
 * the fenced block: that is the signature. Each fence becomes a code segment,
 * and what lies between fences becomes text, left as written. Nothing here
 * interprets Markdown beyond the fence, on purpose: the text is shown as text.
 */
export function parseHoverContent(content: string): HoverSegment[] {
  const source = content.replace(/\r\n?/g, '\n')
  const segments: HoverSegment[] = []
  const text = (value: string): void => {
    const trimmed = value.replace(/^\n+|\s+$/g, '')
    if (trimmed !== '')
      segments.push({ kind: 'text', text: trimmed, language: '' })
  }

  let last = 0
  FENCE.lastIndex = 0
  for (let match = FENCE.exec(source); match; match = FENCE.exec(source)) {
    text(source.slice(last, match.index))
    if (match[3] !== '')
      segments.push({ kind: 'code', text: match[3]!, language: match[2] ?? '' })
    last = match.index + match[0].length
  }
  text(source.slice(last))

  return segments
}

/** Hover content as one line of plain text, for a screen reader. */
export function hoverPlainText(content: string): string {
  return parseHoverContent(content)
    .map(segment => segment.text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('. ')
}

export interface CallContext {
  /** Index in the text of the call's opening parenthesis. */
  open: number
  /** Zero-based index of the argument the text ends in. */
  active: number
}

/** How far back a call is looked for. A caret is rarely further into one. */
const CALL_SCAN_LIMIT = 4000
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' }

/**
 * The call the end of `text` is inside, or null when it is inside none.
 *
 * Reads forward, keeping a stack of open brackets and stepping over strings
 * and comments, so a parenthesis or a comma in a string does not count. The
 * call is the nearest unclosed parenthesis; commas directly inside it, and not
 * inside a nested bracket, say which argument.
 *
 * It is an estimate from text alone. A language server knows better, and its
 * answer is what gets shown; this decides when to ask, and keeps the active
 * argument moving between answers.
 */
export function callContext(text: string): CallContext | null {
  const start = Math.max(0, text.length - CALL_SCAN_LIMIT)
  const stack: Array<{ bracket: string, index: number, commas: number }> = []
  let quote = ''

  for (let index = start; index < text.length; index++) {
    const character = text.charAt(index)

    if (quote) {
      if (character === '\\')
        index++
      else if (character === quote || (character === '\n' && quote !== '`'))
        quote = ''
      continue
    }

    if (character === '"' || character === '\'' || character === '`') {
      quote = character
    }
    else if (character === '/' && text.charAt(index + 1) === '/') {
      const end = text.indexOf('\n', index)
      index = end === -1 ? text.length : end
    }
    else if (character === '/' && text.charAt(index + 1) === '*') {
      const end = text.indexOf('*/', index + 2)
      index = end === -1 ? text.length : end + 1
    }
    else if (character === '(' || character === '[' || character === '{') {
      stack.push({ bracket: character, index, commas: 0 })
    }
    else if (character in CLOSERS) {
      // A closer with nothing to close began before the scan did. Ignore it.
      if (stack.length > 0 && stack[stack.length - 1]!.bracket === CLOSERS[character])
        stack.pop()
    }
    else if (character === ',' && stack.length > 0) {
      stack[stack.length - 1]!.commas++
    }
  }

  // Inside a string or a comment there is no argument being written.
  if (quote)
    return null

  for (let depth = stack.length - 1; depth >= 0; depth--) {
    const frame = stack[depth]!
    if (frame.bracket === '(')
      return { open: frame.index, active: frame.commas }
    // A block is not an argument: `if (x) { foo` is not inside a call.
    if (frame.bracket === '{' && !/(?:[(,=:]|=>)\s*$/.test(text.slice(Math.max(start, frame.index - 40), frame.index)))
      return null
  }

  return null
}

/** One parameter of a signature: its text in the label, or where it sits in it. */
export type SignatureParameter = string | [number, number] | { label: string | [number, number], documentation?: string }

export interface SignatureHelp {
  /** The whole signature, as one line: `fetchUser(id: string, fresh?: boolean): User`. */
  label: string
  parameters?: readonly SignatureParameter[]
  /** Zero-based index of the parameter being written. */
  active?: number
  documentation?: string
}

export interface SignatureParts {
  before: string
  /** The active parameter's text. Empty when there is none to mark. */
  active: string
  after: string
  /** What the active parameter says about itself, when it does. */
  parameterDocumentation: string
}

/**
 * A signature cut around its active parameter.
 *
 * Parameters are found in the label in order, each search starting where the
 * last one ended, so two parameters with the same text are told apart. A
 * parameter given as a pair of offsets is taken as is.
 */
export function signatureParts(help: SignatureHelp): SignatureParts {
  const { label } = help
  const parameters = help.parameters ?? []
  const active = help.active ?? 0
  const none: SignatureParts = { before: label, active: '', after: '', parameterDocumentation: '' }
  let cursor = 0

  for (let index = 0; index < parameters.length; index++) {
    const parameter = parameters[index]!
    const spec = typeof parameter === 'object' && !Array.isArray(parameter) ? parameter.label : parameter
    let from: number
    let to: number

    if (Array.isArray(spec)) {
      from = Math.max(0, Math.min(label.length, spec[0]))
      to = Math.max(from, Math.min(label.length, spec[1]))
    }
    else {
      from = spec === '' ? -1 : label.indexOf(spec as string, cursor)
      if (from === -1) {
        if (index === active)
          return none
        continue
      }
      to = from + (spec as string).length
    }
    cursor = to

    if (index === active) {
      return {
        before: label.slice(0, from),
        active: label.slice(from, to),
        after: label.slice(to),
        parameterDocumentation: typeof parameter === 'object' && !Array.isArray(parameter) ? parameter.documentation ?? '' : '',
      }
    }
  }

  return none
}
