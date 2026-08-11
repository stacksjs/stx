import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../src/process'
import { STX_AUTO_IMPORTS } from '../src/client-script'
import { COMPONENT_SCOPE_LOCAL_GLOBALS, STX_RUNTIME_GLOBALS, buildRuntimeGlobalsDestructure } from '../src/runtime-globals'
import { generateSignalsRuntimeDev } from '../src/signals'
import { runtimeWindowStxSurface } from '../test-utils/runtime-surface'

// Regression: stacksjs/stx#1785
//
// The runtime-globals destructure was hardcoded in three places — the @include
// component wrapper (includes.ts), the page setup function (signal-processing.ts)
// and the <Component /> client-script wrapper (utils.ts). They drifted to 51/54/53
// names against a union of 56, so which stx APIs existed depended on which kind of
// script you were writing, and the failure was a bare ReferenceError at runtime
// with nothing at build time: nextTick() resolved in a component script but threw
// in a page; onMounted() resolved in a page but threw in an @include'd component.
//
// Two entries were phantoms - `inject` and `nextTick` were destructured by one
// site but never defined on window.stx at all, so they evaluated to undefined and
// threw "is not a function" when called. nextTick is now implemented by the
// signals runtime; inject remains omitted.
//
// All three now build from STX_RUNTIME_GLOBALS. These tests are the part that
// keeps it that way.

/** Names the runtime actually assigns to `window.stx`. */
function realRuntimeSurface(): Set<string> {
  return runtimeWindowStxSurface(generateSignalsRuntimeDev())
}

/** Pull the `{ … } = window.stx` name set out of a generated script. */
function destructuredNames(generated: string): Set<string> {
  const match = generated.match(/(?:const|var)\s*\{([^}]*)\}\s*=\s*window\.stx/)
  if (!match) throw new Error('no window.stx destructure found in the generated script')
  return new Set(match[1].split(',').map(n => n.trim()).filter(Boolean))
}

describe('stx#1785: runtime globals come from one source', () => {
  it('every declared global actually exists on window.stx', () => {
    // This is the check that would have caught `inject` and `nextTick`: both were
    // destructured for years while the runtime never defined them, so calling one
    // threw "is not a function" rather than anything pointing at the real cause.
    const real = realRuntimeSurface()
    const missing = STX_RUNTIME_GLOBALS.filter(name => !real.has(name))
    expect(missing).toEqual([])
  })

  it('declares no duplicates and stays sorted', () => {
    expect(new Set(STX_RUNTIME_GLOBALS).size).toBe(STX_RUNTIME_GLOBALS.length)
    expect([...STX_RUNTIME_GLOBALS]).toEqual([...STX_RUNTIME_GLOBALS].sort())
  })

  it('excludes runtime internals', () => {
    // window.stx also carries plumbing (_scopes, _cleanupContainer, mount, …).
    // Those are not part of the authoring surface and must not leak into scope.
    expect(STX_RUNTIME_GLOBALS.some(n => n.startsWith('_'))).toBe(false)
  })

  it('emits the requested declaration keyword', () => {
    // The component wrapper reassigns onDestroy to tee into its teardown
    // channel, so that site needs `var`, not `const`.
    expect(buildRuntimeGlobalsDestructure('var').startsWith('var {')).toBe(true)
    expect(buildRuntimeGlobalsDestructure('const').startsWith('const {')).toBe(true)
    expect(buildRuntimeGlobalsDestructure()).toBe(buildRuntimeGlobalsDestructure('const'))
  })

  it('limits component bindings to referenced runtime globals', () => {
    const generated = buildRuntimeGlobalsDestructure(
      'const',
      COMPONENT_SCOPE_LOCAL_GLOBALS,
      'const count = state(0); nextTick(() => count.set(1))',
    )
    expect(destructuredNames(generated)).toEqual(new Set(['nextTick', 'state']))
  })

  it('the page setup destructure is exactly the shared list', async () => {
    const page = await processDirectives(
      `<script client>\nconst a = state(1)\n</script>\n<p x-text="a()"></p>`,
      {},
      'page.stx',
      { debug: false } as any,
      new Set(),
    )
    const pageScript = (page.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [])
      .find(b => b.includes('__stx_setup_'))
    expect(pageScript).toBeDefined()
    expect(destructuredNames(pageScript!)).toEqual(new Set(STX_RUNTIME_GLOBALS))
  })

  it('no call site introduces a name outside the shared list', () => {
    // The point of consolidating: a site may omit names it declares itself, but
    // it must never add one, or the drift starts over.
    for (const generated of [
      buildRuntimeGlobalsDestructure('const'),
      buildRuntimeGlobalsDestructure('var'),
      buildRuntimeGlobalsDestructure('const', COMPONENT_SCOPE_LOCAL_GLOBALS),
    ]) {
      for (const name of destructuredNames(generated))
        expect(STX_RUNTIME_GLOBALS).toContain(name)
    }
  })

  it('the component wrapper omits exactly the names it declares itself', async () => {
    // Regression guard for a real break introduced while consolidating: the
    // <Component /> wrapper defines scope-aware onMount/onDestroy that push into
    // that component's own callback arrays. Destructuring the same names first
    // made it a duplicate `const` — a SyntaxError, which showed up only as the
    // island chunk silently failing to minify (and failing to run).
    const names = destructuredNames(buildRuntimeGlobalsDestructure('const', COMPONENT_SCOPE_LOCAL_GLOBALS))
    for (const local of COMPONENT_SCOPE_LOCAL_GLOBALS)
      expect(names.has(local)).toBe(false)

    const expected = new Set(STX_RUNTIME_GLOBALS)
    for (const local of COMPONENT_SCOPE_LOCAL_GLOBALS) expected.delete(local)
    expect(names).toEqual(expected)

    // And the omission is justified — the wrapper really does declare them.
    const source = await Bun.file(new URL('../src/utils.ts', import.meta.url).pathname).text()
    for (const local of COMPONENT_SCOPE_LOCAL_GLOBALS)
      expect(source).toContain(`const ${local} = (fn) =>`)
  })

  it('emits a component client script that is valid JavaScript', async () => {
    // The strongest guard: a duplicate declaration is a parse error, so parse it.
    const out = await processDirectives(
      `<div><scope-probe /></div>`,
      {},
      'page.stx',
      { componentsDir: new URL('./fixtures/runtime-globals', import.meta.url).pathname, debug: false } as any,
      new Set(),
    )
    const script = (out.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [])
      .find(b => b.includes('__scopeVars'))
    expect(script).toBeDefined()
    const body = script!.replace(/<\/?script[^>]*>/gi, '')
    // eslint-disable-next-line no-new-func
    expect(() => new Function(body)).not.toThrow()
    expect(script).toContain('__scopeVars.$refs = __scopeVars.$refs || {}')
    expect(destructuredNames(script!).has('goBack')).toBe(false)
    expect(script).toContain('return "component-local"')
  })

  it('lets page declarations shadow runtime convenience globals', async () => {
    const page = await processDirectives(
      `<script client>
const ready = state(true)
function goBack() { return 'page-local' }
</script>
<button :if="ready()" @click="goBack()">Back</button>`,
      {},
      'page.stx',
      { debug: false } as any,
      new Set(),
    )
    const pageScript = (page.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [])
      .find(block => block.includes('__stx_setup_'))
    expect(pageScript).toBeDefined()
    expect(destructuredNames(pageScript!).has('goBack')).toBe(false)
    const body = pageScript!.replace(/<\/?script[^>]*>/gi, '')
    // eslint-disable-next-line no-new-func
    expect(() => new Function(body)).not.toThrow()
  })

  it('the previously-drifted lifecycle aliases are now available everywhere', async () => {
    // onMounted/onUnmounted/onBeforeUnmount were missing from the @include
    // wrapper, and onMount/onDestroy from the component wrapper.
    for (const name of ['onMount', 'onDestroy', 'onMounted', 'onUnmounted', 'onBeforeUnmount'])
      expect(STX_RUNTIME_GLOBALS).toContain(name)
  })

  it('exposes nextTick now that the signals runtime implements it', async () => {
    expect(STX_RUNTIME_GLOBALS).toContain('nextTick')

    const page = await processDirectives(
      `<script client>
const ready = state(false)
nextTick(() => ready.set(true))
</script>
<p :text="ready()"></p>`,
      {},
      'next-tick.stx',
      { debug: false } as any,
      new Set(),
    )
    const pageScript = (page.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [])
      .find(block => block.includes('__stx_setup_'))
    expect(pageScript).toBeDefined()
    expect(destructuredNames(pageScript!).has('nextTick')).toBe(true)
    expect(generateSignalsRuntimeDev()).toContain('structural directives finish their deferred subtree hydration')
  })

  it('carries inject now that the runtime implements it', () => {
    // Was excluded as a phantom: destructured by one call site, defined
    // nowhere, so provide() worked and the failure surfaced only in the
    // consumer. The runtime implements it as of #1804, and the
    // 'every declared global actually exists on window.stx' test above is what
    // keeps this honest.
    expect(STX_RUNTIME_GLOBALS).toContain('inject')
  })
})

/**
 * The classic `<script>` / `<script client>` path used to carry its OWN
 * 82-name copy of this list (stacksjs/stx#1804). It drifted: 16 of those names
 * were not on `window.stx` at all.
 *
 * The failure mode is what makes this worth a guard. The generated prologue
 * DESTRUCTURES (`var { … } = window.stx`), so a missing name is not an error —
 * it binds `undefined`, the script ships, and the author eventually sees
 * "undefined is not a function" at a call site with nothing naming the
 * identifier or explaining why. `provide` resolved and `inject` did not;
 * `onMounted` resolved and `onUpdated` did not.
 */
describe('stx#1804: auto-imports and runtime globals are one list', () => {
  it('offers exactly the names the setup-script path offers', () => {
    // Two lists mean two chances to drift. There is now one.
    expect([...STX_AUTO_IMPORTS]).toEqual([...STX_RUNTIME_GLOBALS])
  })

  it('every auto-imported name exists on window.stx', () => {
    const real = realRuntimeSurface()
    expect(STX_AUTO_IMPORTS.filter(name => !real.has(name))).toEqual([])
  })

  it('no longer offers names with no client implementation', () => {
    // Each of these is a real export somewhere in the tree — JSX runtime,
    // composition-api, state-management — with no counterpart on window.stx.
    // Offering them is worse than not: a ReferenceError names the identifier,
    // an undefined binding does not.
    for (const name of [
      'h', 'Fragment', 'useMeta', 'getCurrentInstance', 'useAttrs',
      'onErrorCaptured', 'onBeforeUpdate', 'onUpdated', 'createStore',
      'createSelector', 'action',
    ]) {
      expect(STX_AUTO_IMPORTS).not.toContain(name)
    }
  })

  it('keeps the five that were implemented rather than dropped', () => {
    // These were dead too, but cheap and already declared — so the runtime
    // grew them instead of retiring them.
    for (const name of ['isDerived', 'inject', 'useSlots', 'watchMultiple', 'onBeforeMount'])
      expect(STX_AUTO_IMPORTS).toContain(name)
  })

  it('exposes the four names that resolved in one path but not the other', () => {
    // On window.stx and in STX_AUTO_IMPORTS, but missing from the setup-script
    // destructure — so they worked in a classic <script> and threw
    // ReferenceError inside a signals setup script. Same bug class as #1785.
    for (const name of ['untrack', 'peek', 'isSignal', 'setRouteParams'])
      expect(STX_RUNTIME_GLOBALS).toContain(name)
  })
})
