import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

const ui = join(import.meta.dir, '../../../components/src/ui')
function source(outer: string, inner: string) {
  return `${[...new Set([outer, inner])].map(name => `@import('${name}', '${ui}/${name.toLowerCase()}/${name}.stx')`).join('\n')}
<script client>
const outer = state(false)
const inner = state(false)
const outerCloses = state(0)
const innerCloses = state(0)
function closeOuter() { outerCloses.set(outerCloses() + 1); outer.set(false) }
function closeInner() { innerCloses.set(innerCloses() + 1); inner.set(false) }
window.probe = { outer, inner, outerCloses, innerCloses }
</script><section>
<${outer} :open="outer" @close="closeOuter"><div>Outer content
  <${inner} :open="inner" @close="closeInner"><div>Inner content</div></${inner}>
</div></${outer}></section>`
}

for (const outer of ['Dialog', 'Drawer']) {
  for (const inner of ['Dialog', 'Drawer']) {
    it.each([false, true])(`${outer} preserves its own close handler when nested ${inner} closes (native minify=%s)`, async (minify) => {
      const { code } = await compileNativeScreen(source(outer, inner), { minify })
      const phone = mountNativeScreen(code)
      try {
        await phone.settle()
        const probe = phone.context.probe
        probe.outer.set(true)
        await phone.settle()
        const parent = phone.ofType('Modal').find(node => node.props.visible)!
        probe.inner.set(true)
        await phone.settle()
        const child = phone.ofType('Modal').find(node => node.id !== parent.id)!
        expect(phone.context.stx.overlays.list()).toHaveLength(2)
        for (let i = 1; i <= 2; i++) {
          phone.press(child, 'onRequestClose', { reason: 'backdrop' })
          await phone.settle()
          expect([probe.outer(), probe.inner(), probe.outerCloses(), probe.innerCloses()]).toEqual([true, false, 0, i])
          expect(phone.context.stx.overlays.list()).toHaveLength(1)
          if (i === 1) { probe.inner.set(true); await phone.settle() }
        }
        phone.press(parent, 'onRequestClose', { reason: 'backdrop' })
        await phone.settle()
        expect([probe.outer(), probe.outerCloses()]).toEqual([false, 1])
        expect(phone.context.stx.overlays.list()).toEqual([])
        expect(phone.mutationErrors).toEqual([])
      }
      finally { phone.unmount() }
    }, 30_000)

    it(`${outer} ignores nested ${inner} close events in the browser`, async () => {
      const app = await renderApp({ 'layouts/app.stx': layout(''), 'pages/index.stx': page('app', source(outer, inner)) }, { '/': 'pages/index.stx' })
      try {
        const browser = await boot(app, '/')
        await settle()
        const probe = browser.window.probe
        probe.outer.set(true)
        await settle()
        probe.inner.set(true)
        await settle()
        expect(browser.window.stx.overlays.list()).toHaveLength(2)
        for (let i = 1; i <= 2; i++) {
          browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
          await settle()
          expect([probe.outer(), probe.inner(), probe.outerCloses(), probe.innerCloses()]).toEqual([true, false, 0, i])
          expect(browser.window.stx.overlays.list()).toHaveLength(1)
          if (i === 1) { probe.inner.set(true); await settle() }
        }
        browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await settle()
        expect([probe.outer(), probe.outerCloses()]).toEqual([false, 1])
        expect(browser.window.stx.overlays.list()).toEqual([])
      }
      finally { closeBrowser(); await app.dispose() }
    }, 30_000)
  }
}
