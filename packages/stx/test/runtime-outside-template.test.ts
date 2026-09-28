/**
 * The signals runtime never lands inside a `<template>`.
 *
 * A script inside a `<template>` is inert template content. The runtime used to
 * be placed before the first `<script` in the document, and on a bare layout
 * (`@yield('content')` and nothing else, so no `<head>` script to anchor to)
 * the first one was the client script of a component rendered under a
 * `<template :if>`. The runtime went in beside it, never executed, and the
 * page died on "Cannot destructure property 'navigate' of 'window.stx' as it
 * is undefined" -- the Stacks `/login` page rendered blank that way, while the
 * same page on an app with a richer layout worked.
 */
import type { StxOptions } from '../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../src/config'
import { findFirstScriptTag } from '../src/first-script-tag'
import { processDirectives } from '../src/process'
import { injectSignalsRuntime } from '../src/runtime-injection'

/** Whether `offset` sits inside a `<template>` element. */
function insideTemplate(html: string, offset: number): boolean {
  let depth = 0
  const tags = /<(\/?)template(?=[\s>/])[^>]*>/gi
  for (let m = tags.exec(html); m && m.index < offset; m = tags.exec(html))
    depth += m[1] ? -1 : 1
  return depth > 0
}

describe('findFirstScriptTag', () => {
  it('still finds a plain first script', () => {
    const html = '<div></div><script>a()</script>'
    expect(findFirstScriptTag(html)).toBe(html.indexOf('<script'))
  })

  it('resolves a script inside a template to the template itself', () => {
    const html = '<main><template :if="x()"><script>a()</script></template><script>b()</script></main>'
    expect(findFirstScriptTag(html)).toBe(html.indexOf('<template'))
  })

  it('resolves nested templates to the outermost one', () => {
    const html = '<main><template :if="x()"><div><template :for="i in items"><script>a()</script></template></div></template></main>'
    expect(findFirstScriptTag(html)).toBe(html.indexOf('<template'))
  })

  it('looks past a template that holds no script', () => {
    const html = '<template :if="x()"><p>hi</p></template><script>b()</script>'
    expect(findFirstScriptTag(html)).toBe(html.indexOf('<script'))
  })

  it('does not read a <template-card> element as a template', () => {
    const html = '<template-card></template-card><script>b()</script>'
    expect(findFirstScriptTag(html)).toBe(html.indexOf('<script'))
  })
})

describe('injectSignalsRuntime', () => {
  for (const buildMode of ['serve', 'compile'] as const) {
    it(`places the runtime outside a template in ${buildMode} mode`, async () => {
      const input = '<div><template :if="!token()"><div class="card"></div><script client>const e = state(\'\')</script></template></div>'
      const out = await injectSignalsRuntime(input, { buildMode } as StxOptions)
      const at = out.indexOf('data-stx-runtime')
      expect(at).toBeGreaterThan(-1)
      expect(insideTemplate(out, at)).toBe(false)
      expect(at).toBeLessThan(out.indexOf('<template'))
    })
  }
})

describe('a bare layout with a component rooted in <template :if>', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-runtime-template-'))
    await Bun.write(path.join(dir, 'layouts', 'default.stx'), `@yield('content')\n\n@yield('footer')\n\n@stack('scripts')\n`)
    await Bun.write(path.join(dir, 'components', 'Inner.stx'), `<script client>
const email = state('')
</script>

<div class="card"><input :value="email()" /></div>
`)
    await Bun.write(path.join(dir, 'components', 'Outer.stx'), `<script client>
const token = state('')
</script>

<template>
  <Inner :if="!token()" />
  <p :if="token()">two factor</p>
</template>
`)
    await Bun.write(path.join(dir, 'views', 'login.stx'), `@extends('default')
@section('content')
<Outer />
@endsection
`)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  for (const buildMode of ['serve', 'compile'] as const) {
    it(`emits the runtime into the live document (${buildMode})`, async () => {
      const file = path.join(dir, 'views', 'login.stx')
      const options = {
        ...defaultConfig,
        componentsDir: path.join(dir, 'components'),
        layoutsDir: path.join(dir, 'layouts'),
        partialsDir: path.join(dir, 'components'),
        buildMode,
        autoShell: false,
      } as StxOptions
      const out = await processDirectives(await Bun.file(file).text(), {}, file, options, new Set<string>())

      // The shape that used to break: a client script inside the conditional.
      const conditional = out.indexOf('<template :if="!token()"')
      expect(conditional).toBeGreaterThan(-1)
      expect(out.indexOf('<script', conditional)).toBeLessThan(out.indexOf('</template>', conditional))

      const runtime = out.search(/<script\b[^>]*\bdata-stx-runtime\b/)
      expect(runtime).toBeGreaterThan(-1)
      expect(insideTemplate(out, runtime)).toBe(false)

      // And it still precedes every script, inert or live.
      const firstOther = out.search(/<script\b(?![^>]*\bdata-stx-runtime\b)/)
      expect(runtime).toBeLessThan(firstOther)
    })
  }
})
