import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
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

beforeEach(() => {
  previousStx = window.stx
  document.body.innerHTML = ''
  installNodeConstants()
  // Run the real runtime and the emitted partial setup, not handler substitutes.
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterEach(() => {
  document.body.innerHTML = ''
  window.stx = previousStx
  clearDevCaches()
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

const server = `
export const cta = { invalid: captureLocale === 'de' ? 'Bitte E-Mail prüfen' : 'Check your email' }
export const unused = 'unused-server-value-must-not-cross'
const __privateValue = 'private-server-value-must-not-cross'
`
const client = `
const message = state('')
function submitCapture() { message.set(cta.invalid) }
function replaceCopy(value) { cta.invalid = value }
`

function app(serverCode = server, clientCode = client, clientFirst = false) {
  const dir = createTempDir('stx-include-bridge-')
  made.push(dir)
  const partialsDir = path.join(dir, 'partials')
  mkdirSync(partialsDir)
  const serverBlock = `<script server>${serverCode}</script>`
  const clientBlock = `<script client>${clientCode}</script>`
  writeFileSync(path.join(partialsDir, 'capture.stx'), `${clientFirst ? clientBlock + serverBlock : serverBlock + clientBlock}
<section><button @click="submitCapture()">Validate</button><p :text="message"></p></section>`)
  writeFileSync(path.join(partialsDir, 'panel.stx'), '<article>@include(\'capture\', { captureLocale: \'de\' })</article>')
  const options = { root: dir, partialsDir, componentsDir: partialsDir, buildMode: 'serve' as const, debug: false }
  return {
    render: (body: string) => processDirectives(`<html><body>${body}</body></html>`, {}, path.join(dir, 'page.stx'), options, new Set()),
  }
}

// eslint-disable-next-line ts/no-explicit-any
function mount(html: string): any[] {
  document.body.innerHTML = html
  for (const script of document.querySelectorAll('script[data-stx-owner]')) {
    // Execute the compiler's actual scoped setup.
    // eslint-disable-next-line no-new-func
    new Function(script.textContent)()
  }
  return Array.from(document.querySelectorAll('[data-stx-scope]')).map((element: any) => window.stx._scopes?.[element.getAttribute('data-stx-scope')])
}

describe('server data in scoped partial scripts', () => {
  it('supplies the exported copy when the real nested include handler runs', async () => {
    const fixture = app()
    const [scope] = mount(await fixture.render('@include(\'panel\')'))
    expect(scope).toBeDefined()
    expect(() => scope.submitCapture()).not.toThrow()
    expect(scope.message()).toBe('Bitte E-Mail prüfen')
  })

  it('can seed a signal from an include server export', async () => {
    const fixture = app(server, client.replace("state('')", 'state(cta.invalid)'))
    const [scope] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'en\' })'))
    expect(scope.message()).toBe('Check your email')
  })

  it('keeps different local payloads distinct in repeated includes', async () => {
    const fixture = app()
    const scopes = mount(await fixture.render('@include(\'capture\', { captureLocale: \'en\' })@include(\'capture\', { captureLocale: \'de\' })'))
    expect(scopes).toHaveLength(2)
    for (const scope of scopes)
      scope.submitCapture()
    expect(scopes.map(scope => scope.message())).toEqual(['Check your email', 'Bitte E-Mail prüfen'])
  })

  it('creates an independent object for identical include payloads', async () => {
    const fixture = app()
    const [first, second] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'en\' })@include(\'capture\', { captureLocale: \'en\' })'))
    first.replaceCopy('First instance only')
    first.submitCapture()
    second.submitCapture()
    expect(first.message()).toBe('First instance only')
    expect(second.message()).toBe('Check your email')
  })

  it('does not retain an earlier request payload in an include cache', async () => {
    const fixture = app()
    const [english] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'en\' })'))
    english.submitCapture()
    expect(english.message()).toBe('Check your email')
    const [german] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'de\' })'))
    german.submitCapture()
    expect(german.message()).toBe('Bitte E-Mail prüfen')
  })

  it('extracts server values before client setup regardless of block order', async () => {
    const fixture = app(server, client, true)
    const [scope] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'de\' })'))
    scope.submitCapture()
    expect(scope.message()).toBe('Bitte E-Mail prüfen')
  })

  it('also bridges the non-signal scoped script path', async () => {
    const fixture = app(server, `const message = ''; function submitCapture() { return cta.invalid }`)
    const [scope] = mount(await fixture.render('@include(\'capture\', { captureLocale: \'de\' })'))
    expect(scope.submitCapture()).toBe('Bitte E-Mail prüfen')
  })

  it('does not replace a client-owned binding or expose unused private values', async () => {
    const fixture = app(server, `const cta = { invalid: 'Client value' }; ${client}`)
    const html = await fixture.render('@include(\'capture\', { captureLocale: \'en\' })')
    expect(html).not.toContain('Check your email')
    expect(html).not.toContain('unused-server-value-must-not-cross')
    expect(html).not.toContain('private-server-value-must-not-cross')
    const [scope] = mount(html)
    scope.submitCapture()
    expect(scope.message()).toBe('Client value')
  })

  it('escapes script delimiters in the generated bridge', async () => {
    const value = '</script><img src=x onerror=broken> " &'
    const literal = JSON.stringify({ invalid: value }).replace(/</g, '\\u003c')
    const fixture = app(`export const cta = ${literal}`)
    const html = await fixture.render('@include(\'capture\')')
    expect(html).not.toContain('</script><img src=x')
    const [scope] = mount(html)
    scope.submitCapture()
    expect(scope.message()).toBe(value)
  })
})
