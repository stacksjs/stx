/**
 * Undo and redo.
 *
 * The editor keeps its own history instead of the textarea's, because the
 * textarea's does not survive the editor: any change written into it from
 * script - an auto-indent, a closed bracket, a toggled comment - either clears
 * the native stack or leaves it describing text that is no longer there.
 *
 * An entry holds its changes twice. `changes` are in the coordinates of the
 * document before them and `inverse` in the coordinates of the document after,
 * so undo and redo are the same operation pointed at different halves, and
 * neither has to work out where an earlier change moved a later one.
 */
import type { EditorSelection } from './selection'
import type { AppliedChange, ChangeSpec } from './text'

export interface HistoryEntry {
  changes: ChangeSpec[]
  inverse: ChangeSpec[]
  before: EditorSelection
  after: EditorSelection
  /** What kind of edit, which is what decides whether two entries are one. */
  kind: string
  time: number
}

export interface HistoryOptions {
  /** Entries kept. Older ones fall off the bottom. Default 500. */
  depth?: number
  /** Edits further apart than this are separate steps. Default 600 ms. */
  groupDelay?: number
}

/** The changes that put the document back, in after-the-change coordinates. */
export function invertChanges(applied: readonly AppliedChange[]): ChangeSpec[] {
  let shift = 0

  return applied.map((change) => {
    const from = change.from + shift
    shift += change.insert.length - (change.to - change.from)

    return { from, to: from + change.insert.length, insert: change.removed }
  })
}

export class History {
  private done: HistoryEntry[] = []
  private undone: HistoryEntry[] = []
  private readonly depth: number
  private readonly groupDelay: number

  constructor(options: HistoryOptions = {}) {
    this.depth = options.depth ?? 500
    this.groupDelay = options.groupDelay ?? 600
  }

  get canUndo(): boolean {
    return this.done.length > 0
  }

  get canRedo(): boolean {
    return this.undone.length > 0
  }

  get undoDepth(): number {
    return this.done.length
  }

  clear(): void {
    this.done = []
    this.undone = []
  }

  /**
   * Record an edit, joining it to the previous one when they are one gesture.
   *
   * Typing a word is one undo step, not five. Two entries join when they are
   * the same kind, close together in time, and the second picks up exactly
   * where the first left off. A line break always starts a new step, so undo
   * walks back a line at a time rather than a paragraph.
   */
  record(applied: readonly AppliedChange[], before: EditorSelection, after: EditorSelection, kind: string, time: number): void {
    if (applied.length === 0)
      return

    this.undone = []

    const entry: HistoryEntry = {
      changes: applied.map(change => ({ from: change.from, to: change.to, insert: change.insert })),
      inverse: invertChanges(applied),
      before,
      after,
      kind,
      time,
    }

    const previous = this.done[this.done.length - 1]
    if (previous && this.joins(previous, entry)) {
      this.done[this.done.length - 1] = this.join(previous, entry)
      return
    }

    this.done.push(entry)
    if (this.done.length > this.depth)
      this.done.shift()
  }

  private joins(previous: HistoryEntry, next: HistoryEntry): boolean {
    if (previous.kind !== next.kind || (next.kind !== 'type' && next.kind !== 'delete'))
      return false
    if (next.time - previous.time > this.groupDelay)
      return false
    if (previous.changes.length !== 1 || next.changes.length !== 1)
      return false

    const a = previous.changes[0]!
    const b = next.changes[0]!

    if (next.kind === 'type') {
      // Plain insertions only, each starting where the last one ended.
      if (a.from !== a.to || b.from !== b.to || b.insert.includes('\n') || a.insert.includes('\n'))
        return false

      return b.from === a.from + a.insert.length
    }

    // Deletions: backspace eats leftwards, forward delete stays put.
    if (a.insert !== '' || b.insert !== '')
      return false

    return b.to === a.from || b.from === a.from
  }

  private join(previous: HistoryEntry, next: HistoryEntry): HistoryEntry {
    const a = previous.changes[0]!
    const b = next.changes[0]!
    const removedA = previous.inverse[0]!.insert
    const removedB = next.inverse[0]!.insert

    let change: ChangeSpec
    let inverse: ChangeSpec

    if (next.kind === 'type') {
      change = { from: a.from, to: a.to, insert: a.insert + b.insert }
      inverse = { from: a.from, to: a.from + change.insert.length, insert: removedA }
    }
    else if (b.to === a.from) {
      // Backspace: the new deletion sits just before the old one.
      change = { from: b.from, to: a.to, insert: '' }
      inverse = { from: b.from, to: b.from, insert: removedB + removedA }
    }
    else {
      // Forward delete: the new deletion follows the old one in the original text.
      change = { from: a.from, to: a.to + (b.to - b.from), insert: '' }
      inverse = { from: a.from, to: a.from, insert: removedA + removedB }
    }

    return {
      changes: [change],
      inverse: [inverse],
      before: previous.before,
      after: next.after,
      kind: next.kind,
      time: next.time,
    }
  }

  /** Stop the next edit joining the last one: a moved caret ends a gesture. */
  breakGroup(): void {
    const previous = this.done[this.done.length - 1]
    if (previous)
      previous.time = Number.NEGATIVE_INFINITY
  }

  popUndo(): HistoryEntry | undefined {
    const entry = this.done.pop()
    if (entry)
      this.undone.push(entry)

    return entry
  }

  popRedo(): HistoryEntry | undefined {
    const entry = this.undone.pop()
    if (entry)
      this.done.push(entry)

    return entry
  }
}
