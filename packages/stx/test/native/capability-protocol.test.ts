import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

async function generate(script: string = '', template: string = '<View><Text>Capabilities</Text></View>', minify?: boolean): Promise<string> {
  const root = createTempDir('stx-native-capabilities-')
  const file = path.join(root, 'Capabilities.stx')
  await Bun.write(file, `<script client>${script}</script>${template}`)
  return (await compileSharedScreenBundle(file, minify === undefined ? {} : { minify })).code
}

async function runtime(script: string = '', options: {
  timeout?: number
  initialAppState?: string
  timers?: boolean
  template?: string
  capabilities?: string[]
  minify?: boolean
} = {}) {
  const sent: Array<Record<string, any>> = []
  let callback: (message: string) => void = () => {}
  const scope: Record<string, any> = {
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: options.timeout ?? 100,
      initialAppState: options.initialAppState ?? 'active',
      capabilities: options.capabilities ?? ['storage', 'database', 'lifecycle', 'deepLinks', 'notifications'],
      onMessage: (receiver: typeof callback) => { callback = receiver },
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
  }
  if (options.timers !== false) {
    scope.setTimeout = setTimeout
    scope.clearTimeout = clearTimeout
  }
  vm.runInNewContext(await generate(script, options.template, options.minify), scope)
  await Promise.resolve()
  return { scope, sent, receive: (message: Record<string, any>) => callback(JSON.stringify(message)) }
}

describe('shared-runtime native capability protocol', () => {
  it.each([false, true])('gates passkeys and preserves untimed credential exchanges (minify=%s)', async (minify) => {
    const missing = await runtime('', { capabilities: [], minify })
    expect(missing.scope.craft.passkeys).toBeUndefined()
    expect(missing.scope.craft.capabilities.passkeys).toBe(false)
    expect(missing.sent.some(message => message.type === 'API_REQUEST')).toBe(false)
    const { scope, sent, receive } = await runtime('', { capabilities: ['passkeys'], timeout: 5, minify })
    expect(scope.craft.capabilities.passkeys).toBe(true)
    for (const supported of [false, true]) {
      const available = scope.craft.passkeys.isAvailable()
      const availability = sent.at(-1)!
      expect(availability.payload).toEqual({ version: 1, module: 'Passkeys', method: 'isAvailable', args: [] })
      receive({ type: 'API_RESPONSE', correlationId: availability.id, payload: { version: 1, requestId: availability.id, data: supported } })
      expect(await available).toBe(supported)
    }
    const registration = { id: '_-AA', rawId: '_-AA', type: 'public-key', response: { clientDataJSON: '_-BB', attestationObject: '_-CC' } }
    const assertion = { id: '_-AA', rawId: '_-AA', type: 'public-key', response: { clientDataJSON: '_-DD', authenticatorData: '_-EE', signature: '_-FF', userHandle: '' } }
    const exchanges = [
      { method: 'create', options: { challenge: '_-BB', user: { id: '_-CC', name: 'member@example.test' }, rpId: 'example.test' }, answer: registration },
      { method: 'get', options: { challenge: '_-DD', allowCredentials: [{ id: '_-AA' }], rpId: 'example.test' }, answer: assertion },
      { method: 'get', options: { challenge: '_-EE' }, answer: { ...assertion, response: { clientDataJSON: '_-DD', authenticatorData: '_-EE', signature: '_-FF' } } },
    ]
    for (const { method, options, answer } of exchanges) {
      const pending = scope.craft.passkeys[method](options)
      const call = sent.at(-1)!
      expect(call.payload).toEqual({ version: 1, module: 'Passkeys', method, args: [options], untimed: true })
      await Bun.sleep(20)
      expect(sent.some(message => message.type === 'API_CANCEL')).toBe(false)
      receive({ type: 'API_RESPONSE', correlationId: call.id, payload: { version: 1, requestId: call.id, data: answer } })
      expect(await pending).toEqual(answer)
    }
  }, 30_000)

  it.each([false, true])('preserves passkey host errors and cancellation (minify=%s)', async (minify) => {
    const { scope, sent, receive } = await runtime('', { capabilities: ['passkeys'], minify })
    for (const method of ['create', 'get']) {
      for (const code of ['CAPABILITY_DISABLED', 'UNAVAILABLE', 'INVALID_ARGUMENT', 'CANCELLED', 'PASSKEY_FAILED']) {
        const pending = scope.craft.passkeys[method]({ challenge: 'invalid' }).catch((error: unknown) => error)
        const call = sent.at(-1)!
        expect(call.payload).toMatchObject({ module: 'Passkeys', method })
        receive({ type: 'API_ERROR', correlationId: call.id, payload: { version: 1, requestId: call.id, code, message: `Host says ${code}` } })
        expect(await pending).toMatchObject({ code, message: `Host says ${code}` })
      }
    }
    const pending = scope.craft.passkeys.create({ challenge: '_-AA', user: { id: '_-BB', name: 'Member' } }).catch((error: unknown) => error)
    const call = sent.at(-1)!
    scope.__stxNativeUnmount()
    expect(await pending).toMatchObject({ code: 'CANCELLED' })
    expect(sent.filter(message => message.type === 'API_CANCEL')).toContainEqual(expect.objectContaining({ payload: { version: 1, requestId: call.id, reason: 'screen-closed' } }))
  }, 30_000)

  it('refuses pressure recording on old hosts and carries opt-in and recovery on supported hosts', async () => {
    const old = await runtime('', { capabilities: ['geolocation'], timers: false })
    expect(old.scope.craft.capabilities.locationRecordingBarometer).toBe(false)
    await expect(old.scope.craft.location.startRecording({ barometer: true })).rejects.toMatchObject({ code: 'UNSUPPORTED' })
    await expect(old.scope.craft.location.getRecordingState({ includeBarometerSamples: true })).rejects.toMatchObject({ code: 'UNSUPPORTED' })
    expect(old.sent.filter(message => message.type === 'API_REQUEST')).toHaveLength(0)
    const { scope, sent } = await runtime('', { capabilities: ['geolocation', 'locationRecordingBarometer', 'locationRecordingOwnership'], timers: false })
    expect(scope.craft.capabilities.locationRecordingBarometer).toBe(true)
    await expect(scope.craft.location.startRecording({ barometer: 'true' })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
    scope.craft.location.startRecording({ barometer: true })
    scope.craft.location.getRecordingState({ expectedId: 'trail-A', includeBarometerSamples: true })
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'Location', method: 'startRecording', args: [{ barometer: true }], untimed: true },
      { version: 1, module: 'Location', method: 'getRecordingState', args: [{ expectedId: 'trail-A', includeBarometerSamples: true }] },
    ])
  })

  it('exposes motion and barometer only when their distinct host capabilities are present', async () => {
    const missing = (await runtime('', { capabilities: [], timers: false })).scope.craft
    expect(missing.rawMotionSensors).toBeUndefined()
    expect(missing.barometer).toBeUndefined()
    expect(missing.capabilities.rawMotionSensors).toBe(false)
    expect(missing.capabilities.barometer).toBe(false)
    const { scope, sent } = await runtime('', { capabilities: ['rawMotionSensors', 'barometer'], timers: false })
    expect(scope.craft.capabilities.rawMotionSensors).toBe(true)
    expect(scope.craft.capabilities.barometer).toBe(true)
    scope.craft.rawMotionSensors.getAvailability()
    scope.craft.rawMotionSensors.start({ sensor: 'gyroscope', intervalMs: 20 })
    scope.craft.rawMotionSensors.stop('gyroscope')
    scope.craft.rawMotionSensors.stopAll()
    scope.craft.barometer.getAvailability()
    scope.craft.barometer.start()
    scope.craft.barometer.start({ intervalMs: 1000, background: true })
    scope.craft.barometer.stop()
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'MotionSensors', method: 'getAvailability', args: [] },
      { version: 1, module: 'MotionSensors', method: 'start', args: [{ sensor: 'gyroscope', intervalMs: 20 }] },
      { version: 1, module: 'MotionSensors', method: 'stop', args: ['gyroscope'] },
      { version: 1, module: 'MotionSensors', method: 'stopAll', args: [] },
      { version: 1, module: 'Barometer', method: 'getAvailability', args: [] },
      { version: 1, module: 'Barometer', method: 'start', args: [{}] },
      { version: 1, module: 'Barometer', method: 'start', args: [{ intervalMs: 1000, background: true }] },
      { version: 1, module: 'Barometer', method: 'stop', args: [] },
    ])
  })

  it('preserves sensor units, pressure and explicit gap events and releases each subscription', async () => {
    const { scope, receive } = await runtime('', { capabilities: ['rawMotionSensors', 'barometer'] })
    const motion: any[] = [], pressure: any[] = []
    const stopMotion = scope.craft.rawMotionSensors.onUpdate((value: any) => motion.push(value))
    const stopPressure = scope.craft.barometer.onUpdate((value: any) => pressure.push(value))
    const reading = { sensor: 'gyroscope', unit: 'rad/s', values: { x: 1, y: 2, z: 3 }, timestampMs: 100, accuracy: 3 }
    const sample = { state: 'sample', pressureHpa: 1000, relativeAltitudeMeters: 12, timestampMs: 100 }
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftRawMotionUpdate', detail: reading } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftBarometerUpdate', detail: sample } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftBarometerUpdate', detail: { state: 'stopped', reason: 'background' } } })
    expect(motion).toEqual([reading])
    expect(pressure).toEqual([sample, { state: 'stopped', reason: 'background' }])
    stopMotion()
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftRawMotionUpdate', detail: reading } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftBarometerUpdate', detail: sample } })
    expect(motion).toHaveLength(1)
    expect(pressure).toHaveLength(3)
    stopPressure()
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftBarometerUpdate', detail: sample } })
    expect(pressure).toHaveLength(3)
    expect(() => scope.craft.barometer.onUpdate('invalid')).toThrow('needs a function')
  })

  it('propagates sensor hardware and background failures without synthesizing a sample', async () => {
    const { scope, sent, receive } = await runtime('', { capabilities: ['barometer', 'rawMotionSensors'] })
    const failed = scope.craft.barometer.start({ background: true }).catch((error: any) => error)
    const call = sent.find(message => message.type === 'API_REQUEST')!
    receive({ type: 'API_ERROR', correlationId: call.id, payload: { version: 1, requestId: call.id, code: 'UNSUPPORTED', message: 'Background unsupported' } })
    expect((await failed).code).toBe('UNSUPPORTED')
    const missing = scope.craft.rawMotionSensors.start({ sensor: 'gyroscope' }).catch((error: any) => error)
    const next = sent.filter(message => message.type === 'API_REQUEST').at(-1)!
    receive({ type: 'API_ERROR', correlationId: next.id, payload: { version: 1, requestId: next.id, code: 'UNAVAILABLE', message: 'No sensor' } })
    expect((await missing).code).toBe('UNAVAILABLE')
  })

  it('publishes the platform and capability flags through the existing Craft shape', async () => {
    const { scope } = await runtime()
    expect(scope.craft.platform).toBe('ios')
    expect(scope.craft.capabilityProtocolVersion).toBe(1)
    expect(scope.craft.capabilities).toMatchObject({
      storage: true,
      localDatabase: true,
      lifecycle: true,
      deepLinks: true,
      localNotifications: true,
      camera: false,
      badge: false,
    })
  })

  it('reports native network paths, normalizes both connection names and releases listeners', async () => {
    expect((await runtime('', { capabilities: [], timers: false })).scope.craft.network).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { capabilities: ['network'] })
    expect(scope.craft.capabilities.network).toBe(true)
    const answer = scope.craft.network.getStatus()
    const call = sent.find(message => message.type === 'API_REQUEST')!
    expect(call.payload).toMatchObject({ module: 'Network', method: 'getStatus' })
    receive({ type: 'API_RESPONSE', correlationId: call.id, payload: { version: 1, requestId: call.id, data: { isConnected: true, type: 'wifi' } } })
    expect(await answer).toMatchObject({ connected: true, isConnected: true, isWifi: true })
    const changes: any[] = []
    const stop = scope.craft.network.onChange((value: any) => changes.push(value))
    receive({ type: 'CRAFT_EVENT', payload: { event: 'other', detail: { connected: true } } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftNetworkChange', detail: { isConnected: false, type: 'none' } } })
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftNetworkChange', detail: { connected: true, type: 'cellular' } } })
    expect(changes.map(value => [value.connected, value.isConnected, value.type])).toEqual([[false, false, 'none'], [true, true, 'cellular']])
    stop()
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftNetworkChange', detail: { connected: false } } })
    expect(changes).toHaveLength(2)
  })

  it('exposes the host-owned app badge module only when advertised', async () => {
    const { scope, sent } = await runtime('', { capabilities: ['badge'], timers: false })
    expect(scope.craft.capabilities.badge).toBe(true)
    expect(typeof scope.craft.badge?.set).toBe('function')
    expect(typeof scope.craft.badge?.clear).toBe('function')

    scope.craft.badge.set(3)
    scope.craft.badge.clear()
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'Badge', method: 'set', args: [3] },
      { version: 1, module: 'Badge', method: 'clear', args: [] },
    ])
  })

  it('exposes live workout lifecycle methods over the Health protocol', async () => {
    const { scope, sent } = await runtime('', { capabilities: ['health'], timers: false })
    expect(typeof scope.craft.health.startWorkout).toBe('function')
    expect(typeof scope.craft.health.pauseWorkout).toBe('function')
    expect(typeof scope.craft.health.resumeWorkout).toBe('function')
    expect(typeof scope.craft.health.endWorkout).toBe('function')
    expect(typeof scope.craft.health.onWorkout).toBe('function')

    scope.craft.health.startWorkout({ type: 'running', location: 'outdoor' })
    scope.craft.health.pauseWorkout()
    scope.craft.health.resumeWorkout()
    scope.craft.health.endWorkout()
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'Health', method: 'startWorkout', args: [{ type: 'running', location: 'outdoor' }] },
      { version: 1, module: 'Health', method: 'pauseWorkout', args: [] },
      { version: 1, module: 'Health', method: 'resumeWorkout', args: [] },
      { version: 1, module: 'Health', method: 'endWorkout', args: [] },
    ])
  })

  it('exposes the host-owned Wallet pass API only when advertised', async () => {
    const { scope, sent } = await runtime('', { capabilities: ['wallet'], timers: false })
    expect(scope.craft.capabilities.wallet).toBe(true)
    expect(typeof scope.craft.wallet?.isAvailable).toBe('function')
    expect(typeof scope.craft.wallet?.add).toBe('function')
    expect(typeof scope.craft.wallet?.has).toBe('function')

    scope.craft.wallet.isAvailable()
    scope.craft.wallet.add({ url: 'https://example.test/pass' })
    scope.craft.wallet.has('membership-42')
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'Wallet', method: 'isAvailable', args: [] },
      { version: 1, module: 'Wallet', method: 'add', args: [{ url: 'https://example.test/pass' }] },
      { version: 1, module: 'Wallet', method: 'has', args: ['membership-42'] },
    ])
  })

  it('exposes the existing Craft API shapes over versioned requests', async () => {
    const { scope, sent, receive } = await runtime()
    scope.craft.storage.get('theme')
    scope.craft.db.execute('BEGIN TRANSACTION')
    expect(scope.craft.lifecycle.getState()).toBe('active')
    scope.craft.deepLinks.getInitialURL()
    scope.craft.notifications.schedule({ id: 'wake', title: 'Wake up' })

    const requests = sent.filter(message => message.type === 'API_REQUEST')
    expect(requests.map(message => message.payload)).toEqual([
      { version: 1, module: 'Storage', method: 'get', args: ['theme'] },
      { version: 1, module: 'Database', method: 'execute', args: ['BEGIN TRANSACTION', []] },
      { version: 1, module: 'DeepLinks', method: 'getInitialURL', args: [] },
      { version: 1, module: 'Notifications', method: 'schedule', args: [{ id: 'wake', title: 'Wake up' }] },
    ])
    requests.forEach(request => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    }))
  })

  it('exposes typed secure storage and biometric APIs only through native capability requests', async () => {
    /*
     * No timers: this asserts what was SENT and never answers any of it.
     *
     * With timers on, each of the seven requests below leaves a promise that
     * rejects when the capability timeout elapses, and nothing is awaiting any
     * of them -- so seven unhandled rejections fired about 100ms later, inside
     * whichever test file happened to be running by then. The whole suite saw
     * it as five failures in cli.test.ts attributed to a line in this file,
     * and each file passed when run on its own.
     */
    const { scope, sent } = await runtime('', { capabilities: ['biometric', 'secureStorage'], timers: false })
    scope.craft.secureStorage.set('token', 'secret')
    scope.craft.secureStorage.get('token')
    scope.craft.secureStorage.delete('token')
    scope.craft.secureStorage.clear()
    scope.craft.biometrics.isAvailable()
    scope.craft.biometrics.getBiometricType()
    scope.craft.biometrics.authenticate('Unlock WildLoop')
    expect(scope.craft.capabilities).toMatchObject({ biometric: true, secureStorage: true })
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'SecureStorage', method: 'set', args: ['token', 'secret'] },
      { version: 1, module: 'SecureStorage', method: 'get', args: ['token'] },
      { version: 1, module: 'SecureStorage', method: 'remove', args: ['token'] },
      { version: 1, module: 'SecureStorage', method: 'clear', args: [] },
      { version: 1, module: 'Biometrics', method: 'isAvailable', args: [] },
      { version: 1, module: 'Biometrics', method: 'getBiometricType', args: [] },
      // Face ID waits on the person, so the host keeps no deadline for it either.
      { version: 1, module: 'Biometrics', method: 'authenticate', args: ['Unlock WildLoop'], untimed: true },
    ])
  })

  it('preserves synchronous lifecycle and legacy notification aliases', async () => {
    const { scope, sent, receive } = await runtime('', { initialAppState: 'background' })
    expect(scope.craft.getAppState()).toBe('background')
    expect(scope.craft.lifecycle.getState()).toBe('background')

    const states: string[] = []
    scope.craft.lifecycle.onStateChange((state: string) => states.push(state))
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    expect(states).toEqual(['active'])

    scope.craft.scheduleNotification({ id: 'legacy', title: 'Legacy' })
    scope.craft.cancelNotification('legacy')
    scope.craft.cancelAllNotifications()
    scope.craft.getPendingNotifications()
    expect(sent.slice(-4).map(message => [message.payload.module, message.payload.method])).toEqual([
      ['Notifications', 'schedule'],
      ['Notifications', 'cancel'],
      ['Notifications', 'cancelAll'],
      ['Notifications', 'pending'],
    ])
    sent.slice(-4).forEach(request => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    }))
  })

  it('does not deliver an initial link after getInitialURL claims it', async () => {
    const { scope, sent, receive } = await runtime()
    const links: string[] = []
    scope.craft.deepLinks.getInitialURL()
    scope.craft.deepLinks.onLink((link: { url: string }) => links.push(link.url))
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://launch', initial: true } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://later', initial: false } })
    expect(links).toEqual(['craft://later'])
    const request = sent.find(message => message.type === 'API_REQUEST')!
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    })
  })

  it('uses host responses when a bare JavaScript runtime has no timers', async () => {
    const { scope, sent, receive } = await runtime('', { timers: false })
    const read = scope.craft.storage.get('bare-runtime')
    const request = sent.at(-1)!
    expect(request.type).toBe('API_REQUEST')
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'works' },
    })
    expect(await read).toBe('works')
  })

  it('settles responses, dispatches subscriptions, and cancels timed-out work', async () => {
    const { scope, sent, receive } = await runtime('', { timeout: 5 })
    const states: string[] = []
    const links: string[] = []
    const removeState = scope.craft.lifecycle.onChange((state: string) => states.push(state))
    const removeLink = scope.craft.deepLinks.onLink((link: { url: string }) => links.push(link.url))
    receive({ type: 'APP_STATE', payload: { state: 'background' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/1', initial: false } })
    removeState()
    removeLink()
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/2', initial: false } })
    expect(states).toEqual(['background'])
    expect(links).toEqual(['craft://notes/1'])

    const read = scope.craft.storage.get('theme')
    const request = sent.at(-1)!
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'dark' },
    })
    expect(await read).toBe('dark')

    const timedOut = scope.craft.storage.get('missing')
    await expect(timedOut).rejects.toMatchObject({ code: 'TIMEOUT' })
    expect(sent.at(-1)).toMatchObject({
      type: 'API_CANCEL',
      payload: { version: 1, reason: 'timeout' },
    })
  })

  it('reads Apple Health in the page\'s shape, only when the app does', async () => {
    const without = await runtime()
    expect(without.scope.craft.health).toBeUndefined()
    expect(without.scope.craft.capabilities.health).toBe(false)

    const { scope, sent, receive } = await runtime('', { capabilities: ['health'] })
    expect(scope.craft.capabilities.health).toBe(true)
    const workouts = scope.craft.health.getWorkouts({ startDate: 1, endDate: 2, limit: 5 })
    scope.craft.health.getDailyStatistics('steps', { startDate: 1, endDate: 2 })
    scope.craft.health.getHeartRateSamples({ startDate: 1, endDate: 2 })
    scope.craft.health.getSamples('bloodGlucose', { startDate: 1, limit: 10 })
    scope.craft.health.getSleepIntervals()
    scope.craft.health.requestAuthorization(['workouts'], { write: false })
    scope.craft.health.saveMindfulSession({ id: 'hq-1', startDate: 1, endDate: 2 })
    scope.craft.health.getMindfulSessions({ startDate: 1 })
    scope.craft.health.startHeartRateUpdates({ since: 5 })
    scope.craft.health.stopHeartRateUpdates()
    const requests = sent.filter(message => message.type === 'API_REQUEST')
    expect(requests.map(message => [message.payload.method, message.payload.args])).toEqual([
      ['getWorkouts', [{ startDate: 1, endDate: 2, limit: 5 }]],
      ['getDailyStatistics', ['steps', { startDate: 1, endDate: 2 }]],
      ['getHeartRateSamples', [{ startDate: 1, endDate: 2 }]],
      ['getSamples', ['bloodGlucose', { startDate: 1, limit: 10 }]],
      ['getSleepIntervals', [{}]],
      ['requestAuthorization', [['workouts'], { write: false }]],
      ['saveMindfulSession', [{ id: 'hq-1', startDate: 1, endDate: 2 }]],
      ['getMindfulSessions', [{ startDate: 1 }]],
      ['startHeartRateUpdates', [{ since: 5 }]],
      ['stopHeartRateUpdates', [{}]],
    ])
    expect(requests.every(message => message.payload.module === 'Health')).toBe(true)
    requests.forEach((request, index) => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: index === 0 ? [{ id: 'w1' }] : [] },
    }))
    expect(await workouts).toEqual([{ id: 'w1' }])
  })

  it('asks a store that may be missing whether it can be used, only on hosts that say so', async () => {
    const apple = await runtime('', { capabilities: ['health'] })
    expect(apple.scope.craft.health.availability).toBeUndefined()
    expect(apple.scope.craft.health.openSettings).toBeUndefined()

    const { scope, sent, receive } = await runtime('', { capabilities: ['health', 'healthAvailability'] })
    const availability = scope.craft.health.availability()
    const granted = scope.craft.health.grantedTypes()
    const opened = scope.craft.health.openSettings()
    const requests = sent.filter(message => message.type === 'API_REQUEST')
    expect(requests.map(message => [message.payload.module, message.payload.method])).toEqual([
      ['Health', 'availability'],
      ['Health', 'grantedTypes'],
      ['Health', 'openSettings'],
    ])
    // Opening a screen waits on the person.
    expect(requests[2].payload.untimed).toBe(true)
    const answers = ['updateRequired', ['sleep', 7], 1]
    requests.forEach((request, index) => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: answers[index] },
    }))
    expect(await availability).toBe('updateRequired')
    expect(await granted).toEqual(['sleep'])
    expect(await opened).toBe(true)
  })

  it('never times out a sheet the person is reading', async () => {
    const { scope, sent, receive } = await runtime('', { timeout: 5, capabilities: ['health', 'biometric'] })
    const grant = scope.craft.health.requestAuthorization(['workouts'])
    const faceId = scope.craft.biometrics.authenticate('Unlock')
    const [grantRequest, faceRequest] = sent.filter(message => message.type === 'API_REQUEST')
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(sent.some(message => message.type === 'API_CANCEL')).toBe(false)
    receive({ type: 'API_RESPONSE', correlationId: grantRequest!.id, payload: { version: 1, requestId: grantRequest!.id, data: true } })
    receive({ type: 'API_RESPONSE', correlationId: faceRequest!.id, payload: { version: 1, requestId: faceRequest!.id, data: true } })
    expect(await grant).toBe(true)
    expect(await faceId).toBe(true)
    // A read still times out.
    await expect(scope.craft.health.getWorkouts()).rejects.toMatchObject({ code: 'TIMEOUT' })
  })

  it('asks with the system\'s dialogs when the app has them, never timing them out', async () => {
    expect((await runtime()).scope.craft.dialog).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { timeout: 5, capabilities: ['dialog'] })
    expect(scope.craft.capabilities.dialogs).toBe(true)
    const confirmed = scope.craft.dialog.confirm({ title: 'Delete?', destructive: true })
    const chosen = scope.craft.dialog.actionSheet({ actions: [{ id: 'a', title: 'A' }] })
    const [confirmRequest, sheetRequest] = sent.filter(message => message.type === 'API_REQUEST')
    expect(confirmRequest!.payload).toMatchObject({ module: 'Dialog', method: 'confirm', args: [{ title: 'Delete?', destructive: true }] })
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(sent.some(message => message.type === 'API_CANCEL')).toBe(false)
    receive({ type: 'API_RESPONSE', correlationId: confirmRequest!.id, payload: { version: 1, requestId: confirmRequest!.id, data: true } })
    receive({ type: 'API_RESPONSE', correlationId: sheetRequest!.id, payload: { version: 1, requestId: sheetRequest!.id, data: null } })
    expect(await confirmed).toBe(true)
    expect(await chosen).toBeNull()
  })

  it('signs in with Apple and opens the web sign-in sheet when the app can, untimed', async () => {
    const without = await runtime()
    expect(without.scope.craft.browser).toBeUndefined()
    expect(without.scope.craft.signInWithApple).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { timeout: 5, capabilities: ['browser', 'appleSignIn'] })
    expect(scope.craft.capabilities).toMatchObject({ browser: true, appleSignIn: true })
    const apple = scope.craft.signInWithApple({ nonce: 'abc' })
    const sheet = scope.craft.browser.open('https://example.com/auth', { mode: 'auth', callbackScheme: 'hq' })
    const [appleRequest, sheetRequest] = sent.filter(message => message.type === 'API_REQUEST')
    expect(appleRequest!.payload).toMatchObject({ module: 'Auth', method: 'signInWithApple', args: [{ nonce: 'abc' }] })
    expect(sheetRequest!.payload).toMatchObject({ module: 'Browser', method: 'open', args: ['https://example.com/auth', { mode: 'auth', callbackScheme: 'hq' }] })
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(sent.some(message => message.type === 'API_CANCEL')).toBe(false)
    receive({ type: 'API_RESPONSE', correlationId: appleRequest!.id, payload: { version: 1, requestId: appleRequest!.id, data: { userId: 'u1', authorizationCode: 'c' } } })
    receive({ type: 'API_RESPONSE', correlationId: sheetRequest!.id, payload: { version: 1, requestId: sheetRequest!.id, data: { cancelled: false, url: 'hq://done' } } })
    expect(await apple).toEqual({ userId: 'u1', authorizationCode: 'c' })
    expect(await sheet).toEqual({ cancelled: false, url: 'hq://done' })
  })

  it('gates pedometer support and preserves history units, permission lifetime and event kinds', async () => {
    expect((await runtime('', { capabilities: [] })).scope.craft.pedometer).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { capabilities: ['pedometer'], timeoutMs: 5 })
    const permission = scope.craft.pedometer.requestPermission()
    const prompt = sent.at(-1)!
    expect(prompt.payload).toMatchObject({ module: 'Pedometer', method: 'requestPermission', untimed: true })
    await Bun.sleep(20)
    expect(sent.some(m => m.type === 'API_CANCEL')).toBe(false)
    receive({ type: 'API_RESPONSE', correlationId: prompt.id, payload: { version: 1, requestId: prompt.id, data: 'granted' } })
    expect(await permission).toBe('granted')
    const query = scope.craft.pedometer.query({ startDate: 1000, endDate: 2000 })
    const request = sent.at(-1)!
    expect(request.payload.args).toEqual([{ startDate: 1000, endDate: 2000 }])
    const sample = { state: 'sample', kind: 'interval', startDate: 1000, endDate: 2000, steps: 2, cadenceStepsPerSecond: 1.5 }
    receive({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data: sample } })
    expect(await query).toEqual(sample)
    const events: unknown[] = []
    const unsubscribe = scope.craft.pedometer.onUpdate((event: unknown) => events.push(event))
    const counter = { state: 'sample', kind: 'counter', stepsSinceBoot: 200, timestampMs: 300 }
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftPedometerUpdate', detail: counter } })
    unsubscribe()
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftPedometerUpdate', detail: sample } })
    expect(events).toEqual([counter])
    const unsupported = scope.craft.pedometer.query({ startDate: 1 })
    const rejected = sent.at(-1)!
    receive({ type: 'API_ERROR', correlationId: rejected.id, payload: { version: 1, requestId: rejected.id, code: 'UNSUPPORTED', message: 'No interval history' } })
    await expect(unsupported).rejects.toMatchObject({ code: 'UNSUPPORTED' })
  })

  it('keeps durable HealthKit batches pending until the app explicitly acknowledges them', async () => {
    expect((await runtime('', { capabilities: [] })).scope.craft.healthBackground).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { capabilities: ['healthBackground'] })
    const pending = scope.craft.healthBackground.pending()
    const request = sent.at(-1)!
    expect(request.payload).toMatchObject({ module: 'HealthBackground', method: 'pending', args: [] })
    const batches = [{ id: 'batch-1', type: 'steps', samples: [{ id: 'sample-1', startDate: 1000, endDate: 2000, value: 20, unit: 'count' }], deleted: ['sample-0'] }]
    receive({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data: batches } })
    expect(await pending).toEqual(batches)
    expect(sent.some(m => m.payload?.method === 'acknowledge')).toBe(false)
    const ack = scope.craft.healthBackground.acknowledge(['batch-1'])
    const save = sent.at(-1)!
    expect(save.payload.args).toEqual([['batch-1']])
    receive({ type: 'API_ERROR', correlationId: save.id, payload: { version: 1, requestId: save.id, code: 'STORAGE_ERROR', message: 'Disk full' } })
    await expect(ack).rejects.toMatchObject({ code: 'STORAGE_ERROR' })
    const changed: unknown[] = []
    const stop = scope.craft.healthBackground.onChange((value: unknown) => changed.push(value))
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftHealthBackground', detail: { type: 'steps' } } })
    stop()
    receive({ type: 'CRAFT_EVENT', payload: { event: 'craftHealthBackground', detail: { type: 'sleep' } } })
    expect(changed).toEqual([{ type: 'steps' }])
  })

  it('keeps passive provider daily totals separate from the foreground pedometer', async () => {
    expect((await runtime('', { capabilities: ['pedometer'] })).scope.craft.pedometerPassive).toBeUndefined()
    const { scope, sent, receive } = await runtime('', { capabilities: ['pedometerPassive'] })
    expect(scope.craft.pedometer).toBeUndefined()
    const history = scope.craft.pedometerPassive.history()
    const request = sent.at(-1)!
    expect(request.payload).toMatchObject({ module: 'PedometerPassive', method: 'history', args: [] })
    const days = [{ kind: 'daily', source: 'healthServices', day: '2026-11-03', timeZone: 'UTC', startDate: 1000, endDate: 2000, steps: 20 }]
    receive({ type: 'API_RESPONSE', correlationId: request.id, payload: { version: 1, requestId: request.id, data: days } })
    expect(await history).toEqual(days)
    const start = scope.craft.pedometerPassive.start()
    const rejected = sent.at(-1)!
    receive({ type: 'API_ERROR', correlationId: rejected.id, payload: { version: 1, requestId: rejected.id, code: 'UNAVAILABLE', message: 'No Wear OS provider' } })
    await expect(start).rejects.toMatchObject({ code: 'UNAVAILABLE' })
  })

  it('names the phone in the user agent code shared with the page reads', async () => {
    const { scope } = await runtime()
    expect(scope.navigator.userAgent).toContain('iPhone')
    expect(scope.navigator.language).toBe('en')
  })

  it('re-renders lifecycle and deep-link subscription state', async () => {
    const { sent, receive } = await runtime(`
      const appState = state('active')
      const link = state('none')
      globalThis.craft.lifecycle.onStateChange(function(next) { appState.set(next) })
      globalThis.craft.deepLinks.onLink(function(next) { link.set(next.url) })
    `, { template: '<View><Text testID="state" :text="appState" /><Text testID="link" :text="link" /></View>' })
    sent.length = 0
    receive({ type: 'APP_STATE', payload: { state: 'background' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/1', initial: false } })
    await Bun.sleep(0)
    const updates = sent.filter(message => message.type === 'MUTATE')
      .flatMap(message => message.payload.operations)
      .filter(operation => operation.op === 'updateNode')
    expect(updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ patch: expect.objectContaining({ children: ['background'] }) }),
      expect.objectContaining({ patch: expect.objectContaining({ children: ['craft://notes/1'] }) }),
    ]))
  })

  it('installs fetch only when the host advertises it', async () => {
    expect((await runtime('', { capabilities: ['storage'] })).scope.fetch).toBeUndefined()
    const { scope } = await runtime('', { capabilities: ['storage', 'fetch'] })
    expect(typeof scope.fetch).toBe('function')
    expect(scope.craft.capabilities.fetch).toBe(true)
  })

  it('sends fetch as one Network request and reads the answer like a Response', async () => {
    const { scope, sent, receive } = await runtime('', { capabilities: ['fetch'] })
    const answer = scope.fetch('http://localhost:3011/api/profile', {
      method: 'post',
      headers: { Authorization: 'Bearer abc', 'Content-Type': 'application/json' },
      body: '{"a":1}',
    })
    const request = sent.at(-1)!
    expect(request.payload).toEqual({
      version: 1,
      module: 'Network',
      method: 'fetch',
      args: [{
        url: 'http://localhost:3011/api/profile',
        method: 'POST',
        headers: { 'authorization': 'Bearer abc', 'content-type': 'application/json' },
        body: '{"a":1}',
      }],
    })
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: {
        version: 1,
        requestId: request.id,
        data: { url: 'http://localhost:3011/api/profile', status: 201, statusText: 'created', redirected: false, headers: { 'content-type': 'application/json' }, body: '{"name":"Ava"}' },
      },
    })
    const response = await answer
    expect(response.ok).toBe(true)
    expect(response.status).toBe(201)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('missing')).toBeNull()
    expect(await response.json()).toEqual({ name: 'Ava' })
    expect(response.bodyUsed).toBe(true)
    await expect(response.text()).rejects.toThrow('already been consumed')

    const missing = scope.fetch('http://localhost:3011/api/nope')
    const second = sent.at(-1)!
    expect(second.payload.args[0]).toEqual({ url: 'http://localhost:3011/api/nope', method: 'GET', headers: {}, body: null })
    receive({
      type: 'API_RESPONSE',
      correlationId: second.id,
      payload: { version: 1, requestId: second.id, data: { status: 404, statusText: 'not found', headers: {}, body: 'Not found' } },
    })
    const notFound = await missing
    expect(notFound.ok).toBe(false)
    expect(await notFound.text()).toBe('Not found')
  })

  it('rejects bodies the host cannot send and turns transport failures into TypeErrors', async () => {
    const { scope, sent, receive } = await runtime('', { capabilities: ['fetch'] })
    const before = sent.length
    await expect(scope.fetch('https://example.com', { body: 'x' })).rejects.toThrow('cannot have a body')
    await expect(scope.fetch('https://example.com', { method: 'POST', body: { a: 1 } })).rejects.toThrow('string bodies only')
    expect(sent.length).toBe(before)

    const offline = scope.fetch('https://example.com')
    const request = sent.at(-1)!
    receive({
      type: 'API_ERROR',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, code: 'NETWORK_ERROR', message: 'The Internet connection appears to be offline.' },
    })
    const failure = await offline.catch((error: Error & { code?: string }) => error)
    expect(failure.name).toBe('TypeError')
    expect(failure.code).toBe('NETWORK_ERROR')
  })

  it('re-renders once top-level async work has used a capability answer', async () => {
    const { sent, receive } = await runtime(`
      const name = state('loading')
      globalThis.fetch('https://example.com/me').then(function(r) { return r.json() }).then(function(me) { name.set(me.name) })
    `, { capabilities: ['fetch'], template: '<View><Text testID="name" :text="name" /></View>' })
    const request = sent.find(message => message.type === 'API_REQUEST')!
    sent.length = 0
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: { status: 200, headers: {}, body: '{"name":"Ava"}' } },
    })
    await new Promise(resolve => setTimeout(resolve, 5))
    const updates = sent.filter(message => message.type === 'MUTATE')
      .flatMap(message => message.payload.operations)
      .filter(operation => operation.op === 'updateNode')
    expect(updates).toEqual([expect.objectContaining({ patch: { children: ['Ava'] } })])
  })
})
