/**
 * The editor's view: a text field laid over a painted copy of itself.
 *
 * The field is a real `<textarea>` holding the whole document, with its text
 * made transparent. Underneath it, the same text is drawn again in colour. The
 * reader sees the coloured copy and types into the field, and because it is a
 * real field the browser supplies everything that is hard to build: the caret,
 * the selection, input methods, dictation, spellcheck replacements, drag and
 * drop, the clipboard, and a control a screen reader already understands.
 *
 * What this file adds is everything a field does not do. It keeps the two
 * layers on the same pixels, draws only the lines on screen, repaints only the
 * lines whose tokens changed, and positions what hangs off a line: a number in
 * the gutter, a squiggle under a range, a result after the end, ghost text at
 * the caret.
 *
 * Both layers scroll inside one scroller, as ordinary content. The field is as
 * tall and as wide as the document, so it never scrolls on its own, and there
 * is no scroll position to copy from one layer to the other - which is where
 * the two layers of an overlay editor usually come apart for a frame.
 *
 * This is the one file in the editor that owns DOM. The stx template declares
 * the elements; this fills and positions them. The model, in `./core`, knows
 * nothing about any of it.
 */
import type { EditorCore, HighlightedLine, LineTokenizer, Position, ResolvedKeymap, Transaction } from './core'
import { handleTextInput, LineHighlighter, mapOffset, rangeEmpty, rangeFrom, rangeTo } from './core'

/** Something shown beside or after a line: a result, a note, an error. */
export interface EditorWidget {
  /** Zero-based line. */
  line: number
  /** A column to sit at, or `'end'` (the default) to follow the line's text. */
  column?: number | 'end'
  text: string
  /** Free-form: `result`, `error`, `info`. Becomes `data-kind` for styling. */
  kind?: string
  className?: string
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint'

/** A range with something to say about it, drawn as a squiggle. */
export interface EditorDiagnostic {
  from: Position
  to: Position
  message: string
  severity?: DiagnosticSeverity
  source?: string
}

/** Where the caret is, for anything that has to be placed beside it. */
export interface CaretAnchor {
  /** Relative to the text area, which is what a popup is positioned in. */
  left: number
  top: number
  bottom: number
  /** Room between the caret line and each edge of what is visible. */
  spaceAbove: number
  spaceBelow: number
}

export interface EditorViewOptions {
  core: EditorCore
  keymap: ResolvedKeymap
  /** Told about every transaction, after the view has caught up with it. */
  onTransaction?: (transaction: Transaction) => void
  /** A command the core does not own: `run`, `runSelection`, `triggerCompletion`. */
  onCommand?: (name: string) => boolean
  /** First refusal on a key, before any binding. True means it was handled. */
  onKeydown?: (event: KeyboardEvent) => boolean
  onFocus?: () => void
  onBlur?: () => void
  /** Ghost text was taken or let go. */
  onGhost?: (outcome: 'accept' | 'dismiss', text: string) => void
  /** Show each diagnostic's message after its line. Default true. */
  inlineDiagnostics?: boolean
}

interface StoredDiagnostic {
  from: number
  to: number
  message: string
  severity: DiagnosticSeverity
}

interface StoredWidget {
  offset: number
  atEnd: boolean
  text: string
  kind: string
  className: string
}

interface Metrics {
  lineHeight: number
  charWidth: number
  padTop: number
  padBottom: number
  padLeft: number
  padRight: number
}

/** Lines drawn above and below what is visible, so a scroll has something to show. */
const OVERSCAN = 12
/** Lines tokenized past the screen in the pass that follows a change. */
const SYNC_BUDGET = 200
/** Lines tokenized per idle pass while a long cascade or a first load finishes. */
const IDLE_BUDGET = 600
const SEVERITY_RANK: Record<DiagnosticSeverity, number> = { error: 3, warning: 2, info: 1, hint: 0 }
const PRINTABLE_ASCII = /^[\x20-\x7E]*$/

function escapeHtml(text: string): string {
  // Tested before replacing: most lines of most files have nothing to escape.
  if (!/[&<>]/.test(text))
    return text

  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** One line as HTML: a span per coloured run, plain text left unwrapped. */
export function renderLineHtml(line: HighlightedLine | null, text: string): string {
  if (!line || line.text !== text)
    return escapeHtml(text)

  let html = ''
  for (const token of line.tokens)
    html += token.type === '' ? escapeHtml(token.content) : `<span class="tok-${token.type}">${escapeHtml(token.content)}</span>`

  return html
}

function part(root: HTMLElement, name: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-ce="${name}"]`)
  if (!element)
    throw new Error(`CodeEditor: the template has no [data-ce="${name}"] element`)

  return element
}

export class EditorView {
  readonly core: EditorCore
  private readonly options: EditorViewOptions
  private readonly root: HTMLElement
  private readonly scroller: HTMLElement
  private readonly content: HTMLElement
  private readonly gutter: HTMLElement
  private readonly gutterRows: HTMLElement
  private readonly region: HTMLElement
  private readonly rows: HTMLElement
  private readonly textarea: HTMLTextAreaElement
  private readonly activeLine: HTMLElement
  private readonly decorations: HTMLElement
  private readonly widgetLayer: HTMLElement
  private readonly measure: HTMLElement
  private readonly status: HTMLElement | null

  private keymap: ResolvedKeymap
  private highlighter: LineHighlighter | null = null
  private metrics: Metrics = { lineHeight: 20, charWidth: 8, padTop: 0, padBottom: 0, padLeft: 0, padRight: 0 }
  private widthCache: Map<string, number> = new Map()

  /** What each drawn row currently shows, so an unchanged row is left alone. */
  private rendered: Array<HighlightedLine | string | null> = []
  private renderedNumbers: number[] = []
  private firstRow = 0
  private gutterWidth = 0
  private showLineNumbers = true
  private contentWidth = -1
  private contentHeight = -1
  private activeRow = -1

  private widgets: StoredWidget[] = []
  private diagnostics: StoredDiagnostic[] = []
  private ghost: { offset: number, text: string } | null = null
  private announced = ''

  private composing = false
  private focused = false
  private tabLeavesNext = false
  private frame = 0
  private idle: ReturnType<typeof setTimeout> | undefined
  private resizeObserver: ResizeObserver | undefined
  private readonly disposers: Array<() => void> = []
  private destroyed = false

  constructor(root: HTMLElement, options: EditorViewOptions) {
    this.root = root
    this.options = options
    this.core = options.core
    this.keymap = options.keymap
    this.scroller = part(root, 'scroller')
    this.content = part(root, 'content')
    this.gutter = part(root, 'gutter')
    this.gutterRows = part(root, 'gutter-rows')
    this.region = part(root, 'region')
    this.rows = part(root, 'rows')
    this.textarea = part(root, 'input') as HTMLTextAreaElement
    this.activeLine = part(root, 'active-line')
    this.decorations = part(root, 'decorations')
    this.widgetLayer = part(root, 'widgets')
    this.measure = part(root, 'measure')
    this.status = root.querySelector<HTMLElement>('[data-ce="status"]')

    // The field may already hold text the server rendered into it. The model is
    // the authority from here on, so whichever differs is brought into line.
    if (this.textarea.value !== this.core.value)
      this.textarea.value = this.core.value

    this.listen(this.textarea, 'beforeinput', event => this.onBeforeInput(event as InputEvent))
    this.listen(this.textarea, 'input', () => this.onInput())
    this.listen(this.textarea, 'keydown', event => this.onKeydown(event as KeyboardEvent))
    this.listen(this.textarea, 'compositionstart', () => {
      this.composing = true
    })
    this.listen(this.textarea, 'compositionend', () => {
      this.composing = false
      this.onInput()
    })
    this.listen(this.textarea, 'focus', () => {
      this.focused = true
      this.root.setAttribute('data-focused', '')
      this.syncSelection()
      this.render()
      this.options.onFocus?.()
    })
    this.listen(this.textarea, 'blur', () => {
      this.focused = false
      this.tabLeavesNext = false
      this.root.removeAttribute('data-focused')
      this.render()
      this.options.onBlur?.()
    })
    // The field is as large as its text and should never scroll by itself. A
    // browser that nudges it anyway would slide the caret off the painted copy.
    this.listen(this.textarea, 'scroll', () => {
      if (this.textarea.scrollTop !== 0)
        this.textarea.scrollTop = 0
      if (this.textarea.scrollLeft !== 0)
        this.textarea.scrollLeft = 0
    })
    this.listen(this.textarea, 'select', () => this.syncSelection())
    this.listen(this.textarea, 'mouseup', () => this.syncSelection())
    this.listen(this.textarea, 'keyup', () => this.syncSelection())
    // Where a selection change is announced: on the document, for the field
    // that has focus. Not every engine sends it to the field itself.
    this.listen(root.ownerDocument, 'selectionchange', () => {
      if (root.ownerDocument.activeElement === this.textarea)
        this.syncSelection()
    })
    this.listen(this.scroller, 'scroll', () => this.scheduleRender(), { passive: true })
    this.listen(this.gutter, 'mousedown', event => this.onGutterMouseDown(event as MouseEvent))

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.layout())
      this.resizeObserver.observe(this.scroller)
    }

    // A web font that arrives late changes every character's width.
    const fonts = root.ownerDocument.fonts
    if (fonts?.ready)
      void fonts.ready.then(() => !this.destroyed && this.layout())

    this.disposers.push(this.core.subscribe(transaction => this.onTransaction(transaction)))

    this.root.setAttribute('data-ce-ready', '')
    this.layout()
  }

  private listen(target: EventTarget, type: string, handler: (event: Event) => void, options?: AddEventListenerOptions): void {
    target.addEventListener(type, handler, options)
    this.disposers.push(() => target.removeEventListener(type, handler, options))
  }

  // ---------------------------------------------------------------- settings

  setKeymap(keymap: ResolvedKeymap): void {
    this.keymap = keymap
  }

  setLineNumbers(show: boolean): void {
    this.showLineNumbers = show
    this.layout()
  }

  setReadOnly(readOnly: boolean): void {
    this.core.readOnly = readOnly
    this.textarea.readOnly = readOnly
  }

  /** Give the editor a tokenizer, or take it away. Everything is recoloured. */
  setTokenizer<State>(tokenizer: LineTokenizer<State> | null): void {
    // The view never looks inside a tokenizer's state, only hands it back.
    this.highlighter = tokenizer ? new LineHighlighter(tokenizer, this.core.doc) as unknown as LineHighlighter : null
    this.rendered = []
    this.render()
  }

  // ----------------------------------------------------------------- metrics

  /** Re-read the font and the padding, then draw. For a resize or a font change. */
  layout(): void {
    if (this.destroyed)
      return

    const view = this.root.ownerDocument.defaultView
    const style = view ? view.getComputedStyle(this.textarea) : null
    const number = (value: string | undefined, fallback: number): number => {
      const parsed = Number.parseFloat(value ?? '')
      return Number.isFinite(parsed) ? parsed : fallback
    }

    this.measure.textContent = 'x'.repeat(64)
    const sample = this.measure.getBoundingClientRect().width / 64
    const fontSize = number(style?.fontSize, 13)

    this.metrics = {
      lineHeight: number(style?.lineHeight, Math.round(fontSize * 1.5)) || Math.round(fontSize * 1.5),
      charWidth: sample > 0 ? sample : fontSize * 0.6,
      padTop: number(style?.paddingTop, 0),
      padBottom: number(style?.paddingBottom, 0),
      padLeft: number(style?.paddingLeft, 0),
      padRight: number(style?.paddingRight, 0),
    }
    this.widthCache.clear()
    this.activeRow = -1
    this.contentWidth = -1
    this.contentHeight = -1
    this.render()
  }

  /** Width in pixels of the first `column` characters of a line. */
  private widthOf(text: string, column: number): number {
    if (column <= 0)
      return 0

    const slice = column >= text.length ? text : text.slice(0, column)
    // A monospaced font makes this a multiplication for nearly every line.
    // Anything else - a tab, an accent, a wide character - is measured.
    if (PRINTABLE_ASCII.test(slice))
      return slice.length * this.metrics.charWidth

    const cached = this.widthCache.get(slice)
    if (cached !== undefined)
      return cached

    this.measure.textContent = slice
    const width = this.measure.getBoundingClientRect().width
    if (this.widthCache.size > 500)
      this.widthCache.clear()
    this.widthCache.set(slice, width)

    return width
  }

  // ------------------------------------------------------------------- input

  private syncSelection(): void {
    if (this.destroyed)
      return

    const start = this.textarea.selectionStart ?? 0
    const end = this.textarea.selectionEnd ?? start
    const backward = this.textarea.selectionDirection === 'backward'
    const anchor = backward ? end : start
    const head = backward ? start : end
    const main = this.core.main

    if (main.anchor === anchor && main.head === head)
      return
    // Nothing selected has no direction, so do not report one changing.
    if (start === end && main.anchor === main.head && main.head === start)
      return

    this.core.dispatch({ selection: { anchor, head }, origin: 'input', kind: 'select' })
  }

  private onBeforeInput(event: InputEvent): void {
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      // The menu's Undo, or a shake. The field's own history does not know
      // about anything the editor wrote into it, so the editor's is the one.
      event.preventDefault()
      this.core.exec(event.inputType === 'historyUndo' ? 'undo' : 'redo')
      return
    }

    if (this.composing || event.isComposing)
      return

    // A line break or a backspace does not always come with a key. An
    // on-screen keyboard, dictation and some input methods send only the
    // input event, and those deserve the same indentation as a key press.
    // (A real key was already handled, and cancelled, in keydown.)
    if (event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph') {
      this.syncSelection()
      if (this.core.exec('insertNewlineAndIndent'))
        event.preventDefault()
      return
    }
    if (event.inputType === 'deleteContentBackward') {
      this.syncSelection()
      if (this.core.exec('deleteBackward'))
        event.preventDefault()
      return
    }

    if (event.inputType !== 'insertText' || !event.data)
      return

    this.syncSelection()
    if (handleTextInput(this.core, event.data))
      event.preventDefault()
  }

  private onInput(): void {
    if (this.destroyed)
      return

    const field = this.textarea
    this.core.syncInput(
      field.value,
      field.selectionStart ?? 0,
      field.selectionEnd ?? 0,
      field.selectionDirection === 'backward',
    )
  }

  private onKeydown(event: KeyboardEvent): void {
    // A key pressed inside a composition belongs to the input method.
    if (event.isComposing || event.keyCode === 229)
      return

    if (this.options.onKeydown?.(event)) {
      event.preventDefault()
      return
    }

    const plain = !event.ctrlKey && !event.metaKey && !event.altKey

    if (this.ghost && plain && !event.shiftKey) {
      if (event.key === 'Tab') {
        event.preventDefault()
        this.acceptGhost()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        this.setGhostText(null, 'dismiss')
        return
      }
    }

    // Tab indents, which would trap anyone moving through the page by
    // keyboard. Escape lets the next Tab through.
    if (event.key === 'Escape' && plain) {
      this.tabLeavesNext = true
      this.announce('Tab now moves focus out of the editor.')
      return
    }
    if (event.key === 'Tab' && this.tabLeavesNext) {
      this.tabLeavesNext = false
      return
    }
    if (event.key !== 'Shift')
      this.tabLeavesNext = false

    const name = this.keymap.lookup(event)
    if (!name)
      return

    this.syncSelection()
    const handled = this.core.commands.has(name) ? this.core.exec(name) : this.options.onCommand?.(name) === true
    // Undo with nothing to undo still must not reach the field's own history.
    if (handled || name === 'undo' || name === 'redo')
      event.preventDefault()
  }

  private onGutterMouseDown(event: MouseEvent): void {
    event.preventDefault()
    const bounds = this.rows.getBoundingClientRect()
    const row = Math.floor((event.clientY - bounds.top) / this.metrics.lineHeight)
    const line = Math.max(0, Math.min(this.core.doc.lineCount - 1, this.firstRow + row))
    const info = this.core.doc.lineInfo(line)
    const end = line + 1 < this.core.doc.lineCount ? info.to + 1 : info.to

    this.textarea.focus()
    this.core.setSelection(info.from, end)
  }

  // ------------------------------------------------------------ transactions

  private onTransaction(transaction: Transaction): void {
    const { changes } = transaction

    if (transaction.docChanged) {
      // Last first: that is the order they were applied in, so each one's line
      // numbers are true when it is read.
      for (let index = changes.length - 1; index >= 0; index--)
        this.highlighter?.applyChange(changes[index]!)

      for (const diagnostic of this.diagnostics) {
        diagnostic.from = mapOffset(diagnostic.from, changes, 1)
        diagnostic.to = Math.max(diagnostic.from, mapOffset(diagnostic.to, changes, -1))
      }
      for (const widget of this.widgets)
        widget.offset = mapOffset(widget.offset, changes, widget.atEnd ? 1 : -1)
    }

    if (transaction.origin !== 'input') {
      // The field did not make this change, so it has to be told.
      if (transaction.docChanged) {
        if (transaction.kind === 'set' || changes.length > 64) {
          this.textarea.value = this.core.value
        }
        else {
          for (let index = changes.length - 1; index >= 0; index--) {
            const change = changes[index]!
            this.textarea.setRangeText(change.insert, change.from, change.to, 'preserve')
          }
        }
      }

      const main = this.core.main
      const backward = main.head < main.anchor
      this.textarea.setSelectionRange(rangeFrom(main), rangeTo(main), backward ? 'backward' : 'forward')
    }

    this.updateGhost(transaction)
    this.render()

    if (transaction.scrollIntoView && (this.focused || transaction.origin !== 'api'))
      this.revealCaret()

    this.announceDiagnostic()
    this.options.onTransaction?.(transaction)
  }

  // --------------------------------------------------------------- rendering

  private scheduleRender(): void {
    if (this.frame !== 0 || this.destroyed)
      return

    const view = this.root.ownerDocument.defaultView
    if (!view?.requestAnimationFrame) {
      this.render()
      return
    }

    this.frame = view.requestAnimationFrame(() => {
      this.frame = 0
      this.render()
    })
  }

  private visibleRange(): { first: number, last: number } {
    const { lineHeight, padTop } = this.metrics
    const count = this.core.doc.lineCount
    const top = this.scroller.scrollTop - padTop
    // A scroller that has not been laid out reports no height. Draw a screenful
    // anyway, so the first frame is not an empty editor.
    const height = this.scroller.clientHeight || 600
    const first = Math.max(0, Math.floor(top / lineHeight) - OVERSCAN)
    const last = Math.min(count, Math.ceil((top + height) / lineHeight) + OVERSCAN)

    return { first: Math.min(first, Math.max(0, count - 1)), last: Math.max(last, Math.min(count, first + 1)) }
  }

  /** Draw what is on screen. Safe to call at any time, and cheap when little changed. */
  render(): void {
    if (this.destroyed)
      return

    const doc = this.core.doc
    const { lineHeight, padTop, padBottom, padLeft, padRight, charWidth } = this.metrics
    const count = doc.lineCount

    // The gutter is as wide as the largest line number, and no narrower than
    // three digits so it does not twitch as a file passes ten or a hundred lines.
    const digits = Math.max(3, String(count).length)
    const gutterWidth = this.showLineNumbers ? Math.ceil(digits * charWidth + 2 * charWidth) : 0
    if (gutterWidth !== this.gutterWidth) {
      this.gutterWidth = gutterWidth
      this.gutter.style.width = `${gutterWidth}px`
      this.gutter.style.display = gutterWidth === 0 ? 'none' : ''
    }

    // The document's size, which is the field's size, so the scroller scrolls
    // and the field never has to.
    let longest = ''
    for (let index = 0; index < count; index++) {
      const text = doc.line(index)
      if (text.length > longest.length)
        longest = text
    }
    const width = Math.ceil(padLeft + this.widthOf(longest, longest.length) + padRight + 2 * charWidth)
    const height = Math.ceil(padTop + count * lineHeight + padBottom)
    if (width !== this.contentWidth) {
      this.contentWidth = width
      this.region.style.minWidth = `${width}px`
    }
    if (height !== this.contentHeight) {
      this.contentHeight = height
      this.content.style.height = `${height}px`
    }

    const { first, last } = this.visibleRange()

    if (this.highlighter?.pending) {
      this.highlighter.update({ through: last - 1, maxLines: SYNC_BUDGET })
      if (this.highlighter.pending)
        this.scheduleIdle()
    }

    this.renderRows(first, last)
    this.renderGutter(first, last)
    this.renderActiveLine()
    this.renderDecorations(first, last)
    this.renderWidgets(first, last)
  }

  private renderRows(first: number, last: number): void {
    const doc = this.core.doc
    const wanted = last - first

    while (this.rows.childElementCount < wanted) {
      const row = this.root.ownerDocument.createElement('div')
      row.className = 'stx-ce-line'
      this.rows.appendChild(row)
    }
    while (this.rows.childElementCount > wanted)
      this.rows.lastElementChild!.remove()

    if (first !== this.firstRow) {
      // The same elements now stand for different lines.
      this.rendered = []
      this.firstRow = first
    }
    this.rows.style.transform = `translateY(${first * this.metrics.lineHeight}px)`
    this.rendered.length = wanted

    const children = this.rows.children
    for (let index = 0; index < wanted; index++) {
      const text = doc.line(first + index)
      const line = this.highlighter?.get(first + index) ?? null
      // A line whose tokens are for older text is drawn plain until its turn.
      const source = line && line.text === text ? line : text

      if (this.rendered[index] === source)
        continue

      this.rendered[index] = source
      children[index]!.innerHTML = typeof source === 'string' ? escapeHtml(source) : renderLineHtml(source, text)
    }
  }

  private renderGutter(first: number, last: number): void {
    if (this.gutterWidth === 0)
      return

    const wanted = last - first
    while (this.gutterRows.childElementCount < wanted) {
      const row = this.root.ownerDocument.createElement('div')
      row.className = 'stx-ce-number'
      this.gutterRows.appendChild(row)
    }
    while (this.gutterRows.childElementCount > wanted)
      this.gutterRows.lastElementChild!.remove()

    this.gutterRows.style.transform = `translateY(${first * this.metrics.lineHeight}px)`
    this.renderedNumbers.length = wanted

    const active = this.focused && rangeEmpty(this.core.main) ? this.core.cursor.line : -1
    const marked = this.markedLines()
    const children = this.gutterRows.children

    for (let index = 0; index < wanted; index++) {
      const line = first + index
      const row = children[index] as HTMLElement
      if (this.renderedNumbers[index] !== line) {
        this.renderedNumbers[index] = line
        row.textContent = String(line + 1)
      }

      const severity = marked.get(line) ?? ''
      if ((row.dataset.severity ?? '') !== severity) {
        if (severity)
          row.dataset.severity = severity
        else
          delete row.dataset.severity
      }

      const isActive = line === active
      if (row.hasAttribute('data-active') !== isActive)
        row.toggleAttribute('data-active', isActive)
    }
  }

  private renderActiveLine(): void {
    const show = this.focused && rangeEmpty(this.core.main)
    const line = show ? this.core.cursor.line : -1
    if (line === this.activeRow)
      return

    this.activeRow = line
    if (line < 0) {
      this.activeLine.style.display = 'none'
      return
    }

    this.activeLine.style.display = ''
    this.activeLine.style.transform = `translateY(${this.metrics.padTop + line * this.metrics.lineHeight}px)`
  }

  /** The worst severity on each line that has a diagnostic. */
  private markedLines(): Map<number, DiagnosticSeverity> {
    const marked = new Map<number, DiagnosticSeverity>()
    for (const diagnostic of this.diagnostics) {
      const line = this.core.doc.lineIndexAt(diagnostic.from)
      const existing = marked.get(line)
      if (!existing || SEVERITY_RANK[diagnostic.severity] > SEVERITY_RANK[existing])
        marked.set(line, diagnostic.severity)
    }

    return marked
  }

  private renderDecorations(first: number, last: number): void {
    if (this.diagnostics.length === 0) {
      if (this.decorations.childElementCount > 0)
        this.decorations.replaceChildren()
      return
    }

    const doc = this.core.doc
    const { lineHeight, padTop, padLeft } = this.metrics
    const fragment = this.root.ownerDocument.createDocumentFragment()

    for (const diagnostic of this.diagnostics) {
      const start = doc.positionAt(diagnostic.from)
      const end = doc.positionAt(diagnostic.to)

      for (let line = Math.max(first, start.line); line <= Math.min(last - 1, end.line); line++) {
        const text = doc.line(line)
        const fromColumn = line === start.line ? start.column : 0
        let toColumn = line === end.line ? end.column : text.length
        // A range with nothing in it still has to be visible somewhere.
        if (toColumn <= fromColumn)
          toColumn = Math.min(text.length, fromColumn + 1)

        const mark = this.root.ownerDocument.createElement('div')
        mark.className = 'stx-ce-squiggle'
        mark.dataset.severity = diagnostic.severity
        // The same characters, invisible, so the underline is exactly as wide
        // as the text it sits under whatever the characters are.
        mark.textContent = text.slice(fromColumn, toColumn) || ' '
        mark.style.transform = `translate(${padLeft + this.widthOf(text, fromColumn)}px, ${padTop + line * lineHeight}px)`
        fragment.appendChild(mark)
      }
    }

    this.decorations.replaceChildren(fragment)
  }

  private renderWidgets(first: number, last: number): void {
    const doc = this.core.doc
    const { lineHeight, padTop, padLeft, charWidth } = this.metrics
    const fragment = this.root.ownerDocument.createDocumentFragment()
    /** What follows the end of each line, in the order it was given. */
    const trailing = new Map<number, HTMLElement>()

    const trail = (line: number): HTMLElement => {
      let holder = trailing.get(line)
      if (!holder) {
        const text = doc.line(line)
        holder = this.root.ownerDocument.createElement('div')
        holder.className = 'stx-ce-trailing'
        holder.style.transform = `translate(${padLeft + this.widthOf(text, text.length) + 2 * charWidth}px, ${padTop + line * lineHeight}px)`
        trailing.set(line, holder)
        fragment.appendChild(holder)
      }

      return holder
    }

    const chip = (text: string, kind: string, className: string): HTMLElement => {
      const element = this.root.ownerDocument.createElement('span')
      element.className = className ? `stx-ce-widget ${className}` : 'stx-ce-widget'
      element.dataset.kind = kind
      // Text, never markup: a result is whatever the user's code returned.
      element.textContent = text

      return element
    }

    for (const widget of this.widgets) {
      const position = doc.positionAt(widget.offset)
      if (position.line < first || position.line >= last)
        continue

      if (widget.atEnd) {
        trail(position.line).appendChild(chip(widget.text, widget.kind, widget.className))
        continue
      }

      const element = chip(widget.text, widget.kind, widget.className)
      element.classList.add('stx-ce-widget--placed')
      element.style.transform = `translate(${padLeft + this.widthOf(doc.line(position.line), position.column)}px, ${padTop + position.line * lineHeight}px)`
      fragment.appendChild(element)
    }

    if (this.options.inlineDiagnostics !== false) {
      const shown = new Set<number>()
      const ordered = [...this.diagnostics].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
      for (const diagnostic of ordered) {
        const line = doc.lineIndexAt(diagnostic.from)
        // One message per line: the worst one. The rest are still underlined.
        if (line < first || line >= last || shown.has(line))
          continue

        shown.add(line)
        trail(line).appendChild(chip(diagnostic.message.split('\n')[0]!, diagnostic.severity, 'stx-ce-widget--diagnostic'))
      }
    }

    if (this.ghost) {
      const position = doc.positionAt(this.ghost.offset)
      if (position.line >= first && position.line < last) {
        const [head, ...rest] = this.ghost.text.split('\n')
        const left = padLeft + this.widthOf(doc.line(position.line), position.column)
        const top = padTop + position.line * lineHeight

        const inline = this.root.ownerDocument.createElement('span')
        inline.className = 'stx-ce-ghost'
        inline.textContent = head ?? ''
        inline.style.transform = `translate(${left}px, ${top}px)`
        fragment.appendChild(inline)

        if (rest.length > 0) {
          // Later lines start at the margin, over whatever code is below. They
          // are a preview of text that is not in the document yet.
          const block = this.root.ownerDocument.createElement('div')
          block.className = 'stx-ce-ghost stx-ce-ghost--block'
          block.textContent = rest.join('\n')
          block.style.transform = `translate(${padLeft}px, ${top + lineHeight}px)`
          fragment.appendChild(block)
        }
      }
    }

    if (fragment.childNodes.length === 0 && this.widgetLayer.childElementCount === 0)
      return

    this.widgetLayer.replaceChildren(fragment)
  }

  private scheduleIdle(): void {
    if (this.idle !== undefined || this.destroyed)
      return

    this.idle = setTimeout(() => {
      this.idle = undefined
      if (this.destroyed || !this.highlighter?.pending)
        return

      const pass = this.highlighter.update({ through: -1, maxLines: IDLE_BUDGET })
      const { first, last } = this.visibleRange()
      // Only what is on screen needs drawing. The rest is ready for a scroll.
      if (pass.from < last && pass.to > first)
        this.renderRows(first, last)
      if (this.highlighter.pending)
        this.scheduleIdle()
    }, 0)
  }

  // ------------------------------------------------------------------- caret

  /** Where the caret is, in the coordinates of the text area. */
  caretAnchor(offset: number = this.core.main.head): CaretAnchor {
    const { lineHeight, padTop, padLeft } = this.metrics
    const position = this.core.doc.positionAt(offset)
    const top = padTop + position.line * lineHeight
    const visibleTop = this.scroller.scrollTop
    const visibleBottom = visibleTop + this.scroller.clientHeight

    return {
      left: padLeft + this.widthOf(this.core.doc.line(position.line), position.column),
      top,
      bottom: top + lineHeight,
      spaceAbove: top - visibleTop,
      spaceBelow: visibleBottom - (top + lineHeight),
    }
  }

  /** Scroll so the caret is on screen, with a little room around it. */
  revealCaret(): void {
    const { lineHeight, charWidth } = this.metrics
    const anchor = this.caretAnchor()
    const scroller = this.scroller
    const marginY = lineHeight
    const marginX = 4 * charWidth

    if (anchor.top - marginY < scroller.scrollTop)
      scroller.scrollTop = Math.max(0, anchor.top - marginY)
    else if (anchor.bottom + marginY > scroller.scrollTop + scroller.clientHeight)
      scroller.scrollTop = anchor.bottom + marginY - scroller.clientHeight

    // The gutter stays put while the text scrolls under it, so the caret's
    // left edge is measured from where the gutter ends.
    const left = anchor.left
    const visibleWidth = scroller.clientWidth - this.gutterWidth
    if (left - marginX < scroller.scrollLeft)
      scroller.scrollLeft = Math.max(0, left - marginX)
    else if (left + marginX > scroller.scrollLeft + visibleWidth)
      scroller.scrollLeft = left + marginX - visibleWidth
  }

  focus(): void {
    this.textarea.focus()
  }

  get hasFocus(): boolean {
    return this.focused
  }

  // ------------------------------------------------------------- annotations

  /** Replace everything shown beside lines. */
  setWidgets(widgets: readonly EditorWidget[]): void {
    const doc = this.core.doc
    this.widgets = widgets.map((widget) => {
      const atEnd = widget.column === undefined || widget.column === 'end'
      const line = Math.max(0, Math.min(doc.lineCount - 1, widget.line))
      const offset = atEnd ? doc.lineInfo(line).to : doc.offsetAt({ line, column: widget.column as number })

      return { offset, atEnd, text: widget.text, kind: widget.kind ?? 'result', className: widget.className ?? '' }
    })
    this.render()
  }

  /** Replace every diagnostic. */
  setDiagnostics(diagnostics: readonly EditorDiagnostic[]): void {
    const doc = this.core.doc
    this.diagnostics = diagnostics.map((diagnostic) => {
      const from = doc.offsetAt(diagnostic.from)

      return {
        from,
        to: Math.max(from, doc.offsetAt(diagnostic.to)),
        message: diagnostic.message,
        severity: diagnostic.severity ?? 'error',
      }
    })
    this.announced = ''
    this.render()
    this.announceDiagnostic()
  }

  /**
   * Show a suggestion at the caret, or clear it.
   *
   * It belongs to the place it was shown at. Typing its first characters
   * keeps it and shortens it; anything else lets it go.
   */
  setGhostText(text: string | null, outcome: 'accept' | 'dismiss' | null = null): void {
    const previous = this.ghost
    this.ghost = text && rangeEmpty(this.core.main) ? { offset: this.core.main.head, text } : null

    if (previous && !this.ghost && outcome)
      this.options.onGhost?.(outcome, previous.text)

    this.render()
  }

  get ghostText(): string {
    return this.ghost?.text ?? ''
  }

  /** Insert the suggestion, as one undo step. */
  acceptGhost(): boolean {
    const ghost = this.ghost
    if (!ghost || this.core.readOnly)
      return false

    this.ghost = null
    const end = ghost.offset + ghost.text.length
    this.core.dispatch({
      changes: [{ from: ghost.offset, to: ghost.offset, insert: ghost.text }],
      selection: { anchor: end, head: end },
      kind: 'ghost',
    })
    this.options.onGhost?.('accept', ghost.text)

    return true
  }

  private updateGhost(transaction: Transaction): void {
    const ghost = this.ghost
    if (!ghost)
      return

    const [change] = transaction.changes
    const typedThrough = transaction.changes.length === 1
      && change!.from === ghost.offset
      && change!.to === ghost.offset
      && change!.insert !== ''
      && ghost.text.startsWith(change!.insert)
      && this.core.main.head === ghost.offset + change!.insert.length

    if (typedThrough) {
      const rest = ghost.text.slice(change!.insert.length)
      this.ghost = rest === '' ? null : { offset: ghost.offset + change!.insert.length, text: rest }
      if (!this.ghost)
        this.options.onGhost?.('accept', ghost.text)
      return
    }

    this.ghost = null
    this.options.onGhost?.('dismiss', ghost.text)
  }

  // ----------------------------------------------------------- announcements

  private announce(message: string): void {
    if (this.status && this.status.textContent !== message)
      this.status.textContent = message
  }

  /** Say what is wrong with the line the caret is on, once per line. */
  private announceDiagnostic(): void {
    if (!this.status || this.diagnostics.length === 0)
      return

    const line = this.core.cursor.line
    const here = this.diagnostics.filter(diagnostic => this.core.doc.lineIndexAt(diagnostic.from) === line)
    const message = here.length === 0
      ? ''
      : `Line ${line + 1}: ${here.map(diagnostic => `${diagnostic.severity}: ${diagnostic.message}`).join('. ')}`

    if (message !== this.announced) {
      this.announced = message
      this.announce(message)
    }
  }

  // ----------------------------------------------------------------- teardown

  destroy(): void {
    if (this.destroyed)
      return

    this.destroyed = true
    for (const dispose of this.disposers)
      dispose()
    this.disposers.length = 0
    this.resizeObserver?.disconnect()
    if (this.idle !== undefined)
      clearTimeout(this.idle)

    const view = this.root.ownerDocument.defaultView
    if (this.frame !== 0 && view?.cancelAnimationFrame)
      view.cancelAnimationFrame(this.frame)
    this.root.removeAttribute('data-ce-ready')
  }
}
