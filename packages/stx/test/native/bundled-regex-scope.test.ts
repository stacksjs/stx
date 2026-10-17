import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

// An inlined module's returned regex must not change the setup scope. The
// browser and device compiler both run this scope-extraction path.
describe('native screens with regex-returning imported helpers', () => {
  for (const minify of [false, true]) {
    it(`mounts the real bundle with minify=${minify}`, async () => {
      const root = createTempDir('stx-native-regex-scope-')
      await Bun.write(path.join(root, 'helper.ts'), `export function label(value) {
  return /}/.test(value) ? privateLabel() : 'miss';
}
function privateLabel() { return 'matched'; }
`)
      await Bun.write(path.join(root, 'Screen.stx'), `<script client>
import { label } from './helper'
const text = state(label('}'))
</script>
<View><Text testID="result" :text="text" /></View>`)
      const result = await compileNativeBundle({ root, screens: { Screen: 'Screen.stx' }, minify })
      const messages: any[] = []
      const scope = {
        console, setTimeout, clearTimeout,
        __stxNativeBridge: {
          platform: 'ios',
          postMessage: (raw: string) => messages.push(JSON.parse(raw)),
          onMessage() {},
        },
      }
      vm.runInNewContext(result.code, scope)
      await Bun.sleep(0)
      expect(messages.some(message => message.type === 'RENDER')).toBe(true)
      const operations = messages.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
      expect(operations).toContainEqual(expect.objectContaining({ patch: { children: ['matched'] } }))
    })
  }
})
