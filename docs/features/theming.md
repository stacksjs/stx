# Theming `@stacksjs/components`

The bundled components name palette shades directly — `bg-gray-100`,
`text-gray-600`, `ring-indigo-600` — and ship `dark:` variants for dark mode.
That is fine until your app has its own palette, at which point `<Button>` looks
like it belongs to a different product.

Most of them now name a **role** instead — `text-fg-muted`, `bg-surface`,
`border-line` — and those roles are CSS custom properties you can move at
runtime. What follows is every way to redirect the library's colours, in
increasing order of how much you have to opt into.

## 0. Set a role variable — runtime, nothing to configure

The components use role tokens, and every role is a CSS variable the framework
declares for you. Overriding one re-themes every component that uses it, with no
config file and no rebuild:

```css
:root {
  --stx-accent: #e11d48;
  --stx-surface: #fbfbfd;
  --stx-line: #e4e4e7;
}

.dark {
  --stx-surface: #18181b;
  --stx-line: #3f3f46;
}

[data-tenant="acme"] {
  --stx-accent: #0ea5e9;
}
```

### The roles

| Token | Utility examples | Light | Dark |
|---|---|---|---|
| `fg` | `text-fg` | neutral-900 | neutral-100 |
| `fg-strong` | `text-fg-strong` | neutral-700 | neutral-300 |
| `fg-muted` | `text-fg-muted` | neutral-600 | neutral-400 |
| `fg-soft` | `text-fg-soft` | neutral-500 | neutral-400 |
| `fg-subtle` | `text-fg-subtle`, `placeholder-fg-subtle` | neutral-400 | neutral-500 |
| `surface` | `bg-surface` | neutral-50 | neutral-800 |
| `surface-raised` | `bg-surface-raised` | neutral-100 | neutral-700 |
| `surface-sunken` | `bg-surface-sunken` | neutral-200 | neutral-700 |
| `panel` | `bg-panel` | white | neutral-800 |
| `field` | `bg-field` | white | neutral-700 |
| `surface-hover` | `hover:bg-surface-hover` | neutral-100 | neutral-700 |
| `surface-raised-hover` | `hover:bg-surface-raised-hover` | neutral-200 | neutral-600 |
| `surface-sunken-hover` | `hover:bg-surface-sunken-hover` | neutral-300 | neutral-600 |
| `field-hover` | `hover:bg-field-hover` | neutral-50 | neutral-600 |
| `line` | `border-line`, `divide-line` | neutral-200 | neutral-700 |
| `line-strong` | `border-line-strong`, `ring-line-strong` | neutral-300 | neutral-600 |
| `accent` | `text-accent`, `ring-accent` | blue-600 | blue-400 |
| `secondary` | `text-secondary` | purple-600 | purple-400 |
| `info` | `text-info`, `stroke-info` | cyan-600 | cyan-400 |
| `danger` | `text-danger` | red-600 | red-400 |
| `success` | `text-success` | green-600 | green-400 |
| `warning` | `text-warning` | yellow-600 | yellow-400 |

`info` is cyan and `secondary` is purple. `info` was briefly blue — identical
to `accent`, which is a vocabulary with two names you cannot tell apart. It also
hid a misuse: every `info` in the library was a *selected* or *active* state (a
calendar's chosen day, a listbox's checkmark, the current page, a variant
literally named `primary`) reaching for `info` only because the hue was blue
while `accent` was indigo. Those are `accent` now, which left `info` to the two
components that genuinely mean informational — a Notification toast and a Badge
chip — and both already painted cyan.

`secondary` exists because Badge, Progress and Spinner all have a variant by
that name and none of the five statuses is it. Without a role it was the one
variant in an otherwise role-driven map that stayed purple while everything
around it moved — silent, and visible only to whoever's badge came out wrong.

`accent` was indigo. The library had two competing accents — 73 blue uses
against 34 indigo, both meaning "primary" — and a role vocabulary cannot have
two, so blue won on count: the painted majority kept its appearance and the
indigo minority moved (`stacksjs/stx#1993`). `accent` and `info` therefore share
a default, which is deliberate — they are different *roles*, so pointing
`--stx-accent` at your brand does not touch informational emphasis.

### A field in its error state

Four more roles, danger only, because an error is the only field state the
library has. They mirror the resting branch name for name, so the two states
read as the same four decisions:

| Resting | In error | Light | Dark |
|---|---|---|---|
| `ring-line-strong` | `ring-danger-line` | red-300 | red-600 |
| `text-fg` | `text-danger-fg` | red-900 | red-300 |
| `placeholder-fg-subtle` | `placeholder-danger-fg-subtle` | red-300 | red-500 |
| `focus:ring-accent` | `focus:ring-danger-focus` | red-500 | red-400 |

`danger-focus` gets *lighter* in dark mode, unlike a solid fill: a focus ring
has to stay visible against a dark field, which is the same reason coloured
text lightens and a button fill does not.

Not one set per status. A warning or success field state does not exist in the
library, so four more families would be sixteen names measured from nothing —
the pattern is obvious if one ever arrives.

### Fills, hovers and ink

A painted component needs more than a text colour. Each status has five more
roles, so a themed fill brings its hover state and its label with it:

| Token | Utility examples | Light | Dark |
|---|---|---|---|
| `<status>-solid` | `bg-accent-solid` | 500 | 600 |
| `<status>-solid-hover` | `hover:bg-accent-solid-hover` | 600 | 700 |
| `<status>-ink` | `text-accent-ink` | white¹ | white¹ |
| `<status>-soft` | `bg-accent-soft` | 100 | 900 |
| `<status>-soft-ink` | `text-accent-soft-ink` | 800 | 200 |

¹ except `warning-ink`, which is `neutral-900`: white on a yellow fill is about
1.9:1, which fails at any text size.

Why each exists:

- **`-solid`** is a filled button. It goes one step *darker* in dark mode, not
  lighter, because that is what the components paint and because a fill that
  lightens stops reading as the same button. (Coloured *text* does the
  opposite — 600 → 400 — which is why the two cannot share a role.)
- **`-solid-hover`** is a role rather than a `hover:` on the base token,
  because `hover:bg-accent-solid` would just repaint the same colour. An app
  that re-points a fill has to be able to re-point what it becomes on hover.
- **`-ink`** is the text *on* a fill. Components wrote `text-white` beside every
  solid background, which is right for the stock hues and unreadable the moment
  an app points a fill at something light. The ink moves with the fill.
- **`-soft` / `-soft-ink`** are a tinted fill and its text — a badge, a status
  chip, an inline callout. Two roles because the text has to move with the
  tint, or a re-themed chip becomes illegible.

So a primary button is `bg-accent-solid hover:bg-accent-solid-hover
text-accent-ink` with no `dark:` anywhere, and one variable re-themes it:

```css
:root { --stx-accent-solid: #e11d48; --stx-accent-solid-hover: #be123c; }
```

`panel` and `field` are both white in light mode, and that is the point: the
vocabulary had no name for a white surface — `surface` is neutral-50 — so every
card, menu, dialog and form control in the library stayed a literal
`bg-white dark:bg-neutral-800` and ignored your theme. They differ in dark mode
because the library draws a real distinction: a panel sits at neutral-800 and a
control inside it at neutral-700, one step lighter, or the input disappears
into the panel it is in.

### A hovered neutral surface

Each neutral surface has a `-hover` partner, for the same reason the statuses
do: `hover:bg-surface` on a `bg-surface` element repaints the same colour, so
the hover has to be its own role.

| Element | Base | Hover |
|---|---|---|
| A row, an accordion header, a nav item, a menu entry | `bg-panel` or nothing | `hover:bg-surface-hover` |
| A chip or card that is already raised | `bg-surface-raised` | `hover:bg-surface-raised-hover` |
| A control on a well or track | `bg-surface-sunken` | `hover:bg-surface-sunken-hover` |
| A bordered input or secondary button | `bg-field` | `hover:bg-field-hover` |

There is no `panel-hover`: `surface-hover` is neutral-100/neutral-700, which
reads against white, neutral-50, neutral-800 and neutral-900 alike, so a
transparent row works wherever the host puts it.

Before these existed, thirteen interactive surfaces each invented their own
pair, and four invented one that **cannot be seen**:

```html
<!-- neutral-800 -> neutral-800 in dark mode: no hover at all -->
<div class="bg-panel hover:bg-surface">
<!-- neutral-700 -> neutral-700 -->
<div class="bg-surface-raised hover:bg-surface-sunken">
```

`surface` shares a dark value with `panel`, and `surface-raised` with
`surface-sunken`. Both class strings read correctly and both highlight in light
mode, which is why they survived review. Each pair in the table above differs
from its base in *both* modes, and that relationship — not any particular shade
— is what `role-token-coverage.test.ts` asserts, so re-pointing one of these
variables cannot reintroduce an invisible hover.

### Why `neutral` and not `gray`

The *step* each neutral role names was measured from the library; the *family*
is a house decision. `neutral` is achromatic — chroma 0 at every step — while
`gray` carries a blue tint, and the two agree on lightness to within about 1%
everywhere. So the choice is purely about saturation and changes no contrast
ratio.

These roles were gray-backed, which left the library mixing both. Everything is
`neutral` now, including the shades that could not move onto a role, so there is
one neutral rather than two that differ only by a tint nobody chose.

The tokens are in stx's base theme, so they resolve in every app with no opt-in
— a component saying `text-fg-muted` cannot depend on your config. Each is
`var(--stx-<role>, <light value>)`, so if the variable block ever fails to reach
a page, light mode is still correct and dark mode degrades to the light colour
rather than to nothing.

## 0b. Shape — a radius by what the thing is

Colour was only half of it. An app whose buttons are pills got `rounded-md`,
and `className` is no escape hatch for a radius for the same reason it was not
one for a colour: `rounded-md` and `rounded-full` are single-class selectors of
equal specificity, so the winner is whichever lands later in the generated
stylesheet — not something a call site controls.

Three shape roles, each a CSS variable with today's value as the fallback:

| Token | Utility | Default | For |
|---|---|---|---|
| `control` | `rounded-control` | 0.375rem | buttons, inputs, selects, textareas |
| `panel` | `rounded-panel` | 0.5rem | cards, dialogs, menus, toasts |
| `pill` | `rounded-pill` | 9999px | chips and badges |

```css
:root {
  --stx-radius-control: 9999px;   /* every button and input becomes a pill */
  --stx-radius-panel: 1rem;
}
```

Directional variants work, so `rounded-t-control` is available for a component
with one rounded edge.

Two things deliberately left alone:

- **Genuine circles.** An avatar, a spinner and a skeleton keep
  `rounded-full`, because a circle is not a theming decision and re-pointing
  the pill radius should not turn them into squares.
- **Dropdown menus use `panel`, not `control`**, even though they happened to
  use the same 0.375rem radius. Otherwise an app asking for pill-shaped buttons
  would get pill-shaped menus.

### Height comes from padding

The controls carried a fixed height beside their padding — `px-4 py-2 h-10` —
so an app passing its own `py-1.5` got the padding it asked for and the height
it did not. The heights are gone; padding decides, and `className` can set it.

The fixed heights were also wrong on three of five button sizes. Measured
against the theme's own line-heights, `lg` declared 3rem around 3.25rem of
content and `xl` 3.5rem around 3.75rem, so the two largest had been quietly
eating a quarter-rem of their own padding. The padding now reproduces all five
previous heights exactly — 1.75, 2, 2.5, 3 and 3.5rem — so nothing moved on
screen.

## 1. Redefine a shade — build time, works today, no opt-in

A project's `css.config.ts` `theme.colors` **deep-merges** over the base
palette, and stx generates CSS by scanning the rendered page. So redefining a
shade re-themes every component that names it, with no component edits:

```ts
// css.config.ts
export default {
  theme: {
    colors: {
      gray: { 600: '#3f3f46', 900: '#18181b' },
      indigo: { 600: '#e11d48' },
    },
  },
}
```

Shades you do not name keep their defaults — this merges, it does not replace.
(Tailwind treats a non-`extend` `theme.colors` as a replacement; stx does not,
because generation here is driven by scanning the page rather than globbing
sources, so carrying the base palette along is free and dropping it would mean
one added token silently kills `bg-red-500` everywhere.)

This is the right seam for a fixed brand palette. It is resolved at build time.

## 2. `stxThemePreset` — runtime variables and semantic names

When the colours have to change *after* the build — a per-tenant theme, a user
accent colour, a live theme editor — you need CSS custom properties. The preset
rebuilds the palette so every themed shade resolves through one, with today's
value as the fallback:

```ts
// css.config.ts
import { stxThemePreset } from '@stacksjs/components/theme'
import { defaultConfig } from '@stacksjs/ts-css/engine'

export default {
  theme: {
    colors: stxThemePreset(defaultConfig.theme.colors),
  },
}
```

Nothing changes visually — every entry keeps its stock value behind the
variable. Now you can move any of them at runtime:

```css
:root {
  --stx-color-gray-600: #52525b;
  --stx-surface: #fbfbfd;
  --stx-accent: #e11d48;
}

.dark {
  --stx-color-gray-600: #a1a1aa;
  --stx-surface: #18181b;
}

[data-tenant="acme"] {
  --stx-accent: #0ea5e9;
}
```

`themeVariableNames(defaultConfig.theme.colors)` returns every variable the
preset reads, generated from the same source as the palette so the list cannot
drift from what is actually emitted.

The preset covers the **palette**. The **roles** in section 0 come from stx's
base theme and need no opt-in — a second list of role names here would disagree
with that one the moment either moved.

### The trade

An opacity modifier on a variable-backed colour compiles to `color-mix()`
instead of a baked `oklch(… / 0.5)`, because the value is not known at build
time. `bg-black/4` and `hover:bg-white/6` keep working; the emitted CSS is
different, and `color-mix()` needs a 2023-or-later browser.

That is why this is opt-in rather than the framework default: it is a real
change to the generated CSS, and it is your call to make.

## 2b. `<Heatmap>`'s colour ramp

The heatmap paints a canvas rather than emitting utility classes, so it follows
none of the above. Its ramp is five CSS custom properties, each falling back to
the chosen scheme's own colour — set them and both the legend and the plot
follow:

```css
:root {
  --stx-heatmap-stop-1: #f7f7fd;
  --stx-heatmap-stop-2: #d6d5f0;
  --stx-heatmap-stop-3: #a29fdd;
  --stx-heatmap-stop-4: #6b66c4;
  --stx-heatmap-stop-5: #2e2a7a;
}
```

Built-in schemes, via `colorScheme`: `default` (sequential blue),
`fire`, `cool`, `grayscale`, `diverging`, and `rainbow`.

`default` used to be the rainbow. A rainbow is the one ramp a sequential scale
should not use — the transitions through cyan and yellow are perceptually much
sharper than the ones around them, so readers see bands in continuous data, and
it is not monotonic in lightness, so it collapses in greyscale and under common
colour vision deficiencies. `rainbow` is still there for anyone who asked for it
by name.

Reach for `diverging` only when the data has a meaningful midpoint. Its middle
is a neutral grey, not a hue — a hue in the middle is the rainbow's mistake in
miniature.

## 3. Override the component's classes

Every component takes a `className` prop, appended after its own classes:

```html
<Button className="bg-brand-600 hover:bg-brand-500">Save</Button>
```

Good for one-offs. Not a theme.

## What is not migrated

174 of the library's ~890 palette-shade uses still name a shade directly, in 40
of the 102 components. Three cases are deliberately left alone, because
migrating them would change appearance rather than preserve it:

- **A shade with no `dark:` twin.** Turning it into a token would *add*
  dark-mode behaviour it never had.
- **A pair whose dark twin is a different hue** — `text-neutral-900
  dark:text-blue-400`. That is a deliberate colour, not a shade of one role.
- **A surface that is dark in both modes.** CodeBlock's copy chip floats over
  highlighted code, whose background comes from the syntax theme rather than
  from a utility, so it is `bg-neutral-800 hover:bg-neutral-700` with no `dark:`
  at all. A role whose light value is white would break it, and an always-dark
  surface role for one call site would be worse than naming the shade — the
  same call as Switch's off state.

Hover states on solid fills *were* on this list, on the reasoning that a
primary button darkens on hover in both modes while a role token's dark value
lightens. That is true of the text roles and is exactly why `-solid-hover`
exists as its own role; nothing is left out on those grounds.

Where a component's pairing was already the dominant one, the migration is
appearance-preserving. 43 occurrences used a one-step-off pairing (say
`text-gray-900 dark:text-gray-200` where the library's dominant pairing is
`dark:text-gray-100`) and were normalized onto the role — a small, deliberate
consistency change.

Options 1 and 2 still cover everything, migrated or not, since they redirect the
palette those remaining classes resolve through.

See `packages/stx/src/theme-tokens.ts`, `packages/components/src/theme` and
`packages/components/test/theme-preset.test.ts`.
