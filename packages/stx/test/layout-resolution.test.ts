/**
 * A configured `layoutsDir` wins over the convention walk (stacksjs/stx#1940).
 *
 * Layouts resolve from two places: the directory a project configures, and a
 * walk up the page's ancestry looking for a directory literally named
 * `layouts`. The walk used to run first, so any stray `layouts/` above a page
 * shadowed the configured directory.
 *
 * Nothing reports that. Both candidates are real files, so the page renders —
 * just inside a layout the author never referenced. There is no warning, no
 * missing-layout path, and no exception; the only evidence is markup from the
 * wrong template. It surfaced as a named slot that "disappeared", because the
 * shadowing layout had no such slot, which is several steps removed from the
 * actual cause.
 *
 * The precedence is the contract worth pinning, so these tests assert it in
 * both directions: configuration beats the walk when both hold the layout, and
 * the walk still resolves when configuration does not hold it (that fallback is
 * what makes `layoutsDir`-free projects work at all, so a fix that simply
 * dropped the walk would pass the first test and break every such project).
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../src/process'
import type { StxOptions } from '../src/types'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-precedence-'))

// The stray directory the walk finds: a sibling of the page, named `layouts`.
const STRAY = path.join(TMP, 'layouts')
// The directory the project actually configured.
const CONFIGURED = path.join(TMP, 'configured-layouts')

const page = `@extends('default')
@section('content')<p>page body</p>@endsection`

beforeAll(() => {
  fs.mkdirSync(STRAY, { recursive: true })
  fs.mkdirSync(CONFIGURED, { recursive: true })

  fs.writeFileSync(
    path.join(STRAY, 'default.stx'),
    `<div id="stray"><main>@yield('content')</main></div>`,
  )
  fs.writeFileSync(
    path.join(CONFIGURED, 'default.stx'),
    `<div id="configured"><main>@yield('content')</main><footer>configured footer</footer></div>`,
  )
  // Only the walk can find this one — it is absent from the configured dir.
  fs.writeFileSync(
    path.join(STRAY, 'walk-only.stx'),
    `<div id="walk-only"><main>@yield('content')</main></div>`,
  )
})

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

// `root` is not part of what is under test: the resolver refuses to return a
// path outside the project unless a trusted directory covers it, and these
// fixtures live in the system temp dir. Without it every case below fails as
// "no layout" for a reason unrelated to precedence.
async function render(template: string, options: Partial<StxOptions>, dir = TMP): Promise<string> {
  return processDirectives(
    template,
    {},
    path.join(dir, 'page.stx'),
    { root: dir, ...options } as StxOptions,
    new Set<string>(),
  )
}

describe('layout precedence', () => {
  it('uses the configured layoutsDir even when a layouts/ directory sits beside the page', async () => {
    const out = await render(page, { layoutsDir: CONFIGURED })

    expect(out).toContain('id="configured"')
    expect(out).toContain('configured footer')
    expect(out).not.toContain('id="stray"')
  })

  it('still walks up to a layouts/ directory when the configured one lacks the layout', async () => {
    const out = await render(
      `@extends('walk-only')\n@section('content')<p>page body</p>@endsection`,
      { layoutsDir: CONFIGURED },
    )

    expect(out).toContain('id="walk-only"')
  })

  it('walks up when no layoutsDir is configured at all', async () => {
    const out = await render(page, {})

    expect(out).toContain('id="stray"')
  })

  it('renders the section body whichever layout won', async () => {
    // Guards against a resolution "fix" that returns the right file but drops
    // the content — every assertion above would still pass on an empty layout.
    const out = await render(page, { layoutsDir: CONFIGURED })

    expect(out).toContain('page body')
  })
})

describe('a layouts/-prefixed reference is not doubled', () => {
  // Its own tree, with no `layouts/` beside the page. A reference containing a
  // slash is resolved relative to the page before any layouts directory is
  // consulted, so a stray sibling would answer this one on that earlier path
  // and the assertion would say nothing about prefix stripping.
  const PREFIX_TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-prefix-'))
  const PREFIX_LAYOUTS = path.join(PREFIX_TMP, 'configured-layouts')

  beforeAll(() => {
    fs.mkdirSync(PREFIX_LAYOUTS, { recursive: true })
    fs.writeFileSync(
      path.join(PREFIX_LAYOUTS, 'default.stx'),
      `<div id="configured"><main>@yield('content')</main></div>`,
    )
  })

  afterAll(() => fs.rmSync(PREFIX_TMP, { recursive: true, force: true }))

  it('resolves @extends("layouts/default") against the configured dir', async () => {
    // `layoutsDir` already points at a layouts directory, so the prefix on the
    // reference is redundant rather than another path segment.
    const out = await render(
      `@extends('layouts/default')\n@section('content')<p>page body</p>@endsection`,
      { layoutsDir: PREFIX_LAYOUTS },
      PREFIX_TMP,
    )

    expect(out).toContain('id="configured"')
    expect(out).toContain('page body')
  })
})
