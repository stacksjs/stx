/**
 * Regression suite for filed-and-fixed issues that aren't otherwise
 * covered by existing tests. Each `describe` is named for its GitHub
 * issue so a future failure points at the originating bug.
 */
import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'

const TMP = path.resolve(__dirname, './scratch-issue-fixes')

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
    const scopedMatch = out.match(/<script data-stx-scoped>([\s\S]*?)<\/script>/)
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
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

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

describe('useSessionStorage — close the gap strict-mode lint already pointed at', () => {
  const { generateSignalsRuntimeDev } = require('../../src/signals')
  const runtime = generateSignalsRuntimeDev()

  it('runtime defines a useSessionStorage function', () => {
    expect(runtime).toContain('function useSessionStorage(')
  })

  it('runtime exposes useSessionStorage on window.stx', () => {
    const stxAssign = runtime.match(/window\.stx\s*=\s*\{[\s\S]*?\};/)
    expect(stxAssign).not.toBeNull()
    expect(stxAssign![0]).toContain('useSessionStorage')
  })

  it('uses sessionStorage (not localStorage) for backing reads/writes', () => {
    // Scope the assertion to the useSessionStorage body so we don't
    // collide with useLocalStorage's getItem/setItem lines.
    const body = runtime.match(/function useSessionStorage\(key, defaultValue\)\s*\{[\s\S]*?\n  \}/)
    expect(body).not.toBeNull()
    expect(body![0]).toContain('sessionStorage.getItem(key)')
    expect(body![0]).toContain('sessionStorage.setItem(key,')
    expect(body![0]).not.toContain('localStorage.getItem')
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
    const stxAssign = runtime.match(/window\.stx\s*=\s*\{[\s\S]*?\};/)
    expect(stxAssign).not.toBeNull()
    expect(stxAssign![0]).toContain('useReactiveProp')
  })

  it('reads the named attribute off __STX_CURRENT_ELEMENT__', () => {
    // Component-mount sets __STX_CURRENT_ELEMENT__ before the setup fn runs;
    // useReactiveProp captures it to know which element to observe.
    expect(runtime).toContain('window.__STX_CURRENT_ELEMENT__')
    expect(runtime).toMatch(/root\.hasAttribute\(name\)/)
    expect(runtime).toMatch(/root\.getAttribute\(name\)/)
  })

  it('sets up a MutationObserver to catch parent-driven attribute changes', () => {
    expect(runtime).toContain('new MutationObserver(')
    expect(runtime).toMatch(/attributeFilter:\s*\[name\]/)
    // Cleanup on component teardown
    expect(runtime).toMatch(/onDestroy\(function\s*\(\)\s*\{\s*observer\.disconnect/)
  })

  it('only updates the local signal when the parsed value actually changes', () => {
    // Guards against MutationObserver re-firing for unrelated attribute
    // writes (and prevents feedback loops if .set() ever propagated back).
    expect(runtime).toMatch(/if\s*\(next !== s\(\)\)\s*s\.set\(next\)/)
  })

  it('default parse coerces "true"/"false"/numbers/empty to typed values', () => {
    // Default parser heuristic — boolean attrs without an explicit parse opt
    // still work right out of the gate (`open=""` → true, `open="false"` → false).
    expect(runtime).toMatch(/v === '' \|\| v === 'true'/)
    expect(runtime).toMatch(/v === 'false'/)
    expect(runtime).toMatch(/!isNaN\(Number\(v\)\)/)
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
      ['sidebar/SidebarSection.stx', "useReactiveProp('expanded',"],
    ]
    for (const [file, marker] of checks) {
      const src = fs.readFileSync(path.join(componentsDir, file), 'utf8')
      expect(src).toContain(marker)
    }
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
    const dclIdx = runtime.indexOf('DOMContentLoaded')
    expect(dclIdx).toBeGreaterThan(-1)
    const dclSection = runtime.slice(dclIdx, dclIdx + 5000)
    expect(dclSection).toMatch(/!\s*scopeVars\.__mounted/)
  })
})
