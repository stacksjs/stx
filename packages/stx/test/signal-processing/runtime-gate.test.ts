/**
 * The runtime gate and the auto-mount test agree, and both are derived
 * (stacksjs/stx#1819, #1820).
 *
 * Two separate hand-maintained lists decided whether a page gets the signals
 * runtime and whether a client block gets wrapped in `stx.mount()`. Nothing
 * reconciled them, and both had drifted from the 71 runtime globals:
 *
 *  - the auto-mount regex listed 36 names, so a block built out of `useStore`,
 *    `useQuery`, `useMutation`, `useCookie` or `watchMultiple` was classified as
 *    "not using signals", skipped mounting, and fell through to the legacy IIFE
 *    path with no reactivity;
 *  - the runtime gate listed only `useId` and `useReactiveProp` out of the same
 *    71, covered the `@`-prefixed DIRECTIVES but no event handlers at all, and
 *    matched exactly seven colon-bound attributes.
 *
 * When they disagreed the page emitted `window.stx.mount(...)` with no runtime
 * injected, and the client block died on its first line with
 * `Cannot read properties of undefined (reading 'mount')` — losing every handler
 * it defined.
 *
 * Both now derive from `STX_RUNTIME_GLOBALS`, the same source #1804 used to
 * remove this exact drift class from the auto-import list.
 */
import { describe, expect, it } from 'bun:test'
import {
  COMPILE_TIME_ONLY_GLOBALS,
  REACTIVE_RUNTIME_GLOBALS,
  STX_RUNTIME_GLOBALS,
  usesReactiveRuntime,
} from '../../src/runtime-globals'
import { hasSignalsSyntax } from '../../src/signal-processing'

describe('usesReactiveRuntime', () => {
  it('matches the reactive composables the old regex missed', () => {
    // Every one of these returns or drives a signal and every one used to fail.
    for (const call of [
      'const s = useStore("theme")',
      'const q = useQuery("k", fn)',
      'const m = useMutation(fn)',
      'const c = useCookie("session")',
      'watchMultiple([a, b], fn)',
      'const o = useOptimistic(x)',
      'const md = useMediaQuery("(min-width: 40em)")',
      'usePreferredDark()',
    ])
      expect(usesReactiveRuntime(call)).toBe(true)
  })

  it('still matches the core APIs', () => {
    expect(usesReactiveRuntime('const n = state(0)')).toBe(true)
    expect(usesReactiveRuntime('effect(() => {})')).toBe(true)
    expect(usesReactiveRuntime('onMount(init)')).toBe(true)
  })

  it('tolerates a generic argument list', () => {
    expect(usesReactiveRuntime('const n = state<number>(0)')).toBe(true)
  })

  it('ignores compile-time macros', () => {
    // Calling defineProps does not make a block reactive — it is consumed by
    // the compiler and produces no runtime subscription.
    expect(usesReactiveRuntime('const props = defineProps()')).toBe(false)
    expect(usesReactiveRuntime('const emit = defineEmits()')).toBe(false)
  })

  it('ignores a mention that is not a call', () => {
    expect(usesReactiveRuntime('// state is nice\nconst o = { state: 1 }')).toBe(false)
  })

  it('is empty-safe', () => {
    expect(usesReactiveRuntime('')).toBe(false)
  })
})

describe('the derived list stays in step with the runtime globals', () => {
  it('is the runtime globals minus the compile-time macros', () => {
    expect([...REACTIVE_RUNTIME_GLOBALS].sort()).toEqual(
      STX_RUNTIME_GLOBALS.filter(n => !COMPILE_TIME_ONLY_GLOBALS.includes(n)).slice().sort(),
    )
  })

  it('covers the overwhelming majority of the runtime surface', () => {
    // The old literal covered 36 of 71. A future edit that guts this list
    // should have to notice.
    expect(REACTIVE_RUNTIME_GLOBALS.length).toBeGreaterThan(STX_RUNTIME_GLOBALS.length - 10)
  })
})

describe('hasSignalsSyntax — the runtime gate', () => {
  it('matches an event handler', () => {
    // Absent entirely before: a page whose only client behaviour is a @click
    // still needs the runtime to bind it.
    expect(hasSignalsSyntax('<button @click="toggle()">x</button>')).toBe(true)
    expect(hasSignalsSyntax('<form @submit.prevent="save()">x</form>')).toBe(true)
  })

  it('matches an arbitrary colon-bound attribute', () => {
    // The old list had exactly seven; arbitrary binding is the common case.
    for (const markup of [
      '<div :data-t="theme()"></div>',
      '<input :value="name()">',
      '<button :disabled="busy()">x</button>',
      '<a :href="url()">x</a>',
      '<div :class="cls()"></div>',
    ])
      expect(hasSignalsSyntax(markup)).toBe(true)
  })

  it('matches a reactive composable in a client script', () => {
    expect(hasSignalsSyntax('<script client>const s = useStore("theme")</script>')).toBe(true)
    expect(hasSignalsSyntax('<script client>const q = useQuery("k", f)</script>')).toBe(true)
  })

  it('still matches the original directive forms', () => {
    expect(hasSignalsSyntax('<div @if="ok">x</div>')).toBe(true)
    expect(hasSignalsSyntax('<div :for="i in items">x</div>')).toBe(true)
    expect(hasSignalsSyntax('<div x-data="{}">x</div>')).toBe(true)
  })

  it('stays false for a genuinely static page', () => {
    // Widening must not mean "every page ships the runtime".
    expect(hasSignalsSyntax('<main><h1>About</h1><p>Static copy.</p></main>')).toBe(false)
    expect(hasSignalsSyntax('<a href="/x" class="btn">Link</a>')).toBe(false)
  })

  it('does not fire on an email address or a bare colon in text', () => {
    expect(hasSignalsSyntax('<p>Contact: team@example.com</p>')).toBe(false)
  })
})

describe('the two decisions agree', () => {
  it('a script that mounts also gets the runtime', () => {
    // The exact inconsistency: stx.mount() emitted with no runtime injected.
    for (const api of ['useStore("t")', 'useQuery("k", f)', 'useMutation(f)', 'useCookie("s")']) {
      const script = `<script client>const x = ${api}</script>`
      expect(usesReactiveRuntime(script)).toBe(true)
      expect(hasSignalsSyntax(script)).toBe(true)
    }
  })
})
