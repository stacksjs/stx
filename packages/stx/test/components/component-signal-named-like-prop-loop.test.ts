/**
 * A component's `:for` over a signal named after one of its props stays a
 * client loop.
 *
 * `convertServerLoopAttributesToDirectives` turns a `:for` whose iterable is
 * server data into an `@foreach` (stacksjs/stx#2051), and leaves a declared
 * signal on the client. It found signals by scanning the template's
 * `<script>` blocks, but a component's template reaches it with the client
 * script already lifted out. NativeSegmentedControl normalises its `options`
 * prop into a `derived` also called `options`, so the prop's value in the
 * context made `:for="option in options()"` look like server data. The loop
 * became `@foreach(options())`, which is not callable on the server, and the
 * control rendered an empty track.
 */
import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'

let tempDir: string
let componentsDir: string

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'stx-signal-like-prop-'))
  componentsDir = join(tempDir, 'components')
  await mkdir(componentsDir, { recursive: true })
  await writeFile(join(componentsDir, 'Segments.stx'), `<script client>
interface SegmentOption { label: string, value: string }
const rawOptions = useReactiveProp<Array<string | SegmentOption>>('options', [])
const options = derived<SegmentOption[]>(() => rawOptions().map(option =>
  typeof option === 'string' ? { label: option, value: option } : option))
</script>
<div role="tablist">
  <button :for="(option, index) in options()" :key="option.value" type="button">{{ option.label }}</button>
</div>`)
  // A server-rendered list whose prop is plain data: still a server loop.
  await writeFile(join(componentsDir, 'Rows.stx'), `<script server>
const props = defineProps()
const rows = props.rows || []
</script>
<ul><li :for="row in rows">{{ row }}</li></ul>`)
})

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, join(tempDir, 'page.stx'), { componentsDir, partialsDir: componentsDir } as any, new Set<string>())
}

describe('a component signal named after its prop', () => {
  it('keeps the loop on the client for a literal prop', async () => {
    const warn = spyOn(console, 'warn')
    try {
      const out = await render(`<Segments :options="[{ label: '30s', value: 30 }, { label: '60s', value: 60 }]" />`)
      expect(out).toContain(':for="(option, index) in options()"')
      expect(out).not.toContain('Foreach Error')
      expect(warn.mock.calls.some(call => String(call[0]).includes('is not iterable server-side'))).toBe(false)
    }
    finally {
      warn.mockRestore()
    }
  })

  it('keeps the loop on the client for a prop bound to a caller signal', async () => {
    const out = await render(`<script client>
const where = derived(() => [{ label: 'Gym', value: 'gym' }])
</script>
<Segments :options="where" />`)
    expect(out).toContain(':for="(option, index) in options()"')
    expect(out).not.toContain('Foreach Error')
  })

  it('still expands a component loop over its own server data', async () => {
    const out = await render(`<Rows :rows="['a', 'b']" />`)
    expect(out).toContain('<li>a</li>')
    expect(out).toContain('<li>b</li>')
  })
})
