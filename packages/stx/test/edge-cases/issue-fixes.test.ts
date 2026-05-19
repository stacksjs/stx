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
