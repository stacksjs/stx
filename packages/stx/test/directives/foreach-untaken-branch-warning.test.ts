/**
 * A loop in a branch that loses does not warn that its collection is not
 * iterable.
 *
 * Loops expand before the conditionals around them: a nested loop runs before
 * its iteration's `@if`, and a page-level loop before the page's `@if`, so
 * loop variables are in scope for both. The loop below therefore evaluated
 * `block.items` for every block, headings included, where it is undefined.
 * The HTML came out right -- the conditional removed the branch -- but the
 * build warning had already gone out, 131 times per crawl on a real legal
 * page. It has to wait for the conditionals.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processLoops } from '../../src/loops'
import { processDirectives } from '../../src/process'

const base = {
  ...defaultConfig,
  componentsDir: '/tmp',
  partialsDir: '/tmp',
  layoutsDir: '/tmp',
  autoShell: false,
} as never

function render(template: string, context: Record<string, unknown> = {}): Promise<string> {
  return processDirectives(template, context, '/app/page.stx', base, new Set<string>())
}

let warnings: string[] = []
const original = console.warn

beforeEach(() => {
  warnings = []
  console.warn = (...args: unknown[]) => { warnings.push(String(args[0])) }
})

afterEach(() => {
  console.warn = original
})

const notIterable = () => warnings.filter(w => w.includes('is not iterable'))

const BLOCKS = [
  { kind: 'heading', value: 'Terms' },
  { kind: 'list', items: ['one', 'two'] },
  { kind: 'text', value: 'Body' },
]

const LEGAL = `<div>@foreach(blocks as block)
  @if(block.kind === 'heading')
    <h2>{{ block.value }}</h2>
  @elseif(block.kind === 'list')
    <ul>@foreach(block.items as item)<li>{{ item }}</li>@endforeach</ul>
  @else
    <p>{{ block.value }}</p>
  @endif
@endforeach</div>`

describe('@foreach in a branch that is not taken', () => {
  it('does not warn for a nested loop in a losing @elseif', async () => {
    const out = await render(LEGAL, { blocks: BLOCKS })

    expect(out).toContain('<h2>Terms</h2>')
    expect(out).toContain('<li>one</li>')
    expect(out).toContain('<li>two</li>')
    expect(out).toContain('<p>Body</p>')
    expect(out).not.toContain('not iterable')
    expect(out).not.toContain('stx:foreach-not-iterable')
    expect(notIterable()).toEqual([])
  })

  it('does not warn for a page-level loop in a losing @if', async () => {
    const out = await render(`@if(show)<ul>@foreach(missing as m)<li>{{ m }}</li>@endforeach</ul>@else<p>none</p>@endif`, { show: false })

    expect(out).toContain('<p>none</p>')
    expect(notIterable()).toEqual([])
  })

  it('does not warn when processLoops is called on its own either', () => {
    const out = processLoops(LEGAL, { blocks: BLOCKS }, '/app/page.stx')

    expect(out).toContain('<li>one</li>')
    expect(notIterable()).toEqual([])
  })
})

describe('@foreach in a branch that is taken', () => {
  it('still warns, once per loop that renders', async () => {
    const out = await render(LEGAL, { blocks: [{ kind: 'list' }] })

    expect(out).toContain('not iterable')
    expect(out).not.toContain('stx:foreach-not-iterable')
    expect(notIterable()).toHaveLength(1)
    expect(notIterable()[0]).toContain('@foreach(block.items)')
    expect(notIterable()[0]).toContain('/app/page.stx')
  })

  it('still warns at page level', async () => {
    await render(`@if(show)<ul>@foreach(missing as m)<li>{{ m }}</li>@endforeach</ul>@endif`, { show: true })

    expect(notIterable()).toHaveLength(1)
  })

  it('still warns from processLoops called on its own', () => {
    processLoops('@foreach(missing as m){{ m }}@endforeach', {}, '/app/page.stx')

    expect(notIterable()).toHaveLength(1)
  })
})
