import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { Window } from 'very-happy-dom'
import { floatingActions } from '../../src/native/floating-actions'
import { FLOATING_ACTIONS_CSS, mountFloatingActionsWeb } from '../../src/native/floating-actions-web'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const add = { path: '/add', label: 'Add', symbol: 'plus', menu: [{ path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' }] }
const messages = { path: '/messages', label: 'Messages', symbol: 'message.fill', badge: 3 }

describe('floatingActions', () => {
  it('reads in order: earlier actions are companions, the last is the primary', () => {
    expect(floatingActions([add, messages])).toEqual({
      path: '/messages', title: 'Messages', symbol: 'message.fill', badge: '3', layout: 'vertical',
      companions: [{ path: '/add', title: 'Add', symbol: 'plus', menu: [{ path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' }] }],
    })
  })

  it('keeps a round control each when separate, and joins them otherwise', () => {
    expect(floatingActions([messages], 'separate')).toMatchObject({ iconOnly: true, companions: [] })
    expect(floatingActions([messages], 'separate')).not.toHaveProperty('layout')
    expect(floatingActions([messages], 'horizontal')).toMatchObject({ layout: 'horizontal' })
  })

  it('writes a count the way a badge reads', () => {
    const badge = (value: string | number | null) => floatingActions([{ ...messages, badge: value }])!.badge
    expect(badge(0)).toBeNull()
    expect(badge(null)).toBeNull()
    expect(badge('')).toBeNull()
    expect(badge(100)).toBe('99+')
    expect(badge('New')).toBe('New')
  })

  it('marks an action that is on, wherever it is in the group', () => {
    expect(floatingActions([messages])).not.toHaveProperty('selected')
    expect(floatingActions([{ ...messages, active: false }])).not.toHaveProperty('selected')
    expect(floatingActions([{ ...messages, active: true }])).toMatchObject({ selected: true })
    const group = floatingActions([{ path: '/map', label: 'Map', symbol: 'map.fill' }, { path: '/locate', label: 'Follow me', symbol: 'location', active: true }, messages])!
    expect(group.companions).toEqual([{ path: '/map', title: 'Map', symbol: 'map.fill' }, { path: '/locate', title: 'Follow me', symbol: 'location', selected: true }])
  })

  it('takes the group away when there is nothing to show', () => {
    expect(floatingActions([])).toBeNull()
    expect(floatingActions([null, false, undefined])).toBeNull()
  })

  it('leaves out an action that is not offered', () => {
    expect(floatingActions([false, messages])!.companions).toEqual([])
  })

  it('refuses a list the host cannot draw as written', () => {
    expect(() => floatingActions([{ ...add, badge: 2 }, messages])).toThrow('only the last action shows a badge')
    expect(() => floatingActions([messages, add])).toThrow('put the menu on an earlier one')
    expect(() => floatingActions([messages, { ...messages }])).toThrow('listed twice')
    expect(() => floatingActions([{ ...messages, path: '//evil.example' }])).toThrow('not a path of the app')
    expect(() => floatingActions([{ ...messages, path: 'https://example.com' }])).toThrow('not a path of the app')
    expect(() => floatingActions([{ ...messages, label: '' }])).toThrow('needs a label and a symbol')
    expect(() => floatingActions([add, { ...add, path: '/b' }, { ...add, path: '/c' }, messages])).toThrow('at most 3')
    expect(() => floatingActions([messages], 'diagonal' as any)).toThrow('unknown layout')
  })
})

describe.each([false, true])('<FloatingActions> (minify=%s)', (minify) => {
  it('draws its actions in the host, follows them, and leaves with the screen', async () => {
    const root = createTempDir('stx-native-floating-actions-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const unread = state(3)
const offered = state(true)
window.unread = unread
window.offered = offered
const actions = derived(() => offered() ? [
  { path: '/add', label: 'Add', symbol: 'plus', menu: [{ path: '/workouts/new', title: 'Workout', symbol: 'dumbbell' }] },
  { path: '/messages', label: 'Messages', symbol: 'message.fill', badge: unread() },
] : [])
</script><div class="flex flex-col gap-4"><span>Feed</span><FloatingActions :actions="actions()" /></div>`)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const sent = () => phone.bars.filter(bar => 'tabAccessory' in bar).map(bar => bar.tabAccessory)
    expect(sent()).toEqual([floatingActions([add, messages])])
    expect(phone.texts()).toEqual(['Feed'])

    phone.context.unread.set(4)
    await phone.settle()
    expect(sent().at(-1)).toMatchObject({ badge: '4', layout: 'vertical' })
    expect(sent().length).toBe(2)

    phone.context.offered.set(false)
    await phone.settle()
    expect(sent().at(-1)).toBeNull()

    phone.context.offered.set(true)
    await phone.settle()
    expect(sent().at(-1)).toMatchObject({ path: '/messages', badge: '4' })
    phone.unmount()
    expect(sent().at(-1)).toBeNull()
    expect(errors).toEqual([])
  }, 30_000)

  it('takes a layout, and no room in the screen', async () => {
    const root = createTempDir('stx-native-floating-layout-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<div class="flex flex-col"><FloatingActions :actions="[{ path: '/map', label: 'Map', symbol: 'map.fill' }]" layout="horizontal" /><span>Only this</span></div>`)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    expect(phone.bars.findLast(bar => 'tabAccessory' in bar)?.tabAccessory).toEqual({ path: '/map', title: 'Map', symbol: 'map.fill', badge: null, layout: 'horizontal', companions: [] })
    const holder = [...phone.nodes.values()].find((node: any) => node.props?.['data-floating-actions'] !== undefined || node.props?.dataFloatingActions !== undefined) as any
    if (holder) expect(holder.style?.display).toBe('none')
    phone.unmount()
  }, 30_000)
})

describe('<FloatingActions> on a web page', () => {
  const webAdd = { path: '/m/add', href: '/add', label: 'Add', symbol: 'plus', icon: 'i-lucide-plus', menu: [
    { path: '/m/workouts/new', href: '/workouts/new', title: 'Workout', symbol: 'dumbbell', icon: 'i-lucide-dumbbell' },
    { path: '/m/habits', title: 'Habit', symbol: 'checkmark.circle' },
  ] }
  const webMessages = { path: '/m/messages', href: '/messages', label: 'Messages', symbol: 'message', icon: 'i-lucide-message-circle', badge: 120 }
  const page = (url = 'https://fixture.invalid/home') => {
    const browser = new Window({ url })
    return { browser, document: browser.document as unknown as Document }
  }

  it('draws one capsule: a control per action in order, the last with its badge', () => {
    const { browser, document } = page()
    try {
      const web = mountFloatingActionsWeb(document)
      expect(web.element).toBeNull()
      web.update([webAdd, webMessages])
      const group = document.querySelector<HTMLElement>('[data-floating-actions-web]')!
      expect(group.getAttribute('data-floating-actions-web')).toBe('vertical')
      expect(group.getAttribute('role')).toBe('group')
      expect(group.getAttribute('aria-label')).toBe('Add, Messages')
      // Its look is one stylesheet, put in the page once, and nothing inline.
      expect(document.querySelectorAll('style[data-floating-actions-style]').length).toBe(1)
      expect(group.getAttribute('style')).toBeNull()
      const controls = [...group.querySelectorAll<HTMLElement>('[data-floating-action]')]
      expect(controls.map(control => [control.tagName, control.getAttribute('data-floating-action')])).toEqual([['BUTTON', '/m/add'], ['A', '/m/messages']])
      // The website's own path, and its icon class in place of the SF Symbol.
      expect(controls[1]!.getAttribute('href')).toBe('/messages')
      expect(controls[0]!.querySelector('[data-floating-action-symbol]')!.className).toBe('i-lucide-plus')
      expect(controls[0]!.hasAttribute('data-first')).toBe(true)
      expect(controls[1]!.hasAttribute('data-last')).toBe(true)
      expect(controls[1]!.getAttribute('aria-label')).toBe('Messages, 99+')
      expect(controls[1]!.querySelector('[data-floating-action-badge]')!.textContent).toBe('99+')
      expect(controls[0]!.querySelector('[data-floating-action-badge]')).toBeNull()
      web.dispose()
      expect(document.querySelector('[data-floating-actions-web]')).toBeNull()
    }
    finally { browser.close() }
  })

  it('opens an action\'s menu of links, and closes it on a second press or Escape', () => {
    const { browser, document } = page()
    try {
      const web = mountFloatingActionsWeb(document)
      web.update([webAdd, webMessages])
      const button = document.querySelector<HTMLButtonElement>('[data-floating-action="/m/add"]')!
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
      button.click()
      const menu = document.querySelector('[data-floating-actions-menu]')!
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect([...menu.querySelectorAll('a')].map(link => [link.getAttribute('href'), link.textContent])).toEqual([['/workouts/new', 'Workout'], ['/m/habits', 'Habit']])
      button.click()
      expect(document.querySelector('[data-floating-actions-menu]')).toBeNull()
      expect(button.getAttribute('aria-expanded')).toBe('false')
      button.click()
      browser.dispatchEvent(new browser.KeyboardEvent('keydown', { key: 'Escape' }) as never)
      expect(document.querySelector('[data-floating-actions-menu]')).toBeNull()
      web.dispose()
    }
    finally { browser.close() }
  })

  it('follows its actions: redrawn when they change, gone when there are none', () => {
    const { browser, document } = page('https://fixture.invalid/messages')
    try {
      const web = mountFloatingActionsWeb(document)
      web.update([webAdd, webMessages], 'separate', { group: 'flex md:hidden text-ink', badge: 'bg-brand', menu: 'bg-surface', active: 'text-brand' })
      let group = document.querySelector<HTMLElement>('[data-floating-actions-web]')!
      // The page's classes, on the parts they are for.
      expect(group.getAttribute('data-floating-actions-web')).toBe('separate')
      expect(group.className).toBe('flex md:hidden text-ink')
      expect(group.querySelector('[data-floating-action-badge]')!.className).toBe('bg-brand')
      group.querySelector<HTMLButtonElement>('[data-floating-action="/m/add"]')!.click()
      expect(group.querySelector('[data-floating-actions-menu]')!.className).toBe('bg-surface')
      expect(group.querySelector('[data-floating-action="/m/messages"]')!.hasAttribute('data-on')).toBe(true)
      // Only the action whose page is showing takes the page's class for "on".
      expect(group.querySelector('[data-floating-action="/m/messages"]')!.className).toBe('text-brand')
      expect(group.querySelector('[data-floating-action="/m/add"]')!.className).toBe('')
      // The page it opens is the page showing.
      expect(group.querySelector('[data-floating-action="/m/messages"]')!.getAttribute('aria-current')).toBe('page')
      web.update([{ ...webMessages, badge: 0 }], 'horizontal')
      expect(document.querySelectorAll('[data-floating-actions-web]').length).toBe(1)
      group = document.querySelector<HTMLElement>('[data-floating-actions-web]')!
      expect(group.getAttribute('data-floating-actions-web')).toBe('horizontal')
      expect(group.className).toBe('')
      expect(group.querySelector('[data-floating-action-badge]')).toBeNull()
      // One stylesheet still, after three drawings.
      expect(document.querySelectorAll('style[data-floating-actions-style]').length).toBe(1)
      web.update([])
      expect(document.querySelector('[data-floating-actions-web]')).toBeNull()
      expect(web.element).toBeNull()
    }
    finally { browser.close() }
  })

  it('refuses what a host would refuse, and never links off the site', () => {
    const { browser, document } = page()
    try {
      const web = mountFloatingActionsWeb(document)
      expect(() => web.update([webMessages, webAdd])).toThrow('put the menu on an earlier one')
      web.update([{ ...webMessages, href: 'https://elsewhere.invalid/x' }])
      expect(document.querySelector('[data-floating-action]')!.getAttribute('href')).toBe('/m/messages')
      web.update([{ ...webMessages, href: '//elsewhere.invalid/x', icon: undefined }])
      const control = document.querySelector('[data-floating-action]')!
      expect(control.getAttribute('href')).toBe('/m/messages')
      // No picture for the web: its name.
      expect(control.querySelector('[data-floating-action-name]')!.textContent).toBe('Messages')
      web.dispose()
    }
    finally { browser.close() }
  })

  it('weighs nothing against a class: every rule is inside :where()', () => {
    for (const rule of FLOATING_ACTIONS_CSS.split('\n')) {
      const selector = rule.slice(0, rule.indexOf('{'))
      // What is left once each :where(...) is taken out is only the spaces between them.
      let rest = selector
      for (let before = ''; before !== rest;) { before = rest; rest = rest.replace(/:where\([^()]*\)/g, '') }
      expect(rest.trim()).toBe('')
    }
    expect(FLOATING_ACTIONS_CSS).toContain('border-radius:24px')
    expect(FLOATING_ACTIONS_CSS).toContain('height:55px')
    // A column's menu opens beside it, on the leading side; a row's above it.
    expect(FLOATING_ACTIONS_CSS).toContain(':where([data-floating-actions-web="vertical"]) :where([data-floating-actions-menu]){inset-inline-end:calc(100% + 8px);bottom:0}')
    expect(FLOATING_ACTIONS_CSS).toContain('bottom:calc(100% + 8px)')
  })

  it('keeps what only a web page uses out of what a host is sent', () => {
    expect(floatingActions([webAdd, webMessages])).toEqual({
      path: '/m/messages', title: 'Messages', symbol: 'message', badge: '99+', layout: 'vertical',
      companions: [{ path: '/m/add', title: 'Add', symbol: 'plus', menu: [{ path: '/m/workouts/new', title: 'Workout', symbol: 'dumbbell' }, { path: '/m/habits', title: 'Habit', symbol: 'checkmark.circle' }] }],
    })
  })
})
