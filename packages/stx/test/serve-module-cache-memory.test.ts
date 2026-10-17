import path from 'node:path'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'bun:test'
import { createTempDir } from '../src/temp-dir'

it('bounds retained module code by bytes while preserving disk and large-bundle fallbacks', async () => {
  const root = createTempDir('stx-module-cache-memory-')
  try {
    const caching = fileURLToPath(new URL('../src/caching.ts', import.meta.url))
    const state = fileURLToPath(new URL('../src/state-dir.ts', import.meta.url))
    const script = `
      import { registerServeModuleBundle, getServeModuleBundle } from ${JSON.stringify(caching)}
      import { stateDir } from ${JSON.stringify(state)}
      import { unlinkSync } from 'node:fs'
      const code = index => ['export const index = ', index, '; //', ' '.repeat(1024 * 1024)].join('')
      const hash = url => url.slice('/_stx/modules.'.length, -'.js'.length)
      const file = url => stateDir(process.cwd(), 'module-bundles', [hash(url), '.js'].join(''))
      const urls = Array.from({ length: 10 }, (_, index) => registerServeModuleBundle(code(index)))
      for (let index = 0; index < 50; index++) registerServeModuleBundle(code(0))
      unlinkSync(file(urls[9]))
      const duplicateRefreshRetainsOthers = getServeModuleBundle(hash(urls[9])) === code(9)
      for (let index = 10; index < 20; index++) urls.push(registerServeModuleBundle(code(index)))
      const diskFallback = getServeModuleBundle(hash(urls[1])) === code(1)
      unlinkSync(file(urls[1]))
      const oldestEvicted = getServeModuleBundle(hash(urls[1])) === undefined
      unlinkSync(file(urls[19]))
      const recentRetained = getServeModuleBundle(hash(urls[19])) === code(19)
      const large = ['export const large = true; //', ' '.repeat(17 * 1024 * 1024)].join('')
      const largeUrl = registerServeModuleBundle(large)
      unlinkSync(file(largeUrl))
      const largeFallback = getServeModuleBundle(hash(largeUrl)) === large
      const previousEvicted = getServeModuleBundle(hash(urls[19])) === undefined
      console.log(JSON.stringify({ diskFallback, oldestEvicted, recentRetained, largeFallback, previousEvicted, duplicateRefreshRetainsOthers }))
    `
    const child = Bun.spawn([process.execPath, '-e', script], { cwd: root, env: { ...process.env, STX_DIR: path.join(root, 'state') }, stdout: 'pipe', stderr: 'pipe' })
    const [output, error] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
    expect(await child.exited, error).toBe(0)
    expect(JSON.parse(output)).toEqual({ diskFallback: true, oldestEvicted: true, recentRetained: true, largeFallback: true, previousEvicted: true, duplicateRefreshRetainsOthers: true })
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})
