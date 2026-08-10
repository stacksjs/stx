# Chrome Web Store listing

Everything the submission form asks for, written down so it does not have to be
reinvented at upload time and so the wording stays the same across the Chrome,
Edge and Firefox listings. Prepared for stacksjs/stx#1754.

The one step that cannot be done from here is the upload itself: it needs the
maintainer's Chrome Web Store developer account.

## Producing the artifact

```bash
cd packages/devtools-extension
bun run package        # → stacks-devtools-<version>.zip
```

The manifest's version is stamped from `package.json` at build time. It used to
be hardcoded, and had drifted to `0.2.70` while the package was at `0.2.170` —
the store rejects an upload whose version does not exceed the published one, so
that would have failed on the second submission with a number nobody could
explain.

The archive has `manifest.json` at its root rather than inside a `dist/` folder.
Uploading the wrapper directory is the standard first-attempt rejection.

## Name

```
Stacks DevTools
```

## Summary (132 characters max)

```
Inspect stx signals, scopes, the reactive graph, the :if decision trace, and the query timeline.
```

95 characters.

## Description

```
Stacks DevTools adds a panel to Chrome DevTools for debugging stx applications.

It shows you:

• Signals and scopes — every reactive value on the page, its current contents,
  and which scope owns it. Drill into an object or an array rather than reading
  a stringified blob.

• The reactive graph — what depends on what, filterable, so you can see why a
  value recomputed and what it will take down with it.

• The :if decision trace — which branch each conditional took and the value it
  read to decide. A binding that silently does nothing is the most common stx
  bug, and this is the view that names the cause.

• Stores — the contents of every defineStore, live, including state that
  survives SPA navigation.

• A mutation log and a query timeline — what changed, in what order, and what
  the page fetched while it happened.

The panel refreshes live as the page runs. It reads devtools state from the
page it is attached to and nothing else.
```

## Category

Developer Tools

## Privacy

Single purpose:

```
Debugging stx applications by displaying their reactive state in a DevTools
panel.
```

Data use disclosure — **none of the categories apply**, and the justification
if asked:

```
The extension reads reactive state from the page currently open in DevTools and
renders it in the DevTools panel. It sends no network requests, collects no
telemetry, stores nothing off-device, and has no analytics. `permissions` in the
manifest is an empty array.
```

Remote code: **no**. Everything executes from the packaged bundle.

Host permissions justification (`<all_urls>` on the content script):

```
The panel must be able to attach to whichever page the developer has open, and
that page can be on any host — a local dev server, a staging domain, or
production. The content script only relays messages between the page and the
DevTools panel; it does not read page content otherwise.
```

## Screenshots

`bun run preview` renders the panel against fixture data for clean captures.
The store wants 1280×800 or 640×400. Worth capturing, in this order:

1. The signals/scopes tree with a scope expanded
2. The reactive graph with a filter applied
3. The `:if` decision trace
4. The store panel
5. The query timeline

## Also worth listing

- **Edge Add-ons** takes the same package and the same copy.
- **Firefox** needs `browser_specific_settings.gecko.id` added to the manifest
  before it will accept an upload. Not added here, because adding it to the
  shared manifest with no Firefox listing to point at buys nothing.
