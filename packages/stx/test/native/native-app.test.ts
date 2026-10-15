/**
 * The app script: one context with no screen, run from the screens' bundle
 * when the host names the route `__app` (Craft's `nativeApp`).
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { NATIVE_APP_ROUTE } from '../../src/native/runtime/shared-screen'
import { createTempDir } from '../../src/temp-dir'

let bundle: Promise<string> | null = null

async function generate(): Promise<string> {
  bundle ??= (async () => {
    const root = createTempDir('stx-native-app-')
    await Bun.write(path.join(root, 'Home.stx'), '<script client></script><View><Text>Home</Text></View>')
    await Bun.write(path.join(root, 'helper.ts'), 'export function where(craft: any): string { return craft.app.url + "/api" }\n')
    await Bun.write(path.join(root, 'app.ts'), `
import { where } from './helper'
globalThis.__appModuleLoaded = (globalThis.__appModuleLoaded || 0) + 1
export default function app(craft: any) {
  globalThis.__appRan = { route: craft.route.name, api: where(craft), version: craft.app.version }
  const opened = (event: any) => craft.navigation.open(event.detail.href)
  globalThis.addEventListener('craftNotificationResponse', opened)
  globalThis.addEventListener('craftBackgroundRefresh', (event: any) => { void craft.background.complete(true, event.detail.id) })
  return () => { globalThis.__appStopped = true }
}
`)
    const result = await compileNativeBundle({ root, screens: { Home: 'Home.stx' }, app: 'app.ts' })
    return result.code
  })()
  return bundle
}

async function run(route: string | undefined, capabilities: string[] = ['background', 'fetch']) {
  const sent: Array<Record<string, any>> = []
  let callback: (message: string) => void = () => {}
  const scope: Record<string, any> = {
    __stxNativeParams: {},
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: 1000,
      capabilities,
      appURL: 'https://app.example',
      appVersion: '1.2.0',
      appBuild: '7',
      onMessage: (receiver: typeof callback) => { callback = receiver },
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
    setTimeout,
    clearTimeout,
  }
  if (route) scope.__stxNativeRoute = route
  vm.runInNewContext(await generate(), scope)
  await Promise.resolve()
  const receive = (message: Record<string, any>) => callback(JSON.stringify(message))
  return { scope, sent, receive }
}

describe('the app script', () => {
  it('runs its default export with craft, and draws nothing', async () => {
    const { scope, sent } = await run(NATIVE_APP_ROUTE)
    expect(scope.__appRan).toEqual({ route: NATIVE_APP_ROUTE, api: 'https://app.example/api', version: '1.2.0' })
    expect(sent.some(message => message.type === 'RENDER')).toBe(false)
    expect(scope.craft.app).toEqual({ url: 'https://app.example', version: '1.2.0', build: '7' })
  })

  it('hears the host\'s app events as the page\'s CustomEvents, and answers them', async () => {
    const { sent, receive } = await run(NATIVE_APP_ROUTE)
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftNotificationResponse', detail: { href: '/m/workout/5' } } })
    expect(sent.at(-1)).toMatchObject({ type: 'NAVIGATE_OPEN', payload: { path: '/m/workout/5' } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftBackgroundRefresh', detail: { id: 'task-1' } } })
    const request = sent.at(-1)!
    expect(request.type).toBe('API_REQUEST')
    expect(request.payload).toMatchObject({ module: 'Background', method: 'complete', args: [true, 'task-1'] })
  })

  it('runs its cleanup when the host ends it', async () => {
    const { scope } = await run(NATIVE_APP_ROUTE)
    scope.__stxNativeUnmount()
    expect(scope.__appStopped).toBe(true)
  })

  it('is not run for a screen, which draws as before', async () => {
    const { scope, sent } = await run('Home')
    expect(scope.__appRan).toBeUndefined()
    expect(scope.__appModuleLoaded).toBe(1)
    expect(sent.some(message => message.type === 'RENDER')).toBe(true)
  })

  it('has no background without the capability, and no app route without an app script', async () => {
    const { scope } = await run(NATIVE_APP_ROUTE, [])
    expect(scope.craft.background).toBeUndefined()
    const root = createTempDir('stx-native-noapp-')
    await Bun.write(path.join(root, 'Home.stx'), '<script client></script><View><Text>Home</Text></View>')
    const { code } = await compileNativeBundle({ root, screens: { Home: 'Home.stx' } })
    const scope2: Record<string, any> = { __stxNativeRoute: NATIVE_APP_ROUTE, __stxNativeParams: {}, __stxNativeBridge: { platform: 'ios', capabilities: [], onMessage: () => {}, postMessage: () => {} }, setTimeout, clearTimeout }
    expect(() => vm.runInNewContext(code, scope2)).toThrow(/Unknown native screen: __app/)
  })

  it('refuses an app script that does not exist, or a screen named for its route', async () => {
    const root = createTempDir('stx-native-badapp-')
    await Bun.write(path.join(root, 'Home.stx'), '<script client></script><View><Text>Home</Text></View>')
    await expect(compileNativeBundle({ root, screens: { Home: 'Home.stx' }, app: 'missing.ts' })).rejects.toThrow(/does not exist/)
    await Bun.write(path.join(root, 'app.ts'), 'export default () => {}\n')
    await expect(compileNativeBundle({ root, screens: { Home: 'Home.stx', [NATIVE_APP_ROUTE]: 'Home.stx' }, app: 'app.ts' })).rejects.toThrow(/route, not a screen/)
  })
})
