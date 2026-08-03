# Postline strict DOM follow-up

Observed while verifying Postline's native Craft launch on 2026-08-03.

STX strict mode correctly reports legacy DOM access in Postline's app shell and
page scripts. These are application migration tasks, not evidence of a compiler
regression, but they should stay visible until Postline uses signals,
composables, and template directives throughout.

## App shell

`resources/layouts/postline.stx` currently reports:

- `document.querySelector()` and `document.querySelectorAll()` calls
- `window.location` and `window.history` access
- `window.addEventListener()` calls
- `window.localStorage` access

Replace these with `useRef()`, navigation helpers, `useEventListener()`, and
`useLocalStorage()` as the shell is converted to a client script.

## Postline page scripts

The rendered Postline page bundle also reports:

- `document.querySelector()` and `document.createElement()` calls
- `document.addEventListener()` calls
- `window.location`, `window.history`, and `location.href` navigation
- `window.confirm()`

Replace imperative element construction with structural template directives,
move navigation to the router helpers, and use the STX dialog API for destructive
confirmation.

## Verification target

Run Postline with strict STX checks enabled and require a native `/composer`
load to produce no DOM API diagnostics before closing this follow-up.

## Diagnostic source mapping

Observed again while adding Postline's Listening and Blog workspaces on
2026-08-03. A single rebuild printed the same strict diagnostic block several
times, and every block identified the source only as `postline.stx`. Because a
rendered app page combines `resources/layouts/postline.stx` with the active view
and its client script, that generated basename is not enough to locate the
reported line in source.

Strict diagnostics should:

- carry the original template path and original line/column through compilation
- identify whether the violation came from a layout, component, or routed view
- coalesce identical violations during one rebuild so watch-mode output contains
  one actionable report per source location

Add a regression fixture with a layout and two views that each contain a
different prohibited DOM call. Assert that the watcher reports all three real
source paths once and that subsequent fragment compiles do not replay unchanged
diagnostics.

## Scoped runtime bootstrap ordering

Observed while reloading Postline's `/accounts` page in a fresh browser document
on 2026-08-03. The compiled response contains a generated scoped block that
immediately calls `window.stx.mount(...)`, but the page has not loaded or
initialized the STX browser runtime before that block executes. Every full-page
reload therefore reports:

```text
TypeError: Cannot read properties of undefined (reading 'mount')
```

The generated runtime bootstrap must execute before scoped client scripts, or
those scripts must be deferred until the runtime is ready. Add a full-page
rendering fixture with a layout and a scoped client block, then assert that the
document loads without an exception and the block mounts exactly once.
