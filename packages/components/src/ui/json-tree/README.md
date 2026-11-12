# JsonTree

An expandable inspector for a described value: a result, a parsed document, an
object graph. Keyboard navigation, copy as JSON, copy as a path, and a way to
say that a node can also be opened as a table, a graph or a preview. No
third-party tree underneath.

```html
<script client>
const result = state(null) // a TinkerValue, as @stacksjs/tinker sends it

function open(detail) {
  // detail.as is 'table', 'graph' or 'preview'; detail.node is what to show.
}
</script>

<JsonTree
  label="Result"
  height="100%"
  depth="2"
  :tinker="result()"
  @open="open($event)"
/>
```

A component's event hands its payload to the handler as `$event`, so `open`
above receives the detail object itself.

## How it works

The tree does not look at values. It is given a description of one: nodes that
each say what kind of thing they are, what the parent calls them and how they
read on one line. So it is not tied to a serializer, and a value that cannot
leave its process (a class instance, a cycle, a model) is shown as well as one
that can.

```ts
interface TreeNode {
  kind: string               // 'object', 'array', 'string', 'model', 'error', ...
  label?: string             // what the parent calls it
  preview?: string           // the value on one line
  value?: unknown            // a scalar's value, for copy
  children?: TreeNode[]
  more?: number              // children that exist but were not sent
  ref?: string               // the id of the node a cycle points back to
  id?: string                // needed only where a ref or the host points at it
  key?: string | number      // the path segment, when the label is not it
  openable?: string | string[]  // 'table' | 'graph' | 'preview' | your own
  meta?: unknown             // yours; never read
}
```

Three layers of code, each usable without the ones above it:

| File | What it is |
|---|---|
| `core.ts` | The model: which rows are visible, what is expanded, what a key does, paths, JSON. Also `fromValue(value)`, which describes a plain JavaScript value. No DOM and no stx. |
| `tinker.ts` | `fromTinkerValue(value, label?, { idPrefix? })`: a `@stacksjs/tinker` result as tree nodes. A structural copy of its type, so there is no dependency on that package. |
| `view.ts` | The DOM: draws the rows on screen and no others, and turns keys and clicks into changes. |
| `JsonTree.stx` | The template, the styles, and the props and events. |

`@stacksjs/components/json-tree` exports the first three for a host that mounts
a tree itself.

Every row is the same height, so the rows on screen are arithmetic on the
scroll position. About thirty row elements exist whatever the tree holds, and
each row index always lands on the same element, so scrolling by one row
rewrites one element. The model only walks containers that are expanded.

## Props

| Prop | Default | |
|---|---|---|
| `value` | | A `TreeNode`, or a list of them shown as several roots. Bind it: `:value="node()"`. |
| `tinker` | | A tinker result, adapted on the client. Bind it: `:tinker="result()"`. Used when there is no `value`. |
| `depth` | `1` | Containers nearer the root than this start expanded. `1` opens the root and leaves its children closed; `0` closes everything. |
| `rowHeight` | `22` | Pixels. |
| `height` | `'20rem'` | Any CSS length. `100%` fills a sized parent. |
| `label` | `'Value'` | The tree's accessible name. |
| `openable` | | A function, bound with `:openable`, `(node, path) => string \| string[] \| null`. Its answer replaces the node's own `openable`; `undefined` falls back to it. |
| `contextMenu` | `false` | The host shows its own menu on `@context`, so the browser's is kept away. |
| `id`, `className` | | |

A bound object is also written onto the component's element as JSON by stx,
whatever the component does with it. For the 5,001-row tree below that is 250 KB
of attribute, a fraction of a millisecond to produce. For a much larger value, give the tree
nothing and call `setValue(node)` or `setTinker(result)` on it instead.

## Events

| Event | Payload |
|---|---|
| `@select` | `{ id, node, path, pathText }`. The cursor moved. `path` is `['users', 0, 'name']`, `pathText` is `$.users[0].name`. |
| `@toggle` | The same, with `expanded`. |
| `@copy` | `{ what: 'value' \| 'path', text, path, node }`. The text is also put on the clipboard where the browser allows it. |
| `@open` | The select payload, with `as`: which of the node's `openable` kinds was chosen. |
| `@load-more` | The select payload for a container whose `more` row was activated. Answer with `appendChildren(id, nodes, more)`. |
| `@context` | The select payload, with `x` and `y`. A context click on a row. |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `setValue(node)`, `setTinker(result)`,
`expandAll(id?)`, `collapseAll()`, `expand(id)`, `collapse(id)`, `reveal(id)`
(expands whatever hides a node, moves the cursor to it and scrolls to it),
`appendChildren(id, nodes, more?)`, `select(id)`, `getSelected()`, `focus()`,
and `tree()` for the view itself, whose `model` is the `TreeModel`.

A row's id is the node's `id` when it has one and its position otherwise
(`0.2.1`: the second child of the third child of the first root).

## Keys

| Key | |
|---|---|
| Up, Down | The row above or below. |
| Right | Open a closed container; on an open one, go to its first child. |
| Left | Close an open container; otherwise go to the parent. |
| Home, End, PageUp, PageDown | |
| `*` | Open every sibling of the row. |
| Enter, Space | Toggle a container, load a `more` row, follow a cycle to the node it points at. |
| Shift+Enter | Open the node as the first of its `openable` kinds. |
| Cmd/Ctrl+C | Copy the value as JSON. |
| Shift+Cmd/Ctrl+C | Copy the path. |
| Any character | Jump to the next row whose label starts with what was typed. |

Focus stays on the tree and the current row is named with
`aria-activedescendant`, because a row that scrolls away stops existing and
cannot hold focus. Rows are `treeitem`s with their level, position, set size
and expanded state. The buttons on a row are for a pointer; each has a key
above.

## Copying

Copy value writes the JSON of what the tree holds for that node. Children that
were never sent (`more`) are not there and nothing is put in their place, so the
text is always valid JSON of what is present. A cycle is the text
`"[Circular]"`, a bigint or a non-finite number is a string, and `undefined` at
the top is the word `undefined`.

## Tinker results

`fromTinkerValue` covers every tag. A model shows its attributes, its loaded
relations as values, and two groups: `[hidden]` names the attributes the model
does not serialize, and `[relations]` lists what it declares. An error shows
its message, its frames, its cause and its own fields. Each container keeps
the serializer's object id as its node id (`t12`), which is what a `ref` names,
so following a cycle lands on the right node. Two results in one tree both
count from one: give each its own `idPrefix`.

By default a list of objects or models is `openable` as a `table`, a model or an
object or map holding other containers as a `graph`, and markup as a `preview`.

## Theming

Everything is a CSS custom property. Surfaces fall back to the library's role
tokens, and value colours to the syntax tokens `<CodeBlock>` and `<CodeEditor>`
draw with, so a value reads like the code that produced it. Dark follows the
`.dark` class, as the role tokens do.

- The tree: `--stx-tree-bg`, `--stx-tree-fg`, `--stx-tree-muted`,
  `--stx-tree-hover`, `--stx-tree-active`, `--stx-tree-focus`, `--stx-tree-line`.
- The values: `--stx-tree-key`, `--stx-tree-string`, `--stx-tree-number`,
  `--stx-tree-keyword` (booleans, null, undefined), `--stx-tree-type` (models,
  markup), `--stx-tree-function`, `--stx-tree-comment` (cycles, cuts, more),
  `--stx-tree-error`.
- The type: `--stx-tree-font`, `--stx-tree-font-size`, `--stx-tree-indent`.
  The row height is the `rowHeight` prop, because the view needs the number.

## Measured

Headless WebKit on a Mac, 1,000 records of five rows each (5,001 rows open),
a 400px viewport, layout forced after every step. WebKit's clock ticks in whole
milliseconds, so the means are the better numbers.

| | |
|---|---|
| Show the value (1,001 rows) | 2 to 3 ms |
| Expand all (5,001 rows) | 3 to 5 ms |
| An arrow key | mean 0.2 ms, p95 1 ms |
| A scroll repaint, 730px at a time | mean 1.5 ms, p95 2 ms |
| Row elements in the document | 32 |

`test/json-tree/json-tree-browser.test.ts` prints these on every run.

## Limits of this version

- **One line per value.** A long string is cut on its row at 400 characters;
  copy gives all of it. There is no multi-line string view.
- **One cursor, no multi-select.**
- **No search.** Type-ahead finds labels among the rows that are visible.
- **Expand all walks everything under the row.** Fine at tens of thousands of
  nodes; a host with millions should send less and use `more`.
