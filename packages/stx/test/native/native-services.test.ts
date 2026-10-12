/**
 * The bridge's newer services on a native screen: the screen coming back and
 * new route params, speech, background sound, push, links, the share sheet,
 * and responses read as they arrive (a server-sent event stream).
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { useBroadcastStream } from '../../src/composables/use-broadcast-stream'

let bundle: Promise<string> | null = null

async function generate(): Promise<string> {
  bundle ??= (async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-services-'))
    const file = path.join(root, 'Services.stx')
    await Bun.write(file, '<script client></script><View><Text>Services</Text></View>')
    return (await compileSharedScreenBundle(file)).code
  })()
  return bundle
}

const ALL = ['fetch', 'eventStream', 'speech', 'audio', 'push', 'linking', 'share', 'geolocation', 'keepAwake', 'brightness', 'statusBar']

async function runtime(capabilities: string[] = ALL, params: Record<string, unknown> = {}) {
  const sent: Array<Record<string, any>> = []
  let callback: (message: string) => void = () => {}
  const scope: Record<string, any> = {
    __stxNativeParams: params,
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: 1000,
      capabilities,
      onMessage: (receiver: typeof callback) => { callback = receiver },
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
    setTimeout,
    clearTimeout,
  }
  vm.runInNewContext(await generate(), scope)
  await Promise.resolve()
  const receive = (message: Record<string, any>) => callback(JSON.stringify(message))
  const requests = () => sent.filter(message => message.type === 'API_REQUEST')
  const answer = (request: Record<string, any>, data: unknown) => receive({
    type: 'API_RESPONSE',
    correlationId: request.id,
    payload: { version: 1, requestId: request.id, data },
  })
  return { scope, sent, receive, requests, answer }
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe('the screen coming back, and new params', () => {
  it('goes back one screen, or to the first of the stack', async () => {
    const { scope, sent } = await runtime()
    scope.craft.navigation.back()
    expect(sent.at(-1)).toMatchObject({ type: 'NAVIGATE_BACK' })
    scope.craft.navigation.popToRoot()
    expect(sent.at(-1)).toMatchObject({ type: 'NAVIGATE_POP_TO_ROOT' })
  })

  it('tells onAppear and onDisappear, and unsubscribes', async () => {
    const { scope, receive } = await runtime([])
    const seen: string[] = []
    const stop = scope.craft.navigation.onAppear(() => seen.push('appear'))
    scope.craft.navigation.onDisappear(() => seen.push('disappear'))
    receive({ type: 'SCREEN_FOCUS', payload: { focused: false } })
    expect(scope.craft.navigation.isFocused()).toBe(false)
    receive({ type: 'SCREEN_FOCUS', payload: { focused: true } })
    expect(scope.craft.navigation.isFocused()).toBe(true)
    stop()
    receive({ type: 'SCREEN_FOCUS', payload: { focused: true } })
    expect(seen).toEqual(['disappear', 'appear'])
  })

  it('replaces route.params and tells onParams with the previous ones', async () => {
    const { scope, receive } = await runtime([], { path: '/m/messages?person=4', person: '4' })
    expect(scope.craft.route.params).toEqual({ path: '/m/messages?person=4', person: '4' })
    const heard: unknown[] = []
    scope.craft.route.onParams((params: unknown, previous: unknown) => heard.push([params, previous]))
    receive({ type: 'ROUTE_PARAMS', payload: { params: { path: '/m/messages?person=8', person: '8' } } })
    expect(scope.craft.route.params).toEqual({ path: '/m/messages?person=8', person: '8' })
    expect(scope.__stxNativeParams).toEqual({ path: '/m/messages?person=8', person: '8' })
    expect(heard).toEqual([[{ path: '/m/messages?person=8', person: '8' }, { path: '/m/messages?person=4', person: '4' }]])
    expect(Object.keys(scope.craft.route)).toEqual(['name', 'params'])
  })
})

describe('services', () => {
  it('flags only what the host offers', async () => {
    const none = await runtime([])
    expect(none.scope.craft.speech).toBeUndefined()
    expect(none.scope.craft.audio).toBeUndefined()
    expect(none.scope.craft.push).toBeUndefined()
    expect(none.scope.craft.share).toBeUndefined()
    expect(none.scope.craft.linking).toBeUndefined()
    expect(none.scope.EventSource).toBeUndefined()
    const all = await runtime()
    expect(all.scope.craft.capabilities).toMatchObject({ speech: true, audio: true, pushNotifications: true, share: true, linking: true, eventStream: true })
    expect(typeof all.scope.EventSource).toBe('function')
    expect(typeof all.scope.AbortController).toBe('function')
  })

  it('speaks untimed and answers whether the words were said', async () => {
    const { scope, requests, answer } = await runtime()
    await expect(scope.craft.speech.speak('  ')).rejects.toThrow('needs some text')
    const spoken = scope.craft.speech.speak('Breathe in', { language: 'en-GB', rate: 0.8 })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Speech', method: 'speak', args: ['Breathe in', { language: 'en-GB', rate: 0.8 }] })
    await new Promise(resolve => setTimeout(resolve, 1100))
    answer(requests().at(-1)!, true)
    expect(await spoken).toBe(true)
    scope.craft.speech.stop().catch(() => {})
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Speech', method: 'stop', args: [] })
  })

  it('plays a sound and steers it by its handle', async () => {
    const { scope, requests, answer, receive } = await runtime()
    const playing = scope.craft.audio.play('https://example.com/rain.m4a', { loop: true, volume: 0.4, fadeIn: 1500 })
    const play = requests().at(-1)!
    expect(play.payload).toMatchObject({ module: 'Audio', method: 'play', args: ['sound-1', 'https://example.com/rain.m4a', { loop: true, volume: 0.4, fadeIn: 1500 }] })
    answer(play, true)
    const sound = await playing
    expect(sound.id).toBe('sound-1')
    // Left unanswered here, so their deadlines are caught.
    sound.setVolume(0.1, { fade: 800 }).catch(() => {})
    expect(requests().at(-1)!.payload.args).toEqual(['sound-1', 0.1, { fade: 800 }])
    sound.pause().catch(() => {})
    sound.resume().catch(() => {})
    sound.stop({ fadeOut: 2000 }).catch(() => {})
    expect(requests().slice(-3).map(request => request.payload.method)).toEqual(['pause', 'resume', 'stop'])
    let ended = false
    sound.onEnd(() => { ended = true })
    receive({ type: 'SOUND_EVENT', payload: { id: 'sound-1', event: 'ended' } })
    expect(ended).toBe(true)
  })

  it('registers for push in the page\'s names too, and hears new tokens', async () => {
    const { scope, requests, answer, receive } = await runtime()
    expect(scope.craft.registerPush).toBe(scope.craft.push.register)
    const status = scope.craft.permissions.check('notifications')
    answer(requests().at(-1)!, 'granted')
    expect(await status).toBe('granted')
    expect(await scope.craft.permissions.check('camera')).toBe('undetermined')
    const token = scope.craft.push.register()
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Push', method: 'register' })
    answer(requests().at(-1)!, 'abc123')
    expect(await token).toBe('abc123')

    const heard: string[] = []
    scope.craft.push.onToken((next: string) => heard.push(`craft:${next}`))
    scope.addEventListener('craftPushToken', (event: { detail: { token: string } }) => heard.push(`event:${event.detail.token}`))
    receive({ type: 'PUSH_TOKEN', payload: { token: 'def456' } })
    expect(heard).toEqual(['craft:def456', 'event:def456'])
  })

  it('opens links and shares, the share sheet untimed', async () => {
    const { scope, requests, answer } = await runtime()
    const opened = scope.craft.linking.openURL('webcal://hq.training/calendar.ics')
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Linking', method: 'openURL', args: ['webcal://hq.training/calendar.ics'] })
    answer(requests().at(-1)!, true)
    expect(await opened).toBe(true)
    expect(scope.craft.openURL).toBe(scope.craft.linking.openURL)

    const shared = scope.craft.share({ title: 'HQ', url: 'https://hq.training/chris' })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Share', method: 'share', args: [{ title: 'HQ', url: 'https://hq.training/chris' }] })
    await new Promise(resolve => setTimeout(resolve, 1100))
    answer(requests().at(-1)!, false)
    expect(await shared).toBe(false)
    expect(typeof scope.craft.share.share).toBe('function')
  })
})

describe('a workout player\'s services, in the page\'s names', () => {
  it('keeps the screen awake, dims it and styles the status bar', async () => {
    const { scope, requests, answer } = await runtime()
    expect(scope.craft.capabilities).toMatchObject({ keepAwake: true, brightness: true, statusBar: true, geolocation: true })
    const awake = scope.craft.setKeepAwake(true)
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'KeepAwake', method: 'set', args: [true] })
    answer(requests().at(-1)!, true)
    expect(await awake).toBe(true)
    const level = scope.craft.getBrightness()
    answer(requests().at(-1)!, 0.7)
    expect(await level).toBe(0.7)
    const dimmed = scope.craft.setBrightness(0.3)
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Brightness', method: 'set', args: [0.3] })
    answer(requests().at(-1)!, 0.3)
    expect(await dimmed).toBe(0.3)
    const styled = scope.craft.statusBar.setStyle('light')
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'StatusBar', method: 'setStyle', args: ['light'] })
    answer(requests().at(-1)!, true)
    expect(await styled).toBe(true)
    const none = await runtime([])
    expect(none.scope.craft.setKeepAwake).toBeUndefined()
    expect(none.scope.craft.location).toBeUndefined()
  })

  it('watches and records GPS, with fixes from the host\'s page events', async () => {
    const { scope, requests, answer, receive } = await runtime()
    const fixes: unknown[] = []
    const id = scope.craft.location.watchPosition((fix: unknown) => fixes.push(fix), { enableHighAccuracy: true })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Location', method: 'watchPosition', args: [{ enableHighAccuracy: true }] })
    const watches = requests().length
    const second = scope.craft.location.watchPosition(() => {})
    expect(requests().length).toBe(watches)
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftLocationUpdate', detail: { latitude: 52.5, longitude: 13.4, timestamp: 1 } } })
    expect(fixes).toEqual([{ latitude: 52.5, longitude: 13.4, timestamp: 1 }])
    scope.craft.location.clearWatch(id)
    expect(requests().length).toBe(watches)
    scope.craft.location.clearWatch(second)
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Location', method: 'clearWatch' })

    const started = scope.craft.location.startRecording()
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Location', method: 'startRecording' })
    answer(requests().at(-1)!, { id: 'r1', active: true, paused: false, startedAt: 5 })
    expect(await started).toMatchObject({ id: 'r1', active: true })
    for (const method of ['pauseRecording', 'resumeRecording', 'getRecordingState', 'readRecording', 'stopRecording']) {
      const answered = scope.craft.location[method]()
      expect(requests().at(-1)!.payload).toMatchObject({ module: 'Location', method })
      answer(requests().at(-1)!, method === 'readRecording' ? [] : { id: 'r1' })
      await answered
    }

    let heard: unknown = null
    scope.addEventListener('craftLocationError', (event: { detail: unknown }) => { heard = event.detail })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftLocationError', detail: { message: 'denied' } } })
    expect(heard).toEqual({ message: 'denied' })
  })

  it('shows and steers the Music app in the page\'s names, its changes as page events', async () => {
    const { scope, requests, answer, receive } = await runtime([...ALL, 'music'])
    expect(scope.craft.capabilities.music).toBe(true)
    const asked = scope.craft.music.requestAuthorization()
    // A question to the person: never timed out.
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Music', method: 'requestAuthorization' })
    await new Promise(resolve => setTimeout(resolve, 1100))
    answer(requests().at(-1)!, 'authorized')
    expect(await asked).toBe('authorized')
    for (const [call, payload] of [
      [() => scope.craft.music.getNowPlaying(), { method: 'getNowPlaying' }],
      [() => scope.craft.music.togglePlayPause(), { method: 'control', args: [{ command: 'togglePlayPause' }] }],
      [() => scope.craft.music.skipToPrevious({ restartAfter: 3 }), { method: 'control', args: [{ command: 'skipToPrevious', restartAfter: 3 }] }],
      [() => scope.craft.music.observe(), { method: 'observe', args: [{ enabled: true }] }],
    ] as Array<[() => Promise<unknown>, Record<string, unknown>]>) {
      const answered = call()
      expect(requests().at(-1)!.payload).toMatchObject({ module: 'Music', ...payload })
      answer(requests().at(-1)!, true)
      await answered
    }
    let heard: unknown = null
    scope.addEventListener('craftMusicChange', (event: { detail: unknown }) => { heard = event.detail })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftMusicChange', detail: { title: 'Run', playing: true } } })
    expect(heard).toEqual({ title: 'Run', playing: true })
  })

  it('has no Music app where the host offers none', async () => {
    const { scope } = await runtime()
    expect(scope.craft.music).toBeUndefined()
  })
})

describe('responses read as they arrive', () => {
  const head = { url: 'https://hq.training/api/messages/events', status: 200, statusText: 'OK', redirected: false, headers: { 'content-type': 'text/event-stream' } }

  it('streams an event-stream fetch through Network.stream, piece by piece', async () => {
    const { scope, requests, answer, receive } = await runtime()
    const pending = scope.fetch('https://hq.training/api/messages/events', { headers: { Accept: 'text/event-stream', Authorization: 'Bearer t' } })
    const open = requests().at(-1)!
    expect(open.payload).toMatchObject({ module: 'Network', method: 'stream', args: [{ id: 'stream-1', url: 'https://hq.training/api/messages/events', method: 'GET', headers: { accept: 'text/event-stream', authorization: 'Bearer t' }, body: null }] })
    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', chunk: 'data: {"a":1}\n' } })
    answer(open, head)
    const response = await pending
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    expect(decoder.decode((await reader.read()).value)).toBe('data: {"a":1}\n')
    const next = reader.read()
    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', chunk: '\nđ' } })
    expect(decoder.decode((await next).value)).toBe('\nđ')
    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', done: true } })
    expect((await reader.read()).done).toBe(true)
  })

  it('cancels the host stream when the reader or the signal stops', async () => {
    const { scope, requests, answer } = await runtime()
    const controller = new scope.AbortController()
    const pending = scope.fetch('https://hq.training/api/messages/events', { headers: { accept: 'text/event-stream' }, signal: controller.signal })
    answer(requests().at(-1)!, head)
    const reader = (await pending).body.getReader()
    const waiting = reader.read()
    controller.abort()
    expect((await waiting).done).toBe(true)
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Network', method: 'cancelStream', args: ['stream-1'] })

    const early = new scope.AbortController()
    const second = scope.fetch('https://hq.training/api/messages/events', { headers: { accept: 'text/event-stream' }, signal: early.signal })
    early.abort()
    await expect(second).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('carries useBroadcastStream on a native screen', async () => {
    const { scope, requests, answer, receive } = await runtime()
    const frames: unknown[] = []
    let connected = 0
    const stream = useBroadcastStream({
      endpoint: 'https://hq.training/api/messages/events',
      request: (url, init) => scope.fetch(url, { ...init, headers: { ...(init?.headers as Record<string, string>), Authorization: 'Bearer t' } }),
      onMessage: frame => frames.push(frame),
      onConnected: () => { connected++ },
    })
    await tick()
    const open = requests().at(-1)!
    expect(open.payload.method).toBe('stream')
    answer(open, head)
    await tick()
    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', chunk: 'data: {"channel":"user.7","event":"message.created","data":{"id":1}}\n\n' } })
    await tick()
    expect(connected).toBe(1)
    expect(frames).toEqual([{ channel: 'user.7', event: 'message.created', data: { id: 1 } }])
    stream.close()
    await tick()
    expect(requests().some(request => request.payload.method === 'cancelStream')).toBe(true)
  })

  it('gives EventSource with headers, events by type, and reconnects', async () => {
    const { scope, requests, answer, receive } = await runtime()
    const source = new scope.EventSource('https://hq.training/api/messages/events', { headers: { Authorization: 'Bearer t' } })
    const seen: string[] = []
    source.onopen = () => seen.push('open')
    source.onmessage = (event: { data: string, lastEventId: string }) => seen.push(`message:${event.data}:${event.lastEventId}`)
    source.addEventListener('typing', (event: { data: string }) => seen.push(`typing:${event.data}`))
    await tick()
    const open = requests().at(-1)!
    expect(open.payload.args[0].headers).toMatchObject({ authorization: 'Bearer t', accept: 'text/event-stream' })
    answer(open, head)
    await tick()
    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', chunk: 'retry: 5\n: ping\nid: 9\ndata: one\ndata: two\n\nevent: typing\ndata: ava\r\n\r\n' } })
    await tick()
    expect(source.readyState).toBe(1)
    expect(seen).toEqual(['open', 'message:one\ntwo:9', 'typing:ava'])

    receive({ type: 'NETWORK_STREAM', payload: { id: 'stream-1', error: 'The network connection was lost.' } })
    await tick()
    expect(source.readyState).toBe(0)
    await new Promise(resolve => setTimeout(resolve, 20))
    const again = requests().at(-1)!
    expect(again.payload.args[0]).toMatchObject({ id: 'stream-2' })
    expect(again.payload.args[0].headers['last-event-id']).toBe('9')
    source.close()
    expect(source.readyState).toBe(2)
  })
})
