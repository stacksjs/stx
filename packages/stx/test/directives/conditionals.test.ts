import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processConditionals, processAuthDirectives, processEnvDirective, processIssetEmptyDirectives, processSwitchStatements } from '../../src/conditionals'

describe('Conditionals Comprehensive', () => {
  const filePath = 'test.stx'
  const originalNodeEnv = process.env.NODE_ENV

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  // =========================================================================
  // @if / @else / @elseif / @endif
  // =========================================================================
  describe('@if/@else/@elseif', () => {
    // -- Simple truthy/falsy values --

    it('should show content when condition is true', () => {
      const result = processConditionals('@if(show)<p>yes</p>@endif', { show: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should hide content when condition is false', () => {
      const result = processConditionals('@if(show)<p>yes</p>@endif', { show: false }, filePath)
      expect(result).not.toContain('<p>yes</p>')
    })

    it('should treat 0 as falsy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: 0 }, filePath)
      expect(result).toContain('<p>no</p>')
      expect(result).not.toContain('<p>yes</p>')
    })

    it('should treat 1 as truthy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: 1 }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should treat empty string as falsy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: '' }, filePath)
      expect(result).toContain('<p>no</p>')
    })

    it('should treat non-empty string as truthy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@endif', { val: 'hello' }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should treat null as falsy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: null }, filePath)
      expect(result).toContain('<p>no</p>')
    })

    it('should treat undefined as falsy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: undefined }, filePath)
      expect(result).toContain('<p>no</p>')
    })

    it('should treat empty array as truthy (JavaScript truthiness)', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: [] }, filePath)
      // In JS, [] is truthy
      expect(result).toContain('<p>yes</p>')
    })

    it('should treat non-empty array as truthy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@endif', { val: [1] }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should treat empty object as truthy (JavaScript truthiness)', () => {
      const result = processConditionals('@if(val)<p>yes</p>@else<p>no</p>@endif', { val: {} }, filePath)
      // In JS, {} is truthy
      expect(result).toContain('<p>yes</p>')
    })

    it('should treat non-empty object as truthy', () => {
      const result = processConditionals('@if(val)<p>yes</p>@endif', { val: { a: 1 } }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    // -- Comparison operators --

    it('should support strict equality (===)', () => {
      const result = processConditionals('@if(x === 5)<p>five</p>@endif', { x: 5 }, filePath)
      expect(result).toContain('<p>five</p>')
    })

    it('should support strict inequality (!==)', () => {
      const result = processConditionals('@if(x !== 5)<p>not five</p>@endif', { x: 3 }, filePath)
      expect(result).toContain('<p>not five</p>')
    })

    it('should support less-than (<)', () => {
      const result = processConditionals('@if(x < 10)<p>small</p>@endif', { x: 3 }, filePath)
      expect(result).toContain('<p>small</p>')
    })

    it('should support greater-than (>)', () => {
      const result = processConditionals('@if(x > 10)<p>big</p>@endif', { x: 20 }, filePath)
      expect(result).toContain('<p>big</p>')
    })

    it('should support less-than-or-equal (<=)', () => {
      const result = processConditionals('@if(x <= 10)<p>ok</p>@endif', { x: 10 }, filePath)
      expect(result).toContain('<p>ok</p>')
    })

    it('should support greater-than-or-equal (>=)', () => {
      const result = processConditionals('@if(x >= 10)<p>ok</p>@endif', { x: 10 }, filePath)
      expect(result).toContain('<p>ok</p>')
    })

    it('should support loose equality (==)', () => {
      const result = processConditionals('@if(x == 5)<p>five</p>@endif', { x: 5 }, filePath)
      expect(result).toContain('<p>five</p>')
    })

    it('should support loose inequality (!=)', () => {
      const result = processConditionals('@if(x != 5)<p>not five</p>@endif', { x: 3 }, filePath)
      expect(result).toContain('<p>not five</p>')
    })

    // -- Logical operators --

    it('should support logical AND (&&)', () => {
      const result = processConditionals('@if(a && b)<p>both</p>@else<p>not both</p>@endif', { a: true, b: true }, filePath)
      expect(result).toContain('<p>both</p>')
    })

    it('should support logical AND (&&) when one is false', () => {
      const result = processConditionals('@if(a && b)<p>both</p>@else<p>not both</p>@endif', { a: true, b: false }, filePath)
      expect(result).toContain('<p>not both</p>')
    })

    it('should support logical OR (||)', () => {
      const result = processConditionals('@if(a || b)<p>one</p>@else<p>none</p>@endif', { a: false, b: true }, filePath)
      expect(result).toContain('<p>one</p>')
    })

    it('should support logical OR (||) when both false', () => {
      const result = processConditionals('@if(a || b)<p>one</p>@else<p>none</p>@endif', { a: false, b: false }, filePath)
      expect(result).toContain('<p>none</p>')
    })

    it('should support logical NOT (!)', () => {
      const result = processConditionals('@if(!hidden)<p>visible</p>@endif', { hidden: false }, filePath)
      expect(result).toContain('<p>visible</p>')
    })

    it('should support logical NOT (!) hiding content', () => {
      const result = processConditionals('@if(!hidden)<p>visible</p>@endif', { hidden: true }, filePath)
      expect(result).not.toContain('<p>visible</p>')
    })

    // -- Multiple @elseif branches --

    it('should handle 3 elseif branches picking first match', () => {
      const template = `@if(role === 'admin')<p>admin</p>@elseif(role === 'editor')<p>editor</p>@elseif(role === 'author')<p>author</p>@elseif(role === 'viewer')<p>viewer</p>@else<p>unknown</p>@endif`
      const result = processConditionals(template, { role: 'author' }, filePath)
      expect(result).toContain('<p>author</p>')
      expect(result).not.toContain('<p>admin</p>')
      expect(result).not.toContain('<p>editor</p>')
      expect(result).not.toContain('<p>viewer</p>')
      expect(result).not.toContain('<p>unknown</p>')
    })

    it('should fall through to @else when no elseif matches', () => {
      const template = `@if(x === 1)<p>one</p>@elseif(x === 2)<p>two</p>@elseif(x === 3)<p>three</p>@else<p>other</p>@endif`
      const result = processConditionals(template, { x: 99 }, filePath)
      expect(result).toContain('<p>other</p>')
      expect(result).not.toContain('<p>one</p>')
      expect(result).not.toContain('<p>two</p>')
      expect(result).not.toContain('<p>three</p>')
    })

    it('should handle 4+ elseif branches', () => {
      const template = `@if(v === 'a')<p>a</p>@elseif(v === 'b')<p>b</p>@elseif(v === 'c')<p>c</p>@elseif(v === 'd')<p>d</p>@elseif(v === 'e')<p>e</p>@else<p>z</p>@endif`
      const result = processConditionals(template, { v: 'e' }, filePath)
      expect(result).toContain('<p>e</p>')
      expect(result).not.toContain('<p>a</p>')
      expect(result).not.toContain('<p>z</p>')
    })

    // -- Nested @if blocks --

    it('should handle @if nested inside @if (2 levels)', () => {
      const template = `@if(outer)@if(inner)<p>both</p>@else<p>outer only</p>@endif@else<p>neither</p>@endif`
      const result = processConditionals(template, { outer: true, inner: true }, filePath)
      expect(result).toContain('<p>both</p>')
      expect(result).not.toContain('outer only')
      expect(result).not.toContain('neither')
    })

    it('should show outer-only when inner is false', () => {
      const template = `@if(outer)@if(inner)<p>both</p>@else<p>outer only</p>@endif@else<p>neither</p>@endif`
      const result = processConditionals(template, { outer: true, inner: false }, filePath)
      expect(result).toContain('<p>outer only</p>')
      expect(result).not.toContain('<p>both</p>')
    })

    it('should show neither when outer is false', () => {
      const template = `@if(outer)@if(inner)<p>both</p>@else<p>outer only</p>@endif@else<p>neither</p>@endif`
      const result = processConditionals(template, { outer: false, inner: true }, filePath)
      expect(result).toContain('<p>neither</p>')
      expect(result).not.toContain('<p>both</p>')
      expect(result).not.toContain('outer only')
    })

    it('should handle 3 levels of nesting', () => {
      const template = `@if(a)<p>L1</p>@if(b)<p>L2</p>@if(c)<p>L3</p>@else<p>L3-else</p>@endif@endif@endif`
      const result = processConditionals(template, { a: true, b: true, c: false }, filePath)
      expect(result).toContain('<p>L1</p>')
      expect(result).toContain('<p>L2</p>')
      expect(result).toContain('<p>L3-else</p>')
      expect(result).not.toContain('<p>L3</p>')
    })

    // -- Function calls in conditions --

    it('should support function calls in @if condition', () => {
      const result = processConditionals('@if(isAdmin())<p>admin</p>@endif', { isAdmin: () => true }, filePath)
      expect(result).toContain('<p>admin</p>')
    })

    it('should support function calls returning false', () => {
      const result = processConditionals('@if(isAdmin())<p>admin</p>@endif', { isAdmin: () => false }, filePath)
      expect(result).not.toContain('<p>admin</p>')
    })

    it('should support items.length > 0', () => {
      const result = processConditionals('@if(items.length > 0)<p>has items</p>@endif', { items: [1, 2, 3] }, filePath)
      expect(result).toContain('<p>has items</p>')
    })

    it('should support items.length === 0', () => {
      const result = processConditionals('@if(items.length === 0)<p>empty</p>@endif', { items: [] }, filePath)
      expect(result).toContain('<p>empty</p>')
    })

    // -- Property access --

    it('should support dot property access: user.name', () => {
      const result = processConditionals('@if(user.name)<p>has name</p>@endif', { user: { name: 'Alice' } }, filePath)
      expect(result).toContain('<p>has name</p>')
    })

    it('should handle falsy dot property: user.name is empty string', () => {
      const result = processConditionals('@if(user.name)<p>has name</p>@else<p>no name</p>@endif', { user: { name: '' } }, filePath)
      expect(result).toContain('<p>no name</p>')
    })

    it('should support nested property access: user.profile.avatar', () => {
      const result = processConditionals(
        '@if(user.profile.avatar)<p>has avatar</p>@endif',
        { user: { profile: { avatar: 'img.png' } } },
        filePath,
      )
      expect(result).toContain('<p>has avatar</p>')
    })

    // -- Optional chaining --

    it('should support optional chaining: user?.name', () => {
      const result = processConditionals('@if(user?.name)<p>has name</p>@else<p>no name</p>@endif', { user: null }, filePath)
      expect(result).toContain('<p>no name</p>')
    })

    it('should support optional chaining when property exists', () => {
      const result = processConditionals('@if(user?.name)<p>has name</p>@endif', { user: { name: 'Bob' } }, filePath)
      expect(result).toContain('<p>has name</p>')
    })

    it('should support deep optional chaining: data?.nested?.value', () => {
      const result = processConditionals('@if(data?.nested?.value)<p>deep</p>@else<p>no deep</p>@endif', { data: null }, filePath)
      expect(result).toContain('<p>no deep</p>')
    })

    // -- Nullish coalescing --

    it('should support nullish coalescing: value ?? default', () => {
      const result = processConditionals(
        `@if((value ?? 'default') === 'default')<p>default</p>@endif`,
        { value: null },
        filePath,
      )
      expect(result).toContain('<p>default</p>')
    })

    it('should support nullish coalescing when value exists', () => {
      const result = processConditionals(
        `@if((value ?? 'default') === 'hello')<p>hello</p>@endif`,
        { value: 'hello' },
        filePath,
      )
      expect(result).toContain('<p>hello</p>')
    })

    // -- Arithmetic in conditions --

    it('should support arithmetic: count + 1 > 5', () => {
      const result = processConditionals('@if(count + 1 > 5)<p>big</p>@else<p>small</p>@endif', { count: 6 }, filePath)
      expect(result).toContain('<p>big</p>')
    })

    it('should support arithmetic: count + 1 <= 5', () => {
      const result = processConditionals('@if(count + 1 > 5)<p>big</p>@else<p>small</p>@endif', { count: 3 }, filePath)
      expect(result).toContain('<p>small</p>')
    })

    it('should support modulo: x % 2 === 0', () => {
      const result = processConditionals('@if(x % 2 === 0)<p>even</p>@else<p>odd</p>@endif', { x: 4 }, filePath)
      expect(result).toContain('<p>even</p>')
    })

    // -- String methods --

    it('should support string startsWith', () => {
      const result = processConditionals(
        `@if(name.startsWith('A'))<p>starts with A</p>@endif`,
        { name: 'Alice' },
        filePath,
      )
      expect(result).toContain('<p>starts with A</p>')
    })

    it('should support string includes', () => {
      const result = processConditionals(
        `@if(name.includes('ob'))<p>found</p>@endif`,
        { name: 'Bob' },
        filePath,
      )
      expect(result).toContain('<p>found</p>')
    })

    it('should support string length check', () => {
      const result = processConditionals(
        '@if(name.length > 3)<p>long name</p>@endif',
        { name: 'Alice' },
        filePath,
      )
      expect(result).toContain('<p>long name</p>')
    })

    // -- Array methods --

    it('should support array includes', () => {
      const result = processConditionals(
        `@if(items.includes('x'))<p>has x</p>@endif`,
        { items: ['a', 'x', 'z'] },
        filePath,
      )
      expect(result).toContain('<p>has x</p>')
    })

    it('should support array includes returning false', () => {
      const result = processConditionals(
        `@if(items.includes('y'))<p>has y</p>@else<p>no y</p>@endif`,
        { items: ['a', 'x', 'z'] },
        filePath,
      )
      expect(result).toContain('<p>no y</p>')
    })

    // -- Complex combined expressions --

    it('should support complex combined condition', () => {
      const result = processConditionals(
        `@if(user && user.role === 'admin' && items.length > 0)<p>admin with items</p>@endif`,
        { user: { role: 'admin' }, items: [1, 2] },
        filePath,
      )
      expect(result).toContain('<p>admin with items</p>')
    })

    it('should fail complex combined condition when one part is false', () => {
      const result = processConditionals(
        `@if(user && user.role === 'admin' && items.length > 0)<p>admin with items</p>@else<p>nope</p>@endif`,
        { user: { role: 'editor' }, items: [1, 2] },
        filePath,
      )
      expect(result).toContain('<p>nope</p>')
    })

    // -- Empty body --

    it('should handle empty @if body', () => {
      const result = processConditionals('@if(true)@endif', {}, filePath)
      expect(result.trim()).toBe('')
    })

    it('should handle empty @else body', () => {
      const result = processConditionals('@if(false)content@else@endif', {}, filePath)
      expect(result).not.toContain('content')
    })

    // -- Only @else branch taken --

    it('should show @else content when @if condition is false', () => {
      const result = processConditionals('@if(false)<p>never</p>@else<p>always</p>@endif', {}, filePath)
      expect(result).toContain('<p>always</p>')
      expect(result).not.toContain('<p>never</p>')
    })

    // -- Whitespace handling --

    it('should handle whitespace in condition: @if( condition )', () => {
      const result = processConditionals('@if( show )<p>yes</p>@endif', { show: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should handle extra spaces: @if(  spaced  )', () => {
      const result = processConditionals('@if(  spaced  )<p>yes</p>@endif', { spaced: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should handle space between @if and parenthesis: @if (condition)', () => {
      const result = processConditionals('@if (show)<p>yes</p>@endif', { show: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    // -- Multiple conditionals in same template --

    it('should handle multiple independent @if blocks', () => {
      const template = '@if(a)<p>A</p>@endif@if(b)<p>B</p>@endif@if(c)<p>C</p>@endif'
      const result = processConditionals(template, { a: true, b: false, c: true }, filePath)
      expect(result).toContain('<p>A</p>')
      expect(result).not.toContain('<p>B</p>')
      expect(result).toContain('<p>C</p>')
    })

    it('should handle multiple @if/@else blocks', () => {
      const template = '@if(x)<p>X</p>@else<p>notX</p>@endif --- @if(y)<p>Y</p>@else<p>notY</p>@endif'
      const result = processConditionals(template, { x: false, y: true }, filePath)
      expect(result).toContain('<p>notX</p>')
      expect(result).toContain('<p>Y</p>')
    })

    // -- Conditions with parentheses in expressions --

    it('should handle parenthesized sub-expressions', () => {
      const result = processConditionals('@if((a || b) && c)<p>yes</p>@else<p>no</p>@endif', { a: true, b: false, c: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should handle nested parentheses: (a && (b || c))', () => {
      const result = processConditionals('@if(a && (b || c))<p>yes</p>@endif', { a: true, b: false, c: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    // -- Ternary in condition (truthy result) --

    it('should support ternary expressions as conditions', () => {
      const result = processConditionals('@if(flag ? true : false)<p>yes</p>@endif', { flag: true }, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    // -- String comparison in conditions --

    it('should compare strings with ===', () => {
      const result = processConditionals(`@if(status === 'active')<p>active</p>@endif`, { status: 'active' }, filePath)
      expect(result).toContain('<p>active</p>')
    })

    it('should compare strings with !== when not matching', () => {
      const result = processConditionals(`@if(status !== 'active')<p>inactive</p>@endif`, { status: 'inactive' }, filePath)
      expect(result).toContain('<p>inactive</p>')
    })

    // -- Multiline content in @if blocks --

    it('should handle multiline content in @if blocks', () => {
      const template = `@if(show)
<div>
  <p>Line 1</p>
  <p>Line 2</p>
</div>
@endif`
      const result = processConditionals(template, { show: true }, filePath)
      expect(result).toContain('<p>Line 1</p>')
      expect(result).toContain('<p>Line 2</p>')
    })

    // -- Boolean literal conditions --

    it('should handle literal true condition', () => {
      const result = processConditionals('@if(true)<p>yes</p>@endif', {}, filePath)
      expect(result).toContain('<p>yes</p>')
    })

    it('should handle literal false condition', () => {
      const result = processConditionals('@if(false)<p>yes</p>@else<p>no</p>@endif', {}, filePath)
      expect(result).toContain('<p>no</p>')
    })

    // -- Numeric comparisons --

    it('should compare numbers correctly: 10 > 5', () => {
      const result = processConditionals('@if(10 > 5)<p>bigger</p>@endif', {}, filePath)
      expect(result).toContain('<p>bigger</p>')
    })

    it('should compare variable to number', () => {
      const result = processConditionals('@if(count === 42)<p>answer</p>@endif', { count: 42 }, filePath)
      expect(result).toContain('<p>answer</p>')
    })

    // -- typeof checks --

    it('should support typeof check', () => {
      const result = processConditionals(
        `@if(typeof val === 'string')<p>string</p>@else<p>not string</p>@endif`,
        { val: 'hello' },
        filePath,
      )
      expect(result).toContain('<p>string</p>')
    })
  })

  // =========================================================================
  // @unless / @endunless
  // =========================================================================
  describe('@unless/@endunless', () => {
    it('should show content when condition is false (inverted @if)', () => {
      const result = processConditionals('@unless(hidden)<p>visible</p>@endunless', { hidden: false }, filePath)
      expect(result).toContain('<p>visible</p>')
    })

    it('should hide content when condition is true', () => {
      const result = processConditionals('@unless(hidden)<p>visible</p>@endunless', { hidden: true }, filePath)
      expect(result).not.toContain('<p>visible</p>')
    })

    it('should show @else content when condition is true', () => {
      const result = processConditionals('@unless(admin)<p>regular</p>@else<p>admin</p>@endunless', { admin: true }, filePath)
      expect(result).toContain('<p>admin</p>')
      expect(result).not.toContain('<p>regular</p>')
    })

    it('should show @unless body when condition is false with @else present', () => {
      const result = processConditionals('@unless(admin)<p>regular</p>@else<p>admin</p>@endunless', { admin: false }, filePath)
      expect(result).toContain('<p>regular</p>')
      expect(result).not.toContain('<p>admin</p>')
    })

    it('should handle @unless with complex condition', () => {
      const result = processConditionals(
        `@unless(user.role === 'admin')<p>not admin</p>@endunless`,
        { user: { role: 'editor' } },
        filePath,
      )
      expect(result).toContain('<p>not admin</p>')
    })

    it('should hide content when complex condition is true', () => {
      const result = processConditionals(
        `@unless(user.role === 'admin')<p>not admin</p>@endunless`,
        { user: { role: 'admin' } },
        filePath,
      )
      expect(result).not.toContain('<p>not admin</p>')
    })

    it('should handle nested @unless', () => {
      const template = '@unless(a)@unless(b)<p>neither</p>@endunless@endunless'
      const result = processConditionals(template, { a: false, b: false }, filePath)
      expect(result).toContain('<p>neither</p>')
    })

    it('should handle @if nested inside @unless', () => {
      const template = '@unless(hidden)@if(important)<p>important visible</p>@endif@endunless'
      const result = processConditionals(template, { hidden: false, important: true }, filePath)
      expect(result).toContain('<p>important visible</p>')
    })

    it('should hide all nested content when @unless condition is true', () => {
      const template = '@unless(hidden)@if(important)<p>important</p>@endif@endunless'
      const result = processConditionals(template, { hidden: true, important: true }, filePath)
      expect(result).not.toContain('<p>important</p>')
    })

    it('should handle multiline content in @unless', () => {
      const template = `@unless(locked)
<div>
  <p>Editable</p>
</div>
@endunless`
      const result = processConditionals(template, { locked: false }, filePath)
      expect(result).toContain('<p>Editable</p>')
    })
  })

  // =========================================================================
  // @switch / @case / @default / @endswitch
  // =========================================================================
  describe('@switch/@case/@default', () => {
    it('should match string case', () => {
      const template = `@switch(color)@case('red')<p>Red</p>@break@case('blue')<p>Blue</p>@break@default<p>Unknown</p>@endswitch`
      const result = processSwitchStatements(template, { color: 'red' }, filePath)
      expect(result).toContain('<p>Red</p>')
      expect(result).not.toContain('<p>Blue</p>')
      expect(result).not.toContain('<p>Unknown</p>')
    })

    it('should match second string case', () => {
      const template = `@switch(color)@case('red')<p>Red</p>@break@case('blue')<p>Blue</p>@break@default<p>Unknown</p>@endswitch`
      const result = processSwitchStatements(template, { color: 'blue' }, filePath)
      expect(result).toContain('<p>Blue</p>')
      expect(result).not.toContain('<p>Red</p>')
    })

    it('should match number case', () => {
      const template = `@switch(count)@case(1)<p>One</p>@break@case(2)<p>Two</p>@break@case(3)<p>Three</p>@break@endswitch`
      const result = processSwitchStatements(template, { count: 2 }, filePath)
      expect(result).toContain('<p>Two</p>')
      expect(result).not.toContain('<p>One</p>')
      expect(result).not.toContain('<p>Three</p>')
    })

    it('should match boolean case: true', () => {
      const template = `@switch(active)@case(true)<p>Active</p>@break@case(false)<p>Inactive</p>@break@endswitch`
      const result = processSwitchStatements(template, { active: true }, filePath)
      expect(result).toContain('<p>Active</p>')
      expect(result).not.toContain('<p>Inactive</p>')
    })

    it('should match boolean case: false', () => {
      const template = `@switch(active)@case(true)<p>Active</p>@break@case(false)<p>Inactive</p>@break@endswitch`
      const result = processSwitchStatements(template, { active: false }, filePath)
      expect(result).toContain('<p>Inactive</p>')
    })

    it('should fall through to @default when no case matches', () => {
      const template = `@switch(color)@case('red')<p>Red</p>@break@case('blue')<p>Blue</p>@break@default<p>Unknown color</p>@endswitch`
      const result = processSwitchStatements(template, { color: 'green' }, filePath)
      expect(result).toContain('<p>Unknown color</p>')
      expect(result).not.toContain('<p>Red</p>')
      expect(result).not.toContain('<p>Blue</p>')
    })

    it('should handle multiple @case blocks (5 cases)', () => {
      const template = `@switch(day)@case('mon')<p>Monday</p>@break@case('tue')<p>Tuesday</p>@break@case('wed')<p>Wednesday</p>@break@case('thu')<p>Thursday</p>@break@case('fri')<p>Friday</p>@break@default<p>Weekend</p>@endswitch`
      const result = processSwitchStatements(template, { day: 'wed' }, filePath)
      expect(result).toContain('<p>Wednesday</p>')
      expect(result).not.toContain('<p>Monday</p>')
      expect(result).not.toContain('<p>Friday</p>')
      expect(result).not.toContain('<p>Weekend</p>')
    })

    it('should return empty when no case matches and no @default', () => {
      const template = `@switch(x)@case(1)<p>One</p>@break@case(2)<p>Two</p>@break@endswitch`
      const result = processSwitchStatements(template, { x: 99 }, filePath)
      expect(result).not.toContain('<p>One</p>')
      expect(result).not.toContain('<p>Two</p>')
    })

    it('should handle nested @switch blocks', () => {
      const template = `@switch(outer)@case('A')@switch(inner)@case('X')<p>AX</p>@break@case('Y')<p>AY</p>@break@endswitch@break@case('B')<p>B</p>@break@endswitch`
      const result = processSwitchStatements(template, { outer: 'A', inner: 'X' }, filePath)
      expect(result).toContain('<p>AX</p>')
      expect(result).not.toContain('<p>AY</p>')
      expect(result).not.toContain('<p>B</p>')
    })

    it('should handle nested @switch with inner match on second case', () => {
      const template = `@switch(outer)@case('A')@switch(inner)@case('X')<p>AX</p>@break@case('Y')<p>AY</p>@break@endswitch@break@case('B')<p>B</p>@break@endswitch`
      const result = processSwitchStatements(template, { outer: 'A', inner: 'Y' }, filePath)
      expect(result).toContain('<p>AY</p>')
      expect(result).not.toContain('<p>AX</p>')
    })

    it('should handle case with variable expression: @case(user.role)', () => {
      const template = `@switch(role)@case(expected)<p>Match</p>@break@default<p>No match</p>@endswitch`
      const result = processSwitchStatements(template, { role: 'admin', expected: 'admin' }, filePath)
      expect(result).toContain('<p>Match</p>')
    })

    it('should handle function call in switch expression: @switch(getStatus())', () => {
      const template = `@switch(getStatus())@case('active')<p>Active</p>@break@case('inactive')<p>Inactive</p>@break@endswitch`
      const result = processSwitchStatements(template, { getStatus: () => 'active' }, filePath)
      expect(result).toContain('<p>Active</p>')
    })

    it('should handle multiline switch with whitespace', () => {
      const template = `
        @switch(color)
          @case('red')
            <p>Red</p>
            @break
          @case('blue')
            <p>Blue</p>
            @break
          @default
            <p>Other</p>
        @endswitch
      `
      const result = processSwitchStatements(template, { color: 'blue' }, filePath)
      expect(result).toContain('<p>Blue</p>')
      expect(result).not.toContain('<p>Red</p>')
      expect(result).not.toContain('<p>Other</p>')
    })

    it('should handle @default as only case', () => {
      const template = `@switch(x)@default<p>Default only</p>@endswitch`
      const result = processSwitchStatements(template, { x: 'anything' }, filePath)
      expect(result).toContain('<p>Default only</p>')
    })
  })

  // =========================================================================
  // @auth / @guest / @can / @cannot
  // =========================================================================
  describe('@auth/@guest/@can/@cannot', () => {
    it('@auth should show content when user is authenticated', () => {
      const result = processAuthDirectives(
        '@auth\n<p>Welcome</p>\n@endauth',
        { auth: { check: true, user: { id: 1, name: 'John' } } },
      )
      expect(result).toContain('<p>Welcome</p>')
    })

    it('@auth should hide content when user is not authenticated', () => {
      const result = processAuthDirectives(
        '@auth\n<p>Welcome</p>\n@endauth',
        { auth: { check: false, user: null } },
      )
      expect(result).not.toContain('<p>Welcome</p>')
    })

    it('@auth should hide content when auth is not in context', () => {
      const result = processAuthDirectives(
        '@auth\n<p>Welcome</p>\n@endauth',
        {},
      )
      expect(result).not.toContain('<p>Welcome</p>')
    })

    it('@auth with @else should show else when not authenticated', () => {
      const result = processAuthDirectives(
        '@auth\n<p>Logged in</p>\n@else\n<p>Please login</p>\n@endauth',
        { auth: { check: false, user: null } },
      )
      expect(result).toContain('<p>Please login</p>')
      expect(result).not.toContain('<p>Logged in</p>')
    })

    it('@auth with @else should show auth content when authenticated', () => {
      const result = processAuthDirectives(
        '@auth\n<p>Logged in</p>\n@else\n<p>Please login</p>\n@endauth',
        { auth: { check: true, user: { id: 1 } } },
      )
      expect(result).toContain('<p>Logged in</p>')
      expect(result).not.toContain('<p>Please login</p>')
    })

    it('@guest should show content when user is NOT authenticated', () => {
      const result = processAuthDirectives(
        '@guest\n<p>Please login</p>\n@endguest',
        { auth: { check: false, user: null } },
      )
      expect(result).toContain('<p>Please login</p>')
    })

    it('@guest should show content when auth is not in context', () => {
      const result = processAuthDirectives(
        '@guest\n<p>Please login</p>\n@endguest',
        {},
      )
      expect(result).toContain('<p>Please login</p>')
    })

    it('@guest should hide content when user is authenticated', () => {
      const result = processAuthDirectives(
        '@guest\n<p>Please login</p>\n@endguest',
        { auth: { check: true, user: { id: 1 } } },
      )
      expect(result).not.toContain('<p>Please login</p>')
    })

    it('@guest with @else should show else when authenticated', () => {
      const result = processAuthDirectives(
        '@guest\n<p>Please login</p>\n@else\n<p>Welcome back</p>\n@endguest',
        { auth: { check: true, user: { id: 1 } } },
      )
      expect(result).toContain('<p>Welcome back</p>')
      expect(result).not.toContain('<p>Please login</p>')
    })

    it("@auth with named guard parameter: @auth('admin')", () => {
      // The guard is extracted as 'admin' and used in: auth?.user?.['admin']
      // The expression evaluator resolves [admin] as a variable lookup, so
      // we need to provide it via context or use the fact that evaluateAuthExpression
      // creates a safe function with context keys
      const result = processAuthDirectives(
        `@auth('admin')\n<p>Admin panel</p>\n@endauth`,
        { auth: { check: true, user: { id: 1, admin: true } }, admin: 'admin' },
      )
      expect(result).toContain('<p>Admin panel</p>')
    })

    it("@auth with named guard should hide when guard property is falsy", () => {
      const result = processAuthDirectives(
        `@auth('admin')\n<p>Admin panel</p>\n@endauth`,
        { auth: { check: true, user: { id: 1, admin: false } }, admin: 'admin' },
      )
      expect(result).not.toContain('<p>Admin panel</p>')
    })

    it("@can('permission') should show content when user has permission (userCan)", () => {
      const result = processAuthDirectives(
        `@can('edit-posts')<button>Edit</button>@endcan`,
        { userCan: { 'edit-posts': true } },
      )
      expect(result).toContain('<button>Edit</button>')
    })

    it("@can('permission') should hide content when user lacks permission", () => {
      const result = processAuthDirectives(
        `@can('edit-posts')<button>Edit</button>@endcan`,
        { userCan: { 'edit-posts': false } },
      )
      expect(result).not.toContain('<button>Edit</button>')
    })

    it("@can with @else should show else when permission is denied", () => {
      const result = processAuthDirectives(
        `@can('delete-posts')<button>Delete</button>@else<span>No permission</span>@endcan`,
        { userCan: { 'delete-posts': false } },
      )
      expect(result).toContain('<span>No permission</span>')
      expect(result).not.toContain('<button>Delete</button>')
    })

    it("@cannot('permission') should show content when user lacks permission", () => {
      const result = processAuthDirectives(
        `@cannot('delete-posts')<span>Disabled</span>@endcannot`,
        { userCan: { 'delete-posts': false } },
      )
      expect(result).toContain('<span>Disabled</span>')
    })

    it("@cannot('permission') should hide content when user has permission", () => {
      const result = processAuthDirectives(
        `@cannot('delete-posts')<span>Disabled</span>@endcannot`,
        { userCan: { 'delete-posts': true } },
      )
      expect(result).not.toContain('<span>Disabled</span>')
    })

    it("@can with function-based permissions check", () => {
      const result = processAuthDirectives(
        `@can('manage-users')<p>Manage</p>@endcan`,
        { permissions: { check: (ability: string) => ability === 'manage-users' } },
      )
      expect(result).toContain('<p>Manage</p>')
    })

    it("@can with function-based permissions returning false", () => {
      const result = processAuthDirectives(
        `@can('manage-users')<p>Manage</p>@endcan`,
        { permissions: { check: (_ability: string) => false } },
      )
      expect(result).not.toContain('<p>Manage</p>')
    })

    it('should handle @auth and @guest in same template', () => {
      const template = '@auth\n<p>Authenticated</p>\n@endauth\n@guest\n<p>Guest</p>\n@endguest'
      const result = processAuthDirectives(template, { auth: { check: true, user: { id: 1 } } })
      expect(result).toContain('<p>Authenticated</p>')
      expect(result).not.toContain('<p>Guest</p>')
    })

    it('nested @can inside @auth', () => {
      const template = `@auth\n@can('edit')<p>Can edit</p>@endcan\n@endauth`
      const result = processAuthDirectives(
        template,
        { auth: { check: true, user: { id: 1 } }, userCan: { edit: true } },
      )
      expect(result).toContain('<p>Can edit</p>')
    })

    it('nested @can inside @auth hides when not authenticated', () => {
      const template = `@auth\n@can('edit')<p>Can edit</p>@endcan\n@endauth`
      const result = processAuthDirectives(
        template,
        { auth: { check: false, user: null }, userCan: { edit: true } },
      )
      expect(result).not.toContain('<p>Can edit</p>')
    })
  })

  // =========================================================================
  // @env / @endenv
  // =========================================================================
  describe('@env', () => {
    it("@env('production') should show content when NODE_ENV is production", () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective(`@env('production')\n<p>Prod</p>\n@endenv`, {})
        expect(result).toContain('<p>Prod</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it("@env('production') should hide content when NODE_ENV is development", () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective(`@env('production')\n<p>Prod</p>\n@endenv`, {})
        expect(result).not.toContain('<p>Prod</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it("@env('development') should show content when NODE_ENV is development", () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective(`@env('development')\n<p>Dev</p>\n@endenv`, {})
        expect(result).toContain('<p>Dev</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it("@env('staging') should show content when NODE_ENV is staging", () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'staging'
      try {
        const result = processEnvDirective(`@env('staging')\n<p>Staging</p>\n@endenv`, {})
        expect(result).toContain('<p>Staging</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it("@env('staging') should hide content when env does not match", () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective(`@env('staging')\n<p>Staging</p>\n@endenv`, {})
        expect(result).not.toContain('<p>Staging</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@production should show content in production', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective('@production\n<p>Prod only</p>\n@endproduction', {})
        expect(result).toContain('<p>Prod only</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@production should hide content in development', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective('@production\n<p>Prod only</p>\n@endproduction', {})
        expect(result).not.toContain('<p>Prod only</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@development should show content in development', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective('@development\n<p>Dev only</p>\n@enddevelopment', {})
        expect(result).toContain('<p>Dev only</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@development should hide content in production', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective('@development\n<p>Dev only</p>\n@enddevelopment', {})
        expect(result).not.toContain('<p>Dev only</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@env with @else should show else content when env does not match', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective(`@env('production')\n<p>Prod</p>\n@else\n<p>Not prod</p>\n@endenv`, {})
        expect(result).toContain('<p>Not prod</p>')
        expect(result).not.toContain('<p>Prod</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@env with @else should show main content when env matches', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective(`@env('production')\n<p>Prod</p>\n@else\n<p>Not prod</p>\n@endenv`, {})
        expect(result).toContain('<p>Prod</p>')
        expect(result).not.toContain('<p>Not prod</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@testing should show content in test environment', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'testing'
      try {
        const result = processEnvDirective('@testing\n<p>Testing mode</p>\n@endtesting', {})
        expect(result).toContain('<p>Testing mode</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('@staging should show content in staging environment', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'staging'
      try {
        const result = processEnvDirective('@staging\n<p>Staging mode</p>\n@endstaging', {})
        expect(result).toContain('<p>Staging mode</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('should handle multiple @env blocks in same template', () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const template = `@env('production')<p>Prod</p>@endenv@env('development')<p>Dev</p>@endenv`
        const result = processEnvDirective(template, {})
        expect(result).toContain('<p>Prod</p>')
        expect(result).not.toContain('<p>Dev</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })
  })

  // =========================================================================
  // @isset / @empty / @endisset / @endempty
  // =========================================================================
  describe('@isset/@empty', () => {
    // -- @isset --

    it('@isset should show content when variable exists in context', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@endisset', { name: 'Alice' }, filePath)
      expect(result).toContain('<p>Has name</p>')
    })

    it('@isset should hide content when variable does NOT exist', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@endisset', {}, filePath)
      expect(result).not.toContain('<p>Has name</p>')
    })

    it('@isset should hide content when variable is null', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@endisset', { name: null }, filePath)
      expect(result).not.toContain('<p>Has name</p>')
    })

    it('@isset should hide content when variable is undefined', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@endisset', { name: undefined }, filePath)
      expect(result).not.toContain('<p>Has name</p>')
    })

    it('@isset should show content when variable is 0 (0 is set)', () => {
      const result = processIssetEmptyDirectives('@isset(count)<p>Set</p>@endisset', { count: 0 }, filePath)
      expect(result).toContain('<p>Set</p>')
    })

    it('@isset should show content when variable is empty string (empty string is set)', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Set</p>@endisset', { name: '' }, filePath)
      expect(result).toContain('<p>Set</p>')
    })

    it('@isset should show content when variable is false (false is set)', () => {
      const result = processIssetEmptyDirectives('@isset(flag)<p>Set</p>@endisset', { flag: false }, filePath)
      expect(result).toContain('<p>Set</p>')
    })

    it('@isset with @else should show else when not set', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@else<p>No name</p>@endisset', {}, filePath)
      expect(result).toContain('<p>No name</p>')
      expect(result).not.toContain('<p>Has name</p>')
    })

    it('@isset with @else should show main content when set', () => {
      const result = processIssetEmptyDirectives('@isset(name)<p>Has name</p>@else<p>No name</p>@endisset', { name: 'Bob' }, filePath)
      expect(result).toContain('<p>Has name</p>')
      expect(result).not.toContain('<p>No name</p>')
    })

    // -- @empty --

    it('@empty should show content when variable is null', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: null }, filePath)
      expect(result).toContain('<p>Empty</p>')
    })

    it('@empty should show content when variable is undefined', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: undefined }, filePath)
      expect(result).toContain('<p>Empty</p>')
    })

    it('@empty should show content when variable is empty string', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: '' }, filePath)
      expect(result).toContain('<p>Empty</p>')
    })

    it('@empty should show content when variable is empty array', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: [] }, filePath)
      expect(result).toContain('<p>Empty</p>')
    })

    it('@empty should show content when variable is empty object', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: {} }, filePath)
      expect(result).toContain('<p>Empty</p>')
    })

    it('@empty should hide content when variable has a value (string)', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: 'hello' }, filePath)
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty should hide content when variable has a value (number)', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: 42 }, filePath)
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty should hide content when variable has a value (non-empty array)', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: [1] }, filePath)
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty should hide content when variable has a value (non-empty object)', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: { a: 1 } }, filePath)
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty should hide content when variable is true', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@endempty', { val: true }, filePath)
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty with @else should show else when variable has value', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@else<p>Has value</p>@endempty', { val: 'hi' }, filePath)
      expect(result).toContain('<p>Has value</p>')
      expect(result).not.toContain('<p>Empty</p>')
    })

    it('@empty with @else should show main content when empty', () => {
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@else<p>Has value</p>@endempty', { val: null }, filePath)
      expect(result).toContain('<p>Empty</p>')
      expect(result).not.toContain('<p>Has value</p>')
    })

    // -- Nested @isset --

    it('should handle nested @isset', () => {
      const template = '@isset(a)A:@isset(b)B@endisset@endisset'
      const result = processIssetEmptyDirectives(template, { a: 'x', b: 'y' }, filePath)
      expect(result).toContain('A:')
      expect(result).toContain('B')
    })

    it('nested @isset should hide inner when inner var missing', () => {
      const template = '@isset(a)A:@isset(b)B@endisset@endisset'
      const result = processIssetEmptyDirectives(template, { a: 'x' }, filePath)
      expect(result).toContain('A:')
      expect(result).not.toContain('B')
    })

    it('nested @isset should hide all when outer var missing', () => {
      const template = '@isset(a)A:@isset(b)B@endisset@endisset'
      const result = processIssetEmptyDirectives(template, { b: 'y' }, filePath)
      expect(result).not.toContain('A:')
      expect(result).not.toContain('B')
    })

    // -- @isset and @empty in same template --

    it('should handle @isset and @empty together', () => {
      const template = '@isset(name)<p>Name is set</p>@endisset@empty(list)<p>List is empty</p>@endempty'
      const result = processIssetEmptyDirectives(template, { name: 'Alice', list: [] }, filePath)
      expect(result).toContain('<p>Name is set</p>')
      expect(result).toContain('<p>List is empty</p>')
    })
  })

  // =========================================================================
  // Edge cases
  // =========================================================================
  describe('Edge cases', () => {
    it('should handle comments inside conditional blocks', () => {
      const template = `@if(show)<!-- visible comment --><p>Content</p>@endif`
      const result = processConditionals(template, { show: true }, filePath)
      expect(result).toContain('<!-- visible comment -->')
      expect(result).toContain('<p>Content</p>')
    })

    it('should handle very long condition expressions', () => {
      const longVar = 'a'
      const result = processConditionals(
        `@if(${longVar} === 1 || ${longVar} === 2 || ${longVar} === 3 || ${longVar} === 4 || ${longVar} === 5)<p>yes</p>@endif`,
        { a: 3 },
        filePath,
      )
      expect(result).toContain('<p>yes</p>')
    })

    it('should handle @if with HTML content containing special characters', () => {
      const result = processConditionals(
        '@if(show)<p>&amp; &lt; &gt; &quot;</p>@endif',
        { show: true },
        filePath,
      )
      expect(result).toContain('&amp; &lt; &gt; &quot;')
    })

    it('should handle @if with inline styles', () => {
      const result = processConditionals(
        '@if(show)<div style="color: red; font-size: 14px;">styled</div>@endif',
        { show: true },
        filePath,
      )
      expect(result).toContain('style="color: red; font-size: 14px;"')
    })

    it('should handle @if with data attributes', () => {
      const result = processConditionals(
        '@if(show)<div data-id="123" data-type="test">content</div>@endif',
        { show: true },
        filePath,
      )
      expect(result).toContain('data-id="123"')
    })

    it('should handle empty template with no directives', () => {
      const result = processConditionals('<p>plain html</p>', {}, filePath)
      expect(result).toBe('<p>plain html</p>')
    })

    it('should preserve surrounding content when @if is false', () => {
      const result = processConditionals('<header>H</header>@if(false)<p>hidden</p>@endif<footer>F</footer>', {}, filePath)
      expect(result).toContain('<header>H</header>')
      expect(result).toContain('<footer>F</footer>')
      expect(result).not.toContain('<p>hidden</p>')
    })

    it('should handle @if immediately after another @endif', () => {
      const template = '@if(a)<p>A</p>@endif@if(b)<p>B</p>@endif'
      const result = processConditionals(template, { a: true, b: true }, filePath)
      expect(result).toContain('<p>A</p>')
      expect(result).toContain('<p>B</p>')
    })

    it('should handle large content inside @isset efficiently', () => {
      const largeContent = '<p>x</p>'.repeat(1000)
      const template = `@isset(value)${largeContent}@endisset`
      const result = processIssetEmptyDirectives(template, { value: 'exists' }, filePath)
      expect(result).toContain('<p>x</p>')
      expect(result.length).toBeGreaterThan(5000)
    })

    it('should handle @if with negative number comparison', () => {
      const result = processConditionals('@if(x > -1)<p>positive</p>@endif', { x: 0 }, filePath)
      expect(result).toContain('<p>positive</p>')
    })

    it('should handle @if with decimal number comparison', () => {
      const result = processConditionals('@if(x > 0.5)<p>big</p>@else<p>small</p>@endif', { x: 0.7 }, filePath)
      expect(result).toContain('<p>big</p>')
    })

    it('should handle @switch with only whitespace between directives', () => {
      const template = `@switch(x)
        @case(1)
          <p>One</p>
        @break
        @default
          <p>Other</p>
      @endswitch`
      const result = processSwitchStatements(template, { x: 1 }, filePath)
      expect(result).toContain('<p>One</p>')
      expect(result).not.toContain('<p>Other</p>')
    })

    it('should handle @if with string concatenation in condition', () => {
      const result = processConditionals(
        `@if(prefix + suffix === 'foobar')<p>match</p>@endif`,
        { prefix: 'foo', suffix: 'bar' },
        filePath,
      )
      expect(result).toContain('<p>match</p>')
    })

    it('should handle @if referencing an array element by index', () => {
      const result = processConditionals(
        `@if(items[0] === 'first')<p>first match</p>@endif`,
        { items: ['first', 'second'] },
        filePath,
      )
      expect(result).toContain('<p>first match</p>')
    })

    it('should handle @if with double negation', () => {
      const result = processConditionals('@if(!!value)<p>truthy</p>@endif', { value: 'hello' }, filePath)
      expect(result).toContain('<p>truthy</p>')
    })

    it('should handle @if with double negation on falsy value', () => {
      const result = processConditionals('@if(!!value)<p>truthy</p>@else<p>falsy</p>@endif', { value: '' }, filePath)
      expect(result).toContain('<p>falsy</p>')
    })

    it('should handle @unless with logical NOT (double inversion)', () => {
      // @unless(!show) => show when show is true
      const result = processConditionals('@unless(!show)<p>visible</p>@endunless', { show: true }, filePath)
      expect(result).toContain('<p>visible</p>')
    })

    it('should handle @empty for 0 value (0 is not empty in context of null/undefined check)', () => {
      // Based on source: empty checks for undefined, null, '', empty array, empty object
      // 0 is NOT in that list, so @empty should hide content for 0
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@else<p>Has value</p>@endempty', { val: 0 }, filePath)
      expect(result).toContain('<p>Has value</p>')
    })

    it('should handle @empty for false value', () => {
      // false is not in the empty check list (undefined, null, '', [], {})
      const result = processIssetEmptyDirectives('@empty(val)<p>Empty</p>@else<p>Has value</p>@endempty', { val: false }, filePath)
      expect(result).toContain('<p>Has value</p>')
    })

    it('should handle processConditionals calling all sub-processors', () => {
      // processConditionals calls processSwitchStatements, processIssetEmptyDirectives,
      // processEnvDirective, and processAuthDirectives internally
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const template = `@if(show)<p>IF</p>@endif@isset(name)<p>ISSET</p>@endisset@env('production')<p>PROD</p>@endenv`
        const result = processConditionals(template, { show: true, name: 'test' }, filePath)
        expect(result).toContain('<p>IF</p>')
        expect(result).toContain('<p>ISSET</p>')
        expect(result).toContain('<p>PROD</p>')
      }
      finally {
        process.env.NODE_ENV = prev
      }
    })

    it('should handle @if with template-like syntax in condition (string with curly braces)', () => {
      const result = processConditionals(
        `@if(title === 'Hello {world}')<p>match</p>@endif`,
        { title: 'Hello {world}' },
        filePath,
      )
      expect(result).toContain('<p>match</p>')
    })

    it('should handle multiple @switch blocks in same template', () => {
      const template = `@switch(a)@case('x')<p>AX</p>@break@default<p>AD</p>@endswitch---@switch(b)@case('y')<p>BY</p>@break@default<p>BD</p>@endswitch`
      const result = processSwitchStatements(template, { a: 'x', b: 'y' }, filePath)
      expect(result).toContain('<p>AX</p>')
      expect(result).toContain('<p>BY</p>')
      expect(result).not.toContain('<p>AD</p>')
      expect(result).not.toContain('<p>BD</p>')
    })

    it('should handle @if with in operator', () => {
      const result = processConditionals(
        `@if('name' in user)<p>has name</p>@endif`,
        { user: { name: 'Alice' } },
        filePath,
      )
      expect(result).toContain('<p>has name</p>')
    })

    it('should handle @auth with multiline content', () => {
      const template = `@auth
<nav>
  <span>User menu</span>
  <a href="/logout">Logout</a>
</nav>
@endauth`
      const result = processAuthDirectives(template, { auth: { check: true, user: { id: 1 } } })
      expect(result).toContain('<span>User menu</span>')
      expect(result).toContain('<a href="/logout">Logout</a>')
    })

    it('should handle @cannot with @else', () => {
      const result = processAuthDirectives(
        `@cannot('admin')<p>Regular</p>@else<p>Admin</p>@endcannot`,
        { userCan: { admin: true } },
      )
      expect(result).toContain('<p>Admin</p>')
      expect(result).not.toContain('<p>Regular</p>')
    })

    it('should handle @auth with space before newline', () => {
      const result = processAuthDirectives(
        '@auth \n<p>Content</p>\n@endauth',
        { auth: { check: true, user: { id: 1 } } },
      )
      expect(result).toContain('<p>Content</p>')
    })
  })
})
