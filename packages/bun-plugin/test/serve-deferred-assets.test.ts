import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

test('SSR defers setup added by response hooks after the runtime', async () => {
  const dir = createTempDir('stx-deferred-response-')
  const port = freePort()
  const base = `http://localhost:${port}`
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default { deferScripts: true }')
  await Bun.write(path.join(dir, 'views/index.stx'), '<html><body><main>Rendered content</main></body></html>')
  await Bun.write(path.join(dir, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.resolve(import.meta.dir, '../src/serve.ts'))}
serve({ patterns: ['views'], port: ${port}, quiet: true,
  async onResponse(req, response) {
    if (!response.headers.get('content-type')?.includes('text/html')) return
    const html = (await response.text()).replace('</body>', '<script>window.lateHookReady = true;</script></body>')
    return new Response(html, { status: response.status, headers: { ...Object.fromEntries(response.headers), 'x-response-hook': 'retained' } })
  }
})`)
  const proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'ignore', stderr: 'pipe' })
  try {
    let response: Response | undefined
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      try { response = await fetch(base); break }
      catch { await Bun.sleep(100) }
    }
    expect(response?.status).toBe(200)
    expect(response?.headers.get('x-response-hook')).toBe('retained')
    const html = await response!.text()
    expect(html).toContain('Rendered content')
    expect(html).not.toContain('<script>window.lateHookReady')
    const scripts = [...html.matchAll(/<script\b([^>]*)src="([^\"]+)"[^>]*><\/script>/g)]
    expect(scripts.length).toBeGreaterThan(0)
    let foundHook = false
    for (const script of scripts) {
      if (!script[2]!.startsWith('/_stx/')) continue
      expect(script[0]).toContain('defer')
      const asset = await fetch(base + script[2])
      expect(asset.status).toBe(200)
      if ((await asset.text()).includes('window.lateHookReady')) foundHook = true
    }
    expect(foundHook).toBe(true)
  }
  finally {
    proc.kill()
    await proc.exited
    await rm(dir, { recursive: true, force: true })
  }
}, 60_000)

test('production SSR fingerprints public media and serves only matching bytes', async () => {
  const dir = createTempDir('stx-public-fingerprints-')
  const port = freePort()
  const base = `http://localhost:${port}`
  const image = path.join(dir, 'public/hero.svg')
  const svg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="${color}"/></svg>`
  await Bun.write(image, svg('red'))
  await Bun.write(path.join(dir, 'views/[slug].stx'), '<main>Dynamic route</main>')
  await Bun.write(path.join(dir, 'views/index.stx'), `
    <link rel="preload" as="image" imagesrcset="/hero.svg 1x, /hero.svg 2x" href="/hero.svg">
    <main><img src="/hero.svg" srcset="/hero.svg 1x, /hero.svg 2x" alt=""><a href="/hero.svg">Original</a></main>
    <img srcset="data:image/png;base64,AA 1x, /hero.svg 2x" alt="">
    <img data-stx-no-fingerprint src="/hero.svg" alt=""><img src="/hero.svg?v=1" alt="">
  `)
  await Bun.write(path.join(dir, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.resolve(import.meta.dir, '../src/serve.ts'))}
serve({ patterns: ['views'], port: ${port}, quiet: true, imageWarmup: false })
  `)
  const proc = Bun.spawn(['bun', 'driver.ts'], {
    cwd: dir,
    env: { ...process.env, APP_ENV: 'production', NODE_ENV: 'production' },
    stdout: 'ignore',
    stderr: 'pipe',
  })
  try {
    let response: Response | undefined
    for (let attempt = 0; attempt < 300; attempt++) {
      try { response = await fetch(base); break }
      catch { await Bun.sleep(100) }
    }
    expect(response?.status).toBe(200)
    const html = await response!.text()
    const first = /src="(\/hero\.stx-[a-f0-9]{16}\.svg)"/.exec(html)?.[1]
    expect(first).toBeDefined()
    expect(html).toContain(`srcset="${first} 1x, ${first} 2x"`)
    expect(html).toContain(`imagesrcset="${first} 1x, ${first} 2x"`)
    expect(html).toContain(`srcset="data:image/png;base64,AA 1x, ${first} 2x"`)
    expect(html).toContain('href="/hero.svg">Original')
    expect(html).toContain('src="/hero.svg?v=1"')
    expect(html).toMatch(/<img[^>]+data-stx-no-fingerprint[^>]+src="\/hero\.svg"/)
    const firstImage = await fetch(base + first)
    expect(firstImage.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(await firstImage.text()).toBe(svg('red'))

    await Bun.write(image, svg('blue'))
    const nextHtml = await (await fetch(base)).text()
    const next = /src="(\/hero\.stx-[a-f0-9]{16}\.svg)"/.exec(nextHtml)?.[1]
    expect(next).toBeDefined()
    expect(next).not.toBe(first)
    const head = await fetch(base + next, { method: 'HEAD' })
    expect(head.headers.get('Content-Length')).toBe(String(svg('blue').length))
    expect(await head.text()).toBe('')
    expect(await (await fetch(base + next)).text()).toBe(svg('blue'))
    const stale = await fetch(base + first)
    expect(stale.status).toBe(404)
    expect(stale.headers.get('Cache-Control')).toBe('no-store')
  }
  finally {
    proc.kill()
    await proc.exited
    await rm(dir, { recursive: true, force: true })
  }
}, 60_000)
