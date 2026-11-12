/**
 * The model of a data grid. No DOM.
 *
 * A grid is a list of rows somebody else owns, a list of columns, and a view:
 * the source indices of the rows that pass the filter, in sorted order. The
 * rows are never copied or reordered, so a hundred thousand of them cost one
 * `Uint32Array` to show, and selection (kept as source indices) survives a
 * sort or a filter.
 *
 * Everything that is slow to work out per row is worked out once and kept:
 * the text a filter searches, and a number per cell to sort by. A second
 * filter is then a plain `includes` over strings, and a second sort compares
 * numbers whatever the column holds.
 */

export type GridColumnType = 'string' | 'number' | 'date' | 'boolean' | 'json'
export type GridAlign = 'left' | 'right' | 'center'
export type SortDirection = 'asc' | 'desc'

export interface GridColumn<Row = any> {
  /** The property of a row this column shows, or the index for a row that is an array. */
  key: string
  label?: string
  /** Left out, it is worked out from the first rows. */
  type?: GridColumnType
  /** Pixels. Left out, the column fits its header and the first rows. */
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Left out, numbers go right and everything else left. */
  align?: GridAlign
  sortable?: boolean
  /** Reads the cell from a row when it is not simply `row[key]`. */
  accessor?: (row: Row) => unknown
}

export interface ResolvedColumn<Row = any> extends GridColumn<Row> {
  label: string
  type: GridColumnType
  width: number
  minWidth: number
  maxWidth: number
  align: GridAlign
  sortable: boolean
}

export interface GridSort {
  key: string
  direction: SortDirection
}

export interface GridCell {
  /** A view index, or -1 for the header row. */
  row: number
  column: number
}

export interface GridRange {
  /** The first index in the range. */
  start: number
  /** One past the last. */
  end: number
}

export interface GridModelOptions {
  /** The width of one character of cell text, in pixels, for fitting a column. */
  charWidth?: number
  /** Pixels of padding inside a cell, both sides together. */
  cellPadding?: number
}

export const DEFAULT_MIN_WIDTH = 48
export const DEFAULT_MAX_WIDTH = 2000
/** A column fitted to its content stops here, however long a value is. */
export const FIT_MAX_WIDTH = 420
/** JSON shown in a cell is cut here. The whole value is still what is copied. */
export const JSON_PREVIEW_LENGTH = 160

const NUMERIC = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/

/** JSON for anything, including the values JSON itself refuses. */
function stringify(value: unknown, indent?: number): string {
  const seen = new WeakSet<object>()
  const text = JSON.stringify(value, (_key, entry) => {
    if (typeof entry === 'bigint')
      return entry.toString()
    if (typeof entry === 'object' && entry !== null) {
      if (seen.has(entry))
        return '[Circular]'
      seen.add(entry)
    }
    return entry
  }, indent)
  return text === undefined ? 'null' : text
}

/** The cell a column shows for a row. */
export function cellValue<Row>(row: Row, column: GridColumn<Row>): unknown {
  if (column.accessor)
    return column.accessor(row)
  return row == null ? undefined : (row as Record<string, unknown>)[column.key]
}

/**
 * What kind of column a list of values makes.
 *
 * Nulls say nothing and are skipped. A column is a number column only when
 * every value is a number or reads as one: a single `n/a` among the figures
 * makes it text, because sorting it as numbers would have to put that
 * somewhere it does not belong.
 */
export function inferType(values: readonly unknown[]): GridColumnType {
  let seen = 0
  let numbers = 0
  let dates = 0
  let booleans = 0
  let objects = 0

  for (const value of values) {
    if (value === null || value === undefined || value === '')
      continue
    seen++
    if (typeof value === 'number' || typeof value === 'bigint')
      numbers++
    else if (typeof value === 'boolean')
      booleans++
    else if (value instanceof Date)
      dates++
    else if (typeof value === 'object')
      objects++
    else if (typeof value === 'string') {
      const text = value.trim()
      if (NUMERIC.test(text))
        numbers++
      else if (ISO_DATE.test(text) && !Number.isNaN(Date.parse(text)))
        dates++
    }
  }

  if (seen === 0)
    return 'string'
  if (numbers === seen)
    return 'number'
  if (dates === seen)
    return 'date'
  if (booleans === seen)
    return 'boolean'
  if (objects === seen)
    return 'json'
  return 'string'
}

/**
 * Columns for rows nobody described: every key of the first `sample` rows, in
 * the order first seen. Rows that are arrays get a column per position.
 */
export function inferColumns<Row>(rows: readonly Row[], sample = 200): GridColumn<Row>[] {
  const keys: string[] = []
  const known = new Set<string>()
  const limit = Math.min(rows.length, sample)

  for (let index = 0; index < limit; index++) {
    const row = rows[index]
    if (row === null || typeof row !== 'object')
      continue
    if (Array.isArray(row)) {
      for (let position = 0; position < row.length; position++) {
        const key = String(position)
        if (!known.has(key)) {
          known.add(key)
          keys.push(key)
        }
      }
      continue
    }
    for (const key in row) {
      if (!known.has(key)) {
        known.add(key)
        keys.push(key)
      }
    }
  }

  // Positions arrive in order from one array, but a longer array later on must
  // not put column 5 before column 3.
  if (keys.length > 0 && keys.every(key => /^\d+$/.test(key)))
    keys.sort((a, b) => Number(a) - Number(b))

  return keys.map(key => ({ key }))
}

/** Whether a cell is empty, and which kind of empty. */
export function cellKind(value: unknown): 'null' | 'undefined' | 'value' {
  if (value === null)
    return 'null'
  return value === undefined ? 'undefined' : 'value'
}

/**
 * The text of a cell.
 *
 * A number is shown as it is, digit for digit: a grid of results is for
 * reading values, and grouping or rounding would show something other than
 * what is there. Lining the digits up is the stylesheet's job.
 */
export function formatCell(value: unknown, type: GridColumnType = 'string'): string {
  if (value === null)
    return 'null'
  if (value === undefined)
    return 'undefined'
  if (typeof value === 'string')
    return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value)
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
  if (typeof value === 'object' || type === 'json') {
    const text = stringify(value)
    return text.length > JSON_PREVIEW_LENGTH ? `${text.slice(0, JSON_PREVIEW_LENGTH)}...` : text
  }
  return String(value)
}

/** A cell as JSON, the way it is copied. */
export function cellJson(value: unknown): string {
  return stringify(value)
}

/** A row as an object of its columns. */
export function projectRow<Row>(row: Row, columns: readonly GridColumn<Row>[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const column of columns) {
    const value = cellValue(row, column)
    out[column.key] = value === undefined ? null : value
  }
  return out
}

/** A row as JSON, the way it is copied: its columns, indented. */
export function rowJson<Row>(row: Row, columns: readonly GridColumn<Row>[]): string {
  return stringify(projectRow(row, columns), 2)
}

/** Rows as a JSON array of objects, one property per column. */
export function toJson<Row>(rows: readonly Row[], columns: readonly GridColumn<Row>[]): string {
  return stringify(rows.map(row => projectRow(row, columns)), 2)
}

function csvField(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  let text: string
  if (typeof value === 'string')
    text = value
  else if (value instanceof Date)
    text = Number.isNaN(value.getTime()) ? '' : value.toISOString()
  else if (typeof value === 'object')
    text = stringify(value)
  else
    text = String(value)

  // RFC 4180: a field with a quote, a comma or a line break is quoted, and a
  // quote inside it is doubled. Edge spaces are quoted too, or a reader that
  // trims fields would change the value.
  if (/[",\r\n]/.test(text) || text !== text.trim())
    return `"${text.replace(/"/g, '""')}"`
  return text
}

/** Rows as CSV: a header row, CRLF line ends, RFC 4180 quoting. */
export function toCsv<Row>(rows: readonly Row[], columns: readonly GridColumn<Row>[]): string {
  const lines: string[] = Array.from({ length: rows.length + 1 })
  lines[0] = columns.map(column => csvField(column.label ?? column.key)).join(',')

  const count = columns.length
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]
    let line = ''
    for (let position = 0; position < count; position++) {
      if (position > 0)
        line += ','
      line += csvField(cellValue(row, columns[position]))
    }
    lines[index + 1] = line
  }
  return `${lines.join('\r\n')}\r\n`
}

/** The rows (or columns) that intersect a viewport, widened by `overscan`. */
export function rowRange(scroll: number, viewport: number, rowHeight: number, count: number, overscan = 0): GridRange {
  if (count <= 0 || rowHeight <= 0)
    return { start: 0, end: 0 }
  const first = Math.floor(Math.max(0, scroll) / rowHeight)
  const last = Math.ceil((Math.max(0, scroll) + Math.max(0, viewport)) / rowHeight)
  const start = Math.min(count, Math.max(0, first - overscan))
  return { start, end: Math.max(start, Math.min(count, last + overscan)) }
}

/**
 * Where a key takes the active cell.
 *
 * Row -1 is the header, so the header is part of the grid a keyboard can
 * reach: up from the first row lands on it, and down leaves it.
 */
export function moveCell(cell: GridCell, key: string, bounds: { rows: number, columns: number, page: number, mod?: boolean }): GridCell {
  const lastRow = bounds.rows - 1
  const lastColumn = Math.max(0, bounds.columns - 1)
  const page = Math.max(1, bounds.page)
  let { row, column } = cell

  switch (key) {
    case 'ArrowUp': row = Math.max(-1, row - 1); break
    case 'ArrowDown': row = Math.min(lastRow, row + 1); break
    case 'ArrowLeft': column -= 1; break
    case 'ArrowRight': column += 1; break
    case 'PageUp': row = row <= 0 ? row : Math.max(0, row - page); break
    case 'PageDown': row = Math.min(lastRow, Math.max(0, row) + (row < 0 ? 0 : page)); break
    case 'Home':
    column = 0
    if (bounds.mod)
      row = Math.min(0, lastRow)
    break
    case 'End':
    column = lastColumn
    if (bounds.mod)
      row = lastRow
    break
    default: return cell
  }

  return { row: Math.max(-1, Math.min(lastRow, row)), column: Math.max(0, Math.min(lastColumn, column)) }
}

/** The next sort after a click on a column: ascending, descending, then none. */
export function cycleSort(sort: readonly GridSort[], key: string, additive = false): GridSort[] {
  const current = sort.find(entry => entry.key === key)
  const next: GridSort | null = !current
    ? { key, direction: 'asc' }
    : current.direction === 'asc' ? { key, direction: 'desc' } : null

  if (!additive)
    return next ? [next] : []
  if (!current)
    return [...sort, next!]
  return next
    ? sort.map(entry => (entry.key === key ? next : entry))
    : sort.filter(entry => entry.key !== key)
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export class GridModel<Row = any> {
  rows: readonly Row[] = []
  columns: ResolvedColumn<Row>[] = []
  /** Source indices of the rows on show, in the order shown. */
  view: Uint32Array = new Uint32Array(0)
  sort: GridSort[] = []
  filter = ''
  /** Selected rows, as source indices. */
  readonly selected: Set<number> = new Set()

  private given: GridColumn<Row>[] | null = null
  private filtered: Uint32Array = new Uint32Array(0)
  private searchText: string[] | null = null
  private readonly sortKeys: Map<string, Float64Array> = new Map()
  private offsets: Float64Array = new Float64Array(1)
  private anchor = -1
  private readonly charWidth: number
  private readonly cellPadding: number

  constructor(rows: readonly Row[] = [], columns: readonly GridColumn<Row>[] | null = null, options: GridModelOptions = {}) {
    this.charWidth = options.charWidth ?? 7.25
    this.cellPadding = options.cellPadding ?? 24
    this.given = columns && columns.length > 0 ? [...columns] : null
    this.setRows(rows)
  }

  /** How many rows are on show. */
  get count(): number {
    return this.view.length
  }

  get totalWidth(): number {
    return this.offsets[this.columns.length]
  }

  setRows(rows: readonly Row[] | null | undefined): void {
    this.rows = Array.isArray(rows) ? rows : []
    this.selected.clear()
    this.anchor = -1
    this.forget()
    this.resolveColumns()
    this.refilter()
  }

  /** Describe the columns, or pass null to have them worked out from the rows. */
  setColumns(columns: readonly GridColumn<Row>[] | null | undefined): void {
    this.given = columns && columns.length > 0 ? [...columns] : null
    this.forget()
    this.resolveColumns()
    this.sort = this.sort.filter(entry => this.columns.some(column => column.key === entry.key))
    this.refilter()
  }

  /**
   * Show only the rows that hold every word of `text`, in any column, whatever
   * the case. Returns how many are left.
   */
  setFilter(text: string | null | undefined): number {
    this.filter = text == null ? '' : String(text)
    this.refilter()
    return this.count
  }

  setSort(sort: readonly GridSort[] | null | undefined): void {
    this.sort = (sort ?? []).filter(entry => entry && (entry.direction === 'asc' || entry.direction === 'desc') && this.columns.some(column => column.key === entry.key))
    this.resort()
  }

  /** What a click on a header does. Returns the new sort. */
  toggleSort(key: string, additive = false): GridSort[] {
    const column = this.columns.find(entry => entry.key === key)
    if (!column || !column.sortable)
      return this.sort
    this.sort = cycleSort(this.sort, key, additive)
    this.resort()
    return this.sort
  }

  /** How a column is sorted, and where it comes in a sort over several. */
  sortOf(key: string): { direction: SortDirection, priority: number } | null {
    const index = this.sort.findIndex(entry => entry.key === key)
    return index < 0 ? null : { direction: this.sort[index].direction, priority: index + 1 }
  }

  rowAt(viewIndex: number): Row | undefined {
    return viewIndex >= 0 && viewIndex < this.view.length ? this.rows[this.view[viewIndex]] : undefined
  }

  valueAt(viewIndex: number, columnIndex: number): unknown {
    const column = this.columns[columnIndex]
    const row = this.rowAt(viewIndex)
    return column && row !== undefined ? cellValue(row, column) : undefined
  }

  /** The rows on show, in order. */
  viewRows(): Row[] {
    const out: Row[] = Array.from({ length: this.view.length })
    for (let index = 0; index < out.length; index++)
      out[index] = this.rows[this.view[index]]
    return out
  }

  toCsv(): string {
    return toCsv(this.viewRows(), this.columns)
  }

  toJson(): string {
    return toJson(this.viewRows(), this.columns)
  }

  // Selection

  /**
   * Select the row at a view index. `replace` leaves it the only one, `toggle`
   * flips it, `range` selects from the last row picked to this one as shown.
   */
  select(viewIndex: number, mode: 'replace' | 'toggle' | 'range' = 'replace'): void {
    if (viewIndex < 0 || viewIndex >= this.view.length)
      return
    const source = this.view[viewIndex]

    if (mode === 'range' && this.anchor >= 0) {
      const from = Math.min(this.anchor, viewIndex)
      const to = Math.max(this.anchor, viewIndex)
      this.selected.clear()
      for (let index = from; index <= to && index < this.view.length; index++)
        this.selected.add(this.view[index])
      return
    }

    if (mode === 'toggle') {
      if (this.selected.has(source))
        this.selected.delete(source)
      else
        this.selected.add(source)
    }
    else {
      this.selected.clear()
      this.selected.add(source)
    }
    this.anchor = viewIndex
  }

  /** Select every row on show. */
  selectAll(): void {
    this.selected.clear()
    for (let index = 0; index < this.view.length; index++)
      this.selected.add(this.view[index])
  }

  clearSelection(): void {
    this.selected.clear()
    this.anchor = -1
  }

  isSelected(viewIndex: number): boolean {
    return viewIndex >= 0 && viewIndex < this.view.length && this.selected.has(this.view[viewIndex])
  }

  /** Selected source indices, in source order. */
  selectedIndices(): number[] {
    return [...this.selected].sort((a, b) => a - b)
  }

  selectedRows(): Row[] {
    return this.selectedIndices().map(index => this.rows[index])
  }

  // Geometry

  /** Where a column starts, in pixels from the left. `columns.length` gives the total. */
  offsetOf(columnIndex: number): number {
    return this.offsets[Math.max(0, Math.min(this.columns.length, columnIndex))]
  }

  /** The column under a horizontal position, clamped to the first and last. */
  columnAt(x: number): number {
    const count = this.columns.length
    if (count === 0)
      return -1
    let low = 0
    let high = count - 1
    while (low < high) {
      const middle = (low + high + 1) >> 1
      if (this.offsets[middle] <= x)
        low = middle
      else
        high = middle - 1
    }
    return low
  }

  /** The columns that intersect a viewport, widened by `overscan` columns. */
  columnRange(scrollLeft: number, viewportWidth: number, overscan = 0): GridRange {
    const count = this.columns.length
    if (count === 0)
      return { start: 0, end: 0 }
    const first = this.columnAt(Math.max(0, scrollLeft))
    const last = this.columnAt(Math.max(0, scrollLeft) + Math.max(0, viewportWidth))
    return { start: Math.max(0, first - overscan), end: Math.min(count, last + 1 + overscan) }
  }

  /** Set a column's width, inside its limits. Returns the width it got. */
  resizeColumn(columnIndex: number, width: number): number {
    const column = this.columns[columnIndex]
    if (!column)
      return 0
    column.width = Math.round(Math.max(column.minWidth, Math.min(column.maxWidth, width)))
    this.measure()
    return column.width
  }

  /**
   * The width that fits a column's header and the rows sampled from the top of
   * the view. Counted in characters, not measured: laying text out to size a
   * column would cost more than drawing the grid.
   */
  autoWidth(columnIndex: number, sample = 200): number {
    const column = this.columns[columnIndex]
    if (!column)
      return 0
    // Room in the header for the sort mark beside the label.
    let longest = column.label.length + 3
    const limit = Math.min(this.view.length, sample)
    for (let index = 0; index < limit; index++) {
      const length = formatCell(cellValue(this.rows[this.view[index]], column), column.type).length
      if (length > longest)
        longest = length
    }
    const width = Math.ceil(longest * this.charWidth + this.cellPadding)
    return Math.max(column.minWidth, Math.min(column.maxWidth, FIT_MAX_WIDTH, width))
  }

  private forget(): void {
    this.searchText = null
    this.sortKeys.clear()
  }

  private resolveColumns(): void {
    const source = this.given ?? inferColumns(this.rows)
    const sample = Math.min(this.rows.length, 200)
    // Until the view exists, a column is fitted against the rows as they come.
    const previous = this.view
    this.view = new Uint32Array(sample)
    for (let index = 0; index < sample; index++)
      this.view[index] = index

    this.columns = source.map((column) => {
      let type = column.type
      if (!type) {
        const values: unknown[] = []
        for (let index = 0; index < sample; index++)
          values.push(cellValue(this.rows[index], column))
        type = inferType(values)
      }
      return {
        ...column,
        label: column.label ?? column.key,
        type,
        width: column.width ?? 0,
        minWidth: column.minWidth ?? DEFAULT_MIN_WIDTH,
        maxWidth: column.maxWidth ?? DEFAULT_MAX_WIDTH,
        align: column.align ?? (type === 'number' ? 'right' : 'left'),
        sortable: column.sortable !== false,
      }
    })
    this.columns.forEach((column, index) => {
      if (!column.width)
        column.width = this.autoWidth(index)
      column.width = Math.max(column.minWidth, Math.min(column.maxWidth, column.width))
    })

    this.view = previous
    this.measure()
  }

  private measure(): void {
    const offsets = new Float64Array(this.columns.length + 1)
    for (let index = 0; index < this.columns.length; index++)
      offsets[index + 1] = offsets[index] + this.columns[index].width
    this.offsets = offsets
  }

  /** The text of each row a filter looks through, lower case, made once. */
  private searchable(): string[] {
    if (this.searchText)
      return this.searchText
    const rows = this.rows
    const columns = this.columns
    const text: string[] = Array.from({ length: rows.length })
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      let line = ''
      for (let position = 0; position < columns.length; position++) {
        const value = cellValue(row, columns[position])
        if (value === null || value === undefined)
          continue
        // A separator no value holds, so a term cannot match across two cells.
        line += typeof value === 'string' ? value : formatCell(value, columns[position].type)
        line += '\u0001'
      }
      text[index] = line.toLowerCase()
    }
    this.searchText = text
    return text
  }

  private refilter(): void {
    const total = this.rows.length
    const terms = this.filter.toLowerCase().split(/\s+/).filter(Boolean)

    if (terms.length === 0) {
      const all = new Uint32Array(total)
      for (let index = 0; index < total; index++)
        all[index] = index
      this.filtered = all
    }
    else {
      const text = this.searchable()
      const kept = new Uint32Array(total)
      let count = 0
      const single = terms.length === 1 ? terms[0] : null
      for (let index = 0; index < total; index++) {
        const line = text[index]
        if (single !== null) {
          if (line.includes(single))
            kept[count++] = index
          continue
        }
        let every = true
        for (let term = 0; term < terms.length; term++) {
          if (!line.includes(terms[term])) {
            every = false
            break
          }
        }
        if (every)
          kept[count++] = index
      }
      this.filtered = kept.slice(0, count)
    }
    this.anchor = -1
    this.resort()
  }

  /**
   * One number per row to sort a column by, whatever the column holds, with
   * NaN for an empty cell. Text is ranked once with the collator, so a sort
   * never calls it per comparison.
   */
  private keysFor(column: ResolvedColumn<Row>): Float64Array {
    const cached = this.sortKeys.get(column.key)
    if (cached)
      return cached

    const rows = this.rows
    const keys = new Float64Array(rows.length)

    if (column.type === 'number' || column.type === 'date' || column.type === 'boolean') {
      for (let index = 0; index < rows.length; index++) {
        const value = cellValue(rows[index], column)
        let key = Number.NaN
        if (value === null || value === undefined || value === '')
          key = Number.NaN
        else if (typeof value === 'number')
          key = value
        else if (typeof value === 'boolean')
          key = value ? 1 : 0
        else if (value instanceof Date)
          key = value.getTime()
        else if (column.type === 'date')
          key = Date.parse(String(value))
        else if (column.type === 'boolean')
          key = String(value).toLowerCase() === 'true' ? 1 : 0
        else
          key = Number(value)
        keys[index] = key
      }
    }
    else {
      const texts: Array<string | null> = Array.from({ length: rows.length })
      const distinct = new Map<string, number>()
      for (let index = 0; index < rows.length; index++) {
        const value = cellValue(rows[index], column)
        if (value === null || value === undefined) {
          texts[index] = null
          continue
        }
        const text = typeof value === 'string' ? value : formatCell(value, column.type)
        texts[index] = text
        if (!distinct.has(text))
          distinct.set(text, 0)
      }
      const ordered = [...distinct.keys()].sort(collator.compare)
      // Values the collator calls equal (`a` and `A`) share a rank, so they
      // keep their source order instead of being split by an arbitrary one.
      let rank = 0
      for (let index = 0; index < ordered.length; index++) {
        if (index > 0 && collator.compare(ordered[index - 1], ordered[index]) !== 0)
          rank++
        distinct.set(ordered[index], rank)
      }
      for (let index = 0; index < rows.length; index++) {
        const text = texts[index]
        keys[index] = text === null ? Number.NaN : distinct.get(text)!
      }
    }

    this.sortKeys.set(column.key, keys)
    return keys
  }

  private resort(): void {
    const specs: Array<{ keys: Float64Array, sign: number }> = []
    for (const entry of this.sort) {
      const column = this.columns.find(candidate => candidate.key === entry.key)
      if (column)
        specs.push({ keys: this.keysFor(column), sign: entry.direction === 'desc' ? -1 : 1 })
    }

    const view = this.filtered.slice()
    if (specs.length === 1) {
      const { keys, sign } = specs[0]
      // Empty cells last whichever way the column runs, and the source order
      // between equals, which is what makes the sort stable.
      view.sort((a, b) => {
        const x = keys[a]
        const y = keys[b]
        if (x < y)
          return -sign
        if (x > y)
          return sign
        if (x === y)
          return a - b
        const xEmpty = x !== x
        const yEmpty = y !== y
        return xEmpty === yEmpty ? a - b : (xEmpty ? 1 : -1)
      })
    }
    else if (specs.length > 1) {
      view.sort((a, b) => {
        for (let index = 0; index < specs.length; index++) {
          const x = specs[index].keys[a]
          const y = specs[index].keys[b]
          if (x < y)
            return -specs[index].sign
          if (x > y)
            return specs[index].sign
          if (x === y)
            continue
          const xEmpty = x !== x
          const yEmpty = y !== y
          if (xEmpty !== yEmpty)
            return xEmpty ? 1 : -1
        }
        return a - b
      })
    }
    this.view = view
  }
}
