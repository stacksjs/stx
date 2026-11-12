/**
 * The completion list, as state.
 *
 * What is open, what is left after filtering by what has been typed, which
 * item is selected, and the edit that accepting it makes. Where the list is
 * drawn and what asked for it are the view's business.
 *
 * The host supplies the items - from a language server, from a table of names,
 * from anywhere - along with the offset the completed word starts at. From
 * then on, typing narrows the list here without another round trip, which is
 * what keeps it from flickering on every key.
 */
import type { ChangeSpec } from './text'

export interface CompletionItem {
  /** What the list shows, and what is matched against. */
  label: string
  /** What is inserted. Defaults to the label. */
  insert?: string
  /** A short note beside the label, such as a type. */
  detail?: string
  /** What sort of thing it is (`function`, `property`), for an icon or a tint. */
  kind?: string
  /** Matched instead of the label when set. */
  filterText?: string
  /** Raises or lowers an item among equal matches. */
  boost?: number
}

export interface RankedCompletion {
  item: CompletionItem
  score: number
  /** Indices into the label of the characters that matched, for emphasis. */
  matches: number[]
}

const WORD_CHARACTER = /[\p{L}\p{N}_$]/u

/** Where the word ending at `offset` begins. */
export function wordStart(text: string, offset: number): number {
  let start = offset
  while (start > 0 && WORD_CHARACTER.test(text.charAt(start - 1)))
    start--

  return start
}

/**
 * How well `query` matches `text`, or null when it does not.
 *
 * Every character of the query has to appear in order. A match that starts at
 * the beginning beats one that does not, a run of adjacent characters beats
 * the same characters scattered, a match at the start of a word (`gU` for
 * `getUser`) beats one in the middle of it, and an exact case match breaks ties.
 */
export function matchScore(query: string, text: string): { score: number, matches: number[] } | null {
  if (query === '')
    return { score: 0, matches: [] }

  const needle = query.toLowerCase()
  const haystack = text.toLowerCase()
  const matches: number[] = []
  let score = 0
  let position = 0
  let previous = -2

  for (let index = 0; index < needle.length; index++) {
    const found = haystack.indexOf(needle.charAt(index), position)
    if (found === -1)
      return null

    matches.push(found)
    score += 10

    if (found === previous + 1)
      score += 15
    if (found === 0)
      score += 30
    else if (!WORD_CHARACTER.test(text.charAt(found - 1)) || isHump(text, found))
      score += 12
    if (text.charAt(found) === query.charAt(index))
      score += 2

    previous = found
    position = found + 1
  }

  if (haystack.startsWith(needle))
    score += 40
  if (haystack === needle)
    score += 20

  // Shorter is closer: `get` should offer `get` before `getUserByEmail`.
  score -= Math.min(20, text.length - needle.length) * 0.5

  return { score, matches }
}

function isHump(text: string, index: number): boolean {
  const character = text.charAt(index)
  const before = text.charAt(index - 1)

  return character !== character.toLowerCase() && before === before.toLowerCase()
}

/** The items a query leaves, best first. Order among equals is the host's. */
export function rankCompletions(items: readonly CompletionItem[], query: string): RankedCompletion[] {
  const ranked: Array<RankedCompletion & { order: number }> = []

  items.forEach((item, order) => {
    const match = matchScore(query, item.filterText ?? item.label)
    if (match)
      ranked.push({ item, score: match.score + (item.boost ?? 0), matches: item.filterText ? [] : match.matches, order })
  })

  ranked.sort((a, b) => b.score - a.score || a.order - b.order)

  return ranked.map(({ item, score, matches }) => ({ item, score, matches }))
}

export class CompletionList {
  private items: readonly CompletionItem[] = []
  private ranked: RankedCompletion[] = []
  private index = 0
  private start = 0
  private opened = false

  get isOpen(): boolean {
    return this.opened && this.ranked.length > 0
  }

  /** What is left after filtering, best first. */
  get visible(): readonly RankedCompletion[] {
    return this.opened ? this.ranked : []
  }

  get selectedIndex(): number {
    return this.index
  }

  get selected(): CompletionItem | undefined {
    return this.visible[this.index]?.item
  }

  /** Offset the completed word starts at. */
  get from(): number {
    return this.start
  }

  /**
   * Open with a set of items for the word starting at `from`.
   *
   * `query` is what has been typed of that word so far.
   */
  open(items: readonly CompletionItem[], from: number, query: string): void {
    this.items = items
    this.start = from
    this.opened = true
    this.filter(query)
  }

  /** Narrow to what still matches. Closes when nothing does. */
  filter(query: string): void {
    const previous = this.selected
    this.ranked = rankCompletions(this.items, query)

    // The best match takes the selection, unless the reader had moved off it
    // and what they chose is still there.
    const kept = previous && this.index > 0 ? this.ranked.findIndex(entry => entry.item === previous) : -1
    this.index = kept > 0 ? kept : 0

    if (this.ranked.length === 0)
      this.opened = false
  }

  /** Move the selection, wrapping at either end. */
  move(delta: number): void {
    const count = this.ranked.length
    if (count === 0)
      return

    this.index = ((this.index + delta) % count + count) % count
  }

  select(index: number): void {
    if (index >= 0 && index < this.ranked.length)
      this.index = index
  }

  close(): void {
    this.opened = false
    this.ranked = []
    this.items = []
    this.index = 0
  }

  /**
   * The edit that accepts the selected item, with the caret at `head`.
   *
   * Replaces the word from where it started up to the caret, so accepting
   * `getUser` after typing `getU` does not leave `getUgetUser`.
   */
  accept(head: number): { change: ChangeSpec, item: CompletionItem } | null {
    const item = this.selected
    if (!this.isOpen || !item)
      return null

    const insert = item.insert ?? item.label

    return { change: { from: Math.min(this.start, head), to: head, insert }, item }
  }
}
