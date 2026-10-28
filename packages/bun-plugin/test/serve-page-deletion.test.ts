import { expect, it } from 'bun:test'
import { rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

it.each(['file', 'nested directory', 'page root', 'moved page root'])('re-resolves page overrides after deleting the %s, including recreation', async (deletion) => {
  const root = createTempDir('stx-page-deletion-')
  const port = freePort()
  const base = `http://127.0.0.1:${port}`
  const app = path.join(root, 'app/pages')
  let child: ReturnType<typeof Bun.spawn> | undefined
  try {
    for (const pages of ['app/pages', 'framework/pages']) {
      await Bun.write(path.join(root, pages, 'index.stx'), `<p>${pages}-home</p>`)
      await Bun.write(path.join(root, pages, 'docs/index.stx'), `<p>${pages}-docs</p>`)
      await Bun.write(path.join(root, pages, 'items/[id].stx'), `<p>${pages}-item</p>`)
      await Bun.write(path.join(root, pages, 'docs/private.stx'), pages.startsWith('framework')
        ? '<script server>definePageMeta({ middleware: ["deny"] })</script><p>framework-secret</p>'
        : '<p>app-private-page</p>')
    }
    await Bun.write(path.join(app, 'only.stx'), '<p>app-only-page</p>')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
import * as stx from ${JSON.stringify(path.join(import.meta.dir, '../../stx/src/index.ts'))}
serve({ patterns: ['app/pages', 'framework/pages'], port: ${port}, quiet: true, watch: true, stxModule: stx,
  middleware: { deny: () => new Response('framework-denied', { status: 403 }) } })
`)
    child = Bun.spawn(['bun', 'driver.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_ENV: 'development' } })
    async function page(route: string, marker: string, status = 200, timeout = 5000): Promise<void> {
      const deadline = Date.now() + timeout
      let actual = { status: 0, body: '' }
      do {
        if (child && child.exitCode !== null)
          throw new Error(`Fixture server exited: ${await new Response(child.stderr as ReadableStream).text()}`)
        try {
          const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(1000) })
          actual = { status: response.status, body: await response.text() }
        }
        catch {
          await Bun.sleep(25)
          continue // Allow server startup, not failed assertions.
        }
        expect(actual.body.includes('framework-secret')).toBe(false)
        if (actual.status === status && actual.body.includes(marker)) return
        await Bun.sleep(25)
      } while (Date.now() < deadline)
      expect(actual.status).toBe(status)
      expect(actual.body).toContain(marker)
    }
    await page('/', 'app/pages-home', 200, 15_000)
    await page('/docs', 'app/pages-docs')
    await page('/items/7', 'app/pages-item')
    await page('/only', 'app-only-page')
    await page('/docs/private', 'app-private-page')

    const removed = deletion === 'file'
      ? path.join(app, 'docs/index.stx')
      : deletion === 'nested directory' ? path.join(app, 'docs') : app
    if (deletion === 'moved page root')
      await rename(app, path.join(root, 'removed-pages'))
    else
      await rm(removed, { recursive: true })
    if (deletion !== 'file')
      await page('/docs/private', 'framework-denied', 403)
    await page('/docs', 'framework/pages-docs')
    if (deletion.endsWith('page root')) {
      await page('/', 'framework/pages-home')
      await page('/items/7', 'framework/pages-item')
      await page('/only', 'Page not found', 404)
    }
    else {
      await page('/', 'app/pages-home')
    }

    await Bun.write(path.join(app, 'docs/index.stx'), '<p>recreated-app-page</p>')
    await page('/docs', 'recreated-app-page')
    await Bun.write(path.join(app, 'docs/index.stx'), '<p>edited-recreated-app-page</p>')
    await page('/docs', 'edited-recreated-app-page')
  }
  finally {
    child?.kill()
    if (child) await child.exited
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
