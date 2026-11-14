import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'
allowForATypeScriptProgram()

test('checks inherited optional/required contracts through real static layouts at the leaf callsite', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-inherited-'))
  const partial = path.join(root, 'partials/head.stx'), layout = path.join(root, 'layouts/default.stx')
  const good = path.join(root, 'good.stx'), bad = path.join(root, 'bad.stx'), missing = path.join(root, 'missing.stx')
  await Bun.write(partial, `<script server>
interface InheritedContext { pageTitle: string; pageDescription?: string; canonicalPath?: string }
const title = pageTitle.toUpperCase()
const description = pageDescription || 'Default'
</script>
<title>{{ title }}</title>`)
  await Bun.write(layout, "@include('head')\n@yield('content')")
  await Bun.write(good, "<script server>\nconst pageTitle = 'Good'\n</script>\n@extends('default')")
  await Bun.write(bad, '<script server>\nconst pageTitle = 42\n</script>\n@extends(\'default\')')
  await Bun.write(missing, "@extends('default')")
  try {
    const result = await typecheckStxFiles([partial, layout, good, bad, missing], { partialsDir: path.dirname(partial), layoutsDir: path.dirname(layout) })
    expect(result.failure).toBeUndefined()
    const errors = result.diagnostics.filter(item => item.category === 'error')
    expect(errors.filter(item => item.file === good || item.file === partial || item.file === layout)).toEqual([])
    expect(errors.some(item => item.file === bad && item.line === 4 && item.column === 1 && item.message.includes('pageTitle'))).toBe(true)
    expect(errors.some(item => item.file === missing && item.line === 1 && item.message.includes('pageTitle'))).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)


test('checks explicit include overrides and layout shadowing and refuses dynamic proof gaps', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-inherited-overrides-'))
  const partial = path.join(root, 'partials/head.stx'), layout = path.join(root, 'layouts/default.stx')
  const explicit = path.join(root, 'explicit.stx'), shadow = path.join(root, 'shadow.stx'), dynamic = path.join(root, 'dynamic.stx')
  await Bun.write(partial, '<script server>\ninterface InheritedContext { pageTitle?: string }\nconst title = pageTitle || "Default"\n</script>')
  await Bun.write(layout, `<script server>const pageTitle = 42</script>\n@include('head')`)
  await Bun.write(explicit, `<script server>const pageTitle = "Valid"</script>\n@include('head', { pageTitle: 42 })`)
  await Bun.write(shadow, `<script server>const pageTitle = "Valid"</script>\n@extends('default')`)
  await Bun.write(dynamic, '<script server>const target = "head"</script>\n@include(target)')
  try {
    const result = await typecheckStxFiles([partial, layout, explicit, shadow, dynamic], { partialsDir: path.dirname(partial), layoutsDir: path.dirname(layout) })
    expect(result.failure).toBeUndefined()
    const errors = result.diagnostics.filter(item => item.category === 'error')
    expect(errors.some(item => item.file === explicit && item.line === 2 && item.message.includes('pageTitle'))).toBe(true)
    expect(errors.some(item => item.file === shadow && item.line === 2 && item.message.includes('pageTitle'))).toBe(true)
    expect(errors.some(item => item.file === dynamic && item.line === 2 && item.message.includes('dynamic @include'))).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)
