import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

/**
 * A component under an :if in a row of a loop nested in another loop is built
 * when the data arrives after mount (stacksjs/stx#2197). The branch is shared
 * as an empty data-stx-lazy element; it stayed empty for good on the Stacks
 * dashboard's edit page, so no row could be edited or deleted.
 */
it('fills a component branch in a nested loop row when the data arrives after mount', async () => {
  const dir = createTempDir('stx-row-heavy-nested-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    await Bun.write(join(dir, 'Btn.stx'), `<script client>
const pressed = state(0)
</script>
<button data-btn @click="pressed.update(v => v + 1)"><slot /> <i :text="pressed()"></i></button>`)
    const html = await processDirectives(`<html><body><script client>
const panels = state([])
function editable() { return panels().filter(p => p.rows) }
function rowsOf(panel) { return panel.rows }
function canEdit(panel, row) { return !!row }
onMount(() => { setTimeout(() => panels.set([{ id: 'p1', rows: [{ id: 1, state: 'kept' }, { id: 2, state: 'kept' }] }, { id: 'p2', rows: [{ id: 3, state: 'new' }] }]), 20) })
</script><main>
<div :if="editable().length > 0">
  <div :for="panel in editable()">
    <ul :if="rowsOf(panel).length > 0">
      <li :for="row in rowsOf(panel)" :data-draft-state="row.state">
        <span data-label :if="row.state">{{ row.state }}</span>
        <span data-edit :if="canEdit(panel, row)"><Btn>Edit</Btn></span>
        <span data-delete :if="canEdit(panel, row)"><Btn>Delete</Btn></span>
      </li>
    </ul>
  </div>
</div>
<button data-add @click="panels.set([panels()[0], { id: 'p2', rows: [...panels()[1].rows, { id: 4, state: 'staged' }] }])">add</button>
</main></body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, autoShell: false } as never, new Set())
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
      createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
      overallTimeoutMs: 25_000,
    })
    await fixture.view.navigate(fixture.url)
    await fixture.waitFor(`document.querySelectorAll('li[data-draft-state]').length === 3`, value => value === true)
    await Bun.sleep(100)
    const state = `JSON.stringify({ labels: [...document.querySelectorAll('[data-label]')].map(n => n.textContent.trim()), buttons: document.querySelectorAll('li [data-btn]').length, lazy: document.querySelectorAll('li [data-stx-lazy]').length })`
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ labels: ['kept', 'kept', 'new'], buttons: 6, lazy: 0 })

    // Each row's button is its own live component.
    await fixture.view.evaluate(`document.querySelectorAll('li [data-btn]')[2].click()`)
    await fixture.waitFor(`document.querySelectorAll('li [data-btn] i')[2].textContent`, value => value === '1')
    expect(await fixture.view.evaluate(`[...document.querySelectorAll('li [data-btn] i')].map(i => i.textContent).join('')`)).toBe('001000')

    // A row staged later gets its buttons too.
    await fixture.view.evaluate(`document.querySelector('[data-add]').click()`)
    await fixture.waitFor(`document.querySelectorAll('li[data-draft-state]').length === 4`, value => value === true)
    await Bun.sleep(50)
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ labels: ['kept', 'kept', 'new', 'staged'], buttons: 8, lazy: 0 })
  }
  finally { fixture?.close(); rmSync(dir, { recursive: true, force: true }) }
}, 30_000)
