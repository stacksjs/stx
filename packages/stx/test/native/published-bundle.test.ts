import { afterAll, beforeAll, expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'

let directory: string

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'stx-published-native-'))
  const source = path.resolve(import.meta.dir, '../../src/native')
  const runtime = await Bun.build({
    entrypoints: [path.join(source, 'runtime/jsc-globals.ts'), path.join(source, 'runtime/shared-screen.ts')],
    outdir: path.join(directory, 'dist/native/runtime'), target: 'browser', format: 'esm', minify: false,
  })
  expect(runtime.success, runtime.logs.map(log => log.message).join('\n')).toBe(true)
  await cp(path.join(source, 'primitives'), path.join(directory, 'dist/native/primitives'), { recursive: true })
  for (const layout of ['native/compiler', '.']) {
    const compiler = await Bun.build({
      entrypoints: [path.join(source, 'compiler/bundle.ts')],
      outdir: path.join(directory, 'dist', layout), target: 'bun', format: 'esm', minify: true,
    })
    expect(compiler.success, compiler.logs.map(log => log.message).join('\n')).toBe(true)
  }
  await mkdir(path.join(directory, 'app'))
  await Bun.write(path.join(directory, 'app/Screen.stx'), `<script client>
const count = state(0)
function increment() { count.set(count() + 1) }
</script>
<View><Text :text="count" /><Button @click="increment()">Tap</Button></View>`)
})

afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

for (const layout of ['native/compiler', '.']) {
  test(`native screens compile and update through the ${layout === '.' ? 'bundled CLI' : 'published module'} artifact`, async () => {
    const { compileSharedScreenBundle } = await import(path.join(directory, 'dist', layout, 'bundle.js'))
    const { code } = await compileSharedScreenBundle(path.join(directory, 'app/Screen.stx'))
    const sent: any[] = []
    let receive: (message: string) => void = () => {}
    vm.runInNewContext(code, {
      console, Promise, Date, Map, Set, WeakMap, WeakSet,
      __stxNativeBridge: {
        postMessage: (raw: string) => sent.push(JSON.parse(raw)),
        onMessage: (callback: typeof receive) => { receive = callback },
      },
    })
    await Bun.sleep(0)
    const operations = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(operations).toContainEqual(expect.objectContaining({ patch: { children: ['0'] } }))
    const listener = operations.find(operation => operation.patch?.events?.onPress)
    expect(listener).toBeDefined()
    sent.length = 0
    receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: listener.patch.events.onPress, nativeEvent: {} } }))
    await Bun.sleep(0)
    const updates = sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
    expect(updates).toContainEqual(expect.objectContaining({ patch: { children: ['1'] } }))
  })
}
