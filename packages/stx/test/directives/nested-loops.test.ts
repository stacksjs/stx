import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processLoops } from '../../src/loops'
import { processConditionals } from '../../src/conditionals'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }
const filePath = 'test.stx'

/**
 * Render a template the same way `processStxTemplate` does for the slice of
 * the pipeline these tests cover: loops first, then conditionals on the
 * loop-expanded output. Anything @if/@elseif/@else inside @for must work
 * after this two-step pass — the rendered loop output is what conditionals
 * see.
 */
function render(template: string, context: Record<string, any> = {}): string {
  let out = processLoops(template, context, filePath, defaultOptions)
  out = processConditionals(out, context, filePath)
  return out
}

describe('@for — nested loops', () => {
  it('iterates a nested @for(... of ...) and binds the inner iter-var', () => {
    const out = render(
      '@for(const g of groups)<section>@for(const kid of g.kids)<i>{{ kid }}</i>@endfor</section>@endfor',
      {
        groups: [
          { kids: ['a', 'b'] },
          { kids: ['c'] },
        ],
      },
    )
    expect(out).toContain('<i>a</i>')
    expect(out).toContain('<i>b</i>')
    expect(out).toContain('<i>c</i>')
    expect(out).not.toContain('is not defined')
  })

  it('binds object-property access on the inner iter-var', () => {
    const out = render(
      '@for(const g of groups)@for(const kid of g.kids)<p>{{ kid.name }}</p>@endfor@endfor',
      {
        groups: [
          { kids: [{ name: 'alice' }, { name: 'bob' }] },
          { kids: [{ name: 'carol' }] },
        ],
      },
    )
    expect(out).toContain('<p>alice</p>')
    expect(out).toContain('<p>bob</p>')
    expect(out).toContain('<p>carol</p>')
  })

  it('keeps the outer iter-var available inside the inner body', () => {
    const out = render(
      '@for(const g of groups)@for(const kid of g.kids)<p>{{ g.label }}/{{ kid }}</p>@endfor@endfor',
      {
        groups: [
          { label: 'Letters', kids: ['a', 'b'] },
          { label: 'Digits', kids: ['1'] },
        ],
      },
    )
    expect(out).toContain('<p>Letters/a</p>')
    expect(out).toContain('<p>Letters/b</p>')
    expect(out).toContain('<p>Digits/1</p>')
  })

  it('iterates a triply-nested @for', () => {
    const out = render(
      '@for(const r of rows)@for(const c of r.cells)@for(const v of c.values)<x>{{ v }}</x>@endfor@endfor@endfor',
      {
        rows: [
          { cells: [{ values: [1, 2] }, { values: [3] }] },
          { cells: [{ values: [4] }] },
        ],
      },
    )
    expect(out).toContain('<x>1</x>')
    expect(out).toContain('<x>2</x>')
    expect(out).toContain('<x>3</x>')
    expect(out).toContain('<x>4</x>')
  })

  it('supports `for (let i = 0; i < n; i++)` style loops with nested iteration', () => {
    const out = render(
      '@for(let i = 0; i < items.length; i++)@for(const tag of items[i].tags)<t>{{ items[i].name }}:{{ tag }}</t>@endfor@endfor',
      {
        items: [
          { name: 'a', tags: ['x', 'y'] },
          { name: 'b', tags: ['z'] },
        ],
      },
    )
    expect(out).toContain('<t>a:x</t>')
    expect(out).toContain('<t>a:y</t>')
    expect(out).toContain('<t>b:z</t>')
  })

  it('renders nothing for an empty inner array without erroring', () => {
    const out = render(
      '@for(const g of groups)<section>@for(const kid of g.kids)<i>{{ kid }}</i>@endfor</section>@endfor',
      { groups: [{ kids: [] }, { kids: ['only'] }] },
    )
    expect(out).toContain('<section></section>')
    expect(out).toContain('<i>only</i>')
    expect(out).not.toContain('is not defined')
  })
})

describe('@for — @if branching inside the loop body', () => {
  it('takes the matching @if branch with the iter-var in scope', () => {
    const out = render(
      [
        '@for(const row of rows)',
        '  @if(row.kind === \'header\')<h>{{ row.label }}</h>@endif',
        '  @if(row.kind === \'card\')<c>{{ row.name }}</c>@endif',
        '@endfor',
      ].join('\n'),
      {
        rows: [
          { kind: 'header', label: 'A' },
          { kind: 'card', name: 'apple' },
          { kind: 'header', label: 'B' },
          { kind: 'card', name: 'banana' },
        ],
      },
    )
    expect(out).toContain('<h>A</h>')
    expect(out).toContain('<c>apple</c>')
    expect(out).toContain('<h>B</h>')
    expect(out).toContain('<c>banana</c>')
  })

  it('handles @if/@else branching inside @for', () => {
    const out = render(
      '@for(const n of nums)@if(n > 10)<big>{{ n }}</big>@else<small>{{ n }}</small>@endif@endfor',
      { nums: [3, 25, 7, 100] },
    )
    expect(out).toContain('<small>3</small>')
    expect(out).toContain('<big>25</big>')
    expect(out).toContain('<small>7</small>')
    expect(out).toContain('<big>100</big>')
  })

  it('handles @if/@elseif/@else inside @for', () => {
    const out = render(
      '@for(const n of nums)@if(n < 0)<n>{{ n }}</n>@elseif(n === 0)<z/>@else<p>{{ n }}</p>@endif@endfor',
      { nums: [-2, 0, 5] },
    )
    expect(out).toContain('<n>-2</n>')
    expect(out).toContain('<z/>')
    expect(out).toContain('<p>5</p>')
  })

  it('combines nested @for with @if branching', () => {
    const out = render(
      [
        '@for(const g of groups)',
        '  <section>{{ g.label }}',
        '    @for(const item of g.items)',
        '      @if(item.show)<i>{{ item.name }}</i>@endif',
        '    @endfor',
        '  </section>',
        '@endfor',
      ].join('\n'),
      {
        groups: [
          { label: 'A', items: [{ show: true, name: 'a1' }, { show: false, name: 'a2' }] },
          { label: 'B', items: [{ show: true, name: 'b1' }] },
        ],
      },
    )
    expect(out).toContain('<i>a1</i>')
    expect(out).not.toContain('<i>a2</i>')
    expect(out).toContain('<i>b1</i>')
    expect(out).toContain('A')
    expect(out).toContain('B')
  })
})
