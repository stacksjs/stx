/**
 * What the keys do.
 *
 * Each command reads the editor and dispatches at most one transaction, so
 * each is one undo step. They answer false when they have nothing to do, which
 * lets the key fall through to the text field: Backspace with nothing special
 * to delete is just Backspace, and the field already knows how to do that
 * across grapheme clusters and input methods.
 */
import type { Command, EditorCore } from './editor'
import type { SelectionRange } from './selection'
import type { ChangeSpec } from './text'
import { mapOffset, rangeEmpty, rangeFrom, rangeTo } from './selection'
import { indentString, indentWidth, leadingWhitespace } from './text'

const WORD = /[\p{L}\p{N}_$]/u

function isWordCharacter(character: string): boolean {
  return character !== '' && WORD.test(character)
}

/** First and last line the main range touches. */
function selectedLines(editor: EditorCore): { first: number, last: number } {
  const from = rangeFrom(editor.main)
  const to = rangeTo(editor.main)
  const first = editor.doc.lineIndexAt(from)
  let last = editor.doc.lineIndexAt(to)

  // A selection that ends at the very start of a line has not selected any of
  // that line, and indenting or commenting it would surprise.
  if (last > first && editor.doc.lineInfo(last).from === to)
    last--

  return { first, last }
}

/**
 * Where the selection goes when whole lines are changed under it.
 *
 * The end that sits at the very start of a line stays there. Left to the
 * default, indenting would push it in with the text, and a selection that
 * covered three whole lines would cover two and most of a third.
 */
function linewiseSelection(editor: EditorCore, changes: readonly ChangeSpec[]): SelectionRange {
  const { anchor, head } = editor.main
  if (anchor === head)
    return { anchor: mapOffset(anchor, changes, 1), head: mapOffset(head, changes, 1) }

  const start = Math.min(anchor, head)
  const atLineStart = editor.doc.lineAt(start).from === start
  const map = (offset: number): number => mapOffset(offset, changes, offset === start && atLineStart ? -1 : 1)

  return { anchor: map(anchor), head: map(head) }
}

/**
 * Enter: a new line that starts where the old one did.
 *
 * One level deeper after an opening bracket. Between a pair, the closer goes
 * to a line of its own and the caret is left on the indented line between.
 */
export const insertNewlineAndIndent: Command = (editor) => {
  if (editor.readOnly)
    return false

  const from = rangeFrom(editor.main)
  const to = rangeTo(editor.main)
  const line = editor.doc.lineAt(from)
  const before = line.text.slice(0, from - line.from)
  const after = editor.doc.slice(to, editor.doc.lineAt(to).to)
  const base = leadingWhitespace(before)
  const trimmed = before.trimEnd()
  const opener = trimmed.charAt(trimmed.length - 1)
  const closer = editor.language.brackets[opener]

  if (closer === undefined) {
    const insert = `\n${base}`
    editor.dispatch({
      changes: [{ from, to, insert }],
      selection: { anchor: from + insert.length, head: from + insert.length },
      kind: 'newline',
    })

    return true
  }

  const deeper = indentString(indentWidth(base, editor.tabSize) + editor.tabSize, editor.tabSize, editor.insertSpaces)
  const head = `\n${deeper}`
  const between = after.trimStart().startsWith(closer)
  // Whitespace between the caret and the closer would be stranded on the
  // indented line, so it goes with the range being replaced.
  const end = between ? to + (after.length - after.trimStart().length) : to
  const insert = between ? `${head}\n${base}` : head

  editor.dispatch({
    changes: [{ from, to: end, insert }],
    selection: { anchor: from + head.length, head: from + head.length },
    kind: 'newline',
  })

  return true
}

/** Tab: indent the selected lines, or move the caret to the next tab stop. */
export const indentMore: Command = (editor) => {
  if (editor.readOnly)
    return false

  const from = rangeFrom(editor.main)
  const to = rangeTo(editor.main)
  const { first, last } = selectedLines(editor)

  if (first === last && editor.doc.lineIndexAt(to) === first) {
    const column = from - editor.doc.lineInfo(first).from
    const width = indentWidth(editor.doc.line(first).slice(0, column), editor.tabSize)
    const insert = editor.insertSpaces ? ' '.repeat(editor.tabSize - (width % editor.tabSize)) : '\t'

    editor.dispatch({
      changes: [{ from, to, insert }],
      selection: { anchor: from + insert.length, head: from + insert.length },
      kind: 'indent',
    })

    return true
  }

  const changes: ChangeSpec[] = []
  for (let index = first; index <= last; index++) {
    const info = editor.doc.lineInfo(index)
    // An empty line stays empty: indenting it only leaves trailing whitespace.
    if (info.text.length > 0)
      changes.push({ from: info.from, to: info.from, insert: editor.indentUnit })
  }

  if (changes.length === 0)
    return true

  editor.dispatch({ changes, selection: linewiseSelection(editor, changes), kind: 'indent' })

  return true
}

/** Shift-Tab: take one level of indentation off every selected line. */
export const indentLess: Command = (editor) => {
  if (editor.readOnly)
    return false

  const { first, last } = selectedLines(editor)
  const changes: ChangeSpec[] = []

  for (let index = first; index <= last; index++) {
    const info = editor.doc.lineInfo(index)
    const whitespace = leadingWhitespace(info.text)
    if (whitespace === '')
      continue

    // Back to the previous tab stop, however the indentation is written.
    const width = indentWidth(whitespace, editor.tabSize)
    const target = Math.max(0, width - (width % editor.tabSize || editor.tabSize))
    let cut = whitespace.length
    while (cut > 0 && indentWidth(whitespace.slice(0, cut - 1), editor.tabSize) >= target)
      cut--

    changes.push({ from: info.from + cut, to: info.from + whitespace.length, insert: '' })
  }

  if (changes.length === 0)
    return true

  editor.dispatch({ changes, selection: linewiseSelection(editor, changes), kind: 'indent' })

  return true
}

/**
 * Comment the selected lines, or uncomment them if every one already is.
 *
 * The markers line up at the shallowest indentation among the lines rather
 * than at column zero or at each line's own, so a commented block still reads
 * as a block and uncommenting gives back exactly what was there.
 */
export const toggleLineComment: Command = (editor) => {
  const token = editor.language.lineComment
  if (editor.readOnly || token === '')
    return false

  const { first, last } = selectedLines(editor)
  const lines = []
  for (let index = first; index <= last; index++)
    lines.push(editor.doc.lineInfo(index))

  const content = lines.filter(line => line.text.trim() !== '')
  if (content.length === 0)
    return true

  const commented = content.every(line => line.text.trimStart().startsWith(token))
  const changes: ChangeSpec[] = []

  if (commented) {
    for (const line of content) {
      const start = line.from + leadingWhitespace(line.text).length
      const spaced = line.text.charAt(start - line.from + token.length) === ' '
      changes.push({ from: start, to: start + token.length + (spaced ? 1 : 0), insert: '' })
    }
  }
  else {
    const column = Math.min(...content.map(line => leadingWhitespace(line.text).length))
    for (const line of content)
      changes.push({ from: line.from + column, to: line.from + column, insert: `${token} ` })
  }

  editor.dispatch({ changes, selection: linewiseSelection(editor, changes), kind: 'comment' })

  return true
}

/**
 * Backspace, where it means more than one character.
 *
 * Between an empty pair it takes both halves, since the closer was never
 * typed. In leading spaces it goes back a whole tab stop. Anything else is
 * left to the text field.
 */
export const deleteBackward: Command = (editor) => {
  if (editor.readOnly || !rangeEmpty(editor.main))
    return false

  const head = editor.main.head
  if (head === 0)
    return false

  const line = editor.doc.lineAt(head)
  const column = head - line.from
  const previous = line.text.charAt(column - 1)
  const next = line.text.charAt(column)

  const pairs = editor.language.brackets[previous] === next && next !== ''
  const quotes = previous === next && editor.language.quotes.includes(previous)
  if (pairs || quotes) {
    editor.dispatch({
      changes: [{ from: head - 1, to: head + 1, insert: '' }],
      selection: { anchor: head - 1, head: head - 1 },
      kind: 'delete-pair',
    })

    return true
  }

  const before = line.text.slice(0, column)
  if (editor.insertSpaces && column > 1 && /^ +$/.test(before)) {
    const remove = column % editor.tabSize || editor.tabSize
    if (remove > 1) {
      editor.dispatch({
        changes: [{ from: head - remove, to: head, insert: '' }],
        selection: { anchor: head - remove, head: head - remove },
        kind: 'delete-indent',
      })

      return true
    }
  }

  return false
}

/**
 * A typed character, where the editor has an opinion about it.
 *
 * Opening a bracket closes it. Typing a closer that is already there steps
 * over it instead of doubling it. A closing brace on a line of nothing but
 * indentation drops back a level. With text selected, an opener wraps it.
 *
 * Returns false for everything else, and the text field inserts the character
 * itself - which is what keeps input methods and dead keys working, since the
 * editor never sees a composition as individual keys.
 */
export function handleTextInput(editor: EditorCore, text: string): boolean {
  if (editor.readOnly || text.length !== 1)
    return false

  const from = rangeFrom(editor.main)
  const to = rangeTo(editor.main)
  const line = editor.doc.lineAt(from)
  const column = from - line.from
  const previous = line.text.charAt(column - 1)
  const next = editor.doc.slice(to, to + 1)
  const { brackets, quotes } = editor.language
  const closers = Object.values(brackets)
  const isQuote = quotes.includes(text)
  const closer = brackets[text]

  if (from !== to) {
    const close = closer ?? (isQuote ? text : undefined)
    if (close === undefined)
      return false

    // Wrap, and keep what was selected selected.
    const selected = editor.doc.slice(from, to)
    editor.dispatch({
      changes: [{ from, to, insert: `${text}${selected}${close}` }],
      selection: { anchor: from + 1, head: to + 1 },
      kind: 'wrap',
    })

    return true
  }

  // Step over a closer the editor (or anyone) already put there.
  if ((closers.includes(text) || isQuote) && next === text) {
    if (!isQuote || previous !== '\\') {
      editor.dispatch({ selection: { anchor: from + 1, head: from + 1 }, kind: 'type' })

      return true
    }
  }

  if (closer !== undefined) {
    // Only where a closer cannot land in front of something it would capture.
    if (next !== '' && next !== '\n' && !/\s/.test(next) && !closers.includes(next) && next !== ',' && next !== ';')
      return false

    editor.dispatch({
      changes: [{ from, to, insert: `${text}${closer}` }],
      selection: { anchor: from + 1, head: from + 1 },
      kind: 'pair',
    })

    return true
  }

  if (isQuote) {
    // An apostrophe inside a word, an escaped quote, or a quote typed against
    // the start of a word is a quote on its own, not half of a pair.
    if (isWordCharacter(previous) || previous === '\\' || previous === text || isWordCharacter(next))
      return false

    editor.dispatch({
      changes: [{ from, to, insert: `${text}${text}` }],
      selection: { anchor: from + 1, head: from + 1 },
      kind: 'pair',
    })

    return true
  }

  if (closers.includes(text) && column > 0 && line.text.slice(0, column).trim() === '') {
    // A closer on a line of only indentation belongs one level out.
    const width = indentWidth(line.text.slice(0, column), editor.tabSize)
    const outdented = indentString(Math.max(0, width - editor.tabSize), editor.tabSize, editor.insertSpaces)
    const insert = `${outdented}${text}`

    editor.dispatch({
      changes: [{ from: line.from, to: from, insert }],
      selection: { anchor: line.from + insert.length, head: line.from + insert.length },
      kind: 'outdent',
    })

    return true
  }

  return false
}

export const undo: Command = editor => editor.undo()
export const redo: Command = editor => editor.redo()

/** The commands every editor starts with, by the name a keymap refers to. */
export const defaultCommands: Readonly<Record<string, Command>> = {
  insertNewlineAndIndent,
  indentMore,
  indentLess,
  toggleLineComment,
  deleteBackward,
  undo,
  redo,
}

export function registerDefaultCommands(editor: EditorCore): void {
  for (const [name, command] of Object.entries(defaultCommands))
    editor.commands.set(name, command)
}
