/**
 * `definePageMeta({ layout })` selects a layout (stacksjs/stx#1879).
 *
 * `PageMeta.layout` was public, typed, and used in `definePageMeta`'s own
 * documentation example, and no code path read it. A page declaring
 * `layout: 'app'` type-checked, looked idiomatic, and rendered with no layout.
 *
 * The second-order cost is the one that matters: with no working typed way to
 * say "this page belongs to the app layout group", pages hand-wrote
 * `<meta name="stx-layout" content="app">` — a copy of a marker stx emits
 * itself. The router's fragment-vs-full-document swap hinges on that string, so
 * a page asserting a group it does not belong to mis-routes. One app had two
 * pages asserting a group whose layout file did not exist at all.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../src/process'
import { extractPageMetaFromSource, pageMetaLayout } from '../src/page-meta'

let dir = ''

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-page-layout-'))
  fs.mkdirSync(path.join(dir, 'layouts'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'layouts', 'app.stx'),
    `<div class="app-shell"><header>APP HEADER</header>@yield('content')</div>\n`,
  )
  fs.writeFileSync(
    path.join(dir, 'layouts', 'marketing.stx'),
    `<div class="marketing"><header>MARKETING</header>@yield('content')</div>\n`,
  )
})

afterEach(() => {
  if (dir)
    fs.rmSync(dir, { recursive: true, force: true })
})

async function render(source: string): Promise<string> {
  return processDirectives(source, {}, path.join(dir, 'page.stx'), {
    layoutsDir: path.join(dir, 'layouts'),
  }, new Set<string>())
}

describe('the declared layout is used', () => {
  it('applies the layout a page names in page meta', async () => {
    const html = await render(`<script server>\ndefinePageMeta({ layout: 'app' })\n</script>\n<main><h1>Body</h1></main>\n`)

    expect(html).toContain('APP HEADER')
    expect(html).toContain('Body')
  })

  it('wraps a page that has no @section blocks', async () => {
    // Pages declaring a layout in meta write a plain body. Without the wrap the
    // layout renders with nothing in it — a subtler version of the same bug.
    const html = await render(`<script server>\ndefinePageMeta({ layout: 'app' })\n</script>\n<p>plain body</p>\n`)

    expect(html).toContain('plain body')
    expect(html.indexOf('APP HEADER')).toBeLessThan(html.indexOf('plain body'))
  })

  it('treats layout: false as @nolayout', async () => {
    const html = await render(`<script server>\ndefinePageMeta({ layout: false })\n</script>\n<main>bare</main>\n`)

    expect(html).toContain('bare')
    expect(html).not.toContain('APP HEADER')
  })
})

describe('precedence', () => {
  it('lets @extends in the template win over page meta', async () => {
    const html = await render(
      `<script server>\ndefinePageMeta({ layout: 'app' })\n</script>\n@extends('marketing')\n@section('content')<p>hi</p>@endsection\n`,
    )

    expect(html).toContain('MARKETING')
    expect(html).not.toContain('APP HEADER')
  })

  it('leaves a page with neither unlayouted', async () => {
    const html = await render('<main>nothing declared</main>\n')

    expect(html).toContain('nothing declared')
    expect(html).not.toContain('APP HEADER')
  })
})

describe('a layout that does not exist', () => {
  it('names the layouts that do', async () => {
    // A typo and a missing file produce the identical no-layout render, so the
    // message has to carry the comparison.
    const warnings: string[] = []
    const realError = console.error
    const realWarn = console.warn
    console.error = (...a: unknown[]) => { warnings.push(a.map(String).join(' ')) }
    console.warn = (...a: unknown[]) => { warnings.push(a.map(String).join(' ')) }
    try {
      await render(`<script server>\ndefinePageMeta({ layout: 'aap' })\n</script>\n<main>typo</main>\n`)
    }
    finally {
      console.error = realError
      console.warn = realWarn
    }

    const text = warnings.join('\n')
    expect(text).toContain('Layout not found')
    expect(text).toContain('app')
    expect(text).toContain('marketing')
  })
})

describe('extraction', () => {
  it('reads a plain object literal', () => {
    expect(extractPageMetaFromSource(`definePageMeta({ title: 'X', layout: 'app' })`))
      .toMatchObject({ title: 'X', layout: 'app' })
  })

  it('returns null when the call is absent or not a literal', () => {
    expect(extractPageMetaFromSource('<main>no meta</main>')).toBeNull()
    expect(extractPageMetaFromSource('definePageMeta(someVariable)')).toBeNull()
  })

  it('keeps false distinct from not-declared', () => {
    // `false` means @nolayout; `undefined` means "fall through to auto-layout".
    expect(pageMetaLayout({ layout: false })).toBe(false)
    expect(pageMetaLayout({ layout: 'app' })).toBe('app')
    expect(pageMetaLayout({})).toBeUndefined()
    expect(pageMetaLayout(null)).toBeUndefined()
    expect(pageMetaLayout({ layout: '   ' })).toBeUndefined()
  })
})
