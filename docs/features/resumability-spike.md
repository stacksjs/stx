# Resumability — research spike

> Spun out of #1746 phase 4, tracked as #1753. This is the written outcome of
> the spike: what resumability would mean for stx specifically, what the
> existing architecture already gives us, what it would cost, and a
> recommendation.

## The question

Hydration re-runs setup on the client: every `<script client>` block executes,
every signal is recreated, and `processElement` walks the subtree binding
directives. Resumability (Qwik's model) skips that — the server serialises the
state, the client attaches nothing up front, and the first interaction lazily
wires only the handler that interaction needs.

The claim worth testing is not "resumability is faster". It is whether stx's
particular shape makes it *reachable* without a rewrite.

## What stx already has

Three pieces exist, which is why this is worth a spike rather than a rejection:

1. **Per-component scope isolation.** `data-stx-scope` and the island scope
   IIFEs already bound setup to a subtree. A resumable page needs exactly this
   boundary — it is the unit you would serialise and resume.
2. **A state-serialisation precedent.** Stores already round-trip through
   `window.__STX_STORE_STATE__` for SSR hydration. The mechanism for "server
   computed this, client picks it up without recomputing" is in place and
   proven; resumability generalises it from stores to component scope.
3. **A single wire-up seam.** All event binding funnels through
   `processElement`. Lazy attachment does not need to be threaded through
   dozens of call sites — there is one place that knows how an element gets
   wired.

Deferred hydration (`stx-hydrate`, #1746) also established the *shape* of
"HTML now, behaviour later" and the `stx:hydrated` event, so the observable
contract for late wiring already exists.

## What it would cost

Measured against the current runtime:

```
runtime (prod)          158,688 bytes
runtime (prod, gzip)     39,053 bytes
```

The binding machinery — `processElement`, `bindIf`, `bindFor`, `bindShow`,
`bindModel`, `bindClass`, `bindStyle`, `createAutoUnwrapProxy` — is the bulk of
what a resumable page would defer. But **deferring is not the same as not
shipping it**: the moment the user interacts, that code is needed. Resumability
moves the cost off the critical path; it does not remove it, unless the code is
also split per-interaction, which is a bundler problem rather than a runtime
one.

So the honest framing of the win is **time-to-interactive on first paint**, not
bytes.

### The three hard parts

**1. Serialising closures, not just values.**

Stores serialise cleanly because their state is data. Component scope is not:

```js
const items = state([])
const visible = derived(() => items().filter(i => !i.done))
function toggle(item) { items.update(…) }
```

`items()` serialises. `visible` is a *function over* `items` — you can
serialise its current value, but resuming it means reconstructing the
dependency edge without running the module. `toggle` is a closure over `items`
and cannot be serialised at all; Qwik solves this by making every such function
a separately-addressable, lazily-importable symbol (`$()`), which is a
**language-level authoring change**, not an implementation detail.

That is the crux: resumability in Qwik is not a runtime feature, it is a
compiler contract the author opts into. stx's current contract — plain
functions in a `<script client>` block — is structurally incompatible with it.

**2. The dual-implementation problem.**

stx has two reactive implementations that must stay equivalent (CLAUDE.md item
40). Resumability would add a third mode to the client one: signals that are
*declared* but not *constructed* until resumed. Every primitive would need a
lazy variant, and the parity suite would need to cover three states rather than
two.

**3. Event delegation changes the debugging story.**

Lazy wiring means a global listener that resolves the real handler on first
interaction. That is exactly the indirection the devtools panel (#1747) exists
to make visible, and it would need extending — otherwise "why did my click do
nothing" gets harder to answer, not easier, which is the opposite of what the
recent silent-failure work has been aiming at.

## Recommendation

**Do not pursue full resumability. Pursue the part of it that pays.**

The measurable win on a typical stx page is not the hydrate walk — it is that
*every* page ships the whole runtime and runs setup for components the user may
never touch. Two changes capture most of that without the compiler contract:

1. **Per-island runtime splitting.** Islands already isolate scope. Shipping
   only the binders a given island's directives actually use (a page with no
   `:for` need not carry `bindFor`) is a bundler change with no authoring
   impact. This is where the 39KB gzip actually shrinks.

2. **Interaction-triggered hydration as the default for below-fold islands.**
   `stx-hydrate="interaction"` already exists and already defers wire-up until
   the user touches something. Making that the default for islands outside the
   viewport gets the time-to-interactive benefit resumability is chased for,
   using machinery that shipped in #1746.

Both are incremental, both preserve the current authoring model, and both are
measurable against the numbers above.

**Revisit resumability if** the authoring contract changes for another reason —
if stx ever adopts an explicit lazy-symbol boundary, the serialisation work
becomes tractable and this conclusion should be re-examined. Until then the cost
is a rewrite of the reactive core plus a new authoring model, and the benefit
overlaps heavily with two changes that need neither.

## What would make this concrete

If someone wants to push further before accepting the recommendation, the
smallest decisive experiment is:

- take one island with a single `@click` handler,
- serialise its scope to a `data-stx-resume` attribute,
- replace its wire-up with a document-level delegated listener that
  reconstructs the scope on first click,
- measure time-to-interactive against the same island hydrated normally.

That isolates the one claim everything else rests on: whether reconstruct-on-
demand beats run-setup-once for a realistic component. If it does not, the rest
of the design does not matter.
