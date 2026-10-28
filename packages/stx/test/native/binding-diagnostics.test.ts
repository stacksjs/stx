import { describe, expect, spyOn, test } from 'bun:test'
import { createBindingDiagnostics } from '../../src/native/runtime/binding-diagnostics'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe('unknown native binding identifiers (#2132)', () => {
  test('recognizes both engine messages, but not undefined values or unrelated helper failures', () => {
    const warning = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const report = createBindingDiagnostics('/screens/Attribution.stx')
      const node = { __stxId: 'n197' }
      report(new ReferenceError('appAttribution is not defined'), '!appGym || appAttribution', {}, node)
      report(new ReferenceError('appAttribution is not defined'), '!appGym || appAttribution', {}, node)
      report({ name: 'ReferenceError', message: "Can't find variable: other" }, 'other', {}, node)
      report(new ReferenceError('known is not defined'), 'known', { known: undefined }, node)
      report(new TypeError('unknown is not defined'), 'unknown', {}, node)
      report(new ReferenceError('insideHelper is not defined'), 'format()', {}, node)
      expect(warning.mock.calls.map(call => call[0])).toEqual([
        '[STX Native] unknown-binding: /screens/Attribution.stx: n197: appAttribution is not in the setup scope ("!appGym || appAttribution")',
        '[STX Native] unknown-binding: /screens/Attribution.stx: n197: other is not in the setup scope ("other")',
      ])
    }
    finally { warning.mockRestore() }
  })

  for (const minify of [false, true]) {
    test(`names the expression, file and node without breaking healthy bindings (minify=${minify})`, async () => {
      const compiled = await compileNativeScreen(`<script client>
const tick = state(0)
const known = undefined
const rows = state([{ label: 'one' }])
window.probe = { tick, rows }
</script>
<div>
  <span testID="missing" :text="tick + missingLabel"></span>
  <span testID="healthy" :text="'count:' + tick"></span>
  <span :text="known"></span>
  <span :text="typeof optionalName"></span>
  <span :text="Math.max(1, tick)"></span>
  <span :text="rows.map(({ label }) => label).join(',')"></span>
  <span :for="(row, index) in rows" :text="index + ':' + row.label"></span>
</div>`, { name: 'UnknownBindings', minify })
      const warnings: string[] = []
      const phone = mountNativeScreen(compiled.code, 'UnknownBindings', { globals: {
        console: { ...console, warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')) },
      } })
      try {
        await phone.settle()
        expect(phone.texts()).toContain('count:0')
        expect(phone.texts()).toContain('0:one')
        const unknown = () => warnings.filter(message => message.includes('unknown-binding:'))
        expect(unknown()).toHaveLength(1)
        expect(unknown()[0]).toContain('UnknownBindings.stx')
        expect(unknown()[0]).toContain(`${phone.byTestID('missing')!.id}: missingLabel`)
        expect(unknown()[0]).toContain('tick + missingLabel')
        phone.context.probe.tick.set(1)
        await phone.settle()
        expect(phone.texts()).toContain('count:1')
        expect(unknown()).toHaveLength(1)
      }
      finally { phone.unmount() }
    }, 30_000)
  }
})
