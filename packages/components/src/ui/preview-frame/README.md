# PreviewFrame

An HTML string shown as a page: a mail, a rendered view, any markup. In a
sandboxed frame that cannot reach the page around it, at the size of a phone, a
tablet or a desktop, in light or dark.

```html
<script client>
const mail = state('<h1>Welcome</h1><p>Thanks for signing up.</p>')
</script>

<PreviewFrame :html="mail()" viewport="phone" scheme="dark" title="Welcome mail" />
```

## How it works

The markup goes into an `<iframe srcdoc>` with a `sandbox` attribute.

- **Isolation.** The sandbox is empty by default: no scripts, no forms, and an
  origin of its own. `scripts` adds `allow-scripts` and nothing else, so a
  page's scripts run but still have a unique origin: no access to the host's
  DOM, storage or cookies, and none of their own. `allow-same-origin`, top
  navigation and popups are never granted. Links are sent to a new window,
  which the sandbox refuses, so a click cannot navigate the preview away.
- **Colour scheme.** The scheme is set on the frame element, as its
  `color-scheme`, on the host's side. Chromium hands a frame's `color-scheme`
  to the page inside as its `prefers-color-scheme`, so there the page follows
  with no script and no cooperation, and a change does not reload it. WebKit
  (Safari, and a Craft window, which is a WKWebView) does not, so there the
  scheme is written into the document instead: see Limits. Which of the two
  an engine does is asked of it once, with a frame of the host's own.
- **Viewport.** The frame is laid out at the device's real size and drawn
  smaller to fit, so the page's own media queries see 390 pixels for a phone
  whatever the box is. It is never enlarged.
- **Reload.** The frame is made new for every load. A frame's sandbox is read
  when its document is created, so a new frame is the only way to be sure of
  the permissions, and it makes reload start from nothing.

A fragment (`<h1>Hi</h1>`) is wrapped in a page that declares both colour
schemes, so bare markup goes dark on a dark preview. A whole document is left
as written: a mail with no dark styles is shown light, as a mail client would.

| File | What it is |
|---|---|
| `core.ts` | The document that goes into the frame, the sandbox value, the viewport presets and the arithmetic of fitting one. No DOM. |
| `view.ts` | The frame itself, its size, its scheme, and the toolbar. |
| `PreviewFrame.stx` | The template, the styles, and the props and events. |

`@stacksjs/components/preview-frame` exports the first two.

## Props

| Prop | Default | |
|---|---|---|
| `html` | `''` | The markup: a whole document or a fragment. |
| `viewport` | `'fill'` | `fill`, `phone` (390 × 844), `tablet` (820 × 1180) or `desktop` (1280 × 800). |
| `frameWidth`, `frameHeight` | | A viewport of its own size, in CSS pixels. Both are needed, and they win over `viewport`. |
| `landscape` | `false` | Turn a phone or tablet on its side. |
| `scheme` | `'auto'` | `light`, `dark`, or `auto` to follow the host page (a `dark` or `light` class on an ancestor, then the system). |
| `scripts` | `false` | Let the page's own scripts run. |
| `forms` | `false` | Let a form in the page submit. |
| `toolbar` | `true` | Show the viewport, rotate, scheme and reload controls. |
| `title` | `'Preview'` | The frame's accessible name. |
| `height` | `'24rem'` | A CSS length for the whole component, toolbar included. |
| `id`, `className` | | |

## Events

Every payload is the state: `{ viewport, width, height, landscape, scale, scheme, effectiveScheme }`.

| Event | |
|---|---|
| `@load` | The page has loaded. |
| `@reload` | A reload was asked for, from the toolbar or `reload()`. |
| `@viewport` | The viewport changed. |
| `@scheme` | The colour scheme changed. |

## Methods

From `componentApi(target)` (`@stacksjs/components/component-api`), where
`target` is the component's element, its id or a selector: `reload()`, `setHtml(html)`,
`setViewport(name, { landscape, width, height })`, `setScheme(scheme)`,
`getState()`.

## Keys

The viewport buttons are one radio group: Tab reaches the chosen one and the
arrow keys move through them. Rotate, the scheme toggle and Reload are buttons;
the toggle reports `aria-pressed` for dark.

## Theming

`--stx-preview-bg` (the `panel` role), `--stx-preview-fg` (`fg`),
`--stx-preview-fg-soft` (`fg-soft`), `--stx-preview-stage` (`surface-sunken`,
the ground a device sits on), `--stx-preview-line` (`line`),
`--stx-preview-active` (`accent`), `--stx-preview-radius` and
`--stx-preview-font-size`.

## Limits of this version

- **The page can load from the network.** The sandbox isolates the page from
  the host; it does not stop an `<img>` or a stylesheet being fetched. Markup
  from an untrusted source can therefore still tell its sender it was opened.
- **Nothing comes back from the page.** There is no channel for its height,
  its title or its errors. With `scripts` on, a page can `postMessage` its
  parent and the host can listen for it.
- **No device chrome, pixel ratio or touch emulation.** A viewport is a size.
- **In WebKit the scheme is written into the page, with what that costs.**
  Every `(prefers-color-scheme: …)` in the markup's style sheets, `media`
  attributes and scripts is settled to the scheme asked for, and the root is
  given that `color-scheme`. So: a change of scheme loads the page again
  (its scroll position and anything typed into it are lost, and `@load` fires
  again); a style sheet the page fetches from elsewhere is not rewritten and
  still follows the system; and a script sees a `matchMedia` that never
  changes. A preview left on `auto` under a host with no `dark` or `light`
  class is not touched: its page follows the system by itself. Chromium needs
  none of this and gets none of it (stacksjs/stx#2186).
