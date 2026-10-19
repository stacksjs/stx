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
  let receive: (message: string) => void = () => {}
  const scope: any = {
    console: { error: (...args: unknown[]) => errors.push(args.map(String).join(' ')), warn() {}, log() {} },
    setTimeout, clearTimeout,
    __stxNativeBridge: {
      postMessage: (raw: string) => messages.push(JSON.parse(raw)),
      onMessage(callback: typeof receive) { receive = callback },
    },
  }
  vm.runInNewContext(code, scope)
  const settle = async () => { await Bun.sleep(5); scope.__stx_host.flush() }
  await settle()
  const press = async () => {
    const operation = messages.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations).find(op => op.patch?.events?.onPress)
    expect(operation).toBeTruthy()
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: operation.patch.events.onPress, nativeEvent: {} } }))
    await settle()
  }
  const fireControl = async (type: string, event: string, payload: unknown) => {
    const nodes: any[] = []
    const visit = (node: any) => { if (typeof node === 'string') return; nodes.push(node); node.children.forEach(visit) }
    messages.filter(m => m.type === 'RENDER').forEach(m => visit(m.payload.document))
    const control = nodes.find(n => n.type === type)
    expect(control).toBeTruthy()
    const operations = messages.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations)
    const listener = operations.slice().reverse().find(op => op.id === control.id && op.patch?.events?.[event])
    expect(listener).toBeTruthy()
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: listener.patch.events[event], nativeEvent: payload } }))
    await settle()
  }
  return { scope, errors, messages, settle, press, fireControl, stop: () => scope.__stxNativeUnmount() }
}

describe('shared component reactive props on a DOM-free host (#2086)', () => {
  it('operates the actual shared Switch and Checkbox and accepts parent resets (#2087)', async () => {
    const ui = path.join(import.meta.dir, '../../../components/src/ui')
    const app = await boot(`<script client>
const enabled = state(false)
const checked = state(false)
window.probe = { enabled, checked }
</script><div><SharedSwitch v-model:checked="enabled" label="Enabled" /><SharedCheckbox :checked="checked" @change="checked.set($event)" label="Agree" value="yes" /></div>`, {
      SharedSwitch: await Bun.file(path.join(ui, 'switch/Switch.stx')).text(),
      SharedCheckbox: await Bun.file(path.join(ui, 'checkbox/Checkbox.stx')).text(),
    })
    try {
      await app.fireControl('Button', 'onPress', {})
      expect(app.scope.probe.enabled()).toBe(true)
      await app.fireControl('Checkbox', 'onValueChange', { value: true })
      expect(app.scope.probe.checked()).toBe(true)
      app.scope.probe.enabled.set(false)
      app.scope.probe.checked.set(false)
      await app.settle()
      const operations = app.messages.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations)
      expect(operations).toContainEqual(expect.objectContaining({ patch: { props: { checked: false, value: false } } }))
      expect(app.errors).toEqual([])
    }
    finally { app.stop() }
  })
  it('remounts shared prop/model subscriptions and disposes them with the screen', async () => {
    const app = await boot(`<script client>
const visible = state(true)
const count = state(1)
window.probe = { visible, count }
window.mounts = 0
window.destroys = 0
</script><div><div :if="visible"><Child v-model:count="count" /></div></div>`, {
      Child: `<script client>
const count = useModel('count', { default: 0 })
window.child = count
onMount(() => { window.mounts++ })
onDestroy(() => { window.destroys++ })
</script><p :text="count" />`,
    })
    try {
      expect(app.scope.mounts).toBe(1)
      expect(app.scope.child()).toBe(1)
      app.scope.probe.visible.set(false)
      await app.settle()
      expect(app.scope.destroys).toBe(1)
      app.scope.probe.count.set(4)
      app.scope.probe.visible.set(true)
      await app.settle()
      expect(app.scope.mounts).toBe(2)
      expect(app.scope.child()).toBe(4)
      app.scope.child.set(7)
      await app.settle()
      expect(app.scope.probe.count()).toBe(7)
      app.stop()
      expect(app.scope.destroys).toBe(2)
      app.scope.child.set(99)
      expect(app.scope.probe.count()).toBe(7)
      expect(app.errors).toEqual([])
    }
    finally { app.stop() }
  })
  it('delivers child payloads to the parent and supports two-way models', async () => {
    const app = await boot(`<script client>
const count = state(2)
const received = []
window.probe = { count, received }
</script><div><Counter v-model:count="count" @saved="received.push($event)" /><p :text="count" /></div>`, {
      Counter: `<script client>
const count = useModel('count', { default: 0 })
const emit = defineEmits(['saved'])
function increment() { count.set(count() + 1); emit('saved', { count: count() }) }
</script><button @click="increment()" :text="count" />`,
    })
    try {
      await app.press()
      expect(app.errors).toEqual([])
      expect(app.scope.probe.count()).toBe(3)
      expect(JSON.parse(JSON.stringify(app.scope.probe.received))).toEqual([{ count: 3 }])
      app.scope.probe.count.set(8)
      await app.settle()
      await app.press()
      expect(app.scope.probe.count()).toBe(9)
      expect(app.errors).toEqual([])
    }
    finally { app.stop() }
  })
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
