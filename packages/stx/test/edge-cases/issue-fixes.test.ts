/**
 * Regression suite for filed-and-fixed issues that aren't otherwise
 * covered by existing tests. Each `describe` is named for its GitHub
 * issue so a future failure points at the originating bug.
 */
import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { runtimeWindowStxSurface } from '../../test-utils/runtime-surface'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-issue-fixes-'))

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

describe('#1699 — HTML comments are masked before directive expansion', () => {
  it('does not expand @push directive name inside an HTML comment', async () => {
    const out = await processDirectives(
      `<article>
  <!-- styles handled in @push('styles') below -->
  <p>body</p>
</article>

@push('styles')
<style>article { color: red }</style>
@endpush`,
      { __sections: {} },
      'view.stx',
      {} as StxOptions,
      new Set<string>(),
    )

    // Comment intact with literal @push text inside.
    expect(out).toContain(`<!-- styles handled in @push('styles') below -->`)
    // Real @push block stripped — only the @push reference in the comment remains.
    expect((out.match(/@push\(/g) || []).length).toBe(1)
    expect(out).not.toContain('@endpush')
    // Pre-fix the <style> body got spliced into the article at the comment site.
    expect(out).not.toContain('color: red')
  })

  it('preserves backticks in HTML comments verbatim', async () => {
    const out = await processDirectives(
      `<p>before</p>
<!-- This comment uses \`template literals\` inside backticks. -->
<p>after</p>`,
      {},
      'view.stx',
      {} as StxOptions,
      new Set<string>(),
    )
    expect(out).toContain('`template literals`')
    expect(out).toContain('<p>before</p>')
    expect(out).toContain('<p>after</p>')
  })

  it('preserves nested directive-looking text inside comments', async () => {
    const out = await processDirectives(
      `<!-- see @include('foo'), @section('content'), @if(x) -->`,
      {},
      'view.stx',
      {} as StxOptions,
      new Set<string>(),
    )
    expect(out).toContain(`@include('foo')`)
    expect(out).toContain(`@section('content')`)
    expect(out).toContain(`@if(x)`)
  })

  // End-to-end variants that hit the actual failure modes the issue reported:
  // not just "the text survived" but "the JS that ships to the browser parses
  // and still has the user's symbols". The earlier tests confirm the masking
  // pass runs; these two confirm the bug *symptom* is gone.

  // End-to-end variants that hit the actual failure modes the issue reported:
  // not just "the text survived" but "the JS that ships to the browser parses
  // and still has the user's symbols". The earlier tests confirm the masking
  // pass runs; these two confirm the bug *symptom* is gone.

  it('repro #1: backticks in a comment do not break the client-script mount body', async () => {
    // Mirror of the issue's first repro. Pre-fix, the comment's backtick
    // poisoned the merged JS — the script body wasn't valid JS so `greet`
    // was never defined by the time the click handler fired.
    const out = await processDirectives(
      `<script client>
  function greet() {
    console.log('hello')
  }
</script>

<!-- This comment uses \`template literals\` inside backticks for readability. -->

<button @click="greet()">Greet</button>`,
      {},
      'view.stx',
      {} as StxOptions,
      new Set<string>(),
    )

    // 1. The HTML comment text — including its backticks — survived in the
    //    final output, outside any script. That's the user-facing "comment
    //    didn't get destroyed" assertion.
    expect(out).toContain('`template literals`')

    // 2. The scoped script body that the runtime evaluates parses as JS.
    //    Pre-fix the lone backtick from the HTML comment was concatenated
    //    into this body and made it un-parsable, killing every subsequent
    //    binding. We use the run-time scoped script (mount or merged setup —
    //    different code paths produce different wrappers) as a proxy: if
    //    the body parses, the backtick didn't poison it.
    // Attribute-tolerant: emitters also stamp data-stx-run (#1773).
    const scopedMatch = out.match(/<script\b[^>]*\bdata-stx-scoped\b[^>]*>([\s\S]*?)<\/script>/)
    expect(scopedMatch).not.toBeNull()
    const scopedBody = scopedMatch![1]
    expect(() => new Function(scopedBody)).not.toThrow()

    // 3. The user's symbol survived in that body.
    expect(scopedBody).toContain('function greet')
    // And no stray backtick poison was pulled in from the comment.
    expect(scopedBody.includes('`')).toBe(false)
  })

  it('repro #2: an `@push` reference inside a comment does not splice the push block', async () => {
    // Mirror of the issue's second repro. Pre-fix, the `@push('styles')`
    // text inside the HTML comment was matched by the directive expander,
    // and the actual `@push('styles') ... @endpush` block was spliced into
    // the comment — breaking the HTML structure.
    const out = await processDirectives(
      `<article>
  <!-- Body. drop cap on the first paragraph (handled in @push('styles') below). -->
  <p>body</p>
</article>

@push('styles')
<style>article p::first-letter { font-size: 3em }</style>
@endpush`,
      {},
      'view.stx',
      {} as StxOptions,
      new Set<string>(),
    )

    // The comment text is preserved with its literal `@push('styles')` reference.
    expect(out).toContain(`handled in @push('styles') below`)
    // The comment is still a valid HTML comment with both delimiters.
    expect(out).toMatch(/<!--[\s\S]*?-->/)
    // The actual <style> block did NOT splice into the comment.
    expect(out).not.toMatch(/<!--[\s\S]*?<style[\s\S]*?-->/)
    // The article tag is still well-formed (opening and closing).
    expect(out).toMatch(/<article>[\s\S]*?<\/article>/)
  })
})

describe('#1698 — view-level <script>/<style> salvaged when @extends is used', () => {
  const LAYOUTS = path.join(TMP, 'layouts')

  beforeAll(() => {
    fs.mkdirSync(LAYOUTS, { recursive: true })
    fs.writeFileSync(
      path.join(LAYOUTS, 'default.stx'),
      `<!doctype html>
<html><body>
  <main>@yield('content')</main>
</body></html>`,
    )
  })
  it('preserves a view-level <script client> when the view uses @extends + explicit @section', async () => {
    const view = `@extends('default')

<script client>
console.log('view-level ran')
function submitSearch() { console.log('submit fired') }
</script>

@section('content')
  <form @submit.prevent="submitSearch()">
    <input />
  </form>
@endsection`

    const out = await processDirectives(
      view,
      {},
      path.join(TMP, 'search.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<form')
    expect(out).toContain('submitSearch')
    expect(out).toContain('view-level ran')
    expect(out).toContain('function submitSearch')
  })

  it('preserves a view-level <style> the same way', async () => {
    const view = `@extends('default')

<style>.search-input { border: 1px solid red }</style>

@section('content')
  <input class="search-input" />
@endsection`

    const out = await processDirectives(
      view,
      {},
      path.join(TMP, 'search-with-style.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )
    expect(out).toContain('.search-input')
    expect(out).toContain('border: 1px solid red')
  })

  it('does not treat script tag examples inside client comments as orphan assets', async () => {
    const view = `@extends('default')

@section('content')
  <h1>Functions</h1>
@endsection

<script client>
interface FunctionRow { name: string }
// Data moved out of a former <script server> block.
const rows: FunctionRow[] = [{ name: 'sendInvoice' }]
const count = state(rows.length)
</script>`

    const out = await processDirectives(
      view,
      {},
      path.join(TMP, 'script-example-comment.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<h1>Functions</h1>')
    expect(out).toContain('name: "sendInvoice"')
    expect(out).toContain('const count = state(rows.length)')
    expect(out).not.toContain('interface FunctionRow')
  })

  it('exposes Vue lifecycle aliases in merged signal scripts', async () => {
    const view = `
<main>
  <p>{{ status() }}</p>
</main>
<script client>
const status = state('ready')
onMounted(() => status.set('mounted'))
onUnmounted(() => status.set('unmounted'))
</script>`

    const out = await processDirectives(
      view,
      {},
      path.join(TMP, 'vue-lifecycle-aliases.stx'),
      {},
      new Set<string>(),
    )

    // Membership, not adjacency — the destructure order comes from the shared
    // STX_RUNTIME_GLOBALS list (#1785) and is alphabetical.
    const destructure = out.match(/(?:const|var)\s*\{[^}]*\}\s*=\s*window\.stx/)?.[0] ?? ''
    for (const alias of ['onMounted', 'onBeforeUnmount', 'onUnmounted'])
      expect(destructure).toContain(alias)
    expect(out).toMatch(/onMounted:\s*onMount/)
    expect(out).toMatch(/onUnmounted:\s*onDestroy/)
  })

  it('preserves a layout import map when the layout also has reactive client code', async () => {
    fs.writeFileSync(
      path.join(LAYOUTS, 'import-map-helper.ts'),
      `import { state } from '@stacksjs/stx'
export const ready = state(true)`,
    )
    fs.writeFileSync(
      path.join(LAYOUTS, 'import-map.stx'),
      `<!doctype html>
<html>
<head>
  <!-- Dynamic imports used by a later <script> resolve through this map. -->
  <script type="importmap">{"imports":{"@stacksjs/charts":"/charts.js"}}</script>
</head>
<body>
  <script client>import { ready } from './import-map-helper'</script>
  <main>@yield('content')</main>
</body>
</html>`,
    )

    const out = await processDirectives(
      `@extends('import-map')
@section('content')
  <p :if="ready()">Ready</p>
@endsection`,
      {},
      path.join(TMP, 'import-map-page.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<script type="importmap">{"imports":{"@stacksjs/charts":"/charts.js"}}</script>')
    expect(out).not.toContain('{"imports":{"@stacksjs/charts":"/charts.js"}}\n\n\n})()')
  })
})

describe('#1695 — bare function ref in event handler shorthand', () => {
  const runtime = generateSignalsRuntimeDev()

  it('runtime contains the bare-id match path', () => {
    expect(runtime).toContain('bareIdMatch')
    expect(runtime).toContain('fn($event)')
  })

  it('the shorthand logic dispatches $event to a bare function ref', () => {
    // Mirror the runtime branch verbatim so we test the actual logic shape.
    function parseShorthand(expr: string, scope: Record<string, any>) {
      const trimmed = expr.trim()
      const bareIdMatch = trimmed.match(/^([a-zA-Z_$][\w$]*)$/)
      if (bareIdMatch) {
        const fn = scope[bareIdMatch[1]]
        if (typeof fn === 'function' && !(fn as any)._isSignal)
          return ($event: any) => fn($event)
      }
      return null
    }

    let captured: any = null
    const handler = parseShorthand('foo', { foo: (e: any) => { captured = e } })
    expect(handler).not.toBeNull()
    handler?.({ type: 'click', stub: true })
    expect(captured).toEqual({ type: 'click', stub: true })

    // Signals (also callable) should NOT be invoked — reading them would be a no-op anyway.
    const signal: any = () => 42
    signal._isSignal = true
    expect(parseShorthand('count', { count: signal })).toBeNull()

    // Missing identifier is a no-op (returns null).
    expect(parseShorthand('missing', {})).toBeNull()
  })
})

describe('client store registration', () => {
  it('exposes registerStoresClient through the generated runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    expect(runtime).toContain('registerStoresClient: function(stores)')
    expect(runtime).toContain("new CustomEvent('stx:stores-ready'")
  })

  it('makes registerStoresClient available to reactive client setup code', async () => {
    const out = await processDirectives(
      `<script client>
const authStore = defineStore('auth', () => ({ ready: state(true) }))
registerStoresClient({ authStore })
</script>
<p :if="authStore.ready()">Ready</p>`,
      {},
      path.join(TMP, 'client-store-registration.stx'),
      {} as StxOptions,
      new Set<string>(),
    )

    // Assert membership, not adjacency: the destructure is generated from the
    // shared STX_RUNTIME_GLOBALS list (#1785), whose order is alphabetical and
    // free to change. What matters is that each name is in scope.
    const destructure = out.match(/(?:const|var)\s*\{[^}]*\}\s*=\s*window\.stx/)?.[0] ?? ''
    for (const name of ['defineStore', 'registerStoresClient', 'useStore'])
      expect(destructure).toContain(name)
    expect(out).toContain('registerStoresClient({ authStore })')
  })
})

describe('#1705 — partials register component imports for parent resolution', () => {
  // Pre-fix, `import { Dialog } from '@stacksjs/components'` inside a
  // partial's <script> block was stripped during signal-script transform
  // before the second processComponents pass could see it. <Dialog> tags
  // in the partial body then fell through to file lookup and errored
  // with `ENOENT: open 'dialog'`. The fix runs processESImports against
  // the partial's raw content during processIncludes so __importedComponents
  // is populated before the strip pass.
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-1705-'))

  beforeAll(() => {
    fs.mkdirSync(path.join(TMP, 'partials'), { recursive: true })
    fs.mkdirSync(path.join(TMP, 'pkg/ui/widget'), { recursive: true })

    // A fake "package" component the partial wants to import.
    fs.writeFileSync(
      path.join(TMP, 'pkg/ui/widget/Widget.stx'),
      `<div data-test-widget><slot /></div>`,
    )
    fs.writeFileSync(
      path.join(TMP, 'pkg/index.ts'),
      `export { default as Widget } from './ui/widget/Widget.stx'`,
    )

    // A partial that imports the package component in its OWN script.
    fs.writeFileSync(
      path.join(TMP, 'partials/partial-with-import.stx'),
      `<script client>
import { Widget } from '${path.join(TMP, 'pkg').replace(/\\/g, '/')}'
</script>

<Widget>
  <p>partial content</p>
</Widget>`,
    )
  })

  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('resolves <Widget> when imported in a partial included via @include', async () => {
    const out = await processDirectives(
      `@include('partial-with-import')`,
      {},
      path.join(TMP, 'page.stx'),
      { partialsDir: path.join(TMP, 'partials') } as StxOptions,
      new Set<string>(),
    )

    // The component resolved and rendered — `<Widget>` became its real markup.
    expect(out).toContain('data-test-widget')
    expect(out).toContain('partial content')
    // And the un-resolved `<Widget>` tag is not in the output (it'd be there
    // if the resolver had fallen through to file lookup and failed).
    expect(out).not.toMatch(/<Widget[\s>]/)
  })

  it('still strips the bare ES import line from the emitted partial', async () => {
    // Component-tag registration is the only thing we want from the partial's
    // import — the rest of the pipeline still strips the line so it doesn't
    // ship as raw `import` in client JS.
    const out = await processDirectives(
      `@include('partial-with-import')`,
      {},
      path.join(TMP, 'page.stx'),
      { partialsDir: path.join(TMP, 'partials') } as StxOptions,
      new Set<string>(),
    )
    expect(out).not.toMatch(/^import\s+\{\s*Widget\s*\}/m)
  })
})

describe('useSessionStorage — close the gap strict-mode lint already pointed at', () => {
  const { generateSignalsRuntimeDev } = require('../../src/signals')
  const runtime = generateSignalsRuntimeDev()

  it('runtime defines a useSessionStorage function', () => {
    expect(runtime).toContain('function useSessionStorage(')
  })

  it('runtime exposes useSessionStorage on window.stx', () => {
    expect(runtimeWindowStxSurface(runtime).has('useSessionStorage')).toBe(true)
  })

  it('uses sessionStorage (not localStorage) for backing reads/writes', () => {
    // Scope the assertion to the useSessionStorage body so we don't
    // collide with useLocalStorage's getItem/setItem lines.
    const body = runtime.match(/function useSessionStorage\(key, defaultValue\)\s*\{[\s\S]*?\n  \}/)
    expect(body).not.toBeNull()
    // Reads and writes go through the guarded storage helpers (#1793) rather
    // than calling getItem/setItem inline, so assert on the store handed to
    // them — that's the part this test has always been about. The guards
    // themselves are covered behaviourally in signals/use-storage-guards.test.ts.
    expect(body![0]).toContain('stxStorageRead(sessionStorage,')
    expect(body![0]).toContain('stxStorageWrite(sessionStorage,')
    expect(body![0]).not.toContain('localStorage')
  })

  it('filters cross-tab storage events to the sessionStorage area', () => {
    // Without the storageArea filter, a localStorage change in another
    // tab would also fire this handler and reset the signal.
    const body = runtime.match(/function useSessionStorage\(key, defaultValue\)\s*\{[\s\S]*?\n  \}/)
    expect(body![0]).toContain('e.storageArea === sessionStorage')
  })

  it('strict-mode lint message still suggests useSessionStorage', async () => {
    // The lint hint in strict-mode.test.ts existed before the function did;
    // it's the canonical entry point users will reach via the warning.
    const strictSrc = require('node:fs').readFileSync(
      require('node:path').resolve(__dirname, '../strict-mode.test.ts'),
      'utf8',
    )
    expect(strictSrc).toContain('useSessionStorage()')
  })

  it('signal-processing destructures useSessionStorage in the setup wrapper', () => {
    const setupSrc = require('node:fs').readFileSync(
      require('node:path').resolve(__dirname, '../../src/signal-processing.ts'),
      'utf8',
    )
    expect(setupSrc).toContain('useSessionStorage')
  })
})

describe('#1704 — useReactiveProp bridges parent clientReactive props into child signals', () => {
  const { generateSignalsRuntimeDev } = require('../../src/signals')
  const runtime = generateSignalsRuntimeDev()

  it('runtime defines a useReactiveProp function', () => {
    expect(runtime).toContain('function useReactiveProp(')
  })

  it('runtime exposes useReactiveProp on window.stx', () => {
    expect(runtimeWindowStxSurface(runtime).has('useReactiveProp')).toBe(true)
  })

  it('reads camelCase and kebab-case attributes off __STX_CURRENT_ELEMENT__', () => {
    // Component-mount sets __STX_CURRENT_ELEMENT__ before the setup fn runs;
    // useReactiveProp captures it to know which element to observe.
    expect(runtime).toContain('window.__STX_CURRENT_ELEMENT__')
    expect(runtime).toContain("name.replace(/([A-Z])/g")
    expect(runtime).toContain('root.hasAttribute(candidate)')
    expect(runtime).toContain('root.getAttribute(candidate)')
  })

  it('falls back to serialized static component props', () => {
    expect(runtime).toContain("root.getAttribute('data-stx-props')")
    expect(runtime).toContain('JSON.parse(serializedProps)')
    expect(runtime).toContain('staticValue = parsedProps[camelName]')
  })

  it('sets up a MutationObserver to catch parent-driven attribute changes', () => {
    expect(runtime).toContain('new MutationObserver(')
    expect(runtime).toMatch(/attributeFilter:\s*attributeNames/)
    // Cleanup on component teardown
    expect(runtime).toMatch(/onDestroy\(function\s*\(\)\s*\{\s*observer\.disconnect/)
  })

  it('only updates the local signal when the parsed value actually changes', () => {
    // Guards against MutationObserver re-firing for unrelated attribute
    // writes (and prevents feedback loops if .set() ever propagated back).
    expect(runtime).toMatch(/if\s*\(raw === lastRaw\)\s*return/)
    expect(runtime).toMatch(/if\s*\(next !== s\(\)\)\s*s\.set\(next\)/)
  })

  it('evaluates prop expressions lazily without subscribing to every child signal', () => {
    const start = runtime.indexOf('const evalAttrExpr')
    const end = runtime.indexOf('// Known directive names', start)
    const evalAttrSection = runtime.slice(start, end)

    expect(evalAttrSection).toContain('with(__scope__)')
    expect(evalAttrSection).not.toContain('Object.values(unwrapScope)')
  })

  it('preserves explicitly called signals in generic template expressions', () => {
    const start = runtime.indexOf('function toValue(')
    const end = runtime.indexOf('// Event Handler Shorthand', start)
    const toValueSection = runtime.slice(start, end)

    expect(toValueSection).toContain('expressionCallsSignal(expr, prop)')
    expect(toValueSection).toContain('expressionUsesSignalApi(expr, prop)')
  })

  it('preserves called list and condition signals inside :for', () => {
    const start = runtime.indexOf('function bindFor(')
    const end = runtime.indexOf('function bindShow(', start)
    const bindForSection = runtime.slice(start, end)

    expect(bindForSection).toContain('expressionCallsSignal(expression, prop)')
    expect(bindForSection).toContain('expressionUsesSignalApi(expression, prop)')
  })

  it('evaluates forwarded props and events in the caller scope', () => {
    expect(runtime).toContain("el.getAttribute('data-stx-parent-bindings')")
    expect(runtime).toContain("el.getAttribute('data-stx-parent-events')")
    expect(runtime).toContain('el.__stx_parent_scope = el.__stx_parent_scope')
    expect(runtime).toContain('bindParentComponentProps(el, el.__stx_parent_scope)')
    expect(runtime).toContain('el.__stx_parent_props_bound = true')
    expect(runtime).toContain('resolveComponentCallerScope(el, pageScopeSnapshot)')
    expect(runtime).toContain('resolveComponentCallerScope(el, spaPageScopeSnapshot)')
    expect(runtime).toContain('var componentEmits = el.__stx_component_emits')
    expect(runtime).toContain('componentEmits && componentEmits[eventName]')
    expect(runtime).toContain('event instanceof CustomEvent')
    expect(runtime).toContain('shorthandFn(handlerEvent)')
    expect(runtime).toContain('expressionCallsSignal(expression, prop)')
  })

  it('default parse coerces "true"/"false"/numbers/empty to typed values', () => {
    // The declared default controls scalar parsing, while untyped props retain
    // the fallback heuristic.
    expect(runtime).toContain("typeof defaultValue === 'string'")
    expect(runtime).toContain("typeof defaultValue === 'boolean'")
    expect(runtime).toContain("typeof defaultValue === 'number'")
    expect(runtime).toMatch(/v === '' \|\| v === 'true'/)
    expect(runtime).toMatch(/v === 'false'/)
    expect(runtime).toMatch(/!isNaN\(Number\(v\)\)/)
  })

  it('serializes object bindings and parses structured reactive props', () => {
    expect(runtime).toContain('attrValue = JSON.stringify(v)')
    expect(runtime).toContain('return JSON.parse(v)')
  })

  it('emits camelCase reactive props as stable kebab-case DOM attributes', async () => {
    const componentsDir = path.join(TMP, 'reactive-prop-components')
    fs.mkdirSync(componentsDir, { recursive: true })
    try {
      fs.writeFileSync(
        path.join(componentsDir, 'ReactivePager.stx'),
        `<script client>
const currentPage = useReactiveProp('current-page', 1)
</script>
<p :text="currentPage()"></p>`,
      )

      const output = await processDirectives(
        `<script client>
const page = state(2)
</script>
<ReactivePager :currentPage="page()" />`,
        {},
        path.join(TMP, 'reactive-pager-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      expect(output).toContain(':current-page="page()"')
      expect(output).not.toContain(':currentPage=')
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })

  it('wraps structural component bindings around the complete expansion', async () => {
    const componentsDir = path.join(TMP, 'structural-component-bindings')
    fs.mkdirSync(componentsDir, { recursive: true })
    try {
      fs.writeFileSync(
        path.join(componentsDir, 'ConditionalPanel.stx'),
        `<script client>
const title = useReactiveProp('title', '')
const interaction = useReactiveProp('interaction', 'action')
</script>
<button :if="interaction() === 'toggle'">Toggle {{ title() }}</button>
<button :else>Action {{ title() }}</button>`,
      )

      const output = await processDirectives(
        `<script client>
const visible = state(false)
const title = state('')
</script>
<ConditionalPanel :if="visible()" :title="title" interaction="action" />`,
        {},
        path.join(TMP, 'structural-component-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      expect(output).toMatch(/<template\b[^>]*:if="visible\(\)"[^>]*>/)
      expect(output).toContain('data-stx-parent-bindings="title"')
      expect(output).not.toContain('data-stx-parent-bindings="if title"')
      expect(output).not.toMatch(/<[^>]+data-stx-scope[^>]+:if="visible\(\)"/)
      const wrapperStart = output.search(/<template\b[^>]*:if="visible\(\)"[^>]*>/)
      expect(wrapperStart).toBeLessThan(output.indexOf('data-stx-parent-bindings="title"', wrapperStart))
      expect(output.indexOf('</template>', wrapperStart)).toBeGreaterThan(output.indexOf('<button :else', wrapperStart))
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })

  it('nests component conditions inside component loops so loop values stay in scope', async () => {
    const componentsDir = path.join(TMP, 'structural-component-loop-bindings')
    fs.mkdirSync(componentsDir, { recursive: true })
    try {
      fs.writeFileSync(
        path.join(componentsDir, 'PageButton.stx'),
        `<button><slot /></button>`,
      )

      const output = await processDirectives(
        `<script client>
const pages = state([1, 'ellipsis'])
const current = state(1)
</script>
<PageButton
  :for="page in pages()"
  :if="typeof page === 'number' && page === current()"
>{{ page }}</PageButton>`,
        {},
        path.join(TMP, 'structural-component-loop-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      const templateTags = [...output.matchAll(/<template\b[^>]*>/g)]
      const forStart = templateTags.find(match => match[0].includes(':for='))?.index ?? -1
      const ifStart = templateTags.find(match => match[0].includes(':if='))?.index ?? -1
      const buttonStart = output.indexOf('<button', ifStart)
      expect(forStart).toBeGreaterThanOrEqual(0)
      expect(ifStart).toBeGreaterThan(forStart)
      expect(buttonStart).toBeGreaterThan(ifStart)
      expect(output).not.toMatch(/<button[^>]+:(?:for|if)=/)
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })

  it('signal-processing destructures useReactiveProp in the setup wrapper', () => {
    const setupSrc = require('node:fs').readFileSync(
      require('node:path').resolve(__dirname, '../../src/signal-processing.ts'),
      'utf8',
    )
    // The merged setup function destructures the runtime APIs from window.stx;
    // useReactiveProp must be in that list so components can call it bare.
    expect(setupSrc).toContain('useReactiveProp')
    // And the SIGNAL_API_RE must detect calls to it, so scripts that ONLY
    // use useReactiveProp (no state/derived) still get merged into setup.
    const apiReBlock = setupSrc.match(/const SIGNAL_API_RE = [^\n]+/)
    expect(apiReBlock).not.toBeNull()
    expect(apiReBlock![0]).toContain('useReactiveProp')
  })

  it('shipped components actually use the helper for their reactive props', () => {
    const fs = require('node:fs')
    const path = require('node:path')
    const componentsDir = path.resolve(__dirname, '../../../components/src/ui')
    const checks: Array<[string, string]> = [
      ['dialog/Dialog.stx', "useReactiveProp('open',"],
      ['drawer/Drawer.stx', "useReactiveProp('open',"],
      ['switch/Switch.stx', "useReactiveProp('checked',"],
      ['checkbox/Checkbox.stx', "useReactiveProp('checked',"],
      ['radio/Radio.stx', "useReactiveProp('checked',"],
      ['input/TextInput.stx', "useReactiveProp('value',"],
      ['input/PasswordInput.stx', "useReactiveProp('value',"],
      ['input/NumberInput.stx', "useReactiveProp('value',"],
      ['select/Select.stx', "useReactiveProp('value',"],
      ['textarea/Textarea.stx', "useReactiveProp('value',"],
      ['progress/Progress.stx', "useReactiveProp('value',"],
      ['tooltip/Tooltip.stx', "useReactiveProp('show',"],
      ['pagination/Pagination.stx', "useReactiveProp('current-page',"],
      // sidebar/SidebarSection.stx no longer appears here: the macOS sidebar
      // revamp made sections presentational — expansion state lives in the
      // Sidebar controller via data attributes, not per-section signals.
    ]
    for (const [file, marker] of checks) {
      const src = fs.readFileSync(path.join(componentsDir, file), 'utf8')
      expect(src).toContain(marker)
    }
  })
})

describe('useId component identity', () => {
  it('defines and exposes the scope-aware id helper', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('function useId(prefix)')
    expect(runtimeWindowStxSurface(runtime).has('useId')).toBe(true)
  })

  it('treats useId-only client scripts as reactive setup scripts', async () => {
    const { processScriptSetup } = await import('../../src/signal-processing')
    const source = `<script client>
const fieldId = useId('field')
</script>
<label :for="fieldId">Name</label>
<input :id="fieldId">
`
    const result = await processScriptSetup(source, '/tmp/use-id.stx')
    expect(result.setupCode).toContain('useId')
    expect(result.output).not.toContain('<script client>')
  })
})

describe('#1668 bug 7 — extractExports tokenizer handles regex literals', () => {
  // Pre-fix, top-level regex literals broke the hand-rolled tokenizer:
  // - `/'/` triggered the string-skipper (the `'` looked like an open quote)
  // - `/{...}/` confused brace-depth tracking
  // - `/`/` triggered the template-literal-skipper
  // The fix adds a position-aware regex skipper that activates when `/`
  // appears in expression position (after `=`/`(`/`,` etc.), respects
  // character classes, and bails on newlines.

  it('skips a top-level regex containing an apostrophe', async () => {
    const { extractExports } = await import('../../src/signal-processing')
    expect(extractExports(`const re = /can't/g; const x = 1;`)).toBe('re, x')
  })

  it('skips a top-level regex containing curly braces', async () => {
    const { extractExports } = await import('../../src/signal-processing')
    expect(extractExports(`const re = /\\{[^}]+\\}/g; const after = 'ok';`)).toBe('re, after')
  })

  it('skips a top-level regex containing a backtick', async () => {
    const { extractExports } = await import('../../src/signal-processing')
    expect(extractExports('const re = /\\`/g; const z = 3;')).toBe('re, z')
  })

  it('still treats `/` as division when in expression-end position', async () => {
    const { extractExports } = await import('../../src/signal-processing')
    // `a / 2` is division — `b` should be detected. If the regex skipper
    // misfired, it would consume to EOF and drop `b`.
    expect(extractExports('const a = 10; const b = a / 2;')).toBe('a, b')
  })

  it('handles destructured arrow parameters at top level', async () => {
    const { extractExports } = await import('../../src/signal-processing')
    expect(extractExports('const fn = ({a, b}) => a + b; const x = 1;')).toBe('fn, x')
  })
})

describe('#1668 bug 3 — component composition API imports merged into __stx_setup', () => {
  // Pre-fix, a `<script setup>` (or `<script client>`) that only used the
  // component composition API (defineProps / withDefaults / defineEmits /
  // defineExpose) fell through processScriptSetup because the signal-API
  // detector regex didn't list them. The script shipped verbatim, and on
  // SPA fragment swap the router re-executed it as a non-module <script>,
  // hitting `Cannot use import statement outside a module`.
  it('merges <script client> with defineProps + import into the setup function', async () => {
    const { processScriptSetup } = await import('../../src/signal-processing')
    const { setupCode, output } = await processScriptSetup(
      `<script client>
import { defineProps, withDefaults } from 'stx'
const props = withDefaults(defineProps({ title: String }), { title: 'Hi' })
</script>
<h1 :text="props.title"></h1>`,
      'view.stx',
    )

    expect(setupCode).not.toBeNull()
    // The raw `import { ... } from 'stx'` line must be stripped — otherwise
    // it would land inside `function __stx_setup_X() { ... }` and throw at
    // parse time (top-level-only statement).
    expect(setupCode).not.toContain("import { defineProps, withDefaults } from 'stx'")
    // defineProps / withDefaults must be available in scope (destructured
    // from window.stx by the setup wrapper).
    expect(setupCode).toContain('defineProps')
    expect(setupCode).toContain('withDefaults')
    // The original raw script tag is no longer in the output — only the
    // generated `data-stx-scoped` setup script ships.
    expect(output).not.toContain('import { defineProps')
  })

  it('also merges bare `<script setup>` Vue-style blocks', async () => {
    const { processScriptSetup } = await import('../../src/signal-processing')
    const { setupCode } = await processScriptSetup(
      `<script setup>
import { defineProps } from 'stx'
const props = defineProps({ name: String })
</script>`,
      'view.stx',
    )
    expect(setupCode).not.toBeNull()
    expect(setupCode).toContain('defineProps')
  })

  it('also recognizes defineEmits / defineExpose', async () => {
    const { processScriptSetup } = await import('../../src/signal-processing')
    const { setupCode: emitSetup } = await processScriptSetup(
      `<script client>
const emit = defineEmits()
function notify() { emit('change') }
</script>`,
      'view.stx',
    )
    expect(emitSetup).not.toBeNull()

    const { setupCode: exposeSetup } = await processScriptSetup(
      `<script client>
function open() {}
defineExpose({ open })
</script>`,
      'view.stx',
    )
    expect(exposeSetup).not.toBeNull()
  })
})

describe('#1668 bug 8 — production runtime strips console.log noise', () => {
  it('production runtime has zero console.log calls', () => {
    const { generateSignalsRuntime } = require('../../src/signals')
    const prod = generateSignalsRuntime()
    expect((prod.match(/console\.log\(/g) || []).length).toBe(0)
  })

  it('dev runtime keeps console.log calls for debugging', () => {
    const dev = generateSignalsRuntimeDev()
    // Sanity: dev build should still have a healthy number of debug logs;
    // strip-pass only runs on the prod build.
    expect((dev.match(/console\.log\(/g) || []).length).toBeGreaterThan(20)
  })

  it('production runtime preserves console.warn (real-error surface)', () => {
    const { generateSignalsRuntime } = require('../../src/signals')
    const prod = generateSignalsRuntime()
    // Warn and error stay — the strip only targets informational logs.
    expect((prod.match(/console\.warn\(/g) || []).length).toBeGreaterThan(10)
    expect((prod.match(/console\.error\(/g) || []).length).toBeGreaterThan(0)
  })

  it('production runtime parses as valid JavaScript', () => {
    const { generateSignalsRuntime } = require('../../src/signals')
    const prod = generateSignalsRuntime()
    // If the strip's paren matcher gets confused, the output won't parse.
    expect(() => new Function(prod)).not.toThrow()
  })
})

describe('#1697 — layout scope rebind walks document.body', () => {
  const runtime = generateSignalsRuntimeDev()

  it('runtime widens both the bindings and mount walks to document.body', () => {
    const occurrences = (runtime.match(/document\.body\.querySelectorAll\('\[data-stx-scope\]'\)/g) || []).length
    // Two: one for bindings re-apply, one for mount-callback firing.
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })

  it('skips re-binding scopes that already have __stx_disposers', () => {
    expect(runtime).toMatch(/if\s*\(\s*el\.__stx_disposers\s*\)\s*return/)
  })

  it('guards mount-callback re-fires with scopeVars.__mounted', () => {
    expect(runtime).toMatch(/scopeVars\.__mounted\s*=\s*true/)
    expect(runtime).toMatch(/!\s*scopeVars\.__mounted/)
  })

  it('DOMContentLoaded path also marks scopes mounted (so cross-nav doesn\'t re-fire onMount)', () => {
    const dclIdx = runtime.indexOf('const stxDomReadyHandler = () => {')
    expect(dclIdx).toBeGreaterThan(-1)
    // To the end, not a fixed byte window: the handler grows, and a slice that
    // falls short makes this pass-or-fail on unrelated edits above the marker.
    const dclSection = runtime.slice(dclIdx)
    expect(dclSection).toMatch(/!\s*scopeVars\.__mounted/)
  })
})

describe('reactive template elements are not mistaken for SFC wrappers', () => {
  it('distinguishes runtime templates from an explicit SFC wrapper', async () => {
    const { findSfcTemplateBlock } = await import('../../src/sfc-template')

    expect(findSfcTemplateBlock('<table><template :for="row in rows"><tr></tr></template></table>')).toBeNull()
    expect(findSfcTemplateBlock('<template @if="open"><p>Open</p></template>')).toBeNull()
    expect(findSfcTemplateBlock('<template @else><p>Closed</p></template>')).toBeNull()

    const wrapped = findSfcTemplateBlock(`
<script client>const rows = state([])</script>
<template>
  <table>
    <template :for="row in rows"><tr><td>{{ row.name }}</td></tr></template>
  </table>
</template>`)

    expect(wrapped).not.toBeNull()
    expect(wrapped!.content).toContain('<table>')
    expect(wrapped!.content).toContain('<template :for="row in rows">')
  })

  it('keeps the complete root and reactive loop when rendering a component', async () => {
    const componentsDir = path.join(TMP, 'reactive-template-components')
    fs.mkdirSync(componentsDir, { recursive: true })

    try {
      fs.writeFileSync(
        path.join(componentsDir, 'ReactiveTable.stx'),
        `<script client>
interface Row { name: string }
const rows = useReactiveProp('rows', [] as Row[])
</script>
<div class="table-shell">
  <table>
    <tbody>
      <template :for="row in rows">
        <tr><td>{{ row.name }}</td></tr>
      </template>
    </tbody>
  </table>
</div>`,
      )

      const output = await processDirectives(
        `<script client>
const rows = state([{ name: 'Alpha' }])
function selectRow(row) {}
</script>
<ReactiveTable :rows="rows" @select="selectRow" />`,
        {},
        path.join(TMP, 'reactive-table-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      expect(output).toContain('class="table-shell"')
      expect(output).toContain('<table>')
      expect(output).toContain('<template :for="row in rows">')
      expect(output).toContain('{{ row.name }}')
      expect(output).toContain(':rows="rows"')
      expect(output).toContain('data-stx-scope="stx_reactive_table_')
      expect(output).toMatch(/useReactiveProp\(["']rows["']/)
      expect(output).toMatch(/<div[^>]+data-stx-parent-events="select"[^>]+@select="selectRow"/)
      expect(output).toMatch(/<div[^>]+data-stx-parent-bindings="rows"[^>]+:rows="rows"/)
      expect(output).not.toMatch(/<script[^>]*@select=/)
      expect(output).not.toMatch(/<script[^>]*:rows=/)
      const scopeMatch = output.match(/<div[^>]+data-stx-scope="(stx_reactive_table_[^"]+)"[^>]*>/)
      expect(scopeMatch).not.toBeNull()
      expect(output).toContain(`document.querySelector('[data-stx-scope="' + __scopeId + '"]')`)
      expect(output).toContain(`})("${scopeMatch![1]}");`)
      expect(output).toContain('window.__STX_CURRENT_ELEMENT__ = __previousCurrentElement')
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })

  it('preserves explicit boolean literals and dotted component bindings', async () => {
    const componentsDir = path.join(TMP, 'component-expression-props')
    fs.mkdirSync(componentsDir, { recursive: true })

    try {
      fs.writeFileSync(
        path.join(componentsDir, 'ExpressionTable.stx'),
        `<script client>
const rows = useReactiveProp('rows', [])
const actions = useReactiveProp('actions', false)
</script>
<div>
  <span :if="actions">Actions</span>
  <template :for="row in rows"><span>{{ row }}</span></template>
</div>`,
      )

      const output = await processDirectives(
        `<script client>
const overview = state({ recent: ['Alpha'] })
</script>
<ExpressionTable :rows="overview.recent" :actions="true" />`,
        {},
        path.join(TMP, 'component-expression-props-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      expect(output).toContain(':rows="overview.recent"')
      expect(output).toContain('data-stx-parent-bindings="rows"')
      expect(output).not.toContain(':actions="actions"')
      expect(output).toMatch(/data-stx-props="[^"]*&quot;actions&quot;:true/)
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })

  it('keeps valueless dynamic props as same-name shorthand bindings', async () => {
    const componentsDir = path.join(TMP, 'component-shorthand-props')
    fs.mkdirSync(componentsDir, { recursive: true })

    try {
      fs.writeFileSync(
        path.join(componentsDir, 'ShorthandFlag.stx'),
        `<script client>
const visible = useReactiveProp('visible', false)
</script>
<div :show="visible">Visible</div>`,
      )

      const output = await processDirectives(
        `<script client>const visible = state(true)</script>
<ShorthandFlag :visible />`,
        {},
        path.join(TMP, 'component-shorthand-props-view.stx'),
        { componentsDir } as StxOptions,
        new Set<string>(),
      )

      expect(output).toContain(':visible="visible"')
      expect(output).toContain('data-stx-parent-bindings="visible"')
    }
    finally {
      fs.rmSync(componentsDir, { recursive: true, force: true })
    }
  })
})
