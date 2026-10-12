# Table Component

Responsive table component with sorting and styling options.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
      <TableHeader>Email</TableHeader>
      <TableHeader>Role</TableHeader>
    </TableRow>
  </TableHead>

  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### A caption

A table's accessible name comes from its `<caption>`. `caption` renders one as
the table's first child, visually hidden by default; `captionVisible` shows it.

```stx
<Table caption="Recent workouts">…</Table>
<Table caption="Recent workouts" captionVisible>…</Table>
```

### Sortable columns

A sortable header renders its label inside a `<button type="button">`, so it is
reachable by Tab and operated by Enter or Space, and the button emits `click`.
`sort` (`'asc'`, `'desc'` or `''`) sets `aria-sort` on the `<th>`
(`ascending`, `descending`, `none`) and follows the page when bound.

```stx
<script client>
const direction = state('asc')
function flip() { direction.set(direction() === 'asc' ? 'desc' : 'asc') }
</script>

<TableHeader sortable :sort="direction()" @click="flip()">Date</TableHeader>
```

### Row headers

Every `TableHeader` carries `scope`, `col` by default. Use `scope="row"` for a
header at the start of a body row.

```stx
<TableRow>
  <TableHeader scope="row">Monday</TableHeader>
  <TableCell>Easy run</TableCell>
</TableRow>
```

### Density

Cells read the density tokens, so an app sets its table spacing without a
`className`: `--stx-cell-px` (both rows), `--stx-cell-py`, `--stx-cell-text`,
`--stx-cell-leading`, and `--stx-cell-head-py`, `--stx-cell-head-text`,
`--stx-cell-head-leading` for the header row. See
[theming](../../../../../docs/features/theming.md).

## Props

### Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `caption` | `string` | `''` | The table's accessible name, rendered as `<caption>` |
| `captionVisible` | `boolean` | `false` | Show the caption instead of hiding it visually |
| `striped` | `boolean` | `false` | Passed to the slot |
| `hoverable` | `boolean` | `true` | Passed to the slot |
| `className` | `string` | `''` | Extra classes on the `<table>` |

### TableHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scope` | `'col' \| 'row' \| 'colgroup' \| 'rowgroup'` | `'col'` | Which cells the header heads |
| `sortable` | `boolean` | `false` | Render the label as a sorting button that emits `click` |
| `sort` | `'asc' \| 'desc' \| ''` | `''` | Current direction, as `aria-sort` |
| `className` | `string` | `''` | Extra classes on the `<th>` |

## Features

- Responsive design
- Sortable columns, operable from the keyboard, with `aria-sort`
- Captions and header `scope` for screen readers
- Striped rows
- Hover effects
- Dark mode support
