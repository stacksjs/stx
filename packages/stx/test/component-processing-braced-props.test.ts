/**
 * A `prop={expr}` attribute value is consumed WHOLE (stacksjs/stx#1956).
 *
 * It is not stx syntax -- `:prop="expr"` is -- but the parsers read an unquoted
 * value "until whitespace", which ended the value at `{{` and turned the rest
 * of the object literal into attribute NAMES: `name:`, `'John`, `Doe'`,
 * `notifications:`, `true`, `}}`. Those became render-context keys, and `true`
 * is identifier-shaped but reserved, so it reached `new Function` as a
 * parameter name and took down the whole component's `<script server>`
 * (that half fixed in ffeaec7058).
 *
 * `prop={expr}` now means exactly `:prop="expr"`: it is rewritten to the colon
 * form before props are categorised, so there is one evaluation path rather
 * than two. `={{ ... }}` unwraps to the object literal `{ ... }`.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { findComponentTags, parseMultilineAttributes, unwrapBracedExpression } from '../src/component-processing'
import { processDirectives } from '../src/process'

const Q = String.fromCharCode(39)

describe('braced attribute values are read as one token', () => {
  it('keeps a multi-line object literal together and still sees later attributes', () => {
    const attrs = [
      'id="profileForm"',
      '  initialValues={{',
      `    name: ${Q}John Doe${Q},`,
      '    notifications: true',
      '  }}',
      '  onSubmit={handleEditProfile}',
      '  className="space-y-4"',
    ].join('\n')

    const props = parseMultilineAttributes(attrs)

    expect(Object.keys(props)).toEqual(['id', 'initialValues', 'onSubmit', 'className'])
    expect(props.initialValues).toContain('notifications: true')
    expect(props.onSubmit).toBe('{handleEditProfile}')
    expect(props.className).toBe('space-y-4')
    // The shattering this guards against produced keys like these.
    for (const junk of ['name:', `${Q}John`, 'notifications:', 'true', '}}'])
      expect(Object.keys(props)).not.toContain(junk)
  })

  it('handles nested braces and braces inside quotes', () => {
    const props = parseMultilineAttributes(
      `config={{ a: { b: 1 }, label: "}" }} after="kept"`,
    )

    expect(Object.keys(props)).toEqual(['config', 'after'])
    expect(props.config).toBe('{{ a: { b: 1 }, label: "}" }}')
    expect(props.after).toBe('kept')
  })

  it('degrades to one bad prop when the braces never close', () => {
    const props = parseMultilineAttributes('broken={{ a: 1 unclosed')

    expect(Object.keys(props)).toEqual(['broken'])
  })

  it('carries the whole attribute span through the component tag matcher', () => {
    const html = `<div><Form
  id="profileForm"
  initialValues={{
    name: ${Q}John Doe${Q}
  }}
  className="space-y-4"
>inner</Form></div>`

    const tags = findComponentTags(html, /[A-Z][a-zA-Z0-9]*/)
    expect(tags).toHaveLength(1)

    const props = parseMultilineAttributes(tags[0].attributes)
    expect(Object.keys(props)).toEqual(['id', 'initialValues', 'className'])
  })
})

describe('unwrapBracedExpression', () => {
  it('unwraps a single-brace expression and a JSX double-brace object', () => {
    expect(unwrapBracedExpression('{handler}')).toBe('handler')
    expect(unwrapBracedExpression('{{ a: 1 }}')).toBe('{ a: 1 }')
    expect(unwrapBracedExpression('  { a }  ')).toBe('a')
  })

  it('leaves anything that is not one balanced braced span alone', () => {
    expect(unwrapBracedExpression('plain')).toBeNull()
    expect(unwrapBracedExpression('{a} text {b}')).toBeNull()
    expect(unwrapBracedExpression('{unclosed')).toBeNull()
    expect(unwrapBracedExpression('')).toBeNull()
  })
})

describe('prop={expr} reaches the component as a value, not a string', () => {
  it('evaluates an object literal and a function reference', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stx-braced-props-'))
    mkdirSync(path.join(dir, 'components'), { recursive: true })
    writeFileSync(
      path.join(dir, 'components', 'Probe.stx'),
      '<div class="probe">{{ config.name }}|{{ String(config.flag) }}|{{ typeof onPick }}</div>',
    )

    const page = `<Probe config={{ name: ${Q}Ada${Q}, flag: true }} onPick={pick} />`
    const out = await processDirectives(
      page,
      { pick: () => 1 },
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
      new Set<string>(),
    )

    expect(out).toContain('Ada|true|function')
  })
})

describe('quoted interpolation is not a braced expression', () => {
  it('leaves prop="{{ expr }}" as interpolation, not an object literal', async () => {
    // The distinction is quoting, and only the parser knows it. Rewriting any
    // fully-braced VALUE after parsing also caught this form and evaluated it
    // as the object literal `{ expr }`, which rendered href="[object Object]"
    // in <StxLink to="{{ href }}"> across the auth components.
    const dir = mkdtempSync(path.join(tmpdir(), 'stx-quoted-interp-'))
    mkdirSync(path.join(dir, 'components'), { recursive: true })
    writeFileSync(
      path.join(dir, 'components', 'Echo.stx'),
      '<a href="{{ target }}">go</a>',
    )

    const out = await processDirectives(
      '<Echo target="{{ dest }}" />',
      { dest: '/forgot-password' },
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
      new Set<string>(),
    )

    expect(out).toContain('href="/forgot-password"')
    expect(out).not.toContain('[object Object]')
  })
})
