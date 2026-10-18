import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { renderView } from '../../src/build-views'
import { clearDevCaches } from '../../src/caching'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { createTempDir } from '../../src/temp-dir'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const made: string[] = []
let previousStx: unknown
let previousFactories: unknown

beforeEach(() => {
  previousStx = window.stx
  previousFactories = window.__stxComponentFactories
  document.body.innerHTML = ''
  window.__stxComponentFactories = undefined
  installNodeConstants()
  // Execute the real signals runtime, rather than replacing state/handlers.
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterEach(() => {
  document.body.innerHTML = ''
  window.stx = previousStx
  window.__stxComponentFactories = previousFactories
  clearDevCaches()
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

const client = `
const message = state('')
function submitCapture() { message.set(cta.invalid) }
function replaceCopy(value) { cta.invalid = value }
`
const server = `
export const cta = { invalid: $props.locale === 'de' ? 'Bitte E-Mail prüfen' : 'Check your email' }
export const unused = 'unused-server-value-must-not-cross'
const __privateValue = 'private-server-value-must-not-cross'
`

function app(serverCode = server, clientCode = client, cache = false) {
  const dir = createTempDir('stx-component-bridge-')
  made.push(dir)
  const componentsDir = path.join(dir, 'components')
  mkdirSync(componentsDir)
  writeFileSync(path.join(componentsDir, 'Capture.stx'), `<script server${cache ? ' cache' : ''}>${serverCode}</script>
<script client>${clientCode}</script>
<section><button @click="submitCapture()">Validate</button><p :text="message"></p></section>`)
  writeFileSync(path.join(componentsDir, 'Panel.stx'), '<article><Capture locale="de" /></article>')
  const page = path.join(dir, 'page.stx')
  const options = { componentsDir, root: dir, buildMode: 'serve' as const, debug: false }
  return {
    page,
    options,
    render: (body: string) => processDirectives(`<html><body>${body}</body></html>`, {}, page, options, new Set()),
  }
}

function execute(code: string): void {
  // The compiler's actual output is the regression subject.
  // eslint-disable-next-line no-new-func
  new Function(code)()
}

function mount(html: string): any[] {
  document.body.innerHTML = html
  for (const script of document.querySelectorAll('script[data-stx-component-factories],script[data-stx-owner]')) {
    if (script.getAttribute('type') !== 'stx/island')
      execute(script.textContent)
  }
  return Array.from(document.querySelectorAll('[data-stx-scope]')).map((element: any) => window.stx._scopes?.[element.getAttribute('data-stx-scope')])
}

describe('server data in signal component factories', () => {
  it('makes a nested component export available when its actual handler runs', async () => {
    const fixture = app()
    const html = await fixture.render('<Panel />')
    const [scope] = mount(html)
    expect(scope).toBeDefined()
    expect(() => scope.submitCapture()).not.toThrow()
    expect(scope.message()).toBe('Bitte E-Mail prüfen')
  })

  it('keeps different locales distinct when the compiled island is reused', async () => {
    const fixture = app()
    const scopes = mount(await fixture.render('<Capture locale="en" /><Capture locale="de" />'))
    expect(scopes).toHaveLength(2)
    for (const scope of scopes)
      scope.submitCapture()
    expect(scopes.map(scope => scope.message())).toEqual(['Check your email', 'Bitte E-Mail prüfen'])
  })

  it('creates separate JSON objects even when identical instances share a factory', async () => {
    const fixture = app()
    const html = await fixture.render('<Capture locale="en" /><Capture locale="en" />')
    expect(html).toContain('data-stx-component-factories')
    const [first, second] = mount(html)
    first.replaceCopy('Only the first instance changed')
    first.submitCapture()
    second.submitCapture()
    expect(first.message()).toBe('Only the first instance changed')
    expect(second.message()).toBe('Check your email')
  })

  it('does not retain the first request payload in the compiled island memo', async () => {
    const fixture = app()
    const [english] = mount(await fixture.render('<Capture locale="en" />'))
    english.submitCapture()
    expect(english.message()).toBe('Check your email')
    const [german] = mount(await fixture.render('<Capture locale="de" />'))
    german.submitCapture()
    expect(german.message()).toBe('Bitte E-Mail prüfen')
  })

  it('keeps a cached fragment byte-identical and its handler executable', async () => {
    const fixture = app(server, client, true)
    writeFileSync(fixture.page, '<html><body><Capture locale="de" /><Capture locale="de" /></body></html>')
    const cold = await renderView(fixture.page, {}, fixture.options)
    const warm = await renderView(fixture.page, {}, fixture.options)
    expect(warm).toBe(cold)
    const scopes = mount(warm)
    expect(scopes).toHaveLength(2)
    for (const scope of scopes) {
      scope.submitCapture()
      expect(scope.message()).toBe('Bitte E-Mail prüfen')
    }
  })

  it('does not clobber a client-owned binding with the same name', async () => {
    const fixture = app("export const cta = { invalid: 'server-value-must-not-cross' }", `
const cta = { invalid: 'client-owned' }
${client}`)
    const html = await fixture.render('<Capture />')
    expect(html).not.toContain('server-value-must-not-cross')
    const [scope] = mount(html)
    scope.submitCapture()
    expect(scope.message()).toBe('client-owned')
  })

  it('publishes referenced values without unused or private server bindings', async () => {
    const fixture = app()
    const html = await fixture.render('<Capture locale="en" />')
    expect(html).not.toContain('unused-server-value-must-not-cross')
    expect(html).not.toContain('private-server-value-must-not-cross')
    const [scope] = mount(html)
    scope.submitCapture()
    expect(scope.message()).toBe('Check your email')
  })

  it('carries the bridge in a deferred island without running setup eagerly', async () => {
    const fixture = app()
    mount(await fixture.render('<Capture locale="de" client="visible" />'))
    const deferred = document.querySelector('script[type="stx/island"]')
    expect(deferred).not.toBeNull()
    const id = deferred.getAttribute('data-stx-island')
    expect(window.stx._scopes?.[id]).toBeUndefined()
    // Execute the emitted deferred setup; visibility scheduling has its own tests.
    execute(deferred.textContent)
    const scope = window.stx._scopes[id]
    scope.submitCapture()
    expect(scope.message()).toBe('Bitte E-Mail prüfen')
  })

  it('serializes script delimiters without breaking out of the generated script', async () => {
    const text = '</script><img src=x onerror=broken> " &'
    const json = JSON.stringify({ invalid: text }).replace(/</g, '\\u003c')
    const fixture = app(`export const cta = ${json}`)
    const html = await fixture.render('<Capture />')
    expect(html).not.toContain('</script><img src=x')
    const [scope] = mount(html)
    scope.submitCapture()
    expect(scope.message()).toBe(text)
  })
})
