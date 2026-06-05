/**
 * @slot nested inside @section (stacksjs/stx#1752).
 *
 * A `@slot('name')` placed inside a `@section('name')` block was extracted with
 * its section before the slot resolver ran, so it never got resolved and leaked
 * as the literal string `@slot('name')`. The fix resolves slots nested in merged
 * section bodies — filling from a sibling section, else collapsing a
 * self-referential or unfilled slot to its default / empty string.
 *
 * Rendered via the src `processDirectives` (not Bun.build) so it exercises the
 * fix, not a stale dist.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import type { StxOptions } from '../../src/types'

const opts: StxOptions = { debug: false, componentsDir: 'components' }
const tmp = path.join(os.tmpdir(), 'stx-1752-nested-slot')
const layoutPath = path.join(tmp, 'base.stx')

beforeAll(async () => {
  await fs.promises.mkdir(tmp, { recursive: true })
  await fs.promises.writeFile(layoutPath, `<!DOCTYPE html><html><body><main>@yield('content')</main></body></html>`)
})
afterAll(async () => { await fs.promises.rm(tmp, { recursive: true, force: true }) })

function render(view: string): Promise<string> {
  return processDirectives(view, {}, path.join(tmp, 'page.stx'), opts, new Set())
}

describe('@slot nested inside @section (#1752)', () => {
  it('collapses an unfilled, self-referential nested @slot to empty (not literal text)', async () => {
    const out = await render(`@extends('${layoutPath}')\n@section('content')\n<h1>Profile</h1>\n@slot('content')\n@endsection`)

    expect(out).not.toContain('@slot(') // the bug: literal directive leaked
    expect(out).toContain('<h1>Profile</h1>') // section body still rendered
    expect(out).toContain('<main>') // merged into the layout
  })

  it('renders the default for an unfilled nested slot that has one', async () => {
    const out = await render(`@extends('${layoutPath}')\n@section('content')\n<h1>P</h1>\n@slot('sidebar', 'no sidebar')\n@endsection`)

    expect(out).toContain('no sidebar')
    expect(out).not.toContain('@slot(')
  })

  it('fills a nested slot from a sibling section', async () => {
    const out = await render(`@extends('${layoutPath}')\n@section('aside')<p>ASIDE</p>@endsection\n@section('content')<h1>P</h1>@slot('aside')@endsection`)

    expect(out).toContain('<p>ASIDE</p>')
    expect(out).not.toContain('@slot(')
  })

  it('still renders normally when the section has no nested slot (no regression)', async () => {
    const out = await render(`@extends('${layoutPath}')\n@section('content')<h1>Plain</h1>@endsection`)

    expect(out).toContain('<h1>Plain</h1>')
    expect(out).not.toContain('@slot(')
    expect(out).not.toContain('@section(')
  })
})
