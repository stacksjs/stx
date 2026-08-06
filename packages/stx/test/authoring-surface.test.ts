/**
 * What the runtime publishes and what a client script can reach (stacksjs/stx#1846).
 *
 * `useRouteParams` / `useRouteParam` were published on `window.stx` by
 * 5daaba1f9b but never added to STX_RUNTIME_GLOBALS, so they were reachable
 * only as `window.stx.useRouteParams()` — usable, but not from the bare
 * identifier every other composable enjoys, and invisible to anyone reading
 * the auto-import list to learn what exists.
 *
 * That is one instance of a class, so this pins the class: any name the
 * runtime puts on `window.stx` is either part of the authoring surface or
 * deliberately excluded, and the exclusions are listed here with a reason.
 * A new name added to the runtime now fails this test until someone decides
 * which it is, rather than silently becoming unreachable.
 *
 * The reverse direction — a name in the list that does NOT exist on
 * `window.stx` — is already guarded by runtime-globals.test.ts, and matters
 * more: it binds a bare identifier to `undefined` (#1804).
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { STX_RUNTIME_GLOBALS } from '../src/runtime-globals'
import { generateSignalsRuntimeDev } from '../src/signals'

/**
 * Runtime members deliberately NOT auto-imported, each with the reason.
 * Adding a name here is a decision; leaving one out is caught by the test.
 */
const DELIBERATELY_NOT_GLOBAL: Record<string, string> = {
  // Shadowing a browser global as a bare identifier would silently change what
  // `alert(...)` and `confirm(...)` mean in every client script. The stx
  // dialogs are reachable as stxAlert / stxConfirm.
  alert: 'would shadow window.alert',
  confirm: 'would shadow window.confirm',
  // Runtime plumbing, not authoring surface — same category as _scopes.
  mount: 'runtime plumbing',
  mountEl: 'runtime plumbing',
  hydrate: 'runtime plumbing',
  helpers: 'internal helper bag',
  // Very generic nouns. A bare `modal` / `toast` / `drawer` collides with an
  // ordinary local of the same name, and the destructure would then be a
  // duplicate declaration rather than a shadow.
  modal: 'too generic as a bare identifier',
  drawer: 'too generic as a bare identifier',
  toast: 'too generic as a bare identifier',
  // Compiler-facing aliases; `watch` and `computed` are the authored spellings.
  $watch: 'alias of watch',
  $computed: 'alias of computed',
}

/**
 * Install the real runtime against a real DOM and read what it published.
 *
 * A hand-rolled `document` stub is not good enough here: the runtime touches
 * enough of the DOM on boot that a partial stub throws midway and publishes a
 * SHORT list, which would make this test pass by measuring almost nothing.
 */
function runtimeMembers(): string[] {
  const previous = { ...globalThis } as any
  const window = new Window({ url: 'http://localhost/' })
  window.document.write('<html><head></head><body><main></main></body></html>')
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle,
  })
  try {
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
    const stx = (globalThis as any).window.stx
    if (!stx || Object.keys(stx).length < 40)
      throw new Error('runtime published too little — the harness is measuring nothing')
    return Object.keys(stx).filter(k => !k.startsWith('_'))
  }
  finally {
    Object.assign(globalThis, {
      window: previous.window,
      document: previous.document,
      location: previous.location,
      history: previous.history,
    })
  }
}

describe('authoring surface (#1846)', () => {
  it('the route-param composables are auto-imported', () => {
    // The concrete gap: published on window.stx, absent from the list.
    expect(STX_RUNTIME_GLOBALS).toContain('useRouteParams')
    expect(STX_RUNTIME_GLOBALS).toContain('useRouteParam')
  })

  it('every runtime member is either auto-imported or explicitly excluded', () => {
    const unaccounted = runtimeMembers()
      .filter(name => !STX_RUNTIME_GLOBALS.includes(name))
      .filter(name => !(name in DELIBERATELY_NOT_GLOBAL))

    // A name reaching here is not a bug by itself — it is an undecided one.
    // Add it to STX_RUNTIME_GLOBALS (with a declaration in stx.d.ts) or to
    // DELIBERATELY_NOT_GLOBAL with the reason.
    expect(unaccounted).toEqual([])
  })

  it('the exclusion list stays honest', () => {
    // An excluded name that no longer exists on the runtime is stale, and a
    // stale exclusion is how the list stops describing reality.
    const members = new Set(runtimeMembers())
    const stale = Object.keys(DELIBERATELY_NOT_GLOBAL).filter(n => !members.has(n))
    expect(stale).toEqual([])
  })
})
