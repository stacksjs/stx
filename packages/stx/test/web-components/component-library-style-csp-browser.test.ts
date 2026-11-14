import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

test('build-result style hashes authorize exact runtime styles under a browser hash-only CSP', async () => {
  const root = createTempDir('stx-library-style-csp-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    const input = join(root, 'source'), output = join(root, 'dist')
    await Bun.write(join(input, 'browser-leaf.ts'), 'export const title = document.documentElement.tagName')
    await Bun.write(join(input, 'browser.ts'), "export { title } from './browser-leaf'")
    const modes = [false, 'open', 'closed'] as const
    for (const [index, mode] of modes.entries()) {
      const source = `<script component type="application/json">${JSON.stringify({ tag: `csp-card-${index}`, shadowDOM: mode, properties: { count: { type: 'number', default: 0 } } })}</script>
<script>import { title as browserTitle } from './browser'
const title = browserTitle</script>
<template><p>{{ title }} {{ count }}</p></template>
<style>/* Preserve café, spacing and \`quotes\` ${index} */
p { color: rgb(12, 34, 56); }\r/* lone carriage return */</style>`
      await Bun.write(join(input, `Card${index}.stx`), source.replaceAll('\n', '\r\n'))
    }
    const result = await buildComponentLibrary({ inputDir: input, outputDir: output, css: false, minify: true })
    const hashes = result.components.filter(component => component.styles).map(component => `'sha256-${createHash('sha256').update(component.styles, 'utf8').digest('base64')}'`)
    const csp = `default-src 'none'; script-src 'self'; img-src 'self'; style-src ${hashes.join(' ')}; base-uri 'none'`
    const emitted = new Map(result.files.filter(file => file.endsWith('.js')).map(file => [`/${relative(output, file).split(sep).join('/')}`, file]))
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch(request) {
          const pathname = new URL(request.url).pathname
          if (pathname === '/') return new Response(`<!doctype html><link rel="icon" href="/favicon.ico"><script src="/probe.js"></script><script type="module" src="/bundle.js"></script>${result.components.map(component => `<${component.tag}></${component.tag}>`).join('')}`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': csp } })
          if (pathname === '/favicon.ico') return new Response(null, { status: 204 })
          if (pathname === '/probe.js') return new Response("globalThis.violations=[];globalThis.errors=[];addEventListener('error',event=>errors.push(event.message));addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));addEventListener('securitypolicyviolation',event=>violations.push(event.effectiveDirective))", { headers: { 'Content-Type': 'text/javascript' } })
          const file = emitted.get(pathname)
          return file ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response('Not found', { status: 404 })
        },
      }),
      createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
    })
    await fixture.view.navigate(fixture.url)
    const hydrated = await fixture.waitFor(`Array.from(document.querySelectorAll('csp-card-0,csp-card-1,csp-card-2')).every(element=>element.hasAttribute('hydrated'))`, value => value === true)
    expect(await fixture.view.evaluate('JSON.stringify(errors)')).toBe('[]')
    expect(await fixture.view.evaluate('JSON.stringify(violations)')).toBe('[]')
    expect(hydrated).toBe(true)
    const inspect = `(async()=>{
      const results=[];
      for(const tag of ${JSON.stringify(result.components.map(component => component.tag))}){
        const element=document.querySelector(tag);
        element.count=1;await element.updateComplete;
        results.push({styles:element.renderRoot.querySelector('style')?.textContent??null,color:getComputedStyle(element.renderRoot.querySelector('p')).color,text:element.renderRoot.querySelector('p').textContent});
      }
      return JSON.stringify(results);
    })()`
    const observed = JSON.parse(await fixture.view.evaluate<string>(inspect))
    expect(observed).toEqual(result.components.map(component => ({ styles: component.shadowMode ? component.styles : null, color: component.shadowMode ? 'rgb(12, 34, 56)' : 'rgb(0, 0, 0)', text: 'HTML 1' })))
    for (const [index, component] of result.components.entries()) {
      expect(component.styles).toBe(`/* Preserve café, spacing and \`quotes\` ${index} */\np { color: rgb(12, 34, 56); }\n/* lone carriage return */`)
    }
    expect(await fixture.view.evaluate('JSON.stringify(violations)')).toBe('[]')
    // A different inline style proves the response really enforces the hashes.
    await fixture.view.evaluate("(()=>{const blocked=document.createElement('style');blocked.textContent='p { color: rgb(200, 0, 0); }';document.querySelector('csp-card-1').renderRoot.appendChild(blocked);return true})()")
    expect(await fixture.waitFor('violations.includes("style-src-elem")', value => value === true)).toBe(true)
    expect(await fixture.view.evaluate("getComputedStyle(document.querySelector('csp-card-1').renderRoot.querySelector('p')).color")).toBe('rgb(12, 34, 56)')
  }
  finally {
    fixture?.close()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
