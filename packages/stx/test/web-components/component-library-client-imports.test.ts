import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture } from '../../test-utils/browser-fixture'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild

// Pack and install small npm dependencies without consulting a registry or the
// developer's credentials/cache. Different versions make a wrong base visible.
async function installHelper(root: string, directory: string, value: string, version: string) {
  const packageDir = join(root, `helper-${version}`)
  const archive = join(root, `helper-${version}.tgz`)
  await Bun.write(join(packageDir, 'package.json'), JSON.stringify({
    name: 'review-helper', version, type: 'module',
    exports: { '.': { browser: './browser.js', default: './default.js' } },
    imports: { '#value': './value.js' },
  }))
  await Bun.write(join(packageDir, 'browser.js'), "export { value } from '#value'")
  await Bun.write(join(packageDir, 'value.js'), `export const value = ${JSON.stringify(value)}`)
  await Bun.write(join(packageDir, 'default.js'), "export const value = 'WRONG-node-condition'")
  await Bun.write(join(directory, 'package.json'), JSON.stringify({
    name: `consumer-${version}`, private: true, type: 'module',
    dependencies: { 'review-helper': archive }, imports: { '#local': './src/local.ts' },
  }))
  const env = { PATH: process.env.PATH!, HOME: join(root, 'home'), BUN_INSTALL_CACHE_DIR: join(root, 'cache') }
  for (const [cwd, args] of [
    [packageDir, ['pm', 'pack', '--ignore-scripts', '--filename', archive]],
    [directory, ['install', '--ignore-scripts']],
  ] as const) {
    const child = Bun.spawn([process.execPath, '--no-env-file', ...args], { cwd, env, stdout: 'pipe', stderr: 'pipe' })
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    if (code) throw new Error(`Fixture package operation failed: ${stdout}\n${stderr}`)
  }
}

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
      await Bun.write(join(inputDir, 'data.json'), '{"label":"attributes"}')
      await Bun.write(join(inputDir, 'runtime.js'), "export const runtimeValue = 'source-runtime'")
      await Bun.write(join(inputDir, 'private.ts'), "export function secret() { return 'PRIVATE-server-sentinel' }")
      await Bun.write(join(inputDir, 'Probe.stx'), `<script component type="application/json">{"properties":{"label":{"type":"string","default":"initial"}}}</script>
<script server>
import { secret } from './private'
const caption = secret()
</script>
<script>
const caption = 'browser scope'
</script>
<script client>
import greeting, {
  /* helper's public value */ named as renamed,
  connect,
  next,
} from './helpers.ts'
import type { NeverLoaded } from './missing-type-only-module'
import { runtimeValue } from './runtime.js'
import data from /* attributes; aren't declaration boundaries */ './data.json' with /* comment's punctuation; */ { type: 'json' }
function read(): string { return [greeting(), renamed, data.label, runtimeValue, this.label, this.connections, this.disconnects || 0].join(':') }
function onConnect(): void { connect(this) }
function count(): number { return next() }
</script>
<script client>
import * /* shared; immutable */ as helpers from './helpers.ts'
import /* side-effect's registration; */ './side-effect.ts'
function onDisconnect(): void { helpers.disconnect(this) }
</script>
<template><p>{{ caption }}:{{ label }}</p><slot></slot></template>`)
      await Bun.write(join(inputDir, 'Mirror.stx'), `<script server>
import { readFileSync } from 'node:fs'
const privateContent = readFileSync('/PRIVATE-server-only', 'utf8')
</script><script client>
import { next } from './helpers.ts'
function count(): number { return next() }
</script><template><p>Mirror</p></template>`)
      const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'imports', bundle })
      for (const file of result.files.filter(file => file.endsWith('.js'))) expect(await Bun.file(file).text()).not.toContain('PRIVATE-server-')
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
      expect(await fixture.view.evaluate("document.querySelector('imports-probe').read()")).toBe('default-transitive:named:attributes:source-runtime:initial:1:0')
      expect(await fixture.view.evaluate("document.querySelectorAll('imports-probe')[1].read()")).toBe('default-transitive:named:attributes:source-runtime:second:1:0')
      expect(await fixture.view.evaluate("document.querySelectorAll('imports-probe')[1].querySelector('p').textContent")).toBe('browser scope:second')
      expect(await fixture.view.evaluate("!!customElements.get('import-side-effect')")).toBe(true)
      expect(await fixture.view.evaluate("document.querySelector('imports-probe').count()")).toBe(1)
      expect(await fixture.view.evaluate("document.querySelector('imports-mirror').count()")).toBe(2)
      expect(await fixture.view.evaluate("document.querySelector('imports-probe b').textContent")).toBe('slot')
      await fixture.view.evaluate("(()=>{ globalThis.detached = document.querySelector('imports-probe'); detached.remove() })()")
      expect(await fixture.view.evaluate('detached.read()')).toBe('default-transitive:named:attributes:source-runtime:initial:1:1')
      await fixture.view.evaluate("(()=>{ detached.label = 'updated'; document.body.append(detached) })()")
      expect(await fixture.view.evaluate('detached.read()')).toBe('default-transitive:named:attributes:source-runtime:updated:2:1')
      expect(await fixture.view.evaluate("typeof window.stx + ':' + typeof window.greeting")).toBe('undefined:undefined')
    }
    finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
  }, 30_000)
}

for (const bundle of [true, false]) {
  test(`imports use the source package context for nested and detached ${bundle ? 'bundles' : 'ESM output'}`, async () => {
    const root = createTempDir('stx-package-origin-')
    let fixture: ReturnType<typeof createBrowserFixture> | undefined
    try {
      const project = join(root, 'project'), widgets = join(project, 'widgets'), inputDir = join(widgets, 'src')
      await installHelper(root, project, 'WRONG-root-version', '1.0.0')
      await installHelper(root, widgets, 'correct-source-browser', '2.0.0')
      await Bun.write(join(project, 'src', 'local.ts'), "export const local = 'WRONG-root-map'")
      await Bun.write(join(inputDir, 'local.ts'), "export const local = 'source-import-map'")
      await Bun.write(join(inputDir, 'Probe.stx'), `<script client>
import { value } from 'review-helper'
import { local } from '#local'
function read(): string { return value + ':' + local }
</script><template><p>Package origin</p></template>`)
      const outputs = []
      for (const outputDir of [join(project, 'dist'), join(root, 'separate', 'dist')]) {
        const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'origin', bundle })
        const javascript = (await Promise.all(result.files.filter(file => file.endsWith('.js')).map(file => Bun.file(file).text()))).join('\n')
        expect(javascript).toContain('correct-source-browser')
        expect(javascript).not.toContain('WRONG-root-version')
        expect(javascript).not.toContain('WRONG-node-condition')
        expect(javascript).not.toContain('WRONG-root-map')
        outputs.push({ outputDir, result })
      }
      // Nothing in the distributed graph may resolve against the author tree.
      await rm(widgets, { recursive: true })
      await rm(join(project, 'src'), { recursive: true })
      await rm(join(project, 'node_modules'), { recursive: true })
      for (const { outputDir, result } of outputs) {
        fixture = createBrowserFixture({
          createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
            const pathname = new URL(request.url).pathname
            if (pathname === '/') return new Response(`<!doctype html><script type="module" src="/${bundle ? 'bundle' : 'index'}.js"></script><origin-probe></origin-probe>`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; base-uri 'none'" } })
            const file = join(outputDir, pathname)
            return result.files.includes(file) && await Bun.file(file).exists() ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
          } }),
          createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
        })
        await fixture.view.navigate(fixture.url)
        await fixture.waitFor("!!customElements.get('origin-probe')", value => value === true)
        expect(await fixture.view.evaluate("document.querySelector('origin-probe').read()")).toBe('correct-source-browser:source-import-map')
        fixture.close()
      }
    }
    finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
  }, 30_000)
}

for (const bundle of [true, false]) {
  test(`dynamic-only imports distribute a lazy shared graph in ${bundle ? 'standalone bundles' : 'ESM output'}`, async () => {
    const root = createTempDir('stx-lazy-package-origin-')
    let fixture: ReturnType<typeof createBrowserFixture> | undefined
    try {
      const project = join(root, 'project'), widgets = join(project, 'widgets'), inputDir = join(widgets, 'src')
      await installHelper(root, project, 'WRONG-root-version', '1.0.0')
      await installHelper(root, widgets, 'correct-source-browser', '2.0.0')
      await Bun.write(join(project, 'src', 'local.ts'), "export const local = 'WRONG-root-map'")
      await Bun.write(join(inputDir, 'local.ts'), "export const local = 'source-import-map'")
      await Bun.write(join(inputDir, 'lazy.ts'), `customElements.define('lazy-import-effect', class extends HTMLElement {})
let counter = 0
export function next() { return ++counter }
`)
      await Bun.write(join(inputDir, 'Probe.stx'), `<script client>
async function read(): Promise<string> {
  const [{ value }, { local }] = await Promise.all([import('review-helper'), import('#local')])
  return value + ':' + local
}
async function count(): Promise<number> { return (await import('./lazy.ts')).next() }
</script><template><p>Lazy imports</p></template>`)
      await Bun.write(join(inputDir, 'Mirror.stx'), `<script client>
async function count(): Promise<number> { return (await import('./lazy.ts')).next() }
</script><template>Mirror</template>`)
      const outputs = []
      for (const outputDir of [join(project, 'dist'), join(root, 'separate', 'dist')]) {
        const result = await buildComponentLibrary({ inputDir, outputDir, prefix: 'lazy', bundle })
        const javascript = (await Promise.all(result.files.filter(file => file.endsWith('.js')).map(file => Bun.file(file).text()))).join('\n')
        expect(javascript).toContain('correct-source-browser')
        expect(javascript).not.toContain('WRONG-root-version')
        expect(javascript).not.toContain('WRONG-node-condition')
        expect(javascript).not.toContain('WRONG-root-map')
        expect(await Bun.file(join(outputDir, 'lazy-probe.d.ts')).text()).toContain('read(): Promise<string>')
        outputs.push({ outputDir, result })
      }
      await rm(widgets, { recursive: true })
      await rm(join(project, 'src'), { recursive: true })
      await rm(join(project, 'node_modules'), { recursive: true })
      for (const { outputDir, result } of outputs) {
        fixture = createBrowserFixture({
          createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
            const pathname = new URL(request.url).pathname
            if (pathname === '/') return new Response(`<!doctype html><script type="module" src="/${bundle ? 'bundle' : 'index'}.js"></script><lazy-probe></lazy-probe><lazy-mirror></lazy-mirror>`, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; base-uri 'none'" } })
            const file = join(outputDir, pathname)
            return result.files.includes(file) && await Bun.file(file).exists() ? new Response(Bun.file(file), { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
          } }),
          createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
        })
        await fixture.view.navigate(fixture.url)
        await fixture.waitFor("!!customElements.get('lazy-probe')", value => value === true)
        expect(await fixture.view.evaluate("!!customElements.get('lazy-import-effect')")).toBe(false)
        expect(await fixture.view.evaluate("document.querySelector('lazy-probe').read()")).toBe('correct-source-browser:source-import-map')
        expect(await fixture.view.evaluate("document.querySelector('lazy-probe').count()")).toBe(1)
        expect(await fixture.view.evaluate("document.querySelector('lazy-mirror').count()")).toBe(2)
        expect(await fixture.view.evaluate("!!customElements.get('lazy-import-effect')")).toBe(true)
        expect(await fixture.view.evaluate("typeof window.stx + ':' + typeof window.next")).toBe('undefined:undefined')
        fixture.close()
      }
    }
    finally { fixture?.close(); await rm(root, { recursive: true, force: true }) }
  }, 30_000)

  test(`dynamic-only server imports fail the ${bundle ? 'standalone' : 'ESM'} browser build`, async () => {
    const root = createTempDir('stx-lazy-server-import-')
    try {
      const inputDir = join(root, 'source')
      for (const specifier of ['node:fs', 'bun']) {
        await Bun.write(join(inputDir, 'Unsafe.stx'), `<script client>
async function read(): Promise<unknown> { return import('${specifier}') }
</script><template>Unsafe</template>`)
        await expect(buildComponentLibrary({ inputDir, outputDir: join(root, 'dist'), bundle })).rejects.toThrow(/Server-only import|browser/)
      }
    }
    finally { await rm(root, { recursive: true, force: true }) }
  })
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
