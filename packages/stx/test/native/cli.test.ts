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
import vm from 'node:vm'
import { compileScreenBundle } from '../../src/native/compiler/bundle'

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
    return (await compileScreenBundle(file)).code
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
    vm.runInNewContext(bundle, {
      __stxNativeBridge: { postMessage: (raw: string) => { sent.push(JSON.parse(raw)) }, onMessage: () => {} },
    })
    const stamp = Number(/^js_\d+_(\d+)$/.exec(sent[0].id)?.[1])
    expect(stamp).toBeGreaterThanOrEqual(before)
  })

  it('carries the template and the handlers the script declared', async () => {
    const bundle = await generate(SCREEN)
    expect(bundle).toContain('__stxNative')
    expect(bundle).toContain('greet')
  })

  it('compiles named screens and keeps each route runtime independent', async () => {
    const root = await project()
    await Bun.write(path.join(root, 'native.config.json'), JSON.stringify({
      initialScreen: 'home',
      screens: { home: 'Home.stx', details: 'Details.stx' },
    }))
    await Bun.write(path.join(root, 'Home.stx'), `<script client>
const count = state(0)
function increment() { count.set(count() + 1) }
function openDetails() { globalThis.craft.navigation.push('details', { id: 7 }) }
</script>
<View><Text :text="'Count ' + count" /><Button @click="increment()">Increment</Button><Button @click="openDetails()">Details</Button></View>`)
    await Bun.write(path.join(root, 'Details.stx'), `<script client>
const id = state(globalThis.craft.route.params.id)
function replaceHome() { globalThis.craft.navigation.replace('home', { from: id() }) }
function goBack() { globalThis.craft.navigation.back() }
</script>
<View><Text :text="'Item ' + id" /><Button @click="replaceHome()">Replace</Button><Button @click="goBack()">Back</Button></View>`)
    const output = path.join(root, 'routes.js')
    const compiled = await runCli(['compile', '--format', 'bundle', '--output', output], root)
    expect(compiled.code).toBe(0)
    const bundle = await Bun.file(output).text()
    expect(() => new Bun.Transpiler({ loader: 'js' }).transformSync(bundle)).not.toThrow()

    async function start(name?: string, params?: Record<string, unknown>) {
      const sent: Array<Record<string, any>> = []
      let callback: (message: string) => void = () => {}
      const scope: Record<string, any> = {
        __stxNativeRoute: name,
        __stxNativeParams: params,
        __stxNativeBridge: {
          postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
          onMessage: (receiver: typeof callback) => { callback = receiver },
        },
      }
      vm.runInNewContext(bundle, scope)
      await Bun.sleep(0)
      const handlers = sent.filter(message => message.type === 'MUTATE')
        .flatMap(message => message.payload.operations)
        .flatMap(operation => Object.values(operation.patch?.events || {})) as string[]
      return {
        scope,
        sent,
        event: async (index: number) => {
          callback(JSON.stringify({ type: 'EVENT', payload: { handlerId: handlers[index], nativeEvent: {} } }))
          await Bun.sleep(0)
        },
      }
    }

    const home = await start()
    expect(home.scope.craft.route).toEqual({ name: 'home', params: {} })
    expect(home.sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({ patch: { children: ['Count 0'] } }))
    await home.event(0)
    expect(home.sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({ patch: { children: ['Count 1'] } }))
    await home.event(1)
    expect(home.sent.find(message => message.type === 'NAVIGATE')?.payload).toEqual({ screen: 'details', params: { id: 7 } })

    const details = await start('details', { id: 7 })
    expect(details.scope.craft.route).toEqual({ name: 'details', params: { id: 7 } })
    expect(details.sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({ patch: { children: ['Item 7'] } }))
    await details.event(0)
    await details.event(1)
    expect(details.sent.find(message => message.type === 'NAVIGATE_REPLACE')?.payload).toEqual({ screen: 'home', params: { from: 7 } })
    expect(details.sent.some(message => message.type === 'NAVIGATE_BACK')).toBe(true)
    expect(() => details.scope.craft.navigation.push('missing')).toThrow('Unknown native screen')

    // Native back shows the original controller and JSContext again; the
    // compiled home closure has not been executed a second time.
    await home.event(0)
    expect(home.sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)).toContainEqual(expect.objectContaining({ patch: { children: ['Count 2'] } }))
  })
})
