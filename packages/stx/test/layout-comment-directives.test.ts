// A directive written inside a `{{-- --}}` comment is prose, not an instruction.
//
// The nested-layout check ran on a layout's raw source, before its comments
// were stripped. A layout documenting how pages use it
//
//   {{-- A page opens with @extends('default') --}}
//
// therefore "extended" `default`, which was itself, and the render recursed
// without end: the first request took a Stacks dev server to 150% CPU and it
// never answered again. Found writing the starter layout `buddy new` ships.

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../src/process'

let dir = ''

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-comment-'))
  fs.mkdirSync(path.join(dir, 'layouts'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

function layout(name: string, source: string): void {
  fs.writeFileSync(path.join(dir, 'layouts', `${name}.stx`), source)
}

async function render(source: string): Promise<string> {
  return processDirectives(source, {}, path.join(dir, 'page.stx'), {
    layoutsDir: path.join(dir, 'layouts'),
  }, new Set<string>())
}

const PAGE = `@extends('default')\n@section('content')<p>BODY</p>@endsection`

describe('directives named in a layout comment', () => {
  it('a comment naming the layout\'s own extends line does not make it extend itself', async () => {
    layout('default', `{{-- A page opens with @extends('default') and fills @section('content') --}}\n<main>@yield('content')</main>`)

    const html = await render(PAGE)

    expect(html).toContain('<main><p>BODY</p></main>')
    expect(html).not.toContain('A page opens with')
  })

  it('a comment naming another layout does not nest this one inside it', async () => {
    layout('shell', `<div class="shell">@yield('content')</div>`)
    layout('default', `{{-- Unlike @extends('shell'), this one is bare --}}\n<main>@yield('content')</main>`)

    const html = await render(PAGE)

    expect(html).toContain('<main><p>BODY</p></main>')
    expect(html).not.toContain('class="shell"')
  })

  it('a real nested layout still nests', async () => {
    layout('shell', `<div class="shell">@yield('content')</div>`)
    layout('default', `@extends('shell')\n@section('content')<main>@yield('inner')</main>@endsection`)

    const html = await render(`@extends('default')\n@section('inner')<p>BODY</p>@endsection`)

    expect(html).toContain('class="shell"')
  })
})

describe('a layout that really extends itself', () => {
  // The render ends, and what it leaves names the cycle. stx reports a failed
  // template in place rather than rejecting, so that is where to look.
  it('ends with a message naming the layout instead of recursing forever', async () => {
    layout('default', `@extends('default')\n<main>@yield('content')</main>`)

    const html = await render(PAGE)

    expect(html).toContain('Circular layout')
    expect(html).toContain('default.stx extends itself')
  })

  it('so does a cycle through a second layout', async () => {
    layout('a', `@extends('b')\n<i>@yield('content')</i>`)
    layout('b', `@extends('a')\n<b>@yield('content')</b>`)

    const html = await render(`@extends('a')\n@section('content')x@endsection`)

    expect(html).toMatch(/Circular layout: \S+a\.stx -> \S+b\.stx -> \S+a\.stx/)
  })
})
