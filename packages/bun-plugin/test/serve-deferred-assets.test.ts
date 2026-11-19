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
