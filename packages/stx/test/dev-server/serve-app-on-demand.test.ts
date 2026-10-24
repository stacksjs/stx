import { afterAll, beforeAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { freePort } from '../../../stx/test-utils/test-port'
import { createTempDir } from '../../src/temp-dir'

const port = freePort()
const directory = createTempDir('stx-on-demand-')
let child: ReturnType<typeof Bun.spawn>
let output: Promise<string>
beforeAll(async () => {
  await Bun.write(join(directory, 'pages/index.stx'), '<h1>Requested page</h1>')
  await Bun.write(join(directory, 'pages/retired.stx'), '<script server>setResponseStatus(410)</script><h1>Retired</h1>')
  await Bun.write(join(directory, 'pages/unused.stx'), '<script server>throw new Error("UNREQUESTED_PAGE_RENDERED")</script>')
  await Bun.write(join(directory, 'pages/item/[id].stx'), '<script server>const label = params.id</script><h1>{{ label }}</h1>')
  await Bun.write(join(directory, 'driver.ts'), `import { serveApp } from ${JSON.stringify(join(import.meta.dir, '../../src/dev-server/serve-app.ts'))}; await serveApp(${JSON.stringify(directory)}, { port: ${port}, hostname: '127.0.0.1', prebuild: false, watch: false, hotReload: false })`)
  child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: directory, stdout: 'ignore', stderr: 'pipe' })
  output = new Response(child.stderr).text()
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    try { if ((await fetch(`http://127.0.0.1:${port}/`)).ok) return }
    catch {}
    await Bun.sleep(50)
  }
  throw new Error('On-demand server did not start')
}, 25_000)
afterAll(async () => {
  child?.kill()
  if (child) await child.exited
  expect(await output).not.toContain('UNREQUESTED_PAGE_RENDERED')
  await rm(directory, { recursive: true, force: true })
})
test('renders static pages on first request and preserves their decided status', async () => {
  expect(await (await fetch(`http://127.0.0.1:${port}/`)).text()).toContain('Requested page')
  for (let index = 0; index < 2; index++) {
    const response = await fetch(`http://127.0.0.1:${port}/retired`)
    expect(response.status).toBe(410)
    expect(await response.text()).toContain('Retired')
  }
})
test('renders each dynamic request with its own route parameters', async () => {
  for (const id of ['first', 'second'])
    expect(await (await fetch(`http://127.0.0.1:${port}/item/${id}`)).text()).toContain(`<h1>${id}</h1>`)
})
