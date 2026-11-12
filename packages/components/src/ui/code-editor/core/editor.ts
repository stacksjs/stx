/**
 * The editor: a document, a selection, a history, and the one way to change them.
 *
 * Nothing in here touches the DOM, and nothing in here knows about stx. That
 * is what makes it testable without a browser, and it is also what lets the
 * view be replaced: today the view is a textarea laid over a highlighted layer,
 * and the model does not know. When the editor grows its own input surface, for
 * several cursors at once, this file is the part that stays.
 *
 * Everything goes through `dispatch`. A keystroke the textarea handled, a
 * command, a value set from outside, an undo: each is a transaction, and each
 * tells every listener the same things in the same order.
 */
import type { EditorSelection, SelectionRange } from './selection'
import type { AppliedChange, ChangeSpec, Position } from './text'
import { History } from './history'
import { clampSelection, mainRange, mapSelection, rangeFrom, rangeTo, selectionsEqual, singleSelection } from './selection'
import { normalizeNewlines, TextDocument } from './text'

export interface LanguageConfig {
  /** Starts a comment that runs to the end of the line. Empty for none. */
  lineComment: string
  /** Opening characters and what closes each. */
  brackets: Record<string, string>
  /** Characters that open and close with themselves. */
  quotes: string[]
}

export const DEFAULT_LANGUAGE: LanguageConfig = {
  lineComment: '//',
  brackets: { '(': ')', '[': ']', '{': '}' },
  quotes: ['"', '\'', '`'],
}

/** Per-language overrides, by the id the highlighter knows the language as. */
export const LANGUAGE_CONFIGS: Readonly<Record<string, Partial<LanguageConfig>>> = {
  python: { lineComment: '#', quotes: ['"', '\''] },
  ruby: { lineComment: '#' },
  bash: { lineComment: '#' },
  yaml: { lineComment: '#', quotes: ['"', '\''] },
  toml: { lineComment: '#', quotes: ['"', '\''] },
  dockerfile: { lineComment: '#', quotes: ['"', '\''] },
  sql: { lineComment: '--', quotes: ['"', '\''] },
  lua: { lineComment: '--', quotes: ['"', '\''] },
  json: { lineComment: '', quotes: ['"'] },
  html: { lineComment: '', quotes: ['"', '\''] },
  css: { lineComment: '', quotes: ['"', '\''] },
  markdown: { lineComment: '', brackets: { '(': ')', '[': ']' } },
  text: { lineComment: '', brackets: {}, quotes: [] },
}

export function languageConfig(language: string | undefined): LanguageConfig {
  return { ...DEFAULT_LANGUAGE, ...(language ? LANGUAGE_CONFIGS[language.toLowerCase()] : undefined) }
}

export interface EditorOptions {
  value?: string
  /** Columns a tab stop is apart. Default 2. */
  tabSize?: number
  /** Indent with spaces rather than tab characters. Default true. */
  insertSpaces?: boolean
  readOnly?: boolean
  language?: Partial<LanguageConfig>
  historyDepth?: number
  /** Supplies the time for history grouping. A test passes its own. */
  now?: () => number
}

/** Where a transaction came from, which decides who still has to be told. */
export type TransactionOrigin = 'input' | 'command' | 'api' | 'history'

export interface TransactionSpec {
  /** Sorted, not overlapping, in the coordinates of the document as it is now. */
  changes?: ChangeSpec[]
  /** The selection afterwards. Mapped through the changes when left out. */
  selection?: EditorSelection | SelectionRange
  /** `type` and `delete` join into one undo step; anything else stands alone. */
  kind?: string
  origin?: TransactionOrigin
  addToHistory?: boolean
  scrollIntoView?: boolean
}

export interface Transaction {
  /** In before-the-change coordinates, ascending. Empty for a pure selection move. */
  changes: AppliedChange[]
  before: EditorSelection
  selection: EditorSelection
  docChanged: boolean
  selectionChanged: boolean
  kind: string
  origin: TransactionOrigin
  scrollIntoView: boolean
}

export type TransactionListener = (transaction: Transaction, editor: EditorCore) => void

/** A command answers whether it did anything, so a key can fall through. */
export type Command = (editor: EditorCore) => boolean

function isSelection(value: EditorSelection | SelectionRange): value is EditorSelection {
  return Array.isArray((value as EditorSelection).ranges)
}

export class EditorCore {
  readonly doc: TextDocument
  readonly history: History
  readonly commands: Map<string, Command> = new Map()
  tabSize: number
  insertSpaces: boolean
  readOnly: boolean
  language: LanguageConfig
  private current: EditorSelection = singleSelection(0)
  private listeners: Set<TransactionListener> = new Set()
  private readonly now: () => number

  constructor(options: EditorOptions = {}) {
    this.doc = new TextDocument(options.value ?? '')
    this.history = new History({ depth: options.historyDepth })
    this.tabSize = Math.max(1, options.tabSize ?? 2)
    this.insertSpaces = options.insertSpaces ?? true
    this.readOnly = options.readOnly ?? false
    this.language = { ...DEFAULT_LANGUAGE, ...options.language }
    this.now = options.now ?? (() => Date.now())
  }

  get selection(): EditorSelection {
    return this.current
  }

  /** The range the caret belongs to. */
  get main(): SelectionRange {
    return mainRange(this.current)
  }

  get value(): string {
    return this.doc.toString()
  }

  /** One level of indentation, as this editor writes it. */
  get indentUnit(): string {
    return this.insertSpaces ? ' '.repeat(this.tabSize) : '\t'
  }

  /** The caret as a line and a column. */
  get cursor(): Position {
    return this.doc.positionAt(this.main.head)
  }

  /** The selected text of the main range. */
  get selectedText(): string {
    return this.doc.slice(rangeFrom(this.main), rangeTo(this.main))
  }

  /** Listen to every transaction. Returns the function that stops listening. */
  subscribe(listener: TransactionListener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  dispatch(spec: TransactionSpec): Transaction {
    const origin = spec.origin ?? 'command'
    const kind = spec.kind ?? 'edit'
    const before = this.current
    const specs = this.readOnly && origin !== 'api' ? [] : (spec.changes ?? []).filter(change => change.from !== change.to || change.insert !== '')

    // Last first, so the offsets of the earlier ones are still true when their
    // turn comes. The record is kept in ascending order for everything else.
    const applied: AppliedChange[] = Array.from({ length: specs.length })
    for (let index = specs.length - 1; index >= 0; index--) {
      const change = specs[index]!
      applied[index] = this.doc.replace(change.from, change.to, change.insert)
    }

    let selection: EditorSelection
    if (spec.selection)
      selection = isSelection(spec.selection) ? spec.selection : { ranges: [spec.selection], main: 0 }
    else
      selection = applied.length > 0 ? mapSelection(before, applied) : before

    selection = clampSelection(selection, this.doc.length)
    this.current = selection

    const docChanged = applied.length > 0
    const selectionChanged = !selectionsEqual(before, selection)

    if (docChanged && origin !== 'history' && spec.addToHistory !== false)
      this.history.record(applied, before, selection, kind, this.now())
    else if (!docChanged && selectionChanged)
      this.history.breakGroup()

    const transaction: Transaction = {
      changes: applied,
      before,
      selection,
      docChanged,
      selectionChanged,
      kind,
      origin,
      scrollIntoView: spec.scrollIntoView ?? (docChanged || selectionChanged),
    }

    if (docChanged || selectionChanged) {
      for (const listener of this.listeners)
        listener(transaction, this)
    }

    return transaction
  }

  /** Move the selection without changing the text. */
  setSelection(anchor: number, head: number = anchor, origin: TransactionOrigin = 'api'): Transaction {
    return this.dispatch({ selection: { anchor, head }, origin, kind: 'select' })
  }

  /**
   * Replace the whole text from outside.
   *
   * The history is cleared: an undo that reached back across a value the host
   * swapped in would restore text belonging to a different document.
   */
  setValue(text: string, options: { keepHistory?: boolean } = {}): Transaction {
    const next = normalizeNewlines(text)
    if (next === this.doc.toString())
      return this.dispatch({ origin: 'api' })

    const head = Math.min(this.main.head, next.length)
    const transaction = this.dispatch({
      changes: [{ from: 0, to: this.doc.length, insert: next }],
      selection: { anchor: head, head },
      origin: 'api',
      kind: 'set',
      addToHistory: options.keepHistory === true,
      scrollIntoView: false,
    })

    if (!options.keepHistory)
      this.history.clear()

    return transaction
  }

  /**
   * Take in what a text field now holds.
   *
   * The textarea did the editing: it knows about input methods, dictation,
   * spellcheck replacements, drag and drop and whatever the platform invents
   * next, and the editor is told afterwards. What changed is found by trimming
   * what the two texts share at each end, which names one replaced range. That
   * is exactly what a text field does on any single input event.
   */
  syncInput(value: string, selectionStart: number, selectionEnd: number, backward = false): Transaction {
    const next = normalizeNewlines(value)
    const previous = this.doc.toString()
    const selection = backward
      ? { anchor: selectionEnd, head: selectionStart }
      : { anchor: selectionStart, head: selectionEnd }

    if (next === previous)
      return this.dispatch({ selection, origin: 'input', kind: 'select' })

    const limit = Math.min(previous.length, next.length)
    let prefix = 0
    while (prefix < limit && previous.charCodeAt(prefix) === next.charCodeAt(prefix))
      prefix++

    let suffix = 0
    while (
      suffix < limit - prefix
        && previous.charCodeAt(previous.length - 1 - suffix) === next.charCodeAt(next.length - 1 - suffix)
    ) {
      suffix++
    }

    const insert = next.slice(prefix, next.length - suffix)
    const removed = previous.length - suffix - prefix
    const kind = removed === 0 ? 'type' : insert === '' ? 'delete' : 'replace'

    const transaction = this.dispatch({
      changes: [{ from: prefix, to: previous.length - suffix, insert }],
      selection,
      origin: 'input',
      kind,
    })
    this.doc.adoptText(next)

    return transaction
  }

  undo(): boolean {
    const entry = this.history.popUndo()
    if (!entry)
      return false

    this.dispatch({ changes: entry.inverse, selection: entry.before, origin: 'history', kind: 'undo' })

    return true
  }

  redo(): boolean {
    const entry = this.history.popRedo()
    if (!entry)
      return false

    this.dispatch({ changes: entry.changes, selection: entry.after, origin: 'history', kind: 'redo' })

    return true
  }

  /** Run a command by name. False when there is none, or it had nothing to do. */
  exec(name: string): boolean {
    const command = this.commands.get(name)

    return command ? command(this) : false
  }
}
