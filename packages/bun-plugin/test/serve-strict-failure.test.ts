import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { serve as serveCore } from '../../stx/src/serve'
import { freePort } from '../../stx/test-utils/test-port'

it('both HTTP hosts reject fatal layout validation without leaking source paths (#2097)', async () => {
  const dir = createTempDir('stx-strict-http-')
  const port = freePort()
  let child: ReturnType<typeof Bun.spawn> | undefined
  let core: Awaited<ReturnType<typeof serveCore>> | undefined
  try {
    await Bun.write(path.join(dir, 'layouts/app.stx'), '<html><body>@yield("content")</body></html>')
    await Bun.write(path.join(dir, 'views/index.stx'), `@extends('layouts/app')
@section('content')
<script>document.getElementById('private-strict-probe')</script>
<h1>must not return 200</h1>
@endsection`)
    const config = {
      strict: { enabled: true, failOnViolation: true },
      layoutsDir: path.join(dir, 'layouts'),
    }
    await Bun.write(path.join(dir, 'stx.config.ts'), `export default ${JSON.stringify(config)}`)
    core = await serveCore({ root: path.join(dir, 'views'), port: 0, watch: false, stxOptions: config })
    const serveSource = path.join(import.meta.dir, '../src/serve.ts')
    await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(serveSource)}
await serve({ patterns: ['views'], port: ${port}, quiet: true, renderCache: true, renderCacheVary: 'source' })`)
    child = Bun.spawn(['bun', 'driver.ts'], {
      cwd: dir,
      env: { ...process.env, APP_ENV: 'production', NODE_ENV: 'production' },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const base = `http://127.0.0.1:${port}`
    const deadline = Date.now() + 30_000
    while (true) {
      try {
        await fetch(`${base}/not-a-page`)
        break
      }
      catch (error) {
        if (Date.now() > deadline)
          throw error
        await Bun.sleep(100)
      }
    }
    for (const url of [core.url, base]) {
      for (const headers of [{}, { 'X-STX-Router': 'true' }, {}]) {
        const response = await fetch(url, { headers })
        const body = await response.text()
        expect(response.status).toBe(500)
        expect(body).toContain('Internal Server Error')
        expect(body).not.toContain(dir)
        expect(body).not.toContain('getElementById')
        expect(body).not.toContain('layouts/app')
        expect(body).not.toContain('private-strict-probe')
      }
    }
    child.kill()
    await child.exited
    const diagnostic = await new Response(child.stderr).text()
    expect(diagnostic).toContain('DOM API violation')
    expect(diagnostic).toContain('getElementById')
  }
  finally {
    child?.kill()
    if (child)
      await child.exited
    core?.stop()
    await rm(dir, { recursive: true, force: true })
  }
}, 60_000)
