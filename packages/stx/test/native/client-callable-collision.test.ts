import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('keeps compound report interpolation reactive on the native runtime (#2119)', async () => {
  const { code } = await compileNativeScreen(`<script client>
const report = state({ status: 'ready' })
globalThis.reportProbe = report
</script><div><p>{{ report()?.status }}</p><p>{{ 'Status: ' + report()?.status }}</p><p>{{ (report())?.status }}</p></div>`, { name: 'ReportCollision' })
  const phone = mountNativeScreen(code, 'ReportCollision')
  try {
    await phone.settle()
    expect(phone.texts()).toEqual(expect.arrayContaining(['ready', 'Status: ready']))
    phone.context.reportProbe.set({ status: 'updated' })
    await phone.settle()
    expect(phone.texts()).toEqual(expect.arrayContaining(['updated', 'Status: updated']))
    expect(phone.texts()).not.toContain('Status: ready')
    expect(phone.mutationErrors).toEqual([])
  }
  finally {
    phone.unmount()
  }
}, 30_000)
