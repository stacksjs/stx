import { describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { slotPresenceProbe } from '../../test-utils/slot-presence-fixture'

describe.each([false, true])('native slot presence (minify=%s)', (minify) => {
  it('keeps per-instance presence available to compound reactive conditions', async () => {
    const root = createTempDir('stx-native-slots-')
    try {
      await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
      await Bun.write(path.join(root, 'components/Probe.stx'), slotPresenceProbe)
      const file = path.join(root, 'Screen.stx')
      await Bun.write(file, `<div><Probe><template #actions><p>Action</p></template></Probe><Probe /></div>`)
      const { code } = await compileSharedScreenBundle(file, { root, minify })
      const phone = mountNativeScreen(code, 'Screen')
      try {
        await phone.settle()
        const count = (text: string) => phone.all().filter(node => node.children.includes(text)).length
        expect(count('OR')).toBe(1)
        expect(count('BRACKET')).toBe(1)
        expect(count('AND')).toBe(0)
        expect(count('NOT')).toBe(0)
        expect(count('provided')).toBe(1)
        expect(count('absent')).toBe(1)
        const toggles = phone.ofType('Button')
        expect(toggles).toHaveLength(2)
        phone.press(toggles[1])
        await phone.settle()
        expect(count('OR')).toBe(2)
        expect(count('NOT')).toBe(1)
        expect(count('AND')).toBe(0)
        phone.press(toggles[0])
        await phone.settle()
        expect(count('AND')).toBe(1)
      }
      finally {
        phone.unmount()
      }
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  }, 30_000)
})
