import { afterAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const dir = createTempDir('stx-native-updater-types-')
afterAll(() => rm(dir, { recursive: true, force: true }))

test('craft.updater is typed: an optional surface whose calls answer a status', async () => {
  const good = join(dir, 'updates.stx')
  const bad = join(dir, 'invalid.stx')
  const header = `import type { NativeCraft, NativeUpdateStatus } from '@stacksjs/stx/native'
const craft = (globalThis as typeof globalThis & { craft: NativeCraft }).craft`
  await Bun.write(good, `<script client>
${header}
async function update() {
  if (!craft.updater) return
  const now: NativeUpdateStatus = await craft.updater.status()
  const checked = await craft.updater.check()
  const version: string | undefined = checked.version
  const progress: number | undefined = checked.progress
  const stop: () => void = craft.updater.onChange((status) => { const state: NativeUpdateStatus['state'] = status.state; return state })
  if (checked.state === 'available' && checked.selfUpdating) await craft.updater.install()
  const done: void = await craft.updater.relaunch()
  return { now, version, progress, stop, done }
}
</script>`)
  await Bun.write(bad, `<script client>
${header}
craft.updater.check()
async function wrong() {
  const status = await craft.updater!.status()
  const state: 'ready' = status.state
  return state
}
</script>`)
  const result = await typecheckStxFiles([good, bad], { templates: false })
  expect(result.diagnostics.filter(d => d.file === good)).toEqual([])
  // Optional (18048: possibly undefined) and a state outside the union (2322).
  expect(result.diagnostics.filter(d => d.file === bad).map(d => d.code).sort()).toEqual([18048, 2322])
})
