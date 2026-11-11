import { expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

it('loads the image helper before an optional worker provider and reports provider failure once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stx-image-provider-'))
  try {
    const source = join(import.meta.dir, '../../src/builtins/image-worker.ts')
    const entry = join(directory, 'entry.ts')
    const helper = join(directory, 'image-worker.ts')
    const provider = join(directory, 'unavailable.ts')
    // A filesystem dependency avoids Bun's special built-in resolution. Only
    // the provider specifier changes; static versus deferred loading stays real.
    await writeFile(helper, (await readFile(source, 'utf8'))
      .replace(/(['"])node:worker_threads\1/g, JSON.stringify(provider))
      .replace(/(['"])\.\.\/installed-entry\1/g, JSON.stringify(join(import.meta.dir, '../../src/installed-entry.ts'))))
    await writeFile(provider, `globalThis.__imageWorkerProviderLoads = (globalThis.__imageWorkerProviderLoads ?? 0) + 1; throw new Error('image worker provider refusal witness'); export const Worker = undefined;`)
    await writeFile(entry, `import { runImageTask, WORKER_UNAVAILABLE } from ${JSON.stringify(helper)}
if ((globalThis.__imageWorkerProviderLoads ?? 0) !== 0) throw new Error('provider loaded during cold import')
const warnings = []
console.warn = (...args) => warnings.push(args.join(' '))
const first = await runImageTask('delivery', {})
const second = await runImageTask('placeholders', {})
console.log(JSON.stringify({ loaded: true, unavailable: first === WORKER_UNAVAILABLE && second === WORKER_UNAVAILABLE, providerAttempted: globalThis.__imageWorkerProviderLoads > 0, warnings }))
`)
    const child = Bun.spawn([process.execPath, entry], { cwd: directory, stdout: 'pipe', stderr: 'pipe' })
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    expect(code, stderr).toBe(0)
    const report = JSON.parse(stdout.trim())
    expect(report.loaded).toBe(true)
    expect(report.unavailable).toBe(true)
    expect(report.providerAttempted).toBe(true)
    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0]).toContain('image worker provider refusal witness')
  }
  finally {
    await rm(directory, { recursive: true, force: true })
  }
})
