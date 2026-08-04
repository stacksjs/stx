# Chrome Web Store listing

Copy for the submission form. Everything here is ready to paste; the only steps
that need a maintainer are the account, the screenshots and the upload itself.

Produce the artifact with:

```bash
cd packages/devtools-extension
bun run package     # → release/stacks-devtools-<version>.zip
```

---

## Name

Stacks DevTools

## Summary (132 char limit)

> Inspect stx signals, scopes, stores and the reactive graph — plus the `:if` decision trace and query timeline — from DevTools.

(124 characters.)

## Description

Stacks DevTools adds a panel to Chrome DevTools for debugging stx applications.

stx renders on the server and hydrates with signals, so the two questions that
matter when something looks wrong are *which scope owns this element* and *why
did this binding not update*. The browser's own tools answer neither. This panel
does.

**What you can inspect**

- **Component tree** — every `data-stx-scope` on the page, with the element it
  is bound to and whether it hydrated.
- **Scope** — the signals in scope for the selected component, live, with their
  current values.
- **Stores** — every registered store, its state, and which components read it.
- **Reactive graph** — what depends on what, filterable, so a cascade of
  re-renders has a visible cause.
- **Mutation log** — every signal write in order, with the value before and
  after.
- **`:if` decision trace** — for each conditional, the expression, the value it
  evaluated to, and the branch that won. This is the fastest route to the most
  common stx bug: a condition that reads a value instead of a signal.
- **Query timeline** — `useFetch`/`useQuery` requests with status and duration.

**Privacy**

The extension reads devtools state from the page you are inspecting and displays
it. It makes no network requests, collects no analytics, and stores nothing off
your machine. It requests no host permissions beyond the content script needed
to read the page it is attached to.

## Category

Developer Tools

## Language

English

## Screenshots (1280×800 or 640×400)

Generate clean captures with:

```bash
bun run preview
```

Suggested set, in order — each should show the panel with a real app behind it:

1. Component tree with a scope selected
2. Scope view showing live signal values
3. Reactive graph with a filter applied
4. `:if` decision trace
5. Query timeline

## Privacy practices form

- **Single purpose**: Provide a DevTools panel for inspecting stx application
  state.
- **Permission justification — `content_scripts` / `<all_urls>`**: the panel
  reads stx runtime state from the inspected page. A DevTools extension cannot
  know in advance which origin a developer will inspect, so the content script
  matches all URLs; it only ever reads, and only when DevTools is open.
- **Remote code**: none. All code is bundled in the package.
- **Data collection**: none.

## Post-submission

- [ ] Firefox listing (`browser_specific_settings` in the manifest, then AMO)
- [ ] Edge listing (accepts the same MV3 package)
