/**
 * Selections.
 *
 * A selection is a list of ranges with one of them the main one. This version
 * of the editor only ever holds a single range, because its input surface is a
 * textarea and a textarea has one. The list is there so that the model does not
 * have to change shape when the editor grows its own input surface: every
 * command already asks "for each range", it is just that the answer is one.
 */
import type { ChangeSpec } from './text'

/** `anchor` is where the selection started, `head` where the caret is. */
export interface SelectionRange {
  anchor: number
  head: number
}

export interface EditorSelection {
  ranges: SelectionRange[]
  /** Index of the range the caret, the scroll position and the popup follow. */
  main: number
}

export function range(anchor: number, head: number = anchor): SelectionRange {
  return { anchor, head }
}

export function singleSelection(anchor: number, head: number = anchor): EditorSelection {
  return { ranges: [{ anchor, head }], main: 0 }
}

export function rangeFrom(value: SelectionRange): number {
  return Math.min(value.anchor, value.head)
}

export function rangeTo(value: SelectionRange): number {
  return Math.max(value.anchor, value.head)
}

export function rangeEmpty(value: SelectionRange): boolean {
  return value.anchor === value.head
}

export function mainRange(selection: EditorSelection): SelectionRange {
  return selection.ranges[selection.main] ?? selection.ranges[0]!
}

export function selectionsEqual(a: EditorSelection, b: EditorSelection): boolean {
  if (a.main !== b.main || a.ranges.length !== b.ranges.length)
    return false

  return a.ranges.every((value, index) => value.anchor === b.ranges[index]!.anchor && value.head === b.ranges[index]!.head)
}

export function clampSelection(selection: EditorSelection, length: number): EditorSelection {
  const clamp = (offset: number): number => Math.max(0, Math.min(length, offset))

  return {
    main: Math.min(selection.main, selection.ranges.length - 1),
    ranges: selection.ranges.map(value => ({ anchor: clamp(value.anchor), head: clamp(value.head) })),
  }
}

/**
 * Where an offset ends up after a set of changes.
 *
 * `changes` are in the coordinates of the document before any of them, sorted
 * and not overlapping, which is the form a transaction holds them in.
 *
 * `assoc` settles the one ambiguous case, an offset exactly where text was
 * inserted: `1` puts it after the insertion, which is what a caret wants (you
 * typed, the caret moved), and `-1` leaves it before.
 */
export function mapOffset(offset: number, changes: readonly ChangeSpec[], assoc: -1 | 1 = 1): number {
  let shift = 0

  for (const change of changes) {
    if (change.from > offset)
      break

    if (change.to <= offset) {
      if (change.from === offset && change.to === offset && assoc < 0)
        break

      shift += change.insert.length - (change.to - change.from)
      continue
    }

    // Inside a replaced range: there is no "same place" any more.
    return change.from + shift + (assoc < 0 ? 0 : change.insert.length)
  }

  return offset + shift
}

export function mapSelection(selection: EditorSelection, changes: readonly ChangeSpec[]): EditorSelection {
  return {
    main: selection.main,
    ranges: selection.ranges.map(value => ({
      anchor: mapOffset(value.anchor, changes, 1),
      head: mapOffset(value.head, changes, 1),
    })),
  }
}
