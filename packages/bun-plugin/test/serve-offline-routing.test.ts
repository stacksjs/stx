import { afterAll, beforeAll, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

setDefaultTimeout(60_000)

const port = freePort()
const base = `http://localhost:${port}`
const source = path.join(import.meta.dir, '..', 'src', 'serve.ts')
let directory: string
let process: ReturnType<typeof Bun.spawn> | undefined

beforeAll(async () => {
  directory = createTempDir('stx-offline-routing-')
  await Bun.write(path.join(directory, 'views/workouts/library.stx'), '<main>Workout library</main>')
  await Bun.write(path.join(directory, 'views/workouts/[id].stx'), '<main>Workout</main>')
  await Bun.write(path.join(directory, 'stx.config.ts'), 'export default { offline: { enabled: true, pages: [], routes: ["/workouts/:id"] } }')
  await Bun.write(path.join(directory, 'driver.ts'), `import { serve } from ${JSON.stringify(source)}
await serve({ patterns: ['views'], port: ${port} })
`)
  process = Bun.spawn(['bun', 'driver.ts'], { cwd: directory, stdout: 'pipe', stderr: 'pipe' })
  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${base}/workouts/library`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('The file server never started')
      await Bun.sleep(120)
    }
  }
})

afterAll(async () => {
  process?.kill()
  await rm(directory, { recursive: true, force: true })
})

it('gives the offline worker literal routes without adding them to its precache', async () => {
  const response = await fetch(`${base}/_stx/sw.js`)
  expect(response.status).toBe(200)
  const worker = await response.text()
  const settings = JSON.parse(worker.match(/var S = (\{.*\});/)![1]!)
  expect(settings.exactPages).toContain('/workouts/library')
  expect(settings.exactPages).not.toContain('/workouts/[id]')
  expect(settings.pages).toEqual([])
  expect(settings.routes.map((route: { path: string }) => route.path)).toEqual(['/workouts/:id'])
})
