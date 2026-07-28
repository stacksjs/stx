import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

// Regression: stacksjs/stx#1766
//
// includes.ts routes a component's <script client> through one of two emitters,
// gated on hasSignalApis() (does it call state/derived/effect?). The signal
// branch registered every top-level declaration into window.stx._scopes[id];
// the non-signal branch emitted a registration with NO variables at all, on the
// assumption that a script without signal APIs has nothing worth registering.
//
// It does. `const store = useStore('confirm')` and plain `function submit()`
// are exactly the names templates bind to. With an empty registration every
// binding that referenced them threw a ReferenceError the runtime swallows, so
// x-class/:text evaluated to '' and @click handlers were inert — silently, with
// no console output. A useStore-only <ConfirmHost> painted as a permanently
// visible unstyled shell whose buttons did nothing.
//
// Both branches now share buildScopeRegistrationTail(), so they can't drift.
//
// Rendered via src `processDirectives` rather than Bun.build+stxPlugin so the
// assertions exercise src, not a possibly-stale dist (see test-realm memory).
describe('stx#1766: non-signal <script client> registers its top-level declarations', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string): Promise<string> =>
    processDirectives(tmpl, {}, 'page.stx', opts, new Set())

  it('registers a useStore-only const (the ConfirmHost case)', async () => {
    await createPartialFile(
      'confirm-host.stx',
      `<script client>\n  const confirmStore = useStore('confirm')\n</script>\n`
      + `<div x-class="confirmStore.open() ? 'shown' : 'hidden'"><h2 :text="confirmStore.title()"></h2></div>`,
    )
    const out = await render(`<div>@include('confirm-host')</div>`)
    expect(out).toContain('__scopeRegistration["confirmStore"]')
    // The registration object must actually be the one stored on the scope.
    expect(out).toMatch(/window\.stx\._scopes\['[^']+'\] = __scopeRegistration;/)
  })

  it('registers plain handler functions so @click is not inert', async () => {
    await createPartialFile(
      'plain-handlers.stx',
      `<script client>\n  function submitForm() {}\n  async function reload() {}\n</script>\n`
      + `<button @click="submitForm()">go</button>`,
    )
    const out = await render(`<div>@include('plain-handlers')</div>`)
    expect(out).toContain('__scopeRegistration["submitForm"]')
    expect(out).toContain('__scopeRegistration["reload"]')
  })

  it('keeps registering signal-script declarations (no regression on that branch)', async () => {
    await createPartialFile(
      'signal-side.stx',
      `<script client>\n  const open = state(false)\n  const label = derived(() => 'x')\n</script>\n`
      + `<div :show="open"><span :text="label"></span></div>`,
    )
    const out = await render(`<div>@include('signal-side')</div>`)
    expect(out).toContain('__scopeRegistration["open"]')
    expect(out).toContain('__scopeRegistration["label"]')
  })

  it('emits the single-quote _scopes[...] form the scope-merge step matches on', async () => {
    // The downstream preservedScript.replace() that merges a component into an
    // existing data-stx-scope searches for `window.stx._scopes['<id>']`
    // verbatim. Double quotes here would silently skip the merge.
    await createPartialFile(
      'quote-form.stx',
      `<script client>\n  const store = useStore('x')\n</script>\n<div :text="store.v()"></div>`,
    )
    const out = await render(`<div>@include('quote-form')</div>`)
    expect(out).toMatch(/window\.stx\._scopes\['stx_scope_[A-Za-z0-9_]+'\]/)
  })
})
