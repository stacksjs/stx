/**
 * One editor, assembled: the model, the view, the highlighter and the
 * completion list, behind the handful of things a host wants to do with them.
 *
 * The stx component is a template and some signals. Everything that decides
 * something lives here or below, in plain TypeScript, so it can be driven from
 * a test - or from a host that is not an stx page at all.
 */
import type { CompletionItem, Keymap, LineTokenizer, Position, SignatureHelp, Transaction } from './core'
import type { EditorDiagnostic, EditorWidget, HintBlock } from './view'
import { callContext, CompletionList, createKeymap, defaultKeymap, EditorCore, hoverPlainText, languageConfig, mapOffset, parseHoverContent, rangeEmpty, rangeFrom, rangeTo, registerDefaultCommands, signatureParts, wordAt, wordStart } from './core'
import { createLanguageTokenizer } from './tokenizer'
import { EditorView, renderCodeHtml } from './view'

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
  /** Ask for a hover when the pointer rests on a word. Default true. */
  hover?: boolean
  /** Milliseconds the pointer rests before a hover is asked for. Default 300. */
  hoverDelay?: number
  /** Ask for signature help after `(` and `,` inside a call. Default true. */
  signatureHelp?: boolean
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

export interface HoverRequest {
  /** Zero-based line and column asked about: under the pointer, or the caret. */
  line: number
  column: number
  /** Offsets of the word there. */
  from: number
  to: number
  word: string
  /** True for the keyboard command, false for a resting pointer. */
  explicit: boolean
}

export interface SignatureRequest {
  /** Zero-based line and column of the caret. */
  line: number
  column: number
  /** Offset of the caret. */
  offset: number
  /** Offset just inside the call's opening parenthesis. */
  start: number
  /** Which argument the caret is in, counted from the text alone. */
  active: number
  /** The character that asked: `(` or `,`. Empty for the command. */
  trigger: string
  explicit: boolean
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
  /** The selected item's note, whole: the row cuts it short. */
  detail: string
  /** The selected item's longer note. */
  documentation: string
}

export interface CodeEditorHooks {
  onChange?: (value: string, transaction: Transaction) => void
  onSelection?: (detail: SelectionDetail) => void
  onRun?: (detail: RunDetail) => void
  onRunSelection?: (detail: RunSelectionDetail) => void
  onCompleteRequest?: (request: CompletionRequest) => void
  onCompletionAccept?: (item: CompletionItem) => void
  onPopup?: (state: PopupState) => void
  /** A hover is wanted. Answer with `showHover`. */
  onHoverRequest?: (request: HoverRequest) => void
  /** Signature help is wanted. Answer with `showSignature`. */
  onSignatureRequest?: (request: SignatureRequest) => void
  onGhost?: (outcome: 'accept' | 'dismiss', text: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

const CLOSED_POPUP: PopupState = { open: false, items: [], activeId: '', left: 0, top: 0, placement: 'below', detail: '', documentation: '' }
/** How much text before the caret is read to find the call it is in. */
const CALL_WINDOW = 4000

interface HoverTarget {
  from: number
  to: number
  explicit: boolean
  serial: number
}

interface SignatureTarget {
  /** Offset of the call's opening parenthesis. */
  open: number
  help: SignatureHelp | null
  /** The argument the caret was in when the help arrived. */
  base: number
}
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
  /** Which side of the caret line the completion list is on, while it is open. */
  private popupSide: 'above' | 'below' | '' = ''
  private hoverEnabled: boolean
  private signatureEnabled: boolean
  private hoverTarget: HoverTarget | null = null
  private hoverSerial = 0
  private signatureTarget: SignatureTarget | null = null
  private readonly hintTokenizers = new Map<string, Promise<LineTokenizer<any> | null>>()
  private destroyed = false

  constructor(root: HTMLElement, config: CodeEditorConfig = {}, hooks: CodeEditorHooks = {}) {
    this.hooks = hooks
    this.popupId = `stx-ce-${++instances}`
    this.completions = config.completions ?? []
    this.autoComplete = config.autoComplete ?? true
    this.highlight = config.highlight ?? true
    this.userKeymap = config.keymap ?? {}
    this.hoverEnabled = config.hover ?? true
    this.signatureEnabled = config.signatureHelp ?? true

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
        this.closeHover()
        this.closeSignature()
        this.hooks.onBlur?.()
      },
      hoverDelay: config.hoverDelay,
      onPointerRest: offset => this.onPointerRest(offset),
      onPointerLeave: () => {
        // A hover asked for from the keyboard is not the pointer's to close.
        if (!this.hoverTarget?.explicit)
          this.closeHover()
      },
      onScroll: () => this.closeHover(),
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

    if (name === 'showHover') {
      const head = this.core.main.head
      const range = this.wordRangeAt(head, true)
      if (range)
        this.requestHover(head, range, true)
      else
        this.view.announce('Nothing to describe here.')
      return true
    }

    if (name === 'triggerSignature') {
      this.requestSignature(true, '')
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

    // A hint describes the text as it was. Typing, or moving, makes it stale.
    this.closeHover()
    this.followSignature(transaction)

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
    if (event.ctrlKey || event.metaKey || event.altKey)
      return false

    if (!this.list.isOpen) {
      // Escape closes one thing at a time, nearest the reader first. Only
      // with nothing open does it reach the editor, where it frees Tab.
      if (event.key !== 'Escape' || event.shiftKey)
        return false
      if (this.view.hoverOpen || this.hoverTarget) {
        this.closeHover()
        return true
      }
      if (this.signatureTarget) {
        this.closeSignature()
        return true
      }

      return false
    }

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
        this.setPopupSide('')
        this.hooks.onPopup(CLOSED_POPUP)
      }
      return
    }

    this.popupWasOpen = true
    const anchor = this.view.caretAnchor(this.list.from)
    const above = anchor.spaceBelow < POPUP_ROOM && anchor.spaceAbove > anchor.spaceBelow
    this.setPopupSide(above ? 'above' : 'below')
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
      detail: this.list.selected?.detail ?? '',
      documentation: this.list.selected?.documentation ?? '',
    })
  }

  /** The list and the signature both want the caret line. The list has it first. */
  private setPopupSide(side: 'above' | 'below' | ''): void {
    if (side === this.popupSide)
      return

    this.popupSide = side
    if (this.signatureTarget?.help)
      this.drawSignature(this.currentCall()?.active ?? 0)
  }

  // ------------------------------------------------------------------- hover

  setHover(enabled: boolean): void {
    this.hoverEnabled = enabled
    if (!enabled)
      this.closeHover()
  }

  /** The word at an offset, as offsets. */
  private wordRangeAt(offset: number, inclusiveEnd: boolean): { from: number, to: number, word: string } | null {
    const line = this.core.doc.lineAt(Math.max(0, Math.min(this.core.doc.length, offset)))
    const range = wordAt(line.text, offset - line.from, inclusiveEnd)

    return range ? { from: line.from + range.from, to: line.from + range.to, word: range.word } : null
  }

  private onPointerRest(offset: number | null): void {
    if (!this.hoverEnabled)
      return

    const range = offset === null ? null : this.wordRangeAt(offset, false)
    if (!range) {
      if (!this.hoverTarget?.explicit)
        this.closeHover()
      return
    }

    // Still on the word already asked about: nothing new to ask.
    const current = this.hoverTarget
    if (current && current.from === range.from && current.to === range.to)
      return

    this.requestHover(offset!, range, false)
  }

  private requestHover(offset: number, range: { from: number, to: number, word: string }, explicit: boolean): void {
    this.view.hideHover()
    // A new serial makes any answer still on its way a stale one.
    this.hoverTarget = { from: range.from, to: range.to, explicit, serial: ++this.hoverSerial }
    const position = this.core.doc.positionAt(offset)
    this.hooks.onHoverRequest?.({ line: position.line, column: position.column, from: range.from, to: range.to, word: range.word, explicit })
  }

  /**
   * Show a hover: Markdown or plain text, as a language server gives it. A
   * fenced block is drawn as code in the fence's language (the editor's when
   * it names none), the rest as text.
   *
   * Pass the position the answer is for. An answer for a word the pointer has
   * since left is dropped, which is how a slow answer never lands on the wrong
   * word. Without a position it goes to the word last asked about, or the one
   * at the caret. Empty content closes the hover.
   */
  showHover(content: string | null | undefined, position?: Position): void {
    if (this.destroyed)
      return

    let target = this.hoverTarget
    if (position) {
      const offset = this.core.doc.offsetAt(position)
      if (target && (offset < target.from || offset > target.to))
        return
      if (!target) {
        const range = this.wordRangeAt(offset, true) ?? { from: offset, to: offset }
        target = { from: range.from, to: range.to, explicit: false, serial: ++this.hoverSerial }
      }
    }
    else if (!target) {
      const head = this.core.main.head
      const range = this.wordRangeAt(head, true) ?? { from: head, to: head }
      target = { from: range.from, to: range.to, explicit: true, serial: ++this.hoverSerial }
    }

    const segments = typeof content === 'string' ? parseHoverContent(content) : []
    if (segments.length === 0) {
      this.closeHover()
      return
    }

    this.hoverTarget = target
    const blocks: HintBlock[] = segments.map(segment => ({ kind: segment.kind, text: segment.text }))
    this.view.showHover(blocks, target.from)
    if (target.explicit)
      this.view.announce(hoverPlainText(content!))

    // Colour arrives a moment later. A grammar the editor already has is a
    // resolved promise away; one it has to load must not hold the hint back.
    const { serial } = target
    const pending: Array<Promise<void>> = []
    segments.forEach((segment, index) => {
      if (segment.kind !== 'code')
        return

      pending.push(this.hintTokenizer(segment.language || this.language).then((tokenizer) => {
        if (tokenizer)
          blocks[index] = { kind: 'code', text: segment.text, html: renderCodeHtml(tokenizer, segment.text) }
      }))
    })
    if (pending.length > 0) {
      void Promise.all(pending).then(() => {
        if (!this.destroyed && this.hoverTarget?.serial === serial && this.view.hoverOpen && blocks.some(block => block.html !== undefined))
          this.view.showHover(blocks, target.from)
      })
    }
  }

  closeHover(): void {
    if (!this.hoverTarget && !this.view.hoverOpen)
      return

    this.hoverTarget = null
    this.hoverSerial++
    this.view.hideHover()
  }

  private hintTokenizer(language: string): Promise<LineTokenizer<any> | null> {
    let tokenizer = this.hintTokenizers.get(language)
    if (!tokenizer) {
      tokenizer = this.highlight ? createLanguageTokenizer(language).catch(() => null) : Promise.resolve(null)
      this.hintTokenizers.set(language, tokenizer)
    }

    return tokenizer
  }

  // --------------------------------------------------------------- signature

  setSignatureHelp(enabled: boolean): void {
    this.signatureEnabled = enabled
    if (!enabled)
      this.closeSignature()
  }

  /** The call the caret is in, with its parenthesis as a document offset. */
  private currentCall(): { open: number, active: number } | null {
    if (!rangeEmpty(this.core.main))
      return null

    const head = this.core.main.head
    const start = Math.max(0, head - CALL_WINDOW)
    const context = callContext(this.core.doc.slice(start, head))

    return context ? { open: start + context.open, active: context.active } : null
  }

  private requestSignature(explicit: boolean, trigger: string): void {
    if (this.core.readOnly)
      return

    const call = this.currentCall()
    if (!call) {
      this.closeSignature()
      return
    }

    // The same call keeps what it is showing until the new answer replaces it.
    if (this.signatureTarget?.open !== call.open) {
      this.view.hideSignature()
      this.signatureTarget = { open: call.open, help: null, base: call.active }
    }

    const head = this.core.main.head
    const cursor = this.core.cursor
    this.hooks.onSignatureRequest?.({ line: cursor.line, column: cursor.column, offset: head, start: call.open + 1, active: call.active, trigger, explicit })
  }

  /**
   * Show a signature above the caret with one parameter marked. `active` is
   * the parameter being written; left out, it is counted from the commas
   * typed so far. A null, or a caret that is in no call, closes it.
   */
  showSignature(help: SignatureHelp | null | undefined): void {
    if (this.destroyed)
      return

    const call = this.currentCall()
    if (!help || !help.label || !call) {
      this.closeSignature()
      return
    }

    this.signatureTarget = { open: call.open, help, base: call.active }
    this.drawSignature(call.active)
  }

  closeSignature(): void {
    if (!this.signatureTarget)
      return

    this.signatureTarget = null
    this.view.hideSignature()
  }

  private drawSignature(active: number): void {
    const target = this.signatureTarget
    if (!target?.help)
      return

    const { help } = target
    // The host's count is the truth for the moment it was given. Commas typed
    // since move it on, so the mark does not wait for the next answer.
    const index = help.active === undefined ? active : help.active + (active - target.base)
    const parts = signatureParts({ ...help, active: index })
    const head = this.core.main.head
    const sameLine = this.core.doc.lineIndexAt(target.open) === this.core.doc.lineIndexAt(head)

    this.view.showSignature({
      before: parts.before,
      active: parts.active,
      after: parts.after,
      documentation: parts.parameterDocumentation || help.documentation || '',
    }, sameLine ? target.open + 1 : head, this.popupSide === 'above' ? 'below' : this.popupSide === 'below' ? 'above' : undefined)
  }

  /** Keep the signature with the call it is for, and ask when one begins. */
  private followSignature(transaction: Transaction): void {
    const target = this.signatureTarget
    if (target && transaction.docChanged)
      target.open = mapOffset(target.open, transaction.changes, 1)

    const typed = transaction.docChanged && (transaction.kind === 'type' || transaction.kind === 'pair')
      ? this.core.doc.slice(Math.max(0, this.core.main.head - 1), this.core.main.head)
      : ''
    if (this.signatureEnabled && (typed === '(' || typed === ',')) {
      this.requestSignature(false, typed)
      if (this.signatureTarget?.help)
        this.drawSignature(this.currentCall()?.active ?? 0)
      return
    }

    if (!target)
      return

    const call = this.currentCall()
    if (!call)
      this.closeSignature()
    else if (call.open !== target.open)
      this.requestSignature(false, '')
    else
      this.drawSignature(call.active)
  }

  // ----------------------------------------------------------------- teardown

  destroy(): void {
    this.destroyed = true
    this.list.close()
    this.hoverTarget = null
    this.signatureTarget = null
    this.view.destroy()
  }
}
