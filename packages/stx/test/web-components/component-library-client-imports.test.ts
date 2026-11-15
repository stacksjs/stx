import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild

// The public compiler and an ordinary browser host catch missing/privileged
// runtime imports. They do not exercise an application's network protocol.
for (const bundle of [true, false]) {
  test(`client-only module imports run from the distributed ${bundle ? 'bundle' : 'ESM elements'} without source files or ambient helpers`, async () => {
    const root = createTempDir('stx-client-imports-')
    let fixture: ReturnType<typeof createBrowserFixture> | undefined
    try {
      const inputDir = join(root, 'source'), outputDir = join(root, 'dist')
      await Bun.write(join(inputDir, 'leaf.ts'), "export const suffix = 'transitive'\n")
      await Bun.write(join(inputDir, 'helpers.ts'), `import { suffix } from './leaf'
export default function greeting() { return 'default-' + suffix }
export const named = 'named'
let counter = 0
export function next() { return ++counter }
export function connect(element: HTMLElement & { connections?: number }) { element.connections = (element.connections || 0) + 1 }
export function disconnect(element: HTMLElement & { disconnects?: number }) { element.disconnects = (element.disconnects || 0) + 1 }
`)
      await Bun.write(join(inputDir, 'side-effect.ts'), "customElements.define('import-side-effect', class extends HTMLElement {})")
      await Bun.write(join(inputDir, 'Probe.stx'), `<script component type="application/json">{"properties":{"label":{"type":"string","default":"initial"}}}</script>
<script client>
import greeting, {
  named as renamed,
  connect,
  next,
} from './helpers.ts'
import type { NeverLoaded } from './missing-type-only-module'
function read(): string { return [greeting(), renamed, this.label, this.connections, this.disconnects || 0].join(':') }
function onConnect(): void { connect(this) }
function count(): number { return next() }
</script>
<script client>
import * as helpers from './helpers.ts'
import './side-effect.ts'
function onDisconnect(): void { helpers.disconnect(this) }
</script>
<template><p>{{ label }}</p><slot></slot></template>`)
      await Bun.write(join(inputDir, 'Mirror.stx'), `<script client>
import { next } from './helpers.ts'
function count(): number { return next() }
</script><template><p>Mirror</p></template>`)
      const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'imports', bundle })
      expect(await Bun.file(join(outputDir, 'imports-probe.d.ts')).text()).toContain('read(): string')
      // A registry consumer receives only dist, never the author's source tree.
      await rm(inputDir, { recursive: true })
      fixture = createBrowserFixture({
        createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
          const pathname = new URL(request.url).pathname
          if (pathname === '/') return new Response(`<!doctype html><script type="module" src="/${bundle ? 'bundle' : 'index'}.js"></script><imports-probe><b>slot</b></imports-probe><imports-probe label="second"></imports-probe><imports-mirror></imports-mirror>`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; base-uri 'none'" } })
          const file = join(outputDir, pathname)
          return result.files.includes(file) && await Bun.file(file).exists() ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
        } }),
        createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
      })
      await fixture.view.navigate(fixture.url)
      await fixture.waitFor("!!customElements.get('imports-probe')", value => value === true)
      expect(await fixture.view.evaluate("document.querySelector('imports-probe').read()")).toBe('default-transitive:named:initial:1:0')
      expect(await fixture.view.evaluate("document.querySelectorAll('imports-probe')[1].read()")).toBe('default-transitive:named:second:1:0')
      expect(await fixture.view.evaluate("!!customElements.get('import-side-effect')")).toBe(true)
      expect(await fixture.view.evaluate("document.querySelector('imports-probe').count()")).toBe(1)
      expect(await fixture.view.evaluate("document.querySelector('imports-mirror').count()")).toBe(2)
      expect(await fixture.view.evaluate("document.querySelector('imports-probe b').textContent")).toBe('slot')
      await fixture.view.evaluate("(()=>{ globalThis.detached = document.querySelector('imports-probe'); detached.remove() })()")
      expect(await fixture.view.evaluate('detached.read()')).toBe('default-transitive:named:initial:1:1')
      await fixture.view.evaluate("(()=>{ detached.label = 'updated'; document.body.append(detached) })()")
      expect(await fixture.view.evaluate('detached.read()')).toBe('default-transitive:named:updated:2:1')
      expect(await fixture.view.evaluate("typeof window.stx + ':' + typeof window.greeting")).toBe('undefined:undefined')
    }
    finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
  }, 30_000)
}

test('browser dependency failures are reported while building elements, including without a standalone bundle', async () => {
  const root = createTempDir('stx-client-server-import-')
  try {
    const inputDir = join(root, 'source')
    await Bun.write(join(inputDir, 'server.ts'), "import { readFileSync } from 'node:fs'; export function secret() { return readFileSync('/private', 'utf8') }")
    await Bun.write(join(inputDir, 'Unsafe.stx'), `<script client>
import { secret } from './server'
function read(): string { return secret() }
</script><template><p>Unsafe</p></template>`)
    await expect(buildComponentLibrary({ inputDir, outputDir: join(root, 'dist'), bundle: false })).rejects.toThrow(/node:fs|browser/)
  }
  finally { await rm(root, { recursive: true, force: true }) }
})
