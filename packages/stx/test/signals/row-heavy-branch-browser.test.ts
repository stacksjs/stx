import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

/**
 * A row's heavy conditional branch (an inline editor, a component) is built when
 * it is first shown, not cloned into every row to be parked: a to-do list whose
 * every row carried its 200-line editor spent a third of its time cloning and
 * re-numbering editors nobody had opened. What a reader sees must not change:
 * the editor opens in its own row with that row's item, keeps its own state, and
 * a replaced list leaves nothing behind.
 */
it('opens a row\'s editor on demand, with its own state and its own item', async () => {
  const dir = createTempDir('stx-row-heavy-branch-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    await Bun.write(join(dir, 'Editor.stx'), `<script>
interface Props { todo?: any }
const { todo = null } = defineProps<Props>()
</script>
<script client>
const todo = useReactiveProp('todo', null)
const draft = state('')
function save() { draft.update(v => v + '!') }
</script>
<div data-editor><b data-title :text="todo() ? todo().title : ''"></b><i data-draft :text="draft()"></i><button data-save @click="save()">save</button></div>`)
    const html = await processDirectives(`<html><body><script client>
const rows = state([{ id: 1, title: 'alpha' }, { id: 2, title: 'beta' }, { id: 3, title: 'gamma' }])
const openId = state(null)
</script><main><ul>
<template :for="r in rows" :key="r.id">
  <li data-row :if="openId() !== r.id"><span data-name :text="r.title"></span><button data-open @click="openId.set(r.id)">open</button></li>
  <li data-editor-row :if="openId() === r.id"><Editor :todo="r" /></li>
</template>
</ul>
<button data-replace @click="rows.set([{ id: 7, title: 'seven' }, { id: 2, title: 'beta' }])">replace</button>
<button data-close @click="openId.set(null)">close</button></main></body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, autoShell: false } as never, new Set())
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
      createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
      overallTimeoutMs: 25_000,
    })
    await fixture.view.navigate(fixture.url)
    const state = `JSON.stringify({ rows: [...document.querySelectorAll('[data-row] [data-name]')].map(n => n.textContent), editors: [...document.querySelectorAll('[data-editor]')].map(e => [e.querySelector('[data-title]').textContent, e.querySelector('[data-draft]').textContent]) })`
    await fixture.waitFor(`document.querySelectorAll('[data-row]').length === 3`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ rows: ['alpha', 'beta', 'gamma'], editors: [] })

    await fixture.view.evaluate(`document.querySelectorAll('[data-open]')[1].click()`)
    await fixture.waitFor(`document.querySelectorAll('[data-editor]').length === 1`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ rows: ['alpha', 'gamma'], editors: [['beta', '']] })

    await fixture.view.evaluate(`document.querySelector('[data-save]').click()`)
    await fixture.view.evaluate(`document.querySelector('[data-save]').click()`)
    expect(JSON.parse(await fixture.view.evaluate(state)).editors).toEqual([['beta', '!!']])

    // Another row's editor: its own item, its own (empty) draft; the first one is closed.
    await fixture.view.evaluate(`document.querySelectorAll('[data-open]')[1].click()`)
    await fixture.waitFor(`document.querySelector('[data-editor] [data-title]')?.textContent === 'gamma'`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ rows: ['alpha', 'beta'], editors: [['gamma', '']] })

    // Back to the first: the same instance, state kept, as an :if toggle always kept it.
    await fixture.view.evaluate(`document.querySelector('[data-close]').click()`)
    await fixture.view.evaluate(`document.querySelectorAll('[data-open]')[1].click()`)
    await fixture.waitFor(`document.querySelector('[data-editor] [data-title]')?.textContent === 'beta'`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(state)).editors).toEqual([['beta', '!!']])

    // A replaced list: the open row survives under its key, the new one has no editor.
    await fixture.view.evaluate(`document.querySelector('[data-replace]').click()`)
    await fixture.waitFor(`document.querySelectorAll('[data-row]').length === 1`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(state))).toEqual({ rows: ['seven'], editors: [['beta', '!!']] })
  }
  finally { fixture?.close(); rmSync(dir, { recursive: true, force: true }) }
}, 30_000)
