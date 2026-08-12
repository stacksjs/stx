# Theming `@stacksjs/components`

The bundled components name palette shades directly — `bg-gray-100`,
`text-gray-600`, `ring-indigo-600` — and ship `dark:` variants for dark mode.
That is fine until your app has its own palette, at which point `<Button>` looks
like it belongs to a different product.

There are three ways to redirect those colours, in increasing order of how much
you have to opt into.

## 1. Redefine a shade — build time, works today, no opt-in

A project's `crosswind.config.ts` `theme.colors` **deep-merges** over the base
palette, and stx generates CSS by scanning the rendered page. So redefining a
shade re-themes every component that names it, with no component edits:

```ts
// crosswind.config.ts
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
// crosswind.config.ts
import { stxThemePreset } from '@stacksjs/components/theme'
import { defaultConfig } from '@cwcss/crosswind'

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

### Role tokens

The preset also adds names for what a colour is *for*, not just what it is.
These work as ordinary utilities — `bg-surface`, `text-fg-muted`,
`border-line`, `ring-accent`:

| Token | Variable | Falls back to |
|---|---|---|
| `surface` | `--stx-surface` | `gray-50` |
| `surface-raised` | `--stx-surface-raised` | `gray-100` |
| `surface-sunken` | `--stx-surface-sunken` | `gray-200` |
| `fg` | `--stx-fg` | `gray-900` |
| `fg-muted` | `--stx-fg-muted` | `gray-600` |
| `fg-subtle` | `--stx-fg-subtle` | `gray-400` |
| `line` | `--stx-line` | `gray-200` |
| `line-strong` | `--stx-line-strong` | `gray-300` |
| `accent` | `--stx-accent` | `indigo-600` |
| `accent-hover` | `--stx-accent-hover` | `indigo-500` |
| `danger` | `--stx-danger` | `red-600` |
| `success` | `--stx-success` | `green-600` |
| `warning` | `--stx-warning` | `yellow-500` |

Each role falls back through the shade variable to the stock value, so an app
that moves only the palette still moves the roles with it.

`themeVariableNames(defaultConfig.theme.colors)` returns every variable the
preset reads, generated from the same source as the palette so the list cannot
drift from what is actually emitted.

### The trade

An opacity modifier on a variable-backed colour compiles to `color-mix()`
instead of a baked `oklch(… / 0.5)`, because the value is not known at build
time. `bg-black/4` and `hover:bg-white/6` keep working; the emitted CSS is
different, and `color-mix()` needs a 2023-or-later browser.

That is why this is opt-in rather than the framework default: it is a real
change to the generated CSS, and it is your call to make.

## 3. Override the component's classes

Every component takes a `className` prop, appended after its own classes:

```html
<Button className="bg-brand-600 hover:bg-brand-500">Save</Button>
```

Good for one-offs. Not a theme.

## Current limitation

The components themselves still name palette shades (`text-gray-600`), not role
tokens (`text-fg-muted`). Both routes above work regardless — options 1 and 2
redirect the palette those classes resolve through. But an app cannot yet say
"every border in the library comes from `--stx-line`" and have it apply, because
the components do not distinguish a gray that is a border from a gray that is
muted text.

Migrating them is a per-occurrence judgement across 903 uses in 62 files, so it
is being done deliberately rather than by search-and-replace. Components written
from here on should use the role tokens.

See `packages/components/src/theme` and
`packages/components/test/theme-preset.test.ts`.
