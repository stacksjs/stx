# GraphView

Nodes and edges, laid out automatically, in an SVG that can be panned, zoomed,
walked with the arrow keys and grown one node at a time. No third-party graph
or layout library underneath; both layouts are in `core/`.

```html
<script client>
const nodes = [
  { id: 'User', label: 'User', kind: 'model', detail: 'users', expandable: true },
  { id: 'Post', label: 'Post', kind: 'model' },
  { id: 'Team', label: 'Team', kind: 'model' },
]
const edges = [
  { source: 'User', target: 'Post', label: 'hasMany' },
  { source: 'User', target: 'Team', label: 'belongsTo' },
]

function expand(detail) {
  // detail.node is the node to load more around. Answer with addNeighbours.
}
</script>

<GraphView label="Model relations" height="24rem" :nodes="nodes" :edges="edges" @expand="expand($event)" />
```

A component's event hands its payload to the handler as `$event`, so `expand`
above receives the detail object itself.

It is made for two pictures:

- **A model relation graph.** A node per model, an edge per relation, the
  relation kind (`hasMany`, `belongsTo`) as the edge label. The layered layout
  reads left to right from the model you started at.
- **An object graph.** A node per object, an edge per property that holds
  another object, the property name as the label. Cycles are fine: an edge that
  closes one is drawn against the flow, and an object that holds itself gets a
  loop.

## How it works

Three layers of code, each usable without the ones above it:

| File | What it is |
|---|---|
| `core/` | The model (`GraphModel`), the layered and force layouts, edge geometry and the viewport arithmetic. No DOM and no stx, so it runs anywhere. |
| `view.ts` | `GraphCanvas`: the SVG, the pointer, wheel and key handling, selection and the status line. |
| `GraphView.stx` | The template, the toolbar, the styles, and the props and events. |

`@stacksjs/components/graph-view` exports the first two for a host that mounts
a graph itself or wants a layout on its own.

A node's size comes from the length of its label, not from measuring text, so a
layout never touches the DOM. One SVG group carries the pan and zoom, so moving
the view writes one attribute however many nodes there are.

## Nodes and edges

| Node field | |
|---|---|
| `id` | Required, unique. |
| `label` | What is written in the node. The id when left out. Cut with an ellipsis past about 28 characters; the full text is the tooltip. |
| `detail` | A second, quieter line. |
| `kind` | A free word, put on the node as `data-kind` for a stylesheet to colour by. |
| `expandable` | `true` draws a `+` mark. `false` means there is nothing more to load: the node is opened instead of expanded. |
| `data` | Anything; it comes back with the node in every event. |

| Edge field | |
|---|---|
| `source`, `target` | Node ids. An edge whose ends are not both in the graph is ignored. |
| `label` | Drawn at the middle of the edge. |
| `directed` | Default `true`. `false` draws no arrowhead. |
| `id` | Left out, it is `source->target` plus `:label`. Two edges with the same id are one edge. |

Several edges between the same two nodes are drawn beside each other.

## Props

| Prop | Default | |
|---|---|---|
| `nodes`, `edges` | `[]` | Bound with `:nodes` and `:edges`. A new array replaces the graph and fits it. |
| `layout` | `'layered'` | `layered` points every edge one way. `force` lets nodes push apart and edges pull together. |
| `direction` | `'LR'` | The flow of the layered layout: `LR` or `TB`. |
| `selected` | | The id of the selected node. |
| `height` | `'24rem'` | Any CSS length. `100%` fills a sized parent. |
| `minZoom`, `maxZoom` | `0.1`, `4` | |
| `toolbar` | `true` | The zoom, fit and layout buttons. |
| `contextMenu` | `false` | Keep the browser's own menu away on a right click, for a host that shows its own from `@context`. |
| `animate` | `true` | Nodes glide to a new layout. Always off under `prefers-reduced-motion`. |
| `label` | `'Graph'` | The accessible name. |
| `id`, `className` | | |

## Events

| Event | Payload |
|---|---|
| `@select` | `{ node, neighbours }`. `node` is null when the selection is cleared. |
| `@expand` | `{ node }`. A double click, or Enter or Space on the selected node. Answer with `addNeighbours`. |
| `@open` | `{ node }`. The same gestures on a node with `expandable: false`, or with Cmd/Ctrl held, or the `o` key. |
| `@move` | `{ node, x, y }`. A node was dragged; the position is in graph units. |
| `@viewport` | `{ x, y, k }`. A point on screen is the graph point times `k`, plus `x` and `y`. |
| `@context` | `{ node, x, y }`. A right click; `node` is null on the background, `x` and `y` are client coordinates. |
| `@layout` | `{ layout }` |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `setGraph(nodes, edges)`,
`addNeighbours(id, nodes, edges)`, `updateNode(id, patch)`, `select(id)`,
`focusNode(id)`, `fit()`, `zoomIn()`, `zoomOut()`, `setLayout(name)`,
`getViewport()`, `graph()` for the model and `canvas()` for the view itself.

`addNeighbours` is the answer to `@expand`. It adds what is new and ignores
what the graph already has, so the reply can name nodes that are already drawn.
The new nodes start on the node they came from and move out to their places.
It returns the ids it actually added. Follow it with
`updateNode(id, { expandable: false })` to take the `+` off.

## Keys

With the graph focused. It is one stop in the tab order.

| Key | |
|---|---|
| Arrow keys | Select the nearest node in that direction. A node straight ahead beats a closer one off to the side. With nothing selected, the node nearest the middle. |
| Enter, Space | Expand the selected node. |
| `o`, or Cmd/Ctrl+Enter | Open it. |
| `+`, `-` | Zoom in and out. |
| `0` | Fit the whole graph. |
| `f` | Centre the selected node. |
| Escape | Clear the selection. |

## Pointer

| Gesture | |
|---|---|
| Drag the background | Pan. |
| Drag a node | Move it. In the force layout it then stays where it was put. |
| Scroll | Pan. |
| Pinch, or scroll with Ctrl or Cmd | Zoom about the pointer. |
| Click | Select. On the background, clear the selection. |
| Double click | Expand. |

## Accessibility

The graph is a `role="application"` region described as a graph, with the
label you give it. The selected node is its `aria-activedescendant`, each node
is named with its label and how many connections it has, and a polite live
region says where the selection landed and what it connects to: "User, 2
connections: Post, Team". The toolbar is a real toolbar of real buttons, and
the layout switch reports which layout is pressed.

## The layouts

**Layered.** Cycles are broken by turning round the edges a depth-first walk
finds pointing back at its own path. Each node goes one layer past its deepest
predecessor. Each layer is reordered by where its neighbours sit, a few times
each way, keeping the order with the fewest crossings. Unconnected parts are
stacked beside each other. Nothing is random: the same graph comes out the same.

**Force.** Every node pushes every other and every edge pulls its ends
together, with a temperature that cools. Starting positions come from a seeded
source, so it is deterministic too. An expansion starts warm: the nodes that
already have a place keep it while the new ones find theirs, and are then moved
only as far as it takes to stop two boxes overlapping.

## Theming

Everything is a CSS custom property that falls back to one of the library's
role tokens, so an app that has themed its roles already has a matching graph,
in light and dark.

- `--stx-graph-bg`, `--stx-graph-fg`, `--stx-graph-muted`, `--stx-graph-line`
- `--stx-graph-node-bg`, `--stx-graph-node-line`, `--stx-graph-edge`
- `--stx-graph-accent` for the selection, `--stx-graph-dim` for how far the
  rest steps back
- `--stx-graph-font`, `--stx-graph-font-size`

Colour a kind of node from your own stylesheet:

```css
[data-stx-graph-view] .stx-gv-node[data-kind="model"] rect { fill: var(--stx-accent-soft); }
```

## Measured

Headless WebKit, 200 nodes and 300 edges, with a forced layout read after each
step. WebKit's clock is a millisecond coarse.

| | |
|---|---|
| Layered layout | 1 to 2 ms |
| Force layout, from cold | about 40 ms |
| First render, layout included | 7 ms |
| A pan step | 1.1 ms mean, 2 ms at the 95th percentile |
| A zoom step | 1.4 ms mean, 2 ms at the 95th percentile |
| Expanding a node by ten | 6 ms layered, 11 ms force |

## Limits of this version

- **Every node is in the DOM.** Nothing is culled when it is off screen. That
  is right for hundreds of nodes; thousands want a canvas.
- **The force layout compares every pair of nodes.** About 40 ms at 200 nodes,
  and it grows with the square of the count.
- **Edges in the layered layout are single curves.** An edge that spans several
  layers can pass behind a node in between; there are no routing points.
- **Label width is estimated.** A character is taken to be 7 pixels wide, so a
  label in a script with much wider characters can touch the edge of its node.
- **No touch pinch.** One finger pans and drags; a trackpad pinch zooms, two
  fingers on a touch screen do not.
