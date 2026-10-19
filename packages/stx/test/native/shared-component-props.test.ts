import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

async function boot(source: string, components: Record<string, string>) {
  const root = createTempDir('stx-shared-props-')
  mkdirSync(path.join(root, 'components'))
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  for (const [name, content] of Object.entries(components))
    await Bun.write(path.join(root, 'components', `${name}.stx`), content)
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { root })
  const messages: any[] = []
  const errors: string[] = []
  const scope: any = {
    console: { error: (...args: unknown[]) => errors.push(args.map(String).join(' ')), warn() {}, log() {} },
    setTimeout, clearTimeout,
    __stxNativeBridge: {
      postMessage: (raw: string) => messages.push(JSON.parse(raw)),
      onMessage() {},
    },
  }
  vm.runInNewContext(code, scope)
  const settle = async () => { await Bun.sleep(5); scope.__stx_host.flush() }
  await settle()
  return { scope, errors, messages, settle, stop: () => scope.__stxNativeUnmount() }
}

describe('shared component reactive props on a DOM-free host (#2086)', () => {
  it('initializes real shared controls without a browser observer', async () => {
    const components: Record<string, string> = {}
    for (const [name, file] of Object.entries({ SharedButton: 'button/Button', SharedInput: 'input/TextInput', SharedSelect: 'select/Select' }))
      components[name] = await Bun.file(path.join(import.meta.dir, '../../../components/src/ui', `${file}.stx`)).text()
    const app = await boot('<div><SharedButton>Save</SharedButton><SharedInput value="Ada" /><SharedSelect /></div>', components)
    try {
      expect(app.errors).toEqual([])
      expect(app.messages.some(m => m.type === 'RENDER')).toBe(true)
    }
    finally { app.stop() }
  })

  it('keeps typed parent values and independent child instances reactive', async () => {
    const app = await boot(`<script client>
const first = state({ label: 'First' })
const second = state({ label: 'Second' })
window.probe = { first, second }
</script><div><Child :item="first" /><Child :item="second" /></div>`, {
      Child: `<script client>
const item = useReactiveProp('item', { label: 'Default' })
</script><p :text="item().label" />`,
    })
    try {
      const texts = () => app.messages.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations).flatMap(op => op.patch?.children ?? [])
      expect(texts()).toContain('First')
      expect(texts()).toContain('Second')
      app.messages.length = 0
      app.scope.probe.first.set({ label: 'Changed' })
      await app.settle()
      expect(texts()).toContain('Changed')
      expect(texts()).not.toContain('Second')
      expect(app.errors).toEqual([])
    }
    finally { app.stop() }
  })
})
