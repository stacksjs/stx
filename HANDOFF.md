# stx issue sweep — August 2026

What changed in the framework between `v0.2.156` and now, written for the people
and agents working on apps built on it. The issue queue went from fifteen open
to one; this is what each of them turned out to be and what you have to do about
it.

**If you read one section, read [Things that change your app](#things-that-change-your-app).**

---

## Things that change your app

Ordered by how likely they are to bite you.

### 1. Upgrade if you use `stx typecheck` or `stx codemod` — they never worked in any published build

`await import('bun')` minified into the identifier `awaitPromise`, which does not
exist. Both commands died before reading a single file, in every install
including the 0.2.170 tarball on npm:

```
$ bun node_modules/@stacksjs/stx/dist/cli.js codemod
ReferenceError: awaitPromise is not defined
```

Not a syntax error — it parses cleanly and fails at runtime, which is why
nothing caught it. Fixed (#1896), and the guard now *runs* the built CLI rather
than importing from `src`, where the construct was always valid.

### 2. Route guards now fail closed

A middleware name that does not resolve returns `passed: false` and answers 500,
where it previously fell through as if it had passed. The error names the
middleware, so it is greppable.

**Most likely thing to bite:** `defineMiddleware('name', fn)` with the arguments
in that order silently never registered before. It now fails loudly, which is
the point, but it will surface on upgrade (#1891). `mode: 'client'` is gone from
`MiddlewareMode` — it could never run.

### 3. A page can handle its own form POST

```stx
<script server>
export async function action({ form }) {
  if (!String(form.email).includes('@'))
    return { errors: 'Enter a valid email address.', values: form.email }
  return { redirect: '/welcome' }
}
</script>
<form method="POST">
  <input name="email" value="{{ values }}">
  <p>{{ errors }}</p>
</form>
```

Runs on the dev server and the production server. Redirects answer **303**, so a
reload does not resubmit. A static build cannot run one — there is no server to
receive a POST — and now says so with a warning naming the route (#1847).

Two corrections to folklore, both checkable in a minute: `action`/`method` on a
`<form>` have always passed through, and `@submit` does **not** force
`preventDefault` (only the `.prevent` modifier does). So
`<form action="/x" method="POST" @submit="handler">` has always progressively
enhanced.

### 4. Builds are reproducible, and a `new Date()` in a server block no longer freezes

`compileTemplate` executed server scripts at build time and baked whatever they
produced into the HTML. Two builds of an unchanged page, 30ms apart:

```
build1=<p>2026-08-10T12:05:07.563Z</p>
build2=<p>2026-08-10T12:05:07.635Z</p>
```

Every visitor saw the moment the build ran, forever. An expression reading a
server-declared name is now a placeholder resolved per request (#1895).

Server scripts still **run** at build time — loops and conditionals need real
values to produce structure. Only the values defer.

### 5. `emails/` is no longer routed

`resources/views/emails/` was scanned as pages: `GET /emails/welcome` served the
template, `navigate('/emails/welcome')` type-checked, and SSG wrote it to HTML
and put it in `sitemap.xml`. Now excluded (#1897). `errors/` is deliberately
still routed — `errors/404.stx` and `errors/500.stx` are real pages.

### 6. Responses are compressed

Brotli quality 5, off the main thread. Nothing to do; noted because a page that
looked too big probably was not. Measured on 1.19 MB of HTML: 178 KB in 11.8 ms.
(q11 reaches 146 KB and costs 1359 ms — 115× the CPU for 18% of the bytes, hence
q5.)

### 7. `reactive()` in a client script is a real proxy now

It was `var reactive = state`, so `reactive({n:0}).n` was `undefined` forever.
Code that treated `reactive(x)` as a signal — calling it, or `.set()` — breaks,
but that usage could only ever have been a synonym for `state()`.

---

## Reactivity: which primitives to use

**`state` / `derived` / `effect` is canonical.** It is what the client runtime
puts on `window.stx`, what a `<script client>` block sees as bare identifiers,
and what stx's own composables and stores are written against — the only set
that reads the same in a module, in a component and in a template.

`ref` / `reactive` / `computed` / `watch` / `watchEffect` remain exported and
supported, for code ported from Vue. **They are no longer a trap:** all six
pairings across the two families were checked, and four were silently inert —
`ref()` with `effect()` did nothing, and so did `state()` with `watchEffect()`.
One shared dependency tracker fixed that (#1885), and `batch()` now covers `ref`
and `reactive` writes too.

The one trap that survives: `ref()` returns a `.value` object, `state()` returns
a callable signal. Not interchangeable at the call site.

**Still three systems, not one.** The client runtime is generated as a template
literal and owns its own copy; no module can import it. Signals created in a
module are invisible to the runtime and vice versa. See CLAUDE.md item 40.

---

## Typed server → client data

The old bridge published a server binding if its name *happened to appear* in
the client source. Declare instead:

```stx
<script server>
const liveNow = await countLive()
defineClientPayload({ liveNow, range })
</script>
<script client>
const label: string = liveNow   // Type 'number' is not assignable to type 'string'
</script>
```

- **Declared** → published in full, and **typed**, inferred from the server block
  with no annotation to drift (#1868).
- **Not declared** → still published by name-scraping, typed `any`, and
  `stx typecheck` warns naming what is crossing.
- A name the payload does not publish is an **error** — at runtime it is absent.

So `typeof liveNow === 'number' ? liveNow : 0` can go.

---

## `stx typecheck` is worth turning on now

It was reporting **438 diagnostics across 268 `.stx` files** in this repo, and
was *blind* on 48 of the 95 bundled components — `{{ }}` inside `<script client>`
is a TypeScript syntax error, and a parse failure suppresses every other
diagnostic in that file. It now reports **0**, with the two genuine survivors
fixed (a single-quoted string spanning lines; a misplaced quote putting a value
where a key belonged).

Also fixed: template expressions are checked against real types, runtime globals
are typed rather than `any`, and `defineClientPayload` is no longer itself
"Cannot find name".

`stx codemod` finds hand-rolled code a primitive already covers — 12 rules, 2
rewriting and 10 reporting. See `docs/guide/adopting-primitives.md`.

---

## The bug class most of this was

Nearly every fix was code that **answered 200 and did nothing**. Worth knowing
because it is what to suspect when a page looks right and behaves dead:

| | |
|---|---|
| `<body` in a CSS comment | stole the `data-stx` stamp → the page's setup function shipped, parsed, was never called. Every `:if`, `@click`, `{{ signal() }}` inert |
| runtime tag above `<!DOCTYPE>` | quirks mode. `document.compatMode` was the only symptom |
| the signals runtime contains `'@else'` | a component with `x-data` inside an `@if` **truncated the page** |
| `{{ id }}` in a `<script type="module">` attribute | shipped the literal mustache to the browser |
| `__stxServeContext` undeclared | ReferenceError inside the script IIFE took every other binding with it; the component rendered its empty branch |
| bundle failure | was a `console.warn`; unbundled source shipped and the build exited 0 |

---

## Working on stx itself

Rules that cost real debugging time, beyond what CLAUDE.md already says:

- **Sabotage your tests.** Break the fix, confirm the test fails. Two of mine
  passed against the very bug they were written for: a perf test sized at 42 KB
  where the quadratic version still finished in 29 ms, and a test asserting on
  literals that the static-extraction fallback recovers even when the script dies.
- **`dist` and `node_modules` lie.** Two "known failing" tests this sweep were
  both stale environment — a `dist` older than `src`, and `node_modules` holding
  `@cwcss/crosswind@0.2.12` against a lockfile pinning `0.2.14`. Run
  `stx doctor`; it does not yet cover lockfile-vs-installed drift.
- **Measure against the corpus before shipping a checker.** A gate that invents
  errors gets muted, and a muted gate catches nothing.
- **One rule, one implementation.** `stripCommentsAndLiterals` now lives in
  `strip-literals.ts` because a second copy that blanked template literals whole
  would have made a warning and the runtime describe different sets. Same reason
  `page-action.ts` and `reactive-tracking.ts` exist.

---

## Still open

- **#1754** — DevTools extension. Icons, listing copy and a CI zip step are done;
  the submission needs a maintainer's Chrome Web Store account.
- **#1894** — closed as *not reproducible*, not as fixed. A Sidebar client script
  emitting unquoted string props, backed by real served HTML I could not
  reproduce across seven configurations on current `main` or on v0.2.170.
  Pinned against regression. **Reopen with resolved versions if you hit it** —
  the signature is booleans and numbers fine while every string is broken, which
  means something substituted with HTML rules where JS rules were needed.
