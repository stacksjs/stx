import { expect, test } from 'bun:test'
import { processLoops } from '../../src/loops'

const render = (source: string, data: Record<string, any> = {}) => processLoops(source, data, 'loops.stx', { debug: false })

test('renders the current iteration before break and continue', () => {
  expect(render('@foreach(items as item)<b>{{ item }}</b>@break(item === 2)@endforeach', { items: [1, 2, 3] })).toBe('<b>1</b><b>2</b>')
  expect(render('@foreach(items as item)<b>{{ item }}</b>@continue(item === 2)<i>{{ item }}</i>@endforeach', { items: [1, 2, 3] })).toBe('<b>1</b><i>1</i><b>2</b><b>3</b><i>3</i>')
})

test('loop control obeys enclosing conditions and the first control in source order', () => {
  expect(render('@foreach(items as item)@if(false)@break(true)@endif{{ item }}@endforeach', { items: [1, 2] })).toBe('12')
  expect(render('@foreach(items as item){{ item }}@break(item === 1)@continue(true)@endforeach', { items: [1, 2] })).toBe('1')
})

test('inner conditional loop control stays within its own loop', () => {
  expect(render('@foreach(groups as group)[@foreach(group as item)@break(item === 2){{ item }}@endforeach]@endforeach', { groups: [[1, 2], [1, 2]] })).toBe('[1][1]')
})

test('for and while preserve literal backslashes and escape interpolated data', () => {
  const content = String.raw`<p>C:\temp\{{ value }}</p>`
  expect(render(`@for(let i = 0; i < 1; i++)${content}@endfor`, { value: '<b>&' })).toBe(String.raw`<p>C:\temp\&lt;b&gt;&amp;</p>`)
  expect(render(`@while(true)${content}@break(true)@endwhile`, { value: '<b>&' })).toBe(String.raw`<p>C:\temp\&lt;b&gt;&amp;</p>`)
})

test('for interpolation recognizes nested object literals and URL attributes', () => {
  expect(render('@for(let i = 0; i < 1; i++){{ ({ value: i }).value }}@endfor')).toBe('0')
  expect(render('@for(let i = 0; i < 1; i++)<a title=">" href="{{ target }}">x</a>@endfor', { target: 'javascript:alert(1)' })).not.toContain('href="javascript:')
})


test('loop control text inside an expression is data', () => {
  expect(render("@for(let i = 0; i < 1; i++){{ '@break(true)' }}@endfor")).toBe('&#64;break(true)')
})
