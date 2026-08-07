# Adopting stx primitives

If your app was written before mid-2026, it probably hand-rolls things stx now
ships. This guide is for migrating that code back.

## Why this exists

Two production apps were audited — one ~6.5k lines, one ~5.1k — for every place
they reached past the framework into vanilla JS. Nearly every workaround mapped
to an stx primitive **that was already exported and delivered** ([#1843]).

The measurements are worth repeating, because they explain the shape of the
problem:

| Primitive | Reaches the built page | Times the app used it |
|---|---|---|
| `toast`, `modal`, `drawer` | yes | 0 |
| `stxConfirm`, `stxAlert` | yes | 0 |
| `useFetch`, `useQuery`, `watch` | yes | 0 |
| `useClickOutside`, `useFocus` | yes | 0 |
| `x-tooltip` | yes | 0 |

Meanwhile the same app called bare `confirm()` in five places and used `title=`
thirteen times.

So this is not a missing-feature problem. **It is a discovery problem, and the
reason is that the fallback works.** `confirm()` shows a dialog. `title=` shows
a tooltip. Nothing fails, so nothing prompts you to look for the framework
version. That is the hardest kind of gap to notice, and it is why the fix is a
tool rather than a changelog entry.

Most of these apps were also written while the runtime *delivery* layer was
broken ([#1804], [#1805], [#1819], [#1832]) — composables existed in source but
never reached the client. Falling back to vanilla JS was correct at the time.
Those bugs are fixed; the fallbacks stayed.

## Find them

```bash
stx codemod                                  # report across the project
stx codemod --rule route-params              # one rule
stx codemod --fix "resources/views/**/*.stx" # apply the safe rewrites
```

It reports by default and only edits with `--fix`, because most of these
rewrites are not mechanical.

## What it looks for

### Rewritable

| Hand-rolled | Primitive | Note |
|---|---|---|
| `confirm(msg)` | `await stxConfirm(msg)` | Only inside an `async` function |
| `title="…"` | adds `x-tooltip="…"` | Keeps `title` |

Both have a trap the tool is careful about, and you should be too if you migrate
by hand:

- **`confirm()` is synchronous; `stxConfirm()` returns a Promise.** So
  `if (stxConfirm(m))` is **always true** — a Promise is truthy. Rewritten
  blindly, every "Delete this?" becomes an unconditional yes. The codemod only
  rewrites where it can prove it is inside an `async` function, and reports the
  rest.
- **`title` is announced by screen readers; `x-tooltip` is not.** It sets no
  `role` and no `aria-*`. Replacing one with the other is an accessibility
  regression dressed up as an upgrade, so the codemod *adds* `x-tooltip` and
  keeps `title`.

### Report-only

These need a human, because the replacement depends on context the tool cannot
see — a route's parameter name, or how a component is structured.

| Hand-rolled | Primitive |
|---|---|
| `location.pathname.match(…)` | `useRoute()` · `useRouteParams()` · `useRouteParam(name)` |
| `new URLSearchParams(…)` + `history.replaceState` | `useSearchParams()` |
| `location.assign(…)` · `location.href = …` | `navigate(path)` · `goBack()` |
| `new AbortController()` around a hand `fetch` | `useFetch(url)` · `useAsyncData(key, fn)` |
| `setInterval(() => fetch(…), n)` | `useEventSource()` · `useSSE()` · `useWebSocket()` · `useChannel()` |
| `setTimeout` / `clearTimeout` debounce | `useDebounce(fn, ms)` · `useThrottle(fn, ms)` |
| `document.addEventListener('click', …)` to close a menu | `useClickOutside(ref, fn)` |
| `getElementById(…).focus()` | `useFocus(ref)` with `x-ref` |
| `navigator.clipboard` · `navigator.share` | `useClipboard()` · `useShare()` |
| `effect(() => { void a(); void b() })` | `watch(source, cb)` · `watchMultiple([…], cb)` |
| hand-built toast / confirm portal | `toast()` · `modal()` · `<Teleport>` |
| N signals + manual error flags per form | `useForm()` · `validateFields()` |

The detectors are deliberately narrow, and two of them exist in their current
form because a broader version produced false positives on the example corpus:
`setInterval(updateClock, 1000)` is a timer, not polling, and
`location.href = 'mailto:…'` cannot become `navigate()` at all. If you hit a
false positive, that is a bug worth reporting — a tool people learn to ignore
catches nothing.

## Migrating by hand

Rough order of value, based on how often each appeared:

1. **Route params** — the most common by far (~20 files in one app), and the
   worst, because hand-parsed URLs do not update on SPA navigation.
2. **`fetch` on mount** — 34 components in one app. `useFetch` already wires
   cancellation, loading and error state; hand-rolled versions are where the
   races live.
3. **Navigation** — `location.href` is a full document load. It throws away
   every store and the scroll position, which is usually not what was intended.
4. Everything else, opportunistically.

[#1843]: https://github.com/stacksjs/stx/issues/1843
[#1804]: https://github.com/stacksjs/stx/issues/1804
[#1805]: https://github.com/stacksjs/stx/issues/1805
[#1819]: https://github.com/stacksjs/stx/issues/1819
[#1832]: https://github.com/stacksjs/stx/issues/1832
