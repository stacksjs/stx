/**
 * One round action beside the tab bar (`layout: 'beside'`), the new fields on a
 * floating action's menu items, `topEdge`, and the test kit's way to tap them.
 */
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { floatingActions } from '../../src/native/floating-actions'
import { mountFloatingActionsWeb } from '../../src/native/floating-actions-web'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const menu = [
  { path: '/workouts/new', title: 'Workout', symbol: 'dumbbell', icon: 'i-lucide-dumbbell', href: '/web/workouts/new' },
  { path: '/chat', title: 'Chat', symbol: 'message', accessibilityLabel: 'Chat with your coach', badge: 120, presentation: 'cover' as const },
]
const add = { path: '/add', label: 'Add', symbol: 'plus', badge: 2, menu }

describe('floatingActions(…, \'beside\')', () => {
  it('sends the one action with its badge and menu, and no companions', () => {
    expect(floatingActions([add], 'beside')).toEqual({
      layout: 'beside', path: '/add', title: 'Add', symbol: 'plus', badge: '2',
      menu: [
        { path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' },
        { path: '/chat', title: 'Chat', symbol: 'message', accessibilityLabel: 'Chat with your coach', badge: '99+', presentation: 'cover' },
      ],
    })
  })

  it('carries an accessible name and the on state like the other layouts', () => {
    expect(floatingActions([{ path: '/add', label: 'Add', symbol: 'plus', accessibilityLabel: 'Add something', active: true }], 'beside'))
      .toEqual({ layout: 'beside', path: '/add', title: 'Add', symbol: 'plus', accessibilityLabel: 'Add something', selected: true, badge: null })
  })

  it('holds exactly one action', () => {
    expect(() => floatingActions([{ path: '/a', label: 'A', symbol: 'a' }, add], 'beside')).toThrow('\'beside\' holds one action, got 2')
    expect(floatingActions([null, false], 'beside')).toBeNull()
  })

  it('still keeps a menu off the primary action of a group', () => {
    expect(() => floatingActions([add])).toThrow('put the menu on an earlier one')
  })

  it('gives a companion\'s menu items the same fields', () => {
    const accessory = floatingActions([{ path: '/more', label: 'More', symbol: 'ellipsis', menu }, { path: '/inbox', label: 'Inbox', symbol: 'tray' }])!
    expect(accessory.companions?.[0]?.menu?.[1]).toEqual({ path: '/chat', title: 'Chat', symbol: 'message', accessibilityLabel: 'Chat with your coach', badge: '99+', presentation: 'cover' })
  })

  it('leaves out an empty badge and refuses an unknown presentation', () => {
    expect(floatingActions([{ ...add, menu: [{ path: '/x', title: 'X', badge: 0 }] }], 'beside')!.menu).toEqual([{ path: '/x', title: 'X' }])
    expect(() => floatingActions([{ ...add, menu: [{ path: '/x', title: 'X', presentation: 'sheet' as any }] }], 'beside')).toThrow('unknown presentation "sheet"')
  })
})

describe.each([false, true])('a screen with a floating action (minify=%s)', (minify) => {
  async function mount(markup: string) {
    const root = createTempDir('stx-native-floating-beside-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    const file = join(root, 'Screen.stx')
    await Bun.write(file, markup)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    return phone
  }

  it('lets a test read the action and choose from its menu as the host does', async () => {
    const phone = await mount(`<script client>
const choices = [
  { path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' },
  { path: '/chat', title: 'Chat', symbol: 'message', badge: 3, presentation: 'cover' },
]
</script><div><FloatingActions :actions="[{ path: '/add', label: 'Add', symbol: 'plus', badge: 3, menu: choices }]" layout="beside" /><span>Today</span></div>`)
    expect(phone.floatingAction()).toMatchObject({ layout: 'beside', path: '/add', badge: '3', menu: [{ path: '/workouts/new' }, { path: '/chat', badge: '3', presentation: 'cover' }] })
    expect(() => phone.chooseFloating('/add')).toThrow('floating action /add opens a menu: choose one of /workouts/new, /chat')
    expect(() => phone.chooseFloating('/nowhere')).toThrow('no floating action or menu item opens /nowhere')
    phone.chooseFloating('/chat')
    expect(phone.opened).toEqual(['/chat'])
    phone.unmount()
    expect(phone.floatingAction()).toBeNull()
  }, 30_000)

  it('taps an action without a menu, in a group too', async () => {
    const phone = await mount(`<div><FloatingActions :actions="[{ path: '/map', label: 'Map', symbol: 'map.fill' }, { path: '/inbox', label: 'Inbox', symbol: 'tray' }]" /><span>Map</span></div>`)
    phone.chooseFloating('/map')
    phone.chooseFloating('/inbox')
    expect(phone.opened).toEqual(['/map', '/inbox'])
    phone.unmount()
  }, 30_000)

  it('says when nothing is showing', async () => {
    const phone = await mount('<div><span>Bare</span></div>')
    expect(phone.floatingAction()).toBeNull()
    expect(() => phone.chooseFloating('/add')).toThrow('no floating actions are showing')
    phone.unmount()
  }, 30_000)

  it('passes topEdge through to the host', async () => {
    const phone = await mount(`<script client>
craft.navigation.setOptions({ topEdge: 'fade' })
</script><div><span>Feed</span></div>`)
    expect(phone.bars).toContainEqual({ topEdge: 'fade' })
    phone.unmount()
  }, 30_000)
})

describe('<FloatingActions layout="beside"> on a web page', () => {
  it('draws one round button with its badge, and a menu with its items\' badges', () => {
    const browser = new Window({ url: 'https://fixture.invalid/home' })
    const document = browser.document as unknown as Document
    try {
      const web = mountFloatingActionsWeb(document)
      web.update([{ ...add, icon: 'i-lucide-plus' }], 'beside', { group: 'fixed right-4 bottom-6' })
      const group = document.querySelector<HTMLElement>('[data-floating-actions-web]')!
      expect(group.getAttribute('data-floating-actions-web')).toBe('beside')
      expect(group.className).toBe('fixed right-4 bottom-6')
      const buttons = group.querySelectorAll<HTMLButtonElement>('[data-floating-action]')
      expect(buttons.length).toBe(1)
      const button = buttons[0]!
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
      expect(button.getAttribute('aria-label')).toBe('Add, 2')
      expect(button.querySelector('[data-floating-action-badge]')?.textContent).toBe('2')

      button.click()
      const items = [...group.querySelectorAll<HTMLAnchorElement>('[data-floating-actions-choice]')]
      expect(items.map(item => item.getAttribute('href'))).toEqual(['/web/workouts/new', '/chat'])
      expect(items[0]!.hasAttribute('aria-label')).toBe(false)
      expect(items[1]!.getAttribute('aria-label')).toBe('Chat with your coach, 99+')
      expect(items[1]!.querySelector('[data-floating-actions-choice-badge]')?.textContent).toBe('99+')
      expect(items[0]!.querySelector('[data-floating-actions-choice-badge]')).toBeNull()
      web.dispose()
    }
    finally {
      browser.close()
    }
  })

  it('refuses more than one action, as the host does', () => {
    const browser = new Window({ url: 'https://fixture.invalid/home' })
    try {
      const web = mountFloatingActionsWeb(browser.document as unknown as Document)
      expect(() => web.update([{ path: '/a', label: 'A', symbol: 'a' }, add], 'beside')).toThrow('holds one action')
    }
    finally {
      browser.close()
    }
  })
})

describe('accessibilityValue', () => {
  const action = { path: '/add', label: 'Add', accessibilityLabel: 'Add, 3 unread messages', symbol: 'plus', badge: 3 }

  it.each(['beside', 'vertical', 'horizontal', 'separate'] as const)('reaches the host in %s, an empty one included', (layout) => {
    expect(floatingActions([{ ...action, accessibilityValue: '' }], layout)).toMatchObject({ accessibilityLabel: 'Add, 3 unread messages', accessibilityValue: '', badge: '3' })
    expect(floatingActions([{ ...action, accessibilityValue: 'three new' }], layout)).toMatchObject({ accessibilityValue: 'three new' })
    expect(floatingActions([action], layout)).not.toHaveProperty('accessibilityValue')
  })

  it('reads in place of the badge on a web page, and an empty one reads nothing there', () => {
    const browser = new Window({ url: 'https://fixture.invalid/home' })
    try {
      const web = mountFloatingActionsWeb(browser.document as unknown as Document)
      const label = () => browser.document.querySelector('[data-floating-action]')!.getAttribute('aria-label')
      web.update([{ ...action, accessibilityValue: '' }], 'beside')
      expect(label()).toBe('Add, 3 unread messages')
      web.update([{ ...action, accessibilityValue: 'three new' }], 'beside')
      expect(label()).toBe('Add, 3 unread messages, three new')
      web.update([action], 'beside')
      expect(label()).toBe('Add, 3 unread messages, 3')
      web.dispose()
    }
    finally {
      browser.close()
    }
  })
})
