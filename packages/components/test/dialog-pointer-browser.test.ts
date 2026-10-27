import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../stx/src/process'

it.each(['center', 'sheet'])('routes native pointer input through the %s dialog layout to its backdrop', async (variant) => {
  const root = join(import.meta.dir, '..')
  const imports = ['Dialog', 'DialogPanel', 'DialogBackdrop', 'DialogTitle']
    .map(name => `@import('${name}', '${join(root, 'src/ui/dialog', `${name}.stx`)}')`).join('\n')
  const html = await processDirectives(`${imports}
<!doctype html><html><head></head><body>
<script client>
const shown = state(false)
const locked = state(false)
</script>
<button id="open" @click="shown.set(true)">Open dialog</button>
<button id="locked" @click="locked.set(true)">Open required dialog</button>
<Dialog :open="shown()" @close="shown.set(false)">
  <DialogBackdrop />
  <DialogPanel variant="${variant}" className="w-64">
    <DialogTitle>Pointer dialog</DialogTitle>
    <button id="inside">Inside</button>
  </DialogPanel>
</Dialog>
<Dialog :open="locked()" closeOnBackdrop="false" @close="locked.set(false)">
  <DialogBackdrop />
  <DialogPanel variant="${variant}" className="w-64">
    <DialogTitle>Required dialog</DialogTitle>
    <button id="required-control">Required control</button>
  </DialogPanel>
</Dialog>
</body></html>`, {}, join(root, 'dialog-pointer.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const css = await generateCss(html, root)
  const page = html.replace('</head>', `<style>${css}</style></head>`)
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(page, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true, width: 800, height: 600, backend: { type: 'chrome', url: false } })
  const visible = () => view.evaluate(`Array.from(document.querySelectorAll('[data-stx-dialog]')).filter(node => getComputedStyle(node).display !== 'none').length`)
  const waitFor = async (read: () => Promise<unknown>, expected: unknown) => {
    for (let i = 0; i < 100; i++) {
      if (await read() === expected) return
      await Bun.sleep(20)
    }
    expect(await read()).toBe(expected)
  }
  try {
    await view.navigate(server.url.href)
    await waitFor(visible, 0)
    await view.click('#open')
    await waitFor(visible, 1)
    await view.click('#inside')
    await waitFor(() => view.evaluate(`document.activeElement.id`), 'inside')
    expect(await visible()).toBe(1)
    expect(await view.evaluate(`document.elementFromPoint(5, 5).hasAttribute('data-stx-dialog-backdrop')`)).toBe(true)
    await view.click(5, 5)
    await waitFor(visible, 0)
    await waitFor(() => view.evaluate(`document.activeElement.id`), 'open')
    expect(await view.evaluate(`document.body.style.overflow`)).not.toBe('hidden')

    await view.click('#locked')
    await waitFor(visible, 1)
    await view.click(5, 5)
    expect(await visible()).toBe(1)
    expect(await view.evaluate(`document.body.style.overflow`)).toBe('hidden')
    await view.click('#required-control')
    await waitFor(() => view.evaluate(`document.activeElement.id`), 'required-control')
    await view.press('Escape')
    await waitFor(visible, 0)
    await waitFor(() => view.evaluate(`document.activeElement.id`), 'locked')
    expect(await view.evaluate(`document.body.style.overflow`)).not.toBe('hidden')
  }
  finally {
    view.close()
    server.stop(true)
  }
}, 30_000)
