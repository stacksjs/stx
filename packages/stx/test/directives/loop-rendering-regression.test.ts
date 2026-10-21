import { expect, test } from 'bun:test'
import { processLoops } from '../../src/loops'
import { renderString } from '../../src/render'

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

test('for loop break and continue obey conditions and retain rendered prefixes', () => {
  expect(render('@for(let i = 0; i < 5; i++){{ i }}@if(i === 2)@break@endif@endfor')).toBe('012')
  expect(render('@for(let i = 0; i < 3; i++){{ i }}@if(i === 1)@continue@endif!@endfor')).toBe('0!12!')
})

test('for loop break stops iteration before evaluating later loop updates', () => {
  const steps: number[] = []
  expect(render('@for(let i = 0; i < 5; steps.push(i++))@if(i === 2)@break@endif{{ i }}@endfor', { steps })).toBe('01')
  expect(steps).toEqual([0, 1])
})


test('recursive for rendering keeps control text inside interpolations inert', () => {
  expect(render("@for(let i = 0; i < 2; i++)@if(true){{ '@break(true)' }}@endif@endfor")).toBe('&#64;break(true)&#64;break(true)')
  expect(render("@foreach(items as item){{ '@continue' }}@endforeach", { items: [1, 2] })).toBe('&#64;continue&#64;continue')
})

test('a nested while consumes its own controls', () => {
  expect(render('@for(let i = 0; i < 2; i++)@if(true)@while(true)X@break@endwhile@endif@endfor')).toBe('XX')
})

test('control conditions run in source order and stop after an active continue', () => {
  const queue = [true, false]
  expect(render('@for(let i = 0; i < 2; i++)@if(true){{ i }}@endif@continue(queue.shift())@break(queue.shift())!@endfor', { queue })).toBe('01!')
  expect(queue).toEqual([])
})


test('nested for controls stay within an outer foreach', () => {
  expect(render('@foreach(items as item)[@for(let i = 0; i < 3; i++)@if(i === 1)@break@endif{{ item }}{{ i }}@endfor]@endforeach', { items: ['a', 'b'] })).toBe('[a0][b0]')
})

test('renderString stops a conditional for loop at its break', async () => {
  expect(await renderString('@for(let i = 0; i < 4; i++)@if(i === 2)@break@endif{{ i }}@endfor')).toBe('01')
})
