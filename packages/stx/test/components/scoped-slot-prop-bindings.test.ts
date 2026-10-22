import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { rm } from 'node:fs/promises'
import { createTempDir } from '../../src/temp-dir'
import { generateSignalsRuntime } from '../../src/signals'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

const child = `<script client>
const items = useReactiveProp('items', [])
const label = state('child')
</script><ul><li :for="(item, index) in items()" :key="item.id">
<slot name="actions" :row="item" :index="index" :missing="undefined" />
</li></ul>`
const caller = `<script client>
const items = state([{ id: 1, name: 'first' }, { id: 2, name: 'second' }])
const label = state('caller')
const row = state({ name: 'wrong parent row' })
const entry = state({ name: 'wrong parent entry' })
const props = state({ row: { name: 'wrong parent props' } })
window.slotProbe = { items, label, edited: [] }
function edit(value) { window.slotProbe.edited.push(value.id) }
</script><section>
<Box :items="items()"><template #actions="{ row }">
<button class="row" :testID="'row-' + row.id" @click="edit(row)">{{ row.name }}:{{ label() }}</button>
<span class="private">{{ typeof item }}</span>
</template></Box>
<Box :items="items()"><template #actions="{ row: entry, index: position }">
<span class="alias" :title="entry.name" :data-index="position">{{ position + ':' + entry.name }}</span>
</template></Box>
<Box :items="items()"><template #actions="props"><span class="object">{{ props.row.name }}</span></template></Box>
<Box :items="items()"><template #actions="{ row: { name }, missing: fallback = 'fallback' }"><span class="pattern">{{ name }}:{{ fallback }}</span></template></Box>
<Box :items="items()" data-bare="true"><template #actions="{ row: entry }">{{ entry.name }}:{{ label() }}</template></Box>
</section>`

it.each(['default', 'compile'])('binds scoped slot props and aliases independently of child loop names (%s, #2112)', async (mode) => {
  const app = await renderApp({ 'layouts/app.stx': layout(''), 'components/Box.stx': child, 'pages/index.stx': page('app', caller) }, { '/': 'pages/index.stx' }, mode === 'compile' ? { buildMode: 'compile' } : {})
  try {
    if (mode === 'compile') {
      const tag = '<script data-stx-runtime src="/__stx/runtime.__STX_HASH__.js"></script>'
      expect(app.documents.get('/')!).toContain(tag)
      app.documents.set('/', app.documents.get('/')!.replace(tag, () => `<script data-stx-runtime>${generateSignalsRuntime()}</script>`))
    }
    const browser = await boot(app, '/')
    await settle()
    const texts = (selector: string) => [...browser.document.querySelectorAll(selector)].map(node => node.textContent)
    expect(texts('.row')).toEqual(['first:caller', 'second:caller'])
    expect(texts('.alias')).toEqual(['0:first', '1:second'])
    expect(browser.document.querySelector('.alias')!.getAttribute('data-index')).toBe('0')
    expect(texts('.object')).toEqual(['first', 'second'])
    expect(texts('.pattern')).toEqual(['first:fallback', 'second:fallback'])
    expect(texts('.private')).toEqual(['undefined', 'undefined'])
    expect(texts('[data-bare] li').map(text => text!.trim())).toEqual(['first:caller', 'second:caller'])
    const second = browser.document.querySelectorAll('.row')[1]
    const bareSecond = browser.document.querySelectorAll('[data-bare] li')[1]
    browser.window.slotProbe.items.set([{ id: 2, name: 'updated' }, { id: 1, name: 'last' }])
    browser.window.slotProbe.label.set('changed')
    await settle()
    expect(texts('.row')).toEqual(['updated:changed', 'last:changed'])
    expect(browser.document.querySelector('.row')).toBe(second)
    expect(texts('.alias')).toEqual(['0:updated', '1:last'])
    expect(texts('[data-bare] li').map(text => text!.trim())).toEqual(['updated:changed', 'last:changed'])
    expect(browser.document.querySelector('.alias')!.getAttribute('title')).toBe('updated')
    second!.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    expect(browser.window.slotProbe.edited).toEqual([2])
    browser.window.slotProbe.items.set([])
    await settle()
    expect(texts('.row')).toEqual([])
    browser.window.slotProbe.label.set('after removal')
    await settle()
    expect(bareSecond!.textContent!.trim()).toBe('updated:changed')
    expect(browser.errors).toEqual([])
  }
  finally { closeBrowser(); await app.dispose() }
}, 30_000)

it.each([false, true])('binds the same slot prop contracts on native (minify=%s)', async (minify) => {
  const root = createTempDir('stx-slot-props-')
  try {
    await Bun.write(join(root, 'components/Box.stx'), child)
    await Bun.write(join(root, 'Screen.stx'), caller)
    const result = await compileSharedScreenBundle(join(root, 'Screen.stx'), { root, minify })
    const phone = mountNativeScreen(result.code)
    try {
      await phone.settle()
      expect(phone.texts()).toContain('first:caller')
      expect(phone.texts()).toContain('0:first')
      expect(phone.texts()).toContain('first:fallback')
      expect(phone.texts().filter(text => text === 'first:caller')).toHaveLength(2)
      const second = phone.byTestID('row-2')!
      expect(second).toBeDefined()
      phone.context.slotProbe.items.set([{ id: 2, name: 'updated' }])
      await phone.settle()
      expect(phone.byTestID('row-2')!.id).toBe(second.id)
      phone.press(second)
      expect(phone.context.slotProbe.edited).toEqual([2])
      expect(phone.texts()).toContain('updated:caller')
      phone.context.slotProbe.items.set([])
      await phone.settle()
      expect(phone.byTestID('row-2')).toBeUndefined()
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)
