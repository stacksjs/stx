import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { encode } from 'ts-images'
import { DEFAULT_IMAGE_WARMUP_BIND_BUDGET_MS, projectUsesImageBuiltins, resolveImageWarmupBindBudget, settleWithin } from '../src/serve'
import { freePort } from '../../stx/test-utils/test-port'

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SRC = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')
const WARMUP_MS = 5000

/**
 * The ceiling for "bound without waiting for the image pass".
 *
 * Waiting for the pass means elapsed >= WARMUP_MS, so any ceiling below that
 * proves the bind did not wait -- the discriminating power is in the gap to
 * 5000ms, not in how tight the number is. It used to be WARMUP_MS / 2, which
 * put a 2.5-second wall-clock ceiling on booting a subprocess, and this suite
 * runs alongside 13,000 other tests: on a loaded machine that is a test which
 * fails for being busy rather than for being wrong.
 */
const BOUND_WITHOUT_WAITING_MS = WARMUP_MS * 0.8

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
  /**
   * Whether the slow image pass had already finished when the port accepted.
   *
   * This is the CAUSAL answer to "did the bind wait for the pass", and it is
   * what the floor assertions use. Timing was a proxy for it and a bad one: a
   * floor of `elapsed > WARMUP_MS * 0.7` says nothing about ordering, it only
   * says the machine was slow, and on a CI runner sharing a box with 14,000
   * other tests it failed for being busy rather than for being wrong.
   *
   * The driver writes `warmup-done.txt` as the last thing the pass does, so its
   * presence at the moment of the bind is exactly the property.
   */
  warmupDoneAtBind: boolean
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
      return {
        elapsed: Date.now() - started,
        warmupDoneAtBind: existsSync(path.join(dir, 'warmup-done.txt')),
        dir,
        port,
        stop,
      }
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

/** Did the bind wait for the image pass? Asked of the ordering, not the clock. */
async function boundAfterWarmup(env: Record<string, string>, port: number, extra: Record<string, unknown> = {}, page = USES_IMAGE): Promise<boolean> {
  const booted = await boot(env, port, extra, page)
  booted.stop()
  return booted.warmupDoneAtBind
}

const PRODUCTION = { APP_ENV: 'production', NODE_ENV: 'production' }

describe('startup image pass and the bind', () => {
  // A zero-downtime deploy overlaps releases on one port. The moment a warming
  // instance binds, the kernel gives it real visitors it cannot yet serve —
  // while the release it is replacing is right there, able to serve them.
  it('does not bind in production until the pass is done', async () => {
    // The pass had finished BEFORE the port accepted — which is the property,
    // rather than "the bind took a while".
    expect(await boundAfterWarmup({ APP_ENV: 'production', NODE_ENV: 'production' }, freePort())).toBe(true)
  })

  // A project that renders no <StxImage> and no @image gets nothing from the
  // pass, and in production pays for it twice: once in startup, and again in
  // how long a deploy keeps two releases overlapping.
  it('binds immediately in production when the pass is turned off', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      freePort(),
      { imageWarmup: false },
    )
    expect(elapsed).toBeLessThan(BOUND_WITHOUT_WAITING_MS)
  })

  // Development wants the server now; the fallbacks are fine until it warms.
  it('binds immediately in development', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'development', NODE_ENV: 'development' }, freePort())
    expect(elapsed).toBeLessThan(BOUND_WITHOUT_WAITING_MS)
  })

  // The default: nothing in the project reads the pass, so it does not run
  // and the release binds at once. A photo-heavy site with no <StxImage> used
  // to spend minutes here and fail its deploy's health check.
  it('skips the pass by default when no template uses <StxImage> or @image', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      freePort(),
      {},
      NO_IMAGE,
    )
    expect(elapsed).toBeLessThan(BOUND_WITHOUT_WAITING_MS)
  })

  it('still runs the pass when forced on, whatever the templates use', async () => {
    expect(await boundAfterWarmup(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      freePort(),
      { imageWarmup: true },
      NO_IMAGE,
    )).toBe(true)
  })

  // A release directory is new on every deploy; variants kept inside it were
  // re-encoded by every release. STX_IMAGE_CACHE_DIR lets them outlive it.
  it('keeps the variants under STX_IMAGE_CACHE_DIR when it is set', async () => {
    const cache = await mkdtemp(path.join(tmpdir(), 'stx-image-cache-'))
    dirs.push(cache)
    await timeToBind({ APP_ENV: 'production', NODE_ENV: 'production', STX_IMAGE_CACHE_DIR: cache }, freePort())

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
    const booted = await boot(PRODUCTION, freePort(), { imageWarmupBindBudgetMs: BUDGET_MS })
    try {
      expect(booted.elapsed).toBeGreaterThan(BUDGET_MS * 0.7)
      expect(booted.elapsed).toBeLessThan(BOUND_WITHOUT_WAITING_MS)

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
      freePort(),
      {},
      USES_IMAGE,
      { 'stx.config.ts': `export default { imageWarmupBindBudgetMs: ${BUDGET_MS} }\n` },
    )
    expect(elapsed).toBeLessThan(WARMUP_MS * 0.7)
  })

  it('binds at once with a budget of zero', async () => {
    const elapsed = await timeToBind(PRODUCTION, freePort(), { imageWarmupBindBudgetMs: 0 })
    expect(elapsed).toBeLessThan(BOUND_WITHOUT_WAITING_MS)
  })
})

describe('serving while the pass runs', () => {
  /** Noise, so the encoders have real work to do and nothing compresses away. */
  function noise(width: number, height: number, seed: number): Uint8Array {
    const pixels = new Uint8Array(width * height * 4)
    for (let i = 0; i < pixels.length; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0
      pixels[i] = i % 4 === 3 ? 255 : seed >>> 24
    }
    return pixels
  }

  // The real pass, not a stand-in that sleeps: what starved requests was CPU,
  // every decode and encode synchronous on the thread that answers them. A
  // cold cache after a deploy kept pages at 14-18s and the proxy in front saw
  // empty responses for the minutes the pass took.
  it('answers a page quickly while a cold pass is still encoding', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-busy-'))
    dirs.push(dir)
    const port = freePort()
    await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><StxImage src="/photo-0.png" alt="Photo" /></main>')
    await Bun.write(path.join(dir, 'views', 'simple.stx'), '<main>simple</main>')
    await mkdir(path.join(dir, 'public'), { recursive: true })
    for (let i = 0; i < 6; i++)
      await writeFile(path.join(dir, 'public', `photo-${i}.png`), await encode({ data: noise(1200, 800, i + 1), width: 1200, height: 800, channels: 4 }, 'png'))
    await Bun.write(path.join(dir, 'driver.ts'), `import * as stxModule from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

// No grace: every request renders at once against the fallbacks, so what is
// measured is the thread, not the designed wait.
serve({ patterns: ['views'], port: ${port}, stxModule: stxModule as any, imageWarmupBindBudgetMs: 0, imageWarmupGraceMs: 0 })
`)

    let finished = false
    const proc = Bun.spawn(['bun', 'driver.ts'], {
      cwd: dir,
      env: { ...process.env, ...PRODUCTION, STX_IMAGE_CACHE_DIR: path.join(dir, 'image-cache') },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    void (async () => {
      const decoder = new TextDecoder()
      for await (const chunk of proc.stdout) {
        if (decoder.decode(chunk).includes('image warm-up finished'))
          finished = true
      }
    })()

    try {
      const deadline = Date.now() + 30_000
      while (true) {
        try {
          const socket = await Bun.connect({ hostname: 'localhost', port, socket: { data() {}, error() {} } })
          socket.end()
          break
        }
        catch {
          if (Date.now() > deadline)
            throw new Error('never bound')
          await Bun.sleep(50)
        }
      }

      // Several requests, all inside the pass, starting with the page that
      // renders the image. With the pass on this thread the first took over
      // 3s and later ones most of a second each; on a production box a
      // liveness probe gave up on it and restarted the unit mid-pass.
      const timings: number[] = []
      for (let i = 0; i < 6 && !finished; i++) {
        const started = performance.now()
        const res = await fetch(`http://localhost:${port}${i % 2 ? '/simple' : '/'}`)
        expect(await res.text()).toContain('<main>')
        timings.push(performance.now() - started)
        await Bun.sleep(100)
      }
      expect(finished).toBe(false)
      expect(timings.length).toBe(6)
      expect(Math.max(...timings)).toBeLessThan(1000)

      // And the pass still completes and is installed.
      for (let i = 0; i < 1200 && !finished; i++)
        await Bun.sleep(50)
      expect(finished).toBe(true)
      const html = await (await fetch(`http://localhost:${port}/`)).text()
      expect(html).toContain('/_stx/images/')
    }
    finally {
      proc.kill()
    }
  })
})

describe('projectUsesImageBuiltins', () => {
  async function project(files: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-uses-image-'))
    dirs.push(dir)
    for (const [name, content] of Object.entries(files))
      await Bun.write(path.join(dir, name), content)
    return dir
  }

  const IMAGE_COMPONENT = '<script server>const { src } = props</script>\n<StxImage src="{{ src }}" alt="" />\n'

  it('counts a page, layout or partial that uses the syntax', async () => {
    expect(await projectUsesImageBuiltins(await project({ 'resources/views/index.stx': USES_IMAGE }))).toBe(true)
    expect(await projectUsesImageBuiltins(await project({ 'resources/layouts/default.stx': '@image(\'/a.jpg\')' }))).toBe(true)
    expect(await projectUsesImageBuiltins(await project({ 'resources/views/index.stx': NO_IMAGE }))).toBe(false)
  })

  // Stacks vendors its Image.stx component into every app, twice. Reading
  // that definition as a use ran the pass for every Stacks app, including
  // ones that only ever wrote <img>: 213MB of variants, seven minutes a boot.
  it('does not count a component that wraps <StxImage> but is never rendered', async () => {
    const root = await project({
      'resources/views/index.stx': '<main><img src="/a.jpg" alt=""></main>',
      'storage/framework/defaults/resources/components/Image.stx': IMAGE_COMPONENT,
      'pantry/@stacksjs/defaults/resources/components/Image.stx': IMAGE_COMPONENT,
      // The SVG element, not the component.
      'resources/views/logo.stx': '<svg><image href="/logo.png" /></svg>',
    })
    expect(await projectUsesImageBuiltins(root)).toBe(false)
  })

  it('counts such a component once a template renders it, through any number of wrappers', async () => {
    expect(await projectUsesImageBuiltins(await project({
      'resources/components/Photo.stx': IMAGE_COMPONENT,
      'resources/views/index.stx': '<main><Photo src="/a.jpg" /></main>',
    }))).toBe(true)
    expect(await projectUsesImageBuiltins(await project({
      'resources/components/HeroPhoto.stx': IMAGE_COMPONENT,
      'resources/components/Hero.stx': '<section><hero-photo src="/a.jpg" /></section>',
      'resources/views/index.stx': '<main><Hero /></main>',
    }))).toBe(true)
    expect(await projectUsesImageBuiltins(await project({
      'resources/components/HeroPhoto.stx': IMAGE_COMPONENT,
      'resources/components/Hero.stx': '<section><HeroPhoto src="/a.jpg" /></section>',
      'resources/views/index.stx': NO_IMAGE,
    }))).toBe(false)
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
