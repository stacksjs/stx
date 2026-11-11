/**
 * A component in a `space-y-*` stack is told it will get no gap
 * (stacksjs/stx#2178).
 *
 * A component with a client scope is wrapped in `<div
 * data-stx-component-wrapper>`, which generates no box. `space-y-*` and
 * `space-x-*` put their margin on the parent's direct children after the
 * first, so the margin lands on that wrapper and is dropped: the component
 * renders flush against the sibling before it and nothing says so. One
 * dashboard had 81 such stacks across 61 templates.
 *
 * The wrapper cannot be removed -- the native host identifies component
 * boundaries by it -- so the warning names the stack and the spelling that
 * works. The silent cases matter as much as the loud one: a first child never
 * receives the margin, a component with no scope has no wrapper, a `gap`
 * parent already works, and a root the scope can sit on directly (`<li>`)
 * keeps its box.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { resetMarginStackWarnings } from '../../src/component-renderer'
import { processDirectives } from '../../src/process'
import { siblingMarginChildren } from '../../src/server-bindings'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

let warnings: string[] = []
const realWarn = console.warn

beforeEach(() => {
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  resetMarginStackWarnings()
  clearComponentCache()
})

afterEach(() => {
  console.warn = realWarn
})

async function render(markup: string): Promise<string> {
  const root = createTempDir('stx-margin-stack-')
  await mkdir(join(root, 'components'), { recursive: true })
  // A client script gives the component a scope, hence a wrapper.
  await Bun.write(join(root, 'components', 'Card.stx'), '<script client>\nconst open = state(false)\n</script><div class="card" :data-open="open">Card</div>\n')
  await Bun.write(join(root, 'components', 'Plain.stx'), '<div class="plain">Plain</div>\n')
  await Bun.write(join(root, 'components', 'Item.stx'), '<script client>\nconst open = state(false)\n</script><li class="item" :data-open="open">Item</li>\n')
  const file = join(root, 'page.stx')
  await Bun.write(file, markup)
  return processDirectives(markup, {}, file, { root, componentsDir: join(root, 'components'), cache: false }, new Set())
}

const stackWarnings = (): string[] => warnings.filter(line => line.includes('stack, so it gets no spacing'))

describe('a wrapped component in a sibling-margin stack', () => {
  it('is named, with the utility and the gap spelling that works', async () => {
    const html = await render('<div class="space-y-6"><div>Stats</div><Card /></div>')
    expect(html).toContain('data-stx-component-wrapper')
    expect(stackWarnings()).toHaveLength(1)
    expect(stackWarnings()[0]).toContain('<Card>')
    expect(stackWarnings()[0]).toContain('page.stx')
    expect(stackWarnings()[0]).toContain('"space-y-6"')
    expect(stackWarnings()[0]).toContain('"flex flex-col gap-6"')
  })

  it('reads a variant and the horizontal axis', async () => {
    await render('<div class="p-4 md:space-x-4"><span>a</span><Card /></div>')
    expect(stackWarnings()).toHaveLength(1)
    expect(stackWarnings()[0]).toContain('"md:space-x-4"')
    expect(stackWarnings()[0]).toContain('"flex md:gap-4"')
  })

  it('says nothing for the first child, which never receives the margin', async () => {
    await render('<div class="space-y-6"><Card /><div>After</div></div>')
    expect(stackWarnings()).toEqual([])
  })

  it('says nothing for a component with no scope, which has no wrapper', async () => {
    const html = await render('<div class="space-y-6"><div>Stats</div><Plain /></div>')
    expect(html).not.toContain('data-stx-component-wrapper')
    expect(stackWarnings()).toEqual([])
  })

  it('says nothing when the scope sits on the component’s own root', async () => {
    await render('<ul class="space-y-2"><li>first</li><Item /></ul>')
    expect(stackWarnings()).toEqual([])
  })

  it('says nothing for a gap parent, or for a stack the component is not directly in', async () => {
    await render('<div class="flex flex-col gap-6"><div>Stats</div><Card /></div><div class="space-y-6"><div>a</div><div><Card /></div></div>')
    expect(stackWarnings()).toEqual([])
  })
})

describe('siblingMarginChildren', () => {
  it('maps later children to their parent’s utility and skips hidden siblings', () => {
    const html = '<div class="space-y-4"><p hidden>x</p><a>1</a><b>2</b><br><i>3</i></div><div class="space-y-reverse"><a>1</a><b>2</b></div>'
    const later = siblingMarginChildren(html)
    expect([...later.entries()].map(([start, utility]) => [html.slice(start, start + 3), utility])).toEqual([
      ['<b>', 'space-y-4'],
      ['<br', 'space-y-4'],
      ['<i>', 'space-y-4'],
    ])
  })
})
