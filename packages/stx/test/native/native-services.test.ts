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

  it('reads a heart-rate strap in the page\'s names, its readings as page events', async () => {
    const { scope, requests, answer, receive } = await runtime([...ALL, 'heartRate'])
    expect(scope.craft.capabilities.heartRate).toBe(true)
    // Scanning and connecting can show the Bluetooth prompt: never timed out.
    for (const [call, payload] of [
      [() => scope.craft.heartRate.scan({ timeout: 10 }), { method: 'scan', args: [{ timeout: 10 }] }],
      [() => scope.craft.heartRate.connect('A1B2'), { method: 'connect', args: [{ id: 'A1B2' }] }],
      [() => scope.craft.heartRate.connect({ id: 'A1B2' }), { method: 'connect', args: [{ id: 'A1B2' }] }],
      [() => scope.craft.heartRate.requestAuthorization(), { method: 'requestAuthorization' }],
    ] as Array<[() => Promise<unknown>, Record<string, unknown>]>) {
      const asked = call()
      expect(requests().at(-1)!.payload).toMatchObject({ module: 'HeartRate', ...payload })
      await new Promise(resolve => setTimeout(resolve, 1100))
      answer(requests().at(-1)!, { connection: 'connected' })
      expect(await asked).toEqual({ connection: 'connected' })
    }
    for (const [call, payload] of [
      [() => scope.craft.heartRate.getState(), { method: 'getState', args: [{}] }],
      [() => scope.craft.heartRate.reconnect(), { method: 'reconnect' }],
      [() => scope.craft.heartRate.disconnect({ forget: true }), { method: 'disconnect', args: [{ forget: true }] }],
      [() => scope.craft.heartRate.startRecording(), { method: 'startRecording' }],
      [() => scope.craft.heartRate.pauseRecording(), { method: 'pauseRecording' }],
      [() => scope.craft.heartRate.resumeRecording(), { method: 'resumeRecording' }],
      [() => scope.craft.heartRate.readRecording({ since: 5 }), { method: 'readRecording', args: [{ since: 5 }] }],
      [() => scope.craft.heartRate.stopRecording(), { method: 'stopRecording' }],
      [() => scope.craft.heartRate.getRecordingState(), { method: 'getRecordingState' }],
      [() => scope.craft.heartRate.getDevices(), { method: 'getDevices' }],
      [() => scope.craft.heartRate.stopScan(), { method: 'stopScan' }],
    ] as Array<[() => Promise<unknown>, Record<string, unknown>]>) {
      const answered = call()
      expect(requests().at(-1)!.payload).toMatchObject({ module: 'HeartRate', ...payload })
      answer(requests().at(-1)!, true)
      await answered
    }
    let heard: unknown = null
    scope.addEventListener('craftHeartRate', (event: { detail: unknown }) => { heard = event.detail })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftHeartRate', detail: { type: 'reading', bpm: 148, rrIntervals: [405.3] } } })
    expect(heard).toEqual({ type: 'reading', bpm: 148, rrIntervals: [405.3] })
  })

  it('has no heart-rate strap where the host offers none', async () => {
    const { scope } = await runtime()
    expect(scope.craft.heartRate).toBeUndefined()
    expect(scope.craft.capabilities.heartRate).toBe(false)
  })

  it('schedules workouts onto the Apple Watch in the page\'s names', async () => {
    const { scope, requests, answer } = await runtime([...ALL, 'scheduledWorkouts'])
    expect(scope.craft.capabilities.scheduledWorkouts).toBe(true)
    // Asking to schedule shows iOS's prompt: never timed out.
    const asked = scope.craft.scheduledWorkouts.requestAuthorization()
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'ScheduledWorkouts', method: 'requestAuthorization' })
    await new Promise(resolve => setTimeout(resolve, 1100))
    answer(requests().at(-1)!, 'authorized')
    expect(await asked).toBe('authorized')
    const plan = { id: '6f1c2b8e-5a7d-4c3e-9b1a-2d4e6f8a0b1c', date: '2026-10-20', workout: { activity: 'running', location: 'outdoor', displayName: 'Easy', blocks: [] } }
    for (const [call, payload, data] of [
      [() => scope.craft.scheduledWorkouts.isSupported(), { method: 'isSupported', args: [{}] }, true],
      [() => scope.craft.scheduledWorkouts.authorization(), { method: 'authorization', args: [{}] }, 'authorized'],
      [() => scope.craft.scheduledWorkouts.list(), { method: 'list', args: [{}] }, [{ id: plan.id, date: plan.date, hour: 7, minute: 0, complete: false }]],
      [() => scope.craft.scheduledWorkouts.schedule(plan), { method: 'schedule', args: [plan] }, { id: plan.id }],
      [() => scope.craft.scheduledWorkouts.remove(plan.id), { method: 'remove', args: [{ id: plan.id }] }, true],
      [() => scope.craft.scheduledWorkouts.remove({ id: plan.id }), { method: 'remove', args: [{ id: plan.id }] }, false],
      [() => scope.craft.scheduledWorkouts.removeAll(), { method: 'removeAll', args: [{}] }, 2],
    ] as Array<[() => Promise<unknown>, Record<string, unknown>, unknown]>) {
      const answered = call()
      expect(requests().at(-1)!.payload).toMatchObject({ module: 'ScheduledWorkouts', ...payload })
      answer(requests().at(-1)!, data)
      expect(await answered).toEqual(data)
    }
    await expect(scope.craft.scheduledWorkouts.schedule(null)).rejects.toThrow('needs a plan')
  })

  it('has no watch scheduling where the host offers none', async () => {
    const { scope } = await runtime()
    expect(scope.craft.scheduledWorkouts).toBeUndefined()
    expect(scope.craft.capabilities.scheduledWorkouts).toBe(false)
  })
})

describe('files: a picked photo, a download, a form', () => {
  const photo = { path: '/tmp/craft-files/A1/IMG_1234.jpg', name: 'IMG_1234.jpg', type: 'image/jpeg', size: 312004, width: 2048, height: 1536 }

  it('picks a photo untimed, here and at the host, and answers null when the picker was closed', async () => {
    const { scope, requests, answer } = await runtime([...ALL, 'files'])
    expect(scope.craft.capabilities.files).toBe(true)
    expect(scope.craft.capabilities.camera).toBe(false)
    const picked = scope.craft.files.pickImage({ maxPixels: 1600 })
    const ask = requests().at(-1)!
    expect(ask.payload).toEqual({ version: 1, module: 'Files', method: 'pickImage', args: [{ source: 'library', maxPixels: 1600 }], untimed: true })
    // Longer than any deadline: a person is choosing.
    await new Promise(resolve => setTimeout(resolve, 1100))
    answer(ask, photo)
    expect(await picked).toEqual(photo)

    const closed = scope.craft.files.pickImage({ source: 'camera' })
    expect(requests().at(-1)!.payload.args).toEqual([{ source: 'camera' }])
    answer(requests().at(-1)!, null)
    expect(await closed).toBeNull()
  })

  it('downloads to a file with the screen\'s headers, and forgets it', async () => {
    const { scope, requests, answer } = await runtime([...ALL, 'files'])
    const fetched = scope.craft.files.download('https://hq.training/api/activities/9/gpx', { headers: { Authorization: 'Bearer t' } })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Files', method: 'download', args: ['https://hq.training/api/activities/9/gpx', { headers: { Authorization: 'Bearer t' } }] })
    expect(requests().at(-1)!.payload.untimed).toBeUndefined()
    const file = { ok: true, status: 200, path: '/tmp/craft-files/B2/long-run.gpx', name: 'long-run.gpx', type: 'application/gpx+xml', size: 812 }
    answer(requests().at(-1)!, file)
    expect(await fetched).toEqual(file)

    const removed = scope.craft.files.remove(file)
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Files', method: 'remove', args: [file.path] })
    answer(requests().at(-1)!, true)
    expect(await removed).toBe(true)
    await expect(scope.craft.files.download('')).rejects.toThrow('files.download needs a URL')
  })

  it('writes what the screen made as a file, and shares it as it is', async () => {
    const { scope, requests, answer } = await runtime([...ALL, 'files'])
    const written = scope.craft.files.write('health-data.csv', 'date,steps\n2026-10-12,9120\n', { type: 'text/csv' })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Files', method: 'write', args: ['health-data.csv', 'date,steps\n2026-10-12,9120\n', { encoding: 'utf8', type: 'text/csv' }] })
    const csv = { path: '/tmp/craft-files/C3/health-data.csv', name: 'health-data.csv', type: 'text/csv', size: 27 }
    answer(requests().at(-1)!, csv)
    expect(await written).toEqual(csv)

    void scope.craft.share({ files: [csv] })
    expect(requests().at(-1)!.payload).toMatchObject({ module: 'Share', method: 'share', args: [{ files: [csv] }], untimed: true })

    scope.craft.files.write('dot.png', 'iVBORw0KGgo=', { encoding: 'base64' }).catch(() => {})
    expect(requests().at(-1)!.payload.args[2]).toEqual({ encoding: 'base64' })
    await expect(scope.craft.files.write('', 'x')).rejects.toThrow('files.write needs a file name')
    await expect(scope.craft.files.write('x.txt', 42)).rejects.toThrow('files.write needs its contents as a string')
  })

  it('posts a FormData as parts the host sends as multipart, the file by its path', async () => {
    const { scope, requests, answer } = await runtime([...ALL, 'files'])
    const form = new scope.FormData()
    form.append('caption', 'Long run')
    form.append('photo', photo)
    form.append('photo', photo, 'cover.jpg')
    expect(form.get('caption')).toBe('Long run')
    expect(form.getAll('photo').map((file: { name: string }) => file.name)).toEqual(['IMG_1234.jpg', 'cover.jpg'])
    // A name given to append is the part's, not the picked file's.
    expect(photo.name).toBe('IMG_1234.jpg')
    form.set('photo', photo)
    expect([...form.keys()]).toEqual(['caption', 'photo'])
    expect(Object.prototype.toString.call(form)).toBe('[object FormData]')

    const sent = scope.fetch('https://hq.training/api/activities/9/photo', { method: 'POST', headers: { 'Authorization': 'Bearer t', 'Content-Type': 'application/json' }, body: form })
    const request = requests().at(-1)!
    expect(request.payload).toMatchObject({ module: 'Network', method: 'fetch' })
    expect(request.payload.args[0]).toEqual({
      url: 'https://hq.training/api/activities/9/photo',
      method: 'POST',
      // The host sets the content type, with its boundary.
      headers: { authorization: 'Bearer t' },
      body: null,
      form: [
        { name: 'caption', value: 'Long run' },
        { name: 'photo', path: photo.path, filename: 'IMG_1234.jpg', type: 'image/jpeg' },
      ],
    })
    answer(request, { status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' })
    expect(await (await sent).json()).toEqual({ ok: true })
    await expect(scope.fetch('https://hq.training/api/x', { method: 'GET', body: form })).rejects.toThrow('A GET or HEAD request cannot have a body')
  })

  it('has no files, no FormData and no form bodies where the host offers none', async () => {
    const { scope } = await runtime()
    expect(scope.craft.files).toBeUndefined()
    expect(scope.craft.capabilities.files).toBe(false)
    expect(scope.FormData).toBeUndefined()
  })

  it('says a person-facing request is untimed, and a plain one is not', async () => {
    const { scope, requests } = await runtime()
    void scope.craft.share({ title: 'HQ' })
    expect(requests().at(-1)!.payload.untimed).toBe(true)
    scope.craft.clipboard.read().catch(() => {})
    expect(requests().at(-1)!.payload.untimed).toBeUndefined()
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
