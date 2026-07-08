/**
 * Tests for signal-processing loop-expression parser & `@foreach` → `@for`
 * attribute conversion.
 *
 * Regression focus: `@foreach(items as idx => item)` must NOT be converted to a
 * client-side `@for` attribute when `items` is server-side data. Before the
 * fix, the regex only recognized `items as item` and `items as item, idx`, so
 * `idx => item` and `(item, idx)` variants fell through to client-side
 * conversion even though the iterable was server data.
 */

import { describe, expect, it } from 'bun:test'
import { convertSignalDirectivesToAttributes, convertSignalLoopsToAttributes, parseLoopExpression, processScriptSetup } from '../src/signal-processing'

describe('parseLoopExpression', () => {
  it('parses Blade-style "items as item"', () => {
    expect(parseLoopExpression('items as item')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses Blade-style "items as idx => item"', () => {
    expect(parseLoopExpression('items as idx => item')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "items as item, idx"', () => {
    expect(parseLoopExpression('items as item, idx')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "items as (item, idx)"', () => {
    expect(parseLoopExpression('items as (item, idx)')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "obj.list as item"', () => {
    expect(parseLoopExpression('obj.list as item')).toEqual({
      style: 'as', iterable: 'obj.list', itemVar: 'item', indexVar: null,
    })
  })

  it('parses JS-style "item in items"', () => {
    expect(parseLoopExpression('item in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses JS-style "(item, idx) in items"', () => {
    expect(parseLoopExpression('(item, idx) in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses JS-style "item of items"', () => {
    expect(parseLoopExpression('item of items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses comma-form in JS style: "item, idx in items"', () => {
    expect(parseLoopExpression('item, idx in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('returns unknown for malformed input', () => {
    const parsed = parseLoopExpression('<<<garbage>>>')
    expect(parsed.style).toBe('unknown')
    expect(parsed.iterable).toBeNull()
  })
})

describe('convertSignalLoopsToAttributes — server-data detection', () => {
  it('leaves server-data @foreach alone with "as item" syntax', () => {
    const input = `
      @foreach(items as item)
        <div>{{ item.name }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [{ name: 'a' }] })
    // When the iterable is server data, signal-processing should NOT convert
    // to a client-side @for attribute — processLoops runs server-side instead.
    expect(output).toContain('@foreach(items as item)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as idx => item" syntax', () => {
    // This is the regression: previously the regex didn't recognize
    // `idx => item`, so convertSignalLoops would hoist it to client-side
    // even when `items` was in the server context.
    const input = `
      @foreach(items as idx => item)
        <div>{{ idx }}: {{ item.name }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [{ name: 'a' }] })
    expect(output).toContain('@foreach(items as idx => item)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as (item, idx)" syntax', () => {
    const input = `
      @foreach(items as (item, idx))
        <p>{{ idx }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [] })
    expect(output).toContain('@foreach(items as (item, idx))')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as item, idx" syntax', () => {
    const input = `
      @foreach(items as item, idx)
        <p>{{ idx }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [] })
    expect(output).toContain('@foreach(items as item, idx)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('converts client-data @foreach into @for attribute (idx => item form)', () => {
    // When the iterable is NOT in context, signal-processing legitimately
    // converts to client-side @for. The converted expression must use JS-style
    // `(item, idx) in items` form so bindFor can parse it.
    const input = `
      @foreach(clientList as idx => item)
        <div>{{ item }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, {})
    expect(output).toMatch(/@for\s*=\s*"\(item, idx\) in clientList"/)
  })

  it('converts client-data @foreach into @for attribute (single-var form)', () => {
    const input = `
      @foreach(clientList as item)
        <div>{{ item }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, {})
    expect(output).toMatch(/@for\s*=\s*"item in clientList"/)
  })

  it('handles nested @foreach where outer is server + inner is client', () => {
    const input = `
      @foreach(serverItems as item)
        @foreach(clientSub as subItem)
          <span>{{ subItem }}</span>
        @endforeach
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { serverItems: [] })
    // Outer left alone
    expect(output).toContain('@foreach(serverItems as item)')
    // Inner converted
    expect(output).toMatch(/@for\s*=\s*"subItem in clientSub"/)
  })

  it('respects deep property access for server-data detection', () => {
    // Should use the root variable name for the context check.
    const input = `
      @foreach(state.users as idx => user)
        <p>{{ user.name }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { state: { users: [] } })
    expect(output).toContain('@foreach(state.users as idx => user)')
    expect(output).not.toMatch(/@for\s*=/)
  })
})

/**
 * Regression: `@if (expr) ... @else ... @endif` must NOT be converted into a
 * reactive `@if="expr"` attribute. The attribute form is a simple boolean
 * show/hide — it has no concept of else branches. Before the fix, the
 * converter blindly grabbed everything between `@if(...)` and `@endif` as the
 * element's content, leaving `@else` and the second branch as raw tokens in
 * the final DOM. The converter must skip branched blocks so the server-side
 * `processConditionals` can handle them instead.
 *
 * Seen in the drivly host/dashboard page rendering literal "@else" text in
 * the DOM next to the status chips and inbox previews.
 */
describe('convertSignalDirectivesToAttributes — @if/@else chains', () => {
  // A chain is promoted to a reactive @if/@else-if/@else attribute chain ONLY when
  // its conditions are signal-driven. Chains over server/loop data stay textual so
  // processConditionals can pick a single branch server-side. This keeps `@if`/`v-if`
  // interchangeable with `:if` on signal pages without mangling server conditionals.

  it('leaves a server/loop-data @if/@else chain textual (no declared signal)', () => {
    const input = `
      @if(b.status === 'Confirmed')
        <span class="good">{{ b.status }}</span>
      @else
        <span class="bad">{{ b.status }}</span>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)

    // Whole block is left intact for processConditionals to handle.
    expect(output).toContain("@if(b.status === 'Confirmed')")
    expect(output).toContain('@else')
    expect(output).toContain('@endif')

    // No attribute form should appear — the `@if="..."` attribute and any
    // leaked `@else` text were the two halves of the original bug.
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
    expect(output).not.toContain('<template @if=')
  })

  it('leaves a server-data @if/@elseif chain textual too', () => {
    const input = `
      @if(status === 'a')
        <span>A</span>
      @elseif(status === 'b')
        <span>B</span>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)
    expect(output).toContain('@if(')
    expect(output).toContain('@elseif(')
    expect(output).toContain('@endif')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('promotes a signal-driven @if/@else chain to a reactive sibling chain', () => {
    // `open` is a declared signal → the chain is reactive, exactly like :if/:else.
    const input = `
      <script client>
        const open = state(false)
      </script>
      @if(open())
        <p class="a">Open</p>
      @else
        <p class="b">Closed</p>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)
    expect(output).toMatch(/<p class="a"\s@if="open\(\)">Open<\/p>/)
    expect(output).toMatch(/<p class="b"\s@else>Closed<\/p>/)
    // Directive form is gone — the runtime drives it now.
    expect(output).not.toContain('@if(open())')
    expect(output).not.toContain('@endif')
  })

  it('promotes a signal-driven @if/@elseif/@else chain (all branches reactive)', () => {
    const input = `
      <script client>
        const status = state('a')
      </script>
      @if(status() === 'a')
        <span>A</span>
      @elseif(status() === 'b')
        <span>B</span>
      @else
        <span>C</span>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)
    expect(output).toMatch(/<span\s@if="status\(\) === 'a'">A<\/span>/)
    expect(output).toMatch(/<span\s@else-if="status\(\) === 'b'">B<\/span>/)
    expect(output).toMatch(/<span\s@else>C<\/span>/)
    expect(output).not.toContain('@elseif(')
    expect(output).not.toContain('@endif')
  })

  it('wraps a multi-child signal-driven branch in <template>', () => {
    const input = `
      <script client>
        const open = state(false)
      </script>
      @if(open())
        <p>one</p>
        <p>two</p>
      @else
        <p>closed</p>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)
    expect(output).toContain('<template @if="open()">')
    expect(output).toMatch(/<p\s@else>closed<\/p>/)
  })

  it('still converts a simple @if/@endif (no else) to the attribute form', () => {
    // The no-else path is unchanged: it converts any @if (it cannot leak a
    // dangling @else), regardless of whether a signal is declared.
    const input = `
      @if(loading())
        <div class="spinner">Loading…</div>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input)
    expect(output).toMatch(/<div[^>]*\s@if="loading\(\)"/)
    expect(output).not.toContain('@if(loading())')
    expect(output).not.toContain('@endif')
  })

  it('regression — dashboard status chip with @if/@else inside @foreach', () => {
    // Reproduces the exact shape from drivly/pages/host/dashboard.stx where
    // literal "@else" was rendering to the DOM next to the status chips. `b` is a
    // server loop variable, not a signal, so the chain must stay textual.
    const input = `
      @foreach (upcomingBookings as b)
        <tr>
          <td>
            @if (b.status === 'Confirmed')
              <span class="good">{{ b.status }}</span>
            @else
              <span class="warn">{{ b.status }}</span>
            @endif
          </td>
        </tr>
      @endforeach
    `
    const output = convertSignalDirectivesToAttributes(input)
    // The @if-branch block must remain textual so processConditionals can
    // pick a single branch server-side. No attribute-form leak.
    expect(output).toContain("@if (b.status === 'Confirmed')")
    expect(output).toContain('@else')
    expect(output).toContain('@endif')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('regression — dashboard chip stays textual even on a page that uses signals elsewhere', () => {
    // The whole point of signal-gating: a page can mix a reactive signal chain
    // with a server-loop chip. The loop chip must NOT be dragged client-side.
    const input = `
      <script client>
        const open = state(false)
      </script>
      @if(open())
        <p>panel</p>
      @endif
      @foreach (upcomingBookings as b)
        @if (b.status === 'Confirmed')
          <span class="good">{{ b.status }}</span>
        @else
          <span class="warn">{{ b.status }}</span>
        @endif
      @endforeach
    `
    const output = convertSignalDirectivesToAttributes(input)
    // Signal chip converted…
    expect(output).toMatch(/<p\s@if="open\(\)">panel<\/p>/)
    // …server-loop chip left textual.
    expect(output).toContain("@if (b.status === 'Confirmed')")
    expect(output).toContain('@else')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })
})

describe('convertSignalDirectivesToAttributes — per-condition server vs reactive', () => {
  // The keyword (@if) is fixed; what decides conversion is the data the condition
  // reads. These cover the no-else path too (which is now gated, not unconditional).

  it('does NOT convert a no-else @if over a server-context variable', () => {
    // `user` is server data (in context) → stays textual for processConditionals.
    const input = `@if(user.isAdmin)<span>admin</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, { user: { isAdmin: true } })
    expect(output).toContain('@if(user.isAdmin)')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('does NOT convert a no-else @if over a server loop variable', () => {
    // `b` is neither a declared signal nor a context var → not client-reactive.
    const input = `@if(b.active)<span>on</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, { rows: [] })
    expect(output).toContain('@if(b.active)')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('converts a no-else @if that calls a store/getter not in server context', () => {
    // `cart.count()` is a getter call on a non-server value → client-reactive,
    // even without a local `state()` declaration.
    const input = `@if(cart.count())<span>items</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, {})
    expect(output).toMatch(/<span\s@if="cart\.count\(\)">items<\/span>/)
  })

  it('keeps a chain that mixes a signal with a bare server var server-side', () => {
    // `open` is a signal but the elseif reads a bare server var `role` → the whole
    // mutually-exclusive chain must resolve in one place, so keep it on the server.
    const input = `
      <script client>
        const open = state(false)
      </script>
      @if(open())
        <p>a</p>
      @elseif(role === 'admin')
        <p>b</p>
      @else
        <p>c</p>
      @endif
    `
    const output = convertSignalDirectivesToAttributes(input, { role: 'admin' })
    expect(output).toContain('@if(open())')
    expect(output).toContain('@elseif(')
    expect(output).not.toMatch(/<p[^>]*\s@if\s*=/)
  })

  it('does not count identifiers inside string literals as signals', () => {
    // `state` appears only inside a string — must not be mistaken for a signal ref.
    const input = `@if(label === 'state')<span>x</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, { label: 'state' })
    expect(output).toContain("@if(label === 'state')")
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('does NOT convert a with-arg helper call (likely a server helper)', () => {
    // `formatDate(user.date)` takes an argument → treated as a server helper, not a
    // signal getter, even though `formatDate` isn't in context. Stays server-side.
    const input = `@if(formatDate(d))<span>x</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, {})
    expect(output).toContain('@if(formatDate(d))')
    expect(output).not.toMatch(/<span[^>]*\s@if\s*=/)
  })

  it('converts a zero-arg getter call (signal/derived/store getter)', () => {
    const input = `@if(items())<span>x</span>@endif`
    const output = convertSignalDirectivesToAttributes(input, {})
    expect(output).toMatch(/<span\s@if="items\(\)">x<\/span>/)
  })

  it('still converts when a getter is mixed with a with-arg call on a signal value', () => {
    // `items()` is a zero-arg getter (reactive); the trailing `.includes(x)` is a
    // method on its value, not a separate server helper.
    const input = `
      <script client>
        const items = state([])
      </script>
      @if(items().length)<span>x</span>@endif
    `
    const output = convertSignalDirectivesToAttributes(input, {})
    expect(output).toMatch(/<span\s@if="items\(\).length">x<\/span>/)
  })
})

/**
 * Regression: when a page merges with a layout that ALSO has a signal
 * script (state/useStore/etc.), both must end up in the same single
 * __stx_setup_ function. The prior implementation picked only the first
 * script and let the rest fall through to processClientScript, which
 * wrapped them in stx.mount() — setting __stx_scope on <main> and blocking
 * processElement from walking the page tree. Symptom: `:text="step"` stuck
 * at its fallback value, wizard forms unresponsive.
 */
describe('processScriptSetup — multi-script merge', () => {
  it('merges multiple signal scripts into a single setup function', async () => {
    const layout = `<script client>
      const session = useStore('session')
      const mobileOpen = state(false)
    </script>`
    const page = `<script client>
      const step = state(1)
      const draft = useLocalStorage('app-draft', {})
    </script>`
    const template = `<!DOCTYPE html>\n<html><body>\n${layout}\n<main>content</main>\n${page}\n</body></html>`

    const result = await processScriptSetup(template)
    expect(result.setupCode).not.toBeNull()
    const code = result.setupCode!

    // Both scripts ended up inside ONE __stx_setup_ function.
    const setupMatches = code.match(/function __stx_setup_/g) || []
    expect(setupMatches.length).toBe(1)

    // Both scripts' declarations are present. transformStoreImports may
    // normalize single quotes to double quotes, so match on the key tokens.
    expect(code).toMatch(/const\s+session\s*=\s*useStore\(["']session["']\)/)
    expect(code).toContain('const mobileOpen = state(false)')
    expect(code).toContain('const step = state(1)')
    expect(code).toMatch(/const\s+draft\s*=\s*useLocalStorage\(["']app-draft["']/)

    // The merged return object exports BOTH scripts' top-level declarations
    // so the DOMContentLoaded handler can assign them to componentScope in
    // one shot.
    expect(code).toMatch(/return\s*\{[^}]*session/)
    expect(code).toMatch(/return\s*\{[^}]*step/)

    // The merge markers are present so developers inspecting generated code
    // can tell where each script came from.
    expect(code).toContain('merged signal script #1')
    expect(code).toContain('merged signal script #2')

    // Both originals are gone from the HTML template — we don't want
    // duplicate execution when processClientScript runs later.
    const scriptMatches = result.output.match(/<script\s+client\s*>/g) || []
    expect(scriptMatches.length).toBe(0)
  })

  it('deduplicates top-level const declarations across scripts', async () => {
    // Layout and page both call `useStore('favorites')` — without dedup the
    // concatenation throws "Identifier 'favorites' has already been declared".
    const layout = `<script client>
      const favorites = useStore('favorites')
      const session = useStore('session')
    </script>`
    const page = `<script client>
      const favorites = useStore('favorites')
      const step = state(1)
    </script>`
    const template = `<body>\n${layout}\n<main></main>\n${page}\n</body>`

    const result = await processScriptSetup(template)
    const code = result.setupCode!

    // Only ONE `const favorites = ...` remains.
    const favDecls = code.match(/const\s+favorites\s*=/g) || []
    expect(favDecls.length).toBe(1)

    // The dedup marker replaces the second declaration.
    expect(code).toContain('stx: deduped const favorites')

    // Other declarations from both scripts survive.
    expect(code).toMatch(/const\s+session\s*=\s*useStore\(["']session["']\)/)
    expect(code).toContain('const step = state(1)')
  })

  it('does nothing when no scripts use signal APIs', async () => {
    const template = `<body><script client>console.log('just logging')</script></body>`
    const result = await processScriptSetup(template)
    expect(result.setupCode).toBeNull()
    expect(result.output).toBe(template)
  })

  it('still works with a single signal script (backward compat)', async () => {
    const template = `<body><script client>const count = state(0)</script><main></main></body>`
    const result = await processScriptSetup(template)
    expect(result.setupCode).not.toBeNull()
    expect(result.setupCode).toContain('const count = state(0)')
    expect(result.setupCode).toMatch(/return\s*\{[^}]*count/)
    // Body tagged with data-stx="__stx_setup_..."
    expect(result.output).toMatch(/<body[^>]*\sdata-stx="__stx_setup_/)
  })

  it('marks the first non-skip element on a bare page with a leading <style> (Bug A)', async () => {
    // A bare page (no <body>) whose first tag is a skip-tag (<style>/<script>)
    // must still get the data-stx hydration marker on the real content element,
    // or its @submit/@input/:value directives never bind at runtime.
    const template = `<script client>const loading = state(false)</script>\n<style>.wrap{padding:2rem}</style>\n<div class="wrap"><form @submit="handleSubmit"></form></div>`
    const result = await processScriptSetup(template)
    expect(result.output).toMatch(/<div class="wrap" data-stx="__stx_setup_/)
    expect(result.output).not.toMatch(/<style[^>]*data-stx=/)
  })
})
