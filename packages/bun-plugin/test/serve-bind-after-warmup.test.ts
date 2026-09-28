import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DEFAULT_IMAGE_WARMUP_BIND_BUDGET_MS, resolveImageWarmupBindBudget, settleWithin } from '../src/serve'

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SRC = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')
const WARMUP_MS = 5000

const dirs: string[] = []

afterAll(async () => {
  await Promise.all(dirs.map(d => rm(d, { recursive: true, force: true })))
})

/**
 * Boot serve() in a subprocess with a deliberately slow image pass, and report
 * how long the port took to accept a connection.
 */
const USES_IMAGE = '<main><StxImage src="/hero.jpg" alt="Hero" /></main>'
const NO_IMAGE = '<main>bound</main>'

interface Boot {
  /** How long the port took to accept a connection, in ms. */
  elapsed: number
  dir: string
  port: number
  stop: () => void
}

async function boot(
  env: Record<string, string>,
  port: number,
  extra: Record<string, unknown> = {},
  page = USES_IMAGE,
  files: Record<string, string> = {},
): Promise<Boot> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-bind-'))
  dirs.push(dir)
  await Bun.write(path.join(dir, 'views', 'index.stx'), page)
  for (const [name, content] of Object.entries(files))
    await Bun.write(path.join(dir, name), content)
  await Bun.write(path.join(dir, 'driver.ts'), `import * as realStx from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

const stxModule = {
  ...realStx,
  async warmImagePlaceholders() { return 0 },
  async prepareImageDelivery(_publicDir: string, outputDir: string) {
    await Bun.write('delivery-dir.txt', outputDir)
    await Bun.sleep(${WARMUP_MS})
    await Bun.write('warmup-done.txt', String(Date.now()))
    return { count: 0, fingerprint: '' }
  },
}

serve({ patterns: ['views'], port: ${port}, stxModule: stxModule as any, ...${JSON.stringify(extra)} })
`)

  const proc = Bun.spawn(['bun', 'driver.ts'], {
    cwd: dir,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const stop = () => proc.kill()

  const started = Date.now()
  const deadline = started + 40_000
  while (Date.now() < deadline) {
    try {
      const socket = await Bun.connect({ hostname: 'localhost', port, socket: { data() {}, error() {} } })
      socket.end()
      return { elapsed: Date.now() - started, dir, port, stop }
    }
    catch {
      await Bun.sleep(50)
    }
  }
  stop()
  throw new Error('never bound')
}

async function timeToBind(env: Record<string, string>, port: number, extra: Record<string, unknown> = {}, page = USES_IMAGE, files: Record<string, string> = {}): Promise<number> {
  const booted = await boot(env, port, extra, page, files)
  booted.stop()
  return booted.elapsed
}

const PRODUCTION = { APP_ENV: 'production', NODE_ENV: 'production' }

describe('startup image pass and the bind', () => {
  // A zero-downtime deploy overlaps releases on one port. The moment a warming
  // instance binds, the kernel gives it real visitors it cannot yet serve —
  // while the release it is replacing is right there, able to serve them.
  it('does not bind in production until the pass is done', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'production', NODE_ENV: 'production' }, 45_910 + (process.pid % 20))
    expect(elapsed).toBeGreaterThan(WARMUP_MS * 0.7)
  })

  // A project that renders no <StxImage> and no @image gets nothing from the
  // pass, and in production pays for it twice: once in startup, and again in
  // how long a deploy keeps two releases overlapping.
  it('binds immediately in production when the pass is turned off', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_950 + (process.pid % 20),
      { imageWarmup: false },
    )
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  // Development wants the server now; the fallbacks are fine until it warms.
  it('binds immediately in development', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'development', NODE_ENV: 'development' }, 45_930 + (process.pid % 20))
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  // The default: nothing in the project reads the pass, so it does not run
  // and the release binds at once. A photo-heavy site with no <StxImage> used
  // to spend minutes here and fail its deploy's health check.
  it('skips the pass by default when no template uses <StxImage> or @image', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_970 + (process.pid % 20),
      {},
      NO_IMAGE,
    )
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  it('still runs the pass when forced on, whatever the templates use', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_990 + (process.pid % 20),
      { imageWarmup: true },
      NO_IMAGE,
    )
    expect(elapsed).toBeGreaterThan(WARMUP_MS * 0.7)
  })

  // A release directory is new on every deploy; variants kept inside it were
  // re-encoded by every release. STX_IMAGE_CACHE_DIR lets them outlive it.
  it('keeps the variants under STX_IMAGE_CACHE_DIR when it is set', async () => {
    const cache = await mkdtemp(path.join(tmpdir(), 'stx-image-cache-'))
    dirs.push(cache)
    await timeToBind({ APP_ENV: 'production', NODE_ENV: 'production', STX_IMAGE_CACHE_DIR: cache }, 46_010 + (process.pid % 20))

    const dir = dirs.at(-1)!
    let recorded = ''
    for (let i = 0; i < 100 && !recorded; i++) {
      recorded = await Bun.file(path.join(dir, 'delivery-dir.txt')).text().catch(() => '')
      if (!recorded)
        await Bun.sleep(50)
    }
    expect(recorded).toBe(path.join(cache, 'image-delivery'))
  })
})

describe('the bind budget', () => {
  const BUDGET_MS = 1000

  // A cold variant cache re-encodes every raster. On a photo-heavy site that
  // is minutes, and ts-cloud gives up on a release that has not bound in 180s:
  // the deploy failed with the old release still serving and nothing wrong
  // with the new one but a missing cache.
  it('binds once the budget is spent, and finishes the pass behind the bind', async () => {
    const booted = await boot(PRODUCTION, 46_030 + (process.pid % 20), { imageWarmupBindBudgetMs: BUDGET_MS })
    try {
      expect(booted.elapsed).toBeGreaterThan(BUDGET_MS * 0.7)
      expect(booted.elapsed).toBeLessThan(WARMUP_MS * 0.7)

      // Bound while the pass is still running, and serving: the per-request
      // grace runs out and the page renders against the fallbacks.
      expect(await Bun.file(path.join(booted.dir, 'warmup-done.txt')).exists()).toBe(false)
      const res = await fetch(`http://localhost:${booted.port}/`)
      expect(res.status).toBe(200)
      expect(await res.text()).toContain('<main>')

      // And the pass was not abandoned.
      let done = false
      for (let i = 0; i < 200 && !done; i++) {
        done = await Bun.file(path.join(booted.dir, 'warmup-done.txt')).exists()
        if (!done)
          await Bun.sleep(50)
      }
      expect(done).toBe(true)
    }
    finally {
      booted.stop()
    }
  })

  it('reads the budget from the stx config', async () => {
    const elapsed = await timeToBind(
      PRODUCTION,
      46_050 + (process.pid % 20),
      {},
      USES_IMAGE,
      { 'stx.config.ts': `export default { imageWarmupBindBudgetMs: ${BUDGET_MS} }\n` },
    )
    expect(elapsed).toBeLessThan(WARMUP_MS * 0.7)
  })

  it('binds at once with a budget of zero', async () => {
    const elapsed = await timeToBind(PRODUCTION, 46_070 + (process.pid % 20), { imageWarmupBindBudgetMs: 0 })
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })
})

describe('resolveImageWarmupBindBudget', () => {
  it('takes a finite, non-negative number of milliseconds', () => {
    expect(resolveImageWarmupBindBudget(0)).toBe(0)
    expect(resolveImageWarmupBindBudget(30_000)).toBe(30_000)
    expect(resolveImageWarmupBindBudget('20000')).toBe(20_000)
  })

  // An unbounded wait is the failure the budget exists to stop, so nothing
  // that fails to parse may turn into one.
  it('falls back to the default, never to forever', () => {
    for (const value of [undefined, null, -1, Number.NaN, Number.POSITIVE_INFINITY, 'soon', '', {}])
      expect(resolveImageWarmupBindBudget(value)).toBe(DEFAULT_IMAGE_WARMUP_BIND_BUDGET_MS)
    expect(DEFAULT_IMAGE_WARMUP_BIND_BUDGET_MS).toBeLessThan(180_000 / 2)
  })
})

describe('settleWithin', () => {
  it('reports a promise that settles in time, fulfilled or rejected', async () => {
    expect(await settleWithin(Bun.sleep(10), 1000)).toBe(true)
    expect(await settleWithin(Promise.reject(new Error('x')), 1000)).toBe(true)
  })

  it('reports one that does not, without cancelling it', async () => {
    let finished = false
    const work = Bun.sleep(150).then(() => { finished = true })
    expect(await settleWithin(work, 20)).toBe(false)
    await work
    expect(finished).toBe(true)
  })
})
