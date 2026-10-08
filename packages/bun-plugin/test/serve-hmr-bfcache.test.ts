/**
 * The HMR stream must not outlive the page that is showing it.
 *
 * Chrome keeps a page you navigate away from alive in the back/forward cache,
 * EventSource and all, and HTTP/1.1 gives a host six sockets. So in one tab,
 * a handful of ordinary page loads left six cached pages each holding a
 * `/_stx/hmr` stream, and the seventh page's own requests — its API calls,
 * its images — queued behind them forever: the page sat on its spinner with
 * nothing in the console. An app's browser tests hung on exactly that.
 *
 * The client now closes the stream on `pagehide` and reopens it when the page
 * is restored, and the server numbers its changes so a restored page that
 * missed one reloads instead of showing what it was cached with.
 *
 * The browser half runs against a real Chrome when one is installed — the
 * back/forward cache is the whole bug, and nothing else has one.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { freePort } from '../../stx/test-utils/test-port'

setDefaultTimeout(120_000)

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const CHROME = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(candidate => existsSync(candidate))

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null
/** Every HMR message seen since the test's own stream opened. */
const seen: any[] = []

function page(name: string, extra = ''): string {
  return `<main><h1>${name}${extra}</h1><a href="/a">a</a> <a href="/b">b</a></main>\n`
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-hmr-bfcache-'))
  for (const name of ['index', 'a', 'b', 'c'])
    await Bun.write(path.join(dir, 'views', `${name}.stx`), page(name))
  await Bun.write(path.join(dir, 'layouts', 'app.stx'), `<div>@yield('content')</div>\n`)
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default {}\n')
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, watch: true, layoutsDir: 'layouts', watchDirs: ['views'] })
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_ENV: 'development' } })

  const deadline = Date.now() + 45_000
  while (true) {
    try {
      await fetch(`${BASE}/definitely-not-a-page`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serve() did not start')
      await Bun.sleep(100)
    }
  }

  const stream = await fetch(`${BASE}/_stx/hmr`)
  const reader = stream.body!.getReader()
  void (async () => {
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data:')) continue
          try { seen.push(JSON.parse(line.slice(5))) }
          catch { /* keep-alive or partial chunk */ }
        }
      }
    }
    catch { /* stream closed with the server */ }
  })()

  await Bun.sleep(400)
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Edit a view and wait for the server to announce it. */
async function editAndAwait(file: string, contents: string): Promise<any> {
  const before = seen.length
  await writeFile(path.join(dir, file), contents)
  const deadline = Date.now() + 15_000
  while (!seen.slice(before).some(event => event.type !== 'connected' && event.type !== 'build-error') && Date.now() < deadline)
    await Bun.sleep(50)
  return seen.slice(before).find(event => event.type !== 'connected' && event.type !== 'build-error')
}

/**
 * Poll until `read` returns something truthy, or throw saying what did not
 * happen.
 *
 * It used to return the falsy value on timeout, which meant the timeout was
 * reported by whatever ran next rather than by the wait. A CI runner where
 * Chrome took longer than the deadline to open its debugging port failed with
 * ENOENT on a profile file two lines later - an error that says nothing about
 * Chrome, on a suite about bfcache. Naming the wait is the difference between
 * an hour of reading and a glance.
 */
async function waitFor<T>(what: string, read: () => Promise<T> | T, timeout = 10_000): Promise<T> {
  const started = Date.now()
  let value = await read()
  while (!value && Date.now() - started < timeout) {
    await Bun.sleep(100)
    value = await read()
  }
  if (!value)
    throw new Error(`timed out after ${Date.now() - started}ms waiting for ${what}`)
  return value
}

describe('the change counter', () => {
  it('opens every stream with where the server is', () => {
    expect(seen[0]).toEqual({ type: 'connected', version: 0 })
  })

  it('renders each page with the version it was built at', async () => {
    const html = await fetch(`${BASE}/a`).then(res => res.text())

    expect(html).toContain('var version=0,')
    expect(html).not.toContain('__STX_HMR_VERSION__')
  })

  it('numbers each change, and later pages and streams carry the new number', async () => {
    const event = await editAndAwait('views/c.stx', page('c', ' edited'))

    expect(event.version).toBe(1)
    expect(await fetch(`${BASE}/a`).then(res => res.text())).toContain('var version=1,')

    const stream = await fetch(`${BASE}/_stx/hmr`)
    const reader = stream.body!.getReader()
    const first = new TextDecoder().decode((await reader.read()).value)
    await reader.cancel()
    expect(first).toContain('{"type":"connected","version":1}')
  })

  it('lets go of the stream when the page is hidden and reopens it when the page is restored', async () => {
    const html = await fetch(`${BASE}/a`).then(res => res.text())

    expect(html).toContain(`addEventListener('pagehide'`)
    expect(html).toContain(`addEventListener('pageshow'`)
  })
})

interface Browser {
  evaluate: <T = any>(expression: string) => Promise<T>
  send: (method: string, params?: Record<string, any>) => Promise<any>
  close: () => Promise<void>
}

async function launchChrome(): Promise<Browser> {
  const profile = mkdtempSync(path.join(tmpdir(), 'stx-hmr-chrome-'))
  const chrome = Bun.spawn([CHROME!, '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdout: 'ignore', stderr: 'ignore' })
  const portFile = path.join(profile, 'DevToolsActivePort')

  /*
   * 60s, not 10. Chrome's first start on a shared CI runner - cold page cache,
   * a fresh profile directory to populate, and the rest of this suite's
   * servers competing for the box - has taken longer than ten seconds there
   * while taking well under one locally. That is a slow machine, not a broken
   * browser, and failing on it says nothing true about the code.
   */
  await waitFor(
    `Chrome to report a debugging port in ${portFile}`,
    () => existsSync(portFile) || (chrome.exitCode !== null ? Promise.reject(new Error(`Chrome exited with code ${chrome.exitCode} before opening a debugging port`)) : false),
    60_000,
  )
  const port = Number(readFileSync(portFile, 'utf8').split('\n')[0])
  const targets = await waitFor(`a Chrome page target on port ${port}`, async () => {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(res => res.json()).catch(() => []) as any[]
    return list.length ? list : null
  }, 30_000)
  const socket = new WebSocket(targets!.find((target: any) => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map<number, (value: any) => void>()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)!(message.result)
      pending.delete(message.id)
    }
  })
  // A stalled page can leave a command unanswered; give up rather than hang.
  const send = (method: string, params: Record<string, any> = {}) => new Promise<any>((resolve) => {
    const next = ++id
    pending.set(next, resolve)
    socket.send(JSON.stringify({ id: next, method, params }))
    setTimeout(() => {
      if (pending.delete(next))
        resolve({ timedOut: true })
    }, 8_000)
  })
  await send('Page.enable')
  await send('Runtime.enable')
  return {
    send,
    evaluate: async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))?.result?.value,
    close: async () => {
      socket.close()
      chrome.kill()
      await chrome.exited
      rmSync(profile, { recursive: true, force: true })
    },
  }
}

async function open(browser: Browser, route: string, heading: string): Promise<void> {
  await browser.send('Page.navigate', { url: `${BASE}${route}` })
  await waitFor(`the page to finish loading with heading ${JSON.stringify(heading)}`, () => browser.evaluate<boolean>(`document.readyState === 'complete' && document.querySelector('h1')?.textContent === ${JSON.stringify(heading)}`))
}

async function back(browser: Browser): Promise<void> {
  const history = await browser.send('Page.getNavigationHistory')
  await browser.send('Page.navigateToHistoryEntry', { entryId: history.entries[history.currentIndex - 1].id })
}

describe.skipIf(!CHROME)('in a real browser', () => {
  let browser: Browser

  beforeAll(async () => {
    browser = await launchChrome()
  })

  afterAll(async () => {
    await browser?.close()
  })

  it('keeps answering requests however many pages the tab has loaded', async () => {
    // Six cached pages each holding a stream used to be the limit: from the
    // ninth load or so, the page's own requests queued forever.
    for (let i = 0; i < 12; i++) {
      const route = ['/a', '/b', '/c', '/'][i % 4]!
      const navigation = await browser.send('Page.navigate', { url: `${BASE}${route}` })
      expect(navigation.timedOut).toBeUndefined()
      // Long enough for the page's stream to connect, as it would for anyone
      // actually reading the page before moving on.
      await Bun.sleep(600)
      // The probe must not answer `Cache-Control: no-store` (as the pages
      // do): a page that fetched one is kept out of the back/forward cache,
      // and then nothing is cached and nothing can pile up. An app's API
      // calls usually do not say no-store, which is how they got stuck.
      const answered = await browser.evaluate<boolean>(`Promise.race([fetch('/favicon.ico?probe=${i}').then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 3000))])`)
      expect(answered).toBe(true)
    }
  })

  it('restores a cached page as it was, and it still hears about edits', async () => {
    await open(browser, '/a', 'a')
    await browser.evaluate('window.__kept = true')
    await open(browser, '/b', 'b')
    await back(browser)
    await waitFor('the heading to read a', () => browser.evaluate<boolean>(`document.querySelector('h1')?.textContent === 'a'`))

    // Still the same document: the back/forward cache restored it and the
    // version check found nothing to reload for.
    expect(await browser.evaluate<boolean>('window.__kept === true')).toBe(true)

    // And its stream is open again, so the next edit reaches it.
    await Bun.sleep(300)
    await editAndAwait('views/a.stx', page('a', ' live'))
    expect(await waitFor('the live edit to reach the heading', () => browser.evaluate<boolean>(`document.querySelector('h1')?.textContent === 'a live'`))).toBe(true)
  })

  it('reloads a cached page that missed an edit while it was away', async () => {
    await open(browser, '/b', 'b')
    await browser.evaluate('window.__stale = true')
    await open(browser, '/c', 'c edited')
    await editAndAwait('views/b.stx', page('b', ' while away'))
    await back(browser)

    expect(await waitFor('the edit made while the page was hidden to reach the heading', () => browser.evaluate<boolean>(`document.querySelector('h1')?.textContent === 'b while away'`))).toBe(true)
    expect(await browser.evaluate<boolean>('window.__stale === true')).toBe(false)
  })
})
