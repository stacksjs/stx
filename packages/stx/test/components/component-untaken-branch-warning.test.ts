/**
 * A component in a branch that loses does not warn that a loop of its own is
 * not iterable.
 *
 * Components expand before the page's conditionals, so a component inside an
 * `@if` that loses is still rendered -- against props that only exist in the
 * branch that wins. The output was right, because the conditional removed it,
 * but the component's own pass reported its deferred loop warnings before the
 * parent decided, so the warning went out anyway. ReviewOS logged one per
 * request on every pull request tab except the one that shows the thread.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

let tempDir = ''
let componentsDir = ''
let warnings: string[] = []
const original = console.warn

beforeAll(async () => {
  tempDir = createTempDir('stx-component-untaken-')
  componentsDir = join(tempDir, 'components')
  await mkdir(componentsDir, { recursive: true })
  await writeFile(join(componentsDir, 'Bar.stx'), '<div class="bar">@foreach (summaries as s)<i>{{ s }}</i>@endforeach</div>')
  await writeFile(join(componentsDir, 'Thread.stx'), '<section><Bar :summaries="opening.reactions" /></section>')
})

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

beforeEach(() => {
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(String(args[0])) }
})

afterEach(() => {
  console.warn = original
})

function render(template: string, context: Record<string, unknown>): Promise<string> {
  return processDirectives(template, context, join(tempDir, 'page.stx'), { componentsDir, partialsDir: componentsDir } as any, new Set<string>())
}

const notIterable = (): string[] => warnings.filter(warning => warning.includes('is not iterable server-side'))

describe('a component in a branch that loses', () => {
  it('does not warn, two components deep', async () => {
    const out = await render('@if (show)<Thread :opening="opening" />@endif', { show: false, opening: {} })

    expect(out).not.toContain('class="bar"')
    expect(notIterable()).toEqual([])
  })

  it('renders the winning branch as before', async () => {
    const out = await render('@if (show)<Thread :opening="opening" />@endif', { show: true, opening: { reactions: ['a', 'b'] } })

    expect(out).toContain('<i>a</i><i>b</i>')
    expect(notIterable()).toEqual([])
  })

  it('still warns, once, for a component that renders', async () => {
    const out = await render('<Thread :opening="opening" />', { opening: {} })

    expect(out).not.toContain('foreach-not-iterable')
    expect(notIterable()).toHaveLength(1)
    expect(notIterable()[0]).toContain('@foreach(summaries)')
  })
})
