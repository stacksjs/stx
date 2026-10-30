import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

it('retains the selected shared browser Image through geometry, source, clear and remount changes', async () => {
  const root = createTempDir('stx-shared-image-browser-')
  const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(plugin)}] }`)
  const file = join(root, 'index.stx')
  const source = `<!doctype html><html><head></head><body><script client>
const src=state('/first.svg'); const fit=state('scale-down'); const position=state('right bottom'); const shown=state(true)
window.probe={src,fit,position,shown,loads:0}
</script><section><div :if="shown"><Image className="photo" :src="src" alt="Photo" :fit="fit" :position="position" @load="window.probe.loads++" /></div></section></body></html>`
  const config = await loadStxConfig(root)
  const dependencies = new Set<string>()
  const html = await processDirectives(source, {}, file, { ...defaultConfig, ...config, root, cache: false }, dependencies)
  expect(dependencies.has(join(import.meta.dir, '../../../components/src/ui/image/Image.stx'))).toBe(true)
  let requests = 0
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => {
    if (new URL(request.url).pathname.endsWith('.svg')) {
      requests++
      return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="red"/></svg>', { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' } })
    }
    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  } })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  const waitFor = async (expression: string, expected: unknown) => {
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(expression) === expected) return
      await Bun.sleep(20)
    }
    expect(await view.evaluate(expression)).toBe(expected)
  }
  const geometry = (property: string) => `getComputedStyle(document.querySelector('.photo img')).${property}`
  try {
    await view.navigate(server.url.href)
    await waitFor('window.probe?.loads', 1)
    await waitFor(geometry('objectFit'), 'scale-down')
    await waitFor(geometry('objectPosition'), '100% 100%')
    await view.evaluate('window.originalImage=document.querySelector(".photo img")')
    const initialRequests = requests
    for (const fit of ['contain', 'fill', 'none', 'cover', 'scale-down']) {
      await view.evaluate(`window.probe.fit.set(${JSON.stringify(fit)})`)
      await waitFor(geometry('objectFit'), fit)
    }
    await view.evaluate('window.probe.position.set("25% 75%")')
    await waitFor(geometry('objectPosition'), '25% 75%')
    await view.evaluate('(() => { window.probe.fit.set(null); window.probe.position.set(null) })()')
    await waitFor(geometry('objectFit'), 'cover')
    await waitFor(geometry('objectPosition'), '50% 50%')
    expect(await view.evaluate('document.querySelector(".photo img") === window.originalImage')).toBe(true)
    expect(await view.evaluate('window.probe.loads')).toBe(1)
    expect(requests).toBe(initialRequests)
    await view.evaluate('window.probe.src.set("/second.svg")')
    await waitFor('window.probe.loads', 2)
    expect(await view.evaluate('document.querySelector(".photo img") === window.originalImage')).toBe(true)
    await view.evaluate('window.probe.shown.set(false)')
    await waitFor('!!document.querySelector(".photo img")', false)
    await view.evaluate('window.originalImage.dispatchEvent(new Event("load"))')
    expect(await view.evaluate('window.probe.loads')).toBe(2)
    await view.evaluate('(() => { window.probe.src.set("/third.svg"); window.probe.fit.set("scale-down"); window.probe.position.set("top left"); window.probe.shown.set(true) })()')
    await waitFor('window.probe.loads', 3)
    await waitFor(geometry('objectFit'), 'scale-down')
    await waitFor(geometry('objectPosition'), '0% 0%')
    expect(await view.evaluate('document.querySelector(".photo img").getAttribute("src")')).toBe('/third.svg')
  }
  finally { view.close(); server.stop(true); await rm(root, { recursive: true, force: true }) }
}, 30_000)
