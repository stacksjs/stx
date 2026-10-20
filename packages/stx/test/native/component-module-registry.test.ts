import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { rm } from 'node:fs/promises'

it.each([false, true])('embeds component helper modules once before native setup (minify=%s)', async (minify) => {
  const root = createTempDir('native-module-registry-')
  try {
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(join(root, 'counter.ts'), 'let count = 0; export const next = () => ++count')
    await Bun.write(join(root, 'components/Probe.stx'), `<script client>
import { next } from '../counter'
const value = state(next())
</script><p x-text="value"></p>`)
    await Bun.write(join(root, 'Screen.stx'), '<div><Probe /><Probe /></div>')
    const result = await compileSharedScreenBundle(join(root, 'Screen.stx'), { root, minify })
    expect(result.dependencies).toContain(join(root, 'counter.ts'))
    const phone = mountNativeScreen(result.code)
    try {
      await phone.settle()
      expect(phone.texts()).toContain('1')
      expect(phone.texts()).toContain('2')
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)
