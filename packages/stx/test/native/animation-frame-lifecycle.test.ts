import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { STXBridge } from '../../src/native/bridge/protocol'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { installCraftBridge } from '../../src/native/runtime/craft-bridge'
import { installJSCGlobals } from '../../src/native/runtime/jsc-globals'
import { createTempDir } from '../../src/temp-dir'

async function animationScreen(initialAppState = 'active') {
  const root = createTempDir('stx-native-animation-')
  const file = path.join(root, 'Scene.stx')
  const composable = path.resolve(import.meta.dir, '../../src/composables/use-animation-frame')
  await Bun.write(file, `<script client>
import { useAnimationFrame } from '${composable}'
const ticks = state(0)
const deltas: number[] = []
const visibility: string[] = []
useEventListener('visibilitychange', () => visibility.push(document.visibilityState), { target: document })
const clock = useAnimationFrame(delta => { deltas.push(delta); ticks.set(ticks() + 1) })
globalThis.__scene = { clock, deltas, ticks, visibility }
</script><View><Text :text="ticks()" /></View>`)
  let receive: (message: string) => void = () => {}
  let next = 0
  let time = 0
  const frames = new Map<number, () => void>()
  const scope: Record<string, any> = {
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilities: ['lifecycle'],
      initialAppState,
      onMessage: (callback: typeof receive) => { receive = callback },
      postMessage: () => {},
    },
    performance: { now: () => time },
    setTimeout: (callback: () => void) => { frames.set(++next, callback); return next },
    clearTimeout: (id: number) => { frames.delete(id) },
  }
  vm.runInNewContext((await compileSharedScreenBundle(file)).code, scope)
  await Promise.resolve()
  return {
    scope,
    frames,
    state: (state: string) => receive(JSON.stringify({ type: 'APP_STATE', payload: { state } })),
    tick(milliseconds: number) {
      time = milliseconds
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach(callback => callback())
    },
  }
}

describe('native animation clock lifecycle', () => {
  it('suspends background frames and resumes without advancing the hidden interval', async () => {
    const { scope, frames, state, tick } = await animationScreen()
    try {
      tick(1000)
      tick(1020)
      expect(scope.__scene.deltas).toEqual([0, 20])
      state('background')
      expect(scope.document.hidden).toBe(true)
      expect(scope.document.visibilityState).toBe('hidden')
      expect(frames.size).toBe(0)
      state('inactive')
      expect(scope.__scene.visibility).toEqual(['hidden'])
      tick(50000)
      expect(scope.__scene.deltas).toEqual([0, 20])
      state('active')
      expect(scope.document.hidden).toBe(false)
      expect(scope.document.visibilityState).toBe('visible')
      state('active')
      expect(scope.__scene.visibility).toEqual(['hidden', 'visible'])
      tick(60000)
      expect(scope.__scene.deltas).toEqual([0, 20, 0])
      tick(60016)
      expect(scope.__scene.deltas).toEqual([0, 20, 0, 16])
      scope.__stxNativeUnmount()
      expect(frames.size).toBe(0)
      state('background')
      state('active')
      expect(frames.size).toBe(0)
    }
    finally { scope.__stxNativeUnmount() }
  })

  it('starts suspended when the host loads the screen in the background', async () => {
    const { scope, frames, state, tick } = await animationScreen('background')
    try {
      expect(scope.document.hidden).toBe(true)
      expect(frames.size).toBe(0)
      tick(10000)
      expect(scope.__scene.deltas).toEqual([])
      state('inactive')
      expect(frames.size).toBe(0)
      state('active')
      expect(frames.size).toBe(1)
      tick(11000)
      expect(scope.__scene.deltas).toEqual([0])
    }
    finally { scope.__stxNativeUnmount() }
  })

  it('leaves an existing browser document under the browser\'s control', () => {
    let receive: (message: string) => void = () => {}
    const bridge = {
      platform: 'ios',
      initialAppState: 'background',
      onMessage: (callback: typeof receive) => { receive = callback },
      postMessage() {},
    }
    const protocol = new STXBridge()
    protocol.initialize(bridge)
    const document = Object.freeze({
      hidden: false,
      visibilityState: 'visible',
      dispatchEvent() { throw new Error('The bridge must not dispatch browser visibility events') },
    })
    const target = { document }
    installJSCGlobals(target)
    installCraftBridge(protocol, bridge, target)
    receive(JSON.stringify({ type: 'APP_STATE', payload: { state: 'active' } }))
    receive(JSON.stringify({ type: 'APP_STATE', payload: { state: 'background' } }))
    expect(target.document).toBe(document)
    expect(document.hidden).toBe(false)
    expect(document.visibilityState).toBe('visible')
    protocol.dispose()
  })
})
