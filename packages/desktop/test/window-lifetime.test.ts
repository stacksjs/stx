/* eslint-disable import/first */
/**
 * `CraftApp.show()` returns one promise for two different events: it rejects
 * when the process could not start, and it resolves when the process exits.
 *
 * Awaiting it therefore did not mean "the window is open" — it meant "the
 * window has been closed again". `createWindow` did not return a
 * `WindowInstance` until the user quit, which made the return value useless
 * for the thing it exists for. And because the host had no close signal at
 * all, an app that starts a server before opening its window could never
 * learn that the window went away.
 */
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

/** Resolved by the test to simulate the window closing. */
let closeWindow: () => void = () => {}
/** Rejected by the test to simulate a launch failure. */
let failLaunch: (error: Error) => void = () => {}
let showCalls = 0

mock.module('craft-native', () => ({
  createApp: () => ({
    show: () => {
      showCalls++
      return new Promise((resolve, reject) => {
        closeWindow = () => resolve(undefined)
        failLaunch = reject
      })
    },
    close: () => closeWindow(),
  }),
}))

mock.module('node:child_process', () => ({
  spawn: () => ({ on: () => {}, kill: () => {}, unref: () => {} }),
}))

import { createWindow } from '../src/window'

describe('createWindow returns while the window is still open', () => {
  let logSpy: ReturnType<typeof spyOn>
  let errorSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    showCalls = 0
    logSpy = spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('resolves without waiting for the window to close', async () => {
    // `show()` here never settles on its own. Before the fix this await
    // hung until the test timed out.
    const window = await createWindow('http://localhost:3000')

    expect(window).not.toBeNull()
    expect(showCalls).toBe(1)
    expect(typeof window!.close).toBe('function')
  })

  it('notifies onClosed subscribers when the window goes away', async () => {
    const window = await createWindow('http://localhost:3000')

    let closed = 0
    window!.onClosed(() => { closed++ })
    expect(closed).toBe(0)

    closeWindow()
    // The close travels through a promise callback, so let it land.
    await Promise.resolve()
    await Promise.resolve()

    expect(closed).toBe(1)
  })

  it('fires only once, however many times the window is closed', async () => {
    const window = await createWindow('http://localhost:3000')

    let closed = 0
    window!.onClosed(() => { closed++ })

    closeWindow()
    await Promise.resolve()
    await Promise.resolve()
    window!.close()

    expect(closed).toBe(1)
  })

  it('lets a subscriber unsubscribe', async () => {
    const window = await createWindow('http://localhost:3000')

    let closed = 0
    const off = window!.onClosed(() => { closed++ })
    off()

    closeWindow()
    await Promise.resolve()
    await Promise.resolve()

    expect(closed).toBe(0)
  })

  it('still fires for a subscriber that arrives after the close', async () => {
    const window = await createWindow('http://localhost:3000')
    closeWindow()
    await Promise.resolve()
    await Promise.resolve()

    let closed = 0
    window!.onClosed(() => { closed++ })
    // Late subscribers are called on a microtask, so the ordering a caller
    // observes does not depend on how quickly it subscribed.
    await Promise.resolve()

    expect(closed).toBe(1)
  })

  it('reports a close initiated by the app itself', async () => {
    const window = await createWindow('http://localhost:3000')

    let closed = 0
    window!.onClosed(() => { closed++ })
    window!.close()

    expect(closed).toBe(1)
  })
})

describe('a launch failure is still a launch failure', () => {
  let logSpy: ReturnType<typeof spyOn>
  let errorSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('falls back to the binary when show() rejects immediately', async () => {
    // The distinction between "never started" and "closed later" is *when*
    // the promise settles — nothing in its value says which happened. A
    // rejection inside the grace period has to still reach the fallback, or
    // a machine without craft-native's binary gets a silent no-op instead of
    // the guidance message.
    const pending = createWindow('http://localhost:3000')
    failLaunch(new Error('craft binary not found'))

    const window = await pending
    // The fallback spawns the binary directly and yields a usable instance.
    expect(window).not.toBeNull()
  })
})
