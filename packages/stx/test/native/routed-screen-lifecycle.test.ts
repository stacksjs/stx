import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { compileNativeBundle } from '../../src/native/compiler/bundle'

interface NativeSession {
  scope: Record<string, any>
  sent: any[]
  receive: (message: Record<string, unknown>) => void
}

function operations(session: NativeSession): any[] {
  return session.sent
    .filter(message => message.type === 'MUTATE')
    .flatMap(message => message.payload.operations)
}

function nodeIdFor(session: NativeSession, testID: string): string {
  const render = session.sent.find(message => message.type === 'RENDER')?.payload.document
  const visit = (node: any): string | undefined => {
    if (node?.props?.testID === testID) return String(node.props.__stxId)
    for (const child of node?.children ?? []) {
      if (child && typeof child === 'object') {
        const found = visit(child)
        if (found) return found
      }
    }
    return undefined
  }
  const id = visit(render)
  if (!id) throw new Error(`No native node with testID ${testID}`)
  return id
}

async function start(bundle: string, route?: string, params?: Record<string, unknown>): Promise<NativeSession> {
  const sent: any[] = []
  let callback: (raw: string) => void = () => {}
  const scope: Record<string, any> = {
    console,
    Promise,
    setTimeout,
    clearTimeout,
    Date,
    Map,
    Set,
    WeakMap,
    WeakSet,
    ...(route === undefined ? {} : { __stxNativeRoute: route }),
    __stxNativeParams: params,
    __stxNativeBridge: {
      platform: 'ios',
      capabilityProtocolVersion: 1,
      capabilities: ['lifecycle'],
      postMessage: (raw: string) => sent.push(JSON.parse(raw)),
      onMessage: (receiver: typeof callback) => { callback = receiver },
    },
  }
  vm.runInNewContext(bundle, scope)
  await Bun.sleep(0)
  return {
    scope,
    sent,
    receive: message => callback(JSON.stringify(message)),
  }
}

async function press(session: NativeSession, testID: string): Promise<void> {
  const id = nodeIdFor(session, testID)
  const handlerId = operations(session)
    .find(operation => operation.id === id && operation.patch?.events?.onPress)
    ?.patch.events.onPress
  expect(handlerId, `no onPress handler on ${testID}`).toBeTruthy()
  session.receive({ type: 'EVENT', payload: { handlerId, nativeEvent: {} } })
  await Bun.sleep(0)
}

describe('routed native screens keep navigation and lifecycle state isolated', () => {
  it('supports params, push/back/replace, focus callbacks, and cleanup', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-routes-'))
    await Bun.write(path.join(root, 'Home.stx'), `<script client>
const count = state(0)
function bump() { count.update(value => value + 1) }
function openDetails() { craft.navigation.push('details', { id: 7 }) }
onDestroy(() => globalThis.__homeDestroyed = (globalThis.__homeDestroyed || 0) + 1)
craft.navigation.onAppear(() => globalThis.__homeAppeared = (globalThis.__homeAppeared || 0) + 1)
craft.navigation.onDisappear(() => globalThis.__homeDisappeared = (globalThis.__homeDisappeared || 0) + 1)
</script>
<View>
  <Text testID="home-count" :text="'Home ' + count()" />
  <Button testID="home-bump" @click="bump()">Bump</Button>
  <Button testID="open-details" @click="openDetails()">Details</Button>
</View>`)
    await Bun.write(path.join(root, 'Details.stx'), `<script client>
const id = Number(craft.route.params.id)
const count = state(0)
function bump() { count.update(value => value + 1) }
function replaceSummary() { craft.navigation.replace('summary', { from: count() }) }
onDestroy(() => globalThis.__detailsDestroyed = (globalThis.__detailsDestroyed || 0) + 1)
</script>
<View>
  <Text testID="details-title" :text="'Details ' + id" />
  <Text testID="details-count" :text="'Details count ' + count()" />
  <Button testID="details-bump" @click="bump()">Bump</Button>
  <Button testID="replace-summary" @click="replaceSummary()">Summary</Button>
</View>`)
    await Bun.write(path.join(root, 'Summary.stx'), `<script client>
const from = Number(craft.route.params.from)
</script>
<View><Text testID="summary" :text="'Summary ' + from" /></View>`)

    const bundle = (await compileNativeBundle({
      root,
      screens: { home: 'Home.stx', details: 'Details.stx', summary: 'Summary.stx' },
      initialScreen: 'home',
    })).code

    const home = await start(bundle)
    expect(home.sent.find(message => message.type === 'RENDER')?.payload.document).toMatchObject({ type: 'View' })
    expect(operations(home)).toContainEqual(expect.objectContaining({ patch: { children: ['Home 0'] } }))
    await press(home, 'home-bump')
    expect(operations(home)).toContainEqual(expect.objectContaining({ patch: { children: ['Home 1'] } }))

    home.receive({ type: 'SCREEN_FOCUS', payload: { focused: false } })
    await Bun.sleep(0)
    home.receive({ type: 'SCREEN_FOCUS', payload: { focused: true } })
    await Bun.sleep(0)
    expect(home.scope.__homeDisappeared).toBe(1)
    expect(home.scope.__homeAppeared).toBe(1)

    await press(home, 'open-details')
    expect(home.sent.at(-1)).toMatchObject({
      type: 'NAVIGATE',
      payload: { screen: 'details', params: { id: 7 } },
    })

    const details = await start(bundle, 'details', { id: 7 })
    expect(operations(details)).toContainEqual(expect.objectContaining({ patch: { children: ['Details 7'] } }))
    expect(operations(details)).toContainEqual(expect.objectContaining({ patch: { children: ['Details count 0'] } }))
    await press(details, 'details-bump')
    expect(operations(details)).toContainEqual(expect.objectContaining({ patch: { children: ['Details count 1'] } }))
    await press(details, 'replace-summary')
    expect(details.sent.at(-1)).toMatchObject({
      type: 'NAVIGATE_REPLACE',
      payload: { screen: 'summary', params: { from: 1 } },
    })
    details.scope.craft.navigation.back()
    expect(details.sent.at(-1)).toMatchObject({ type: 'NAVIGATE_BACK' })

    details.scope.__stxNativeUnmount()
    details.scope.__stxNativeUnmount()
    expect(details.scope.__detailsDestroyed).toBe(1)

    // A second controller gets fresh state even when it opens the same route.
    const freshDetails = await start(bundle, 'details', { id: 42 })
    expect(operations(freshDetails)).toContainEqual(expect.objectContaining({ patch: { children: ['Details 42'] } }))
    expect(operations(freshDetails)).toContainEqual(expect.objectContaining({ patch: { children: ['Details count 0'] } }))
  })
})
