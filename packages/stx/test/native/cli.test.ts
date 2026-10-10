/**
 * `stx native compile` runs (stacksjs/stx#1985, then the move into stx).
 *
 * The native compiler used to be its own package with its own CLI, whose
 * `src/cli/index.ts` did not parse. Line 695 sat in the template text of a code
 * generator and emitted an unescaped backtick, which closed the generator's own
 * literal and left the rest of the function to be parsed as code. Every
 * invocation - `compile`, `build`, `run`, `dev`, `init` - failed before doing
 * anything, so the package's entry point had never once executed.
 *
 * Behind that, nothing it guarded had been exercised either: `run()` read
 * `args[1]` as a subcommand and began flag parsing at `args[2]`, which works
 * for `run ios` and eats the only argument of `compile <file>`.
 *
 * These spawn the entry point as a subprocess rather than importing it. The bug
 * was a parse error, and a test that imports a module it expects to be broken
 * proves less than one that runs it the way a person does.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { compileLegacyScreenBundle } from '../../src/native/compiler/bundle'

const CLI = path.join(import.meta.dir, '..', '..', 'bin', 'cli.ts')

const SCREEN = `<script>
function greet() {
  console.log('hi')
}
</script>
<template>
  <View class="p-4">
    <Text class="text-lg">Hello</Text>
  </View>
</template>
`

/** `stx native <args>`, from source. */
async function runCli(args: string[], cwd?: string): Promise<{ code: number, stdout: string, stderr: string }> {
  const proc = Bun.spawn([process.execPath, CLI, 'native', ...args], {
    cwd: cwd ?? import.meta.dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  return { code: await proc.exited, stdout, stderr }
}

async function project(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-cli-'))
  await Bun.write(path.join(root, 'Screen.stx'), SCREEN)
  return root
}

describe('stx native', () => {
  it('answers --help with exit 0', async () => {
    const { code, stdout, stderr } = await runCli(['--help'])
    expect(stderr).not.toContain('error:')
    expect(code).toBe(0)
    expect(stdout).toContain('stx native compile')
  })

  it('exits non-zero on an unknown action', async () => {
    const { code, stderr } = await runCli(['definitely-not-a-command'])
    expect(code).not.toBe(0)
    expect(stderr).toContain('Unknown native command')
  })

  it('receives the positional argument of compile <file>', async () => {
    // The routing bug answered "Please specify an input file" for a command
    // that specified one, because the file had been consumed as a subcommand.
    const root = await project()
    const { code, stdout, stderr } = await runCli(['compile', 'Screen.stx'], root)
    expect(stderr).not.toContain('Please specify an input file')
    expect(code).toBe(0)

    const ir = JSON.parse(stdout)
    expect(ir.root.type).toBe('View')
    expect(ir.root.style.padding).toBe(16)
    expect(ir.root.children[0].type).toBe('Text')
    expect(ir.root.children[0].style.fontSize).toBe(18)
  })

  it('compiles IR through stx directives and project components', async () => {
    const root = await project()
    await Bun.write(path.join(root, 'components', 'Greeting.stx'), `<script server>
const label = $props.label ?? 'missing'
</script>
<Text class="text-lg">{{ label }}</Text>`)
    await Bun.write(path.join(root, 'Screen.stx'), `<script server>
const visible = true
</script>
<View>@if(visible)<Greeting label="Rendered by stx" />@endif</View>`)

    const { code, stdout } = await runCli(['compile', 'Screen.stx'], root)
    expect(code).toBe(0)
    const ir = JSON.parse(stdout)
    expect(ir.root.children[0].type).toBe('Text')
    expect(ir.root.children[0].children).toEqual(['Rendered by stx'])
  })

  it('still reports a missing file rather than crashing', async () => {
    const { code, stderr } = await runCli(['compile'], await project())
    expect(code).not.toBe(0)
    expect(stderr).toContain('Please specify an input file')
  })

  it('keeps a flag after the positional', async () => {
    const root = await project()
    const output = path.join(root, 'ir.json')
    const { code } = await runCli(['compile', 'Screen.stx', '--output', output], root)
    expect(code).toBe(0)
    expect(JSON.parse(await Bun.file(output).text()).root.type).toBe('View')
  })

  it('writes an executable JavaScriptCore bundle when requested', async () => {
    const root = await project()
    const output = path.join(root, 'screen.js')
    const { code } = await runCli(['compile', 'Screen.stx', '--format', 'bundle', '--output', output], root)
    expect(code).toBe(0)
    const bundle = await Bun.file(output).text()
    expect(() => new Bun.Transpiler({ loader: 'js' }).transformSync(bundle)).not.toThrow()
  })
})

describe('the generated bundle', () => {
  /** One screen, compiled the way `compile <file> --format bundle` does. */
  async function generate(source: string): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-bundle-'))
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, source)
    return (await compileLegacyScreenBundle(file)).code
  }

  it('is valid JavaScript', async () => {
    // The whole bug: the generator's literal closed early, so what it emitted
    // was never checked against a parser either.
    const bundle = await generate(SCREEN)
    expect(() => new Bun.Transpiler({ loader: 'js' }).transformSync(bundle)).not.toThrow()
  })

  it('defers the message id to when the bundle runs, not when it was compiled', async () => {
    const bundle = await generate(SCREEN)
    const sent: Array<Record<string, any>> = []
    const before = Date.now()
    new Function('globalThis', bundle)({
      __stxNativeBridge: { postMessage: (raw: string) => { sent.push(JSON.parse(raw)) }, onMessage: () => {} },
    })
    const stamp = Number(/^render_(\d+)_/.exec(sent[0].id)?.[1])
    expect(stamp).toBeGreaterThanOrEqual(before)
  })

  it('carries the template and the handlers the script declared', async () => {
    const bundle = await generate(SCREEN)
    expect(bundle).toContain('__stxNative')
    expect(bundle).toContain('greet')
  })

  it('renders expressions after button and text-input events and answers a device API', async () => {
    const source = `<script>
let count = 0
let name = ''
let device = 'waiting'
function increment() { count++ }
function changeName(event) { name = event.text }
function loadDevice() {
  return globalThis.craft.device.getInfo().then(function(info) { device = info.model })
}
</script>
<template>
  <View>
    <Text>Count {count}</Text>
    <Text>Name {name}</Text>
    <Text>Device {device}</Text>
    <Button onPress={increment}>Increment</Button>
    <TextInput onChange={changeName} placeholder="Name" />
    <Button onPress={loadDevice}>Device</Button>
  </View>
</template>`
    const sent: Array<Record<string, any>> = []
    let callback: (message: Record<string, any>) => void = () => {}
    let synchronousReply = false
    const scope: Record<string, any> = {
      __stxNativeBridge: {
        postMessage: (raw: string) => {
          const message = JSON.parse(raw)
          sent.push(message)
          if (synchronousReply && message.type === 'API_REQUEST') {
            callback({ type: 'API_RESPONSE', correlationId: message.id, payload: { data: { model: 'Instant reply' } } })
          }
        },
        onMessage: (receiver: typeof callback) => { callback = receiver },
      },
    }
    new Function('globalThis', await generate(source))(scope)

    const rootText = () => sent.at(-1)?.payload.document.children.map((child: any) => child.children?.join('') || undefined)
    expect(rootText()).toEqual(['Count 0', 'Name ', 'Device waiting', 'Increment', undefined, 'Device'])

    callback({ type: 'EVENT', payload: { handlerName: 'increment', nativeEvent: {} } })
    expect(rootText()?.[0]).toBe('Count 1')

    callback({ type: 'EVENT', payload: { handlerName: 'changeName', nativeEvent: { text: 'Glenn' } } })
    expect(rootText()?.[1]).toBe('Name Glenn')

    callback({ type: 'EVENT', payload: { handlerName: 'loadDevice', nativeEvent: {} } })
    // A handler that returns a promise renders at once (so a busy flag set
    // before its await shows) and again when it settles.
    const request = sent.findLast(message => message.type === 'API_REQUEST')!
    expect(request.type).toBe('API_REQUEST')
    expect(request.payload).toEqual({ version: 1, module: 'Device', method: 'getInfo', args: [] })
    callback({ type: 'API_RESPONSE', correlationId: request.id, payload: { data: { model: 'iPhone Simulator' } } })
    await Promise.resolve()
    await Promise.resolve()
    expect(rootText()?.[2]).toBe('Device iPhone Simulator')

    // JavaScriptCore can call native synchronously. Its reply may come back
    // before postMessage returns, so the promise must already be registered.
    synchronousReply = true
    callback({ type: 'EVENT', payload: { handlerName: 'loadDevice', nativeEvent: {} } })
    await Promise.resolve()
    await Promise.resolve()
    expect(rootText()?.[2]).toBe('Device Instant reply')
  })

  it('emits versioned mutation batches when the native host advertises support', async () => {
    const source = `<script>
let count = 0
function increment() { count++ }
</script>
<template>
  <View>
    <Text testID="count">Count {count}</Text>
    <Button testID="increment" onPress={increment}>Increment</Button>
  </View>
</template>`
    const sent: Array<Record<string, any>> = []
    let callback: (message: Record<string, any>) => void = () => {}
    const scope: Record<string, any> = {
      __stxNativeBridge: {
        mutationProtocolVersion: 1,
        postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
        onMessage: (receiver: typeof callback) => { callback = receiver },
      },
    }
    new Function('globalThis', await generate(source))(scope)

    expect(sent[0].type).toBe('RENDER')
    expect(sent[0].payload.document.children[0].children.join('')).toBe('Count 0')

    callback({ type: 'EVENT', payload: { handlerName: 'increment', nativeEvent: {} } })
    const update = sent.at(-1)!
    expect(update.type).toBe('MUTATE')
    expect(update.payload).toMatchObject({ version: 1, baseRevision: 0, revision: 1 })
    expect(update.payload.operations).toEqual([{
      op: 'updateNode',
      id: 'root/key:count',
      patch: { children: ['Count ', '1'] },
    }])

    callback({ type: 'MUTATION_ERROR', payload: { code: 'REVISION_MISMATCH' } })
    const fallback = sent.at(-1)!
    expect(fallback.type).toBe('RENDER')
    expect(fallback.payload.document.children[0].children.join('')).toBe('Count 1')
  })

  it('materializes keyed FlatList templates and diffs list changes by item identity', async () => {
    const source = `<script>
let items = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Bun' }]
function shuffle() {
  items = [{ id: 'b', name: 'Bun updated' }, { id: 'c', name: 'Craft' }, { id: 'a', name: 'Ada' }]
}
function clear() { items = [] }
</script>
<template>
  <View>
    <FlatList testID="feed" data={items} keyExtractor={item.id} numColumns={2} onEndReached={shuffle}>
      <Text listRole="header">People</Text>
      <View listRole="item" accessibilityLabel={item.name}>
        <Text>{index}: {item.name}</Text>
        <Image source={{"uri":"avatar.png"}} />
      </View>
      <View listRole="separator"><Text>|</Text></View>
      <Text listRole="empty">Nobody</Text>
      <Text listRole="footer">End</Text>
    </FlatList>
  </View>
</template>`
    const sent: Array<Record<string, any>> = []
    let callback: (message: Record<string, any>) => void = () => {}
    const scope: Record<string, any> = {
      __stxNativeBridge: {
        mutationProtocolVersion: 1,
        postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
        onMessage: (receiver: typeof callback) => { callback = receiver },
      },
    }
    new Function('globalThis', await generate(source))(scope)

    expect(sent[0].type).toBe('RENDER')
    const initial = sent[0].payload.document
    expect(JSON.stringify(initial)).not.toContain('"_source"')
    expect(JSON.stringify(initial)).not.toContain('"_classes"')
    const created = (id: string) => {
      let found: Record<string, any> | undefined
      function visit(node: Record<string, any>): void {
        if (node.id === id) found = node
        node.children?.filter((child: unknown) => typeof child === 'object').forEach(visit)
      }
      visit(initial)
      return found
    }
    expect(created('root/key:feed').props).toEqual({ testID: 'feed', numColumns: 2, itemCount: 2 })
    expect(created('root/key:feed/key:a').props).toMatchObject({
      accessibilityLabel: 'Ada',
      key: 'a',
      listRole: 'item',
    })
    expect(created('root/key:feed/key:a/index:0').children.join('')).toBe('0: Ada')
    expect(created('root/key:feed/key:a/index:1').props.source).toEqual({ uri: 'avatar.png' })
    expect(created('root/key:feed/header').props.listRole).toBe('header')
    expect(created('root/key:feed/separator:a').props.listRole).toBe('separator')
    expect(created('root/key:feed/footer').props.listRole).toBe('footer')
    expect(created('root/key:feed/empty')).toBeUndefined()

    callback({ type: 'EVENT', payload: { handlerName: 'shuffle', nativeEvent: {} } })
    const shuffled = sent.at(-1)!.payload.operations
    expect(shuffled).toContainEqual(expect.objectContaining({
      op: 'moveChild', parentId: 'root/key:feed', childId: 'root/key:feed/key:b', index: 1,
    }))
    expect(shuffled).toContainEqual(expect.objectContaining({
      op: 'createNode', id: 'root/key:feed/key:c',
    }))
    expect(shuffled).toContainEqual(expect.objectContaining({
      op: 'updateNode', id: 'root/key:feed/key:b',
    }))

    callback({ type: 'EVENT', payload: { handlerName: 'clear', nativeEvent: {} } })
    const emptied = sent.at(-1)!.payload.operations
    expect(emptied).toContainEqual(expect.objectContaining({
      op: 'createNode', id: 'root/key:feed/empty',
    }))
    expect(emptied).toContainEqual({
      op: 'updateNode',
      id: 'root/key:feed',
      patch: { props: { testID: 'feed', numColumns: 2, itemCount: 0 } },
    })
  })

  it('exposes Craft clipboard and haptics with structured native errors', async () => {
    const source = `<script>
let ready = globalThis.craft.device.getInfo()
</script>
<template><View><Text>Native APIs</Text></View></template>`
    const sent: Array<Record<string, any>> = []
    let clipboard = ''
    let hapticsEnabled = false
    let callback: (message: Record<string, any>) => void = () => {}
    const scope: Record<string, any> = {
      __stxNativeBridge: {
        onMessage: (receiver: typeof callback) => { callback = receiver },
        postMessage: (raw: string) => {
          const message = JSON.parse(raw)
          sent.push(message)
          if (message.type !== 'API_REQUEST') return
          const { module, method, args } = message.payload
          let reply: Record<string, any>
          if (module === 'Device') {
            reply = { type: 'API_RESPONSE', payload: { data: { platform: 'ios' } } }
          }
          else if (module === 'Clipboard' && method === 'write' && typeof args[0] === 'string') {
            clipboard = args[0]
            reply = { type: 'API_RESPONSE', payload: { data: true } }
          }
          else if (module === 'Clipboard' && method === 'read') {
            reply = { type: 'API_RESPONSE', payload: { data: clipboard } }
          }
          else if (module === 'Haptics' && hapticsEnabled) {
            reply = { type: 'API_RESPONSE', payload: { data: true } }
          }
          else {
            const code = module === 'Haptics' ? 'CAPABILITY_DISABLED' : 'INVALID_ARGUMENT'
            reply = { type: 'API_ERROR', payload: { code, message: 'Native refusal' } }
          }
          callback({ ...reply, correlationId: message.id })
        },
      },
    }
    new Function('globalThis', await generate(source))(scope)
    expect(sent[0].payload).toEqual({ version: 1, module: 'Device', method: 'getInfo', args: [] })
    expect(await scope.craft.clipboard.write('Glenn')).toBe(true)
    expect(await scope.craft.clipboard.read()).toBe('Glenn')
    await expect(scope.craft.clipboard.write()).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
    await expect(scope.craft.haptic('heavy')).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED' })
    expect(await scope.craft.haptics.impact('light')).toBeUndefined()
    hapticsEnabled = true
    expect(await scope.craft.haptic('heavy')).toBe(true)
    expect(sent.findLast(message => message.type === 'API_REQUEST')?.payload).toEqual({ version: 1, module: 'Haptics', method: 'impact', args: ['heavy'] })
  })

  it('compiles named screens and keeps each route runtime independent', async () => {
    const root = await project()
    await Bun.write(path.join(root, 'native.config.json'), JSON.stringify({
      initialScreen: 'home',
      screens: { home: 'Home.stx', details: 'Details.stx' },
    }))
    await Bun.write(path.join(root, 'Home.stx'), `<script>
let count = 0
function increment() { count++ }
function openDetails() { globalThis.craft.navigation.push('details', { id: 7 }) }
</script>
<template><View><Text>Count {count}</Text><Button onPress={increment}>Increment</Button><Button onPress={openDetails}>Details</Button></View></template>`)
    await Bun.write(path.join(root, 'Details.stx'), `<script>
let id = globalThis.craft.route.params.id
function replaceHome() { globalThis.craft.navigation.replace('home', { from: id }) }
function goBack() { globalThis.craft.navigation.back() }
</script>
<template><View><Text>Item {id}</Text><Button onPress={replaceHome}>Replace</Button><Button onPress={goBack}>Back</Button></View></template>`)
    const output = path.join(root, 'routes.js')
    const compiled = await runCli(['compile', '--format', 'bundle', '--output', output], root)
    expect(compiled.code).toBe(0)
    const bundle = await Bun.file(output).text()
    expect(() => new Bun.Transpiler({ loader: 'js' }).transformSync(bundle)).not.toThrow()

    function start(name?: string, params?: Record<string, unknown>) {
      const sent: Array<Record<string, any>> = []
      let callback: (message: Record<string, any>) => void = () => {}
      const scope: Record<string, any> = {
        __stxNativeRoute: name,
        __stxNativeParams: params,
        __stxNativeBridge: {
          postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
          onMessage: (receiver: typeof callback) => { callback = receiver },
        },
      }
      new Function('globalThis', bundle)(scope)
      return { scope, sent, event: (handlerName: string) => callback({ type: 'EVENT', payload: { handlerName, nativeEvent: {} } }) }
    }

    const home = start()
    expect(home.scope.craft.route).toEqual({ name: 'home', params: {} })
    expect(home.sent[0].payload.document.children[0].children.join('')).toBe('Count 0')
    home.event('increment')
    expect(home.sent.at(-1)?.payload.document.children[0].children.join('')).toBe('Count 1')
    home.event('openDetails')
    expect(home.sent.find(message => message.type === 'NAVIGATE')?.payload).toEqual({ screen: 'details', params: { id: 7 } })

    const details = start('details', { id: 7 })
    expect(details.scope.craft.route).toEqual({ name: 'details', params: { id: 7 } })
    expect(details.sent[0].payload.document.children[0].children.join('')).toBe('Item 7')
    details.event('replaceHome')
    details.event('goBack')
    expect(details.sent.find(message => message.type === 'NAVIGATE_REPLACE')?.payload).toEqual({ screen: 'home', params: { from: 7 } })
    expect(details.sent.some(message => message.type === 'NAVIGATE_BACK')).toBe(true)
    expect(() => details.scope.craft.navigation.push('missing')).toThrow('Unknown native screen')

    // Native back shows the original controller and JSContext again; the
    // compiled home closure has not been executed a second time.
    home.event('increment')
    expect(home.sent.at(-1)?.payload.document.children[0].children.join('')).toBe('Count 2')
  })
})
