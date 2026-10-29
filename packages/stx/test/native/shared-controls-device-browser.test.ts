import { WebView } from 'bun'
import { expect, test } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

test('the maintained controls fixture keeps web field identity and applies live density tokens', async () => {
  const file = join(import.meta.dir, 'fixtures/shared-controls-device.stx')
  const html = await processDirectives(`<!doctype html><html><head></head><body>${await Bun.file(file).text()}</body></html>`, {}, file, { ...defaultConfig, root: join(import.meta.dir, '../../../components'), cache: false, debug: false }, new Set())
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const browser = new WebView({ headless: true })
  const waitFor = async (expression: string) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await browser.evaluate(expression)) return
      await Bun.sleep(20)
    }
    const state = await browser.evaluate(`JSON.stringify(Array.from(document.querySelectorAll('[testid]')).map(node => ({ id: node.getAttribute('testid'), tag: node.tagName, padding: getComputedStyle(node).paddingLeft, radius: getComputedStyle(node).borderRadius })))`)
    throw new Error(`Shared controls did not reach: ${expression}; elements: ${state}`)
  }
  try {
    await browser.navigate(server.url.href)
    await waitFor(`document.querySelector('[data-testid="token-card"]') && getComputedStyle(document.querySelector('[data-testid="token-card"]')).paddingLeft === '24px'`)
    await browser.evaluate(`(() => { window.originalField = document.querySelector('[data-testid="name-input"] input'); window.originalCard = document.querySelector('[data-testid="token-card"]'); window.originalField.value = 'Ada'; window.originalField.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    await waitFor(`document.querySelector('[testid="name"]').textContent === 'Hello Ada'`)
    await browser.evaluate(`document.querySelector('[data-testid="increment"]').click()`)
    await waitFor(`document.querySelector('[testid="count"]').textContent === 'Count: 1'`)
    for (const [padding, radius] of [['8px', '4px'], ['24px', '16px']]) {
      await browser.evaluate(`document.querySelector('[data-testid="density-toggle"]').click()`)
      await waitFor(`getComputedStyle(window.originalCard).paddingLeft === ${JSON.stringify(padding)}`)
      expect(await browser.evaluate(`getComputedStyle(window.originalCard).borderRadius`)).toBe(radius)
      expect(await browser.evaluate(`document.querySelector('[data-testid="name-input"] input') === window.originalField && document.querySelector('[data-testid="token-card"]') === window.originalCard`)).toBe(true)
      expect(await browser.evaluate(`window.originalField.value`)).toBe('Ada')
    }
  }
  finally { browser.close(); server.stop(true) }
}, 30_000)
