import { afterEach, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { generateStaticSite } from '../src/ssg'

const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

for (const [label, meta, rendered] of [
  ['expression refusal', 'validate: () => false', false],
  ['block refusal', 'validate: () => { return false }', false],
  ['async block refusal', 'validate: async () => { return false }', false],
  ['method refusal', 'validate() { return false }', false],
  ['block acceptance', 'validate: () => { return true }', true],
  ['async acceptance', 'validate: async () => true', true],
  ['validation error recovery', 'validate: () => { throw new Error("unavailable") }', true],
  ['nonfunction metadata', 'validate: false', true],
] as const) {
  it(`uses parsed page metadata for SSG ${label}`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-ssg-validation-'))
    roots.push(root)
    const pagesDir = path.join(root, 'pages')
    const outputDir = path.join(root, 'out')
    await Bun.write(path.join(pagesDir, 'index.stx'), `<script>definePageMeta({ ${meta} })</script><main>validated</main>`)
    const result = await generateStaticSite({
      pagesDir,
      outputDir,
      cache: false,
      sitemap: false,
      robots: false,
      generate404: false,
      cleanOutput: true,
    })
    expect(result.totalPages).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(rendered ? 1 : 0)
    expect(await Bun.file(path.join(outputDir, 'index.html')).exists()).toBe(rendered)
  })
}
