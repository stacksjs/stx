# ContextMenu

A menu on a right click: submenus, separators, disabled and checked items,
shortcuts shown, and the whole thing usable from the keyboard.

```html
<script client>
const items = [
  { label: 'Copy value', id: 'copy', shortcut: 'Mod+C' },
  { label: 'Copy path', id: 'copy-path', shortcut: 'Shift+Mod+C' },
  { separator: true },
  { label: 'Open in', children: [
    { label: 'Table', id: 'table' },
    { label: 'Graph', id: 'graph' },
  ] },
  { label: 'Delete', id: 'delete', danger: true },
]

function chosen(detail) {
  // detail.id is 'copy', detail.target the element that was clicked on.
}
</script>

<ContextMenu :items="items" @select="chosen($event)">
  <div>Right click anywhere in here.</div>
</ContextMenu>
```

The tag wraps the content it is the menu for and takes no box of its own
(`display: contents`). To build the items for whatever was clicked, bind a
function: `:items="menuFor"` is called with the target element and returns the
list. An empty list leaves the browser's own menu alone.

## How it works

| File | What it is |
|---|---|
| `core.ts` | Items and their ids, which item an arrow key or a typed letter lands on, where a menu goes to stay on screen, how a shortcut is written on this platform. No DOM. |
| `view.ts` | The DOM: one layer holding every open menu, real focus on the items, opening and dismissing. |
| `ContextMenu.stx` | The template, the styles, and the props and events. |

The layer is a popover where the browser has a top layer, so a menu is never
clipped by an `overflow` or misplaced by a transformed ancestor.
`@stacksjs/components/context-menu` exports the first two.

## Props

| Prop | Default | |
|---|---|---|
| `items` | `[]` | A list of items, or a function `(target) => items`. |
| `label` | `'Context menu'` | The accessible name of the menu. |
| `disabled` | `false` | A right click gets the browser's own menu. |
| `id`, `className` | | |

An item: `{ label, id?, shortcut?, disabled?, checked?, danger?, children?, value? }`,
or `{ separator: true }`. `checked` of `true` or `false` makes it a checkbox
item. `shortcut` is shown, not bound: `Mod+C` is drawn as `⌘C` on a Mac and
`Ctrl+C` elsewhere. An item without an `id` is named by its position (`3`,
`3.1`). Separators that divide nothing (first, last, or two in a row) are
dropped, so a list can be built from optional groups without tidying it.

## Events

| Event | Payload |
|---|---|
| `@select` | `{ item, id, path, target }`. `target` is the element the menu was opened on. |
| `@open` | `{ x, y, target, keyboard }` |
| `@close` | `{ reason }`: `select`, `escape`, `outside`, `blur`, `tab` or `api`. |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `open(at, items?)`, `close()`, `isOpen()`.
`at` is `{ x, y }` in the viewport, or an element to open under. `items`
replaces the menu's own for that one opening, which is how another component's
`context` event is answered:

```html
<JsonTree :value="tree" contextMenu @context="menu.open({ x: $event.x, y: $event.y }, itemsFor($event.node))" />
```

## Keys

| Key | |
|---|---|
| Menu key, Shift+F10 | Open the menu under the focused element, on its first item. |
| Up, Down | Move, skipping separators and wrapping at the ends. |
| Home, End | First and last item. |
| Right, Enter, Space | Open a submenu and move into it. |
| Left, Escape | Close a submenu and go back to the item that opened it. |
| Enter, Space | Choose the item. |
| Escape | Close the menu. Focus goes back to where it was. |
| Tab | Close the menu and move on. |
| A letter | Jump to the next item starting with it. Typing more narrows it. |

A disabled item can be reached and read, and does nothing. The menu is a
`role="menu"` of `menuitem` and `menuitemcheckbox` rows, with `aria-haspopup`
and `aria-expanded` on an item that opens a submenu, and `aria-keyshortcuts`
carrying the shortcut in words.

## Theming

`--stx-menu-bg` (the `panel` role), `--stx-menu-fg` (`fg`), `--stx-menu-fg-soft`
(`fg-soft`), `--stx-menu-line` (`line`), `--stx-menu-active` and
`--stx-menu-active-fg` (`accent-solid`, `accent-ink`), `--stx-menu-danger`
(`danger`), and `--stx-menu-radius`, `--stx-menu-item-radius`,
`--stx-menu-font-size`, `--stx-menu-min-width`.

## Limits of this version

- **Shortcuts are labels.** The menu shows them; binding the keys is the
  host's business.
- **No icons, radio groups or item descriptions.**
- **No safe triangle.** A submenu opens after a short pause on its item, and
  moving diagonally towards it across another item closes it.
- **A long press on a touch screen** opens the menu only where the engine
  sends a `contextmenu` event for it.
