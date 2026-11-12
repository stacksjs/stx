# SplitPane

Two or more panes with a separator to drag between each pair. Side by side or
stacked, with minimum sizes, keyboard resizing, and a layout that is remembered.

```html
<SplitPane storageKey="workbench" minSize="200" @resize-end="saved($event)">
  <div>editor</div>
  <div data-min-size="320">results</div>
</SplitPane>
```

The children of the tag are the panes. Nest one `<SplitPane>` in a pane of
another, with the other direction, for a three-way layout.

## How it works

A layout is a list of fractions that add up to one. Each pane gets its fraction
as its `flex-grow` from a basis of nothing, so the browser divides whatever
length there is in those proportions and a window that changes size needs no
script. Pixels come in only where a person does: a drag is so many pixels, and
a pane must not be smaller than so many.

| File | What it is |
|---|---|
| `core.ts` | The arithmetic: shares to fractions, moving a divider, fitting a layout inside its limits. No DOM. |
| `view.ts` | The DOM: puts the separators in, sizes the panes, turns a drag or a key into a new layout, stores it. |
| `SplitPane.stx` | The template, the styles, and the props and events. |

`@stacksjs/components/split-pane` exports the first two for a host that splits
an element of its own.

## Props

| Prop | Default | |
|---|---|---|
| `direction` | `'horizontal'` | `horizontal` puts the panes side by side, `vertical` stacks them. |
| `sizes` | equal | Shares, one per pane: `[30, 70]`, `[1, 2, 1]`, or the text `30,70`. Changing it later sets the layout. |
| `minSize` | `48` | The least a pane can be, in pixels. |
| `step` | `16` | Pixels an arrow key moves a separator. Shift moves five times as far. |
| `storageKey` | | Keeps the layout in local storage under `stx:split-pane:<key>`. A stored layout wins over `sizes` on the way up. |
| `label` | `'Resize panes'` | The accessible name of a separator. |
| `height` | `'100%'` | A CSS length. A split fills its box, so the box needs a height. |
| `id`, `className` | | |

On a pane itself: `data-size` (its share, used when `sizes` is left out),
`data-min-size` and `data-max-size` (pixels).

## Events

| Event | Payload |
|---|---|
| `@resize` | `{ sizes, pixels, index, source }` on every change. `sizes` are fractions, `index` is the separator that moved (-1 when set from outside), `source` is `pointer`, `keyboard`, `reset` or `api`. |
| `@resize-end` | The same, once: at the end of a drag, after a key, after a reset. |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `getSizes()`, `setSizes(sizes)`, `reset()`.

## Pointer and keys

| | |
|---|---|
| Drag a separator | Resize. The pane next to the separator shrinks first; at its minimum, the one beyond it gives. |
| Double click | Back to the starting layout. |
| Arrow keys | Move the focused separator by `step`. Left and right when side by side, up and down when stacked. |
| Shift+arrow | Five steps. |
| Home, End | As far as it goes each way. |
| Enter | Back to the starting layout. |

A separator is a `role="separator"` that takes focus, with `aria-valuenow`,
`aria-valuemin` and `aria-valuemax` as the percentage of the pane before it,
and `aria-controls` naming that pane.

## Theming

`--stx-split-line` (falls back to the `line` role), `--stx-split-line-active`
(the `accent` role), `--stx-split-line-size` (the drawn thickness, `1px`) and
`--stx-split-grab` (the strip that can be grabbed, `9px`).

## Limits of this version

- **Panes are read once.** Adding or removing a pane after it has mounted is
  not picked up.
- **No collapse.** A pane stops at its minimum; there is no snap to closed.
- **Left to right.** The arrow keys are not mirrored in a right-to-left page.
