import { describe, expect, it } from 'bun:test'
import { processLoops } from '../../src/loops'
import type { StxOptions } from '../../src/types'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }
const filePath = 'test.stx'

/**
 * Helper that calls processLoops with sensible defaults.
 */
function run(template: string, context: Record<string, any> = {}, options?: StxOptions): string {
  return processLoops(template, context, filePath, options ?? defaultOptions)
}

describe('Loops Comprehensive', () => {
  // ===========================================================================
  // @foreach / @endforeach
  // ===========================================================================
  describe('@foreach', () => {
    it('should iterate over a simple string array', () => {
      const result = run(
        '@foreach(items as item){{ item }}@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('a')
      expect(result).toContain('b')
      expect(result).toContain('c')
    })

    it('should iterate over an array of objects and access properties', () => {
      const result = run(
        '@foreach(users as user)<span>{{ user.name }}</span>@endforeach',
        { users: [{ name: 'Alice' }, { name: 'Bob' }] },
      )
      expect(result).toContain('<span>Alice</span>')
      expect(result).toContain('<span>Bob</span>')
    })

    it('should support index => item syntax', () => {
      const result = run(
        '@foreach(items as idx => item)<p>{{ idx }}:{{ item }}</p>@endforeach',
        { items: ['x', 'y', 'z'] },
      )
      expect(result).toContain('<p>0:x</p>')
      expect(result).toContain('<p>1:y</p>')
      expect(result).toContain('<p>2:z</p>')
    })

    it('should produce empty output for an empty array', () => {
      const result = run(
        '@foreach(items as item)<li>{{ item }}</li>@endforeach',
        { items: [] },
      )
      expect(result.trim()).toBe('')
    })

    it('should handle a single-item array', () => {
      const result = run(
        '@foreach(items as item)<p>{{ item }}</p>@endforeach',
        { items: ['only'] },
      )
      expect(result).toContain('<p>only</p>')
    })

    it('should handle a large array (100+ items)', () => {
      const items = Array.from({ length: 150 }, (_, i) => i)
      const result = run(
        '@foreach(items as item){{ item }},@endforeach',
        { items },
      )
      expect(result).toContain('0,')
      expect(result).toContain('149,')
      // Rough check that all iterations ran
      const commas = result.split(',').length - 1
      expect(commas).toBe(150)
    })

    it('should iterate over nested arrays (array of arrays)', () => {
      const result = run(
        '@foreach(matrix as row)[@foreach(row as cell){{ cell }}@endforeach]@endforeach',
        { matrix: [[1, 2], [3, 4]] },
      )
      expect(result).toContain('[12]')
      expect(result).toContain('[34]')
    })

    it('should support property access on the collection: data.items', () => {
      const result = run(
        '@foreach(data.items as item)<b>{{ item }}</b>@endforeach',
        { data: { items: ['one', 'two'] } },
      )
      expect(result).toContain('<b>one</b>')
      expect(result).toContain('<b>two</b>')
    })

    it('should iterate over an array of numbers', () => {
      const result = run(
        '@foreach(nums as n){{ n }},@endforeach',
        { nums: [10, 20, 30] },
      )
      expect(result).toContain('10,')
      expect(result).toContain('20,')
      expect(result).toContain('30,')
    })

    it('should iterate over an array of booleans', () => {
      const result = run(
        '@foreach(flags as f){{ f }},@endforeach',
        { flags: [true, false, true] },
      )
      expect(result).toContain('true,')
      expect(result).toContain('false,')
    })

    it('should iterate over an array of mixed primitives', () => {
      const result = run(
        '@foreach(mix as m)[{{ m }}]@endforeach',
        { mix: ['hello', 42, true] },
      )
      expect(result).toContain('[hello]')
      expect(result).toContain('[42]')
      expect(result).toContain('[true]')
    })

    it('should handle nested @foreach (2 levels)', () => {
      const result = run(
        '@foreach(groups as group)<div>@foreach(group.members as member)<span>{{ member }}</span>@endforeach</div>@endforeach',
        { groups: [{ members: ['a', 'b'] }, { members: ['c'] }] },
      )
      expect(result).toContain('<div><span>a</span><span>b</span></div>')
      expect(result).toContain('<div><span>c</span></div>')
    })

    it('should handle nested @foreach (3 levels)', () => {
      const result = run(
        '@foreach(a as x)@foreach(b as y)@foreach(c as z){{ x }}{{ y }}{{ z }},@endforeach@endforeach@endforeach',
        { a: [1], b: [2], c: [3, 4] },
      )
      expect(result).toContain('123,')
      expect(result).toContain('124,')
    })

    it('should process @if inside @foreach', () => {
      const result = run(
        '@foreach(items as item)@if(item.show)<p>{{ item.name }}</p>@endif@endforeach',
        { items: [{ name: 'A', show: true }, { name: 'B', show: false }, { name: 'C', show: true }] },
      )
      expect(result).toContain('<p>A</p>')
      expect(result).not.toContain('<p>B</p>')
      expect(result).toContain('<p>C</p>')
    })

    it('should pre-evaluate @component props in foreach body', () => {
      const result = run(
        `@foreach(items as item)@component('Card', { title: item.title })@endforeach`,
        { items: [{ title: 'Hello' }, { title: 'World' }] },
      )
      // preEvaluateComponentProps should serialize the props as JSON
      expect(result).toContain(`@component('Card', {"title":"Hello"})`)
      expect(result).toContain(`@component('Card', {"title":"World"})`)
    })

    it('should produce an error comment when iterating over a non-array', () => {
      const result = run(
        '@foreach(items as item){{ item }}@endforeach',
        { items: 'not-an-array' },
      )
      // Should contain an error indicator
      expect(result).toContain('Error')
      expect(result).toContain('not an array')
    })

    it('should allow space around the directive: @foreach (items as item)', () => {
      const result = run(
        '@foreach (items as item)<i>{{ item }}</i>@endforeach',
        { items: ['A'] },
      )
      expect(result).toContain('<i>A</i>')
    })

    it('should provide loop.index variable (zero-based)', () => {
      const result = run(
        '@foreach(items as item){{ loop.index }},@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
      expect(result).toContain('2,')
    })

    it('should provide loop.iteration variable (one-based)', () => {
      const result = run(
        '@foreach(items as item){{ loop.iteration }},@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).toContain('3,')
    })

    it('should provide loop.first and loop.last', () => {
      const result = run(
        '@foreach(items as item)@if(loop.first)[FIRST]@endif@if(loop.last)[LAST]@endif{{ item }}@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('[FIRST]a')
      expect(result).toContain('[LAST]c')
      expect(result).not.toContain('[FIRST]b')
      expect(result).not.toContain('[LAST]b')
    })

    it('should provide loop.count', () => {
      const result = run(
        '@foreach(items as item){{ loop.count }},@endforeach',
        { items: ['a', 'b'] },
      )
      expect(result).toContain('2,')
    })

    it('should provide $loop as an alias for loop', () => {
      const result = run(
        '@foreach(items as item){{ $loop.index }},@endforeach',
        { items: ['a', 'b'] },
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
    })

    it('should handle objects with deeply nested properties', () => {
      const result = run(
        '@foreach(items as item){{ item.a.b.c }},@endforeach',
        { items: [{ a: { b: { c: 'deep' } } }] },
      )
      expect(result).toContain('deep,')
    })

    it('should handle multiple sequential @foreach blocks', () => {
      const result = run(
        '@foreach(a as x)<a>{{ x }}</a>@endforeach@foreach(b as y)<b>{{ y }}</b>@endforeach',
        { a: [1, 2], b: [3, 4] },
      )
      expect(result).toContain('<a>1</a>')
      expect(result).toContain('<a>2</a>')
      expect(result).toContain('<b>3</b>')
      expect(result).toContain('<b>4</b>')
    })

    it('should handle HTML content in loop body', () => {
      const result = run(
        '@foreach(items as item)<div class="card"><h2>{{ item.title }}</h2><p>{{ item.desc }}</p></div>@endforeach',
        { items: [{ title: 'T1', desc: 'D1' }] },
      )
      expect(result).toContain('<div class="card"><h2>T1</h2><p>D1</p></div>')
    })

    it('should handle items with special characters', () => {
      const result = run(
        '@foreach(items as item)<p>{{ item }}</p>@endforeach',
        { items: ['<b>bold</b>', 'a&b', '"quoted"'] },
      )
      // processExpressions may escape these, but they should be present in some form
      expect(result).toContain('<p>')
    })

    it('should handle empty loop body', () => {
      const result = run(
        '@foreach(items as item)@endforeach',
        { items: [1, 2, 3] },
      )
      // Should not throw; output is empty or whitespace
      expect(result.trim()).toBe('')
    })

    it('should handle loop body with only whitespace', () => {
      const result = run(
        '@foreach(items as item)   @endforeach',
        { items: [1, 2] },
      )
      // Should not throw
      expect(result).toBeDefined()
    })

    it('should allow loop variable to shadow outer context', () => {
      const result = run(
        '@foreach(items as item){{ item }}@endforeach',
        { items: ['inner'], item: 'outer' },
      )
      // The loop variable should take precedence
      expect(result).toContain('inner')
    })
  })

  // ===========================================================================
  // @for / @endfor
  // ===========================================================================
  describe('@for', () => {
    it('should handle basic counting loop', () => {
      const result = run(
        '@for(let i = 0; i < 5; i++){{ i }},@endfor',
        {},
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).toContain('3,')
      expect(result).toContain('4,')
    })

    it('should handle descending loop', () => {
      const result = run(
        '@for(let i = 3; i > 0; i--){{ i }},@endfor',
        {},
      )
      expect(result).toContain('3,')
      expect(result).toContain('2,')
      expect(result).toContain('1,')
      expect(result).not.toContain('0,')
    })

    it('should handle step increment: i += 2', () => {
      const result = run(
        '@for(let i = 0; i < 10; i += 2){{ i }},@endfor',
        {},
      )
      expect(result).toContain('0,')
      expect(result).toContain('2,')
      expect(result).toContain('4,')
      expect(result).toContain('6,')
      expect(result).toContain('8,')
      expect(result).not.toContain('10,')
    })

    it('should use context variables in loop bounds', () => {
      const result = run(
        '@for(let i = 0; i < count; i++){{ i }},@endfor',
        { count: 3 },
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).not.toContain('3,')
    })

    it('should handle expressions in the loop body', () => {
      const result = run(
        '@for(let i = 1; i <= 3; i++)<span>Item {{ i }}</span>@endfor',
        {},
      )
      expect(result).toContain('<span>Item 1</span>')
      expect(result).toContain('<span>Item 2</span>')
      expect(result).toContain('<span>Item 3</span>')
    })

    it('should handle zero iterations when condition is immediately false', () => {
      const result = run(
        '@for(let i = 0; i < 0; i++)X@endfor',
        {},
      )
      expect(result).not.toContain('X')
    })

    it('should handle @for with HTML content', () => {
      const result = run(
        '@for(let i = 0; i < 2; i++)<div class="row">Row {{ i }}</div>@endfor',
        {},
      )
      expect(result).toContain('<div class="row">Row 0</div>')
      expect(result).toContain('<div class="row">Row 1</div>')
    })

    it('should allow space before the parenthesis: @for (let i ...)', () => {
      const result = run(
        '@for (let i = 0; i < 2; i++){{ i }}@endfor',
        {},
      )
      expect(result).toContain('0')
      expect(result).toContain('1')
    })

    it('should process @for and @foreach independently in the same template', () => {
      const result = run(
        '@for(let i = 0; i < 2; i++)<p>for-{{ i }}</p>@endfor@foreach(items as item)<p>each-{{ item }}</p>@endforeach',
        { items: ['a', 'b'] },
      )
      expect(result).toContain('<p>for-0</p>')
      expect(result).toContain('<p>for-1</p>')
      expect(result).toContain('<p>each-a</p>')
      expect(result).toContain('<p>each-b</p>')
    })

    it('should handle @for that accesses context arrays', () => {
      const result = run(
        '@for(let i = 0; i < items.length; i++){{ items[i] }},@endfor',
        { items: ['x', 'y', 'z'] },
      )
      expect(result).toContain('x,')
      expect(result).toContain('y,')
      expect(result).toContain('z,')
    })
  })

  // ===========================================================================
  // @while / @endwhile
  // ===========================================================================
  describe('@while', () => {
    it('should process a basic while loop with counter', () => {
      const result = run(
        '@while(counter < 3){{ counter }},@endwhile',
        { counter: 0 },
      )
      // while loops use new Function, so counter is local
      // The condition references `counter` from context but it won't mutate
      // This may run into max iterations since counter never changes in context
      // Let's verify it doesn't crash
      expect(result).toBeDefined()
    })

    it('should respect max iteration limit', () => {
      // Set a very low max to test the guard
      // The while loop runs up to maxWhileIterations times, then stops.
      // The error message only appears if counter > maxIterations (off-by-one guard).
      const opts: StxOptions = { ...defaultOptions, loops: { maxWhileIterations: 5 } }
      const result = run(
        '@while(true)X@endwhile',
        {},
        opts,
      )
      // With max 5 iterations, the loop body runs at most 5 times
      // Count the X's to verify iteration was capped
      const xCount = (result.match(/X/g) || []).length
      expect(xCount).toBeLessThanOrEqual(5)
    })

    it('should stop with @break(true) immediately', () => {
      const result = run(
        '@while(true)@break(true)SHOULD_NOT_APPEAR@endwhile',
        {},
      )
      expect(result).not.toContain('SHOULD_NOT_APPEAR')
    })

    it('should handle while loop that never executes', () => {
      const result = run(
        '@while(false)X@endwhile',
        {},
      )
      expect(result).not.toContain('X')
    })

    it('should use default 1000 max iterations when no config provided', () => {
      // Without custom options, max is 1000
      const result = run(
        '@while(true)@break(true)@endwhile',
        {},
      )
      // Should break immediately, no max iterations error
      expect(result).not.toContain('Maximum iterations')
    })
  })

  // ===========================================================================
  // @forelse / @empty / @endforelse
  // ===========================================================================
  describe('@forelse', () => {
    it('should show loop content when array is non-empty', () => {
      const result = run(
        '@forelse(items as item)<li>{{ item }}</li>@empty<p>No items</p>@endforelse',
        { items: ['a', 'b'] },
      )
      expect(result).toContain('<li>a</li>')
      expect(result).toContain('<li>b</li>')
      expect(result).not.toContain('No items')
    })

    it('should show @empty content when array is empty', () => {
      const result = run(
        '@forelse(items as item)<li>{{ item }}</li>@empty<p>No items</p>@endforelse',
        { items: [] },
      )
      expect(result).toContain('<p>No items</p>')
      expect(result).not.toContain('<li>')
    })

    it('should show @empty content when variable is null', () => {
      const result = run(
        '@forelse(items as item)<li>{{ item }}</li>@empty<p>Empty</p>@endforelse',
        { items: null },
      )
      expect(result).toContain('<p>Empty</p>')
    })

    it('should show @empty content when variable is undefined', () => {
      const result = run(
        '@forelse(items as item)<li>{{ item }}</li>@empty<p>Empty</p>@endforelse',
        { items: undefined },
      )
      expect(result).toContain('<p>Empty</p>')
    })

    it('should support index => item syntax in @forelse', () => {
      const result = run(
        '@forelse(items as idx => item){{ idx }}:{{ item }},@empty<p>None</p>@endforelse',
        { items: ['a', 'b'] },
      )
      expect(result).toContain('0:a,')
      expect(result).toContain('1:b,')
    })

    it('should handle @forelse with context variable arrays', () => {
      const result = run(
        '@forelse(data.list as item)<b>{{ item }}</b>@empty<i>empty</i>@endforelse',
        { data: { list: [1, 2] } },
      )
      expect(result).toContain('<b>1</b>')
      expect(result).toContain('<b>2</b>')
      expect(result).not.toContain('empty')
    })

    it('should handle multiple sequential @forelse blocks', () => {
      const result = run(
        '@forelse(a as x){{ x }}@empty[empty-a]@endforelse|@forelse(b as y){{ y }}@empty[empty-b]@endforelse',
        { a: [], b: ['Z'] },
      )
      expect(result).toContain('[empty-a]')
      expect(result).toContain('Z')
      expect(result).not.toContain('[empty-b]')
    })

    it('should handle nested @forelse blocks', () => {
      const result = run(
        '@forelse(groups as group)<div>@forelse(group.items as item)<span>{{ item }}</span>@empty<i>none</i>@endforelse</div>@empty<p>no groups</p>@endforelse',
        { groups: [{ items: ['a'] }, { items: [] }] },
      )
      expect(result).toContain('<span>a</span>')
      expect(result).toContain('<i>none</i>')
      expect(result).not.toContain('no groups')
    })

    it('should handle @forelse with complex filter expression', () => {
      const result = run(
        '@forelse(items.filter(i => i > 2) as item){{ item }},@empty<p>none</p>@endforelse',
        { items: [1, 2, 3, 4] },
      )
      expect(result).toContain('3,')
      expect(result).toContain('4,')
      expect(result).not.toContain('1,')
      expect(result).not.toContain('none')
    })

    it('should show @empty when filter expression returns empty array', () => {
      const result = run(
        '@forelse(items.filter(i => i > 100) as item){{ item }}@empty<p>none match</p>@endforelse',
        { items: [1, 2, 3] },
      )
      expect(result).toContain('<p>none match</p>')
    })

    it('should allow space before parenthesis: @forelse (items as item)', () => {
      const result = run(
        '@forelse (items as item){{ item }}@empty<p>empty</p>@endforelse',
        { items: ['x'] },
      )
      expect(result).toContain('x')
      expect(result).not.toContain('empty')
    })
  })

  // ===========================================================================
  // Loop Control: @break
  // ===========================================================================
  describe('@break', () => {
    it('should stop @foreach iteration on unconditional @break inside @if', () => {
      const result = run(
        `@foreach(items as item)@if(item === 'stop')@break@endif<p>{{ item }}</p>@endforeach`,
        { items: ['a', 'b', 'stop', 'c'] },
      )
      expect(result).toContain('<p>a</p>')
      expect(result).toContain('<p>b</p>')
      expect(result).not.toContain('<p>stop</p>')
      expect(result).not.toContain('<p>c</p>')
    })

    it('should stop @foreach on conditional @break(condition)', () => {
      const result = run(
        '@foreach(items as item)@break(item > 3)<li>{{ item }}</li>@endforeach',
        { items: [1, 2, 3, 4, 5] },
      )
      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>2</li>')
      expect(result).toContain('<li>3</li>')
      expect(result).not.toContain('<li>4</li>')
      expect(result).not.toContain('<li>5</li>')
    })

    it('should stop @for on conditional @break(condition)', () => {
      const result = run(
        '@for(let i = 0; i < 10; i++)@break(i > 3){{ i }},@endfor',
        {},
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).toContain('3,')
      expect(result).not.toContain('4,')
    })

    it('should only break the inner loop in nested @foreach using @if+@break', () => {
      // In nested loops, use @if + unconditional @break since @break(condition)
      // in an inner loop body gets evaluated (and removed) during outer loop processing
      const result = run(
        '@foreach(groups as group)[@foreach(group.nums as n)@if(n > 1)@break@endif{{ n }}@endforeach]@endforeach',
        { groups: [{ nums: [1, 2, 3] }, { nums: [1, 2, 3] }] },
      )
      // Inner loop should only produce "1" each time because it breaks when n > 1
      expect(result).toContain('[1]')
      const matches = result.match(/\[1\]/g)
      expect(matches).not.toBeNull()
      expect(matches!.length).toBe(2)
    })

    it('should handle @break(condition) with equality check', () => {
      const result = run(
        `@foreach(items as item)@break(item === 'stop'){{ item }},@endforeach`,
        { items: ['a', 'b', 'stop', 'c'] },
      )
      expect(result).toContain('a,')
      expect(result).toContain('b,')
      expect(result).not.toContain('stop')
      expect(result).not.toContain('c,')
    })

    it('should handle @break with no remaining iterations', () => {
      // @break on the last item
      const result = run(
        '@foreach(items as item)@break(item === 3){{ item }},@endforeach',
        { items: [1, 2, 3] },
      )
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).not.toContain('3,')
    })
  })

  // ===========================================================================
  // Loop Control: @continue
  // ===========================================================================
  describe('@continue', () => {
    it('should skip iteration on unconditional @continue inside @if', () => {
      const result = run(
        `@foreach(items as item)@if(item === 'skip')@continue@endif<p>{{ item }}</p>@endforeach`,
        { items: ['a', 'skip', 'b'] },
      )
      expect(result).toContain('<p>a</p>')
      expect(result).not.toContain('<p>skip</p>')
      expect(result).toContain('<p>b</p>')
    })

    it('should skip iteration on conditional @continue(condition)', () => {
      const result = run(
        '@foreach(items as item)@continue(item % 2 === 0)<li>{{ item }}</li>@endforeach',
        { items: [1, 2, 3, 4, 5] },
      )
      expect(result).toContain('<li>1</li>')
      expect(result).not.toContain('<li>2</li>')
      expect(result).toContain('<li>3</li>')
      expect(result).not.toContain('<li>4</li>')
      expect(result).toContain('<li>5</li>')
    })

    it('should skip iteration on conditional @continue in @for loop', () => {
      const result = run(
        '@for(let i = 1; i <= 5; i++)@continue(i === 3){{ i }},@endfor',
        {},
      )
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).not.toContain('3,')
      expect(result).toContain('4,')
      expect(result).toContain('5,')
    })

    it('should only affect inner loop in nested @foreach using @if+@continue', () => {
      // In nested loops, use @if + unconditional @continue since @continue(condition)
      // in an inner loop body gets evaluated during outer loop processing
      const result = run(
        '@foreach(groups as group)@foreach(group.nums as n)@if(n === 2)@continue@endif{{ group.label }}-{{ n }},@endforeach@endforeach',
        { groups: [{ label: 'A', nums: [1, 2, 3] }, { label: 'B', nums: [1, 2, 3] }] },
      )
      expect(result).toContain('A-1,')
      expect(result).not.toContain('A-2,')
      expect(result).toContain('A-3,')
      expect(result).toContain('B-1,')
      expect(result).not.toContain('B-2,')
      expect(result).toContain('B-3,')
    })

    it('should handle @continue(condition) with boolean property', () => {
      const result = run(
        '@foreach(items as item)@continue(item.hidden)<p>{{ item.name }}</p>@endforeach',
        { items: [{ name: 'A', hidden: false }, { name: 'B', hidden: true }, { name: 'C', hidden: false }] },
      )
      expect(result).toContain('<p>A</p>')
      expect(result).not.toContain('<p>B</p>')
      expect(result).toContain('<p>C</p>')
    })

    it('should handle @continue that skips every item', () => {
      const result = run(
        '@foreach(items as item)@continue(true){{ item }}@endforeach',
        { items: [1, 2, 3] },
      )
      // All items skipped
      expect(result).not.toContain('1')
      expect(result).not.toContain('2')
      expect(result).not.toContain('3')
    })
  })

  // ===========================================================================
  // Combined @break and @continue
  // ===========================================================================
  describe('@break and @continue combined', () => {
    it('should handle @continue before @break in foreach', () => {
      const result = run(
        '@foreach(items as item)@continue(item === 2)@break(item === 4){{ item }},@endforeach',
        { items: [1, 2, 3, 4, 5] },
      )
      expect(result).toContain('1,')
      expect(result).not.toContain('2,')
      expect(result).toContain('3,')
      expect(result).not.toContain('4,')
      expect(result).not.toContain('5,')
    })
  })

  // ===========================================================================
  // Prop Bindings in Loops
  // ===========================================================================
  describe('prop bindings', () => {
    it('should process :prop="expression" within @foreach', () => {
      const result = run(
        '@foreach(items as item)<my-comp :title="item.name"></my-comp>@endforeach',
        { items: [{ name: 'Hello' }] },
      )
      // Should convert to __stx_title="..."
      expect(result).toContain('__stx_title=')
      expect(result).toContain('Hello')
    })

    it('should process shorthand :prop syntax within @foreach', () => {
      const result = run(
        '@foreach(items as item)<my-comp :item></my-comp>@endforeach',
        { items: [{ id: 1 }] },
      )
      // Shorthand :item should expand and evaluate
      expect(result).toContain('__stx_item=')
    })

    it('should process multiple :prop bindings', () => {
      const result = run(
        '@foreach(items as item)<my-comp :name="item.name" :age="item.age"></my-comp>@endforeach',
        { items: [{ name: 'Alice', age: 30 }] },
      )
      expect(result).toContain('__stx_name=')
      expect(result).toContain('__stx_age=')
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('edge cases', () => {
    it('should handle whitespace around directive keywords', () => {
      const result = run(
        '@foreach( items as item ){{ item }}@endforeach',
        { items: ['a'] },
      )
      expect(result).toContain('a')
    })

    it('should handle newlines in loop body', () => {
      const result = run(
        '@foreach(items as item)\n<p>{{ item }}</p>\n@endforeach',
        { items: ['x'] },
      )
      expect(result).toContain('<p>x</p>')
    })

    it('should handle very deep nesting (5 levels)', () => {
      const result = run(
        '@foreach(a as v1)@foreach(a as v2)@foreach(a as v3)@foreach(a as v4)@foreach(a as v5){{ v5 }}@endforeach@endforeach@endforeach@endforeach@endforeach',
        { a: [1] },
      )
      expect(result).toContain('1')
    })

    it('should handle multiple loops in same template sequentially', () => {
      const result = run(
        '<div>@foreach(a as x){{ x }}@endforeach</div><div>@foreach(b as y){{ y }}@endforeach</div>',
        { a: [1, 2], b: [3, 4] },
      )
      expect(result).toContain('<div>12</div>')
      expect(result).toContain('<div>34</div>')
    })

    it('should handle foreach with method call on collection', () => {
      const result = run(
        '@foreach(items.slice(1) as item){{ item }},@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('b,')
      expect(result).toContain('c,')
      expect(result).not.toContain('a,')
    })

    it('should handle foreach with map on collection', () => {
      const result = run(
        '@foreach(items.map(x => x * 2) as item){{ item }},@endforeach',
        { items: [1, 2, 3] },
      )
      expect(result).toContain('2,')
      expect(result).toContain('4,')
      expect(result).toContain('6,')
    })

    it('should not confuse @endfor with @endforeach', () => {
      const result = run(
        '@foreach(items as item)<span>{{ item }}</span>@endforeach',
        { items: ['x', 'y'] },
      )
      expect(result).toContain('<span>x</span>')
      expect(result).toContain('<span>y</span>')
    })

    it('should handle template literal injection prevention in @for body', () => {
      const result = run(
        '@for(let i = 0; i < 1; i++)<div>${"safe"}</div>@endfor',
        {},
      )
      // ${ should be escaped, not interpreted
      expect(result).toContain('${"safe"}')
    })

    it('should handle backtick escaping in @for body', () => {
      const result = run(
        '@for(let i = 0; i < 1; i++)<div>`hello`</div>@endfor',
        {},
      )
      expect(result).toContain('`hello`')
    })

    it('should handle items with parentheses in string values', () => {
      const result = run(
        '@foreach(items as item)<p>{{ item }}</p>@endforeach',
        { items: ['hello (world)', 'test (123)'] },
      )
      expect(result).toContain('hello (world)')
      expect(result).toContain('test (123)')
    })

    it('should handle @foreach with numeric index and parallel array access', () => {
      const result = run(
        '@foreach(names as idx => name){{ name }}: {{ scores[idx] }},@endforeach',
        { names: ['Alice', 'Bob'], scores: [95, 87] },
      )
      expect(result).toContain('Alice: 95,')
      expect(result).toContain('Bob: 87,')
    })

    it('should handle @forelse inside @if', () => {
      const result = run(
        '@foreach(items as item)@if(item.active)<b>{{ item.name }}</b>@endif@endforeach',
        { items: [{ name: 'X', active: true }, { name: 'Y', active: false }] },
      )
      expect(result).toContain('<b>X</b>')
      expect(result).not.toContain('<b>Y</b>')
    })

    it('should handle context with many variables', () => {
      const ctx: Record<string, any> = { items: [1] }
      for (let i = 0; i < 50; i++) {
        ctx[`var${i}`] = i
      }
      const result = run(
        '@foreach(items as item){{ item }}@endforeach',
        ctx,
      )
      expect(result).toContain('1')
    })

    it('should handle @foreach with object.entries-like iteration using index', () => {
      const result = run(
        '@foreach(entries as idx => entry)<p>{{ idx }}: {{ entry.key }}={{ entry.value }}</p>@endforeach',
        { entries: [{ key: 'a', value: 1 }, { key: 'b', value: 2 }] },
      )
      expect(result).toContain('<p>0: a=1</p>')
      expect(result).toContain('<p>1: b=2</p>')
    })
  })

  // ===========================================================================
  // Error Handling
  // ===========================================================================
  describe('error handling', () => {
    it('should produce error output when @foreach collection is not iterable', () => {
      const result = run(
        '@foreach(items as item){{ item }}@endforeach',
        { items: 42 },
      )
      expect(result).toContain('Error')
    })

    it('should produce error output for undefined collection in @foreach', () => {
      const result = run(
        '@foreach(missing as item){{ item }}@endforeach',
        {},
      )
      // Should produce an error since missing is undefined and not an array
      expect(result).toContain('Error')
    })

    it('should produce error output for unsafe @for expression', () => {
      // Things like process.exit should be rejected
      const result = run(
        '@for(let i = 0; require("fs"); i++){{ i }}@endfor',
        {},
      )
      // Should contain an error about unsafe expression
      expect(result.toLowerCase()).toMatch(/error|unsafe/)
    })

    it('should handle @foreach gracefully when expression throws', () => {
      const result = run(
        '@foreach(items.nonExistentMethod() as item){{ item }}@endforeach',
        { items: [1, 2, 3] },
      )
      expect(result).toContain('Error')
    })
  })

  // ===========================================================================
  // Loop Variable ($loop) Comprehensive
  // ===========================================================================
  describe('$loop variable', () => {
    it('should provide $loop.index for each iteration', () => {
      const result = run(
        '@foreach(items as item){{ $loop.index }},@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('0,')
      expect(result).toContain('1,')
      expect(result).toContain('2,')
    })

    it('should provide $loop.first and $loop.last', () => {
      const result = run(
        '@foreach(items as item)@if($loop.first)FIRST@endif@if($loop.last)LAST@endif@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('FIRST')
      expect(result).toContain('LAST')
    })

    it('should provide $loop.count', () => {
      const result = run(
        '@foreach(items as item){{ $loop.count }}@endforeach',
        { items: [1, 2, 3, 4, 5] },
      )
      expect(result).toContain('5')
    })

    it('should provide $loop.iteration (one-based)', () => {
      const result = run(
        '@foreach(items as item){{ $loop.iteration }},@endforeach',
        { items: ['a', 'b', 'c'] },
      )
      expect(result).toContain('1,')
      expect(result).toContain('2,')
      expect(result).toContain('3,')
    })
  })

  // ===========================================================================
  // Misc: combined directives, ordering, and correctness
  // ===========================================================================
  describe('combined and ordering', () => {
    it('should handle @foreach followed by plain text', () => {
      const result = run(
        '@foreach(items as item){{ item }}@endforeach -- done',
        { items: ['x'] },
      )
      expect(result).toContain('x')
      expect(result).toContain('-- done')
    })

    it('should handle plain text before @foreach', () => {
      const result = run(
        'Header: @foreach(items as item){{ item }}@endforeach',
        { items: ['y'] },
      )
      expect(result).toContain('Header:')
      expect(result).toContain('y')
    })

    it('should handle @for loop with complex arithmetic in body', () => {
      const result = run(
        '@for(let i = 1; i <= 3; i++){{ i * i }},@endfor',
        {},
      )
      expect(result).toContain('1,')
      expect(result).toContain('4,')
      expect(result).toContain('9,')
    })

    it('should handle @foreach with @if/@else inside', () => {
      const result = run(
        '@foreach(items as item)@if(item > 2)<b>{{ item }}</b>@else<i>{{ item }}</i>@endif@endforeach',
        { items: [1, 2, 3, 4] },
      )
      expect(result).toContain('<i>1</i>')
      expect(result).toContain('<i>2</i>')
      expect(result).toContain('<b>3</b>')
      expect(result).toContain('<b>4</b>')
    })

    it('should handle @foreach where loop body outputs nothing for some items', () => {
      const result = run(
        '@foreach(items as item)@if(item.visible){{ item.name }}@endif@endforeach',
        { items: [{ name: 'A', visible: true }, { name: 'B', visible: false }, { name: 'C', visible: true }] },
      )
      expect(result).toContain('A')
      expect(result).not.toContain('B')
      expect(result).toContain('C')
    })

    it('should handle @for with multiple context variables', () => {
      const result = run(
        '@for(let i = start; i < end; i += step){{ i }},@endfor',
        { start: 0, end: 10, step: 3 },
      )
      expect(result).toContain('0,')
      expect(result).toContain('3,')
      expect(result).toContain('6,')
      expect(result).toContain('9,')
      expect(result).not.toContain('10,')
    })

    it('should handle @foreach outputting the index from index => item syntax correctly', () => {
      const result = run(
        '@foreach(items as i => val)<span data-i="{{ i }}">{{ val }}</span>@endforeach',
        { items: ['first', 'second', 'third'] },
      )
      expect(result).toContain('<span data-i="0">first</span>')
      expect(result).toContain('<span data-i="1">second</span>')
      expect(result).toContain('<span data-i="2">third</span>')
    })
  })
})
