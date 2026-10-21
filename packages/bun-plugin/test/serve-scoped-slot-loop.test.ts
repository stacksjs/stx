import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'
import { scopedActionsCaller, scopedActionsTable } from '../../stx/test-utils/scoped-slot-actions-fixture'

it.each([
  ['plugin', 'development'],
  ['plugin', 'production'],
  ['core', 'development'],
  ['core', 'production'],
])('%s in %s serves real Buttons in scoped actions slots inside a client loop (#2101)', async (host, environment) => {
  const dir = createTempDir('stx-scoped-actions-http-')
  const port = freePort()
  let child: ReturnType<typeof Bun.spawn> | undefined
  let logs: Promise<string[]> | undefined
  try {
    await Bun.write(path.join(dir, 'components/Button.stx'), Bun.file(path.join(import.meta.dir, '../../components/src/ui/button/Button.stx')))
    await Bun.write(path.join(dir, 'components/Table.stx'), scopedActionsTable)
    await Bun.write(path.join(dir, 'views/control.stx'), scopedActionsCaller(false))
    await Bun.write(path.join(dir, 'views/actions.stx'), scopedActionsCaller())
    // Explicit source imports: do not accidentally verify an old dist build.
    const driver = host === 'plugin'
      ? `import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
import * as stx from ${JSON.stringify(path.join(import.meta.dir, '../../stx/src/index.ts'))}
await serve({ patterns: ['views'], componentsDir: 'components', port: ${port}, quiet: true, stxModule: stx })`
      : `import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../../stx/src/serve.ts'))}
await serve({ root: ${JSON.stringify(path.join(dir, 'views'))}, port: ${port}, watch: false, stxOptions: { componentsDir: ${JSON.stringify(path.join(dir, 'components'))} } })`
    await Bun.write(path.join(dir, 'driver.ts'), driver)
    child = Bun.spawn(['bun', 'driver.ts'], {
      cwd: dir,
      env: { ...process.env, APP_ENV: environment, NODE_ENV: environment },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    // Drain both pipes while the child runs; a hung renderer must not hang the test runner.
    logs = Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
    const base = `http://127.0.0.1:${port}`
    const deadline = Date.now() + 30_000
    while (true) {
      try {
        await fetch(`${base}/not-a-page`, { signal: AbortSignal.timeout(1000) })
        break
      }
      catch (error) {
        if (Date.now() > deadline || child.exitCode !== null)
          throw error
        await Bun.sleep(100)
      }
    }
    for (const [route, navigation] of [['control', false], ['actions', false], ['actions', true], ['actions', false]] as const) {
      const response = await fetch(`${base}/${route}`, {
        headers: navigation ? { 'X-STX-Router': 'true' } : {},
        signal: AbortSignal.timeout(15_000),
      })
      const body = await response.text()
      expect(response.status).toBe(200)
      expect(body).toContain('toolbar-control')
      if (route === 'actions') {
        expect(body).toContain('Edit')
        expect(body).toContain('edit(row)')
        expect(body).not.toContain('<Button')
        expect(body).not.toContain('<slot ')
      }
    }
  }
  finally {
    child?.kill()
    if (child)
      await child.exited
    const output = await logs
    if (output?.some(text => text.includes('Error')))
      console.error(output.join('\n'))
    await rm(dir, { recursive: true, force: true })
  }
}, 90_000)
