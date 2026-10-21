/**
 * `@push` from a page whose layout extends another layout.
 *
 * The page's pushes are collected before its layout is processed. A layout
 * that extends another one is processed by a recursive call, which started
 * with an empty set of stacks: everything the page pushed was dropped, and only
 * the pushes of the layouts themselves reached `@stack`.
 *
 * Rendered via the src `processDirectives` (not Bun.build) so it exercises the
 * fix, not a stale dist.
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import type { StxOptions } from '../../src/types'
import { clearComposers, composer } from '../../src/view-composers'

const tmp = createTempDir('nested-layout-push')
const opts: StxOptions = { debug: false, componentsDir: 'components', layoutsDir: tmp }

const layouts: Record<string, string> = {
  'base.stx': `<aside>@stack('styles')</aside><main>@yield('content')</main><footer>@stack('scripts')</footer>@push('scripts')<u>base</u>@endpush`,
  'mid.stx': `@extends('base')`,
  'mid-push.stx': `@extends('base')@push('scripts')<i>mid</i>@endpush`,
  'mid-prepend.stx': `@extends('base')@prepend('scripts')<i>mid</i>@endprepend`,
  'top.stx': `@extends('mid-push')@push('scripts')<s>top</s>@endpush`,
  'mid-comment.stx': `<!-- mid-comment -->@extends('base')`,
  'base-nav.stx': `{!! nav !!}<footer>@stack('scripts')</footer>@push('scripts')<u>base</u>@endpush`,
  'mid-nav.stx': `@extends('base-nav')`,
}

beforeAll(async () => {
  await fs.promises.mkdir(tmp, { recursive: true })
  for (const [name, content] of Object.entries(layouts))
    await fs.promises.writeFile(path.join(tmp, name), content)
})
afterAll(async () => { await fs.promises.rm(tmp, { recursive: true, force: true }) })

async function render(view: string): Promise<{ styles: string, scripts: string }> {
  const out = await processDirectives(`${view}@section('content')C@endsection`, {}, path.join(tmp, 'page.stx'), opts, new Set())
  return {
    styles: out.match(/<aside>([\s\S]*?)<\/aside>/)?.[1] ?? out,
    scripts: (out.match(/<footer>([\s\S]*?)<\/footer>/)?.[1] ?? out).replace(/\n/g, ''),
  }
}

const page = `@push('scripts')<b>page</b>@endpush@push('styles')<em>css</em>@endpush`

describe('@push through a layout that extends another layout', () => {
  it('keeps the page\'s pushes', async () => {
    expect(await render(`@extends('mid')${page}`)).toEqual({ styles: '<em>css</em>', scripts: '<b>page</b><u>base</u>' })
  })

  it('keeps the page\'s pushes next to the intermediate layout\'s, in order', async () => {
    expect((await render(`@extends('mid-push')${page}`)).scripts).toBe('<b>page</b><i>mid</i><u>base</u>')
    expect((await render(`@extends('mid-prepend')${page}`)).scripts).toBe('<i>mid</i><b>page</b><u>base</u>')
  })

  it('carries through three levels', async () => {
    expect((await render(`@extends('top')${page}`)).scripts).toBe('<b>page</b><s>top</s><i>mid</i><u>base</u>')
  })

  it('keeps HTML comments in the page\'s pushes', async () => {
    const view = `@push('scripts')<!-- page-comment --><b>page</b>@endpush`
    expect((await render(`@extends('mid')${view}`)).scripts).toBe('<!-- page-comment --><b>page</b><u>base</u>')
    expect((await render(`@extends('mid-comment')${view}`)).scripts).toBe('<!-- page-comment --><b>page</b><u>base</u>')
  })

  it('keeps them out of what a view composer renders', async () => {
    composer('mid-nav', async (ctx) => {
      ctx.nav = await processDirectives(`<header>@stack('scripts')</header>@push('scripts')N@endpush`, { ...ctx }, path.join(tmp, 'nav.stx'), opts, new Set())
    })
    try {
      const out = await processDirectives(`@extends('mid-nav')${page}@section('content')C@endsection`, {}, path.join(tmp, 'page.stx'), opts, new Set())
      expect(out.match(/<header>([\s\S]*?)<\/header>/)?.[1]).toBe('N')
      expect(out.match(/<footer>([\s\S]*?)<\/footer>/)?.[1]?.replace(/\n/g, '')).toBe('<b>page</b><u>base</u>')
    }
    finally {
      clearComposers()
    }
  })

  it('renders the same order as a page that extends the base layout directly', async () => {
    expect(await render(`@extends('base')${page}`)).toEqual({ styles: '<em>css</em>', scripts: '<b>page</b><u>base</u>' })
  })
})
