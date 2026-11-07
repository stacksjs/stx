import { afterEach, expect, test } from 'bun:test'
import path from 'node:path'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'
afterEach(closeBrowser)
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

test('a reactive list preserves caller rows, conditions and handlers through a nested component', async () => {
  const root = createTempDir('stx-projected-list-owner-')
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  await Bun.write(path.join(root, 'components', 'Collection.stx'), `<script client>const rows = state(['wrong']); const label = state('receiver')</script><div data-native="FlatList"><slot /></div>`)
  await Bun.write(path.join(root, 'components', 'Results.stx'), `<script client>const rows = state(['first']); const label = state('caller'); const open = state(false); function more() { rows.set([...rows(), 'second']) }</script><section><button testID="open" @click="open.set(!open())">Open</button><Collection :if="open"><span listRole="header" key="title">{{ label }}</span><button :for="item in rows" :key="item" :testID="'row-' + item" @click="label.set('picked ' + item)">{{ item }}</button><button listRole="footer" key="more" testID="more" @click="more()">More</button></Collection></section>`)
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, '<div><Results /></div>')
  const { code } = await compileSharedScreenBundle(file, { root })
  const screen = mountNativeScreen(code, 'Screen')
  try {
    await screen.settle()
    expect(screen.texts()).not.toContain('first')
    screen.press(screen.byTestID('open')!)
    await screen.settle()
    expect(screen.texts()).toContain('caller')
    expect(screen.texts()).toContain('first')
    expect(screen.texts()).not.toContain('receiver')
    screen.press(screen.byTestID('row-first')!)
    await screen.settle()
    expect(screen.texts()).toContain('picked first')
    screen.press(screen.byTestID('more')!)
    await screen.settle()
    expect(screen.texts()).toContain('second')
  }
  finally { screen.unmount() }
}, 30000)


test('browser default slots retain caller values when the receiver shadows their names', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Collection.stx': `<script client>const label = state('wrong'); const rows = state(['wrong'])</script><section><slot /></section>`,
    'components/Results.stx': `<script client>const label = state('caller'); const rows = state(['first']); function more() { rows.set([...rows(), 'second']) }</script><div><Collection><h2>{{ label }}</h2><p :for="item in rows" :key="item">{{ item }}</p><button @click="more()">More</button></Collection></div>`,
    'pages/probe.stx': page('app', '<Results />'),
  }, { '/probe': 'pages/probe.stx' })
  try {
    const browser = await boot(app, '/probe')
    await settle()
    expect(browser.document.querySelector('h2')?.textContent).toBe('caller')
    expect(browser.document.querySelector('p')?.textContent).toBe('first')
    browser.document.querySelector('button')!.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    await settle()
    expect([...browser.document.querySelectorAll('p')].map(p => p.textContent)).toEqual(['first', 'second'])
    expect(browser.errors).toEqual([])
  }
  finally { await closeBrowser() }
})
