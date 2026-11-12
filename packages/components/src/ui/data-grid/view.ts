/**
 * A data grid in the DOM.
 *
 * One scroll container holds everything: a header that sticks to its top, and
 * a body as tall as every row put together. Only the rows and columns that
 * cross the viewport are elements. A row that scrolls out is handed to the
 * row that scrolls in, so scrolling makes no elements and drops none, and a
 * hundred thousand rows cost what forty do.
 *
 * Focus stays on the container. The active cell is named with
 * `aria-activedescendant`, because the cell a screen reader is on has to keep
 * existing while the elements under it are recycled.
 */
import type { GridCell, GridColumn, GridRange, GridSort, ResolvedColumn } from './core'
import { cellJson, cellKind, cellValue, formatCell, GridModel, moveCell, rowJson, rowRange } from './core'

export interface DataGridOptions<Row = any> {
  rows?: readonly Row[]
  columns?: readonly GridColumn<Row>[] | null
  /** Pixels. Default 28. */
  rowHeight?: number
  /** Pixels. Default 32. */
  headerHeight?: number
  /** Rows drawn past each edge of the viewport. Default 6. */
  overscan?: number
  /** Columns drawn past each edge. Default 2. */
  columnOverscan?: number
  selectable?: boolean
  /** The filter to start with. */
  filter?: string
  /** The name of a downloaded file, without its extension. */
  fileName?: string
  /** Suppress the browser's own menu on a right click, for a host that shows one. */
  contextMenu?: boolean
  /** Pixels Alt+arrow resizes a column by. Default 16. */
  resizeStep?: number
}

export interface GridCellDetail<Row = any> {
  row: Row | undefined
  /** The row's place in the view. -1 on the header. */
  rowIndex: number
  column: ResolvedColumn<Row> | undefined
  value: unknown
}

export interface DataGridCallbacks<Row = any> {
  onSort?: (sort: GridSort[]) => void
  onFilter?: (detail: { text: string, count: number }) => void
  onSelect?: (detail: { rows: Row[], indices: number[] }) => void
  onCell?: (detail: GridCellDetail<Row>) => void
  onActivate?: (detail: { row: Row, rowIndex: number }) => void
  onCopy?: (detail: { what: 'cell' | 'row', text: string }) => void
  onExport?: (detail: { format: 'csv' | 'json', text: string, rows: number }) => void
  onContext?: (detail: GridCellDetail<Row> & { x: number, y: number }) => void
}

interface RowSlot {
  el: HTMLElement
  /** The view index it is showing, or -1 while it waits in the pool. */
  index: number
  cells: HTMLElement[]
}

type Inert = HTMLElement & { __stx_inert_content?: boolean }
type CellElement = HTMLElement & { __dgColumn?: number }
type RowElement = HTMLElement & { __dgRow?: number }

const FILTER_DELAY = 120
const numberFormat = new Intl.NumberFormat('en-US')

function part(root: HTMLElement, name: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-dg="${name}"]`)
}

/** Put text on the clipboard, by the old route where the new one is refused. */
function writeClipboard(text: string): void {
  const fallback = (): void => {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('aria-hidden', 'true')
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(field)
    const active = document.activeElement as HTMLElement | null
    field.select()
    try {
      document.execCommand('copy')
    }
    catch {}
    field.remove()
    active?.focus({ preventScroll: true })
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function')
    navigator.clipboard.writeText(text).catch(fallback)
  else
    fallback()
}

export class DataGridView<Row = any> {
  readonly model: GridModel<Row>

  private readonly scroller: HTMLElement
  private readonly content: HTMLElement
  private readonly header: HTMLElement
  private readonly body: HTMLElement
  private readonly status: HTMLElement | null
  private readonly filterInput: HTMLInputElement | null
  private readonly prefix: string

  private readonly rowHeight: number
  private readonly headerHeight: number
  private readonly overscan: number
  private readonly columnOverscan: number
  private readonly selectable: boolean
  private readonly resizeStep: number
  private fileName: string
  private readonly contextMenu: boolean

  private readonly slots: Map<number, RowSlot> = new Map()
  private readonly pool: RowSlot[] = []
  private headerCells: HTMLElement[] = []
  private rows: GridRange = { start: 0, end: 0 }
  private cols: GridRange = { start: 0, end: 0 }
  /** Bumped whenever what a drawn cell shows may have changed. */
  private stale = true
  private active: GridCell = { row: 0, column: 0 }
  private activeEl: HTMLElement | null = null
  private filterTimer: ReturnType<typeof setTimeout> | null = null
  private resize: { column: number, start: number, width: number, pointer: number, handle: HTMLElement } | null = null
  private observer: ResizeObserver | null = null
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: DataGridOptions<Row> = {}, private readonly callbacks: DataGridCallbacks<Row> = {}) {
    const scroller = part(root, 'scroller')
    const content = part(root, 'content')
    const header = part(root, 'header')
    const body = part(root, 'body')
    if (!scroller || !content || !header || !body)
      throw new Error('DataGridView: the root is missing its scroller, content, header or body')

    this.scroller = scroller
    this.content = content
    this.header = header
    this.body = body
    this.status = part(root, 'status')
    this.filterInput = part(root, 'filter') as HTMLInputElement | null
    this.prefix = scroller.id || `data-grid-${Math.random().toString(36).slice(2, 8)}`

    this.rowHeight = Math.max(8, options.rowHeight ?? 28)
    this.headerHeight = Math.max(8, options.headerHeight ?? 32)
    this.overscan = options.overscan ?? 6
    this.columnOverscan = options.columnOverscan ?? 2
    this.selectable = options.selectable !== false
    this.resizeStep = options.resizeStep ?? 16
    this.fileName = options.fileName || 'data'
    this.contextMenu = Boolean(options.contextMenu)

    // What the cells hold is data. A value with braces in it is text, and the
    // stx runtime must never read it as an expression.
    ;(this.header as Inert).__stx_inert_content = true
    ;(this.body as Inert).__stx_inert_content = true

    root.style.setProperty('--stx-grid-row-height', `${this.rowHeight}px`)
    root.style.setProperty('--stx-grid-header-height', `${this.headerHeight}px`)

    this.model = new GridModel<Row>(options.rows ?? [], options.columns ?? null)
    if (options.filter) {
      this.model.setFilter(options.filter)
      if (this.filterInput)
        this.filterInput.value = options.filter
    }

    this.listen(this.scroller, 'scroll', () => this.render())
    this.listen(this.scroller, 'keydown', event => this.onKeyDown(event as KeyboardEvent))
    this.listen(this.body, 'click', event => this.onBodyClick(event as MouseEvent))
    this.listen(this.body, 'dblclick', event => this.onBodyDoubleClick(event as MouseEvent))
    this.listen(this.body, 'contextmenu', event => this.onContextMenu(event as MouseEvent))
    this.listen(this.header, 'click', event => this.onHeaderClick(event as MouseEvent))
    this.listen(this.header, 'dblclick', event => this.onHeaderDoubleClick(event as MouseEvent))
    this.listen(this.header, 'pointerdown', event => this.onResizeStart(event as PointerEvent))
    this.listen(this.header, 'pointermove', event => this.onResizeMove(event as PointerEvent))
    this.listen(this.header, 'pointerup', event => this.onResizeEnd(event as PointerEvent))
    this.listen(this.header, 'pointercancel', event => this.onResizeEnd(event as PointerEvent))
    if (this.filterInput)
      this.listen(this.filterInput, 'input', () => this.onFilterInput())
    const csv = part(root, 'export-csv')
    const json = part(root, 'export-json')
    if (csv)
      this.listen(csv, 'click', () => this.download('csv'))
    if (json)
      this.listen(json, 'click', () => this.download('json'))

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.render())
      this.observer.observe(this.scroller)
    }

    this.refresh()
    root.setAttribute('data-dg-ready', '')
  }

  // The data

  setRows(rows: readonly Row[] | null | undefined): void {
    this.model.setRows(rows)
    this.active = { row: Math.min(0, this.model.count - 1), column: Math.min(this.active.column, Math.max(0, this.model.columns.length - 1)) }
    this.scroller.scrollTop = 0
    this.refresh()
  }

  setColumns(columns: readonly GridColumn<Row>[] | null | undefined): void {
    this.model.setColumns(columns)
    this.active = { row: this.active.row, column: Math.min(this.active.column, Math.max(0, this.model.columns.length - 1)) }
    this.refresh()
  }

  setFilter(text: string | null | undefined): void {
    const next = text == null ? '' : String(text)
    if (this.filterInput && this.filterInput.value !== next)
      this.filterInput.value = next
    this.applyFilter(next)
  }

  setSort(sort: readonly GridSort[] | null | undefined): void {
    this.model.setSort(sort)
    this.refresh()
  }

  setFileName(name: string): void {
    this.fileName = name || 'data'
  }

  /** The rows on show, in order. */
  getView(): Row[] {
    return this.model.viewRows()
  }

  getSelection(): { rows: Row[], indices: number[] } {
    const indices = this.model.selectedIndices()
    return { rows: indices.map(index => this.model.rows[index]), indices }
  }

  clearSelection(): void {
    this.model.clearSelection()
    this.paintSelection()
    this.reportSelection()
  }

  exportCsv(): string {
    return this.model.toCsv()
  }

  exportJson(): string {
    return this.model.toJson()
  }

  /** Save the rows on show as a file. Returns its text. */
  download(format: 'csv' | 'json'): string {
    const text = format === 'json' ? this.model.toJson() : this.model.toCsv()
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.fileName}.${format}`
    link.style.display = 'none'
    this.root.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    this.callbacks.onExport?.({ format, text, rows: this.model.count })
    return text
  }

  scrollToRow(viewIndex: number): void {
    const index = Math.max(0, Math.min(this.model.count - 1, viewIndex))
    this.revealRow(index)
    this.render()
  }

  focus(): void {
    this.scroller.focus({ preventScroll: true })
  }

  /** The cell the keyboard is on. Row -1 is the header. */
  getActiveCell(): GridCell {
    return { ...this.active }
  }

  setActiveCell(row: number, column: number): void {
    this.moveTo({ row, column }, false)
  }

  destroy(): void {
    this.observer?.disconnect()
    if (this.filterTimer)
      clearTimeout(this.filterTimer)
    for (const dispose of this.disposers) dispose()
    this.header.replaceChildren()
    this.body.replaceChildren()
    this.slots.clear()
    this.pool.length = 0
    this.root.removeAttribute('data-dg-ready')
  }

  // Drawing

  /** Everything may have changed: size the content and draw it all again. */
  refresh(): void {
    const model = this.model
    this.content.style.width = `${model.totalWidth}px`
    this.content.style.height = `${this.headerHeight + model.count * this.rowHeight}px`
    this.header.style.width = `${model.totalWidth}px`
    this.body.style.height = `${model.count * this.rowHeight}px`
    this.scroller.setAttribute('aria-rowcount', String(model.count + 1))
    this.scroller.setAttribute('aria-colcount', String(model.columns.length))
    this.root.toggleAttribute('data-empty', model.count === 0)
    this.stale = true
    this.render()
    this.paintStatus()
  }

  /**
   * Draw what the viewport shows now. Called on every scroll, so it does only
   * what moved: rows that came in are filled, rows that left are pooled, and
   * the cells of a row that stayed are untouched unless the columns shifted.
   */
  render(): void {
    const model = this.model
    const scroller = this.scroller
    const rows = rowRange(scroller.scrollTop, Math.max(0, scroller.clientHeight - this.headerHeight), this.rowHeight, model.count, this.overscan)
    const cols = model.columnRange(scroller.scrollLeft, scroller.clientWidth, this.columnOverscan)
    const columnsMoved = this.stale || cols.start !== this.cols.start || cols.end !== this.cols.end

    if (!columnsMoved && rows.start === this.rows.start && rows.end === this.rows.end)
      return

    this.rows = rows
    this.cols = cols

    if (columnsMoved)
      this.renderHeader()

    for (const [index, slot] of this.slots) {
      if (index < rows.start || index >= rows.end) {
        this.slots.delete(index)
        slot.index = -1
        slot.el.style.display = 'none'
        this.pool.push(slot)
      }
    }

    for (let index = rows.start; index < rows.end; index++) {
      let slot = this.slots.get(index)
      if (slot) {
        if (columnsMoved)
          this.fill(slot)
        continue
      }
      slot = this.pool.pop() ?? this.createSlot()
      slot.index = index
      slot.el.style.display = ''
      this.slots.set(index, slot)
      this.fill(slot)
    }

    this.stale = false
    this.paintActive()
  }

  private createSlot(): RowSlot {
    const el = document.createElement('div')
    el.className = 'stx-dg-row'
    el.setAttribute('role', 'row')
    this.body.appendChild(el)
    return { el, index: -1, cells: [] }
  }

  private fill(slot: RowSlot): void {
    const model = this.model
    const index = slot.index
    const row = model.rowAt(index)
    const selected = this.selectable && model.isSelected(index)
    const el = slot.el as RowElement

    el.__dgRow = index
    el.style.transform = `translateY(${index * this.rowHeight}px)`
    el.setAttribute('aria-rowindex', String(index + 2))
    if (this.selectable)
      el.setAttribute('aria-selected', selected ? 'true' : 'false')

    const wanted = this.cols.end - this.cols.start
    while (slot.cells.length < wanted) {
      const cell = document.createElement('div')
      cell.className = 'stx-dg-cell'
      cell.setAttribute('role', 'gridcell')
      cell.appendChild(document.createTextNode(''))
      el.appendChild(cell)
      slot.cells.push(cell)
    }
    while (slot.cells.length > wanted)
      slot.cells.pop()!.remove()

    for (let position = 0; position < wanted; position++) {
      const columnIndex = this.cols.start + position
      const column = model.columns[columnIndex]
      const cell = slot.cells[position] as CellElement
      const value = row === undefined ? undefined : cellValue(row, column)
      const kind = cellKind(value)

      cell.__dgColumn = columnIndex
      cell.id = `${this.prefix}-r${index}-c${columnIndex}`
      cell.style.left = `${model.offsetOf(columnIndex)}px`
      cell.style.width = `${column.width}px`
      cell.setAttribute('aria-colindex', String(columnIndex + 1))
      cell.setAttribute('data-type', column.type)
      cell.setAttribute('data-align', column.align)
      if (kind === 'value')
        cell.removeAttribute('data-empty')
      else
        cell.setAttribute('data-empty', kind)
      if (this.selectable)
        cell.setAttribute('aria-selected', selected ? 'true' : 'false')
      // The text node is the cell's own and is kept: only its value changes.
      ;(cell.firstChild as Text).data = typeof value === 'string' ? value : formatCell(value, column.type)
    }
  }

  private renderHeader(): void {
    const model = this.model
    const wanted = this.cols.end - this.cols.start

    while (this.headerCells.length < wanted) {
      const cell = document.createElement('div')
      cell.className = 'stx-dg-head'
      cell.setAttribute('role', 'columnheader')
      const label = document.createElement('span')
      label.className = 'stx-dg-head-label'
      label.appendChild(document.createTextNode(''))
      const mark = document.createElement('span')
      mark.className = 'stx-dg-sort'
      mark.setAttribute('aria-hidden', 'true')
      mark.appendChild(document.createTextNode(''))
      const handle = document.createElement('span')
      handle.className = 'stx-dg-resize'
      handle.setAttribute('aria-hidden', 'true')
      cell.append(label, mark, handle)
      this.header.appendChild(cell)
      this.headerCells.push(cell)
    }
    while (this.headerCells.length > wanted)
      this.headerCells.pop()!.remove()

    for (let position = 0; position < wanted; position++) {
      const columnIndex = this.cols.start + position
      const column = model.columns[columnIndex]
      const cell = this.headerCells[position] as CellElement
      const sorted = model.sortOf(column.key)

      cell.__dgColumn = columnIndex
      cell.id = `${this.prefix}-h-c${columnIndex}`
      cell.style.left = `${model.offsetOf(columnIndex)}px`
      cell.style.width = `${column.width}px`
      cell.setAttribute('aria-colindex', String(columnIndex + 1))
      cell.setAttribute('data-align', column.align)
      cell.toggleAttribute('data-sortable', column.sortable)
      if (column.sortable)
        cell.setAttribute('aria-sort', sorted ? (sorted.direction === 'asc' ? 'ascending' : 'descending') : 'none')
      else
        cell.removeAttribute('aria-sort')
      ;(cell.children[0].firstChild as Text).data = column.label
      // An arrow, and the column's place when several are sorted by.
      ;(cell.children[1].firstChild as Text).data = sorted
        ? `${sorted.direction === 'asc' ? '▲' : '▼'}${model.sort.length > 1 ? sorted.priority : ''}`
        : ''
    }
  }

  private cellElement(cell: GridCell): HTMLElement | null {
    if (cell.column < this.cols.start || cell.column >= this.cols.end)
      return null
    const position = cell.column - this.cols.start
    if (cell.row < 0)
      return this.headerCells[position] ?? null
    return this.slots.get(cell.row)?.cells[position] ?? null
  }

  /** Mark the active cell, and tell assistive technology which one it is. */
  private paintActive(): void {
    const next = this.cellElement(this.active)
    if (this.activeEl && this.activeEl !== next)
      this.activeEl.removeAttribute('data-active')
    this.activeEl = next
    if (next) {
      next.setAttribute('data-active', '')
      this.scroller.setAttribute('aria-activedescendant', next.id)
    }
    else {
      this.scroller.removeAttribute('aria-activedescendant')
    }
  }

  private paintSelection(): void {
    if (!this.selectable)
      return
    for (const [index, slot] of this.slots) {
      const value = this.model.isSelected(index) ? 'true' : 'false'
      slot.el.setAttribute('aria-selected', value)
      for (const cell of slot.cells)
        cell.setAttribute('aria-selected', value)
    }
    this.paintStatus()
  }

  private paintStatus(): void {
    if (!this.status)
      return
    const model = this.model
    const total = model.rows.length
    let text = model.count === total
      ? `${numberFormat.format(total)} ${total === 1 ? 'row' : 'rows'}`
      : `${numberFormat.format(model.count)} of ${numberFormat.format(total)} rows`
    if (model.selected.size > 0)
      text += `, ${numberFormat.format(model.selected.size)} selected`
    if (this.status.textContent !== text)
      this.status.textContent = text
  }

  // Moving about

  private revealRow(index: number): void {
    const scroller = this.scroller
    const top = index * this.rowHeight
    const room = scroller.clientHeight - this.headerHeight
    if (top < scroller.scrollTop)
      scroller.scrollTop = top
    else if (top + this.rowHeight > scroller.scrollTop + room)
      scroller.scrollTop = top + this.rowHeight - room
  }

  private revealColumn(index: number): void {
    const scroller = this.scroller
    const left = this.model.offsetOf(index)
    const right = this.model.offsetOf(index + 1)
    if (left < scroller.scrollLeft)
      scroller.scrollLeft = left
    else if (right > scroller.scrollLeft + scroller.clientWidth)
      scroller.scrollLeft = Math.min(left, right - scroller.clientWidth)
  }

  private detail(cell: GridCell): GridCellDetail<Row> {
    return {
      row: this.model.rowAt(cell.row),
      rowIndex: cell.row,
      column: this.model.columns[cell.column],
      value: cell.row < 0 ? undefined : this.model.valueAt(cell.row, cell.column),
    }
  }

  private moveTo(cell: GridCell, report = true): void {
    const model = this.model
    const next = {
      row: Math.max(-1, Math.min(model.count - 1, cell.row)),
      column: Math.max(0, Math.min(model.columns.length - 1, cell.column)),
    }
    this.active = next
    if (next.row >= 0)
      this.revealRow(next.row)
    this.revealColumn(next.column)
    this.render()
    this.paintActive()
    if (report)
      this.callbacks.onCell?.(this.detail(next))
  }

  private reportSelection(): void {
    this.callbacks.onSelect?.(this.getSelection())
  }

  private applyFilter(text: string): void {
    const count = this.model.setFilter(text)
    this.active = { row: Math.min(0, count - 1), column: this.active.column }
    this.scroller.scrollTop = 0
    this.refresh()
    this.callbacks.onFilter?.({ text, count })
  }

  private sortBy(columnIndex: number, additive: boolean): void {
    const column = this.model.columns[columnIndex]
    if (!column || !column.sortable)
      return
    const sort = this.model.toggleSort(column.key, additive)
    this.refresh()
    this.callbacks.onSort?.([...sort])
  }

  private setColumnWidth(columnIndex: number, width: number): void {
    this.model.resizeColumn(columnIndex, width)
    this.content.style.width = `${this.model.totalWidth}px`
    this.header.style.width = `${this.model.totalWidth}px`
    this.stale = true
    this.render()
  }

  private copy(what: 'cell' | 'row'): void {
    if (this.active.row < 0)
      return
    const row = this.model.rowAt(this.active.row)
    if (row === undefined)
      return
    const text = what === 'row' ? rowJson(row, this.model.columns) : cellJson(this.model.valueAt(this.active.row, this.active.column))
    writeClipboard(text)
    this.callbacks.onCopy?.({ what, text })
  }

  // Events

  private listen(target: HTMLElement, type: string, handler: (event: Event) => void): void {
    target.addEventListener(type, handler)
    this.disposers.push(() => target.removeEventListener(type, handler))
  }

  private cellFrom(event: Event): GridCell | null {
    const target = event.target as HTMLElement | null
    const cell = target?.closest<HTMLElement>('.stx-dg-cell') as CellElement | null
    const row = cell?.parentElement as RowElement | null
    if (!cell || !row || cell.__dgColumn === undefined || row.__dgRow === undefined)
      return null
    return { row: row.__dgRow, column: cell.__dgColumn }
  }

  private headFrom(event: Event): { column: number, onHandle: boolean, handle: HTMLElement | null } | null {
    const target = event.target as HTMLElement | null
    const head = target?.closest<HTMLElement>('.stx-dg-head') as CellElement | null
    if (!head || head.__dgColumn === undefined)
      return null
    const handle = target!.closest<HTMLElement>('.stx-dg-resize')
    return { column: head.__dgColumn, onHandle: Boolean(handle), handle }
  }

  private onBodyClick(event: MouseEvent): void {
    const cell = this.cellFrom(event)
    if (!cell)
      return
    if (this.selectable) {
      this.model.select(cell.row, event.shiftKey ? 'range' : (event.metaKey || event.ctrlKey ? 'toggle' : 'replace'))
      this.paintSelection()
      this.reportSelection()
    }
    this.moveTo(cell)
  }

  private onBodyDoubleClick(event: MouseEvent): void {
    const cell = this.cellFrom(event)
    const row = cell ? this.model.rowAt(cell.row) : undefined
    if (cell && row !== undefined)
      this.callbacks.onActivate?.({ row, rowIndex: cell.row })
  }

  private onContextMenu(event: MouseEvent): void {
    const cell = this.cellFrom(event)
    if (!cell)
      return
    if (this.contextMenu)
      event.preventDefault()
    this.moveTo(cell, false)
    this.callbacks.onContext?.({ ...this.detail(cell), x: event.clientX, y: event.clientY })
  }

  private onHeaderClick(event: MouseEvent): void {
    const head = this.headFrom(event)
    if (!head || head.onHandle)
      return
    this.active = { row: -1, column: head.column }
    this.sortBy(head.column, event.shiftKey)
  }

  private onHeaderDoubleClick(event: MouseEvent): void {
    const head = this.headFrom(event)
    if (head && head.onHandle)
      this.setColumnWidth(head.column, this.model.autoWidth(head.column))
  }

  private onResizeStart(event: PointerEvent): void {
    const head = this.headFrom(event)
    if (!head || !head.onHandle || !head.handle || event.button !== 0)
      return
    event.preventDefault()
    try {
      head.handle.setPointerCapture(event.pointerId)
    }
    catch {}
    this.resize = { column: head.column, start: event.clientX, width: this.model.columns[head.column].width, pointer: event.pointerId, handle: head.handle }
    this.root.setAttribute('data-resizing', '')
  }

  private onResizeMove(event: PointerEvent): void {
    const resize = this.resize
    if (!resize || event.pointerId !== resize.pointer)
      return
    this.setColumnWidth(resize.column, resize.width + event.clientX - resize.start)
  }

  private onResizeEnd(event: PointerEvent): void {
    const resize = this.resize
    if (!resize || event.pointerId !== resize.pointer)
      return
    this.resize = null
    this.root.removeAttribute('data-resizing')
    try {
      resize.handle.releasePointerCapture(event.pointerId)
    }
    catch {}
  }

  private onFilterInput(): void {
    if (this.filterTimer)
      clearTimeout(this.filterTimer)
    // A hundred thousand rows are searched per keystroke otherwise, and only
    // the last of a burst of keys is a question anyone asked.
    this.filterTimer = setTimeout(() => {
      this.filterTimer = null
      this.applyFilter(this.filterInput ? this.filterInput.value : '')
    }, FILTER_DELAY)
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target !== this.scroller)
      return
    const model = this.model
    const mod = event.metaKey || event.ctrlKey
    const onHeader = this.active.row < 0
    const key = event.key

    if (mod && (key === 'a' || key === 'A')) {
      if (!this.selectable)
        return
      event.preventDefault()
      model.selectAll()
      this.paintSelection()
      this.reportSelection()
      return
    }

    if (mod && (key === 'c' || key === 'C')) {
      if (onHeader)
        return
      event.preventDefault()
      this.copy(event.shiftKey ? 'row' : 'cell')
      return
    }

    if (onHeader && event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      event.preventDefault()
      const column = model.columns[this.active.column]
      if (column)
        this.setColumnWidth(this.active.column, column.width + (key === 'ArrowRight' ? this.resizeStep : -this.resizeStep))
      this.paintActive()
      return
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (onHeader) {
        this.sortBy(this.active.column, event.shiftKey)
        return
      }
      if (key === ' ') {
        if (!this.selectable)
          return
        model.select(this.active.row, 'toggle')
        this.paintSelection()
        this.reportSelection()
        return
      }
      const row = model.rowAt(this.active.row)
      if (row !== undefined)
        this.callbacks.onActivate?.({ row, rowIndex: this.active.row })
      return
    }

    if (key === 'Escape' && this.selectable && model.selected.size > 0) {
      event.preventDefault()
      this.clearSelection()
      return
    }

    const page = Math.max(1, Math.floor((this.scroller.clientHeight - this.headerHeight) / this.rowHeight) - 1)
    const next = moveCell(this.active, key, { rows: model.count, columns: model.columns.length, page, mod })
    if (next === this.active)
      return

    event.preventDefault()
    if (next.row === this.active.row && next.column === this.active.column)
      return
    // Shift with a move down or up the rows carries the selection along.
    if (event.shiftKey && this.selectable && next.row >= 0 && next.row !== this.active.row) {
      if (model.selected.size === 0 && this.active.row >= 0)
        model.select(this.active.row, 'replace')
      model.select(next.row, 'range')
      this.paintSelection()
      this.reportSelection()
    }
    this.moveTo(next)
  }
}
