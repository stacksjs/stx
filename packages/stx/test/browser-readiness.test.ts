import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { createBrowserFixture } from '../test-utils/browser-fixture'
import { prepareTestBrowser } from '../test-utils/browser-readiness'

function resources() {
  const calls: string[] = []
  const server = { url: new URL('http://127.0.0.1:12345'), stop() { calls.push('stop') } }
  const view = {
    async navigate(url: string) { calls.push(`navigate:${url}`) },
    async evaluate(): Promise<unknown> { calls.push('evaluate'); return true },
    close() { calls.push('close') },
  }
  return { calls, server, view, createServer: () => server, createView: () => view }
}

it('qualifies a rendered document once and releases the probe before returning', async () => {
  const fixture = resources()
  await prepareTestBrowser(fixture)
  expect(fixture.calls).toEqual(['navigate:http://127.0.0.1:12345/', 'evaluate', 'close', 'stop'])
})

it('waits for startup before qualifying the page, without issuing another navigation', async () => {
  const fixture = resources()
  const navigation = Promise.withResolvers<void>()
  fixture.view.navigate = async () => { fixture.calls.push('navigate'); await navigation.promise }
  const startup = prepareTestBrowser(fixture)
  await Promise.resolve()
  expect(fixture.calls).toEqual(['navigate'])
  navigation.resolve()
  await startup
  expect(fixture.calls).toEqual(['navigate', 'evaluate', 'close', 'stop'])
})

it('fails startup if the browser returns a wrong document instead of retrying or passing', async () => {
  const fixture = resources()
  fixture.view.evaluate = async () => { fixture.calls.push('evaluate'); return false }
  await expect(prepareTestBrowser(fixture)).rejects.toThrow('did not render the readiness document')
  expect(fixture.calls).toEqual(['navigate:http://127.0.0.1:12345/', 'evaluate', 'close', 'stop'])
})

it('bounds a stuck startup and stops its actual HTTP listener', async () => {
  const fixture = resources()
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response('ready') })
  fixture.view.navigate = () => new Promise(() => {})
  // The budget is one number for the whole startup, counted from before the
  // server and the view are made. At 20ms a loaded machine spent it on that
  // setup and never entered navigation, so this asserted one correct bound
  // and got the other -- "exceeded its 20ms budget before navigation" -- and
  // failed for a reason that has nothing to do with a stuck navigation.
  // 200ms is still a bound no real startup meets and leaves the hang below
  // as the only thing that can expire it.
  await expect(prepareTestBrowser({ createServer: () => server, createView: fixture.createView, startupTimeoutMs: 200 })).rejects.toThrow('Browser startup readiness failed: Browser navigation timed out')
  expect(fixture.calls).toEqual(['close'])
  await expect(fetch(server.url)).rejects.toThrow()
}, 1000)

it('preserves a native startup error and cleans up without retrying', async () => {
  const fixture = resources()
  const native = new Error('Chrome failed to start')
  fixture.view.navigate = async () => { fixture.calls.push('navigate'); throw native }
  try {
    await prepareTestBrowser(fixture)
    throw new Error('Startup unexpectedly passed')
  }
  catch (error) { expect((error as Error).cause).toBe(native) }
  expect(fixture.calls).toEqual(['navigate', 'close', 'stop'])
})

it('does not let the readiness evaluation outlive the single startup budget', async () => {
  const fixture = resources()
  fixture.view.evaluate = () => new Promise(() => {})
  await expect(prepareTestBrowser({ ...fixture, startupTimeoutMs: 20 })).rejects.toThrow('Browser startup readiness failed: Browser evaluation timed out')
  expect(fixture.calls).toEqual(['navigate:http://127.0.0.1:12345/', 'close', 'stop'])
}, 1000)

it('cleans up a failed browser constructor before any test runs', async () => {
  const fixture = resources()
  await expect(prepareTestBrowser({ createServer: fixture.createServer, createView() { throw new Error('No browser') } })).rejects.toThrow('No browser')
  expect(fixture.calls).toEqual(['stop'])
})

it('does not change the deadline of a later page navigation', async () => {
  const fixture = resources()
  await prepareTestBrowser(fixture)
  fixture.calls.length = 0
  fixture.view.navigate = () => new Promise(() => {})
  const page = createBrowserFixture({ ...fixture, navigationTimeoutMs: 20 })
  await expect(page.view.navigate(page.url)).rejects.toThrow('Browser navigation timed out after 20ms')
  expect(fixture.calls).toEqual(['close', 'stop'])
}, 1000)

it('qualifies the browser before every CI/release process that runs browser cases', async () => {
  const root = join(import.meta.dir, '../../..')
  const ci = await Bun.file(join(root, '.github/workflows/ci.yml')).text()
  const release = await Bun.file(join(root, '.github/workflows/release.yml')).text()
  expect(ci).toContain('bun test --preload ./scripts/browser-test-preload.ts packages examples --max-concurrency=1')
  expect(ci).toContain('bun test --preload ../../scripts/browser-test-preload.ts --coverage')
  expect(ci).toContain('bun test --preload ../../scripts/browser-test-preload.ts test/integration/')
  expect(release).toContain('bun test --preload ./scripts/browser-test-preload.ts packages examples --max-concurrency=1')
})

/**
 * A stalled startup has to say WHICH phase stalled, because the two have
 * different causes and the message is all CI leaves behind.
 *
 * stacksjs/stx#2160 stalled for the whole 25s budget on Ubuntu and the log
 * could not say why: Chrome's stderr was discarded and nothing recorded how
 * far the probe got. Measured locally, a cold `navigate` spends ~7s of ~7.5s
 * launching Chrome before it asks for the document, then ~0.14s being served
 * it -- so whether a loopback request arrived at all separates "Chrome never
 * started" from "the document was served and the navigation never settled".
 */
it('names the launch phase when a stall never reached the readiness server', async () => {
  // A view that never fetches: the default counting server stays untouched.
  const createView = () => ({
    navigate: () => new Promise<void>(() => {}),
    evaluate: async () => true,
    close() {},
  })

  await expect(prepareTestBrowser({ createView, startupTimeoutMs: 20 }))
    .rejects
    .toThrow('no loopback request, so it stalled before the renderer asked for the document')
}, 1000)

it('names the post-fetch phase when the document was served before the stall', async () => {
  // A view that fetches the document the way a renderer would, then hangs.
  const createView = () => ({
    navigate: async (url: string) => { await fetch(url); return new Promise<void>(() => {}) },
    evaluate: async () => true,
    close() {},
  })

  const failure = await prepareTestBrowser({ createView, startupTimeoutMs: 200 }).catch((error: Error) => error)

  expect(failure.message).toContain('loopback requests: 1')
  expect(failure.message).toMatch(/first after \d+ms, so the document was served and the stall is later/)
}, 2000)
