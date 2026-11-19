import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../stx/src/process'

it('positions only open tooltips and toggles explicit help without moving focus', async () => {
  const root = join(import.meta.dir, '..')
  const tips = Array.from({ length: 32 }, (_, index) =>
    `<Tooltip content="Hint ${index}" pressToToggle><button id="help-${index}" type="button">Help</button></Tooltip>`).join('')
  const imports = Object.entries({ Tooltip: 'tooltip', Button: 'button', Dialog: 'dialog', DialogPanel: 'dialog' })
    .map(([name, folder]) => `@import('${name}', '${join(root, 'src/ui', folder, name + '.stx')}')`).join('\n')
  const html = await processDirectives(`${imports}
<!doctype html><html><head></head><body>
<script client>const opened = state(false)</script>
<main>${tips}<button id="open-dialog" @click="opened.set(true)">Open dialog</button></main>
<Dialog :open="opened()" @close="opened.set(false)" title="Dialog">
  <DialogPanel>
    <Tooltip content="Shared help copy" pressToToggle><Button ariaLabel="Shared help" type="button">Help</Button></Tooltip>
  </DialogPanel>
</Dialog>
</body></html>`, {}, join(root, 'tooltip-fixture.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const css = await generateCss(html, root)
  const instrumentation = `<script>
    const active = { scroll: new Set(), resize: new Set() };
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = (type, handler, options) => {
      active[type]?.add(handler);
      add(type, handler, options);
    };
    window.removeEventListener = (type, handler, options) => {
      active[type]?.delete(handler);
      remove(type, handler, options);
    };
    window.listenerCount = () => [active.scroll.size, active.resize.size];
  </script>`
  const page = html.replace('<head>', '<head>' + instrumentation).replace('</head>', '<style>' + css + '</style></head>')
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(page, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true, width: 800, height: 600, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    const read = () => view.evaluate(`(() => {
      const button = document.querySelector('#help-0');
      const id = button?.getAttribute('aria-describedby');
      const panel = id && document.getElementById(id);
      return {
        count: listenerCount(),
        ready: !!panel,
        visible: !!panel && getComputedStyle(panel).display !== 'none',
        positioned: !!panel?.style.left,
        focus: document.activeElement?.id,
        text: panel?.textContent.trim()
      };
    })()`) as Promise<{ count: number[], ready: boolean, visible: boolean, positioned: boolean, focus: string, text: string }>
    const waitFor = async (predicate: (data: Awaited<ReturnType<typeof read>>) => boolean) => {
      for (let i = 0; i < 80; i++) {
        if (predicate(await read())) return
        await Bun.sleep(20)
      }
      expect(await read()).toSatisfy(predicate)
    }
    await waitFor(data => data.ready)
    expect(await read()).toMatchObject({ count: [0, 0], text: 'Hint 0', visible: false })
    await view.evaluate("document.querySelector('#help-0').focus()")
    expect(await read()).toMatchObject({ focus: 'help-0', visible: false })
    await view.click('#help-0')
    await waitFor(data => data.visible && data.positioned)
    expect(await read()).toMatchObject({ count: [1, 1], focus: 'help-0' })
    const reads = await view.evaluate(`(async () => {
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
      const trigger = document.querySelector('#help-0').parentElement;
      const bounds = trigger.getBoundingClientRect.bind(trigger);
      let reads = 0;
      trigger.getBoundingClientRect = () => { reads++; return bounds() };
      for (let i = 0; i < 20; i++) {
        document.querySelector('main').dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
      }
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
      return reads;
    })()`)
    expect(reads).toBe(1)

    await view.click('#help-0')
    await waitFor(data => !data.visible)
    expect(await read()).toMatchObject({ count: [0, 0], focus: 'help-0', text: 'Hint 0' })
    await view.click('#help-0')
    await waitFor(data => data.visible)
    await view.evaluate(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`)
    await waitFor(data => !data.visible)
    expect(await read()).toMatchObject({ count: [0, 0], focus: 'help-0' })

    await view.click('#open-dialog')
    await view.click('button[aria-label="Shared help"]')
    const modalHelp = () => view.evaluate(`(() => {
      const button = document.querySelector('button[aria-label="Shared help"]');
      const ids = button.getAttribute('aria-describedby')?.split(/\\s+/) ?? [];
      const panel = ids.map(id => document.getElementById(id)).find(el => el?.role === 'tooltip');
      return {
        visible: !!panel && getComputedStyle(panel).display !== 'none',
        inert: !!panel?.closest('[inert]'),
        inModal: !!panel?.closest('[aria-modal="true"]'),
        focused: document.activeElement === button,
      };
    })()`)
    expect(await modalHelp()).toMatchObject({ visible: true, inert: false, inModal: true, focused: true })
    await view.press('Escape')
    expect(await modalHelp()).toMatchObject({ visible: false, focused: true })
    expect(await view.evaluate("document.body.style.overflow")).toBe('hidden')
    await view.press('Enter')
    expect(await modalHelp()).toMatchObject({ visible: true, focused: true })
  }
  finally { view.close(); server.stop(true) }
}, 60_000)

it('keeps hover help open across the trigger gap and dismisses it with Escape from another control', async () => {
  const root = join(import.meta.dir, '..')
  const source = `@import('Tooltip', '${join(root, 'src/ui/tooltip/Tooltip.stx')}')
<!doctype html><html><head></head><body><main style="padding:120px 80px">
<Tooltip content="Read this explanation at your own pace"><button id="hover-help">Help</button></Tooltip>
<button id="elsewhere">Elsewhere</button>
</main></body></html>`
  const html = await processDirectives(source, {}, join(root, 'tooltip-hover-fixture.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const css = await generateCss(html, root)
  const page = html.replace('</head>', `<style>${css}</style></head>`)
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(page, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true, width: 800, height: 600, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    const status = () => view.evaluate(`(() => {
      const trigger = document.querySelector('#hover-help');
      const panel = document.getElementById(trigger.getAttribute('aria-describedby'));
      const from = trigger.getBoundingClientRect();
      const to = panel?.getBoundingClientRect();
      return {
        visible: !!panel && getComputedStyle(panel).display !== 'none',
        positioned: !!panel?.style.left,
        focus: document.activeElement?.id,
        x: from.left + from.width / 2,
        triggerY: from.top + from.height / 2,
        gapY: to && (from.top + to.bottom) / 2,
        panelY: to && to.top + to.height / 2,
      };
    })()`) as Promise<{ visible: boolean, positioned: boolean, focus: string, x: number, triggerY: number, gapY: number, panelY: number }>
    const move = (x: number, y: number) => view.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
    await view.evaluate("document.querySelector('#elsewhere').focus()")
    const trigger = await status()
    expect(trigger.visible).toBe(false)
    await move(trigger.x, trigger.triggerY)
    for (let i = 0; i < 80; i++) {
      const current = await status()
      if (current.visible && current.positioned) break
      await Bun.sleep(20)
    }
    const panel = await status()
    expect(panel).toMatchObject({ visible: true, positioned: true, focus: 'elsewhere' })
    expect(panel.panelY).toBeLessThan(panel.gapY)
    expect(panel.gapY).toBeLessThan(panel.triggerY)
    // Cross beside the arrow so the pointer really leaves both elements.
    await move(panel.x + 6, panel.gapY)
    await Bun.sleep(40)
    await move(panel.x, panel.panelY)
    await Bun.sleep(220)
    expect(await status()).toMatchObject({ visible: true, focus: 'elsewhere' })
    await view.press('Escape')
    expect(await status()).toMatchObject({ visible: false, focus: 'elsewhere' })

    await move(panel.x, panel.triggerY)
    expect(await status()).toMatchObject({ visible: true, focus: 'elsewhere' })
    await move(4, 4)
    await Bun.sleep(220)
    expect(await status()).toMatchObject({ visible: false, focus: 'elsewhere' })
  }
  finally { view.close(); server.stop(true) }
}, 60_000)
