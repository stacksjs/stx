import { expect, it } from 'bun:test'
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

/** #2153: an unchanged persisted page must keep its stylesheet across real process restarts. */
it('serves generated CSS for a kept render and recovers when its stylesheet is missing', async () => {
  const root = createTempDir('stx-render-css-persist-')
  const state = path.join(root, 'state')
  const port = freePort()
  const base = `http://127.0.0.1:${port}`
  let child: ReturnType<typeof Bun.spawn> | undefined
  const stop = async () => {
    if (child) { child.kill(); await child.exited; child = undefined }
  }
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'views/index.stx'), `<script server>const marker = crypto.randomUUID()</script>
<html><head><title>CSS persistence</title></head><body><main class="flex gap-4 text-emerald-600">marker:{{ marker }}</main></body></html>`)
    await Bun.write(path.join(root, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
import * as stx from ${JSON.stringify(path.join(import.meta.dir, '../../stx/src/index.ts'))}
serve({ patterns: ['views'], port: ${port}, quiet: true, stxModule: stx, renderCache: true,
  renderCacheVary: 'source', renderCachePersist: true, imageWarmup: false, watch: false })
`)
    const start = async () => {
      child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_ENV: 'development', STX_DIR: state } })
      const deadline = Date.now() + 20_000
      while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(await new Response(child.stderr).text())
        try {
          const response = await fetch(base, { signal: AbortSignal.timeout(2000) })
          if (response.ok) return await response.text()
        }
        catch { /* Bind/startup is asynchronous. Assertions below never retry. */ }
        await Bun.sleep(25)
      }
      throw new Error('CSS persistence fixture failed to start')
    }
    const marker = (html: string) => /marker:([\w-]+)/.exec(html)?.[1]
    const cssUrl = (html: string) => {
      const url = /href="(\/_stx\/css\.[a-f0-9]{16}\.css)"/.exec(html)?.[1]
      expect(url).toBeDefined()
      return url!
    }
    const stylesheet = async (url: string) => {
      const response = await fetch(base + url)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/css')
      expect(response.headers.get('cache-control')).toContain('immutable')
      const css = await response.text()
      expect(css).toContain('.flex')
      expect(css).toContain('.gap-4')
      expect(css).toContain('.text-emerald-600')
      return css
    }
    const waitForPersisted = async (html: string) => {
      const cacheDir = path.join(state, 'render-cache')
      const deadline = Date.now() + 5000
      let persisted = false
      while (Date.now() < deadline) {
        const files = await readdir(cacheDir).catch(() => [])
        for (const file of files.filter(name => name.endsWith('.json'))) {
          const entry = await Bun.file(path.join(cacheDir, file)).json().catch(() => null)
          if (entry?.html?.includes(`marker:${marker(html)}`)) persisted = true
        }
        if (persisted) break
        await Bun.sleep(25)
      }
      expect(persisted).toBe(true)
    }
    const first = await start()
    expect(marker(first)).toBeTruthy()
    const url = cssUrl(first)
    const css = await stylesheet(url)
    await waitForPersisted(first)
    await stop()

    const kept = await start()
    expect(marker(kept)).toBe(marker(first)) // A cache hit, not an unnoticed fresh render.
    expect(cssUrl(kept)).toBe(url)
    expect(await stylesheet(url)).toBe(css)
    const head = await fetch(base + url, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect((await fetch(base + '/_stx/css.0000000000000000.css')).status).toBe(404)
    await stop()

    // Models a pre-fix HTML cache (or separately cleared generated assets).
    await rm(path.join(state, 'css-assets'), { recursive: true, force: true })
    const recovered = await start()
    expect(marker(recovered)).not.toBe(marker(first))
    expect(cssUrl(recovered)).toBe(url)
    expect(await stylesheet(url)).toBe(css)
    await stop()

    // CSS storage can fail while the HTML cache remains writable. That render
    // must carry its stylesheet inline, and remain a usable cache hit later.
    await rm(path.join(state, 'css-assets'), { recursive: true, force: true })
    await Bun.write(path.join(state, 'css-assets'), 'not a directory')
    const inline = await start()
    expect(inline).toContain('<style data-css="generated">')
    expect(inline).toContain('.flex')
    expect(inline).not.toContain('/_stx/css.')
    await waitForPersisted(inline)
    await stop()
    const keptInline = await start()
    expect(marker(keptInline)).toBe(marker(inline))
    expect(keptInline).toContain('<style data-css="generated">')
    expect(keptInline).toContain('.gap-4')
  }
  finally { await stop(); await rm(root, { recursive: true, force: true }) }
}, 90_000)
