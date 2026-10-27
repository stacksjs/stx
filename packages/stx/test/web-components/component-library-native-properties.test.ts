import { WebView } from 'bun'
import { afterEach, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'

const roots: string[] = []

async function library(): Promise<{ root: string, output: string }> {
  const root = createTempDir('stx-library-native-properties-')
  roots.push(root)
  const input = join(root, 'source')
  const output = join(root, 'dist')
  await Bun.write(join(input, 'Surface.stx'), `<script server>
const { id, style, onclick, label } = withDefaults(
  defineProps<{ id?: string, style?: string, onclick?: string, label?: string }>(), { label: 'Surface' }
)
</script>
<template><button type="button" data-target="{{ id }}" :style="style">{{ label }}</button></template>`)
  await buildComponentLibrary({ inputDir: input, outputDir: output, prefix: 'native', bundle: false, minify: true })
  return { root, output }
}

afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

it('preserves native style and click APIs while observing their declared attributes', async () => {
  const { output } = await library()
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
    const file = new URL(request.url).pathname
    if (file === '/') return new Response('<!doctype html><script type="module" src="/index.js"></script><native-surface id="initial" style="color: red"></native-surface>', { headers: { 'Content-Type': 'text/html' } })
    const asset = Bun.file(join(output, file))
    return await asset.exists() ? new Response(asset, { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
  } })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await view.evaluate(`document.querySelector('native-surface button')?.textContent`) === 'Surface') break
      await Bun.sleep(20)
    }
    const nativeStyle = await view.evaluate(`(async () => {
      const el = document.querySelector('native-surface');
      const nativeStyle = el.style instanceof CSSStyleDeclaration;
      el.onclick = () => { el.dataset.clicked = String(Number(el.dataset.clicked || 0) + 1) };
      el.id = 'updated';
      if (nativeStyle) el.style.setProperty('--accent', 'blue');
      await el.updateComplete;
      return nativeStyle;
    })()`)
    await view.click('native-surface button')
    expect(nativeStyle).toBe(true)
    expect(await view.evaluate(`document.querySelector('native-surface').dataset.clicked`)).toBe('1')
    expect(await view.evaluate(`document.querySelector('native-surface button').style.getPropertyValue('--accent')`)).toBe('blue')
    expect(await view.evaluate(`document.querySelector('native-surface button').getAttribute('data-target')`)).toBe('updated')
  }
  finally { view.close(); server.stop(true) }
}, 30_000)

it('type checks emitted element declarations against the real DOM without skipping library checks', async () => {
  const { root } = await library()
  await Bun.write(join(root, 'consumer.ts'), `import type { Surface, SurfaceProps } from './dist/index.js'
const element: Surface = document.createElement('native-surface')
const style: CSSStyleDeclaration = element.style
style.setProperty('--accent', 'blue')
element.onclick = event => event.preventDefault()
element.label = element.label.toUpperCase()
export const attributes: SurfaceProps = { style: 'color: red', onclick: 'console.log(event.type)' }
`)
  await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', lib: ['ESNext', 'DOM'], types: [], strict: true, skipLibCheck: false, noEmit: true }, files: ['consumer.ts'] }))
  const check = Bun.spawnSync([process.execPath, '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { cwd: join(import.meta.dir, '../../../..'), stdout: 'pipe', stderr: 'pipe' })
  expect(new TextDecoder().decode(check.stdout) + new TextDecoder().decode(check.stderr)).toBe('')
  expect(check.exitCode).toBe(0)
}, 30_000)

it('rejects a property-only declaration that would replace a native DOM API', async () => {
  const root = createTempDir('stx-library-native-property-conflict-')
  roots.push(root)
  const input = join(root, 'source')
  const output = join(root, 'dist')
  await Bun.write(join(input, 'Conflict.stx'), '<template><p>Conflict</p></template>')
  await buildComponentLibrary({
    inputDir: input,
    outputDir: output,
    prefix: 'native',
    bundle: false,
    components: [{ file: 'Conflict.stx', properties: { style: { type: 'string', attribute: false } } }],
  })
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
    const file = new URL(request.url).pathname
    if (file === '/') return new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })
    const asset = Bun.file(join(output, file))
    return await asset.exists() ? new Response(asset, { headers: { 'Content-Type': 'text/javascript' } }) : new Response(null, { status: 404 })
  } })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    expect(await view.evaluate(`(async () => {
      try { await import('/index.js'); return null }
      catch (error) { return { name: error.name, message: error.message, registered: !!customElements.get('native-conflict') } }
    })()`)).toEqual({
      name: 'TypeError',
      message: 'STX prop "style" overlaps the native DOM API and needs an attribute binding',
      registered: false,
    })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
