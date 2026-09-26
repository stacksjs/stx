/**
 * A view's `<script server>` imports resolve against the VIEW, even under @extends.
 *
 * A view that extends a layout has its top-level scripts salvaged into the
 * layout's content section (#1698), and the combined layout is then processed
 * with the LAYOUT's path. The server script ran from there, so its relative
 * imports resolved against the layouts directory. A page nested one directory
 * deeper than its layout (`views/compare/matomo.stx` extending
 * `layouts/marketing.stx`) could not be written correctly: `../../data/x`
 * resolved on the dev and production servers, which extract the view's script
 * with the view's path first, and failed in the static build, which did not;
 * `../data/x` did the opposite. Every binding in the script came back undefined
 * and the page shipped an empty headline.
 */
import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-extends-imports-'))
const LAYOUTS = path.join(TMP, 'layouts')
const NESTED = path.join(TMP, 'views', 'compare')

beforeAll(() => {
  fs.mkdirSync(LAYOUTS, { recursive: true })
  fs.mkdirSync(NESTED, { recursive: true })
  fs.mkdirSync(path.join(TMP, 'data'), { recursive: true })
  fs.writeFileSync(path.join(TMP, 'data', 'copy.ts'), `export const headline = 'Point for point.'\n`)
  fs.writeFileSync(path.join(LAYOUTS, 'default.stx'), `<!doctype html>\n<html><body><main>@yield('content')</main></body></html>`)
})

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true })
})

describe('@extends: a view\'s server script imports relative to the view', () => {
  it('resolves a relative import from a view nested deeper than its layout', async () => {
    const view = `<script server>
import { headline } from '../../data/copy'
</script>

@extends('default')

@section('content')
  <h1>{{ headline }}</h1>
@endsection`

    const out = await processDirectives(
      view,
      {},
      path.join(NESTED, 'matomo.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<h1>Point for point.</h1>')
  })

  it('does not print the bookkeeping attribute', async () => {
    const view = `<script server>
import { headline } from '../../data/copy'
</script>
@extends('default')
@section('content')<p>{{ headline }}</p>@endsection`

    const out = await processDirectives(view, {}, path.join(NESTED, 'plain.stx'), { layoutsDir: LAYOUTS } as StxOptions, new Set<string>())
    expect(out).toContain('<p>Point for point.</p>')
    expect(out).not.toContain('data-stx-source')
  })
})
