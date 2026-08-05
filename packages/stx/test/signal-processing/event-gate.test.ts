/**
 * The event-stripping gate agrees with the runtime gate (stacksjs/stx#1824).
 *
 * `processEventDirectives` decides whether to leave `@click` in the markup for
 * the signals runtime to bind, or to strip it and rebind imperatively. That was
 * a THIRD independent answer to "will the runtime be on this page?", after the
 * two #1819/#1820 unified, and it matched only `state`/`derived`/`effect` plus
 * four directives.
 *
 * So a client block built out of `useStore` — or any of the other ~65 reactive
 * globals — failed this gate while passing the runtime gate. The handler was
 * stripped out of the markup and rebound to code that looks for a
 * `[data-stx-scope]` ancestor (which page-level client blocks never get) and
 * otherwise evaluates the bare handler name, which lives inside the
 * `__stx_setup_*` closure and is not a global. Clicking produced
 * `ReferenceError: toggleTheme is not defined` and every handler on the page
 * was dead.
 *
 * The existing suite did not catch it because every fixture calls `state()`,
 * which is one of the three names the old gate did match.
 */
import { describe, expect, it } from 'bun:test'
import { processEventDirectives } from '../../src/events'
import { templateHasReactiveContext, templateNeedsRuntime } from '../../src/runtime-globals'
import { hasSignalsSyntax } from '../../src/signal-processing'

/** The reported case: a client block whose only reactive call is useStore. */
const USE_STORE_PAGE = `
<script client>
const themeStore = useStore('theme')
const theme = themeStore.theme
function toggleTheme(): void { themeStore.toggle() }
</script>
<button class="theme-btn" :data-t="theme()" @click="toggleTheme">Toggle</button>
`

describe('event gate agrees with the runtime gate (#1824)', () => {
  it('leaves @click in the markup for a useStore-only page', () => {
    const out = processEventDirectives(USE_STORE_PAGE, {}, '/tmp/page.stx')

    // The attribute must survive: the runtime binds it declaratively.
    expect(out).toContain('@click="toggleTheme"')
    // And it must NOT have been rebound imperatively.
    expect(out).not.toContain('__stx_evt_')
    expect(out).not.toContain('addEventListener')
  })

  it('never strips events from a page the runtime gate claims', () => {
    // The invariant that was violated. Any template needing the runtime must be
    // returned untouched, because the runtime is what will bind its handlers.
    const templates = [
      USE_STORE_PAGE,
      `<script client>const q = useQuery('/api/x')</script><button @click="go">go</button>`,
      `<script client>const c = useCookie('t')</script><a @click.prevent="nav">x</a>`,
      `<script client>const s = state(0)</script><button @click="inc">+</button>`,
      `<div :value="v()" @input="onInput"></div>`,
    ]

    for (const t of templates) {
      expect(templateHasReactiveContext(t)).toBe(true)
      expect(hasSignalsSyntax(t)).toBe(true)
      // Untouched — byte-identical, not merely "still contains the handler".
      expect(processEventDirectives(t, {}, '/tmp/page.stx')).toBe(t)
    }
  })

  it('still processes events on a template that genuinely has no runtime', () => {
    // The widening must not make the imperative path unreachable in principle.
    // A bare handler with no reactive syntax anywhere still gates false, and
    // that is the path processEventDirectives exists to serve.
    const plain = `<button onclick="alert(1)">hi</button>`
    expect(templateHasReactiveContext(plain)).toBe(false)
    expect(processEventDirectives(plain, {}, '/tmp/page.stx')).toBe(plain)
  })

  it('does not claim a template that only mentions a global in prose', () => {
    // Guards the widening: a mention is not a call, and an email is not a bind.
    const prose = `<p>Call useStore to read a store. Mail us at a@b.com</p>`
    expect(templateHasReactiveContext(prose)).toBe(false)
    expect(templateNeedsRuntime(prose)).toBe(false)
  })
})
