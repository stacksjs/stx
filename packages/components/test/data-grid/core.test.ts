import { describe, expect, it } from 'bun:test'
import { cellJson, cellKind, cellValue, cycleSort, formatCell, GridModel, inferColumns, inferType, JSON_PREVIEW_LENGTH, moveCell, projectRow, rowJson, rowRange, toCsv, toJson } from '../../src/ui/data-grid/core'

const people = [
  { id: 1, name: 'Ada', age: 36, joined: '2021-03-04', admin: true, tags: ['a'] },
  { id: 2, name: 'bob', age: null, joined: '2019-11-20', admin: false, tags: [] },
  { id: 3, name: 'Cy', age: 9, joined: '2023-01-01', admin: false, tags: ['x', 'y'] },
  { id: 4, name: 'ada', age: 120, joined: null, admin: true, tags: null },
  { id: 10, name: 'Item 10', age: 9, joined: '2020-06-15', admin: false, tags: ['z'] },
  { id: 5, name: 'Item 9', age: undefined, joined: '2022-02-02', admin: true, tags: ['q'] },
]
const ids = (model: GridModel) => model.viewRows().map(row => row.id)

describe('working out the columns', () => {
  it('takes every key of the rows, in the order first seen', () => {
    expect(inferColumns([{ a: 1, b: 2 }, { b: 3, c: 4 }, { a: 5 }]).map(c => c.key)).toEqual(['a', 'b', 'c'])
  })

  it('gives rows that are arrays a column per position', () => {
    expect(inferColumns([[1, 2], [1, 2, 3]]).map(c => c.key)).toEqual(['0', '1', '2'])
    expect(cellValue([7, 8, 9], { key: '1' })).toBe(8)
  })

  it('looks only at the sample, and skips what is not a row', () => {
    expect(inferColumns([{ a: 1 }, { b: 2 }], 1).map(c => c.key)).toEqual(['a'])
    expect(inferColumns([null, 4, 'x', { a: 1 }] as any).map(c => c.key)).toEqual(['a'])
    expect(inferColumns([])).toEqual([])
  })

  it('tells a number column', () => {
    expect(inferType([1, 2.5, -3])).toBe('number')
    expect(inferType(['1', '2.5', '-3', '1e3', '.5'])).toBe('number')
    expect(inferType([1, '2', null, undefined, ''])).toBe('number')
    expect(inferType([10n, 2])).toBe('number')
  })

  it('makes a column text when a single value is not a number', () => {
    expect(inferType([1, 2, 'n/a'])).toBe('string')
    expect(inferType(['1', '2px'])).toBe('string')
  })

  it('tells dates, booleans and structured values', () => {
    expect(inferType(['2024-01-02', '2024-01-02T10:20:30Z', '2024-01-02 10:20', new Date()])).toBe('date')
    expect(inferType(['2024-13-45'])).toBe('string')
    expect(inferType(['January'])).toBe('string')
    expect(inferType([true, false, null])).toBe('boolean')
    expect(inferType([{ a: 1 }, [1], null])).toBe('json')
    expect(inferType([{ a: 1 }, 'text'])).toBe('string')
  })

  it('calls a column with nothing in it text', () => {
    expect(inferType([])).toBe('string')
    expect(inferType([null, undefined, ''])).toBe('string')
  })

  it('resolves types, labels and alignment on the model', () => {
    const model = new GridModel(people)
    const byKey = Object.fromEntries(model.columns.map(c => [c.key, c]))

    expect(model.columns.map(c => c.key)).toEqual(['id', 'name', 'age', 'joined', 'admin', 'tags'])
    expect(model.columns.map(c => c.type)).toEqual(['number', 'string', 'number', 'date', 'boolean', 'json'])
    expect(byKey.age.align).toBe('right')
    expect(byKey.name.align).toBe('left')
    expect(byKey.name.label).toBe('name')
    expect(byKey.name.sortable).toBe(true)
  })

  it('keeps what a described column says', () => {
    const model = new GridModel(people, [
      { key: 'name', label: 'Name', width: 200, sortable: false },
      { key: 'age', type: 'string', align: 'center' },
      { key: 'initial', accessor: row => row.name.charAt(0) },
    ])

    expect(model.columns.map(c => [c.label, c.type, c.align, c.width > 0, c.sortable])).toEqual([
      ['Name', 'string', 'left', true, false],
      ['age', 'string', 'center', true, true],
      ['initial', 'string', 'left', true, true],
    ])
    expect(model.columns[0].width).toBe(200)
    expect(model.valueAt(0, 2)).toBe('A')
  })

  it('works the columns out again when the rows change, unless they were given', () => {
    const inferred = new GridModel([{ a: 1 }])
    inferred.setRows([{ b: 'x' }])
    expect(inferred.columns.map(c => [c.key, c.type])).toEqual([['b', 'string']])

    const given = new GridModel([{ a: 1 }], [{ key: 'a' }])
    given.setRows([{ b: 'x' }])
    expect(given.columns.map(c => c.key)).toEqual(['a'])
    given.setColumns(null)
    expect(given.columns.map(c => c.key)).toEqual(['b'])
  })
})

describe('sorting', () => {
  it('sorts numbers as numbers, with empty cells last both ways', () => {
    const model = new GridModel(people)

    model.setSort([{ key: 'age', direction: 'asc' }])
    expect(ids(model)).toEqual([3, 10, 1, 4, 2, 5])
    model.setSort([{ key: 'age', direction: 'desc' }])
    expect(ids(model)).toEqual([4, 1, 3, 10, 2, 5])
  })

  it('keeps the source order between equal values', () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({ id: index, group: index % 3 }))
    const model = new GridModel(rows)
    model.setSort([{ key: 'group', direction: 'desc' }])
    const view = model.viewRows()

    for (let index = 1; index < view.length; index++) {
      if (view[index - 1].group === view[index].group)
        expect(view[index - 1].id).toBeLessThan(view[index].id)
      else
        expect(view[index - 1].group).toBeGreaterThan(view[index].group)
    }
  })

  it('sorts text without regard to case, and digits in it as numbers', () => {
    const model = new GridModel(people)

    model.setSort([{ key: 'name', direction: 'asc' }])
    expect(model.viewRows().map(row => row.name)).toEqual(['Ada', 'ada', 'bob', 'Cy', 'Item 9', 'Item 10'])
    model.setSort([{ key: 'name', direction: 'desc' }])
    expect(model.viewRows().map(row => row.name)).toEqual(['Item 10', 'Item 9', 'Cy', 'bob', 'Ada', 'ada'])
  })

  it('sorts dates by time and booleans false first', () => {
    const model = new GridModel(people)

    model.setSort([{ key: 'joined', direction: 'asc' }])
    expect(ids(model)).toEqual([2, 10, 1, 5, 3, 4])
    model.setSort([{ key: 'admin', direction: 'asc' }])
    expect(ids(model)).toEqual([2, 3, 10, 1, 4, 5])
  })

  it('sorts Date objects and numeric strings', () => {
    const model = new GridModel([
      { when: new Date('2024-05-01'), n: '10' },
      { when: new Date('2023-05-01'), n: '9' },
      { when: null, n: '100' },
    ])

    model.setSort([{ key: 'when', direction: 'asc' }])
    expect(model.viewRows().map(row => row.n)).toEqual(['9', '10', '100'])
    model.setSort([{ key: 'n', direction: 'desc' }])
    expect(model.viewRows().map(row => row.n)).toEqual(['100', '10', '9'])
  })

  it('sorts by several columns in turn', () => {
    const model = new GridModel(people)

    model.setSort([{ key: 'admin', direction: 'desc' }, { key: 'age', direction: 'asc' }])
    expect(ids(model)).toEqual([1, 4, 5, 3, 10, 2])
  })

  it('cycles a column through ascending, descending and none', () => {
    const model = new GridModel(people)

    expect(model.toggleSort('age')).toEqual([{ key: 'age', direction: 'asc' }])
    expect(model.toggleSort('age')).toEqual([{ key: 'age', direction: 'desc' }])
    expect(model.sortOf('age')).toEqual({ direction: 'desc', priority: 1 })
    expect(model.toggleSort('age')).toEqual([])
    expect(model.sortOf('age')).toBeNull()
    expect(ids(model)).toEqual([1, 2, 3, 4, 10, 5])
  })

  it('replaces the sort on a plain click and adds to it with shift', () => {
    expect(cycleSort([{ key: 'a', direction: 'asc' }], 'b')).toEqual([{ key: 'b', direction: 'asc' }])
    expect(cycleSort([{ key: 'a', direction: 'asc' }], 'b', true)).toEqual([{ key: 'a', direction: 'asc' }, { key: 'b', direction: 'asc' }])
    expect(cycleSort([{ key: 'a', direction: 'asc' }, { key: 'b', direction: 'asc' }], 'a', true)).toEqual([{ key: 'a', direction: 'desc' }, { key: 'b', direction: 'asc' }])
    expect(cycleSort([{ key: 'a', direction: 'desc' }, { key: 'b', direction: 'asc' }], 'a', true)).toEqual([{ key: 'b', direction: 'asc' }])
  })

  it('ignores a sort it cannot do', () => {
    const model = new GridModel(people, [{ key: 'name', sortable: false }, { key: 'age' }])

    expect(model.toggleSort('name')).toEqual([])
    expect(model.toggleSort('nothing')).toEqual([])
    model.setSort([{ key: 'nothing', direction: 'asc' }, { key: 'age', direction: 'sideways' as any }])
    expect(model.sort).toEqual([])
    model.setSort(null)
    expect(model.sort).toEqual([])
  })

  it('drops the sort of a column that is taken away', () => {
    const model = new GridModel(people)
    model.setSort([{ key: 'age', direction: 'asc' }])
    model.setColumns([{ key: 'name' }])

    expect(model.sort).toEqual([])
    expect(ids(model)).toEqual([1, 2, 3, 4, 10, 5])
  })
})

describe('filtering', () => {
  it('keeps the rows that hold the text, whatever the case', () => {
    const model = new GridModel(people)

    expect(model.setFilter('ADA')).toBe(2)
    expect(ids(model)).toEqual([1, 4])
    expect(model.count).toBe(2)
  })

  it('needs every word, in any column', () => {
    const model = new GridModel(people)

    expect(model.setFilter('item true')).toBe(1)
    expect(ids(model)).toEqual([5])
    expect(model.setFilter('  item   false ')).toBe(1)
    expect(ids(model)).toEqual([10])
  })

  it('does not match across two cells', () => {
    const model = new GridModel([{ a: 'ab', b: 'cd' }])

    expect(model.setFilter('bc')).toBe(0)
    expect(model.setFilter('ab cd')).toBe(1)
  })

  it('searches numbers, dates and structured values as they are shown', () => {
    const model = new GridModel(people)

    expect(model.setFilter('120')).toBe(1)
    expect(model.setFilter('2019-11')).toBe(1)
    expect(model.setFilter('"x"')).toBe(1)
  })

  it('does not find the word null in an empty cell', () => {
    expect(new GridModel(people).setFilter('null')).toBe(0)
    expect(new GridModel(people).setFilter('undefined')).toBe(0)
  })

  it('shows everything again when the text is cleared', () => {
    const model = new GridModel(people)
    model.setFilter('ada')

    expect(model.setFilter('')).toBe(6)
    expect(model.setFilter(null)).toBe(6)
    expect(model.setFilter('   ')).toBe(6)
  })

  it('filters first and sorts what is left', () => {
    const model = new GridModel(people)
    model.setSort([{ key: 'id', direction: 'desc' }])
    model.setFilter('false')

    expect(ids(model)).toEqual([10, 3, 2])
    model.setFilter('')
    expect(ids(model)).toEqual([10, 5, 4, 3, 2, 1])
  })

  it('searches only the columns on show', () => {
    const model = new GridModel(people, [{ key: 'name' }])

    expect(model.setFilter('2019')).toBe(0)
    model.setColumns(null)
    expect(model.setFilter('2019')).toBe(1)
  })
})

describe('selecting rows', () => {
  it('selects one row, by where it is in the source', () => {
    const model = new GridModel(people)
    model.setSort([{ key: 'id', direction: 'desc' }])
    model.select(0)

    expect(model.selectedIndices()).toEqual([4])
    expect(model.selectedRows().map(row => row.id)).toEqual([10])
    expect(model.isSelected(0)).toBe(true)
    expect(model.isSelected(1)).toBe(false)
  })

  it('toggles a row in and out', () => {
    const model = new GridModel(people)
    model.select(1)
    model.select(3, 'toggle')
    expect(model.selectedIndices()).toEqual([1, 3])
    model.select(1, 'toggle')
    expect(model.selectedIndices()).toEqual([3])
  })

  it('selects a range over the rows as they are shown', () => {
    const model = new GridModel(people)
    model.setSort([{ key: 'age', direction: 'asc' }])
    model.select(1)
    model.select(3, 'range')

    expect(model.selectedRows().map(row => row.id).sort((a, b) => a - b)).toEqual([1, 4, 10])
    model.select(0, 'range')
    expect(model.selectedRows().map(row => row.id).sort((a, b) => a - b)).toEqual([3, 10])
  })

  it('treats a range with nowhere to start as a plain selection', () => {
    const model = new GridModel(people)
    model.select(2, 'range')

    expect(model.selectedIndices()).toEqual([2])
  })

  it('keeps the selection through a sort and a filter', () => {
    const model = new GridModel(people)
    model.select(0)
    model.setSort([{ key: 'id', direction: 'desc' }])
    expect(model.selectedRows().map(row => row.id)).toEqual([1])
    expect(model.isSelected(5)).toBe(true)
    model.setFilter('bob')
    expect(model.selectedRows().map(row => row.id)).toEqual([1])
    expect(model.isSelected(0)).toBe(false)
  })

  it('selects all the rows on show, and clears', () => {
    const model = new GridModel(people)
    model.setFilter('ada')
    model.selectAll()
    expect(model.selectedIndices()).toEqual([0, 3])
    model.clearSelection()
    expect(model.selectedIndices()).toEqual([])
  })

  it('ignores a row that is not there, and forgets the selection with the rows', () => {
    const model = new GridModel(people)
    model.select(99)
    model.select(-1)
    expect(model.selected.size).toBe(0)
    model.select(0)
    model.setRows([{ id: 1 }])
    expect(model.selected.size).toBe(0)
  })
})

describe('column geometry', () => {
  const model = () => new GridModel([{ a: 1, b: 2, c: 3 }], [{ key: 'a', width: 100 }, { key: 'b', width: 50, minWidth: 40, maxWidth: 300 }, { key: 'c', width: 200 }])

  it('lays the columns end to end', () => {
    const grid = model()

    expect([0, 1, 2, 3].map(index => grid.offsetOf(index))).toEqual([0, 100, 150, 350])
    expect(grid.totalWidth).toBe(350)
  })

  it('finds the column under a position', () => {
    const grid = model()

    expect([0, 99, 100, 149, 150, 349].map(x => grid.columnAt(x))).toEqual([0, 0, 1, 1, 2, 2])
    expect(grid.columnAt(-20)).toBe(0)
    expect(grid.columnAt(5000)).toBe(2)
    expect(new GridModel([]).columnAt(10)).toBe(-1)
  })

  it('gives the columns that cross a viewport', () => {
    const grid = model()

    expect(grid.columnRange(0, 120)).toEqual({ start: 0, end: 2 })
    expect(grid.columnRange(160, 50)).toEqual({ start: 2, end: 3 })
    expect(grid.columnRange(160, 50, 1)).toEqual({ start: 1, end: 3 })
    expect(grid.columnRange(0, 5000, 4)).toEqual({ start: 0, end: 3 })
    expect(new GridModel([]).columnRange(0, 100)).toEqual({ start: 0, end: 0 })
  })

  it('resizes a column inside its limits and moves the ones after it', () => {
    const grid = model()

    expect(grid.resizeColumn(1, 120)).toBe(120)
    expect(grid.offsetOf(2)).toBe(220)
    expect(grid.resizeColumn(1, 5)).toBe(40)
    expect(grid.resizeColumn(1, 9000)).toBe(300)
    expect(grid.resizeColumn(0, 10)).toBe(48)
    expect(grid.resizeColumn(9, 100)).toBe(0)
  })

  it('fits a column to its header and its longest sampled value', () => {
    const grid = new GridModel([{ a: 'x', long: 'a value that is rather long' }, { a: 'y', long: 'short' }], null, { charWidth: 10, cellPadding: 20 })

    expect(grid.autoWidth(1)).toBe(27 * 10 + 20)
    // One character, but the header (and room for its sort mark) is wider.
    expect(grid.autoWidth(0)).toBe(4 * 10 + 20)
    expect(grid.columns[1].width).toBe(290)
    expect(grid.autoWidth(7)).toBe(0)
  })

  it('stops fitting at a sensible width', () => {
    const grid = new GridModel([{ text: 'x'.repeat(5000) }])

    expect(grid.columns[0].width).toBe(420)
  })

  it('gives the rows that cross a viewport', () => {
    expect(rowRange(0, 280, 28, 1000)).toEqual({ start: 0, end: 10 })
    expect(rowRange(290, 280, 28, 1000)).toEqual({ start: 10, end: 21 })
    expect(rowRange(290, 280, 28, 1000, 5)).toEqual({ start: 5, end: 26 })
    expect(rowRange(27_900, 280, 28, 1000, 5)).toEqual({ start: 991, end: 1000 })
    expect(rowRange(0, 280, 28, 3, 5)).toEqual({ start: 0, end: 3 })
    expect(rowRange(-50, 280, 28, 1000)).toEqual({ start: 0, end: 10 })
    expect(rowRange(0, 280, 28, 0)).toEqual({ start: 0, end: 0 })
    expect(rowRange(99_999, 280, 28, 10)).toEqual({ start: 10, end: 10 })
  })
})

describe('moving the active cell', () => {
  const bounds = { rows: 100, columns: 5, page: 10 }

  it('moves one cell with an arrow and stops at the edges', () => {
    expect(moveCell({ row: 3, column: 2 }, 'ArrowDown', bounds)).toEqual({ row: 4, column: 2 })
    expect(moveCell({ row: 3, column: 2 }, 'ArrowUp', bounds)).toEqual({ row: 2, column: 2 })
    expect(moveCell({ row: 3, column: 2 }, 'ArrowLeft', bounds)).toEqual({ row: 3, column: 1 })
    expect(moveCell({ row: 3, column: 2 }, 'ArrowRight', bounds)).toEqual({ row: 3, column: 3 })
    expect(moveCell({ row: 99, column: 4 }, 'ArrowDown', bounds)).toEqual({ row: 99, column: 4 })
    expect(moveCell({ row: 99, column: 4 }, 'ArrowRight', bounds)).toEqual({ row: 99, column: 4 })
    expect(moveCell({ row: 5, column: 0 }, 'ArrowLeft', bounds)).toEqual({ row: 5, column: 0 })
  })

  it('reaches the header by going up from the first row, and leaves it going down', () => {
    expect(moveCell({ row: 0, column: 2 }, 'ArrowUp', bounds)).toEqual({ row: -1, column: 2 })
    expect(moveCell({ row: -1, column: 2 }, 'ArrowUp', bounds)).toEqual({ row: -1, column: 2 })
    expect(moveCell({ row: -1, column: 2 }, 'ArrowDown', bounds)).toEqual({ row: 0, column: 2 })
    expect(moveCell({ row: -1, column: 2 }, 'ArrowRight', bounds)).toEqual({ row: -1, column: 3 })
  })

  it('goes to the ends of the row, and of the grid with the modifier', () => {
    expect(moveCell({ row: 7, column: 2 }, 'Home', bounds)).toEqual({ row: 7, column: 0 })
    expect(moveCell({ row: 7, column: 2 }, 'End', bounds)).toEqual({ row: 7, column: 4 })
    expect(moveCell({ row: 7, column: 2 }, 'Home', { ...bounds, mod: true })).toEqual({ row: 0, column: 0 })
    expect(moveCell({ row: 7, column: 2 }, 'End', { ...bounds, mod: true })).toEqual({ row: 99, column: 4 })
  })

  it('moves a page at a time without landing on the header', () => {
    expect(moveCell({ row: 25, column: 1 }, 'PageDown', bounds)).toEqual({ row: 35, column: 1 })
    expect(moveCell({ row: 95, column: 1 }, 'PageDown', bounds)).toEqual({ row: 99, column: 1 })
    expect(moveCell({ row: 25, column: 1 }, 'PageUp', bounds)).toEqual({ row: 15, column: 1 })
    expect(moveCell({ row: 4, column: 1 }, 'PageUp', bounds)).toEqual({ row: 0, column: 1 })
    expect(moveCell({ row: -1, column: 1 }, 'PageDown', bounds)).toEqual({ row: 0, column: 1 })
  })

  it('hands back the same cell for a key that is not a move', () => {
    const cell = { row: 1, column: 1 }

    expect(moveCell(cell, 'a', bounds)).toBe(cell)
    expect(moveCell(cell, 'Enter', bounds)).toBe(cell)
  })

  it('has only the header to be on when there are no rows', () => {
    expect(moveCell({ row: -1, column: 0 }, 'ArrowDown', { rows: 0, columns: 3, page: 10 })).toEqual({ row: -1, column: 0 })
    expect(moveCell({ row: -1, column: 0 }, 'End', { rows: 0, columns: 3, page: 10, mod: true })).toEqual({ row: -1, column: 2 })
  })
})

describe('the text of a cell', () => {
  it('shows a number digit for digit', () => {
    expect(formatCell(1234567.891, 'number')).toBe('1234567.891')
    expect(formatCell(0, 'number')).toBe('0')
    expect(formatCell(-0.5, 'number')).toBe('-0.5')
    expect(formatCell(12n, 'number')).toBe('12')
    expect(formatCell('007', 'number')).toBe('007')
  })

  it('shows booleans, dates and text', () => {
    expect(formatCell(true, 'boolean')).toBe('true')
    expect(formatCell(false, 'boolean')).toBe('false')
    expect(formatCell(new Date('2024-01-02T03:04:05Z'), 'date')).toBe('2024-01-02T03:04:05.000Z')
    expect(formatCell(new Date('nope'), 'date')).toBe('Invalid Date')
    expect(formatCell('2024-01-02', 'date')).toBe('2024-01-02')
    expect(formatCell('{{ danger }}')).toBe('{{ danger }}')
  })

  it('shows structured values as compact JSON, cut when long', () => {
    expect(formatCell({ a: [1, 2] }, 'json')).toBe('{"a":[1,2]}')
    const long = formatCell(Array.from({ length: 500 }, (_, i) => i), 'json')
    expect(long.length).toBe(JSON_PREVIEW_LENGTH + 3)
    expect(long.endsWith('...')).toBe(true)
  })

  it('tells null from undefined', () => {
    expect(formatCell(null)).toBe('null')
    expect(formatCell(undefined)).toBe('undefined')
    expect(cellKind(null)).toBe('null')
    expect(cellKind(undefined)).toBe('undefined')
    expect(cellKind(0)).toBe('value')
    expect(cellKind('')).toBe('value')
  })

  it('survives a value JSON refuses', () => {
    const loop: Record<string, unknown> = { n: 1n }
    loop.self = loop

    expect(formatCell(loop, 'json')).toBe('{"n":"1","self":"[Circular]"}')
  })
})

describe('copying and exporting', () => {
  it('copies a cell as JSON', () => {
    expect(cellJson('text')).toBe('"text"')
    expect(cellJson(12)).toBe('12')
    expect(cellJson(null)).toBe('null')
    expect(cellJson(undefined)).toBe('null')
    expect(cellJson({ a: 1 })).toBe('{"a":1}')
    expect(cellJson(new Date('2024-01-02T00:00:00Z'))).toBe('"2024-01-02T00:00:00.000Z"')
  })

  it('copies a row as an object of its columns', () => {
    const columns = [{ key: 'name' }, { key: 'missing' }, { key: 'upper', accessor: (row: any) => row.name.toUpperCase() }]

    expect(projectRow(people[0], columns)).toEqual({ name: 'Ada', missing: null, upper: 'ADA' })
    expect(rowJson(people[0], columns)).toBe('{\n  "name": "Ada",\n  "missing": null,\n  "upper": "ADA"\n}')
    expect(rowJson([5, 6], [{ key: '0' }, { key: '1' }])).toBe('{\n  "0": 5,\n  "1": 6\n}')
  })

  it('writes CSV with a header row and CRLF line ends', () => {
    expect(toCsv([{ a: 1, b: 'x' }, { a: 2, b: 'y' }], [{ key: 'a', label: 'A' }, { key: 'b' }])).toBe('A,b\r\n1,x\r\n2,y\r\n')
    expect(toCsv([], [{ key: 'a' }])).toBe('a\r\n')
  })

  it('quotes what CSV needs quoted, and doubles a quote', () => {
    const csv = toCsv([{ a: 'has,comma', b: 'has "quote"', c: 'two\nlines', d: ' edge ', e: 'plain' }], [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }, { key: 'e' }])

    expect(csv.split('\r\n')[1]).toBe('"has,comma","has ""quote""","two\nlines"," edge ",plain')
  })

  it('quotes a header that needs it', () => {
    expect(toCsv([], [{ key: 'a', label: 'Name, full' }])).toBe('"Name, full"\r\n')
  })

  it('leaves an empty cell empty, and writes dates and structured values', () => {
    const csv = toCsv([{ a: null, b: undefined, c: new Date('2024-01-02T00:00:00Z'), d: { k: 'v' }, e: false, f: 0 }], ['a', 'b', 'c', 'd', 'e', 'f'].map(key => ({ key })))

    expect(csv.split('\r\n')[1]).toBe(',,2024-01-02T00:00:00.000Z,"{""k"":""v""}",false,0')
  })

  it('writes JSON as an array of objects', () => {
    expect(JSON.parse(toJson([{ a: 1, b: 2 }], [{ key: 'b' }]))).toEqual([{ b: 2 }])
    expect(toJson([], [{ key: 'a' }])).toBe('[]')
  })

  it('exports the view: what the filter left, in sorted order, in the columns on show', () => {
    const model = new GridModel(people, [{ key: 'id' }, { key: 'name', label: 'Name' }])
    model.setFilter('item')
    model.setSort([{ key: 'id', direction: 'desc' }])

    expect(model.toCsv()).toBe('id,Name\r\n10,Item 10\r\n5,Item 9\r\n')
    expect(JSON.parse(model.toJson())).toEqual([{ id: 10, name: 'Item 10' }, { id: 5, name: 'Item 9' }])
    expect(model.viewRows()).toEqual([people[4], people[5]])
  })
})

describe('reading the view', () => {
  it('answers by view index', () => {
    const model = new GridModel(people)
    model.setSort([{ key: 'id', direction: 'desc' }])

    expect(model.rowAt(0)).toBe(people[4])
    expect(model.valueAt(0, 1)).toBe('Item 10')
    expect(model.rowAt(-1)).toBeUndefined()
    expect(model.rowAt(6)).toBeUndefined()
    expect(model.valueAt(0, 99)).toBeUndefined()
  })

  it('takes anything that is not a list of rows as no rows', () => {
    const model = new GridModel(null as any)

    expect(model.count).toBe(0)
    expect(model.columns).toEqual([])
    model.setRows(undefined)
    expect(model.toCsv()).toBe('\r\n')
  })

  it('handles a hundred thousand rows', () => {
    const rows = Array.from({ length: 100_000 }, (_, index) => ({ id: index, name: `name ${index % 977}`, score: (index * 7919) % 10_007 }))
    const model = new GridModel(rows)

    model.setSort([{ key: 'score', direction: 'desc' }])
    expect(model.rowAt(0)!.score).toBe(10_006)
    model.setSort([{ key: 'name', direction: 'asc' }])
    expect(model.rowAt(0)!.name).toBe('name 0')
    expect(model.rowAt(99_999)!.name).toBe('name 976')
    expect(model.setFilter('NAME 976')).toBe(rows.filter(row => `${row.id} ${row.name} ${row.score}`.includes('976')).length)
    expect(model.setFilter('976 "name 9"')).toBe(0)
    expect(model.setFilter('976 name')).toBe(rows.filter(row => `${row.id} ${row.name} ${row.score}`.includes('976')).length)
    expect(model.setFilter('')).toBe(100_000)
  })
})
