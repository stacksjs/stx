import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { location } from '../src/location'
import { findCall, installMockBridge } from './_mock-bridge'

describe('location (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['location'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('requestPermission forwards mode and returns status', async () => {
    bridge.whenCalled('location', 'requestPermission', 'authorizedWhenInUse')
    expect(await location.requestPermission('whenInUse')).toBe('authorizedWhenInUse')
    expect(findCall(bridge.calls, 'location', 'requestPermission')!.args).toEqual(['whenInUse'])
  })

  it('requestPermission defaults to whenInUse', async () => {
    bridge.whenCalled('location', 'requestPermission', 'undetermined')
    await location.requestPermission()
    expect(findCall(bridge.calls, 'location', 'requestPermission')!.args).toEqual(['whenInUse'])
  })

  it('getAuthorization returns status string', async () => {
    bridge.whenCalled('location', 'getAuthorization', 'authorizedAlways')
    expect(await location.getAuthorization()).toBe('authorizedAlways')
  })

  it('getCurrentLocation forwards', async () => {
    bridge.whenCalled('location', 'getCurrentLocation', { requested: true })
    const r = await location.getCurrentLocation()
    expect(r.requested).toBe(true)
  })

  it('startWatching with mode + distanceFilter', async () => {
    bridge.whenCalled('location', 'startWatching', true)
    expect(await location.startWatching({ mode: 'continuous', distanceFilter: 10 })).toBe(true)
  })

  it('stopWatching forwards', async () => {
    await location.stopWatching()
    expect(findCall(bridge.calls, 'location', 'stopWatching')).toBeDefined()
  })

  it('onUpdate fires on craft:location:update', () => {
    let received: any = null
    const off = location.onUpdate((loc) => { received = loc })
    window.dispatchEvent(new CustomEvent('craft:location:update', {
      detail: { latitude: 37.78, longitude: -122.4 },
    }))
    expect(received.latitude).toBe(37.78)
    off()
  })

  it('onError fires on craft:location:error', () => {
    let err: any = null
    const off = location.onError((e) => { err = e })
    window.dispatchEvent(new CustomEvent('craft:location:error', {
      detail: { message: 'denied' },
    }))
    expect(err.message).toBe('denied')
    off()
  })

  it('onAuthChanged fires on craft:location:authChanged', () => {
    let info: any = null
    const off = location.onAuthChanged((i) => { info = i })
    window.dispatchEvent(new CustomEvent('craft:location:authChanged', {
      detail: { status: 'authorizedAlways' },
    }))
    expect(info.status).toBe('authorizedAlways')
    off()
  })
})

describe('location (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('getAuthorization returns "unknown"', async () => {
    expect(await location.getAuthorization()).toBe('unknown')
  })

  it('startWatching falls back gracefully when navigator.geolocation missing', async () => {
    // Whether very-happy-dom exposes navigator.geolocation varies; the
    // call should resolve with a boolean either way.
    const r = await location.startWatching()
    expect(typeof r).toBe('boolean')
  })
})
