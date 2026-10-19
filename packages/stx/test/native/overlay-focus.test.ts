import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const dialog = join(import.meta.dir, '../../../components/src/ui/dialog/Dialog.stx')
const drawer = join(import.meta.dir, '../../../components/src/ui/drawer/Drawer.stx')
const source = `@import('Dialog', '${dialog}')
@import('Drawer', '${drawer}')
<script client>
const outer = state(false)
const inner = state(false)
const tick = state(0)
window.probe = { outer, inner, tick }
</script><div>
<Dialog :open="outer" title="Outer"><span :text="tick"></span><input testID="outer" autofocus /></Dialog>
<Drawer :open="inner" title="Inner"><input testID="disabled" disabled autofocus /><input testID="inner" autofocus /></Drawer>
</div>`

describe.each([false, true])('native shared overlay focus (minify=%s)', (minify) => {
  it('focuses only newly opened top layers and leaves restoration to the host', async () => {
    const { code } = await compileNativeScreen(source, { minify })
    const focused: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { capabilities: ['viewFocus'], native(module, method, args) {
      expect([module, method]).toEqual(['View', 'focus'])
      const target = args[0] as { nodeId: string, mode: string }
      expect(target.mode).toBe('keyboard')
      focused.push(target.nodeId)
      return true
    } })
    try {
      await phone.settle()
      expect(focused).toEqual([])
      const { outer, inner, tick } = phone.context.probe
      const outerId = phone.byTestID('outer')!.id
      const innerId = phone.byTestID('inner')!.id
      outer.set(true)
      await phone.settle()
      expect(focused).toEqual([outerId])
      tick.set(1)
      await phone.settle()
      expect(focused).toEqual([outerId])
      inner.set(true)
      await phone.settle()
      expect(focused).toEqual([outerId, innerId])
      inner.set(false)
      await phone.settle()
      expect(focused).toEqual([outerId, innerId])
      outer.set(false)
      await phone.settle()
      outer.set(true)
      inner.set(true)
      await phone.settle()
      expect(focused).toEqual([outerId, innerId, innerId])
      phone.unmount()
    }
    finally { phone.unmount() }
  }, 30_000)
})

it('does not send a focus request when an overlay closes before its queued focus runs', async () => {
  const { code } = await compileNativeScreen(`<script client>
const modal = useRef('modal')
window.openThenClose = (defer) => {
  stx.overlays.open('brief', { root: modal() })
  if (defer) queueMicrotask(() => stx.overlays.close('brief'))
  else stx.overlays.close('brief')
}
</script><div data-native="Modal" visible="false" x-ref="modal"><input autofocus /></div>`)
  const calls: unknown[] = []
  const phone = mountNativeScreen(code, 'Screen', { capabilities: ['viewFocus'], native(...args) { calls.push(args); return true } })
  try {
    await phone.settle()
    phone.context.openThenClose()
    await phone.settle()
    phone.context.openThenClose(true)
    await phone.settle()
    expect(calls).toEqual([])
  }
  finally { phone.unmount() }
})

it('honors explicit targets, reports missing capabilities and catches native focus failures', async () => {
  const { code } = await compileNativeScreen(`<script client>
const modal = useRef('modal')
const action = useRef('action')
const disabled = state(false)
window.disableTarget = () => disabled.set(true)
window.enableTarget = () => disabled.set(false)
window.openOverlay = () => stx.overlays.open('explicit', { root: modal(), initialFocus: () => action() })
</script><div data-native="Modal" visible="false" x-ref="modal"><input autofocus /><button x-ref="action" testID="action" type="button" :disabled="disabled">Continue</button></div>`)
  for (const supported of [false, true]) {
    const warnings: string[] = []
    const calls: unknown[][] = []
    let fail = false
    const phone = mountNativeScreen(code, 'Screen', {
      capabilities: supported ? ['viewFocus'] : [],
      globals: { console: { ...console, warn: (message: string) => warnings.push(message) } },
      native(module, method, args) {
        calls.push([module, method, args])
        if (fail) throw { code: 'UNSUPPORTED_TARGET', message: 'Unsupported focus target' }
        return true
      },
    })
    try {
      await phone.settle()
      phone.context.openOverlay()
      await phone.settle()
      if (!supported) {
        expect(calls).toEqual([])
        expect(warnings.some(message => message.includes('requires viewFocus'))).toBe(true)
        continue
      }
      expect(calls).toEqual([['View', 'focus', [{ nodeId: phone.byTestID('action')!.id, mode: 'accessibility' }]]])
      expect(warnings.filter(message => message.includes('focus'))).toEqual([])
      phone.context.openOverlay()
      await phone.settle()
      expect(calls).toHaveLength(1)
      phone.context.stx.overlays.close('explicit')
      phone.context.disableTarget()
      phone.context.openOverlay()
      await phone.settle()
      expect(calls).toHaveLength(1)
      expect(warnings.some(message => message.includes('mounted, visible, enabled view'))).toBe(true)
      phone.context.stx.overlays.close('explicit')
      phone.context.enableTarget()
      fail = true
      phone.context.openOverlay()
      await phone.settle()
      expect(warnings.some(message => message.includes('Native focus failed for "explicit"') && message.includes('Unsupported focus target'))).toBe(true)
      expect(phone.context.stx.overlays.list()).toEqual(['explicit'])
    }
    finally { phone.unmount() }
  }
})
