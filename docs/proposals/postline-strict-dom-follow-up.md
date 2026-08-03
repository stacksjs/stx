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
