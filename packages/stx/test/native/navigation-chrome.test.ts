import { describe, expect, it } from 'bun:test'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'
import { chromePath, mergeChromeButtons } from '../../src/native/runtime/navigation-chrome'

function host(route: { name: string, url?: string }) {
  const sent: Array<Record<string, any>> = []
  let receive: (message: string) => void = () => {}
  const bridge = {
    postMessage(raw: string) { sent.push(JSON.parse(raw)) },
    onMessage(callback: (message: string) => void) { receive = callback },
    routeURL: route.url,
  }
  const target = { __stxNativeRoute: route.name } as Record<string, unknown>
  const protocol = new STXBridge()
  protocol.initialize(bridge)
  const craft = installCraftBridge(protocol, { ...bridge, platform: 'ios' }, target)
  const options = () => sent.filter(message => message.type === 'NAVIGATION_SET_OPTIONS').map(message => message.payload)
  const press = (id: string) => receive(JSON.stringify({ type: 'NAV_BUTTON', payload: { id } }))
  return { craft, sent, options, press, protocol }
}

const calendar = { id: 'calendar', symbol: 'calendar', variant: 'neutral' as const, accessibilityLabel: 'Calendar', open: '/m/calendar' }
const map = { id: 'map', symbol: 'map', accessibilityLabel: 'Map', open: '/explore', hideOn: ['TrailMap'] }

describe('merging the app chrome into a screen bar', () => {
  it('puts the screen buttons first and the chrome after', () => {
    expect(mergeChromeButtons([{ id: 'share', symbol: 'square.and.arrow.up' }], { rightButtons: [calendar] }, 'rightButtons', { name: 'Trail' }).map(button => button.id))
      .toEqual(['share', 'calendar'])
  })

  it('leaves a button off the screen it opens, and off the screens it names', () => {
    expect(mergeChromeButtons([], { rightButtons: [calendar] }, 'rightButtons', { name: 'Calendar', path: 'https://app.test/m/calendar?week=2' })).toEqual([])
    expect(mergeChromeButtons([], { rightButtons: [map] }, 'rightButtons', { name: 'TrailMap', path: '/trail/4/map' })).toEqual([])
  })

  it('keeps a bare screen to its own buttons', () => {
    expect(mergeChromeButtons([{ id: 'more', symbol: 'ellipsis' }], { rightButtons: [calendar], bare: ['Profile'] }, 'rightButtons', { name: 'Profile' }).map(button => button.id))
      .toEqual(['more'])
  })

  it('lets a chrome button replace a screen button with its id', () => {
    expect(mergeChromeButtons([{ id: 'calendar', title: 'Old' }], { rightButtons: [calendar] }, 'rightButtons', { name: 'Today' }))
      .toEqual([calendar])
  })

  it('reads any spelling of a path as its pathname', () => {
    expect(chromePath('https://wildloop.org/explore/?near=1#map')).toBe('/explore')
    expect(chromePath('/m/calendar')).toBe('/m/calendar')
    expect(chromePath(undefined)).toBe('')
  })
})

describe('craft.navigation.setChrome', () => {
  it('sends the chrome with the screen buttons, without callbacks or chrome-only fields', () => {
    const { craft, options, protocol } = host({ name: 'Feed', url: '/feed' })
    craft.navigation.setOptions({ title: 'Feed', rightButtons: [{ id: 'search', symbol: 'magnifyingglass', onPress: () => {} }] })
    craft.navigation.setChrome({ rightButtons: [calendar, map] })
    expect(options()).toEqual([
      { title: 'Feed', rightButtons: [{ id: 'search', symbol: 'magnifyingglass' }] },
      { rightButtons: [
        { id: 'search', symbol: 'magnifyingglass' },
        { id: 'calendar', symbol: 'calendar', variant: 'neutral', accessibilityLabel: 'Calendar' },
        { id: 'map', symbol: 'map', accessibilityLabel: 'Map' },
      ] },
    ])
    protocol.dispose()
  })

  it('keeps the chrome when the screen sets its buttons again', () => {
    const { craft, options, protocol } = host({ name: 'Feed', url: '/feed' })
    craft.navigation.setChrome({ rightButtons: [calendar] })
    craft.navigation.setOptions({ rightButtons: [{ id: 'search', symbol: 'magnifyingglass' }] })
    expect(options().at(-1)!.rightButtons.map((button: any) => button.id)).toEqual(['search', 'calendar'])
    protocol.dispose()
  })

  it('opens a chrome button\'s path when it is pressed, and still tells onButton', () => {
    const { craft, sent, press, protocol } = host({ name: 'Feed', url: '/feed' })
    const heard: string[] = []
    craft.navigation.onButton(event => { heard.push(event.id) })
    craft.navigation.setChrome({ rightButtons: [map] })
    press('map')
    expect(sent.filter(message => message.type === 'NAVIGATE_OPEN').map(message => message.payload)).toEqual([{ path: '/explore' }])
    expect(heard).toEqual(['map'])
    protocol.dispose()
  })

  it('does not send an unchanged bar again, so the host does not rebuild its buttons', () => {
    const { craft, options, protocol } = host({ name: 'Feed', url: '/feed' })
    const account = (badge: string | null) => ({ rightButtons: [calendar], tabItems: [{ id: '/me', image: 'https://cdn.test/a.jpg', badge }] })
    craft.navigation.setChrome(account(null))
    craft.navigation.setChrome(account(null))
    craft.navigation.setChrome(account('2'))
    expect(options()).toEqual([
      { rightButtons: [{ id: 'calendar', symbol: 'calendar', variant: 'neutral', accessibilityLabel: 'Calendar' }], tabItem: { id: '/me', image: 'https://cdn.test/a.jpg', badge: null } },
      // A new badge is a tab update alone: the toolbar is left as it is.
      { tabItem: { id: '/me', image: 'https://cdn.test/a.jpg', badge: '2' } },
    ])
    protocol.dispose()
  })

  it('sends a tab accessory once, and removes it with null', () => {
    const { craft, options, protocol } = host({ name: 'Feed', url: '/feed' })
    const accessory = { path: '/explore', title: 'Map', symbol: 'map', iconOnly: true }
    craft.navigation.setChrome({ tabAccessory: accessory })
    craft.navigation.setChrome({ tabAccessory: accessory })
    craft.navigation.setChrome({ tabAccessory: null })
    expect(options()).toEqual([{ tabAccessory: accessory }, { tabAccessory: null }])
    protocol.dispose()
  })

  it('takes the chrome off with null and leaves the screen\'s own buttons', () => {
    const { craft, options, protocol } = host({ name: 'Feed', url: '/feed' })
    craft.navigation.setOptions({ rightButtons: [{ id: 'search', symbol: 'magnifyingglass' }] })
    craft.navigation.setChrome({ rightButtons: [calendar] })
    craft.navigation.setChrome(null)
    expect(options().at(-1)).toEqual({ rightButtons: [{ id: 'search', symbol: 'magnifyingglass' }] })
    protocol.dispose()
  })

  it('refuses something that is not chrome', () => {
    const { craft, protocol } = host({ name: 'Feed' })
    expect(() => craft.navigation.setChrome([] as any)).toThrow(TypeError)
    protocol.dispose()
  })
})
