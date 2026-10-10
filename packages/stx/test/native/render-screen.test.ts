/**
 * A native screen through the real stx pipeline (stacksjs/stx#1983).
 *
 * The point of these: a native screen is an ordinary stx template. Directives,
 * server scripts, loops and components all work in it, because the engine that
 * resolves them is the one with thousands of tests behind it rather than a
 * second parser with none. The primitive tags keep working too, as ordinary
 * components that name their own native type.
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { extractClientScript } from '../../src/native/compiler/client-script'
import type { STXNode } from '../../src/native/compiler/ir'
import { compileScreenFile, compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'

// Outside the repo: these are throwaway templates, not fixtures.
const SCRATCH = mkdtempSync(path.join(tmpdir(), 'stx-native-screens-'))

function screen(name: string, source: string): string {
  const file = path.join(SCRATCH, name)
  writeFileSync(file, source)
  return file
}

function types(node: STXNode, out: string[] = []): string[] {
  out.push(node.type)
  for (const child of node.children)
    if (typeof child !== 'string')
      types(child, out)
  return out
}

function texts(node: STXNode, out: string[] = []): string[] {
  for (const child of node.children) {
    if (typeof child === 'string')
      out.push(child)
    else texts(child, out)
  }
  return out
}

describe('the reference screen', () => {
  const source = `<script>
  const count = state(0)
  function increment() { count.set(count() + 1) }
</script>

<View class="flex-1 flex-col justify-center items-center p-4 bg-blue-500">
  <Text class="text-white text-lg font-bold">Wildloop</Text>
  <Text :text="count()" class="text-white" />
  <Button @click="increment()" class="p-2">Tap</Button>
</View>`

  it('compiles the primitives to their native types', async () => {
    const { document } = await compileScreenSource(source, screen('Reference.stx', source))
    expect(types(document.root)).toEqual(['View', 'Text', 'Text', 'Button'])
  })

  it('compiles the classes to the documented style', async () => {
    const { document } = await compileScreenSource(source, screen('Reference.stx', source))
    expect(document.root.style).toEqual({
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#3b82f6',
    })
  })

  it('forwards an event to the name the renderers dispatch on', async () => {
    const { document } = await compileScreenSource(source, screen('Reference.stx', source))
    const button = document.root.children.find(
      (child): child is STXNode => typeof child !== 'string' && child.type === 'Button',
    )
    expect(button!.events).toEqual({ onPress: 'increment()' })
  })

  it('forwards a binding for the device to evaluate', async () => {
    const { document, manifest } = await compileScreenSource(source, screen('Reference.stx', source))
    const bound = document.root.children.find(
      (child): child is STXNode => typeof child !== 'string' && child.bindings?.text !== undefined,
    )
    expect(bound!.bindings).toEqual({ text: 'count()' })
    expect(bound!.bindingId).toBe(0)
    expect(manifest.entries[0].bindings).toEqual([
      { name: ':text', value: 'count()', kind: 'text' },
    ])
  })

  it('carries the screen own script, and only that', async () => {
    const { document, setup } = await compileScreenSource(source, screen('Reference.stx', source))
    expect(document.script.functions).toEqual(['increment'])
    expect(document.script.code).toContain('count.set(count() + 1)')
    // Not the signals runtime, the router or the reactive bridge, all of which
    // are in the rendered page and none of which are the screen's code.
    expect(document.script.code.length).toBeLessThan(400)
    expect(setup?.name).toMatch(/^__stx_setup_/)
    expect(setup?.code).toContain('const count = state(0)')
    expect(setup?.code).toContain('return { count, increment }')
  })
})

describe('what the second parser could not do', () => {
  it('runs a server script and renders its data', async () => {
    const source = `<script server>
const title = 'Wildloop'
const tabs = ['Home', 'Profile']
</script>

<View class="p-4">
  <Text class="text-lg">{{ title }}</Text>
  @foreach(tabs as tab)
    <Text class="text-sm">{{ tab }}</Text>
  @endforeach
</View>`
    const { document } = await compileScreenSource(source, screen('Server.stx', source))
    expect(texts(document.root)).toEqual(['Wildloop', 'Home', 'Profile'])
    expect(JSON.stringify(document.root)).not.toContain('{{')
  })

  it('takes a conditional branch on the server', async () => {
    const source = `<script server>
const signedIn = false
</script>

<View class="p-2">
  @if(signedIn)
    <Text>Welcome back</Text>
  @else
    <Text>Sign in</Text>
  @endif
</View>`
    const { document } = await compileScreenSource(source, screen('Conditional.stx', source))
    expect(texts(document.root)).toEqual(['Sign in'])
  })

  it('composes a screen out of a component', async () => {
    mkdirSync(path.join(SCRATCH, 'components'), { recursive: true })
    writeFileSync(
      path.join(SCRATCH, 'components', 'Tile.stx'),
      `<script server>
const label = $props.label ?? ''
</script>
<View class="p-2"><Text class="text-sm">{{ label }}</Text></View>`,
    )
    const source = `<View class="p-4"><Tile label="One" /><Tile label="Two" /></View>`
    const { document } = await compileScreenSource(source, screen('Composed.stx', source), {
      componentsDir: path.join(SCRATCH, 'components'),
    })
    expect(types(document.root)).toEqual(['View', 'View', 'Text', 'View', 'Text'])
    expect(texts(document.root)).toEqual(['One', 'Two'])
  })

  it('reads a screen off disk', async () => {
    const file = screen('Disk.stx', '<View class="p-1"><Text>From disk</Text></View>')
    const { document } = await compileScreenFile(file)
    expect(texts(document.root)).toEqual(['From disk'])
    expect(document.meta.source).toBe(file)
  })
})

describe('the primitives themselves', () => {
  it('ships one component per native type the IR declares', async () => {
    const files = [...new Bun.Glob('*.stx').scanSync(nativePrimitivesDir())].sort()
    expect(files.length).toBe(22)
    expect(files).toContain('TouchableOpacity.stx')
    expect(files).toContain('ActivityIndicator.stx')
  })

  it('names a type the translator will accept, in every one of them', async () => {
    const dir = nativePrimitivesDir()
    for (const file of new Bun.Glob('*.stx').scanSync(dir)) {
      const source = await Bun.file(path.join(dir, file)).text()
      const declared = /data-native="(\w+)"/.exec(source)
      expect(declared, file).toBeTruthy()
      expect(declared![1]).toBe(path.basename(file, '.stx'))
    }
  })

  it('distinguishes types that share an HTML tag', async () => {
    // Three of these emit a div, so the tag alone cannot say which is which.
    const source = `<View class="p-1"><TouchableOpacity class="p-1"><Text>a</Text></TouchableOpacity><Pressable class="p-1"><Text>b</Text></Pressable></View>`
    const { document } = await compileScreenSource(source, screen('Touchables.stx', source))
    expect(types(document.root)).toEqual(['View', 'TouchableOpacity', 'Text', 'Pressable', 'Text'])
  })

  it('keeps static host props on every native primitive root', async () => {
    const source = `<View testID="page"><ScrollView testID="scroll"><Image testID="avatar" source="avatar.png" accessibilityLabel="Profile" /><Text testID="label">Name</Text><Button testID="save">Save</Button><TextInput testID="name-input" placeholder="Type your name" /></ScrollView></View>`
    const { document } = await compileScreenSource(source, screen('HostProps.stx', source))
    expect(document.root.props).toEqual({ testID: 'page' })
    const scroll = document.root.children.find((child): child is STXNode => typeof child !== 'string')!
    expect(scroll.props).toEqual({ testID: 'scroll' })
    const children = scroll.children.filter((child): child is STXNode => typeof child !== 'string')
    expect(children.map(child => child.props)).toEqual([
      { testID: 'avatar', source: 'avatar.png', accessibilityLabel: 'Profile' },
      { testID: 'label' },
      { type: 'button', testID: 'save' },
      { testID: 'name-input', placeholder: 'Type your name' },
    ])
  })
})

describe('extractClientScript', () => {
  it('leaves a server script out, since it already ran', () => {
    const script = extractClientScript(`<script server>
const title = 'x'
</script>
<script>
function go() {}
</script>`)
    expect(script.code).toBe('function go() {}')
    expect(script.functions).toEqual(['go'])
  })

  it('reads an arrow function as a handler too', () => {
    const script = extractClientScript(`<script client>
const submit = async (event) => { await send(event) }
</script>`)
    expect(script.functions).toEqual(['submit'])
  })

  it('reads a primitive constant as initial state', () => {
    const script = extractClientScript(`<script>
const limit = 25
const name = 'wildloop'
const enabled = true
</script>`)
    expect(script.exports).toEqual({ limit: 25, name: 'wildloop', enabled: true })
  })
})

describe('native client setup', () => {
  it('retains handlers even when the script declares no signal', async () => {
    const source = `<script client>
const destination = 'details'
function open() { craft.navigation.push(destination) }
</script>
<View><Text :text="destination" /><Button @click="open()">Open</Button></View>`
    const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'PlainClient.stx'))
    expect(compiled.setup?.code).toContain('const destination = "details"')
    expect(compiled.setup?.code).toContain('open')
  })
})
