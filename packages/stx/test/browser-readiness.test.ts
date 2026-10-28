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
  await expect(prepareTestBrowser({ createServer: () => server, createView: fixture.createView, startupTimeoutMs: 20 })).rejects.toThrow('Browser startup readiness failed: Browser navigation timed out')
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
