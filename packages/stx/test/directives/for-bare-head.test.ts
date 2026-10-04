/**
 * `@for(item of items)` without `let` or `const`.
 *
 * The head is compiled into a plain `for (…)` inside a sloppy-mode function,
 * where an undeclared head ASSIGNS a global. The loop rendered correctly, so
 * nothing looked wrong - but every server render wrote `globalThis.item`,
 * shared across requests, and a loop variable named `name`, `status` or
 * `event` overwrote the real global of that name.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { declareBareLoopHead } from '../../src/loops'
import { processDirectives } from '../../src/process'

const render = (template: string, context: Record<string, unknown>) =>
  processDirectives(template, context, '/tmp/for-bare-head.stx', defaultConfig, new Set())

const PROBE = '__stxForHeadProbe'
afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PROBE]
})

describe('a bare @for head', () => {
  it('renders, and leaves no global behind', async () => {
    const html = await render(`@for(${PROBE} of items)<b>{{ ${PROBE} }}</b>@endfor`, { items: ['a', 'b'] })
    expect(html).toBe('<b>a</b><b>b</b>')
    expect(PROBE in globalThis).toBe(false)
  })

  it('does the same for `in` and for a destructuring pattern', async () => {
    expect(await render(`@for(${PROBE} in items)<b>{{ ${PROBE} }}</b>@endfor`, { items: ['x', 'y'] })).toBe('<b>0</b><b>1</b>')
    expect(await render('@for([k, v] of pairs)<b>{{ k }}={{ v }}</b>@endfor', { pairs: [['a', 1]] })).toBe('<b>a=1</b>')
    expect(PROBE in globalThis).toBe(false)
    expect('k' in globalThis).toBe(false)
  })
})

describe('declareBareLoopHead', () => {
  it('declares only an undeclared iteration head', () => {
    expect(declareBareLoopHead('item of items')).toBe('let item of items')
    expect(declareBareLoopHead(' key in obj')).toBe(' let key in obj')
    expect(declareBareLoopHead('[a, b] of pairs')).toBe('let [a, b] of pairs')
    expect(declareBareLoopHead('const item of items')).toBe('const item of items')
    expect(declareBareLoopHead('let i = 0; i < 3; i++')).toBe('let i = 0; i < 3; i++')
    // A C-style head re-using an outer variable is deliberate; leave it be.
    expect(declareBareLoopHead('i = 0; i < 3; i++')).toBe('i = 0; i < 3; i++')
  })
})
