/**
 * The bare-boolean-attribute sentinel never reaches a response
 * (stacksjs/stx#1816).
 *
 * Prop resolution marks an attribute written bare (`<X open>` rather than
 * `<X open="true">`) with a sentinel that carries a leading NUL, precisely so it
 * cannot collide with an author-written value. That makes it the one string that
 * must never survive into output.
 *
 * It did. A signal-driven `@if`/`@else` chain is rewritten into element-level
 * directives, so `@else` lands on a builtin as a bare attribute. Every
 * `@`-prefixed attribute is classified as an EVENT, and the event-forwarding
 * path emitted `@else="<sentinel>"` onto the rendered root.
 *
 * The stray attribute is the least of it. A NUL makes the response invalid
 * UTF-8, so `file` reports it as data rather than HTML — and `grep` treats it as
 * binary and goes SILENT. Not zero matches: no output at all. Any verification
 * step that greps rendered HTML then returns an empty string and reads as a
 * pass, which is how this went unnoticed.
 *
 * Both conditions are required: a signal-driven chain (a server-value chain is
 * resolved during render and the branch simply dropped) around a BUILTIN (a user
 * component takes a different path).
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { forwardStaticAttrs } from '../../src/builtins/attrs'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { BOOLEAN_ATTRIBUTE_SENTINEL, stripControlChars } from '../../src/prop-sentinels'

let dir: string

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-nul-'))
  fs.mkdirSync(path.join(dir, 'components'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'components', 'Btn.stx'), '<button class="btn"><slot /></button>')
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

async function render(template: string) {
  return processDirectives(template, {}, path.join(dir, 'page.stx'), {
    ...defaultConfig,
    componentsDir: path.join(dir, 'components'),
    partialsDir: dir,
    layoutsDir: dir,
    autoShell: false,
  } as never, new Set<string>())
}

const CHAIN = (inner: (cls: string) => string) => `<script client>
const pro = state(false)
</script>
<div>
@if (pro())
  ${inner('a')}
@else
  ${inner('b')}
@endif
</div>`

describe('a signal-driven @if/@else around a builtin', () => {
  it('emits no NUL bytes', async () => {
    const out = await render(CHAIN(cls => `<StxLink to="/pricing" class="${cls}">x</StxLink>`))
    expect(out.match(/\0/g) || []).toHaveLength(0)
  })

  it('does not leak the sentinel text either', async () => {
    const out = await render(CHAIN(cls => `<StxLink to="/pricing" class="${cls}">x</StxLink>`))
    expect(out).not.toContain('stx-boolean-attribute')
  })

  it('still forwards @else as a bare directive the runtime can see', async () => {
    // Dropping it would be the wrong fix — the runtime binds the chain off
    // these element-level attributes.
    const out = await render(CHAIN(cls => `<StxLink to="/pricing" class="${cls}">x</StxLink>`))
    const anchors = out.match(/<a [^>]*@else[^>]*>/g) || []
    expect(anchors).toHaveLength(1)
    expect(anchors[0]).toContain('@else ')
    expect(anchors[0]).not.toContain('@else=')
  })

  it('is clean for a user component too', async () => {
    const out = await render(CHAIN(cls => `<Btn class="${cls}">x</Btn>`))
    expect(out.match(/\0/g) || []).toHaveLength(0)
  })

  it('is clean for a plain element', async () => {
    const out = await render(CHAIN(cls => `<a href="/pricing" class="${cls}">x</a>`))
    expect(out.match(/\0/g) || []).toHaveLength(0)
  })
})

describe('forwardStaticAttrs', () => {
  const props = (statics: Record<string, unknown>) => ({
    static: statics,
    staticNames: Object.fromEntries(Object.keys(statics).map(k => [k, k])),
    serverDynamic: {},
    clientReactive: {},
  }) as never

  it('renders the sentinel as a bare attribute', () => {
    expect(forwardStaticAttrs(props({ '@else': BOOLEAN_ATTRIBUTE_SENTINEL }), new Set())).toEqual(['@else'])
  })

  it('still renders a real boolean as a bare attribute', () => {
    expect(forwardStaticAttrs(props({ open: true }), new Set())).toEqual(['open'])
    expect(forwardStaticAttrs(props({ open: false }), new Set())).toEqual([])
  })

  it('strips a stray control character from a value', () => {
    // Belt and braces: one NUL invalidates the whole document.
    expect(forwardStaticAttrs(props({ title: 'a\0b' }), new Set())).toEqual(['title="ab"'])
  })

  it('leaves ordinary values alone', () => {
    expect(forwardStaticAttrs(props({ 'aria-label': 'Shop' }), new Set())).toEqual(['aria-label="Shop"'])
  })
})

describe('stripControlChars', () => {
  it('removes NULs and returns other strings unchanged', () => {
    expect(stripControlChars('a\0b')).toBe('ab')
    const clean = 'no controls here'
    expect(stripControlChars(clean)).toBe(clean)
  })
})
