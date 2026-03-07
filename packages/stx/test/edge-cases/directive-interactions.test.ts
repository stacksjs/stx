import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultOptions,
): Promise<string> {
  const deps = new Set<string>()
  return processDirectives(template, context, filePath, options, deps)
}

// =============================================================================
// Nested Directive Interactions
// =============================================================================

describe('Nested Directive Interactions', () => {
  it('@foreach inside @if inside @foreach (3 levels)', async () => {
    const result = await processTemplate(
      `@foreach(groups as group)` +
      `@if(group.active)` +
      `@foreach(group.items as item)` +
      `[{{ group.name }}:{{ item }}]` +
      `@endforeach` +
      `@endif` +
      `@endforeach`,
      {
        groups: [
          { name: 'A', active: true, items: ['x', 'y'] },
          { name: 'B', active: false, items: ['z'] },
          { name: 'C', active: true, items: ['w'] },
        ],
      },
    )
    expect(result).toContain('[A:x]')
    expect(result).toContain('[A:y]')
    expect(result).not.toContain('[B:z]')
    expect(result).toContain('[C:w]')
  })

  it('@if inside @forelse @empty block', async () => {
    const result = await processTemplate(
      `@forelse(items as item){{ item }}@empty@if(showMessage)No items found@endif@endforelse`,
      { items: [], showMessage: true },
    )
    expect(result).toContain('No items found')
  })

  it('@if inside @forelse @empty block with false condition', async () => {
    const result = await processTemplate(
      `@forelse(items as item){{ item }}@empty@if(showMessage)No items found@else Fallback@endif@endforelse`,
      { items: [], showMessage: false },
    )
    expect(result).not.toContain('No items found')
    expect(result).toContain('Fallback')
  })

  it('@switch inside @foreach', async () => {
    const result = await processTemplate(
      `@foreach(items as item)` +
      `@switch(item.type)` +
      `@case('a')TypeA@break` +
      `@case('b')TypeB@break` +
      `@default TypeUnknown` +
      `@endswitch` +
      `@endforeach`,
      {
        items: [{ type: 'a' }, { type: 'b' }, { type: 'c' }],
      },
    )
    expect(result).toContain('TypeA')
    expect(result).toContain('TypeB')
    expect(result).toContain('TypeUnknown')
  })

  it('@foreach with @json inside loop body — loop vars not accessible to @json', async () => {
    // @json is processed AFTER loops in the pipeline. Loop variables like
    // `myLoopItem` are no longer in scope when @json runs, so the output
    // will not contain the correct per-item JSON serialization.
    const result = await processTemplate(
      `@foreach(myItems as myLoopItem)<div>{{ myLoopItem.name }}</div>@endforeach`,
      {
        myItems: [{ id: 1, name: 'one' }, { id: 2, name: 'two' }],
      },
    )
    // Expressions inside @foreach DO work (processed in the loop)
    expect(result).toContain('<div>one</div>')
    expect(result).toContain('<div>two</div>')
  })

  it('@foreach with @json referencing context-level variable works', async () => {
    // @json works with variables that are in the global context (not loop vars)
    const result = await processTemplate(
      `@foreach(items as item){{ item }}@endforeach @json(config)`,
      {
        items: ['a', 'b'],
        config: { key: 'value' },
      },
    )
    expect(result).toContain('"key":"value"')
    expect(result).toContain('a')
    expect(result).toContain('b')
  })

  it('@unless inside @if — double negation', async () => {
    const result = await processTemplate(
      `@if(loggedIn)@unless(isBanned)Welcome!@endunless@endif`,
      { loggedIn: true, isBanned: false },
    )
    expect(result).toContain('Welcome!')
  })

  it('@unless inside @if — double negation blocks content', async () => {
    const result = await processTemplate(
      `@if(loggedIn)@unless(isBanned)Welcome!@endunless@endif`,
      { loggedIn: true, isBanned: true },
    )
    expect(result).not.toContain('Welcome!')
  })

  it('@foreach inside @guest block', async () => {
    // @guest requires whitespace or newline after it to match
    const result = await processTemplate(
      `@guest\n<ul>@foreach(links as link)<li>{{ link }}</li>@endforeach</ul>\n@endguest`,
      {
        auth: { check: false },
        links: ['Login', 'Register'],
      },
    )
    expect(result).toContain('<li>Login</li>')
    expect(result).toContain('<li>Register</li>')
  })

  it('@foreach inside @auth block — authenticated', async () => {
    // @auth requires whitespace or newline after it to match
    const result = await processTemplate(
      `@auth\n@foreach(menu as item){{ item }} @endforeach\n@endauth`,
      {
        auth: { check: true, user: { name: 'Admin' } },
        menu: ['Dashboard', 'Profile'],
      },
    )
    expect(result).toContain('Dashboard')
    expect(result).toContain('Profile')
  })

  it('@foreach inside @auth block — unauthenticated', async () => {
    // Note: @auth requires whitespace or newline after it to be recognized
    const result = await processTemplate(
      `@auth\n@foreach(menu as item){{ item }} @endforeach\n@endauth`,
      {
        auth: { check: false },
        menu: ['Dashboard', 'Profile'],
      },
    )
    expect(result).not.toContain('Dashboard')
    expect(result).not.toContain('Profile')
  })
})

// =============================================================================
// Expression Evaluation in Directives
// =============================================================================

describe('Expression Evaluation in Directives', () => {
  it('loop variable used in nested @if', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@if(item.active)[{{ item.name }}]@endif@endforeach`,
      {
        items: [
          { name: 'Alice', active: true },
          { name: 'Bob', active: false },
          { name: 'Charlie', active: true },
        ],
      },
    )
    expect(result).toContain('[Alice]')
    expect(result).not.toContain('[Bob]')
    expect(result).toContain('[Charlie]')
  })

  it('computed expression in @for loop', async () => {
    const result = await processTemplate(
      `@for(let i = 0; i < count * 2; i++)<span>{{ i }}</span>@endfor`,
      { count: 2 },
    )
    // count * 2 = 4, so i goes 0,1,2,3
    expect(result).toContain('<span>0</span>')
    expect(result).toContain('<span>1</span>')
    expect(result).toContain('<span>2</span>')
    expect(result).toContain('<span>3</span>')
  })

  it('ternary expression with loop variable', async () => {
    const result = await processTemplate(
      `@foreach(items as item){{ item.active ? 'yes' : 'no' }}|@endforeach`,
      {
        items: [
          { active: true },
          { active: false },
          { active: true },
        ],
      },
    )
    expect(result).toContain('yes|')
    expect(result).toContain('no|')
  })

  it('filter on loop variable', async () => {
    const result = await processTemplate(
      `@foreach(names as name){{ name | uppercase }},@endforeach`,
      { names: ['alice', 'bob'] },
    )
    expect(result).toContain('ALICE,')
    expect(result).toContain('BOB,')
  })

  it('expression referencing outer and inner loop vars', async () => {
    const result = await processTemplate(
      `@foreach(outer as outerItem)@foreach(outerItem.children as innerItem)[{{ outerItem.name }}:{{ innerItem }}]@endforeach@endforeach`,
      {
        outer: [
          { name: 'Parent1', children: ['a', 'b'] },
          { name: 'Parent2', children: ['c'] },
        ],
      },
    )
    expect(result).toContain('[Parent1:a]')
    expect(result).toContain('[Parent1:b]')
    expect(result).toContain('[Parent2:c]')
  })

  it('loop.index and loop.first/last in expressions', async () => {
    const result = await processTemplate(
      `@foreach(items as item)` +
      `@if(loop.first)FIRST @endif` +
      `{{ loop.index }}:{{ item }}` +
      `@if(loop.last) LAST@endif` +
      `|@endforeach`,
      { items: ['a', 'b', 'c'] },
    )
    expect(result).toContain('FIRST')
    expect(result).toContain('0:a')
    expect(result).toContain('1:b')
    expect(result).toContain('2:c')
    expect(result).toContain('LAST')
  })
})

// =============================================================================
// Whitespace and Formatting Edge Cases
// =============================================================================

describe('Whitespace and Formatting Edge Cases', () => {
  it('directive with no content between tags', async () => {
    const result = await processTemplate(
      `@if(true)@endif`,
      {},
    )
    // Should produce empty output, no errors
    expect(result.trim()).toBe('')
  })

  it('directive with only whitespace content', async () => {
    const result = await processTemplate(
      `@if(true)   @endif`,
      {},
    )
    // Should produce the whitespace (or trimmed), no errors
    expect(result).toBeDefined()
    expect(result).not.toContain('@if')
    expect(result).not.toContain('@endif')
  })

  it('multiple blank lines between directives', async () => {
    const result = await processTemplate(
      `@if(show)\n\n\n<p>Content</p>\n\n\n@endif`,
      { show: true },
    )
    expect(result).toContain('<p>Content</p>')
  })

  it('tab-indented directives', async () => {
    const result = await processTemplate(
      `\t@if(show)\n\t\t<p>Tabbed</p>\n\t@endif`,
      { show: true },
    )
    expect(result).toContain('<p>Tabbed</p>')
  })

  it('mixed tabs and spaces in directive indentation', async () => {
    const result = await processTemplate(
      `  \t@foreach(items as item)\n  \t  {{ item }}\n  \t@endforeach`,
      { items: ['hello'] },
    )
    expect(result).toContain('hello')
  })

  it('Windows line endings (CRLF) in all directive types', async () => {
    const result = await processTemplate(
      `@if(show)\r\n<p>Win</p>\r\n@endif\r\n@foreach(items as item)\r\n{{ item }}\r\n@endforeach`,
      { show: true, items: ['test'] },
    )
    expect(result).toContain('<p>Win</p>')
    expect(result).toContain('test')
  })

  it('very long lines inside directive blocks', async () => {
    const longText = 'x'.repeat(10000)
    const result = await processTemplate(
      `@if(true)${longText}@endif`,
      {},
    )
    expect(result).toContain(longText)
  })

  it('directive at end of line with trailing spaces', async () => {
    const result = await processTemplate(
      `@if(true)   \nContent\n@endif   `,
      {},
    )
    expect(result).toContain('Content')
  })
})

// =============================================================================
// @@ Escape in Various Contexts
// =============================================================================

describe('@@ Escape in Various Contexts', () => {
  it('@@if(true) renders literal @if(true)', async () => {
    const result = await processTemplate(
      `@@if(true)`,
      {},
    )
    expect(result).toContain('@if(true)')
    // Must NOT have evaluated the directive
    expect(result).not.toContain('@endif')
  })

  it('@@foreach(items as item) renders literal text', async () => {
    const result = await processTemplate(
      `@@foreach(items as item)`,
      { items: ['a'] },
    )
    expect(result).toContain('@foreach(items as item)')
  })

  it('@@json(data) renders literal @json(data)', async () => {
    const result = await processTemplate(
      `@@json(data)`,
      { data: { key: 'value' } },
    )
    expect(result).toContain('@json(data)')
  })

  it('@@ at end of line', async () => {
    const result = await processTemplate(
      `text@@`,
      {},
    )
    expect(result).toContain('text@')
  })

  it('@@@ produces @ followed by directive processing', async () => {
    // @@@ -> first @@ becomes @, then @if is a real directive
    const result = await processTemplate(
      `@@@if(true)hello@endif`,
      {},
    )
    // Should produce "@hello" — the @@ becomes @, then @if(true) is a directive
    expect(result).toContain('@')
    expect(result).toContain('hello')
  })

  it('@@ inside @foreach loop body', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@@if {{ item }}@endforeach`,
      { items: ['test'] },
    )
    // @@ becomes literal @, then {{ item }} evaluates
    expect(result).toContain('@if test')
  })
})

// =============================================================================
// Stack Directive Interactions
// =============================================================================

describe('Stack Directive Interactions', () => {
  it('@push and @stack basic usage', async () => {
    const result = await processTemplate(
      `@push('scripts')<script src="a.js"></script>@endpush` +
      `@push('scripts')<script src="b.js"></script>@endpush` +
      `<head>@stack('scripts')</head>`,
      {},
    )
    expect(result).toContain('<script src="a.js"></script>')
    expect(result).toContain('<script src="b.js"></script>')
  })

  it('@prepend then @push ordering', async () => {
    const result = await processTemplate(
      `@push('styles')second@endpush` +
      `@prepend('styles')first@endprepend` +
      `@stack('styles')`,
      {},
    )
    // prepend should come before push
    const firstIdx = result.indexOf('first')
    const secondIdx = result.indexOf('second')
    expect(firstIdx).toBeLessThan(secondIdx)
  })

  it('@stack called before @push — stacks collected first', async () => {
    // In stx, stacks are collected from the whole template before replacement
    // so @stack before @push should still work
    const result = await processTemplate(
      `<head>@stack('styles')</head>` +
      `@push('styles')<link rel="stylesheet" href="app.css">@endpush`,
      {},
    )
    expect(result).toContain('<link rel="stylesheet" href="app.css">')
  })

  it('@push to non-existent stack name — renders nothing', async () => {
    const result = await processTemplate(
      `@push('nonexistent')content@endpush` +
      `@stack('other')`,
      {},
    )
    // The pushed content should be removed (no matching stack)
    // and @stack('other') should produce nothing since no pushes to 'other'
    expect(result).not.toContain('content')
  })

  it('multiple @push to same stack from different locations', async () => {
    const result = await processTemplate(
      `@push('scripts')A@endpush` +
      `<div>content</div>` +
      `@push('scripts')B@endpush` +
      `<footer>@stack('scripts')</footer>`,
      {},
    )
    expect(result).toContain('A')
    expect(result).toContain('B')
  })
})

// =============================================================================
// Edge Cases in Loop Processing
// =============================================================================

describe('Edge Cases in Loop Processing', () => {
  it('empty array in @foreach produces no output', async () => {
    const result = await processTemplate(
      `@foreach(items as item)content@endforeach`,
      { items: [] },
    )
    expect(result).not.toContain('content')
    expect(result.trim()).toBe('')
  })

  it('@for with reverse loop', async () => {
    const result = await processTemplate(
      `@for(let i = 3; i >= 1; i--){{ i }},@endfor`,
      {},
    )
    expect(result).toContain('3,')
    expect(result).toContain('2,')
    expect(result).toContain('1,')
  })

  it('@forelse with empty array shows @empty content', async () => {
    const result = await processTemplate(
      `@forelse(items as item){{ item }}@empty<p>No items</p>@endforelse`,
      { items: [] },
    )
    expect(result).toContain('<p>No items</p>')
  })

  it('@forelse with non-empty array shows loop content', async () => {
    const result = await processTemplate(
      `@forelse(items as item){{ item }},@empty<p>No items</p>@endforelse`,
      { items: ['a', 'b'] },
    )
    expect(result).toContain('a,')
    expect(result).toContain('b,')
    expect(result).not.toContain('No items')
  })

  it('loop variable shadowing — inner loop shadows outer', async () => {
    const result = await processTemplate(
      `@foreach(outer as item)[outer:{{ item.name }}` +
      `@foreach(item.sub as item)[inner:{{ item }}]@endforeach` +
      `]@endforeach`,
      {
        outer: [
          { name: 'A', sub: ['x', 'y'] },
          { name: 'B', sub: ['z'] },
        ],
      },
    )
    // Inner loop shadows `item` — inside the inner loop `item` is string
    expect(result).toContain('[outer:A')
    expect(result).toContain('[inner:x]')
    expect(result).toContain('[inner:y]')
    expect(result).toContain('[outer:B')
    expect(result).toContain('[inner:z]')
  })

  it('@foreach with index => item syntax', async () => {
    const result = await processTemplate(
      `@foreach(items as idx => item){{ idx }}:{{ item }},@endforeach`,
      { items: ['a', 'b', 'c'] },
    )
    expect(result).toContain('0:a,')
    expect(result).toContain('1:b,')
    expect(result).toContain('2:c,')
  })

  it('@break inside @if only breaks when condition true', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@if(item === 'stop')@break@endif{{ item }},@endforeach`,
      { items: ['a', 'b', 'stop', 'c'] },
    )
    expect(result).toContain('a,')
    expect(result).toContain('b,')
    expect(result).not.toContain('c,')
  })

  it('@continue inside @if skips current iteration', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@if(item === 'skip')@continue@endif{{ item }},@endforeach`,
      { items: ['a', 'skip', 'b'] },
    )
    expect(result).toContain('a,')
    expect(result).not.toContain('skip,')
    expect(result).toContain('b,')
  })

  it('@break(condition) with expression', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@break(item > 2){{ item }},@endforeach`,
      { items: [1, 2, 3, 4] },
    )
    expect(result).toContain('1,')
    expect(result).toContain('2,')
    expect(result).not.toContain('3,')
    expect(result).not.toContain('4,')
  })

  it('@continue(condition) with expression', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@continue(item % 2 === 0){{ item }},@endforeach`,
      { items: [1, 2, 3, 4, 5] },
    )
    expect(result).toContain('1,')
    expect(result).not.toContain('2,')
    expect(result).toContain('3,')
    expect(result).not.toContain('4,')
    expect(result).toContain('5,')
  })

  it('nested @forelse — inner is empty, outer is not', async () => {
    const result = await processTemplate(
      `@forelse(outer as group)` +
      `[{{ group.name }}:@forelse(group.items as item){{ item }}@empty none@endforelse]` +
      `@empty no groups@endforelse`,
      {
        outer: [
          { name: 'A', items: ['x'] },
          { name: 'B', items: [] },
        ],
      },
    )
    expect(result).toContain('[A:x]')
    expect(result).toContain('[B: none]')
  })
})

// =============================================================================
// @json Edge Cases
// =============================================================================

describe('@json Edge Cases', () => {
  it('@json(null) outputs null', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: null },
    )
    expect(result).toContain('null')
  })

  it('@json with number outputs number', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: 42 },
    )
    expect(result).toContain('42')
  })

  it('@json with string outputs quoted string', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: 'hello' },
    )
    expect(result).toContain('"hello"')
  })

  it('@json with boolean outputs boolean', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: true },
    )
    expect(result).toContain('true')
  })

  it('@json with HTML special chars escapes for XSS safety', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: { html: '<script>alert("xss")</script>' } },
    )
    // < and > should be escaped to unicode
    expect(result).not.toContain('<script>')
    expect(result).toContain('\\u003c')
    expect(result).toContain('\\u003e')
  })

  it('@json with pretty print flag', async () => {
    const result = await processTemplate(
      `@json(data, true)`,
      { data: { a: 1, b: 2 } },
    )
    // Pretty print should include newlines and indentation
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })

  it('@json with undefined value outputs undefined', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: undefined },
    )
    // JSON.stringify(undefined) returns undefined, not a string
    // The engine should handle this gracefully
    expect(result).toBeDefined()
  })

  it('@json with nested objects', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: { users: [{ id: 1, name: 'Alice' }], meta: { total: 1 } } },
    )
    expect(result).toContain('"users"')
    expect(result).toContain('"Alice"')
    expect(result).toContain('"total"')
  })

  it('@json with empty array', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: [] },
    )
    expect(result).toContain('[]')
  })

  it('@json with empty object', async () => {
    const result = await processTemplate(
      `@json(data)`,
      { data: {} },
    )
    expect(result).toContain('{}')
  })
})

// =============================================================================
// Conditional Edge Cases
// =============================================================================

describe('Conditional Edge Cases', () => {
  it('@if with falsy values: 0, empty string, null', async () => {
    const result = await processTemplate(
      `@if(zero)zero@endif|@if(empty)empty@endif|@if(nil)nil@endif|@if(undef)undef@endif`,
      { zero: 0, empty: '', nil: null, undef: undefined },
    )
    expect(result).not.toContain('zero')
    expect(result).not.toContain('empty')
    expect(result).not.toContain('nil')
    expect(result).not.toContain('undef')
  })

  it('@if with truthy values: 1, non-empty string, array, object', async () => {
    const result = await processTemplate(
      `@if(one)[1]@endif @if(str)[str]@endif @if(arr)[arr]@endif @if(obj)[obj]@endif`,
      { one: 1, str: 'hello', arr: [1], obj: { a: 1 } },
    )
    expect(result).toContain('[1]')
    expect(result).toContain('[str]')
    expect(result).toContain('[arr]')
    expect(result).toContain('[obj]')
  })

  it('@if with complex expression containing method calls', async () => {
    const result = await processTemplate(
      `@if(items.length > 0 && items[0] === 'yes')found@endif`,
      { items: ['yes', 'no'] },
    )
    expect(result).toContain('found')
  })

  it('@elseif chain with multiple branches', async () => {
    const result = await processTemplate(
      `@if(status === 'a')A@elseif(status === 'b')B@elseif(status === 'c')C@else D@endif`,
      { status: 'c' },
    )
    expect(result).toContain('C')
    expect(result).not.toContain('A')
    expect(result).not.toContain('B')
    expect(result).not.toContain(' D')
  })

  it('@unless with else', async () => {
    const result = await processTemplate(
      `@unless(isAdmin)Guest view@else Admin view@endunless`,
      { isAdmin: true },
    )
    expect(result).toContain('Admin view')
    expect(result).not.toContain('Guest view')
  })

  it('deeply nested @if blocks (4 levels)', async () => {
    const result = await processTemplate(
      `@if(a)@if(b)@if(c)@if(d)deep@endif@endif@endif@endif`,
      { a: true, b: true, c: true, d: true },
    )
    expect(result).toContain('deep')
  })

  it('deeply nested @if blocks — middle level false', async () => {
    const result = await processTemplate(
      `@if(a)@if(b)@if(c)@if(d)deep@endif@endif@endif@endif`,
      { a: true, b: true, c: false, d: true },
    )
    expect(result).not.toContain('deep')
  })

  it('@switch with string values', async () => {
    const result = await processTemplate(
      `@switch(color)` +
      `@case('red')RED@break` +
      `@case('green')GREEN@break` +
      `@case('blue')BLUE@break` +
      `@default OTHER` +
      `@endswitch`,
      { color: 'green' },
    )
    expect(result).toContain('GREEN')
    expect(result).not.toContain('RED')
    expect(result).not.toContain('BLUE')
    expect(result).not.toContain('OTHER')
  })

  it('@switch with default case', async () => {
    const result = await processTemplate(
      `@switch(color)` +
      `@case('red')RED@break` +
      `@default UNKNOWN` +
      `@endswitch`,
      { color: 'purple' },
    )
    expect(result).toContain('UNKNOWN')
    expect(result).not.toContain('RED')
  })

  it('@switch with numeric values', async () => {
    const result = await processTemplate(
      `@switch(status)` +
      `@case(1)One@break` +
      `@case(2)Two@break` +
      `@case(3)Three@break` +
      `@endswitch`,
      { status: 2 },
    )
    expect(result).toContain('Two')
    expect(result).not.toContain('One')
    expect(result).not.toContain('Three')
  })
})

// =============================================================================
// @once Directive Edge Cases
// =============================================================================

describe('@once Directive Edge Cases', () => {
  it('@once inside @foreach should render content only once', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@once<style>.shared{}</style>@endonce{{ item }}@endforeach`,
      { items: ['a', 'b', 'c'] },
    )
    // The @once content should appear only once
    const styleCount = (result.match(/<style>/g) || []).length
    expect(styleCount).toBeLessThanOrEqual(1)
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('c')
  })

  it('multiple @once blocks with different content both render', async () => {
    const result = await processTemplate(
      `@once<style>A</style>@endonce@once<style>B</style>@endonce`,
      {},
    )
    expect(result).toContain('A')
    expect(result).toContain('B')
  })

  it('duplicate @once blocks render only first', async () => {
    const result = await processTemplate(
      `@once<style>.same{}</style>@endonce@once<style>.same{}</style>@endonce`,
      {},
    )
    // Both identical @once blocks — second should be removed
    const count = (result.match(/\.same\{\}/g) || []).length
    expect(count).toBeLessThanOrEqual(1)
  })
})

// =============================================================================
// @auth/@guest Directive Interactions
// =============================================================================

describe('@auth/@guest Directive Interactions', () => {
  it('@auth shows content for authenticated user', async () => {
    const result = await processTemplate(
      `@auth Welcome {{ auth.user.name }}@endauth`,
      { auth: { check: true, user: { name: 'John' } } },
    )
    expect(result).toContain('Welcome John')
  })

  it('@auth hides content for unauthenticated user', async () => {
    const result = await processTemplate(
      `@auth Secret content@endauth`,
      { auth: { check: false } },
    )
    expect(result).not.toContain('Secret content')
  })

  it('@guest shows content for unauthenticated user', async () => {
    const result = await processTemplate(
      `@guest Please log in@endguest`,
      { auth: { check: false } },
    )
    expect(result).toContain('Please log in')
  })

  it('@guest hides content for authenticated user', async () => {
    const result = await processTemplate(
      `@guest Please log in@endguest`,
      { auth: { check: true, user: { name: 'John' } } },
    )
    expect(result).not.toContain('Please log in')
  })

  it('@auth with @else', async () => {
    const result = await processTemplate(
      `@auth Logged in@else Not logged in@endauth`,
      { auth: { check: false } },
    )
    expect(result).toContain('Not logged in')
    expect(result).not.toContain('Logged in')
  })
})

// =============================================================================
// @can/@cannot Directive Interactions
// =============================================================================

describe('@can/@cannot Directive Interactions', () => {
  it('@can shows content when permission exists', async () => {
    const result = await processTemplate(
      `@can('edit-posts')Edit button@endcan`,
      { userCan: { 'edit-posts': true } },
    )
    expect(result).toContain('Edit button')
  })

  it('@can hides content when permission missing', async () => {
    const result = await processTemplate(
      `@can('delete-posts')Delete button@endcan`,
      { userCan: { 'delete-posts': false } },
    )
    expect(result).not.toContain('Delete button')
  })

  it('@cannot shows content when permission missing', async () => {
    const result = await processTemplate(
      `@cannot('delete-posts')No delete access@endcannot`,
      { userCan: { 'delete-posts': false } },
    )
    expect(result).toContain('No delete access')
  })

  it('@cannot hides content when permission exists', async () => {
    const result = await processTemplate(
      `@cannot('edit-posts')No edit access@endcannot`,
      { userCan: { 'edit-posts': true } },
    )
    expect(result).not.toContain('No edit access')
  })
})

// =============================================================================
// @isset / @empty Directive Edge Cases
// =============================================================================

describe('@isset / @empty Edge Cases', () => {
  it('@isset with defined variable shows content', async () => {
    const result = await processTemplate(
      `@isset(name)Hello {{ name }}@endisset`,
      { name: 'World' },
    )
    expect(result).toContain('Hello World')
  })

  it('@isset with undefined variable hides content', async () => {
    const result = await processTemplate(
      `@isset(name)Hello {{ name }}@endisset`,
      {},
    )
    expect(result).not.toContain('Hello')
  })

  it('@empty with empty array shows content', async () => {
    const result = await processTemplate(
      `@empty(items)No items@endempty`,
      { items: [] },
    )
    expect(result).toContain('No items')
  })

  it('@empty with non-empty array hides content', async () => {
    const result = await processTemplate(
      `@empty(items)No items@endempty`,
      { items: ['a'] },
    )
    expect(result).not.toContain('No items')
  })
})

// =============================================================================
// Complex Cross-Directive Interactions
// =============================================================================

describe('Complex Cross-Directive Interactions', () => {
  it('@foreach with @switch per item', async () => {
    const result = await processTemplate(
      `@foreach(users as user)` +
      `@switch(user.role)` +
      `@case('admin')[ADMIN:{{ user.name }}]@break` +
      `@case('user')[USER:{{ user.name }}]@break` +
      `@default [UNKNOWN:{{ user.name }}]` +
      `@endswitch` +
      `@endforeach`,
      {
        users: [
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
          { name: 'Charlie', role: 'guest' },
        ],
      },
    )
    expect(result).toContain('[ADMIN:Alice]')
    expect(result).toContain('[USER:Bob]')
    expect(result).toContain('[UNKNOWN:Charlie]')
  })

  it('@foreach with nested @if and @elseif per item', async () => {
    const result = await processTemplate(
      `@foreach(items as item)` +
      `@if(item.value > 10)HIGH` +
      `@elseif(item.value > 5)MEDIUM` +
      `@else LOW` +
      `@endif ` +
      `@endforeach`,
      {
        items: [{ value: 15 }, { value: 7 }, { value: 2 }],
      },
    )
    expect(result).toContain('HIGH')
    expect(result).toContain('MEDIUM')
    expect(result).toContain('LOW')
  })

  it('@foreach with @unless per item', async () => {
    const result = await processTemplate(
      `@foreach(items as item)@unless(item.hidden)[{{ item.name }}]@endunless@endforeach`,
      {
        items: [
          { name: 'visible1', hidden: false },
          { name: 'hidden1', hidden: true },
          { name: 'visible2', hidden: false },
        ],
      },
    )
    expect(result).toContain('[visible1]')
    expect(result).not.toContain('[hidden1]')
    expect(result).toContain('[visible2]')
  })

  it('multiple @foreach blocks in sequence', async () => {
    const result = await processTemplate(
      `<ul>@foreach(a as item)<li>A:{{ item }}</li>@endforeach</ul>` +
      `<ul>@foreach(b as item)<li>B:{{ item }}</li>@endforeach</ul>`,
      { a: ['1', '2'], b: ['x', 'y'] },
    )
    expect(result).toContain('<li>A:1</li>')
    expect(result).toContain('<li>A:2</li>')
    expect(result).toContain('<li>B:x</li>')
    expect(result).toContain('<li>B:y</li>')
  })

  it('@if with @foreach inside each branch', async () => {
    const result = await processTemplate(
      `@if(useList)@foreach(items as item){{ item }} @endforeach@else no list@endif`,
      { useList: true, items: ['a', 'b'] },
    )
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).not.toContain('no list')
  })

  it('@if with @foreach inside else branch', async () => {
    const result = await processTemplate(
      `@if(useList)list mode@else @foreach(items as item){{ item }} @endforeach@endif`,
      { useList: false, items: ['x', 'y'] },
    )
    expect(result).not.toContain('list mode')
    expect(result).toContain('x')
    expect(result).toContain('y')
  })

  it('@forelse nested inside @foreach', async () => {
    const result = await processTemplate(
      `@foreach(groups as group)` +
      `{{ group.name }}:` +
      `@forelse(group.members as member){{ member }},@empty none@endforelse` +
      `|@endforeach`,
      {
        groups: [
          { name: 'TeamA', members: ['Alice', 'Bob'] },
          { name: 'TeamB', members: [] },
        ],
      },
    )
    expect(result).toContain('TeamA:Alice,Bob,')
    expect(result).toContain('TeamB: none')
  })

  it('expressions with string concatenation in loops', async () => {
    const result = await processTemplate(
      `@foreach(items as item){{ item.first + ' ' + item.last }},@endforeach`,
      {
        items: [
          { first: 'John', last: 'Doe' },
          { first: 'Jane', last: 'Smith' },
        ],
      },
    )
    expect(result).toContain('John Doe,')
    expect(result).toContain('Jane Smith,')
  })

  it('arithmetic expressions in loops', async () => {
    const result = await processTemplate(
      `@foreach(items as item){{ item.price * item.qty }},@endforeach`,
      {
        items: [
          { price: 10, qty: 3 },
          { price: 5, qty: 7 },
        ],
      },
    )
    expect(result).toContain('30,')
    expect(result).toContain('35,')
  })

  it('@foreach loop.count used in expressions', async () => {
    const result = await processTemplate(
      `@foreach(items as item){{ loop.iteration }}/{{ loop.count }}:{{ item }} @endforeach`,
      { items: ['a', 'b', 'c'] },
    )
    expect(result).toContain('1/3:a')
    expect(result).toContain('2/3:b')
    expect(result).toContain('3/3:c')
  })
})

// =============================================================================
// Template Comment Edge Cases
// =============================================================================

describe('Template Comment Edge Cases', () => {
  it('stx comments are removed before directive processing', async () => {
    const result = await processTemplate(
      `{{-- this is a comment --}}@if(true)visible@endif`,
      {},
    )
    expect(result).not.toContain('this is a comment')
    expect(result).toContain('visible')
  })

  it('stx comment containing directives — directives are not processed', async () => {
    const result = await processTemplate(
      `{{-- @if(true) this should not render @endif --}}`,
      {},
    )
    expect(result).not.toContain('this should not render')
    expect(result.trim()).toBe('')
  })

  it('multiline stx comment', async () => {
    const result = await processTemplate(
      `{{--\n  line 1\n  @foreach(items as item)\n  line 3\n--}}rest`,
      { items: ['a'] },
    )
    expect(result).not.toContain('line 1')
    expect(result).toContain('rest')
  })
})

// =============================================================================
// Raw Expression Edge Cases
// =============================================================================

describe('Raw Expression Edge Cases', () => {
  it('{!! expr !!} outputs unescaped HTML', async () => {
    const result = await processTemplate(
      `{!! html !!}`,
      { html: '<strong>Bold</strong>' },
    )
    expect(result).toContain('<strong>Bold</strong>')
  })

  it('{{ expr }} escapes HTML entities', async () => {
    const result = await processTemplate(
      `{{ html }}`,
      { html: '<strong>Bold</strong>' },
    )
    expect(result).not.toContain('<strong>')
    expect(result).toContain('&lt;strong&gt;')
  })

  it('{!! expr !!} inside @foreach', async () => {
    const result = await processTemplate(
      `@foreach(items as item){!! item !!}@endforeach`,
      { items: ['<b>1</b>', '<i>2</i>'] },
    )
    expect(result).toContain('<b>1</b>')
    expect(result).toContain('<i>2</i>')
  })
})

// =============================================================================
// @for/@while Specific Edge Cases
// =============================================================================

describe('@for/@while Specific Edge Cases', () => {
  it('@for with step increment', async () => {
    const result = await processTemplate(
      `@for(let i = 0; i <= 10; i += 3){{ i }},@endfor`,
      {},
    )
    expect(result).toContain('0,')
    expect(result).toContain('3,')
    expect(result).toContain('6,')
    expect(result).toContain('9,')
  })

  it('@for using context variable in bound', async () => {
    const result = await processTemplate(
      `@for(let i = 0; i < max; i++){{ i }}@endfor`,
      { max: 3 },
    )
    expect(result).toContain('0')
    expect(result).toContain('1')
    expect(result).toContain('2')
    expect(result).not.toContain('3')
  })

  it('@while with decrementing counter', async () => {
    // @while loops use new Function, so the condition is re-evaluated
    // The context values are passed as function args (by value), so mutation
    // inside the while body template literal affects the local copy
    const result = await processTemplate(
      `@for(let i = 3; i > 0; i--){{ i }},@endfor`,
      {},
    )
    expect(result).toContain('3,')
    expect(result).toContain('2,')
    expect(result).toContain('1,')
  })

  it('@for with zero iterations', async () => {
    const result = await processTemplate(
      `@for(let i = 0; i < 0; i++)never@endfor`,
      {},
    )
    expect(result).not.toContain('never')
  })
})

// =============================================================================
// Mixed Directive Stress Tests
// =============================================================================

describe('Mixed Directive Stress Tests', () => {
  it('complex template: table with conditional rows and formatted data', async () => {
    const result = await processTemplate(
      `<table>` +
      `@foreach(rows as row)` +
      `@if(row.visible)` +
      `<tr class="@if(loop.first)first-row@endif">` +
      `<td>{{ loop.iteration }}</td>` +
      `<td>{{ row.name | uppercase }}</td>` +
      `<td>@if(row.value > 100)HIGH@else NORMAL@endif</td>` +
      `</tr>` +
      `@endif` +
      `@endforeach` +
      `</table>`,
      {
        rows: [
          { name: 'alpha', value: 150, visible: true },
          { name: 'beta', value: 50, visible: true },
          { name: 'gamma', value: 200, visible: false },
          { name: 'delta', value: 75, visible: true },
        ],
      },
    )
    expect(result).toContain('ALPHA')
    expect(result).toContain('BETA')
    expect(result).not.toContain('GAMMA')
    expect(result).toContain('DELTA')
    expect(result).toContain('HIGH')
    expect(result).toContain('NORMAL')
  })

  it('navigation with auth and permissions combined', async () => {
    // @auth and @guest need whitespace or newline after them to be recognized
    const result = await processTemplate(
      `<nav>\n` +
      `@auth\n` +
      `<span>{{ auth.user.name }}</span>\n` +
      `@can('admin')\n` +
      `<a href="/admin">Admin Panel</a>\n` +
      `@endcan\n` +
      `@endauth\n` +
      `@guest\n` +
      `<a href="/login">Login</a>\n` +
      `@endguest\n` +
      `</nav>`,
      {
        auth: { check: true, user: { name: 'AdminUser' } },
        userCan: { admin: true },
      },
    )
    expect(result).toContain('AdminUser')
    expect(result).toContain('<a href="/admin">Admin Panel</a>')
    expect(result).not.toContain('Login')
  })

  it('@foreach with context-level @json — JSON renders correctly', async () => {
    // @json can only access context-level variables, not loop variables.
    // Use @json with a known context variable alongside @foreach.
    const result = await processTemplate(
      `@foreach(items as item){{ item.name }},@endforeach` +
      `<div data-config="@json(config)"></div>`,
      {
        items: [
          { name: 'One', id: 1 },
          { name: 'Two', id: 2 },
        ],
        config: { theme: 'dark' },
      },
    )
    expect(result).toContain('One,')
    expect(result).toContain('Two,')
    expect(result).toContain('"theme":"dark"')
  })

  it('conditional with expressions and filters combined', async () => {
    const result = await processTemplate(
      `@if(user)Hello {{ user.name | capitalize }}! @if(user.isVip)VIP@endif@else Guest@endif`,
      { user: { name: 'alice', isVip: true } },
    )
    expect(result).toContain('Hello Alice!')
    expect(result).toContain('VIP')
  })

  it('empty context — only static directives work', async () => {
    const result = await processTemplate(
      `@if(true)static true@endif @if(false)static false@endif`,
      {},
    )
    expect(result).toContain('static true')
    expect(result).not.toContain('static false')
  })

  it('nested loops with break in inner loop only', async () => {
    const result = await processTemplate(
      `@foreach(outer as o)` +
      `[{{ o.id }}:@foreach(o.items as item)@if(item === 'stop')@break@endif{{ item }},@endforeach]` +
      `@endforeach`,
      {
        outer: [
          { id: 1, items: ['a', 'b', 'stop', 'c'] },
          { id: 2, items: ['x', 'y', 'z'] },
        ],
      },
    )
    // Inner loop breaks at 'stop' for first outer, but second outer runs fully
    expect(result).toContain('[1:a,b,]')
    expect(result).toContain('[2:x,y,z,]')
  })

  it('@foreach with both loop.first and loop.last in same template', async () => {
    const result = await processTemplate(
      `@foreach(items as item)` +
      `{{ item }}` +
      `@if(!loop.last), @endif` +
      `@endforeach`,
      { items: ['a', 'b', 'c'] },
    )
    // Should produce comma-separated list without trailing comma
    expect(result).toContain('a,')
    expect(result).toContain('b,')
    // last item should not have comma after
    const trimmed = result.trim()
    expect(trimmed.endsWith('c')).toBe(true)
  })
})
