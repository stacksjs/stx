import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_PAGE_WARMUP_BUDGET_MS, PAGE_WARMUP_HEADER, resolvePageWarmup } from '../src/serve'
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
  /** Requests the server had seen when its public port first accepted a connection. */
  seenAtBind: Visit[]
  /** Every request seen so far. */
  seen: () => Promise<Visit[]>
  elapsed: number
  stop: () => void
}

/**
 * Boot serve() in a subprocess. Its `onRequest` hook records every request it
 * handles (path, warm-up header, the port it arrived on) to a file, and
 * `slowPath`, when given, holds a warm-up request for `slowMs` - a page that
 * is expensive to render the first time.
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
  quiet: true,
  async onRequest(req) {
    const url = new URL(req.url)
    const warmup = req.headers.get(${JSON.stringify(PAGE_WARMUP_HEADER)}) === '1'
    appendFileSync('seen.jsonl', JSON.stringify({ path: url.pathname, warmup, port: url.port }) + '\\n')
    if (slow && warmup && url.pathname === slow.path)
      await Bun.sleep(slow.ms)
  },
  ...${JSON.stringify(extra)},
})
`)

  const proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'pipe' })
  const seen = async (): Promise<Visit[]> => {
    const text = await Bun.file(path.join(dir, 'seen.jsonl')).text().catch(() => '')
    return text.trim() ? text.trim().split('\n').map(line => JSON.parse(line) as Visit) : []
  }

  const started = Date.now()
  const deadline = started + 40_000
  while (Date.now() < deadline) {
    try {
      const socket = await Bun.connect({ hostname: 'localhost', port, socket: { data() {}, error() {} } })
      const elapsed = Date.now() - started
      const seenAtBind = await seen()
      socket.end()
      return { seenAtBind, seen, elapsed, stop: () => proc.kill() }
    }
    catch {
      await Bun.sleep(50)
    }
  }
  proc.kill()
  throw new Error('never bound')
}

describe('page warm-up before the bind', () => {
  // A zero-downtime deploy overlaps releases on one port. A cold release that
  // binds at once gets real visitors to pages it has never rendered, while the
  // previous release could serve them warm.
  it('renders every static page and the configured paths before production binds', async () => {
    const port = freePort()
    const booted = await boot(PRODUCTION, port, { pageWarmup: { paths: ['/users/ada'] } })
    booted.stop()

    const warmed = booted.seenAtBind.filter(v => v.warmup).map(v => v.path).sort()
    expect(warmed).toEqual(['/', '/about', '/users/ada'])
    // Through a private listener, never the public port it had not bound yet.
    expect(booted.seenAtBind.every(v => v.port !== String(port))).toBe(true)
  })

  it('binds without warming when turned off', async () => {
    const booted = await boot(PRODUCTION, freePort(), { pageWarmup: false })
    booted.stop()
    expect(booted.seenAtBind).toEqual([])
  })

  it('never warms in development', async () => {
    const booted = await boot(DEVELOPMENT, freePort())
    booted.stop()
    expect(booted.seenAtBind).toEqual([])
  })

  // A deploy tool gives up on a release that never binds; past the budget the
  // server binds and the rest of the warm-up carries on behind it.
  it('binds once the budget is spent and finishes warming behind the bind', async () => {
    const booted = await boot(PRODUCTION, freePort(), { pageWarmup: { budgetMs: 300, concurrency: 1 } }, { path: '/', ms: 4000 })
    expect(booted.elapsed).toBeLessThan(3500)

    let later: Visit[] = []
    for (let i = 0; i < 160; i++) {
      later = await booted.seen()
      if (later.filter(v => v.warmup).length >= 2)
        break
      await Bun.sleep(50)
    }
    booted.stop()
    expect(later.filter(v => v.warmup).map(v => v.path).sort()).toEqual(['/', '/about'])
  })
})

describe('resolvePageWarmup', () => {
  it('is on with the defaults when unset', () => {
    expect(resolvePageWarmup(undefined)).toEqual({ enabled: true, paths: [], budgetMs: DEFAULT_PAGE_WARMUP_BUDGET_MS, concurrency: 4 })
    expect(resolvePageWarmup(true)).toEqual({ enabled: true, paths: [], budgetMs: DEFAULT_PAGE_WARMUP_BUDGET_MS, concurrency: 4 })
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
