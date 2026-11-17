import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

const options = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  layoutsDir: '/tmp',
  autoShell: false,
} as never

describe('component props inside reactive loops', () => {
  it('keeps compound row expressions in the browser-owned loop scope', async () => {
    const html = await processDirectives(
      `<ul><li :for="platform in integrations"><Image x-src="platform.logo" x-alt="platform.name + ' logo'" width="64" height="64" /></li></ul>`,
      { platform: {} },
      '/app/page.stx',
      options,
      new Set<string>(),
    )

    expect(html).toContain(':src="platform.logo"')
    expect(html).toContain(':alt="platform.name + \' logo\'"')
    expect(html).not.toContain('alt="undefined logo"')
  })
})

describe('component props built from client values', () => {
  it('binds an expression naming a client signal rather than baking its server result', async () => {
    const html = await processDirectives(
      `<Image x-src="cover" x-alt="remainingLabel + ' left'" width="64" height="64" />`,
      { cover: '/a.png' },
      '/app/page.stx',
      options,
      new Set<string>(),
    )

    expect(html).toContain(':alt="remainingLabel + \' left\'"')
    expect(html).not.toContain('undefined left')
    // A value the server has, and globals, still render on the server.
    expect(html).toContain('src="/a.png"')
  })
})

describe('component props naming what the client script declares', () => {
  it('binds a call to a client function even when a global has its name', async () => {
    // An app's auto-imported helpers are globals on the server. A page whose
    // client script declares its own `weekShare()` means that one: evaluating
    // the global instead threw, came back undefined, and the binding vanished.
    const globals = globalThis as Record<string, unknown>
    globals.weekShare = (totals: { done: number }) => totals.done
    try {
      const dir = createTempDir('stx-client-names-')
      await Bun.write(path.join(dir, 'Box.stx'), '<div class="box"><slot /></div>')
      const html = await processDirectives(
        `<script client>
function weekShare() { return 78 }
</script>
<Image x-alt="'Done ' + weekShare()" width="64" height="64" />
<Box><Image x-alt="'Slot ' + weekShare()" width="64" height="64" /></Box>`,
        {},
        path.join(dir, 'page.stx'),
        { ...options, componentsDir: dir },
        new Set<string>(),
      )

      expect(html).toContain(':alt="\'Done \' + weekShare()"')
      expect(html).toContain(':alt="\'Slot \' + weekShare()"')
    }
    finally {
      delete globals.weekShare
    }
  })

  it('still evaluates a global the client script does not declare', async () => {
    const globals = globalThis as Record<string, unknown>
    globals.serverLabel = () => 'from the server'
    try {
      const html = await processDirectives(
        `<script client>
const count = state(0)
</script>
<Image x-alt="serverLabel()" src="/a.png" width="64" height="64" />`,
        {},
        '/app/page.stx',
        options,
        new Set<string>(),
      )

      expect(html).toContain('alt="from the server"')
    }
    finally {
      delete globals.serverLabel
    }
  })

  it('binds a client signal even when the render context has a value of its name', async () => {
    // A page renders with a context of its own: the serve path puts the
    // request's `query` object in it, and a slot is rendered in the context of
    // the component around it, whose props (a Modal's `title`) are in it too.
    // A client signal of the same name bound bare into a component was
    // evaluated against that instead: a dashboard search box opened holding
    // "[object Object]", and a dialog's title field opened empty.
    const dir = createTempDir('stx-client-context-')
    await Bun.write(path.join(dir, 'Field.stx'), `<script client>
const value = useReactiveProp('value', '')
</script>
<input :value="value()" />`)
    await Bun.write(path.join(dir, 'Frame.stx'), `<script server>
const { title = '' } = defineProps<{ title?: string }>()
</script>
<section><h2>{{ title }}</h2><slot /></section>`)
    const html = await processDirectives(
      `<script client>
const query = state('')
const title = state('Welcome 10% off')
</script>
<Field v-model:value="query" />
<Frame title="Edit discount"><Field :value="title" /></Frame>`,
      { query: { page: '2' } },
      path.join(dir, 'page.stx'),
      { ...options, componentsDir: dir },
      new Set<string>(),
    )

    expect(html).not.toContain('[object Object]')
    expect(html).toMatch(/:value="query"/)
    expect(html).toMatch(/:value="title"/)
    expect(html).not.toContain('value="Edit discount"')
  })

  it('still evaluates a context value the client script does not declare', async () => {
    const dir = createTempDir('stx-client-context-')
    await Bun.write(path.join(dir, 'Field.stx'), '<input :value="value" />')
    const html = await processDirectives(
      `<script client>
const count = state(0)
</script>
<Field :value="label" />`,
      { label: 'from the server' },
      path.join(dir, 'page.stx'),
      { ...options, componentsDir: dir },
      new Set<string>(),
    )

    expect(html).toContain('from the server')
  })
})
