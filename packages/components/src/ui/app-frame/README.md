# App frame

The frame of a document app: a sidebar of rows and tiles, the card the
document sits on, a command bar, and panels that float over the window. Built
to Arc's measurements (a 228pt sidebar, 36pt address field, 47pt favourites
four across, 40pt rows, a card inset 10pt), from the native primitives, so the
same component renders:

- on the web, where `View`, `Text` and `Pressable` render as HTML;
- in a native Mac window (Craft's AppKit host), with hover handled by the host;
- on a phone or tablet, where nothing hovers: rows grow to the 44pt touch
  target and show their buttons, and the command bar takes the full width
  under 720pt.

Every value a component draws is a prop it reads live (`useReactiveProp`), so
a component can stand in a `:for`. The ones that come in dozens (`SidebarRow`,
`TileGrid`'s tiles) take one object rather than a prop per field, since every
prop is a binding and a signal of its own.

| Component | What it is | Emits |
|---|---|---|
| `SidebarRow` | A tab, folder or action row: `:item`, `:theme` | `select`, `close`, `menu`, `drop`, `rename`, `imageerror` |
| `TileGrid` | Favourites: `:items`, `:columns` (4) | `select`, `menu`, `drop`, `imageerror` |
| `AddressField` | The address as a pill: `:text`, `:secure`, `:controls` | `open`, `copylink`, `controls` |
| `SidebarDivider` | A hairline with a quiet action: `:action` | `action` |
| `SpaceSwitcher` | A row of icons, one current: `:items`, `:active` | `select`, `menu` |
| `ContentCard` | The document's card: `:progress`, `:ring`, default slot | |
| `FloatingPanel` | A HUD panel: `:width`, `:place`, default slot | |
| `CommandBar` | Search field and results: `:value`, `:results`, `:highlighted` | `input`, `keydown`, `submit`, `pick` |

```stx
<script client>
const rows = state([{ label: 'Inbox', symbol: 'tray', active: true }])
const touch = useMediaQuery('(hover: none)')
</script>

<SidebarRow :for="row in rows()" :key="row.label" :item="row" :theme="{ tint: '#11143f', touch: touch() }" @select="open(row)" />
```

The types for `item`, `items`, `results` and `place` are exported beside the
components: `SidebarRowItem`, `TileGridItem`, `SpaceSwitcherItem`,
`CommandBarResult`, `FloatingPanelPlace`.
