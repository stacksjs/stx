/**
 * A value inspector in the DOM.
 *
 * Draws the rows of a `TreeModel` that are on screen and no others: every row
 * is the same height, so which rows those are is arithmetic on the scroll
 * position, and a tree of fifty thousand lines costs what thirty do.
 *
 * Focus stays on the tree itself and the current row is named with
 * `aria-activedescendant`. A virtualized row cannot hold focus, because it
 * stops existing when it scrolls away.
 */
import type { TreeNode, TreeOpenKind, TreePath, TreeRow } from './core'
import { formatPath, previewOf, nodeToJson, TreeModel } from './core'

export interface JsonTreeOptions {
  value?: TreeNode | TreeNode[] | null
  /** Containers nearer the root than this start expanded. Default 1. */
  depth?: number
  /** Pixels. Default 22. */
  rowHeight?: number
  /** Rows drawn beyond each edge of what is visible. Default 6. */
  overscan?: number
  /** Says where a node can be opened, overriding the node's own `openable`. */
  openable?: ((node: TreeNode, path: TreePath) => TreeOpenKind | TreeOpenKind[] | null | undefined) | null
  /** Keep the browser's own context menu from opening, because the host shows one. */
  contextMenu?: boolean
}

export interface TreeSelectDetail {
  id: string
  node: TreeNode
  path: TreePath
  /** The path as text: `$.users[0].name`. */
  pathText: string
}

export interface TreeToggleDetail extends TreeSelectDetail {
  expanded: boolean
}

export interface TreeCopyDetail {
  what: 'value' | 'path'
  text: string
  path: TreePath
  node: TreeNode
}

export interface TreeOpenDetail extends TreeSelectDetail {
  as: TreeOpenKind
}

export interface TreeContextDetail extends TreeSelectDetail {
  x: number
  y: number
}

export interface JsonTreeCallbacks {
  onSelect?: (detail: TreeSelectDetail) => void
  onToggle?: (detail: TreeToggleDetail) => void
  onCopy?: (detail: TreeCopyDetail) => void
  onOpen?: (detail: TreeOpenDetail) => void
  onLoadMore?: (detail: TreeSelectDetail) => void
  onContext?: (detail: TreeContextDetail) => void
}

/** What a pooled row element remembers about the row it last drew. */
interface RowElement extends HTMLElement {
  __jt?: { index: number, version: number, opens: string }
}

interface RowParts {
  twisty: HTMLElement
  label: HTMLElement
  separator: HTMLElement
  preview: HTMLElement
  actions: HTMLElement
}

const TYPEAHEAD_RESET = 600
/** A row's text is one line; nothing longer than this is worth laying out. */
const TEXT_LIMIT = 400
const OPEN_LABELS: Record<string, string> = { table: 'Table', graph: 'Graph', preview: 'Preview' }

function clip(text: string): string {
  return text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)}…` : text
}

function listOf(value: TreeOpenKind | TreeOpenKind[] | null | undefined): TreeOpenKind[] {
  if (value == null || value === '')
    return []
  return Array.isArray(value) ? value : [value]
}

export class JsonTreeView {
  readonly model: TreeModel

  private readonly scroller: HTMLElement
  private readonly content: HTMLElement
  private readonly rowsEl: HTMLElement
  private readonly status: HTMLElement | null
  private readonly prefix: string
  private rowHeight: number
  private overscan: number
  private openable: JsonTreeOptions['openable']
  private contextMenu: boolean
  private pool: RowElement[] = []
  private parts = new WeakMap<HTMLElement, RowParts>()
  private active = -1
  private activeId = ''
  /** What has been typed towards a label, and when the last character arrived. */
  private typed = ''
  private typedAt = 0
  private observer: ResizeObserver | null = null
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: JsonTreeOptions = {}, private readonly callbacks: JsonTreeCallbacks = {}) {
    const part = (name: string): HTMLElement | null => root.querySelector<HTMLElement>(`[data-jt="${name}"]`)
    this.scroller = part('scroller') ?? root
    this.content = part('content') ?? this.scroller
    this.rowsEl = part('rows') ?? this.content
    this.status = part('status')
    this.prefix = `${root.id || `json-tree-${Math.random().toString(36).slice(2, 8)}`}-row-`
    this.rowHeight = options.rowHeight && options.rowHeight > 0 ? options.rowHeight : 22
    this.overscan = options.overscan ?? 6
    this.openable = options.openable ?? null
    this.contextMenu = Boolean(options.contextMenu)
    this.model = new TreeModel(options.value, { depth: options.depth ?? 1 })

    // Everything drawn in here is data. A value that happens to contain `{{ }}`
    // is text to show, never an expression for the stx runtime to evaluate.
    ;(this.rowsEl as unknown as { __stx_inert_content: boolean }).__stx_inert_content = true
    root.style.setProperty('--stx-tree-row-height', `${this.rowHeight}px`)

    const listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, handler: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions): void => {
      target.addEventListener(type, handler, options)
      this.disposers.push(() => target.removeEventListener(type, handler, options))
    }
    listen(this.scroller, 'scroll', () => this.render(), { passive: true })
    listen(this.scroller, 'keydown', event => this.onKeyDown(event))
    listen(this.scroller, 'focus', () => {
      if (this.active === -1 && this.model.rows.length > 0)
        this.setActive(0, false)
    })
    listen(this.rowsEl, 'mousedown', (event) => {
      // A click on a row must not start a text selection or move focus off the tree.
      if ((event.target as HTMLElement).closest('[data-jt-action]'))
        event.preventDefault()
    })
    listen(this.rowsEl, 'click', event => this.onClick(event))
    listen(this.rowsEl, 'dblclick', event => this.onDoubleClick(event))
    listen(this.rowsEl, 'contextmenu', event => this.onContextMenu(event))

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.render())
      this.observer.observe(this.scroller)
    }

    this.render()
    root.setAttribute('data-jt-ready', '')
  }

  /** Show another value. The cursor and what was expanded are forgotten. */
  setValue(value: TreeNode | TreeNode[] | null | undefined): void {
    this.model.setValue(value)
    this.active = -1
    this.activeId = ''
    this.scroller.scrollTop = 0
    this.render()
  }

  setDepth(depth: number): void {
    this.model.setDepth(depth)
    this.afterChange()
  }

  setOpenable(openable: JsonTreeOptions['openable']): void {
    this.openable = openable ?? null
    this.model.version++
    this.render()
  }

  setContextMenu(on: boolean): void {
    this.contextMenu = on
  }

  expandAll(id?: string): void {
    this.model.expandAll(id)
    this.afterChange()
  }

  collapseAll(): void {
    this.model.collapseAll()
    this.afterChange()
  }

  expand(id: string): boolean {
    const changed = this.model.expand(id)
    if (changed)
      this.afterChange()
    return changed
  }

  collapse(id: string): boolean {
    const changed = this.model.collapse(id)
    if (changed)
      this.afterChange()
    return changed
  }

  /** Expand whatever hides a row, move the cursor to it and bring it on screen. */
  reveal(id: string): boolean {
    const index = this.model.reveal(id)
    if (index === -1) {
      this.afterChange()
      return false
    }
    this.active = index
    this.activeId = id
    this.scrollToRow(index)
    this.render()
    this.emitSelect()
    return true
  }

  appendChildren(id: string, nodes: TreeNode[], more = 0): boolean {
    const done = this.model.appendChildren(id, nodes, more)
    if (done)
      this.afterChange()
    return done
  }

  /** The row the cursor is on, or null. */
  getSelected(): TreeSelectDetail | null {
    return this.active === -1 ? null : this.detail(this.active)
  }

  /** Move the cursor to a visible row by id. */
  select(id: string): boolean {
    const index = this.model.indexOf(id)
    if (index === -1)
      return false
    this.setActive(index, true)
    return true
  }

  focus(): void {
    this.scroller.focus()
  }

  /** How many row elements exist. A handful more than fit on screen, whatever the tree holds. */
  get drawn(): number {
    return this.pool.filter(row => row.style.display !== 'none').length
  }

  destroy(): void {
    this.observer?.disconnect()
    for (const dispose of this.disposers) dispose()
    this.rowsEl.textContent = ''
    this.pool = []
    this.root.removeAttribute('data-jt-ready')
  }

  /** The rows changed under the cursor: find it again by id, then redraw. */
  private afterChange(): void {
    if (this.activeId) {
      const index = this.model.indexOf(this.activeId)
      this.active = index
      if (index === -1)
        this.activeId = ''
    }
    this.render()
  }

  private detail(index: number): TreeSelectDetail {
    const row = this.model.rows[index]
    const path = this.model.pathOf(index)
    return { id: row.id, node: row.node, path, pathText: formatPath(path) }
  }

  private emitSelect(): void {
    if (this.active !== -1)
      this.callbacks.onSelect?.(this.detail(this.active))
  }

  private setActive(index: number, scroll: boolean): void {
    if (index < 0 || index >= this.model.rows.length)
      return
    const moved = index !== this.active
    this.active = index
    this.activeId = this.model.rows[index].id
    if (scroll)
      this.scrollToRow(index)
    this.render()
    if (moved)
      this.emitSelect()
  }

  private scrollToRow(index: number): void {
    const top = index * this.rowHeight
    const height = this.scroller.clientHeight
    if (top < this.scroller.scrollTop)
      this.scroller.scrollTop = top
    else if (top + this.rowHeight > this.scroller.scrollTop + height)
      this.scroller.scrollTop = top + this.rowHeight - height
  }

  private pageSize(): number {
    return Math.max(1, Math.floor(this.scroller.clientHeight / this.rowHeight) - 1)
  }

  private createRow(): RowElement {
    const row = document.createElement('div') as RowElement
    row.setAttribute('role', 'treeitem')
    row.className = 'stx-jt-row'

    const span = (className: string, hidden: boolean): HTMLElement => {
      const element = document.createElement('span')
      element.className = className
      if (hidden)
        element.setAttribute('aria-hidden', 'true')
      row.appendChild(element)
      return element
    }
    const parts: RowParts = {
      twisty: span('stx-jt-twisty', true),
      label: span('stx-jt-label', false),
      separator: span('stx-jt-separator', true),
      preview: span('stx-jt-preview', false),
      actions: span('stx-jt-actions', false),
    }
    parts.separator.textContent = ': '
    this.parts.set(row, parts)
    this.rowsEl.appendChild(row)
    return row
  }

  private button(action: string, text: string, label: string, as?: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    // Reached with the keyboard through the tree's own keys, not by tabbing
    // through every row.
    button.tabIndex = -1
    button.className = 'stx-jt-action'
    button.setAttribute('data-jt-action', action)
    if (as)
      button.setAttribute('data-jt-as', as)
    button.setAttribute('aria-label', label)
    button.textContent = text
    return button
  }

  private opensOf(row: TreeRow, index: number): TreeOpenKind[] {
    if (row.isMore)
      return []
    if (this.openable) {
      const answer = this.openable(row.node, this.model.pathOf(index))
      if (answer !== undefined)
        return listOf(answer)
    }
    return listOf(row.node.openable)
  }

  /** Draw the rows on screen. Rows already showing the right thing are left alone. */
  private render(): void {
    const rows = this.model.rows
    const count = rows.length
    const height = this.scroller.clientHeight
    this.content.style.height = `${count * this.rowHeight}px`
    // A tree that just got shorter still reports the old scroll position until
    // the browser lays out again, and rows drawn from it would be off the end.
    const top = Math.max(0, Math.min(this.scroller.scrollTop, count * this.rowHeight - height))

    const first = Math.max(0, Math.floor(top / this.rowHeight) - this.overscan)
    const last = Math.min(count, Math.ceil((top + height) / this.rowHeight) + this.overscan)
    const needed = Math.max(0, last - first)

    // A row index always lands on the same pooled element, so scrolling by one
    // row rewrites one element and leaves the rest where they are.
    while (this.pool.length < needed)
      this.pool.push(this.createRow())
    const size = this.pool.length
    const used = new Uint8Array(size)

    for (let index = first; index < last; index++) {
      const slot = index % size
      used[slot] = 1
      this.paint(this.pool[slot], rows[index], index)
    }
    for (let slot = 0; slot < size; slot++) {
      if (!used[slot] && this.pool[slot].style.display !== 'none') {
        this.pool[slot].style.display = 'none'
        this.pool[slot].__jt = undefined
        this.pool[slot].removeAttribute('id')
      }
    }

    const activeDrawn = this.active >= first && this.active < last
    if (activeDrawn)
      this.scroller.setAttribute('aria-activedescendant', this.prefix + this.active)
    else
      this.scroller.removeAttribute('aria-activedescendant')
  }

  private paint(element: RowElement, row: TreeRow, index: number): void {
    const version = this.model.version
    const selected = index === this.active
    const drawn = element.__jt

    if (!drawn || drawn.index !== index || drawn.version !== version) {
      const parts = this.parts.get(element) as RowParts
      const node = row.node
      element.style.display = ''
      element.style.transform = `translateY(${index * this.rowHeight}px)`
      element.style.setProperty('--stx-tree-depth', String(row.depth))
      element.id = this.prefix + index
      element.setAttribute('data-jt-index', String(index))
      element.setAttribute('aria-level', String(row.depth + 1))
      element.setAttribute('aria-posinset', String(row.posInSet))
      element.setAttribute('aria-setsize', String(row.setSize))
      if (row.expandable)
        element.setAttribute('aria-expanded', row.expanded ? 'true' : 'false')
      else
        element.removeAttribute('aria-expanded')

      if (row.isMore) {
        element.setAttribute('data-kind', 'more')
        parts.twisty.textContent = ''
        parts.label.textContent = ''
        parts.separator.style.display = 'none'
        parts.preview.textContent = `… ${node.more} more`
        parts.preview.setAttribute('data-kind', 'more')
      }
      else {
        element.setAttribute('data-kind', node.kind)
        parts.twisty.textContent = row.expandable ? (row.expanded ? '▾' : '▸') : ''
        // An item of a list that was not given a label is called by its position.
        const label = node.label ?? (typeof row.key === 'number' && row.parent !== -1 ? String(row.key) : '')
        parts.label.textContent = clip(label)
        parts.separator.style.display = label === '' ? 'none' : ''
        parts.preview.textContent = clip(previewOf(node))
        parts.preview.setAttribute('data-kind', node.kind)
      }

      const opens = this.opensOf(row, index)
      const signature = row.isMore ? '+' : opens.join('|')
      if (!drawn || drawn.opens !== signature) {
        parts.actions.textContent = ''
        if (row.isMore) {
          parts.actions.appendChild(this.button('more', 'Load', 'Load more'))
        }
        else {
          for (const kind of opens)
            parts.actions.appendChild(this.button('open', OPEN_LABELS[kind] ?? kind, `Open as ${OPEN_LABELS[kind]?.toLowerCase() ?? kind}`, kind))
          parts.actions.appendChild(this.button('copy-value', 'Copy', 'Copy value'))
          parts.actions.appendChild(this.button('copy-path', 'Path', 'Copy path'))
        }
      }
      element.__jt = { index, version, opens: signature }
    }

    if (selected) {
      element.setAttribute('aria-selected', 'true')
      element.setAttribute('data-active', '')
    }
    else {
      element.setAttribute('aria-selected', 'false')
      element.removeAttribute('data-active')
    }
  }

  private rowIndexOf(target: EventTarget | null): number {
    const element = target instanceof Element ? target.closest('[data-jt-index]') : null
    if (!element || (element as HTMLElement).style.display === 'none')
      return -1
    return Number(element.getAttribute('data-jt-index'))
  }

  private say(text: string): void {
    if (this.status)
      this.status.textContent = text
  }

  private toggleRow(index: number): void {
    const row = this.model.rows[index]
    if (!row)
      return
    if (row.isMore) {
      this.loadMore(index)
      return
    }
    if (row.node.ref !== undefined) {
      this.follow(index)
      return
    }
    if (!row.expandable)
      return
    const id = row.id
    this.model.toggle(id)
    this.afterChange()
    const at = this.model.indexOf(id)
    if (at !== -1)
      this.callbacks.onToggle?.({ ...this.detail(at), expanded: this.model.rows[at].expanded })
  }

  /** Go to the node a cycle points back to. */
  private follow(index: number): void {
    const target = this.model.rows[index].node.ref
    if (target === undefined)
      return
    if (!this.reveal(target))
      this.say('The value this points back to is not part of what was sent.')
  }

  private loadMore(index: number): void {
    const row = this.model.rows[index]
    const parent = row.parent
    if (parent === -1)
      return
    this.callbacks.onLoadMore?.(this.detail(parent))
  }

  private copy(index: number, what: 'value' | 'path'): void {
    const row = this.model.rows[index]
    if (!row)
      return
    const at = row.isMore ? row.parent : index
    const path = this.model.pathOf(at)
    const node = this.model.rows[at].node
    const text = what === 'path' ? formatPath(path) : nodeToJson(node)
    try {
      // Refused without a user gesture or off a secure origin; the event still
      // carries the text, so a host can put it on the clipboard its own way.
      const written = navigator.clipboard?.writeText(text)
      written?.catch(() => {})
    }
    catch {}
    this.say(what === 'path' ? `Copied path ${text}` : 'Copied value')
    this.callbacks.onCopy?.({ what, text, path, node })
  }

  private open(index: number, as?: TreeOpenKind): void {
    const row = this.model.rows[index]
    if (!row || row.isMore)
      return
    const kind = as ?? this.opensOf(row, index)[0]
    if (kind === undefined)
      return
    this.callbacks.onOpen?.({ ...this.detail(index), as: kind })
  }

  private onClick(event: MouseEvent): void {
    const index = this.rowIndexOf(event.target)
    if (index === -1)
      return
    const action = event.target instanceof Element ? event.target.closest('[data-jt-action]') : null
    this.setActive(index, false)

    if (action) {
      const name = action.getAttribute('data-jt-action')
      if (name === 'copy-value')
        this.copy(index, 'value')
      else if (name === 'copy-path')
        this.copy(index, 'path')
      else if (name === 'open')
        this.open(index, action.getAttribute('data-jt-as') ?? undefined)
      else if (name === 'more')
        this.loadMore(index)
      return
    }

    const row = this.model.rows[index]
    // The twisty toggles. So does anywhere on a row that has nothing else to do
    // with a click, which is every row: there is no inline editing here.
    if (row.expandable || row.isMore || row.node.ref !== undefined)
      this.toggleRow(index)
  }

  private onDoubleClick(event: MouseEvent): void {
    const index = this.rowIndexOf(event.target)
    if (index === -1 || (event.target instanceof Element && event.target.closest('[data-jt-action]')))
      return
    const row = this.model.rows[index]
    if (!row.expandable && !row.isMore && row.node.ref === undefined)
      this.open(index)
  }

  private onContextMenu(event: MouseEvent): void {
    const index = this.rowIndexOf(event.target)
    if (index === -1)
      return
    this.setActive(index, false)
    if (this.contextMenu)
      event.preventDefault()
    this.callbacks.onContext?.({ ...this.detail(index), x: event.clientX, y: event.clientY })
  }

  private onKeyDown(event: KeyboardEvent): void {
    const rows = this.model.rows
    if (rows.length === 0)
      return
    const mod = event.metaKey || event.ctrlKey
    const key = event.key

    if (mod && (key === 'c' || key === 'C')) {
      if (this.active === -1)
        return
      event.preventDefault()
      this.copy(this.active, event.shiftKey ? 'path' : 'value')
      return
    }
    if (mod || event.altKey)
      return

    if (key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      if (this.active !== -1)
        this.open(this.active)
      return
    }
    // A space in the middle of typing a label is part of the label.
    const typing = this.typed !== '' && Date.now() - this.typedAt <= TYPEAHEAD_RESET
    if (key === 'Enter' || (key === ' ' && !typing)) {
      event.preventDefault()
      if (this.active !== -1)
        this.toggleRow(this.active)
      return
    }

    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End' || key === 'PageDown' || key === 'PageUp' || key === '*') {
      event.preventDefault()
      this.typed = ''
      const before = this.active === -1 ? null : rows[this.active]
      const wasExpanded = before?.expanded
      const move = this.model.move(this.active, key, this.pageSize())
      if (move.changed) {
        this.active = move.index
        this.activeId = this.model.rows[move.index]?.id ?? ''
        this.scrollToRow(move.index)
        this.render()
        if (before && key !== '*') {
          const at = this.model.indexOf(before.id)
          if (at !== -1 && this.model.rows[at].expanded !== wasExpanded)
            this.callbacks.onToggle?.({ ...this.detail(at), expanded: this.model.rows[at].expanded })
        }
      }
      else {
        this.setActive(move.index, true)
      }
      return
    }

    if (key.length === 1) {
      const now = Date.now()
      if (!typing)
        this.typed = ''
      this.typedAt = now
      this.typed += key
      const found = this.model.typeahead(this.active, this.typed)
      if (found !== -1) {
        event.preventDefault()
        this.setActive(found, true)
      }
    }
  }
}
