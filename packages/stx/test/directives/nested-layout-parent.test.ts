/**
 * `@parent` in a layout that extends another layout.
 *
 * A page's `@parent` is marked when its sections are extracted, so the layout
 * splices its own section in there. The sections of an intermediate layout
 * were stored with `@parent` left as text: the next layout never filled it,
 * its own section content was lost, and the page rendered the literal
 * `@parent`.
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

const tmp = createTempDir('nested-layout-parent')
const opts: StxOptions = { debug: false, componentsDir: 'components', layoutsDir: tmp }

const layouts: Record<string, string> = {
  'base.stx': `<nav>@section('nav')BASE@show</nav><main>@yield('content')</main>`,
  'mid.stx': `@extends('base')@section('nav')MID @parent@endsection`,
  'top.stx': `@extends('mid')@section('nav')TOP @parent@endsection`,
  'bare.stx': `<nav>@yield('nav')</nav><main>@yield('content')</main>`,
  'mid-bare.stx': `@extends('bare')@section('nav')MID @parent@endsection`,
  'mid-text.stx': `@extends('base')@section('nav')MID @@parent a@parents.com <!-- @parent -->@endsection`,
  'mid-commented.stx': `@extends('base')@section('nav')<!-- @parent -->{{-- @parent --}}MID @parent@endsection`,
}

beforeAll(async () => {
  await fs.promises.mkdir(tmp, { recursive: true })
  for (const [name, content] of Object.entries(layouts))
    await fs.promises.writeFile(path.join(tmp, name), content)
})
afterAll(async () => { await fs.promises.rm(tmp, { recursive: true, force: true }) })

async function nav(view: string): Promise<string> {
  const out = await processDirectives(`${view}@section('content')C@endsection`, {}, path.join(tmp, 'page.stx'), opts, new Set())
  return out.match(/<nav>([\s\S]*?)<\/nav>/)?.[1] ?? out
}

describe('@parent in an intermediate layout', () => {
  it('splices the parent layout\'s section into the intermediate layout\'s', async () => {
    expect(await nav(`@extends('mid')@section('nav')PAGE @parent@endsection`)).toBe('PAGE MID BASE')
    expect(await nav(`@extends('mid')`)).toBe('MID BASE')
  })

  it('carries through three levels', async () => {
    expect(await nav(`@extends('top')@section('nav')PAGE @parent@endsection`)).toBe('PAGE TOP MID BASE')
    expect(await nav(`@extends('top')`)).toBe('TOP MID BASE')
  })

  it('renders nothing for @parent when the parent layout has no such section', async () => {
    expect(await nav(`@extends('mid-bare')`)).toBe('MID ')
  })

  it('still lets the page replace the section without @parent', async () => {
    expect(await nav(`@extends('mid')@section('nav')PAGE@endsection`)).toBe('PAGE')
  })

  it('leaves @@parent, a word starting with @parent and a commented @parent as text', async () => {
    expect(await nav(`@extends('mid-text')`)).toBe('MID @@parent a@parents.com <!-- @parent -->')
  })

  it('fills the @parent that follows a commented one', async () => {
    expect(await nav(`@extends('mid-commented')`)).toBe('<!-- @parent -->MID BASE')
  })
})
