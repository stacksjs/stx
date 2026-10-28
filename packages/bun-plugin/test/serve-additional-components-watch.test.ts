import { expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

it.each(['options', 'config'])('watches additional component roots supplied through %s without watchDirs', async (source) => {
  const root = createTempDir('stx-component-watch-')
  const port = freePort()
  const base = `http://127.0.0.1:${port}`
  let child: ReturnType<typeof Bun.spawn> | undefined
  const abort = new AbortController()
  try {
    const directories = ['missing-components', 'framework-components', 'second-components']
    await mkdir(path.join(root, 'views'), { recursive: true })
    for (const directory of directories.slice(1))
      await mkdir(path.join(root, directory), { recursive: true })
    await writeFile(path.join(root, 'views/index.stx'), '<main><FrameworkWatchProbe /><SecondWatchProbe /></main>')
    await writeFile(path.join(root, 'framework-components/FrameworkWatchProbe.stx'), '<p>first-before</p>')
    await writeFile(path.join(root, 'second-components/SecondWatchProbe.stx'), '<p>second-before</p>')
    await writeFile(path.join(root, 'stx.config.ts'), `export default ${JSON.stringify(source === 'config' ? { additionalComponentsDirs: directories } : {})}`)
    await writeFile(path.join(root, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
import * as stx from ${JSON.stringify(path.join(import.meta.dir, '../../stx/src/index.ts'))}
serve({ patterns: ['views'], port: ${port}, quiet: true, watch: true, stxModule: stx,
  ${source === 'options' ? `additionalComponentsDirs: ${JSON.stringify(directories)},` : ''}
})
`)
    child = Bun.spawn(['bun', 'driver.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_ENV: 'development' } })
    const deadline = Date.now() + 15_000
    let initial = ''
    while (Date.now() < deadline) {
      try {
        initial = await (await fetch(base, { signal: AbortSignal.timeout(1000) })).text()
        if (initial.includes('first-before') && initial.includes('second-before')) break
      }
      catch { /* Wait for this fixture server, not an arbitrary open port. */ }
      await Bun.sleep(50)
    }
    expect(initial).toContain('first-before')
    expect(initial).toContain('second-before')
    const stream = await fetch(`${base}/_stx/hmr`, { signal: abort.signal })
    expect(stream.status).toBe(200)
    const reader = stream.body!.getReader()
    const decoder = new TextDecoder()
    let buffered = ''
    async function event(type: string, file?: string): Promise<{ type: string, file?: string }> {
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        return await Promise.race([
          (async () => {
            while (true) {
              let boundary: number
              while ((boundary = buffered.indexOf('\n\n')) !== -1) {
                const message = buffered.slice(0, boundary)
                buffered = buffered.slice(boundary + 2)
                const data = message.split('\n').find(line => line.startsWith('data:'))
                if (!data) continue
                const value = JSON.parse(data.slice(5)) as { type: string, file?: string }
                if (value.type === type && (!file || value.file?.endsWith(file))) return value
              }
              const chunk = await reader.read()
              if (chunk.done) throw new Error('HMR stream closed before the expected edit')
              buffered += decoder.decode(chunk.value, { stream: true })
            }
          })(),
          new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => reject(new Error(`No ${type} HMR event for ${file ?? 'connection'}`)), 3000) }),
        ])
      }
      finally { clearTimeout(timeout) }
    }
    await event('connected')
    for (const [file, marker] of [
      ['framework-components/FrameworkWatchProbe.stx', 'first-after'],
      ['second-components/SecondWatchProbe.stx', 'second-after'],
    ]) {
      await writeFile(path.join(root, file), `<p>${marker}</p>`)
      expect((await event('fragment', path.basename(file))).type).toBe('fragment')
      expect(await (await fetch(base)).text()).toContain(marker)
    }
  }
  finally {
    abort.abort()
    child?.kill()
    if (child) await child.exited
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
