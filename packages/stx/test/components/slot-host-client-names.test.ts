/**
 * A host component's client names do not reach into a child's own template.
 *
 * Client signal names travel down through nested renders so that slot content
 * keeps `{{ signal() }}` for the browser (6e29f859a6). But a host's names were
 * inherited by everything rendered inside it, including a child's own
 * template: NativeSheet declares a client `title`, so the `{{ title }}` that
 * Video's server script defines was left unrendered inside the sheet, and the
 * video player's aria-label read "{{ title }}" to VoiceOver.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'

let tempDir: string
let componentsDir: string

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'stx-slot-host-names-'))
  componentsDir = join(tempDir, 'components')
  await mkdir(componentsDir, { recursive: true })
  // A sheet: its own client `title`, and a slot.
  await writeFile(join(componentsDir, 'Sheet.stx'), `<script client>
const title = useReactiveProp('title', '')
</script>
<div class="sheet"><h2>{{ title() }}</h2><slot /></div>`)
  // A child whose server script defines `title` for its own template.
  await writeFile(join(componentsDir, 'Clip.stx'), `<script server>
const props = defineProps()
const title = props.title || 'Video player'
</script>
<figure aria-label="{{ title }}"></figure>`)
  // A child with no such name, rendering caller slot text.
  await writeFile(join(componentsDir, 'Label.stx'), '<span><slot /></span>')
})

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, join(tempDir, 'page.stx'), { componentsDir, partialsDir: componentsDir } as any, new Set<string>())
}

describe('client names from a slot host', () => {
  it('renders a child\'s own server value that shares a name with the host\'s signal', async () => {
    const out = await render('<Sheet title="Squat"><Clip title="Squat demo" /></Sheet>')
    expect(out).toContain('aria-label="Squat demo"')
    expect(out).not.toContain('aria-label="{{ title }}"')
  })

  it('renders the child\'s default when the caller binds the prop to a client value', async () => {
    const out = await render('<script client>\nconst chosen = state(\'\')\n</script>\n<Sheet :title="chosen"><Clip :title="chosen" /></Sheet>')
    expect(out).toContain('aria-label="Video player"')
    expect(out).not.toContain('{{ title }}')
  })

  it('still leaves the host\'s own signal to the browser', async () => {
    const out = await render('<Sheet title="Squat"><Clip title="Squat demo" /></Sheet>')
    expect(out).toContain('{{ title() }}')
  })

  it('still keeps a host signal in slot content for a child that does not declare it', async () => {
    await writeFile(join(componentsDir, 'Confirm.stx'), `<script client>
const title = useReactiveProp('title', 'Delete')
</script>
<div><Label>{{ title() }}</Label></div>`)
    const out = await render('<Confirm title="Revoke" />')
    expect(out).toMatch(/<span[^>]*>{{ title\(\) }}<\/span>/)
  })
})
