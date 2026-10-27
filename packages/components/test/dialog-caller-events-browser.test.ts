import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../stx/src/process'

it('keeps caller confirmation handlers in a plain-script dialog panel reactive', async () => {
  const root = join(import.meta.dir, '..')
  const imports = ['Dialog', 'DialogPanel', 'DialogBackdrop', 'DialogTitle']
    .map(name => `@import('${name}', '${join(root, 'src/ui/dialog', `${name}.stx`)}')`).join('\n')
  const html = await processDirectives(`${imports}
<!doctype html><html><head></head><body>
<script client>
const shown = state(false)
const answer = state('unanswered')
function cancel() { answer.set('kept'); shown.set(false) }
function confirm() { answer.set('removed'); shown.set(false) }
</script>
<button id="open" @click="shown.set(true)">Tear down</button>
<output id="answer">{{ answer() }}</output>
<Dialog :open="shown()" @close="cancel()">
  <DialogBackdrop />
  <DialogPanel variant="center">
    <DialogTitle>Tear down the building?</DialogTitle>
    <button id="keep" autofocus @click="cancel()">Keep building</button>
    <button id="confirm" @click="confirm()">Tear down</button>
  </DialogPanel>
</Dialog>
</body></html>`, {}, join(root, 'dialog-caller-events.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
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
    await waitFor(() => view.evaluate('document.activeElement.id'), 'keep')
    await view.click('#keep')
    await waitFor(visible, 0)
    await waitFor(() => view.evaluate("document.querySelector('#answer').textContent"), 'kept')
    await waitFor(() => view.evaluate('document.activeElement.id'), 'open')
    await view.click('#open')
    await waitFor(visible, 1)
    await view.click('#confirm')
    await waitFor(visible, 0)
    await waitFor(() => view.evaluate("document.querySelector('#answer').textContent"), 'removed')
    await waitFor(() => view.evaluate('document.activeElement.id'), 'open')
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
