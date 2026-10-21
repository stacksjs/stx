import { afterAll, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { processExpressions, interpolateScriptExpressions, interpolateScriptsInTemplate } from '../../src/expressions'
import { renderString } from '../../src/render'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-data-boundaries-')
afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('data stays inert through composition', () => {
  it('does not execute directive text interpolated into a layout script', async () => {
    const layoutsDir = join(root, 'layouts')
    mkdirSync(layoutsDir, { recursive: true })
    writeFileSync(join(layoutsDir, 'base.stx'), '<script client>const payload = {{ value }}</script>@yield("content")')
    const context = { value: '@js global.injected = true @endjs', injected: false }
    await processDirectives('@extends("base")@section("content")ok@endsection', context,
      join(root, 'page.stx'), { root, layoutsDir }, new Set())
    expect(context.injected).toBe(false)
  })

  it('keeps inline section expressions as data until contextual interpolation', async () => {
    const layoutsDir = join(root, 'inline-layouts')
    mkdirSync(layoutsDir, { recursive: true })
    writeFileSync(join(layoutsDir, 'base.stx'), '<title>@yield("title")</title><a href="@yield("url")">link</a>@yield("content")')
    const context = { value: '@js global.injected = true @endjs', url: 'javascript:alert(1)', injected: false }
    const out = await processDirectives('@extends("base")@section("title", value)@section("url", url)@section("content")ok@endsection', context,
      join(root, 'inline.stx'), { root, layoutsDir }, new Set())
    expect(context.injected).toBe(false)
    expect(out).toContain('href="unsafe:javascript:alert(1)"')
  })

  it('keeps serialized script data inert across another interpolation pass', () => {
    const context = { value: '{{ secret }} @js global.injected = true @endjs', secret: 'private-value' }
    const once = interpolateScriptExpressions('const payload = {{ value }}', context)
    const twice = interpolateScriptExpressions(once, context)
    expect(twice).not.toContain('private-value')
    expect(twice).not.toContain('@js')
    expect(JSON.parse(twice.slice('const payload = '.length))).toBe(context.value)
  })

  it('uses attribute escaping after a quoted delimiter in a script tag', () => {
    expect(interpolateScriptsInTemplate('<script title=">" src="{{ value }}"></script>', { value: ' onload=alert(1) x=' }))
      .toBe('<script title=">" src=" onload=alert(1) x="></script>')
  })

  it.each(['>', '<', '><'])('recognizes attributes after quoted %s', (delimiter) => {
    const out = processExpressions(`<a title="${delimiter}" href="{{ value }}">link</a>`, { value: 'javascript:alert(1)' })
    expect(out).toContain('href="unsafe:javascript:alert(1)"')
    expect(() => processExpressions(`<a title="${delimiter}" onclick="{{ value }}">link</a>`, { value: 'alert(1)' }))
      .toThrow('Unsafe interpolation in onclick')
    expect(processExpressions(`<p title="${delimiter}" data-value={{ value }}></p>`, { value: 'a onmouseover=alert(1)' }))
      .not.toContain(' onmouseover=')
  })

  it.each(['title', 'class'])('escapes server-resolved %s values and template syntax', async (attribute) => {
    const out = await renderString(`<p :${attribute}="value">ok</p>`, {
      value: '{{ secret }}" onmouseover="alert(1)', secret: 'private-value',
    })
    expect(out).not.toContain('private-value')
    expect(out).not.toContain(' onmouseover="')
  })

  it('applies URL protections to server bindings and builtin fallthrough attributes', async () => {
    for (const template of ['<a :href="value">link</a>', '<StxLink to="/" :formaction="value">link</StxLink>']) {
      const out = await renderString(template, { value: 'javascript:alert(1)' })
      expect(out).toContain('unsafe:javascript:alert(1)')
    }
  })

  it.each([
    '<StxLink :to="value">link</StxLink>',
    '<StxImage src="/x.png" :alt="value" />',
    '<SafeImage src="/x.png" :alt="value" />',
  ])('keeps consumed builtin props inert: %s', async (template) => {
    const out = await renderString(template, { value: '{{ secret }}', secret: 'private-value' })
    expect(out).not.toContain('private-value')
    expect(out).toContain('&#123;')
  })

  it('keeps old form input as data', async () => {
    const out = await renderString('@input("name")', { old: { name: '{{ secret }}' }, secret: 'private-value' })
    expect(out).not.toContain('private-value')
    expect(out).toContain('&#123;')
  })

  it('does not treat quotes inside earlier expressions as HTML delimiters', () => {
    expect(() => processExpressions('<button title="{{ ">" }}" onclick="{{ value }}">x</button>', { value: 'alert(1)' }))
      .toThrow('Unsafe interpolation in onclick')
  })

  it('uses the outer attribute context when its text resembles an attribute', () => {
    expect(() => processExpressions(`<button onclick='let title="{{ value }}'>`, { value: '\";alert(1);//' }))
      .toThrow('Unsafe interpolation in onclick')
    expect(processExpressions(`<iframe srcdoc='<p title="{{ value }}'>`, { value: '<img src=x onerror=alert(1)>' }))
      .toContain('&amp;lt;img')
  })

  it('does not resolve binding-shaped text inside another attribute', async () => {
    const out = await renderString('<p title=\' :title="secret"\'>ok</p>', { secret: 'private-value' })
    expect(out).not.toContain('private-value')
  })

  it('escapes translations and preserves replacement-string metacharacters', async () => {
    const translationsDir = join(root, 'translations')
    mkdirSync(translationsDir, { recursive: true })
    writeFileSync(join(translationsDir, 'en.json'), JSON.stringify({ greeting: 'Hi :name' }))
    const out = await renderString('<p title="@translate(\'greeting\', { name: value })">@translate(\'greeting\', { name: value })</p>', {
      value: '{{ secret }}" onmouseover="alert(1)<img src=x>$&', secret: 'private-value',
    }, { options: { root, i18n: { translationsDir, locale: 'en', format: 'json', cache: false } } })
    expect(out).not.toContain('private-value')
    expect(out).not.toContain('<img')
    expect(out).not.toContain(' onmouseover="')
    expect(out).not.toContain('@translate')
    expect(out).toContain('$&amp;')
  })

  it('escapes validation messages in text and attribute contexts', async () => {
    const out = await renderString('@errors(form.email)<p title="{{ message }}">{{ message }}</p>@enderrors', {
      form: { email: ['{{ secret }}" onmouseover="alert(1)<img src=x>'] }, secret: 'private-value',
    })
    expect(out).not.toContain('private-value')
    expect(out).not.toContain('<img')
    expect(out).not.toContain(' onmouseover="')
  })
})
