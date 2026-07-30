# Sidebar Spaces

Arc-style sidebars: instead of one list, a stack of whole **scenes** you swipe
between. Each space has its own pinned tiles, its own folders and rows, its own
bottom action, and its own color.

```html
<script server>
const spaces = [
  {
    id: 'personal',
    label: 'Personal',
    icon: 'i-f7-house-fill',
    tint: 'green',
    sections: [
      { id: 'notes', items: [
        { id: 'routines', label: 'Routines', icon: 'i-f7-folder-fill', count: 2, children: [
          { id: 'sunday-reset', label: 'Sunday reset' },
        ] },
      ] },
    ],
    action: { label: 'New Note' },
  },
  {
    id: 'development',
    label: 'Development',
    icon: 'i-f7-star-fill',
    tint: 'blue',
    pinned: [{ id: 'github', label: 'GitHub', icon: 'i-f7-chevron-left-slash-chevron-right' }],
    sections: [
      { id: 'work', items: [{ id: 'stacks', label: 'Stacks', icon: 'i-f7-folder-fill' }] },
    ],
    clear: { label: 'Clear' },
    action: { label: 'New Tab' },
  },
]
</script>

<Sidebar :spaces="spaces" space="personal" spacePersistKey="app.space" showSpaceAdd />
```

That is the whole integration. There is no carousel wiring, no per-space markup
and no color bookkeeping — `<Sidebar :spaces>` swaps its single scrollable list
for the swipe track and defaults `theme` to `arc`.

Everything the macOS sidebar already does still applies inside a space:
disclosure, counts, icon tints, route-derived selection, arrow-key navigation,
collapse and persistence.

## Switching spaces

| Input | Behavior |
|---|---|
| Two-finger horizontal trackpad swipe | Tracks the gesture live, settles on release |
| Touch or pen drag | Same, with an 8px axis lock |
| Click a rail icon | Jumps, with the crossfade |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>←</kbd> / <kbd>→</kbd> | Previous / next space |
| <kbd>←</kbd> / <kbd>→</kbd> while a rail button has focus | Previous / next space |

A mouse drag deliberately does **nothing**. In a sidebar, press-and-move is far
more likely to be a text selection or a sloppy click than a swipe.

Every space is rendered up front, side by side on a track `n × 100%` wide, so
switching is a transform rather than a re-render. That is what lets the next
space follow the finger at 1:1, and what lets each space keep its own scroll
position and disclosure state. Off-screen spaces are `inert`, so <kbd>Tab</kbd>
never walks through rows you cannot see.

Release commits on either a third of a panel of travel or a flick in the
direction already being travelled. Past the first or last space the track keeps
answering the finger but compresses towards an asymptote, the way a
`UIScrollView` does at the end of a list.

`prefers-reduced-motion: reduce` drops the settle animation and the color
crossfade; the switch still happens, just instantly.

## Color

A space names **one seed color** and everything is mixed from it:

```ts
{ tint: 'blue' }               // a macOS system color name
{ tint: '#ff6b6b' }            // any CSS color
{ tint: 'oklch(70% 0.15 20)' }
```

Both take the identical path, so a brand color is not a second-class citizen.
The mixing happens in CSS via `color-mix(in oklab, …)`, which buys three
things:

- the browser interpolates in a perceptually even space, so a yellow space and
  a blue space land at the same apparent lightness instead of yellow washing
  out;
- the result is a real `<color>`, so the panel **crossfades** between spaces
  instead of cutting;
- both light and dark palettes resolve up front and ship together, so CSS picks
  between them and a dark-mode space is already correct in the server-rendered
  HTML.

Everything in the sidebar inherits that color — rows, section headers, counts,
the search field, the footer — so a space reads as a space rather than as a
gray list on a colored background.

For exact control, pass a full palette instead of a seed:

```ts
{
  tint: {
    light: { from: '#e6f0ff', to: '#c9deff', ink: '#12314f', accent: '#0a6ed1' },
    dark: { from: '#0e1b28', to: '#070d14', ink: '#dbe9f7', accent: '#5aa9ee' },
  },
}
```

### Custom properties

The pane publishes four properties, registered with `@property` so they
animate. Anything inside a space can read them:

| Property | Use |
|---|---|
| `--stx-space-from` / `--stx-space-to` | Panel gradient stops |
| `--stx-space-ink` | Text color the space inherits |
| `--stx-space-accent` | Space title icon, active rail icon, focus rings |

## Events

Emitted as bubbling DOM events, so the page listens on the `<Sidebar>` even
though they originate several components deeper:

| Event | Detail |
|---|---|
| `spaceChange` | `{ id, index, source }` — `source` is `swipe`, `switcher`, `keyboard`, `native`, `restore` or `api` |
| `spaceAdd` | — (the rail's `+`, shown by `showSpaceAdd`) |
| `spaceAction` | `{ spaceId, actionId, role }` — `role` is `action` or `clear` |
| `pinnedClick` | `{ id, href, event }` |

```html
<Sidebar :spaces="spaces" @spaceChange="onSpaceChange($event)" />
```

## Props

On `<Sidebar>`:

| Prop | Default | |
|---|---|---|
| `spaces` | `[]` | The scenes. Passing any switches the sidebar into spaces mode. |
| `space` | first | Id of the space to open on. |
| `showSpaceSwitcher` | `true` | The bottom rail. |
| `showSpaceAdd` | `false` | Trailing `+` in the rail. |
| `spaceAddLabel` | `'New space'` | |
| `spacePersistKey` | — | `localStorage` key remembering the last space. |

On a space:

| Field | |
|---|---|
| `id` | Required. |
| `label` / `icon` | Title above the rows, and the rail icon. |
| `tint` | Seed color or a full palette. |
| `pinned` | Favorites grid: `[{ id, label, icon \| image, iconColor, href }]`. |
| `sections` | Row groups — identical in shape to a plain `<Sidebar>`'s. |
| `action` | Primary row at the foot: `{ label, icon?, id? }`. |
| `clear` | Small action on the rule above it. |

Pinned tiles carry no `data-sidebar-item`, so the Sidebar controller's selection
and arrow-key navigation skip them: a tile is a shortcut, not a place in the
list.

## Composing directly

`<Sidebar :spaces>` is the one-liner. The pieces are separately usable when you
want a different shell around them:

```html
<SidebarSpaces :spaces="spaces" space="personal" :showSwitcher="false" />
```

`<SidebarSpaces>` applies the palette to the nearest `[data-stx-sidebar]`
ancestor, falling back to its own root when used standalone.
`<SidebarSpace>`, `<SidebarSpaceSwitcher>` and `<SidebarPinned>` are the parts
it renders.

## Native (Craft)

Both integrations are feature-detected and are a no-op in a plain browser.

**Gestures.** A webview's `wheel` events carry no phase information, so the web
path infers the gesture: it claims one only when the first event is
unambiguously horizontal, and ends it on a short idle gap. When the host holds
the real `NSEvent` it forwards the phases instead —
`{ axis, phase, deltaX, velocityX, momentum }` via `window.craft.gestures.onSwipe` —
and those supersede the heuristic the moment one arrives. The wheel listener
stays bound either way, so a host that never emits still swipes.

**Native switcher.** `window.craft.nativeUI.createSpacesSidebar()` lets the host
own the rail — a segmented control in the window toolbar, a Touch Bar strip, a
menu. The space list is published to it and whatever it selects is followed.

The low-level `@craft-*` directives cover the same ground for templates that
drive the native sidebar directly:

```html
<@craft-sidebar variant="arc" selectedSpace="dev">
  <@craft-sidebar-space id="dev" label="Development" icon="star" tint="blue">
    <@craft-sidebar-section id="repos" header="Repos">
      <@craft-sidebar-item id="stacks" label="Stacks" />
    </@craft-sidebar-section>
  </@craft-sidebar-space>
</@craft-sidebar>
```

Its web fallback stacks the spaces behind a rail rather than reimplementing the
swipe — that belongs to `<SidebarSpaces>`, and a second copy here would only
diverge.

## Example

`packages/components/examples/sidebar-arc-spaces.stx` recreates Arc itself:
window chrome, URL strip, favorites grid, a folder of tabs, and four spaces.

```bash
cd packages/components && bun ../stx/bin/cli.ts dev examples/sidebar-arc-spaces.stx
```
