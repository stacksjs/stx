/**
 * One editor, assembled: the model, the view, the highlighter and the
 * completion list, behind the handful of things a host wants to do with them.
 *
 * The stx component is a template and some signals. Everything that decides
 * something lives here or below, in plain TypeScript, so it can be driven from
 * a test - or from a host that is not an stx page at all.
 */
import type { CompletionItem, Keymap, Transaction } from './core'
import type { EditorDiagnostic, EditorWidget } from './view'
import { CompletionList, createKeymap, defaultKeymap, EditorCore, languageConfig, rangeEmpty, rangeFrom, rangeTo, registerDefaultCommands, wordStart } from './core'
import { createLanguageTokenizer } from './tokenizer'
import { EditorView } from './view'

export interface CodeEditorConfig {
  value?: string
  language?: string
  tabSize?: number
  insertSpaces?: boolean
  readOnly?: boolean
  lineNumbers?: boolean
  /** Colour the code. Off shows plain text and loads no grammar. */
  highlight?: boolean
  /** Offer completions while typing, not only on Ctrl-Space. Default true. */
  autoComplete?: boolean
  /** Names always on offer, before any the host supplies on request. */
  completions?: readonly CompletionItem[]
  /** Bindings laid over the defaults. An empty command name unbinds a key. */
  keymap?: Keymap
  inlineDiagnostics?: boolean
}

export interface SelectionDetail {
  anchor: number
  head: number
  from: number
  to: number
  /** Zero-based line and column of the caret. */
  line: number
  column: number
  text: string
  empty: boolean
}

export interface RunDetail {
  /** The whole document. */
  value: string
  selection: SelectionDetail
}

export interface RunSelectionDetail {
  /** What to run: the selection, or the caret's line when nothing is selected. */
  text: string
  from: number
  to: number
  /** Zero-based line the text starts on, for mapping a result back. */
  line: number
  /** Whether `text` is a real selection rather than the caret's line. */
  selected: boolean
}

export interface CompletionRequest {
  /** What has been typed of the word so far. */
  query: string
  /** Offset the word starts at. Pass it back with the items. */
  from: number
  to: number
  line: number
  column: number
  /** The text of the caret's line up to the caret. */
  textBefore: string
  /** True for Ctrl-Space, false for one triggered by typing. */
  explicit: boolean
  /** The character that triggered it, when typing did. */
  trigger: string
}

export interface PopupItem {
  id: string
  index: number
  label: string
  detail: string
  kind: string
  selected: boolean
}

export interface PopupState {
  open: boolean
  items: PopupItem[]
  /** Id of the selected item, for `aria-activedescendant`. Empty when closed. */
  activeId: string
  left: number
  top: number
  /** `above` when there is no room under the caret. */
  placement: 'below' | 'above'
}

export interface CodeEditorHooks {
  onChange?: (value: string, transaction: Transaction) => void
  onSelection?: (detail: SelectionDetail) => void
  onRun?: (detail: RunDetail) => void
  onRunSelection?: (detail: RunSelectionDetail) => void
  onCompleteRequest?: (request: CompletionRequest) => void
  onCompletionAccept?: (item: CompletionItem) => void
  onPopup?: (state: PopupState) => void
  onGhost?: (outcome: 'accept' | 'dismiss', text: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

const CLOSED_POPUP: PopupState = { open: false, items: [], activeId: '', left: 0, top: 0, placement: 'below' }
const WORD = /^[\p{L}\p{N}_$]*$/u
const TRIGGER = /[\p{L}\p{N}_$.]/u
/** Rows the popup draws. Narrowing by typing is how a reader gets to the rest. */
const POPUP_LIMIT = 80
/** Room the popup wants under the caret before it goes above instead. */
const POPUP_ROOM = 220

let instances = 0

export class CodeEditorController {
  readonly core: EditorCore
  readonly view: EditorView
  private readonly hooks: CodeEditorHooks
  private readonly list = new CompletionList()
  private readonly popupId: string
  private completions: readonly CompletionItem[]
  private autoComplete: boolean
  private highlight: boolean
  private language = ''
  private languageRequest = 0
  private userKeymap: Keymap
  private popupWasOpen = false
  private destroyed = false

  constructor(root: HTMLElement, config: CodeEditorConfig = {}, hooks: CodeEditorHooks = {}) {
    this.hooks = hooks
    this.popupId = `stx-ce-${++instances}`
    this.completions = config.completions ?? []
    this.autoComplete = config.autoComplete ?? true
    this.highlight = config.highlight ?? true
    this.userKeymap = config.keymap ?? {}

    this.core = new EditorCore({
      value: config.value ?? '',
      tabSize: config.tabSize,
      insertSpaces: config.insertSpaces,
      readOnly: config.readOnly,
      language: languageConfig(config.language),
    })
    registerDefaultCommands(this.core)

    this.view = new EditorView(root, {
      core: this.core,
      keymap: createKeymap([defaultKeymap, this.userKeymap]),
      inlineDiagnostics: config.inlineDiagnostics,
      onTransaction: transaction => this.onTransaction(transaction),
      onCommand: name => this.onCommand(name),
      onKeydown: event => this.onKeydown(event),
      onGhost: (outcome, text) => this.hooks.onGhost?.(outcome, text),
      onFocus: () => this.hooks.onFocus?.(),
      onBlur: () => {
        this.closeCompletions()
        this.hooks.onBlur?.()
      },
    })
    this.view.setReadOnly(config.readOnly ?? false)
    this.view.setLineNumbers(config.lineNumbers ?? true)
    this.setLanguage(config.language ?? 'typescript')
  }

  // ------------------------------------------------------------------- value

  get value(): string {
    return this.core.value
  }

  /** Replace the text. A value equal to what is there changes nothing. */
  setValue(value: string): void {
    if (value !== this.core.value)
      this.core.setValue(value)
  }

  get selection(): SelectionDetail {
    const main = this.core.main
    const cursor = this.core.cursor

    return {
      anchor: main.anchor,
      head: main.head,
      from: rangeFrom(main),
      to: rangeTo(main),
      line: cursor.line,
      column: cursor.column,
      text: this.core.selectedText,
      empty: rangeEmpty(main),
    }
  }

  setSelection(anchor: number, head: number = anchor): void {
    this.core.setSelection(anchor, head)
  }

  focus(): void {
    this.view.focus()
  }

  // ---------------------------------------------------------------- settings

  /**
   * Switch language: its comment marker and brackets now, its colours as soon
   * as the grammar has loaded. A language the highlighter does not know is
   * shown plain.
   */
  setLanguage(language: string): void {
    if (language === this.language)
      return

    this.language = language
    this.core.language = languageConfig(language)
    this.loadTokenizer()
  }

  setHighlight(highlight: boolean): void {
    if (highlight === this.highlight)
      return

    this.highlight = highlight
    this.loadTokenizer()
  }

  private loadTokenizer(): void {
    const request = ++this.languageRequest
    if (!this.highlight) {
      this.view.setTokenizer(null)
      return
    }

    createLanguageTokenizer(this.language)
      .catch(() => null)
      .then((tokenizer) => {
        // A language asked for since then is the one that counts.
        if (!this.destroyed && request === this.languageRequest)
          this.view.setTokenizer(tokenizer)
      })
  }

  setReadOnly(readOnly: boolean): void {
    this.view.setReadOnly(readOnly)
    if (readOnly)
      this.closeCompletions()
  }

  setLineNumbers(show: boolean): void {
    this.view.setLineNumbers(show)
  }

  setTabSize(tabSize: number): void {
    this.core.tabSize = Math.max(1, Math.floor(tabSize) || 2)
  }

  setInsertSpaces(insertSpaces: boolean): void {
    this.core.insertSpaces = insertSpaces
  }

  setAutoComplete(autoComplete: boolean): void {
    this.autoComplete = autoComplete
  }

  setKeymap(keymap: Keymap): void {
    this.userKeymap = keymap
    this.view.setKeymap(createKeymap([defaultKeymap, keymap]))
  }

  setCompletions(completions: readonly CompletionItem[]): void {
    this.completions = completions
  }

  setWidgets(widgets: readonly EditorWidget[]): void {
    this.view.setWidgets(widgets)
  }

  setDiagnostics(diagnostics: readonly EditorDiagnostic[]): void {
    this.view.setDiagnostics(diagnostics)
  }

  setGhostText(text: string | null): void {
    this.view.setGhostText(text)
  }

  // --------------------------------------------------------------------- run

  private onCommand(name: string): boolean {
    if (name === 'run') {
      this.hooks.onRun?.({ value: this.core.value, selection: this.selection })
      return true
    }

    if (name === 'runSelection') {
      this.hooks.onRunSelection?.(this.runSelectionDetail())
      return true
    }

    if (name === 'triggerCompletion') {
      this.requestCompletions(true, '')
      return true
    }

    return false
  }

  private runSelectionDetail(): RunSelectionDetail {
    const main = this.core.main
    if (!rangeEmpty(main)) {
      const from = rangeFrom(main)

      return { text: this.core.selectedText, from, to: rangeTo(main), line: this.core.doc.positionAt(from).line, selected: true }
    }

    const line = this.core.doc.lineAt(main.head)

    return { text: line.text, from: line.from, to: line.to, line: line.index, selected: false }
  }

  // -------------------------------------------------------------- completion

  private onTransaction(transaction: Transaction): void {
    if (transaction.docChanged)
      this.hooks.onChange?.(this.core.value, transaction)
    if (transaction.selectionChanged || transaction.docChanged)
      this.hooks.onSelection?.(this.selection)

    if (this.list.isOpen) {
      this.narrowCompletions()
    }
    else if (this.autoComplete && transaction.origin === 'input' && transaction.kind === 'type' && transaction.changes.length === 1) {
      const typed = transaction.changes[0]!.insert
      if (typed.length === 1 && TRIGGER.test(typed))
        this.requestCompletions(false, typed)
    }

    this.publishPopup()
  }

  /** The word the caret is at the end of, as an offset and a query. */
  private currentWord(): { from: number, query: string, textBefore: string } {
    const head = this.core.main.head
    const line = this.core.doc.lineAt(head)
    const textBefore = line.text.slice(0, head - line.from)
    const start = wordStart(textBefore, textBefore.length)

    return { from: line.from + start, query: textBefore.slice(start), textBefore }
  }

  private requestCompletions(explicit: boolean, trigger: string): void {
    if (this.core.readOnly || !rangeEmpty(this.core.main))
      return

    const head = this.core.main.head
    const cursor = this.core.cursor
    const word = this.currentWord()

    // Typing offers the standing list only once there is a word to match it
    // against. Asked for outright, it is offered whole.
    if (this.completions.length > 0 && (explicit || word.query !== ''))
      this.list.open(this.completions, word.from, word.query)

    this.hooks.onCompleteRequest?.({
      query: word.query,
      from: word.from,
      to: head,
      line: cursor.line,
      column: cursor.column,
      textBefore: word.textBefore,
      explicit,
      trigger,
    })
    this.publishPopup()
  }

  /**
   * Offer these items at the caret.
   *
   * `from` is where the word they complete begins; it defaults to the start of
   * the word the caret is in. Typing after this narrows the list without
   * another request.
   */
  showCompletions(items: readonly CompletionItem[], options: { from?: number } = {}): void {
    if (this.destroyed || this.core.readOnly || !rangeEmpty(this.core.main))
      return

    const head = this.core.main.head
    const from = Math.min(head, options.from ?? this.currentWord().from)
    this.list.open(items, from, this.core.doc.slice(from, head))
    this.publishPopup()
  }

  closeCompletions(): void {
    if (!this.list.isOpen && !this.popupWasOpen)
      return

    this.list.close()
    this.publishPopup()
  }

  private narrowCompletions(): void {
    const main = this.core.main
    const from = this.list.from
    const query = rangeEmpty(main) && main.head >= from ? this.core.doc.slice(from, main.head) : null

    // Still inside the word it was opened for, and still a word.
    if (query === null || !WORD.test(query))
      this.list.close()
    else
      this.list.filter(query)
  }

  /** Take the selected completion. False when the list is closed. */
  acceptCompletion(index?: number): boolean {
    if (index !== undefined)
      this.list.select(index)

    const accepted = this.list.accept(this.core.main.head)
    if (!accepted)
      return false

    const end = accepted.change.from + accepted.change.insert.length
    this.list.close()
    this.core.dispatch({ changes: [accepted.change], selection: { anchor: end, head: end }, kind: 'complete' })
    this.hooks.onCompletionAccept?.(accepted.item)
    this.publishPopup()

    return true
  }

  selectCompletion(index: number): void {
    this.list.select(index)
    this.publishPopup()
  }

  private onKeydown(event: KeyboardEvent): boolean {
    if (!this.list.isOpen || event.ctrlKey || event.metaKey || event.altKey)
      return false

    switch (event.key) {
      case 'ArrowDown':
      this.list.move(1)
      break
      case 'ArrowUp':
      this.list.move(-1)
      break
      case 'PageDown':
      this.list.move(8)
      break
      case 'PageUp':
      this.list.move(-8)
      break
      case 'Enter':
      case 'Tab':
      if (event.shiftKey)
        return false
      return this.acceptCompletion()
      case 'Escape':
      this.list.close()
      break
      default:
      return false
    }

    this.publishPopup()

    return true
  }

  private publishPopup(): void {
    if (!this.hooks.onPopup)
      return

    if (!this.list.isOpen) {
      if (this.popupWasOpen) {
        this.popupWasOpen = false
        this.hooks.onPopup(CLOSED_POPUP)
      }
      return
    }

    this.popupWasOpen = true
    const anchor = this.view.caretAnchor(this.list.from)
    const above = anchor.spaceBelow < POPUP_ROOM && anchor.spaceAbove > anchor.spaceBelow
    const selected = this.list.selectedIndex
    const items = this.list.visible.slice(0, POPUP_LIMIT).map((entry, index) => ({
      id: `${this.popupId}-${index}`,
      index,
      label: entry.item.label,
      detail: entry.item.detail ?? '',
      kind: entry.item.kind ?? '',
      selected: index === selected,
    }))

    this.hooks.onPopup({
      open: true,
      items,
      activeId: items[selected]?.id ?? '',
      left: anchor.left,
      top: above ? anchor.top : anchor.bottom,
      placement: above ? 'above' : 'below',
    })
  }

  // ----------------------------------------------------------------- teardown

  destroy(): void {
    this.destroyed = true
    this.list.close()
    this.view.destroy()
  }
}
