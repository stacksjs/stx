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
      report(new ReferenceError("Cannot access 'pending' before initialization"), 'pending', {}, node)
      expect(warning.mock.calls.map(call => call[0])).toEqual([
        '[STX Native] unknown-binding: /screens/Attribution.stx: n197: appAttribution is not in the setup scope ("!appGym || appAttribution")',
        '[STX Native] unknown-binding: /screens/Attribution.stx: n197: other is not in the setup scope ("other")',
      ])
    }
    finally { warning.mockRestore() }
  })

  for (const minify of [false, true]) {
    test(`reports evaluated structural names and stays silent on valid nested scopes (minify=${minify})`, async () => {
      const compiled = await compileNativeScreen(`<script client>
function setup() { const appAttribution = true; return { appGym: state(true) } }
const { appGym } = setup()
const tick = state(0)
const deferred = state(false)
const rows = state([{ label: 'one' }])
window.probe = { appGym, tick, deferred }
</script>
<div>
  <span :if="!appGym || appAttribution">attribution</span>
  <span :if="missingPositive">positive</span>
  <span :if="!missingNegative">negative</span>
  <span :if="tick > 0">first</span><span :else-if="missingBranch">second</span><span :else>fallback</span>
  <span :show="tick + missingVisible">shown</span>
  <span :for="row in missingRows" :text="row.label"></span>
  <span :if="deferred && laterMissing">deferred</span>
  <div :for="(row, index) in rows"><span :if="row.label && index === 0">valid row</span></div>
  <span testID="healthy" :text="tick"></span>
</div>`, { name: 'MissingConditions', minify })
      const warnings: string[] = []
      const phone = mountNativeScreen(compiled.code, 'MissingConditions', { globals: {
        console: { ...console, warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')) },
      } })
      try {
        await phone.settle()
        const unknown = () => warnings.filter(message => message.includes('unknown-binding:'))
        expect(unknown()).toHaveLength(6)
        for (const name of ['appAttribution', 'missingPositive', 'missingNegative', 'missingBranch', 'missingVisible', 'missingRows']) {
          expect(unknown().filter(message => message.includes(`: ${name} is not in`))).toHaveLength(1)
        }
        expect(unknown().every(message => /MissingConditions\.stx: n\d+:/.test(message))).toBe(true)
        expect(phone.texts()).toContain('valid row')
        phone.context.probe.tick.set(1)
        await phone.settle()
        expect(phone.texts()).toContain('first')
        expect(unknown()).toHaveLength(6)
        phone.context.probe.deferred.set(true)
        await phone.settle()
        expect(unknown()).toHaveLength(7)
        expect(unknown()[6]).toContain(': laterMissing is not in the setup scope')
      }
      finally { phone.unmount() }
    }, 30_000)

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
  <span :text="/missingRegex/.test('missingLiteral') ? 'literal' : 'safe'"></span>
  <span :text="({ arbitraryKey: 1 }).arbitraryKey"></span>
  <span :text="(() => { const local = 'local'; return local })()"></span>
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
        expect(phone.texts()).toContain('local')
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

  test('a broken diagnostic sink cannot break hydration or later healthy updates', async () => {
    const compiled = await compileNativeScreen(`<script client>
const count = state(0)
window.probe = { count }
</script><div><span :text="missingSink"></span><span :text="'healthy:' + count"></span></div>`, { name: 'BrokenDiagnosticSink' })
    let attempted = 0
    const phone = mountNativeScreen(compiled.code, 'BrokenDiagnosticSink', { globals: {
      console: { ...console, warn: () => { attempted++; throw new Error('sink unavailable') } },
    } })
    try {
      await phone.settle()
      expect(attempted).toBe(1)
      expect(phone.texts()).toContain('healthy:0')
      phone.context.probe.count.set(1)
      await phone.settle()
      expect(phone.texts()).toContain('healthy:1')
    }
    finally { phone.unmount() }
  }, 30_000)
})
