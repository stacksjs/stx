# DataGrid

A grid for rows of data: sortable and resizable columns, a text filter, row
selection, cell navigation from the keyboard, copy as JSON, and CSV and JSON
export of what is on show. Rows and columns are both virtualized, so a
hundred thousand rows cost what forty do. No third-party grid underneath.

```html
<script client>
const users = state([
  { id: 1, name: 'Ada', age: 36, joined: '2021-03-04', admin: true },
  { id: 2, name: 'Grace', age: 45, joined: '2019-11-20', admin: false },
])

function open(detail) {
  // detail.row is the row object, detail.rowIndex its place in the view.
}
</script>

<DataGrid :rows="users()" label="Users" height="24rem" @activate="open($event)" />
```

A component's event hands its payload to the handler as `$event`, so `open`
above receives the detail object itself.

Columns are worked out from the rows when none are given: every key of the
first 200 rows, in the order first seen, each with a type inferred from its
values. A row can be an object or an array.

## How it works

One scroll container holds a header that sticks to its top and a body as tall
as every row together. Only the rows and columns that cross the viewport are
elements. A row that scrolls out is handed to the row that scrolls in, so
scrolling makes no elements and drops none.

The rows are never copied or reordered. The view is a `Uint32Array` of source
indices: the rows that pass the filter, in sorted order. Anything slow to work
out per row is worked out once and kept: the lower-case text a filter searches,
and one number per cell to sort by (text is ranked once with `Intl.Collator`,
so a sort never calls it per comparison).

Three layers, each usable without the ones above it:

| File | What it is |
|---|---|
| `core.ts` | The model: column and type inference, sort, filter, selection, column geometry, cell movement, CSV and JSON. No DOM and no stx. |
| `view.ts` | The DOM: which rows and columns exist, the recycling, the header, the keyboard, the pointer, the clipboard and the download. |
| `DataGrid.stx` | The template, the styles, and the props and events. |

`@stacksjs/components/data-grid` exports the first two for a host that mounts a
grid itself.

## Props

| Prop | Default | |
|---|---|---|
| `rows` | `[]` | Objects or arrays. Bind it with `:rows`. For a very large list, use `setRows()` instead (see Limits). |
| `columns` | inferred | `{ key, label?, type?, width?, minWidth?, maxWidth?, align?, sortable?, accessor? }`. `type` is `string`, `number`, `date`, `boolean` or `json`. |
| `rowHeight` | `28` | Pixels. |
| `headerHeight` | `32` | Pixels. |
| `height` | `'24rem'` | Any CSS length. `100%` fills a sized parent. |
| `filterable` | `true` | Show the filter field. |
| `exportable` | `true` | Show the CSV and JSON buttons. |
| `selectable` | `true` | Rows can be selected. |
| `filter` | `''` | The filter text. |
| `label` | `'Data'` | The grid's accessible name. Also names the filter field and the export buttons. |
| `fileName` | `'data'` | The name of an exported file, without its extension. |
| `contextMenu` | `false` | Keep the browser's own menu away on a right click, for a host that shows one from `@context`. |
| `id`, `className` | | |

### Column types

A type decides how a column sorts and how it is drawn. Left out, it comes from
the first 200 rows, ignoring empty cells:

| Type | When | Sorted | Drawn |
|---|---|---|---|
| `number` | Every value is a number or reads as one (`'12.5'`). One `n/a` makes the column text. | Numerically | Right-aligned, in tabular figures, digit for digit |
| `date` | Every value is a `Date` or an ISO date string | By time | As given; a `Date` as ISO |
| `boolean` | Every value is `true` or `false` | `false` first | `true`, `false` |
| `json` | Every value is an object or an array | By its text | Compact JSON, cut at 160 characters |
| `string` | Anything else | Without regard to case, digits as numbers (`Item 9` before `Item 10`) | As it is |

`null` and `undefined` are shown as such, dimmed, sort last in both
directions, and are never matched by a filter.

## Events

| Event | Payload |
|---|---|
| `@sort` | `[{ key, direction }]`, in the order the columns are sorted by. Empty when unsorted. |
| `@filter` | `{ text, count }`. `count` is how many rows are left. |
| `@select` | `{ rows, indices }`. `indices` are positions in the rows you passed, not in the view. |
| `@cell` | `{ row, rowIndex, column, value }`. The active cell moved. `rowIndex` is -1 on the header. |
| `@activate` | `{ row, rowIndex }`. Enter on a cell, or a double click. |
| `@copy` | `{ what: 'cell' \| 'row', text }` |
| `@export` | `{ format: 'csv' \| 'json', text, rows }` |
| `@context` | `{ row, rowIndex, column, value, x, y }`. A right click. `x` and `y` are viewport coordinates, for placing a menu. |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `setRows(rows)`, `setColumns(columns)`,
`getView()` (the rows on show, in order), `getSelection()`, `clearSelection()`,
`setFilter(text)`, `setSort([{ key, direction }])`, `exportCsv()`,
`exportJson()` (both return the text without saving it), `download(format)`,
`scrollToRow(viewIndex)`, `focus()`, and `grid()` for the view itself.

## Keys

The grid is one tab stop. Inside it:

| Key | |
|---|---|
| Arrow keys | Move the active cell. Up from the first row reaches the header. |
| Home, End | First and last column of the row. |
| Cmd/Ctrl+Home, Cmd/Ctrl+End | First and last cell of the grid. |
| Page Up, Page Down | A screen of rows. |
| Space | Select or deselect the row. |
| Shift+Up, Shift+Down | Carry the selection along. |
| Cmd/Ctrl+A | Select every row on show. |
| Escape | Clear the selection. |
| Enter | Activate the row. |
| Cmd/Ctrl+C | Copy the cell as JSON. |
| Shift+Cmd/Ctrl+C | Copy the row as JSON. |
| Enter or Space, on a header | Sort by that column. With Shift, add it to the sort. |
| Alt+Left, Alt+Right, on a header | Narrow or widen that column. |

With the pointer: click a header to sort (ascending, descending, none), Shift
and click to sort by a further column, drag a header's right edge to resize,
double click the edge to fit the column. Click a row to select it, Cmd/Ctrl and
click to add or remove one, Shift and click for a range.

## Accessibility

The scroll container is the `grid`, with `aria-rowcount` and `aria-colcount`
for the whole of the data, not for what happens to be drawn. Rows carry
`aria-rowindex` and `aria-selected`, cells `aria-colindex`, headers
`aria-sort`. Focus stays on the grid and the active cell is named with
`aria-activedescendant`, because the element under a cell is recycled as the
grid scrolls. The row count, and the count after a filter, are announced from a
polite live region.

## Theming

Every colour is a CSS custom property that falls back to one of the library's
role tokens, so an app that has themed its roles has a matching grid in light
and in dark.

- Surfaces and text: `--stx-grid-bg`, `--stx-grid-fg`, `--stx-grid-header-bg`,
  `--stx-grid-header-fg`, `--stx-grid-line`, `--stx-grid-empty-fg`.
- State: `--stx-grid-hover`, `--stx-grid-selected`, `--stx-grid-accent` (the
  active cell, the sort mark, the resize edge).
- By type: `--stx-grid-number`, `--stx-grid-boolean`.
- The type: `--stx-grid-font`, `--stx-grid-mono`, `--stx-grid-font-size`,
  `--stx-grid-cell-padding`.

`--stx-grid-row-height` and `--stx-grid-header-height` are set by the grid from
its props. Change the props, not the variables: the arithmetic that decides
which rows exist depends on every row being exactly that tall.

## Measured

100,000 rows of 12 columns, headless WebKit on an Apple silicon Mac, timed
around the synchronous work with a forced layout inside the measurement
(`test/data-grid/data-grid-browser.test.ts` prints these on every run). The
clock in WebKit ticks in whole milliseconds.

| | |
|---|---|
| Elements in the grid | 236 (19 rows of 9 cells) |
| `setRows` | 6 ms |
| A vertical scroll step that replaces every row | 2 ms median, 3 ms p95 |
| A horizontal scroll step | under 1 ms median, 1 ms p95 |
| Sort by a number column | 24 ms |
| Sort by a text column of 100,000 distinct values | 170 ms the first time, 17 ms after |
| Sort by a text column of 10 distinct values | 16 ms |
| First filter (builds the search text) | 90 ms |
| A filter after that | 5 ms |
| A column resize step | 1 ms |
| CSV of all 100,000 rows | 110 ms, 14.5 MB |

## Limits of this version

- **A bound `:rows` is also written to the DOM.** stx reflects a bound value
  onto the component's element as an attribute, as JSON. The grid reads the
  real array and never parses that text, but for 100,000 rows it is 24.5 MB of
  attribute and about 15 ms to make, on every change. Hand a large list to
  `setRows()` instead, which does neither.
- **About 600,000 rows at the default row height.** The body is one element as
  tall as every row, and WebKit stops laying an element out at about 17 million
  pixels. A taller list needs the scroll position scaled, which this version
  does not do.
- **Rows are one height and cells one line.** Long text is cut with an
  ellipsis. Copy the cell, or widen the column, to read it all.
- **A column is fitted by counting characters,** not by measuring text, so a
  proportional font fits approximately.
- **Selection is by row.** There is no range of cells to select.
- **No pinned columns, no column reordering, no editing.**
- **Export saves through a link with a `download` attribute.** That works in a
  browser. Whether a given native web view honours it is up to its host;
  `exportCsv()` and `exportJson()` return the text for a host that saves the
  file itself.
