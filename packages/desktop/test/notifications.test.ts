import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { notifications } from '../src/notifications'
import { findCall, installMockBridge } from './_mock-bridge'

describe('notifications', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['notifications'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('show forwards options to bridge', async () => {
    await notifications.show({ title: 'Hello', body: 'World' })
    const c = findCall(bridge.calls, 'notifications', 'show')
    expect(c).toBeDefined()
    expect((c!.args[0] as any).title).toBe('Hello')
    expect((c!.args[0] as any).body).toBe('World')
  })

  it('show requires a title', async () => {
    await expect(notifications.show({ title: '' })).rejects.toThrow(/title/)
  })

  it('schedule normalizes Date triggerAt to ISO string', async () => {
    const date = new Date('2024-01-01T00:00:00Z')
    await notifications.schedule({ title: 't', triggerAt: date })
    const c = findCall(bridge.calls, 'notifications', 'schedule')!
    expect((c.args[0] as any).triggerAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('cancel passes id', async () => {
    await notifications.cancel('abc')
    expect(findCall(bridge.calls, 'notifications', 'cancel')!.args).toEqual(['abc'])
  })

  it('cancelAll forwards', async () => {
    await notifications.cancelAll()
    expect(findCall(bridge.calls, 'notifications', 'cancelAll')).toBeDefined()
  })

  it('setBadge / clearBadge forward count', async () => {
    await notifications.setBadge(5)
    await notifications.clearBadge()
    expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([5])
    expect(findCall(bridge.calls, 'notifications', 'clearBadge')).toBeDefined()
  })

  it('requestPermission returns boolean from bridge', async () => {
    bridge.whenCalled('notifications', 'requestPermission', true)
    expect(await notifications.requestPermission()).toBe(true)

    bridge.whenCalled('notifications', 'requestPermission', false)
    expect(await notifications.requestPermission()).toBe(false)
  })
})

describe('notifications (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('cancel/cancelAll do not throw without a bridge', async () => {
    await expect(notifications.cancel('x')).resolves.toBeUndefined()
    await expect(notifications.cancelAll()).resolves.toBeUndefined()
  })

  it('registerCategories no-ops without a bridge', async () => {
    await expect(notifications.registerCategories([{ id: 'mail', actions: [] }])).resolves.toBeUndefined()
  })
})

describe('notifications — rich attachments and actions', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => { bridge = installMockBridge(['notifications']) })
  afterEach(() => { bridge.uninstall() })

  it('forwards attachments to the bridge', async () => {
    await notifications.show({
      title: 'New photo',
      body: 'tap to view',
      attachments: [{ id: 'thumb', url: 'file:///tmp/thumb.png', type: 'image' }],
    })
    const c = findCall(bridge.calls, 'notifications', 'show')!
    const opt = c.args[0] as any
    expect(opt.attachments).toHaveLength(1)
    expect(opt.attachments[0].url).toBe('file:///tmp/thumb.png')
  })

  it('forwards actions and a category id', async () => {
    await notifications.show({
      title: 'Friend request',
      categoryId: 'social.friend_request',
      actions: [
        { id: 'accept', title: 'Accept', style: 'foreground' },
        { id: 'block', title: 'Block', style: 'destructive' },
      ],
    })
    const c = findCall(bridge.calls, 'notifications', 'show')!
    const opt = c.args[0] as any
    expect(opt.categoryId).toBe('social.friend_request')
    expect(opt.actions).toHaveLength(2)
    expect(opt.actions[0].style).toBe('foreground')
    expect(opt.actions[1].style).toBe('destructive')
  })

  it('forwards inline reply config', async () => {
    await notifications.show({
      title: 'New message',
      reply: { placeholder: 'Reply…', sendButtonTitle: 'Send' },
    })
    const c = findCall(bridge.calls, 'notifications', 'show')!
    const opt = c.args[0] as any
    expect(opt.reply.placeholder).toBe('Reply…')
  })

  it('registerCategories forwards the array to native', async () => {
    await notifications.registerCategories([
      { id: 'mail', actions: [{ id: 'archive', title: 'Archive' }] },
    ])
    const c = findCall(bridge.calls, 'notifications', 'registerCategories')!
    const arr = c.args[0] as any[]
    expect(arr).toHaveLength(1)
    expect(arr[0].id).toBe('mail')
  })

  it('registerCategories ignores empty arrays without calling the bridge', async () => {
    await notifications.registerCategories([])
    expect(findCall(bridge.calls, 'notifications', 'registerCategories')).toBeUndefined()
  })

  it('onActionClicked surfaces taps with action id', () => {
    const events: any[] = []
    const off = notifications.onActionClicked(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:notification:actionClicked', {
      detail: { notificationId: 'n-1', actionId: 'accept' },
    }))
    expect(events[0].actionId).toBe('accept')
    off()
  })

  it('onReply surfaces inline reply text', () => {
    const events: any[] = []
    const off = notifications.onReply(e => events.push(e))
    window.dispatchEvent(new CustomEvent('craft:notification:reply', {
      detail: { notificationId: 'n-1', text: 'On my way!' },
    }))
    expect(events[0].text).toBe('On my way!')
    off()
  })

  it('threadId is forwarded for grouping', async () => {
    await notifications.show({ title: 'Msg 1', threadId: 'chat-42' })
    const opt = (findCall(bridge.calls, 'notifications', 'show')!.args[0] as any)
    expect(opt.threadId).toBe('chat-42')
  })
})
