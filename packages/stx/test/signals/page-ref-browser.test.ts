import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { extractContainerContent } from '../../src/app-shell'
import { processDirectives } from '../../src/process'
import { injectRouterScript } from '../../src/runtime-injection'

for (const debug of [true, false]) {
  for (const namedSlot of [false, true]) {
    it(`resolves page dialog refs through a component shell and SPA navigation (debug=${debug}, namedSlot=${namedSlot})`, async () => {
      const dir = mkdtempSync(join(tmpdir(), 'stx-page-ref-'))
      let view: WebView | undefined
      let server: ReturnType<typeof Bun.serve> | undefined
      try {
        view = new WebView({ headless: true })
        await Bun.write(join(dir, 'NestedShell.stx'), '<script client>const ready = state(true)</script><section :data-ready="ready"><slot /></section>')
        await Bun.write(join(dir, 'NativeAppShell.stx'), '<script client>const shellReady = state(true)</script><section :data-ready="shellReady"><NestedShell><slot /><slot name="options" /></NestedShell><dialog data-internal ref="record-options"></dialog></section>')
        await Bun.write(join(dir, 'OtherDialog.stx'), `<script client>
const localDialog = useRef('record-options')
function openLocal() { localDialog.current?.showModal() }
function closeLocal() { localDialog.current?.close() }
</script><NestedShell><aside><button data-local-open @click="openLocal()">Local</button><dialog data-local ref="record-options"><button data-local-close @click="closeLocal()">Close</button></dialog></aside></NestedShell>`)
        const options = { componentsDir: dir, cache: false, debug, router: { cache: false, prefetch: false, viewTransitions: false } }
        server = Bun.serve({ port: 0, async fetch(request) {
          const url = new URL(request.url)
          if (!['/one', '/two'].includes(url.pathname)) return new Response(null, { status: 404 })
          const html = await injectRouterScript(await processDirectives(`<!doctype html><html><head><meta name="stx-layout" content="same"></head><body>
<script client>
const optionsDialog = useRef('record-options')
const signalDialog = state(null)
const sameRef = state(false)
function openOptions() {
  sameRef.set(optionsDialog.current === signalDialog())
  optionsDialog.current?.showModal()
}
function closeOptions() { optionsDialog.current?.close() }
</script>
<main><OtherDialog /><NativeAppShell>
  <span data-page="${url.pathname}"></span>
  <button data-open @click="openOptions()">Options</button>
  <span data-same x-text="sameRef"></span>
  <dialog ${namedSlot ? 'slot="options"' : ''} data-page-dialog ref="record-options" x-ref="signalDialog"><button data-done @click="closeOptions()">Done</button></dialog>
  <a data-stx-link href="${url.pathname === '/one' ? '/two' : '/one'}">Next</a>
  <other-dialog />
</NativeAppShell><OtherDialog /></main></body></html>`, {}, join(dir, 'page.stx'), options, new Set()), options)
          if (request.headers.get('X-STX-Router') === 'true') {
            return new Response(extractContainerContent(html), { headers: {
              'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Runtime': 'true',
              'X-STX-Layout': 'same', 'X-STX-Layout-Group': 'same',
            } })
          }
          return new Response(html, { headers: { 'Content-Type': 'text/html' } })
        } })
        const waitFor = async (expression: string) => {
          for (let i = 0; i < 100; i++) {
            if (await view!.evaluate(expression)) return
            await Bun.sleep(20)
          }
          throw new Error(`Browser did not reach: ${expression}`)
        }
        await view.navigate(`${server.url}one`)
        await view.evaluate('window.navigationMarker = 1')
        for (const page of ['/one', '/two', '/one']) {
          await waitFor(`document.querySelector('[data-page]')?.getAttribute('data-page') === '${page}' && !document.querySelector('[data-open]')?.hasAttribute('@click')`)
          await view.evaluate(`(() => { document.querySelector('[data-open]').focus(); document.querySelector('[data-open]').click(); })()`)
          expect(await view.evaluate(`document.querySelector('[data-page-dialog]').open`)).toBe(true)
          expect(await view.evaluate(`document.querySelector('[data-internal]').open`)).toBe(false)
          expect(await view.evaluate(`document.querySelector('[data-same]').textContent`)).toBe('true')
          await view.evaluate(`document.querySelector('[data-done]').click()`)
          expect(await view.evaluate(`document.querySelector('[data-page-dialog]').open`)).toBe(false)
          expect(await view.evaluate(`document.activeElement === document.querySelector('[data-open]')`)).toBe(true)
          expect(await view.evaluate('window.navigationMarker')).toBe(1)
          for (const index of [0, 1, 2]) {
            await view.evaluate(`document.querySelectorAll('[data-local-open]')[${index}].click()`)
            expect(await view.evaluate(`Array.from(document.querySelectorAll('[data-local]')).map(dialog => dialog.open)`)).toEqual([index === 0, index === 1, index === 2])
            expect(await view.evaluate(`document.querySelector('[data-page-dialog]').open`)).toBe(false)
            await view.evaluate(`document.querySelectorAll('[data-local-close]')[${index}].click()`)
          }
          await view.evaluate(`document.querySelector('[data-stx-link]').click()`)
        }
      }
      finally {
        view?.close()
        await server?.stop(true)
        rmSync(dir, { recursive: true, force: true })
      }
    }, 30_000)
  }
}
