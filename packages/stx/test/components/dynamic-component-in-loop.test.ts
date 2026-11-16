/**
 * `<component :is>` inside a `@foreach` is drawn (stacksjs/stx#2188).
 *
 * Loops run before components, and evaluate every bound attribute of a
 * component tag in each row into a `__stx_` attribute (loops.ts), so a row's
 * values survive to the component pass. `<component>` is a component tag to
 * the loop, so `:is="name"` became `__stx_is="..."`. The dynamic component
 * pass only matched `:is` and `v-bind:is`, so the tag was left in the page as
 * an undrawn `<component __stx_is="IlJlZ2lvbiI=" ...>` element. The report saw
 * it inside slot content; it is any loop, a view's top level included.
 *
 * Also here: the self-closing form passed none of its props.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

let dir: string

beforeAll(() => {
  dir = createTempDir('stx-dyn-loop-')
  fs.mkdirSync(path.join(dir, 'components'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'components', 'Card.stx'), '<section class="card"><slot /></section>')
  fs.writeFileSync(path.join(dir, 'components', 'Region.stx'), `<script server>
const { model = '', count = 0 } = defineProps()
</script>
<p class="region" data-model="{{ model }}" data-count="{{ count }}">region</p>`)
})

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }))

async function render(template: string): Promise<string> {
  const options = { ...defaultConfig, root: dir, componentsDir: path.join(dir, 'components') } as any
  const html = await processDirectives(template, {}, path.join(dir, 'page.stx'), options, new Set())
  return html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/\s+/g, ' ').trim()
}

const MODELS = `<script server>const models = [{ name: 'Region', model: 'user', count: 2 }, { name: 'Region', model: 'team', count: 5 }]</script>`

describe('a dynamic component in a loop', () => {
  it('draws each row\'s component with that row\'s props', async () => {
    const html = await render(`${MODELS}<div>@foreach(models as m)<component :is="m.name" :model="m.model" :count="m.count"></component>@endforeach</div>`)
    expect(html).not.toContain('<component')
    expect(html).toContain('<p class="region" data-model="user" data-count="2">')
    expect(html).toContain('<p class="region" data-model="team" data-count="5">')
  })

  it('draws inside another component\'s slot content, as reported', async () => {
    const html = await render(`${MODELS}<Card>@foreach(models as m)<component :is="m.name" :model="m.model"></component>@endforeach</Card>`)
    expect(html).not.toContain('<component')
    expect(html).toContain('<section class="card"><p class="region" data-model="user"')
  })

  it('draws the self-closing form, with its props', async () => {
    const html = await render(`${MODELS}<div>@foreach(models as m)<component :is="m.name" :model="m.model" />@endforeach</div>`)
    expect(html).not.toContain('<component')
    expect(html).toContain('data-model="user"')
    expect(html).toContain('data-model="team"')
  })

  it('draws an element a row names, with the attributes the row evaluated', async () => {
    const html = await render(`<script server>const tags = [{ tag: 'span', title: 'a "quoted" title' }, { tag: 'em', title: '' }]</script><div>@foreach(tags as t)<component :is="t.tag" :title="t.title">x</component>@endforeach</div>`)
    expect(html).not.toContain('__stx_')
    expect(html).toContain('<span title="a &quot;quoted&quot; title">x</span>')
    expect(html).toContain('<em title="">x</em>')
  })

  it('leaves a name a row cannot resolve as the placeholder comment, not a lookup', async () => {
    const html = await render(`<script server>const rows = [{ name: null }]</script><div>@foreach(rows as r)<component :is="r.name"></component>@endforeach</div>`)
    expect(html).toContain('<!-- dynamic component: could not resolve')
    expect(html).not.toContain('ENOENT')
  })
})

describe('the self-closing form outside a loop', () => {
  it('passes its props', async () => {
    const html = await render(`<component :is="'Region'" :model="'team'" count="3" />`)
    expect(html).toContain('<p class="region" data-model="team" data-count="3">')
  })
})
