import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('keeps variable-valued shorthands and restores overlapping inline declarations', async () => {
  const html = `<!doctype html><html><body style="--space:24px;--edge:#333338;--radius:8px">
<main data-stx="__stx_setup_variable_styles"><div id="card" style="padding-left:9px!important;width:18px" x-style="styles"></div></main>
<script>${generateSignalsRuntimeDev()}</script><script>
window.styles = stx.state('padding:var(--space,16px);border:1px solid;border-color:var(--edge,#111);border-radius:var(--radius,0px);--label:"hello;fake:value"');
window.__stx_setup_variable_styles = () => ({ styles });
document.dispatchEvent(new Event('DOMContentLoaded'));
</script></body></html>`
  const fixture = createBrowserFixture({
    createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
    overallTimeoutMs: 25_000,
  })
  try {
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`getComputedStyle(document.querySelector('#card')).paddingTop === '24px'`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate(`(() => { const s = getComputedStyle(document.querySelector('#card')); return [s.paddingLeft,s.borderTopColor,s.borderTopLeftRadius,s.width]; })()`)).toEqual(['24px', 'rgb(51, 51, 56)', '8px', '18px'])
    await fixture.view.evaluate(`styles.set('padding-left:4px;--label:"after;another:token"')`)
    expect(await fixture.waitFor(`getComputedStyle(document.querySelector('#card')).paddingLeft === '4px'`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate(`getComputedStyle(document.querySelector('#card')).paddingTop`)).toBe('0px')
    await fixture.view.evaluate(`styles.set('')`)
    expect(await fixture.waitFor(`getComputedStyle(document.querySelector('#card')).paddingLeft === '9px'`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate(`document.querySelector('#card').style.getPropertyPriority('padding-left')`)).toBe('important')
    expect(await fixture.view.evaluate(`document.querySelector('#card').style.getPropertyValue('--label')`)).toBe('')
    expect(await fixture.view.evaluate(`document.querySelector('#card').style.width`)).toBe('18px')
  }
  finally { fixture.close() }
}, 30_000)
