import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createNode } from '../../src/native/compiler/ir'
import { createNativeHost } from '../../src/native/runtime/native-host'
import { createTempDir } from '../../src/temp-dir'

describe('authored native reconciliation keys', () => {
  it('preserves the initial key when a production conditional creates its replacement', async () => {
    const root = createTempDir('stx-native-authored-keys-')
    const file = path.join(root, 'Keys.stx')
    await Bun.write(file, `<script>
const safe = state(false)
globalThis.toggleKeyProbe = () => safe.set(!safe())
</script>
<View>
  <View :if="!safe()" key="retained-container" testID="key-probe"><Text>Plain</Text></View>
  <SafeAreaView :if="safe()" key="retained-container" testID="key-probe"><Text>Safe</Text></SafeAreaView>
</View>`)
    const { code } = await compileSharedScreenBundle(file, { minify: true })
    const messages: any[] = []
    const scope: Record<string, any> = {
      console, Promise, Date, Map, Set, WeakMap, WeakSet,
      __stxNativeBridge: { platform: 'android', capabilityProtocolVersion: 1, capabilities: [],
        postMessage: (raw: string) => messages.push(JSON.parse(raw)), onMessage() {} },
    }
    vm.runInNewContext(code, scope)
    const settle = async () => { for (let i = 0; i < 6; i++) await Bun.sleep(0) }
    await settle()
    function find(node: any): any {
      if (node?.props?.testID === 'key-probe') return node
      for (const child of node?.children ?? []) {
        const found = find(child)
        if (found) return found
      }
    }
    expect(find(messages.find(message => message.type === 'RENDER')?.payload.document)?.key).toBe('retained-container')
    for (const type of ['SafeAreaView', 'View', 'SafeAreaView']) {
      const before = messages.length
      scope.toggleKeyProbe()
      await settle()
      const created = messages.slice(before).flatMap(message => message.payload?.operations ?? [])
        .find(operation => operation.op === 'createNode' && operation.node?.props?.testID === 'key-probe')
      expect(created?.node.type).toBe(type)
      expect(created?.node.key).toBe('retained-container')
    }
  })

  it('retains authored keys through cloning, removal and rematerialization', () => {
    const operations: any[] = []
    const host = createNativeHost({ send: batch => operations.push(...batch), schedule() {} })
    const parent = host.adopt({ __stxId: 'root' }, 'View')
    const descriptor = createNode('TextInput')
    descriptor.key = 'draft-key'
    const original = host.adopt({ __stxId: 'original' }, 'TextInput', undefined, descriptor)
    const cloned = host.clone(original)
    host.insert(parent, cloned)
    host.flush()
    expect(operations.find(operation => operation.op === 'createNode' && operation.id === cloned.__stxId)?.node.key).toBe('draft-key')
    host.remove(cloned)
    host.flush()
    operations.length = 0
    host.insert(parent, cloned)
    host.flush()
    expect(operations.find(operation => operation.op === 'createNode' && operation.id === cloned.__stxId)?.node.key).toBe('draft-key')
  })
})
