import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 46_020 + (process.pid % 30)
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SRC = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null
let stderr = ''

/**
 * A failed image warm-up used to vanish into an empty `catch {}` (and the
 * rejected halves of a `Promise.allSettled` nobody read). In a Stacks app the
 * pass threw on a clobbered global `Worker`, nothing was logged, and every
 * <StxImage> served its original file with no placeholder for as long as the
 * process ran. A failure has to reach the log.
 */
describe('a failed image warm-up', () => {
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-image-warmup-failure-'))
    await Bun.write(path.join(dir, 'views', 'index.stx'), '<main>warm</main>')
    await Bun.write(path.join(dir, 'driver.ts'), `import * as realStx from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

const stxModule = {
  ...realStx,
  async warmImagePlaceholders() {
    throw new TypeError('worker.addEventListener is not a function')
  },
  async prepareImageDelivery() {
    throw new Error('delivery exploded')
  },
}

serve({
  patterns: ['views'],
  port: ${PORT},
  stxModule: stxModule as any,
  imageWarmup: true,
})
`)

    proc = Bun.spawn(['bun', 'driver.ts'], {
      cwd: dir,
      env: { ...process.env, APP_ENV: 'development', NODE_ENV: 'development' },
      stdout: 'ignore',
      stderr: 'pipe',
    })

    const reader = (proc.stderr as ReadableStream<Uint8Array>).getReader()
    const decoder = new TextDecoder()
    const deadline = Date.now() + 30_000
    while (!(stderr.includes('image placeholders failed') && stderr.includes('responsive image variants failed'))) {
      if (Date.now() > deadline)
        break
      const chunk = await Promise.race([reader.read(), Bun.sleep(1000).then(() => null)])
      if (chunk?.done)
        break
      if (chunk?.value)
        stderr += decoder.decode(chunk.value, { stream: true })
    }
    reader.releaseLock()
  })

  afterAll(async () => {
    proc?.kill()
    await rm(dir, { recursive: true, force: true })
  })

  it('is logged, stage by stage, with the reason', () => {
    const lines = stderr.split('\n')
    const placeholders = lines.filter(line => line.includes('image placeholders failed during the image warm-up'))
    const variants = lines.filter(line => line.includes('responsive image variants failed during the image warm-up'))
    expect(placeholders).toHaveLength(1)
    expect(placeholders[0]).toContain('worker.addEventListener is not a function')
    expect(variants).toHaveLength(1)
    expect(variants[0]).toContain('delivery exploded')
  })
})
