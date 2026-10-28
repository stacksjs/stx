import { describe, expect, test } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe('native field and style missing-name diagnostics (#2132)', () => {
  for (const minify of [false, true]) {
    test(`diagnoses fields and styles without changing their healthy siblings (minify=${minify})`, async () => {
      const compiled = await compileNativeScreen(`<script client>
const value = state('seed')
window.probe = { value }
</script>
<div>
  <span :class="missingClass">class</span>
  <span :style="{ color: missingColor }">style</span>
  <input x-model="missingModel" />
  <Button :disabled="missingDisabled">Save</Button>
  <input x-model="value" testID="healthy" />
</div>`, { name: 'MissingFieldBindings', minify })
      const warnings: string[] = []
      const phone = mountNativeScreen(compiled.code, 'MissingFieldBindings', { globals: {
        console: { ...console, warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')) },
      } })
      try {
        await phone.settle()
        const unknown = () => warnings.filter(message => message.includes('unknown-binding:'))
        expect(unknown()).toHaveLength(4)
        for (const name of ['missingClass', 'missingColor', 'missingModel', 'missingDisabled']) {
          expect(unknown().filter(message => message.includes(`: ${name} is not in`))).toHaveLength(1)
        }
        expect(unknown().every(message => /MissingFieldBindings\.stx: n\d+:/.test(message))).toBe(true)
        expect(phone.byTestID('healthy')!.props.value).toBe('seed')
        phone.context.probe.value.set('updated')
        await phone.settle()
        expect(phone.byTestID('healthy')!.props.value).toBe('updated')
        expect(unknown()).toHaveLength(4)
      }
      finally { phone.unmount() }
    }, 30_000)
  }
})
