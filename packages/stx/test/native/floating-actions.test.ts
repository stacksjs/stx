import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { floatingActions } from '../../src/native/floating-actions'
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
