import { describe, expect, it } from 'bun:test'
import { createNativeHost } from '../../src/native/runtime/native-host'
import { installJSCGlobals } from '../../src/native/runtime/jsc-globals'

describe('native component event transport', () => {
  function setup() {
    const globals: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(globals)
    const batches: any[] = []
    const host = createNativeHost({ send: batch => batches.push(...batch) })
    const root = host.adopt({ __stxId: 'root' }, 'View')
    const child = host.adopt({ __stxId: 'child' }, 'Button', root)
    const event = () => new globals.CustomEvent('saved', { detail: { id: 1 }, bubbles: true, cancelable: true })
    return { host, root, child, event, batches }
  }

  it('keeps payload identity, capture order, multiple listeners and once semantics', () => {
    const { host, root, child, event } = setup()
    const calls: string[] = []
    const emitted = event()
    host.listen(root, 'saved', () => calls.push('capture'), { capture: true })
    host.listen(child, 'saved', value => {
      const received = value as any
      expect(received.detail).toBe(emitted.detail)
      expect(received.target).toBe(child)
      expect(received.currentTarget).toBe(child)
      calls.push('once')
    }, { once: true })
    host.listen(child, 'saved', () => calls.push('child'))
    host.listen(root, 'saved', () => calls.push('bubble'))
    host.emitComponentEvent(child, emitted)
    host.emitComponentEvent(child, event())
    expect(calls).toEqual(['capture', 'once', 'child', 'bubble', 'capture', 'child', 'bubble'])
    expect(emitted.currentTarget).toBeNull()
  })

  it('respects stop and cancellation, and rejects callbacks after screen teardown', () => {
    const { host, root, child, event, batches } = setup()
    const calls: string[] = []
    host.listen(child, 'saved', value => {
      const received = value as any
      received.preventDefault()
      received.stopPropagation()
      calls.push('child')
    })
    host.listen(root, 'saved', () => calls.push('parent'))
    host.listen(child, 'click', () => calls.push('press'))
    host.flush()
    const press = batches.find(op => op.patch?.events?.onPress).patch.events.onPress
    expect(host.emitComponentEvent(child, event())).toBe(false)
    expect(calls).toEqual(['child'])
    host.dispose()
    host.emitComponentEvent(child, event())
    host.dispatch(press, {})
    expect(calls).toEqual(['child'])
    expect(host.pending()).toBe(0)
  })

  it('delivers one platform event to every listener, including aliases and once listeners', () => {
    const { host, child, batches } = setup()
    const calls: string[] = []
    host.listen(child, 'click', () => calls.push('first'))
    host.listen(child, 'press', () => calls.push('once'), { once: true })
    host.listen(child, 'click', () => calls.push('last'))
    host.flush()
    const registrations = batches.filter(op => op.patch?.events?.onPress)
    const handlerId = registrations[registrations.length - 1].patch.events.onPress
    host.dispatch(handlerId, {})
    host.dispatch(handlerId, {})
    expect(calls).toEqual(['first', 'once', 'last', 'first', 'last'])
    expect(registrations).toHaveLength(1)
  })

  it('does not treat stopPropagation on the target as stopImmediatePropagation', () => {
    const { host, root, child, event } = setup()
    const calls: string[] = []
    host.listen(child, 'saved', value => {
      (value as Event).stopPropagation()
      calls.push('target-capture')
    }, { capture: true })
    host.listen(child, 'saved', () => calls.push('target-bubble'))
    host.listen(root, 'saved', () => calls.push('parent'))
    host.emitComponentEvent(child, event())
    expect(calls).toEqual(['target-capture', 'target-bubble'])
  })
})
