import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_PAGE_WARMUP_BUDGET_MS, PAGE_WARMUP_HEADER, portIsServed, resolvePageWarmup } from '../src/serve'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

const PRODUCTION = { APP_ENV: 'production', NODE_ENV: 'production' }
const DEVELOPMENT = { APP_ENV: 'development', NODE_ENV: 'development' }

const dirs: string[] = []

afterAll(async () => {
  await Promise.all(dirs.map(d => rm(d, { recursive: true, force: true })))
})

interface Visit { path: string, warmup: boolean, port: string }

interface Boot {
  /** Requests the new instance had handled when it bound the public port. */
  seenAtBind: Visit[]
  /** Every request it has handled so far. */
  seen: () => Promise<Visit[]>
  /** How long it took to bind, in ms. */
  elapsed: number
  stop: () => void
}

/**
 * The release being replaced: a server already on `port` with SO_REUSEPORT,
 * the way the previous release holds it during a zero-downtime deploy.
 */
function previousRelease(port: number): ReturnType<typeof Bun.serve> {
  return Bun.serve({ port, reusePort: true, fetch: () => new Response('previous release') })
}

/**
 * Boot serve() in a subprocess. Its `onRequest` hook records every request it
 * handles (path, warm-up header, the port it arrived on), and `slow` holds
 * the warm-up request for `slow.path` (`'*'`: every one) for `slow.ms`, a
 * page that is expensive to render the first time.
 * serve() prints its banner right after the bind, so the banner is the
 * signal: a connection would prove nothing while the previous release holds
 * the port.
 */
async function boot(env: Record<string, string>, port: number, extra: Record<string, unknown> = {}, slow?: { path: string, ms: number }): Promise<Boot> {
  const dir = createTempDir('stx-page-warmup-')
  dirs.push(dir)
  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main>home</main>')
  await Bun.write(path.join(dir, 'views', 'about.stx'), '<main>about</main>')
  await Bun.write(path.join(dir, 'views', 'users', '[name].stx'), '<main>user</main>')
  await Bun.write(path.join(dir, 'driver.ts'), `import { appendFileSync } from 'node:fs'
import { serve } from ${JSON.stringify(SERVE_SRC)}

const slow = ${JSON.stringify(slow ?? null)}
serve({
  patterns: ['views'],
  port: ${port},
  async onRequest(req) {
    const url = new URL(req.url)
    const warmup = req.headers.get(${JSON.stringify(PAGE_WARMUP_HEADER)}) === '1'
    appendFileSync('seen.jsonl', JSON.stringify({ path: url.pathname, warmup, port: url.port }) + '\\n')
    if (slow && warmup && (slow.path === '*' || url.pathname === slow.path))
      await Bun.sleep(slow.ms)
  },
  ...${JSON.stringify(extra)},
})
`)

  const started = Date.now()
  const proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'pipe' })
  const seen = async (): Promise<Visit[]> => {
    const text = await Bun.file(path.join(dir, 'seen.jsonl')).text().catch(() => '')
    return text.trim() ? text.trim().split('\n').map(line => JSON.parse(line) as Visit) : []
  }

  const reader = proc.stdout.getReader()
  const decoder = new TextDecoder()
  let output = ''
  const deadline = started + 40_000
  while (Date.now() < deadline) {
    const chunk = await Promise.race([reader.read(), Bun.sleep(deadline - Date.now()).then(() => null)])
    if (!chunk || chunk.done)
      break
    output += decoder.decode(chunk.value)
    if (output.includes('Local')) {
      const elapsed = Date.now() - started
      const seenAtBind = await seen()
      reader.releaseLock()
      return { seenAtBind, seen, elapsed, stop: () => proc.kill() }
    }
  }
  proc.kill()
  throw new Error(`never bound: ${output.slice(-400)}`)
}

async function waitForWarmups(booted: Boot, count: number): Promise<Visit[]> {
  let visits: Visit[] = []
  for (let i = 0; i < 200; i++) {
    visits = (await booted.seen()).filter(v => v.warmup)
    if (visits.length >= count)
      break
    await Bun.sleep(50)
  }
  return visits
}

describe('page warm-up', () => {
  // A zero-downtime deploy overlaps releases on one port. A cold release that
  // joins at once gets real visitors to pages it has never rendered, while the
  // release it replaces could serve them warm.
  it('renders every static page and the configured paths before joining a port another release serves', async () => {
    const port = freePort()
    const previous = previousRelease(port)
    try {
      const booted = await boot(PRODUCTION, port, { reusePort: true, pageWarmup: { paths: ['/users/ada'] } })
      booted.stop()
      const warmed = booted.seenAtBind.filter(v => v.warmup).map(v => v.path).sort()
      expect(warmed).toEqual(['/', '/about', '/users/ada'])
      // Through a private listener, never the public port.
      expect(booted.seenAtBind.every(v => v.port !== String(port))).toBe(true)
    }
    finally {
      previous.stop(true)
    }
  })

  // With nobody else on the port there is no one to warm for: holding the
  // bind turns a slow first answer into no answer, and warming behind it
  // spends a serving process on pages nobody asked for.
  it('binds at once and warms nothing when nobody else serves the port', async () => {
    const booted = await boot(PRODUCTION, freePort(), { reusePort: true })
    await Bun.sleep(1000)
    const seen = await booted.seen()
    booted.stop()
    expect(booted.elapsed).toBeLessThan(3500)
    expect(seen.filter(v => v.warmup)).toEqual([])
  })

  // The budget can run out before every page is warm; the pages the project
  // named are the ones it most wants warm.
  it('warms the home page and the configured paths before the rest', async () => {
    const port = freePort()
    const previous = previousRelease(port)
    try {
      const booted = await boot(PRODUCTION, port, { reusePort: true, pageWarmup: { concurrency: 1, paths: ['/users/ada'] } })
      booted.stop()
      expect(booted.seenAtBind.filter(v => v.warmup).map(v => v.path)).toEqual(['/', '/users/ada', '/about'])
    }
    finally {
      previous.stop(true)
    }
  })

  it('waits for the warm-up with nobody else on the port when asked to', async () => {
    const booted = await boot(PRODUCTION, freePort(), { pageWarmup: { holdBind: 'always', paths: ['/users/ada'] } })
    booted.stop()
    expect(booted.seenAtBind.filter(v => v.warmup).map(v => v.path).sort()).toEqual(['/', '/about', '/users/ada'])
  })

  // A deploy tool gives up on a release that never binds; and once bound, the
  // server has visitors to spend itself on.
  it('joins once the budget is spent and stops taking new pages', async () => {
    const port = freePort()
    const previous = previousRelease(port)
    try {
      // Every page takes 3 s; one at a time against a 300 ms budget.
      const booted = await boot(PRODUCTION, port, { reusePort: true, pageWarmup: { budgetMs: 300, concurrency: 1 } }, { path: '*', ms: 3000 })
      expect(booted.elapsed).toBeLessThan(2900)
      // The page in flight at the budget finishes; nothing after it starts.
      await Bun.sleep(7000)
      const warmed = (await booted.seen()).filter(v => v.warmup)
      booted.stop()
      expect(warmed).toHaveLength(1)
    }
    finally {
      previous.stop(true)
    }
  })

  it('does not warm when turned off', async () => {
    const port = freePort()
    const previous = previousRelease(port)
    try {
      const booted = await boot(PRODUCTION, port, { reusePort: true, pageWarmup: false })
      await Bun.sleep(500)
      const seen = await booted.seen()
      booted.stop()
      expect(seen.filter(v => v.warmup)).toEqual([])
    }
    finally {
      previous.stop(true)
    }
  })

  it('never warms in development', async () => {
    const booted = await boot(DEVELOPMENT, freePort())
    await Bun.sleep(500)
    const seen = await booted.seen()
    booted.stop()
    expect(seen.filter(v => v.warmup)).toEqual([])
  })
})

describe('portIsServed', () => {
  it('sees a listener and an empty port for what they are', async () => {
    const server = Bun.serve({ port: 0, fetch: () => new Response('ok') })
    try {
      expect(await portIsServed(server.port as number)).toBe(true)
    }
    finally {
      server.stop(true)
    }
    expect(await portIsServed(freePort())).toBe(false)
  })
})

describe('resolvePageWarmup', () => {
  it('is on with the defaults when unset', () => {
    expect(resolvePageWarmup(undefined)).toEqual({ enabled: true, paths: [], holdBind: 'replacing', budgetMs: DEFAULT_PAGE_WARMUP_BUDGET_MS, concurrency: 4 })
    expect(resolvePageWarmup(true)).toEqual({ enabled: true, paths: [], holdBind: 'replacing', budgetMs: DEFAULT_PAGE_WARMUP_BUDGET_MS, concurrency: 4 })
    expect(resolvePageWarmup({ holdBind: 'always' }).holdBind).toBe('always')
    expect(resolvePageWarmup({ holdBind: 'sometimes' }).holdBind).toBe('replacing')
  })

  it('turns off on false', () => {
    expect(resolvePageWarmup(false).enabled).toBe(false)
  })

  it('keeps only same-origin absolute paths, once each', () => {
    expect(resolvePageWarmup({ paths: ['/a', 'b', '//evil.example/x', 'https://evil.example/', '/a', 42] }).paths).toEqual(['/a'])
  })

  it('falls back to the defaults for unusable numbers', () => {
    expect(resolvePageWarmup({ budgetMs: -1, concurrency: 0 })).toMatchObject({ budgetMs: DEFAULT_PAGE_WARMUP_BUDGET_MS, concurrency: 4 })
    expect(resolvePageWarmup({ budgetMs: 0, concurrency: 2.7 })).toMatchObject({ budgetMs: 0, concurrency: 2 })
  })
})
