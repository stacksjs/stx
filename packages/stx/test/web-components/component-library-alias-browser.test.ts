import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'

it('renders aliased public props and their defaults from emitted JavaScript modules', async () => {
  const root = createTempDir('stx-library-alias-')
  const input = join(root, 'source')
  const output = join(root, 'dist')
  await Bun.write(join(input, 'Field.stx'), `<script server>
const { class: classList, label: caption = 'Default label' } = withDefaults(
  defineProps<{ class?: string, label?: string }>(), { class: 'default-class' }
)
</script>
<template><button class="{{ classList }}">{{ caption }}</button></template>`)
  let server: ReturnType<typeof Bun.serve> | undefined
  let view: WebView | undefined
  try {
    await buildComponentLibrary({ inputDir: input, outputDir: output, prefix: 'alias', bundle: false, minify: true })
    server = Bun.serve({ port: 0, hostname: '127.0.0.1', async fetch(request) {
      const file = new URL(request.url).pathname
      if (file === '/') return new Response('<!doctype html><script type="module" src="/index.js"></script><alias-field class="custom-class" label="Custom label"></alias-field><alias-field></alias-field>', { headers: { 'Content-Type': 'text/html' } })
      const asset = Bun.file(join(output, file))
      if (!await asset.exists()) return new Response(null, { status: 404 })
      return new Response(asset, { headers: { 'Content-Type': 'text/javascript' } })
    } })
    view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
    await view.navigate(server.url.href)
    const read = () => view!.evaluate(`JSON.stringify(Array.from(document.querySelectorAll('alias-field')).map(el => { const button = el.querySelector('button'); return [button?.className, button?.textContent] }))`)
    const expected = JSON.stringify([['custom-class', 'Custom label'], ['default-class', 'Default label']])
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await read() === expected) break
      await Bun.sleep(20)
    }
    expect(await read()).toBe(expected)
    await view.evaluate(`document.querySelector('alias-field').setAttribute('label', 'Changed label')`)
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await view.evaluate(`document.querySelector('alias-field button')?.textContent`) === 'Changed label') break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`document.querySelector('alias-field button')?.textContent`)).toBe('Changed label')
  }
  finally { view?.close(); server?.stop(true); await rm(root, { recursive: true, force: true }) }
}, 30_000)
