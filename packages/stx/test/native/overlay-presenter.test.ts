import { expect, it } from 'bun:test'
import type { NativeOverlayEntry } from '../../src/native/runtime/overlay-presenter'
import { createNativeHost } from '../../src/native/runtime/native-host'

it('presents only native Modal roots and routes dismissal to the top layer', () => {
  const host = createNativeHost({ send() {} })
  const first = host.adopt({ __stxId: 'first' }, 'Modal')
  const second = host.adopt({ __stxId: 'second' }, 'Modal')
  const calls: unknown[] = []
  const outer: NativeOverlayEntry = { id: 'outer', root: first, modal: true, onRequestClose: () => calls.push('outer') }
  const inner: NativeOverlayEntry = { id: 'inner', root: second, modal: true, onRequestClose: (event) => { calls.push(event); host.syncOverlays([outer]) } }
  host.syncOverlays([outer, inner])
  const outerHandler = host.snapshot(first).events.onRequestClose
  const innerHandler = host.snapshot(second).events.onRequestClose
  expect(outerHandler).toBeTruthy()
  expect(innerHandler).toBeTruthy()
  expect(host.snapshot(second).style.zIndex).toBeGreaterThan(host.snapshot(first).style.zIndex!)
  host.dispatch(outerHandler, {})
  expect(calls).toEqual([])
  host.dispatch(innerHandler, { reason: 'back' })
  expect(calls).toHaveLength(1)
  expect(calls[0]).toMatchObject({ reason: 'back' })
  expect(host.snapshot(second).props.visible).toBe(false)
  expect(host.snapshot(first).props.visible).toBe(true)
  const unsupported = host.adopt({ __stxId: 'plain' }, 'View')
  expect(() => host.syncOverlays([outer, { id: 'bad', root: unsupported, modal: true }])).toThrow('requires a Modal root')
  host.dispatch(outerHandler, {})
  expect(calls[1]).toBe('outer')
  host.syncOverlays([])
  expect(host.snapshot(first).props.visible).toBe(false)
  host.dispatch(innerHandler, {})
  expect(calls).toHaveLength(2)
  host.dispose()
  host.dispatch(outerHandler, {})
  expect(calls).toHaveLength(2)
})

it('keeps a nondismissable native modal visible and reports unsupported popup presentation', () => {
  const host = createNativeHost({ send() {} })
  const root = host.adopt({ __stxId: 'root' }, 'Modal')
  host.syncOverlays([{ id: 'locked', root, modal: true }])
  host.dispatch(host.snapshot(root).events.onRequestClose, {})
  expect(host.snapshot(root).props.visible).toBe(true)
  expect(() => host.syncOverlays([{ id: 'popup', root, modal: false }])).toThrow('host positioning capability')
  host.dispose()
})
