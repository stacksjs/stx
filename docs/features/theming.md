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
| `fg` | `text-fg` | gray-900 | gray-100 |
| `fg-strong` | `text-fg-strong` | gray-700 | gray-300 |
| `fg-muted` | `text-fg-muted` | gray-600 | gray-400 |
| `fg-soft` | `text-fg-soft` | gray-500 | gray-400 |
| `fg-subtle` | `text-fg-subtle`, `placeholder-fg-subtle` | gray-400 | gray-500 |
| `surface` | `bg-surface` | gray-50 | gray-800 |
| `surface-raised` | `bg-surface-raised` | gray-100 | gray-700 |
| `surface-sunken` | `bg-surface-sunken` | gray-200 | gray-700 |
| `line` | `border-line`, `divide-line` | gray-200 | gray-700 |
| `line-strong` | `border-line-strong`, `ring-line-strong` | gray-300 | gray-600 |
| `accent` | `text-accent`, `ring-accent` | blue-600 | blue-400 |
| `info` | `text-info`, `stroke-info` | blue-600 | blue-400 |
| `danger` | `text-danger` | red-600 | red-400 |
| `success` | `text-success` | green-600 | green-400 |
| `warning` | `text-warning` | yellow-600 | yellow-400 |

`accent` was indigo. The library had two competing accents — 73 blue uses
against 34 indigo, both meaning "primary" — and a role vocabulary cannot have
two, so blue won on count: the painted majority kept its appearance and the
indigo minority moved (`stacksjs/stx#1993`). `accent` and `info` therefore share
a default, which is deliberate — they are different *roles*, so pointing
`--stx-accent` at your brand does not touch informational emphasis.

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

¹ except `warning-ink`, which is `gray-900`: white on a yellow fill is about
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

The tokens are in stx's base theme, so they resolve in every app with no opt-in
— a component saying `text-fg-muted` cannot depend on your config. Each is
`var(--stx-<role>, <light value>)`, so if the variable block ever fails to reach
a page, light mode is still correct and dark mode degrades to the light colour
rather than to nothing.

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

Roughly 270 of the library's ~890 palette-shade uses still name a shade
directly. Three cases were deliberately left alone, because migrating them would
have changed appearance rather than preserved it:

- **A shade with no `dark:` twin.** Turning it into a token would *add*
  dark-mode behaviour it never had.
- **A pair whose dark twin is a different hue** — `text-neutral-900
  dark:text-blue-400`. That is a deliberate colour, not a shade of one role.
- **Hover states on solid fills.** A primary button darkens on hover in both
  modes, while the role token's dark value lightens. Folding them together made
  hovering a dark-mode button turn it paler than its resting state.

Where a component's pairing was already the dominant one, the migration is
appearance-preserving. 43 occurrences used a one-step-off pairing (say
`text-gray-900 dark:text-gray-200` where the library's dominant pairing is
`dark:text-gray-100`) and were normalized onto the role — a small, deliberate
consistency change.

Options 1 and 2 still cover everything, migrated or not, since they redirect the
palette those remaining classes resolve through.

See `packages/stx/src/theme-tokens.ts`, `packages/components/src/theme` and
`packages/components/test/theme-preset.test.ts`.
