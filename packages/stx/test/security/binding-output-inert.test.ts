/**
 * Text a binding writes is data. The runtime scans text nodes for `{{ expr }}`
 * and evaluates what it finds against the page scope, and that scan used to
 * run over the text `:text`, `:html` and `{{ }}` interpolation had just
 * written: a stranger's shared prompt containing `{{ ... }}` ran an expression
 * in the viewer's page. The scan belongs to authored template text only.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let booted = 0

async function hydrate(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `inert_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('bindings write inert text', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it(':text shows a hostile {{ }} string verbatim', async () => {
    const body = '{{ 1 + 1 }} and {{ secret }}'
    await hydrate('<p id="e" :text="body"></p>', { body: window.stx.state(body), secret: 'sk-live-000' })
    expect(document.querySelector('#e').textContent).toBe(body)
  })

  it(':text stays inert after the value changes', async () => {
    const body = window.stx.state('first')
    await hydrate('<p id="e" :text="body"></p>', { body, secret: 'sk-live-000' })
    body.set('{{ secret }}')
    await settle()
    expect(document.querySelector('#e').textContent).toBe('{{ secret }}')
  })

  it(':html neither evaluates {{ }} nor binds attributes on injected markup', async () => {
    const markup = '<b id="in" :text="secret">{{ secret }}</b>'
    await hydrate('<div id="e" :html="markup"></div>', { markup: window.stx.state(markup), secret: 'sk-live-000' })
    const e = document.querySelector('#e')
    expect(e.textContent).not.toContain('sk-live-000')
    expect(e.textContent).toBe('{{ secret }}')
  })

  it('{{ }} interpolation does not re-scan its own output', async () => {
    await hydrate('<p id="e">Hi {{ body }}</p>', { body: window.stx.state('{{ secret }}'), secret: 'sk-live-000' })
    const text = document.querySelector('#e').textContent
    expect(text).toBe('Hi {{ secret }}')
  })

  it('rows of a :for list show hostile text verbatim', async () => {
    const rows = [{ id: 1, t: '{{ secret }}' }, { id: 2, t: '{{ 6 * 7 }}' }]
    await hydrate(
      '<ul><li :for="r in rows" :key="r.id" class="row"><span :text="r.t"></span><i>{{ r.t }}</i></li></ul>',
      { rows: window.stx.state(rows), secret: 'sk-live-000' },
    )
    const li = Array.from(document.querySelectorAll('li')) as any[]
    expect(li.length).toBe(2)
    expect(li[0].textContent).toBe('{{ secret }}{{ secret }}')
    expect(li[1].textContent).toBe('{{ 6 * 7 }}{{ 6 * 7 }}')
  })

  it('still evaluates a real mustache next to hostile text', async () => {
    await hydrate('<p id="e">{{ a }}</p><p id="f" :text="b"></p>', { a: window.stx.state('ok'), b: window.stx.state('{{ a }}') })
    expect(document.querySelector('#e').textContent).toBe('ok')
    expect(document.querySelector('#f').textContent).toBe('{{ a }}')
  })
})

describe('the server render does not re-read interpolated data as a template', () => {
  const FIXTURE = path.join(import.meta.dir, 'binding-output-inert.stx')
  const render = (template: string): Promise<string> =>
    processDirectives(template, {}, FIXTURE, { root: import.meta.dir, buildMode: 'serve', cache: false } as never, new Set<string>())

  it('escapes {{ }} in text, attributes and loop rows, so the client never sees an expression', async () => {
    const html = await render(
      '<script server>\nconst body = \'{{ 6*7 }} {{ secret }}\'\nconst secret = \'sk-live-000\'\nconst rows = [{ t: \'{{ secret }}\' }]\n</script>\n'
      + '<p title="{{ body }}">{{ body }}</p><ul>@foreach(rows as r)<li>{{ r.t }}</li>@endforeach</ul>',
    )
    expect(html).not.toContain('42')
    expect(html).not.toContain('sk-live-000')
    // No run of two literal braces survives for the browser to match.
    expect(html).not.toMatch(/\{\{[^<]*\}\}/)
  })

  it('keeps @{{ }} literal and unevaluated in text and in attributes', async () => {
    const html = await render('<script server>\nconst name = \'Alice\'\n</script>\n<p id="t">@{{ name }}</p><p title="@{{ name }}">x</p>')
    expect(html).not.toContain('Alice')
    expect(html).not.toContain('@{{')
  })
})
