/**
 * The document: text held as lines.
 *
 * Lines, not one string, because everything an editor asks is a line question.
 * Which lines are on screen, which line changed, what the indentation of this
 * one is. A single string answers each of those with a scan from the top, and a
 * keystroke in a two-thousand-line file would pay for all two thousand.
 *
 * Offsets are still the coordinate everything else speaks - a textarea reports
 * its selection as two of them, and a change is "from here to there" - so the
 * document converts both ways. The table of line starts behind that is rebuilt
 * lazily and only from the first line that changed.
 *
 * Mutable on purpose. An edit touches one or two entries of the array, and the
 * history keeps what it needs to reverse it (the removed text), which is all an
 * immutable document would have bought.
 */

/** A place in the document. Both zero-based; `column` counts UTF-16 units. */
export interface Position {
  line: number
  column: number
}

/** Replace `from..to` with `insert`. Offsets into the document before the change. */
export interface ChangeSpec {
  from: number
  to: number
  insert: string
}

/** What a change did, in the terms each consumer needs. */
export interface AppliedChange extends ChangeSpec {
  /** The text that was there, which is what undoing it puts back. */
  removed: string
  /** First line touched. */
  fromLine: number
  /** How many lines the replaced range spanned (at least one). */
  removedLines: number
  /** How many lines stand there now (at least one). */
  insertedLines: number
}

export interface LineInfo {
  index: number
  /** Offset of the line's first character. */
  from: number
  /** Offset just past its last character, before the line break. */
  to: number
  text: string
}

/** One line ending throughout: a textarea reports `\n` whatever was pasted. */
export function normalizeNewlines(text: string): string {
  return text.includes('\r') ? text.replace(/\r\n?/g, '\n') : text
}

export class TextDocument {
  private lines: string[]
  /** `starts[i]` is the offset of line `i`. Valid below `validStarts`. */
  private starts: number[] = [0]
  private validStarts = 1
  private total: number
  private text: string | null

  constructor(text = '') {
    const normalized = normalizeNewlines(text)
    this.lines = normalized.split('\n')
    this.total = normalized.length
    this.text = normalized
  }

  get lineCount(): number {
    return this.lines.length
  }

  /** Length in UTF-16 units, line breaks included. */
  get length(): number {
    return this.total
  }

  /** The text of one line, without its line break. Empty past either end. */
  line(index: number): string {
    return this.lines[index] ?? ''
  }

  /** The whole document. Cached until the next change. */
  toString(): string {
    if (this.text === null)
      this.text = this.lines.join('\n')

    return this.text
  }

  /**
   * Tell the document what its own text is, when the caller already holds it.
   *
   * A textarea hands over its full value on every input event. Joining two
   * thousand lines to compare against it, when that value *is* the answer once
   * the change is applied, would be building the same string twice per key.
   */
  adoptText(text: string): void {
    if (text.length === this.total)
      this.text = text
  }

  private startOf(index: number): number {
    if (index >= this.validStarts) {
      let offset = this.starts[this.validStarts - 1]!
      for (let line = this.validStarts; line <= index; line++) {
        offset += this.lines[line - 1]!.length + 1
        this.starts[line] = offset
      }
      this.validStarts = index + 1
    }

    return this.starts[index]!
  }

  private clampOffset(offset: number): number {
    return Math.max(0, Math.min(this.total, offset))
  }

  /** The line an offset falls on. A line break belongs to the line it ends. */
  lineIndexAt(offset: number): number {
    const target = this.clampOffset(offset)
    let low = 0
    let high = this.lines.length - 1

    while (low < high) {
      const middle = (low + high + 1) >> 1
      if (this.startOf(middle) <= target)
        low = middle
      else
        high = middle - 1
    }

    return low
  }

  lineAt(offset: number): LineInfo {
    return this.lineInfo(this.lineIndexAt(offset))
  }

  lineInfo(index: number): LineInfo {
    const clamped = Math.max(0, Math.min(this.lines.length - 1, index))
    const from = this.startOf(clamped)
    const text = this.lines[clamped]!

    return { index: clamped, from, to: from + text.length, text }
  }

  positionAt(offset: number): Position {
    const target = this.clampOffset(offset)
    const line = this.lineIndexAt(target)

    return { line, column: target - this.startOf(line) }
  }

  /** The offset of a position, clamped into the document and into its line. */
  offsetAt(position: Position): number {
    const line = Math.max(0, Math.min(this.lines.length - 1, position.line))
    const column = Math.max(0, Math.min(this.lines[line]!.length, position.column))

    return this.startOf(line) + column
  }

  slice(from: number, to: number): string {
    const start = this.clampOffset(Math.min(from, to))
    const end = this.clampOffset(Math.max(from, to))
    if (start === end)
      return ''

    const first = this.positionAt(start)
    const last = this.positionAt(end)
    if (first.line === last.line)
      return this.lines[first.line]!.slice(first.column, last.column)

    const parts = [this.lines[first.line]!.slice(first.column)]
    for (let line = first.line + 1; line < last.line; line++)
      parts.push(this.lines[line]!)
    parts.push(this.lines[last.line]!.slice(0, last.column))

    return parts.join('\n')
  }

  /** Replace a range. The only way the document changes. */
  replace(from: number, to: number, insert: string): AppliedChange {
    const start = this.clampOffset(Math.min(from, to))
    const end = this.clampOffset(Math.max(from, to))
    const text = normalizeNewlines(insert)
    const first = this.positionAt(start)
    const last = this.positionAt(end)
    const removed = this.slice(start, end)

    const head = this.lines[first.line]!.slice(0, first.column)
    const tail = this.lines[last.line]!.slice(last.column)
    const inserted = text.split('\n')
    inserted[0] = head + inserted[0]!
    inserted[inserted.length - 1] += tail

    const removedLines = last.line - first.line + 1
    if (removedLines === 1 && inserted.length === 1)
      this.lines[first.line] = inserted[0]!
    else
      this.lines.splice(first.line, removedLines, ...inserted)

    this.total += text.length - (end - start)
    this.text = null
    // Every line after the first one touched has moved.
    this.validStarts = Math.min(this.validStarts, first.line + 1)
    this.starts.length = this.validStarts

    return {
      from: start,
      to: end,
      insert: text,
      removed,
      fromLine: first.line,
      removedLines,
      insertedLines: inserted.length,
    }
  }
}

/** Leading spaces and tabs of a line. */
export function leadingWhitespace(text: string): string {
  let end = 0
  while (end < text.length && (text.charCodeAt(end) === 32 || text.charCodeAt(end) === 9))
    end++

  return text.slice(0, end)
}

/** Width of a run of indentation in columns, tabs advancing to the next stop. */
export function indentWidth(whitespace: string, tabSize: number): number {
  let width = 0
  for (let index = 0; index < whitespace.length; index++)
    width = whitespace.charCodeAt(index) === 9 ? width + tabSize - (width % tabSize) : width + 1

  return width
}

/** Indentation of a given width, written the way the editor is set to write it. */
export function indentString(width: number, tabSize: number, insertSpaces: boolean): string {
  if (width <= 0)
    return ''
  if (insertSpaces)
    return ' '.repeat(width)

  return '\t'.repeat(Math.floor(width / tabSize)) + ' '.repeat(width % tabSize)
}
