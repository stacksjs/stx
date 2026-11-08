import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let componentsDir: string
beforeAll(async () => {
  componentsDir = await mkdtemp(join(tmpdir(), 'stx-component-progress-'))
  await Bun.write(join(componentsDir, 'badge.stx'), '<span>Resolved component</span>')
})
afterAll(async () => { await rm(componentsDir, { recursive: true, force: true }) })

// A synchronous parser loop also blocks test deadlines in its own process.
// Isolate this regression so a recurrence fails promptly and releases its CPU.
async function render(mode: string, template: string): Promise<string> {
  const child = Bun.spawn([process.execPath, join(import.meta.dir, 'fixtures/invalid-component-worker.ts'), mode, componentsDir, template], { stdout: 'pipe', stderr: 'pipe' })
  let timedOut = false
  const deadline = setTimeout(() => { timedOut = true; child.kill() }, 2000)
  try {
    const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    expect(timedOut).toBe(false)
    expect(exit, stderr).toBe(0)
    return JSON.parse(stdout)
  }
  finally { clearTimeout(deadline); child.kill() }
}

for (const mode of ['renderer', 'legacy']) {
  describe(`${mode} component directive progress`, () => {
    it('preserves malformed calls and still renders later valid components', async () => {
      const invalid = '@component() @component(path) @component(123) @component(\'\')'
      const output = await render(mode, `${invalid} @component('badge')`)
      expect(output).toContain(invalid)
      expect(output).toContain('<span>Resolved component</span>')
      expect(output).not.toContain("@component('badge')")
    })

    it('finishes a large literal document containing only an invalid call', async () => {
      const template = `${'ordinary text '.repeat(8000)}@component()`
      expect(await render(mode, template)).toBe(template)
    })
  })
}
