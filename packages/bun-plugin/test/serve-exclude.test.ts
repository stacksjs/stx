import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pageExcluder } from '../src/serve'
import { freePort } from '../../stx/test-utils/test-port'

/**
 * `exclude`: page files a pattern directory holds that the server must not
 * answer for.
 *
 * A pattern is a page root - a file's URL is its path relative to the root
 * that holds it - so a framework's default views directory was all or
 * nothing. Its `/404` came with its `/login`, `/cart` and `/checkout/*`, and
 * an app that mounted none of the routes those pages post to still answered
 * 200 on every one of them.
 */

setDefaultTimeout(60_000)

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-exclude-'))

  await Bun.write(path.join(dir, 'app', 'index.stx'), '<main>home</main>\n')
  // The app's own page at the path of an excluded default: excluding the
  // framework's copy must not take the app's with it.
  await Bun.write(path.join(dir, 'app', 'register.stx'), '<main>app register</main>\n')

  await Bun.write(path.join(dir, 'defaults', 'login.stx'), '<main>default login</main>\n')
  await Bun.write(path.join(dir, 'defaults', 'register.stx'), '<main>default register</main>\n')
  await Bun.write(path.join(dir, 'defaults', 'coming-soon.stx'), '<main>coming soon</main>\n')
  await Bun.write(path.join(dir, 'defaults', 'checkout', 'payment.stx'), '<main>payment</main>\n')
  await Bun.write(path.join(dir, 'defaults', 'errors', '404.stx'), '<main>custom not found</main>\n')

  // Spelled three ways on purpose: relative file, absolute directory with a
  // trailing slash, and a file the app shadows.
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['app', 'defaults'],
  exclude: [
    'defaults/login.stx',
    ${JSON.stringify(`${path.join(dir, 'defaults', 'checkout')}/`)},
    'defaults/register.stx',
  ],
  port: ${PORT},
})
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${BASE}/definitely-not-a-page`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serve() never came up')
      await Bun.sleep(120)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  await rm(dir, { recursive: true, force: true })
})

describe('serve exclude', () => {
  it('does not answer for an excluded file', async () => {
    const res = await fetch(`${BASE}/login`)
    expect(res.status).toBe(404)
    // Through the app's own 404 page, like any other miss.
    expect(await res.text()).toContain('custom not found')
  })

  it('does not answer for anything under an excluded directory', async () => {
    expect((await fetch(`${BASE}/checkout/payment`)).status).toBe(404)
  })

  it('keeps the rest of the root', async () => {
    const res = await fetch(`${BASE}/coming-soon`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('coming soon')
  })

  it('still serves the app page that shadows an excluded default', async () => {
    const res = await fetch(`${BASE}/register`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('app register')
  })
})

describe('pageExcluder', () => {
  const cwd = '/project'

  it('excludes nothing when given nothing', () => {
    expect(pageExcluder(undefined, cwd)('/project/defaults/login.stx')).toBeFalse()
    expect(pageExcluder([], cwd)('/project/defaults/login.stx')).toBeFalse()
    expect(pageExcluder([''], cwd)('/project/defaults/login.stx')).toBeFalse()
  })

  it('matches a file however either side is spelled', () => {
    const excluded = pageExcluder(['defaults/login.stx'], cwd)
    expect(excluded('/project/defaults/login.stx')).toBeTrue()
    expect(excluded('defaults/login.stx')).toBeTrue()
    expect(excluded('./defaults//login.stx')).toBeTrue()
  })

  it('matches a directory subtree but not a sibling that shares its prefix', () => {
    const excluded = pageExcluder(['/project/defaults/checkout/'], cwd)
    expect(excluded('/project/defaults/checkout/payment.stx')).toBeTrue()
    expect(excluded('/project/defaults/checkout-help.stx')).toBeFalse()
  })
})
