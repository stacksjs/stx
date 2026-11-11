/**
 * Highlighting that only redoes what a change could have affected.
 *
 * A tokenizer reads a line given the state the previous line left it in:
 * inside a block comment, inside a template string, or nowhere in particular.
 * So each line is remembered with the state it started in, and after an edit the
 * tokenizer starts at the first changed line and stops at the first unchanged
 * line it would enter in the same state as last time. That line, and everything
 * below it, would tokenize exactly as it already has.
 *
 * For an ordinary keystroke that is one line. For one that opens a block
 * comment it is every line down to wherever the comment ends, which is the
 * honest answer, and it is why the work is given a budget: a pass stops when
 * the budget is spent and says where it got to, and the caller continues when
 * it is idle. The lines on screen are done first either way.
 *
 * The tokenizer is passed in. This file does not import one, which keeps the
 * editor core free of the highlighter and lets a test use a tokenizer small
 * enough to reason about.
 */

export interface HighlightToken {
  /** The class to colour it with. Empty for plain text. */
  type: string
  content: string
}

/** A tokenizer, one line at a time, with its state made explicit. */
export interface LineTokenizer<State = unknown> {
  initialState: () => State
  tokenizeLine: (text: string, state: State) => { tokens: HighlightToken[], endState: State }
  /** A string that is equal exactly when two states are. */
  stateKey: (state: State) => string
}

export interface HighlightedLine<State = unknown> {
  text: string
  tokens: HighlightToken[]
  /** The state the line was entered in, as a key. What settling compares. */
  startKey: string
  endState: State
  endKey: string
}

export interface LineChange {
  fromLine: number
  removedLines: number
  insertedLines: number
}

export interface HighlightPass {
  /** First line retokenized in this pass, or -1 when there was nothing to do. */
  from: number
  /** One past the last line retokenized. */
  to: number
  /** Whether lines are still waiting, for a later pass. */
  pending: boolean
}

/** A source of line text: the document, or anything shaped like it. */
export interface LineSource {
  readonly lineCount: number
  line: (index: number) => string
}

export class LineHighlighter<State = unknown> {
  /** One entry per document line. `null` is a line with no current tokens. */
  private lines: Array<HighlightedLine<State> | null> = []
  /** Whether anything is waiting to be tokenized. */
  private stale = true
  /** Every line before this one is current. */
  private dirtyFrom = 0
  /** Lines from `dirtyFrom` up to here have to be redone whatever state they are entered in. */
  private dirtyTo = 0
  private tokenizer: LineTokenizer<State>
  private source: LineSource

  constructor(tokenizer: LineTokenizer<State>, source: LineSource) {
    this.tokenizer = tokenizer
    this.source = source
    this.reset()
  }

  /** Forget everything, for a new tokenizer or a new document. */
  reset(tokenizer?: LineTokenizer<State>, source?: LineSource): void {
    if (tokenizer)
      this.tokenizer = tokenizer
    if (source)
      this.source = source

    this.lines = Array.from({ length: this.source.lineCount }, () => null)
    this.stale = true
    this.dirtyFrom = 0
    this.dirtyTo = this.lines.length
  }

  /** The tokens of a line, or null when it has not been reached yet. */
  get(index: number): HighlightedLine<State> | null {
    return this.lines[index] ?? null
  }

  get pending(): boolean {
    return this.stale
  }

  /** First line that may be stale, or the line count when none is. */
  get firstDirtyLine(): number {
    return this.stale ? this.dirtyFrom : this.lines.length
  }

  /**
   * Record that lines were replaced. Tokenizes nothing.
   *
   * Changes arrive in the order they were applied, which for a transaction is
   * last first, so each one's line numbers are true at the moment it is read.
   */
  applyChange(change: LineChange): void {
    const fresh = Array.from<HighlightedLine<State> | null>({ length: change.insertedLines }).fill(null)
    this.lines.splice(change.fromLine, change.removedLines, ...fresh)

    const end = change.fromLine + change.insertedLines

    if (!this.stale) {
      this.stale = true
      this.dirtyFrom = change.fromLine
      this.dirtyTo = end
      return
    }

    // Something is already waiting. Its far end moves with the lines below the
    // change, or is swallowed by it.
    const removedEnd = change.fromLine + change.removedLines
    let to = this.dirtyTo
    if (to >= removedEnd)
      to += change.insertedLines - change.removedLines
    else if (to > change.fromLine)
      to = end

    this.dirtyFrom = Math.min(this.dirtyFrom, change.fromLine)
    this.dirtyTo = Math.min(this.lines.length, Math.max(to, end))
  }

  /**
   * Bring lines up to date, starting at the first stale one.
   *
   * Runs until the changed lines are done and the state has settled, or until
   * `maxLines` have been tokenized past `through` (the last line that has to be
   * right now, which is the bottom of the screen). Whatever is left is reported
   * as pending.
   */
  update(options: { through?: number, maxLines?: number } = {}): HighlightPass {
    if (!this.stale)
      return { from: -1, to: -1, pending: false }

    const count = this.source.lineCount
    const through = Math.min(count - 1, options.through ?? count - 1)
    const maxLines = options.maxLines ?? Number.POSITIVE_INFINITY
    const start = Math.min(this.dirtyFrom, count)
    const before = start > 0 ? this.lines[start - 1] : null

    let index = start
    let state: State = before ? before.endState : this.tokenizer.initialState()
    let key = before ? before.endKey : this.tokenizer.stateKey(state)
    let beyond = 0
    let settled = false

    while (index < count) {
      if (index >= this.dirtyTo) {
        // Past everything that changed. If this line was last entered in the
        // state it is about to be entered in, nothing below can differ.
        const existing = this.lines[index]
        if (existing && existing.startKey === key) {
          settled = true
          break
        }
      }

      if (index > through && ++beyond > maxLines)
        break

      const text = this.source.line(index)
      const result = this.tokenizer.tokenizeLine(text, state)
      const endKey = this.tokenizer.stateKey(result.endState)

      this.lines[index] = { text, tokens: result.tokens, startKey: key, endState: result.endState, endKey }
      state = result.endState
      key = endKey
      index++
    }

    if (settled || index >= count) {
      this.stale = false
      this.dirtyFrom = count
      this.dirtyTo = count
    }
    else {
      this.dirtyFrom = index
      this.dirtyTo = Math.max(this.dirtyTo, index)
    }

    return { from: start, to: index, pending: this.stale }
  }
}
