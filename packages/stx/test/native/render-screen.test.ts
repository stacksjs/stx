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
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { extractClientScript } from '../../src/native/compiler/client-script'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import type { STXNode } from '../../src/native/compiler/ir'
import { compileScreenFile, compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { createTempDir } from '../../src/temp-dir'

// Outside the repo: these are throwaway templates, not fixtures.
const SCRATCH = createTempDir('stx-native-screens-')

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
  it('retains conditional fragment content through native primitive rendering', async () => {
    const file = screen('FragmentScreen.stx', '<View><Fragment :if="visible"><Text>Ready</Text><Text>Training</Text></Fragment></View>')
    const compiled = await compileScreenFile(file)
    expect(texts(compiled.document.root)).toContain('Ready')
    expect(texts(compiled.document.root)).toContain('Training')
    expect(JSON.stringify(compiled.manifest)).toContain('visible')
  })
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

describe('native media events', () => {
  it('keeps video load lifecycle handlers in the native IR', async () => {
    const source = '<View><Video source="https://cdn.example/video.mp4" @load-start="started()" @load="loaded($event)" @load-end="ended()" /></View>'
    const { document } = await compileScreenSource(source, screen('VideoEvents.stx', source))
    const video = document.root.children.find(
      (child): child is STXNode => typeof child !== 'string' && child.type === 'Video',
    )
    expect(video?.events).toEqual({
      onLoadStart: 'started()',
      onLoad: 'loaded($event)',
      onLoadEnd: 'ended()',
    })
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

  it('resolves installed library components before rendering native copy', async () => {
    const source = '<View><EmptyState title="Loading your day" description="Your sessions will appear here shortly." variant="bare" /></View>'
    const { document } = await compileScreenSource(source, screen('LibraryEmptyState.stx', source), {
      root: path.resolve(import.meta.dir, '../../../..'),
    })
    expect(texts(document.root)).toContain('Loading your day')
    expect(texts(document.root)).toContain('Your sessions will appear here shortly.')
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
  it('keeps leaf div primitives beside following controls', async () => {
    const source = '<View><Switch testID="switch" /><Slider testID="slider" /><ActivityIndicator testID="spinner" /><DatePicker testID="date" /><RefreshControl testID="refresh" /><StatusBar testID="status" /><TextInput testID="after" /></View>'
    const { document } = await compileScreenSource(source, screen('LeafDivPrimitives.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(children.map(child => child.type)).toEqual(['Switch', 'Slider', 'ActivityIndicator', 'DatePicker', 'RefreshControl', 'StatusBar', 'TextInput'])
    expect(children.map(child => child.props.testID)).toEqual(['switch', 'slider', 'spinner', 'date', 'refresh', 'status', 'after'])
    expect(children.every(child => child.children.length === 0)).toBe(true)
  })

  it('keeps modal content inside the modal and following controls beside it', async () => {
    const source = '<View><Modal testID="modal"><Text testID="content">Modal content</Text></Modal><TextInput testID="after" /></View>'
    const { document } = await compileScreenSource(source, screen('ModalContent.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(children.map(child => child.type)).toEqual(['Modal', 'TextInput'])
    expect(types(children[0])).toEqual(['Modal', 'Text'])
    expect(texts(children[0])).toEqual(['Modal content'])
    expect(children[1].props.testID).toBe('after')
  })

  it('preserves false-valued props on native primitive roots', async () => {
    const source = '<View><TextInput testID="readonly" :editable="false" /><ActivityIndicator :animating="false" :hides-when-stopped="false" /></View>'
    const { document, manifest } = await compileScreenSource(source, screen('FalseNativeProps.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(children[0].props).toMatchObject({ testID: 'readonly', editable: false })
    expect(children[1].props).toMatchObject({ animating: false, hidesWhenStopped: false })
    expect(manifest.entries).toEqual([])
  })

  it('keeps true-valued props true on native primitive roots, bound or bare', async () => {
    const source = '<View><TextInput :multiline="true" :secureTextEntry="true" :autoCorrect="false" /><TextInput multiline secureTextEntry /><Video src="https://example.com/a.mp4" controls :autoplay="true" :muted="true" :currentTime="12.5" /></View>'
    const { document } = await compileScreenSource(source, screen('TrueNativeProps.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(children[0].props).toMatchObject({ multiline: true, secureTextEntry: true, autoCorrect: false })
    expect(children[1].props).toMatchObject({ multiline: true, secureTextEntry: true })
    expect(children[2].type).toBe('Video')
    expect(children[2].props).toMatchObject({ source: 'https://example.com/a.mp4', controls: true, autoplay: true, muted: true, currentTime: 12.5 })
  })

  it('reads a bare boolean attribute on a plain tag as true', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<video src="https://example.com/a.mp4" controls loop muted @ended="done()" @timeupdate="tick($event)" @play="playing()"></video>')
    expect(root.type).toBe('Video')
    expect(root.props).toEqual({ source: 'https://example.com/a.mp4', controls: true, loop: true, muted: true })
    expect(root.events).toEqual({ onEnd: 'done()', onProgress: 'tick($event)', onPlay: 'playing()' })
    expect(diagnostics).toEqual([])
  })

  it('keeps a video\'s Picture in Picture and a shared element\'s transitionID through HTML lowercasing', async () => {
    const source = '<View><Video src="https://example.com/a.mp4" pictureInPicture :paused="false" transitionID="demo" /><Text transitionID="timer" :text="\'4:59\'" /></View>'
    const { document } = await compileScreenSource(source, screen('PictureInPicture.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')
    expect(children[0].props).toMatchObject({ pictureInPicture: true, paused: false, transitionID: 'demo' })
    expect(children[1].props).toMatchObject({ transitionID: 'timer' })
    const { root, diagnostics } = await translateHtmlToIR('<video src="https://example.com/a.mp4" @enterpictureinpicture="floated()" @leavepictureinpicture="back()"></video>')
    expect(root.events).toEqual({ onPictureInPictureStart: 'floated()', onPictureInPictureStop: 'back()' })
    expect(diagnostics).toEqual([])
  })

  it('restores the autofill and date props HTML lowercased', async () => {
    const source = '<script>\nconst time = state(\'07:30\')\nfunction picked(value) { time.set(value) }\n</script>\n<View><TextInput textContentType="password" autoComplete="current-password" passwordRules="minlength: 12;" /><DatePicker mode="time" value="07:30" minuteInterval="5" minimumDate="2026-10-01" maximumDate="2026-12-31" @change="picked($event.value)" /></View>'
    const { document } = await compileScreenSource(source, screen('AutofillProps.stx', source))
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(children[0].props).toMatchObject({ textContentType: 'password', autoComplete: 'current-password', passwordRules: 'minlength: 12;' })
    expect(children[1].type).toBe('DatePicker')
    expect(children[1].props).toMatchObject({ mode: 'time', value: '07:30', minuteInterval: 5, minimumDate: '2026-10-01', maximumDate: '2026-12-31' })
    expect(children[1].events).toEqual({ onValueChange: 'picked($event.value)' })
  })

  it('keeps native icons as leaf nodes beside text, including dynamic labels', async () => {
    const { document } = await compileScreenSource('<View><Icon name="play" /><Text :text="label">Start</Text><Icon name="moon" /><Text>Rest</Text></View>', screen('AdjacentIcons.stx', ''))
    expect(types(document.root)).toEqual(['View', 'Icon', 'Text', 'Icon', 'Text'])
    expect((document.root.children[0] as STXNode).children).toEqual([])
    expect((document.root.children[2] as STXNode).children).toEqual([])
    expect(texts(document.root)).toEqual(['Start', 'Rest'])
  })

  it('compiles map overlays to the renderer contract', async () => {
    const source = `<script client>
const route = state([47, 11, 47.1, 11.2])
</script>
<Map testID="trail-map" fitToBounds showsUserLocation>
  <MapPolyline testID="route" :geometry="route()" strokeColor="#111111" strokeWidth="4" />
  <MapMarker id="start" testID="start" geometry="[47, 11]" @press="openMarker($event)" />
</Map>`
    const { document, manifest } = await compileScreenSource(source, screen('MapScreen.stx', source))
    expect(types(document.root)).toEqual(['Map', 'MapPolyline', 'MapMarker'])
    expect(document.root.props).toMatchObject({ testID: 'trail-map', fitToBounds: true, showsUserLocation: true })
    const [polyline, marker] = document.root.children.filter((child): child is STXNode => typeof child !== 'string')
    expect(polyline.props).toMatchObject({ testID: 'route', strokeColor: '#111111', strokeWidth: 4 })
    expect(polyline.bindings).toEqual({ geometry: 'route()' })
    expect(marker.props).toMatchObject({ id: 'start', testID: 'start', geometry: [47, 11] })
    expect(marker.events).toEqual({ onPress: 'openMarker($event)' })
    expect(manifest.entries.some(entry => entry.bindings.some(binding => binding.name === ':geometry'))).toBe(true)
  })

  it('ships one component per native type the IR declares', async () => {
    const files = [...new Bun.Glob('*.stx').scanSync(nativePrimitivesDir())].sort()
    expect(files.filter(file => file !== 'Fragment.stx').length).toBe(31)
    expect(files).toContain('Fragment.stx')
    expect(files).toContain('NativeSegmentedControl.stx')
    expect(files).toContain('Icon.stx')
    expect(files).toContain('TouchableOpacity.stx')
    expect(files).toContain('ActivityIndicator.stx')
    expect(files).toContain('Map.stx')
    expect(files).toContain('MapPolyline.stx')
    expect(files).toContain('MapPolygon.stx')
    expect(files).toContain('MapMarker.stx')
  })

  it('names a type the translator will accept, in every one of them', async () => {
    const dir = nativePrimitivesDir()
    for (const file of new Bun.Glob('*.stx').scanSync(dir)) {
      // Fragment groups children and has no native view type of its own.
      if (file === 'Fragment.stx') continue
      const source = await Bun.file(path.join(dir, file)).text()
      const declared = /data-native="(\w+)"/.exec(source)
      expect(declared, file).toBeTruthy()
      expect(declared![1]).toBe(file === 'NativeSegmentedControl.stx' ? 'SegmentedControl' : path.basename(file, '.stx'))
    }
  })

  it('offers a low-level segmented primitive without shadowing the shared component', async () => {
    const source = `<NativeSegmentedControl testID="period" value="week" :items="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]" />`
    const { document } = await compileScreenSource(source, screen('NativeSegments.stx', source))
    expect(document.root.type).toBe('SegmentedControl')
    expect(document.root.props.value).toBe('week')
    expect(document.root.props.items).toEqual([{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }])
    expect(document.root.children).toEqual([])
  })

  it('distinguishes types that share an HTML tag', async () => {
    // Three of these emit a div, so the tag alone cannot say which is which.
    const source = `<View class="p-1"><TouchableOpacity class="p-1"><Text>a</Text></TouchableOpacity><Pressable class="p-1"><Text>b</Text></Pressable></View>`
    const { document } = await compileScreenSource(source, screen('Touchables.stx', source))
    expect(types(document.root)).toEqual(['View', 'TouchableOpacity', 'Text', 'Pressable', 'Text'])
  })

  it('compiles Link to the host link primitive and preserves its destination', async () => {
    const source = '<View><Link testID="details" href="/details">Open details</Link></View>'
    const { document } = await compileScreenSource(source, screen('Link.stx', source))
    const link = document.root.children.find((child): child is STXNode => typeof child !== 'string')!

    expect(link.type).toBe('Link')
    expect(link.props).toMatchObject({ testID: 'details', href: '/details' })
    expect(texts(link)).toEqual(['Open details'])
    expect(link.style).toMatchObject({ textDecorationLine: 'underline' })
  })

  it('carries a reactive Link destination into the native binding manifest', async () => {
    const source = `<script client>const path = state('/details')</script><View><Link :href="path">Open details</Link></View>`
    const { document, manifest } = await compileScreenSource(source, screen('ReactiveLink.stx', source))
    const link = document.root.children.find((child): child is STXNode => typeof child !== 'string')!

    expect(link.type).toBe('Link')
    expect(link.bindings).toEqual({ href: 'path' })
    expect(manifest.entries[0].bindings).toEqual([{ name: ':href', value: 'path', kind: 'attr' }])
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

  it('compiles a Checkbox to the hosts\' own checkbox, not a library one', async () => {
    const source = `<script client>
const accepted = state(false)
function accept(value) { accepted.set(value) }
</script>
<View testID="form"><Checkbox testID="terms" label="Accept terms" :value="accepted" @value-change="accept($event)" /><Checkbox testID="mixed" indeterminate>Some</Checkbox></View>`
    const { document } = await compileScreenSource(source, screen('CheckboxScreen.stx', source), {
      root: path.resolve(import.meta.dir, '../../../..'),
    })
    expect(document.root.props.testID).toBe('form')
    const [terms, mixed] = document.root.children.filter((child): child is STXNode => typeof child !== 'string')
    expect(terms.type).toBe('Checkbox')
    expect(terms.props).toMatchObject({ testID: 'terms', label: 'Accept terms' })
    expect(Object.keys(terms.events)).toContain('onValueChange')
    expect(mixed.type).toBe('Checkbox')
    expect(mixed.props).toMatchObject({ testID: 'mixed', indeterminate: true })
    expect(texts(mixed)).toEqual(['Some'])
  })

  it('keeps a container\'s own props when a library component sits inside it', async () => {
    // The host finds a screen by these: a library Card in the slot used to
    // take the View's testID and accessibilityLabel, and filter them away.
    const source = '<View testID="page" accessibilityLabel="Today"><ScrollView testID="scroll"><Card><Text testID="inside">Ready</Text></Card></ScrollView><Text testID="after">Done</Text></View>'
    const { document } = await compileScreenSource(source, screen('LibraryInside.stx', source), {
      root: path.resolve(import.meta.dir, '../../../..'),
    })
    expect(document.root.props).toMatchObject({ testID: 'page', accessibilityLabel: 'Today' })
    const scroll = document.root.children.find((child): child is STXNode => typeof child !== 'string')!
    expect(scroll.props).toMatchObject({ testID: 'scroll' })
    expect(JSON.stringify(document.root)).toContain('"testID":"inside"')
    expect(JSON.stringify(document.root)).toContain('"testID":"after"')
  })

  it('keeps a shadow offset and a transform written in a style object', async () => {
    const source = `<View testID="card" style={{"width":240,"shadowOffset":{"width":0,"height":3},"transform":[{"translateX":4},{"scaleX":0.9},{"rotate":"2deg"}]}}><Text>Card</Text></View>`
    const { document } = await compileScreenSource(source, screen('StructuredStyle.stx', source))
    expect(document.root.style).toMatchObject({
      width: 240,
      shadowOffset: { width: 0, height: 3 },
      transform: [{ translateX: 4 }, { scaleX: 0.9 }, { rotate: '2deg' }],
    })
  })

  it('keeps server-evaluated object props on a native primitive root', async () => {
    const source = `<ScrollView testID="feed" contentContainerStyle={{"paddingTop":12}} style={{"height":72}}><Text>Row</Text></ScrollView>`
    const { document } = await compileScreenSource(source, screen('StructuredHostProps.stx', source))

    expect(document.root.props).toEqual({
      testID: 'feed',
      contentContainerStyle: { paddingTop: 12 },
    })
    expect(document.root.style).toEqual({ height: 72 })
  })
})

describe('an app whose web components share a primitive\'s name', () => {
  // A Stacks app keeps its web components in resources/components, and most
  // have a Button. Those directories used to be searched before the native
  // primitives, so a native screen's <Button> rendered the app's web button:
  // its own markup and classes, none of the static props the screen wrote. A
  // bound `:testID` survived only because stx forwards bindings onto whatever
  // root a component renders.
  const APP = createTempDir('stx-native-app-')
  const WEB_COMPONENT = `<script server>
const variant = $props.variant ?? 'primary'
</script>
<button type="button" class="btn-{{ variant }}"><slot /></button>`
  const PRIMITIVES = ['ActivityIndicator', 'Button', 'DatePicker', 'Image', 'Modal', 'Pressable', 'ScrollView', 'Switch', 'Text', 'TextInput', 'View']
  for (const dir of ['resources/components', 'resources/views/components', 'src/components']) {
    mkdirSync(path.join(APP, dir), { recursive: true })
    for (const name of PRIMITIVES)
      writeFileSync(path.join(APP, dir, `${name}.stx`), WEB_COMPONENT)
  }
  mkdirSync(path.join(APP, 'resources/native'), { recursive: true })

  function compile(name: string, source: string, options: { componentsDir?: string } = {}) {
    const file = path.join(APP, 'resources/native', name)
    writeFileSync(file, source)
    return compileScreenSource(source, file, { root: APP, ...options })
  }

  it('keeps a static testID on a Button, as a bound one is kept', async () => {
    const source = `<script client>
const label = state('Manage')
function open() {}
</script>
<View>
  <Button @click="open()" class="text-[15px]" :text="label()" testID="manage" accessibilityLabel="Manage habits" />
  <Button @click="open()" :text="label()" :testID="'bound-' + label()" />
</View>`
    const { document } = await compile('ButtonTestID.stx', source)
    const [staticButton, boundButton] = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(staticButton.type).toBe('Button')
    expect(staticButton.props.testID).toBe('manage')
    expect(staticButton.props.accessibilityLabel).toBe('Manage habits')
    expect(staticButton.style.fontSize).toBe(15)
    expect(boundButton.type).toBe('Button')
    expect(boundButton.props['data-stx-parent-bindings']).toContain('test-id')
  })

  it('renders every primitive as itself, with its static props', async () => {
    const source = `<View testID="page">
  <ActivityIndicator testID="spinner" />
  <Button testID="save" text="Save" />
  <DatePicker testID="date" />
  <Image testID="avatar" src="https://example.com/a.png" accessibilityLabel="Avatar" />
  <Modal testID="sheet"><Text testID="sheet-text">In the sheet</Text></Modal>
  <Pressable testID="press" accessibilityRole="button" />
  <ScrollView testID="scroll"><Text testID="row">Row</Text></ScrollView>
  <Switch testID="toggle" accessibilityLabel="Share" />
  <TextInput testID="name" placeholder="Name" />
</View>`
    const { document } = await compile('EveryPrimitive.stx', source)
    const children = document.root.children.filter((child): child is STXNode => typeof child !== 'string')

    expect(document.root.type).toBe('View')
    expect(document.root.props.testID).toBe('page')
    expect(children.map(child => [child.type, child.props.testID])).toEqual([
      ['ActivityIndicator', 'spinner'],
      ['Button', 'save'],
      ['DatePicker', 'date'],
      ['Image', 'avatar'],
      ['Modal', 'sheet'],
      ['Pressable', 'press'],
      ['ScrollView', 'scroll'],
      ['Switch', 'toggle'],
      ['TextInput', 'name'],
    ])
    expect(children[1].props.text).toBe('Save')
    expect(children[3].props.accessibilityLabel).toBe('Avatar')
    expect(children[7].props.accessibilityLabel).toBe('Share')
    expect(children[8].props.placeholder).toBe('Name')
    expect(texts(document.root)).toEqual(['In the sheet', 'Row'])
  })

  it('still lets a screen\'s own components replace a primitive', async () => {
    const own = path.join(APP, 'resources/native/components')
    mkdirSync(own, { recursive: true })
    writeFileSync(path.join(own, 'Button.stx'), `<script server>
const label = $props.label ?? ''
</script>
<View class="p-2" testID="own-button"><Text>{{ label }}</Text></View>`)
    const source = '<View><Button label="Mine" /></View>'
    const { document } = await compile('OwnButton.stx', source, { componentsDir: own })

    expect(types(document.root)).toEqual(['View', 'View', 'Text'])
    expect(texts(document.root)).toEqual(['Mine'])
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
