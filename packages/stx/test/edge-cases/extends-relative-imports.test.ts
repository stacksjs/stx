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
 *
 * The salvage only ever tagged the scripts it MOVED, so a script the author
 * wrote inside an `@section` never passed through it and kept resolving against
 * the layout (stacksjs/stx#2035). That shape reached an app as 13 of 46 built
 * pages rendering nothing but an error banner, while the build reported
 * `Failed: 0` -- and it read as unrepeatable, because whether a page worked
 * depended on the gap between its own depth and its layout's: the views that
 * happened to sit at the layout's depth resolved correctly from the same
 * specifier shape that failed one directory deeper.
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

  /*
   * The same view, with the script written INSIDE the section.
   *
   * Nothing moves it, so it never reached the tagging the case above relies
   * on: the section body is lifted into `sections`, substituted into the
   * layout at `@yield`, and extracted with the layout's path.
   */
  it('resolves a relative import from a script inside the section', async () => {
    const view = `@extends('default')

@section('content')
<script server>
import { headline } from '../../data/copy'
</script>
  <h1>{{ headline }}</h1>
@endsection`

    const out = await processDirectives(
      view,
      {},
      path.join(NESTED, 'in-section.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<h1>Point for point.</h1>')
    expect(out).not.toContain('data-stx-source')
  })

  it('does not resolve the specifier that only worked from the layout', async () => {
    /*
     * The other half of the same statement, and the reason it is written as a
     * test: `../data/copy` is what an author had to write to make the static
     * build work while it resolved against the layouts directory, and it is
     * wrong from the view. Anchoring on the layout again would restore this
     * page and break the one above, so pinning only the positive case would
     * let that trade be made silently.
     */
    const view = `@extends('default')

@section('content')
<script server>
import { headline } from '../data/copy'
</script>
  <h1>{{ headline }}</h1>
@endsection`

    const out = await processDirectives(
      view,
      {},
      path.join(NESTED, 'layout-relative.stx'),
      { layoutsDir: LAYOUTS } as StxOptions,
      new Set<string>(),
    )

    expect(out).toContain('<h1></h1>')
  })
})
