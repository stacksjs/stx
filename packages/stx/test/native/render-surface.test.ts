/**
 * <RenderSurface> on a native screen (stacksjs/stx#2108): what the compiler
 * hands the host for craft-native/craft#578, and what the shared component
 * does with the host's events and its `present`.
 *
 * The host is a stand-in here: a recording `craft.renderSurface.present`.
 * That the real one draws, refuses a removed name and reports a duplicate is
 * shown on an iOS simulator by the `surface` suite of the device gate.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { STXBridge } from '../../src/native/bridge/protocol'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

const ui = join(import.meta.dir, '../../../components/src/ui')

afterEach(() => unmountAllNativeScreens())

describe('the compiler', () => {
  it('makes a RenderSurface node with its props and its five events', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<canvas data-native="RenderSurface" surface="map" filter="linear" opaque="false" @ready="a()" @resize="b()" @lost="c()" @restored="d()" @error="e()"></canvas>')
    expect(root.type).toBe('RenderSurface')
    expect(root.props).toMatchObject({ surface: 'map', filter: 'linear', opaque: false })
    expect(root.events).toEqual({ onReady: 'a()', onResize: 'b()', onLost: 'c()', onRestored: 'd()', onError: 'e()' })
    expect(diagnostics).toEqual([])
  })

  it('leaves `@ready` elsewhere to a component and still reports a browser `@resize`', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div @ready="a()" @lost="b()" @restored="c()" @resize="d()"><p>x</p></div>')
    expect(root.events).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unread-event', tag: 'div', name: '@resize' }])
  })
})

describe('the craft bridge', () => {
  it('keeps the host\'s renderSurface and reads its capability', () => {
    const present = () => true
    const host = { present }
    const target: Record<string, any> = { craft: { renderSurface: host } }
    const protocol = new STXBridge()
    const bridge = { postMessage() {}, onMessage() {}, platform: 'ios', capabilities: ['renderSurface'] } as any
    protocol.initialize(bridge)
    installCraftBridge(protocol, bridge, target)
    expect(target.craft.renderSurface).toBe(host)
    expect(target.craft.renderSurface.present).toBe(present)
    expect(target.craft.capabilities.renderSurface).toBe(true)
    protocol.dispose()

    const bare: Record<string, any> = {}
    const without = new STXBridge()
    const plain = { postMessage() {}, onMessage() {}, platform: 'ios', capabilities: [] } as any
    without.initialize(plain)
    installCraftBridge(without, plain, bare)
    expect(bare.craft.renderSurface).toBeUndefined()
    expect(bare.craft.capabilities.renderSurface).toBe(false)
    without.dispose()
  })
})

const SCREEN = `@import('RenderSurface', '${ui}/render-surface/RenderSurface.stx')
<script client>
import { presentFrame, renderSurfaceHost } from '${ui}/render-surface/render-surface'
const shown = state(true)
window.heard = []
window.probe = { presentFrame, renderSurfaceHost, shown }
</script>
<div class="flex-1">
  <div :if="shown()" class="flex-1">
    <RenderSurface testID="game" class="flex-1" @ready="heard.push(['ready', $event])" @resize="heard.push(['resize', $event])" @lost="heard.push(['lost', $event])" @restored="heard.push(['restored', $event])" @error="heard.push(['error', $event])" />
  </div>
  <RenderSurface surface="map" filter="linear" />
</div>`

function surfaces(phone: ReturnType<typeof mountNativeScreen>): any[] {
  return [...phone.nodes.values()].filter(node => node.type === 'RenderSurface')
}

/** The fallback is drawn over a surface that cannot be: hidden otherwise. */
function fallbacksShown(phone: ReturnType<typeof mountNativeScreen>): number {
  return [...phone.nodes.values()].filter(node => node.props.role === 'status' && node.style.display !== 'none').length
}

function hostWithSurfaces() {
  const presented: Array<[string, Uint32Array, number, number]> = []
  const renderSurface = { present: (surface: string, pixels: Uint32Array, width: number, height: number) => { presented.push([surface, pixels, width, height]); return true } }
  return { presented, renderSurface }
}

describe('the shared component on a native screen', () => {
  it('gives each unnamed instance its own surface and draws through the host\'s present', async () => {
    const { code } = await compileNativeScreen(SCREEN)
    const host = hostWithSurfaces()
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios', capabilities: ['renderSurface'], craft: { renderSurface: host.renderSurface } })
    await phone.settle()
    const [game, map] = surfaces(phone)
    expect(game.props).toMatchObject({ filter: 'nearest', opaque: true })
    expect(String(game.props.surface)).toMatch(/^surface-/)
    expect(map.props).toMatchObject({ surface: 'map', filter: 'linear', opaque: true })
    expect(fallbacksShown(phone)).toBe(0)
    expect(phone.context.craft.renderSurface).toBe(host.renderSurface)
    expect(phone.context.probe.renderSurfaceHost()).toBe('native')

    const frame = new Uint32Array([0xFFFF0000, 0xFF00FF00])
    expect(phone.context.probe.presentFrame('map', frame, 2, 1)).toBe(true)
    expect(host.presented).toEqual([['map', frame, 2, 1]])
    // The words are handed over as they are: the host copies them itself.
    expect(host.presented[0]![1]).toBe(frame)
  })

  it('has a size wherever a page writes flex-1, the component\'s own box included', async () => {
    // The scope around a component is a real box on a phone (no
    // display:contents). Unsized, in a row, it left the surface 0 points wide
    // and the host never said ready.
    const { code } = await compileNativeScreen(`@import('RenderSurface', '${ui}/render-surface/RenderSurface.stx')
<div class="h-40 flex" testID="outer"><div class="flex-1 flex"><RenderSurface surface="game" class="flex-1" /></div></div>`)
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios', capabilities: ['renderSurface'], craft: { renderSurface: hostWithSurfaces().renderSurface } })
    await phone.settle()
    const nodes = [...phone.nodes.values()]
    const parentOf = (id: string) => nodes.find(node => node.children.some(child => typeof child !== 'string' && child.id === id))
    let node: any = surfaces(phone)[0]
    const flexes: number[] = []
    while (node && node.props.testID !== 'outer') {
      flexes.push(Number(node.style.flex) || Number(node.style.flexGrow) || 0)
      node = parentOf(node.id)
    }
    expect(node?.style.height).toBe(160)
    expect(flexes.length).toBeGreaterThanOrEqual(4)
    expect(flexes.every(flex => flex > 0)).toBe(true)
  })

  it('tells the page each thing the host says about its surface, by name', async () => {
    const { code } = await compileNativeScreen(SCREEN)
    const host = hostWithSurfaces()
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios', capabilities: ['renderSurface'], craft: { renderSurface: host.renderSurface } })
    await phone.settle()
    const [game] = surfaces(phone)
    const name = String(game.props.surface)
    const size = { width: 390, height: 300, scale: 3, pixelWidth: 1170, pixelHeight: 900 }
    phone.press(game, 'onReady', size)
    phone.press(game, 'onResize', { ...size, width: 844, pixelWidth: 2532 })
    phone.press(game, 'onLost', { reason: 'background' })
    phone.press(game, 'onRestored', size)
    phone.press(game, 'onError', { code: 'DUPLICATE', message: 'taken' })
    await phone.settle()
    expect(phone.context.heard).toEqual([
      ['ready', { surface: name, ...size }],
      ['resize', { surface: name, ...size, width: 844, pixelWidth: 2532 }],
      ['lost', { surface: name, reason: 'background' }],
      ['restored', { surface: name, ...size }],
      ['error', { surface: name, code: 'DUPLICATE', message: 'taken' }],
    ])
    // A duplicate is the page's mistake, not the device's: no fallback.
    expect(fallbacksShown(phone)).toBe(0)
  })

  it('says so in the box where the device cannot draw one, before and after the host does', async () => {
    const { code } = await compileNativeScreen(SCREEN)
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios', capabilities: [] })
    await phone.settle()
    expect(phone.context.probe.renderSurfaceHost()).toBe('none')
    expect(fallbacksShown(phone)).toBe(2)
    expect(phone.texts()).toContain('This device cannot draw this view.')
    phone.press(surfaces(phone)[0], 'onError', { code: 'UNAVAILABLE', message: 'No Metal device' })
    await phone.settle()
    expect(phone.context.heard).toEqual([['error', { surface: String(surfaces(phone)[0].props.surface), code: 'UNAVAILABLE', message: 'No Metal device' }]])
    expect(() => phone.context.probe.presentFrame('map', new Uint32Array(1), 1, 1)).toThrow(expect.objectContaining({ code: 'UNAVAILABLE' }))
  })

  it('removes the node with its component, and mounts it again under the same name when it returns', async () => {
    const { code } = await compileNativeScreen(SCREEN)
    const host = hostWithSurfaces()
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios', capabilities: ['renderSurface'], craft: { renderSurface: host.renderSurface } })
    await phone.settle()
    const name = String(surfaces(phone)[0].props.surface)
    phone.context.probe.shown.set(false)
    await phone.settle()
    // Gone from the tree: the host takes that as the end of the surface, and
    // its present refuses the name from then on.
    expect(surfaces(phone).map(node => node.props.surface)).toEqual(['map'])
    phone.context.probe.shown.set(true)
    await phone.settle()
    // The host takes a new mount of a name as a new surface, with its own ready.
    expect(surfaces(phone).map(node => node.props.surface).sort()).toEqual([name, 'map'].sort())
    phone.press(surfaces(phone).find(node => node.props.surface === name), 'onReady', { width: 1, height: 1, scale: 1, pixelWidth: 1, pixelHeight: 1 })
    await phone.settle()
    expect(phone.context.heard).toEqual([['ready', { surface: name, width: 1, height: 1, scale: 1, pixelWidth: 1, pixelHeight: 1 }]])
  })
})
