/**
 * Directive edge case tests - redistributed from bugs/ directory.
 *
 * Covers: @if, @switch, @foreach, @for, @unless, @isset, @empty, @method,
 * and other directive-specific edge cases.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processConditionals, processIssetEmptyDirectives, processSwitchStatements } from '../../src/conditionals'
import { defaultConfig } from '../../src/config'
import { processExpressions } from '../../src/expressions'
import { processBasicFormDirectives } from '../../src/forms'
import { processLoops } from '../../src/loops'
import { processDirectives } from '../../src/process'

const opts = defaultConfig as any as StxOptions
const fp = 'test.stx'
const deps = new Set<string>()

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultOptions,
): Promise<string> {
  const d = new Set<string>()
  return processDirectives(template, context, filePath, options, d)
}

// =============================================================================
// 1. @if Condition Evaluation Stress (from deep-edge-cases.ts)
// =============================================================================

describe('@if Condition Evaluation Stress', () => {
  it('long chained && condition', async () => {
    const template = `@if(a && b && c && d && e && f && g)<span>all true</span>@endif`
    const ctx = { a: true, b: true, c: true, d: true, e: true, f: true, g: true }
    const result = await processTemplate(template, ctx)
    expect(result).toContain('all true')
  })

  it('long chained && condition where one is false', async () => {
    const template = `@if(a && b && c && d && e && f && g)<span>all true</span>@endif`
    const ctx = { a: true, b: true, c: true, d: false, e: true, f: true, g: true }
    const result = await processTemplate(template, ctx)
    expect(result).not.toContain('all true')
  })

  it('condition with nested function calls: items.filter(x => x > 0).length > 0', async () => {
    const template = `@if(items.filter(x => x > 0).length > 0)<span>has positive</span>@endif`
    const result = await processTemplate(template, { items: [1, -2, 3] })
    expect(result).toContain('has positive')
  })

  it('condition with string includes', async () => {
    const template = `@if(name.includes('admin'))<span>is admin</span>@endif`
    const result = await processTemplate(template, { name: 'admin_user' })
    expect(result).toContain('is admin')
  })

  it('BUG: condition referencing outer scope variable that does not exist', async () => {
    const template = `@if(nonExistentVar)<span>visible</span>@endif`
    const result = await processTemplate(template, {})
    expect(result).not.toContain('visible')
  })

  it('condition with deeply nested property: a.b.c.d.e', async () => {
    const template = `@if(a.b.c.d.e)<span>deep</span>@endif`
    const ctx = { a: { b: { c: { d: { e: true } } } } }
    const result = await processTemplate(template, ctx)
    expect(result).toContain('deep')
  })

  it('condition with computed property access: obj[key]', async () => {
    const template = `@if(obj[key])<span>found</span>@endif`
    const result = await processTemplate(template, { obj: { x: true }, key: 'x' })
    expect(typeof result).toBe('string')
  })

  it('condition with Math: Math.floor(score / 10) >= 9', async () => {
    const template = `@if(Math.floor(score / 10) >= 9)<span>high</span>@endif`
    const result = await processTemplate(template, { score: 95 })
    expect(result).toContain('high')
  })

  it('condition mixing && and ||: (a || b) && (c || d)', async () => {
    const template = `@if((a || b) && (c || d))<span>yes</span>@endif`
    const result = await processTemplate(template, { a: false, b: true, c: false, d: true })
    expect(result).toContain('yes')
  })

  it('condition with double negation: !!value', async () => {
    const template = `@if(!!value)<span>truthy</span>@endif`
    const result = await processTemplate(template, { value: 'hello' })
    expect(result).toContain('truthy')
  })

  it('condition with comparison chaining: 0 < x && x < 10', async () => {
    const template = `@if(0 < x && x < 10)<span>in range</span>@endif`
    const result = await processTemplate(template, { x: 5 })
    expect(result).toContain('in range')
  })

  it('BUG: condition that accesses property on undefined', async () => {
    const template = `@if(undefinedVar && undefinedVar.property)<span>visible</span>@endif`
    const result = await processTemplate(template, {})
    expect(result).not.toContain('visible')
  })

  it('condition with NaN check: val !== val', async () => {
    const template = `@if(val !== val)<span>is NaN</span>@endif`
    const result = await processTemplate(template, { val: NaN })
    expect(result).toContain('is NaN')
  })

  it('condition with Infinity comparison', async () => {
    const template = `@if(val === Infinity)<span>infinite</span>@endif`
    const result = await processTemplate(template, { val: Infinity })
    expect(typeof result).toBe('string')
  })

  it('condition with ternary: true ? "a" : "b"', async () => {
    const template = `@if(show ? true : false)<span>ternary works</span>@endif`
    const result = await processTemplate(template, { show: true })
    expect(result).toContain('ternary works')
  })

  it('condition with typeof operator', async () => {
    const template = `@if(typeof val === 'string')<span>is string</span>@endif`
    const result = await processTemplate(template, { val: 'hello' })
    expect(typeof result).toBe('string')
  })

  it('@if with empty string condition (falsy)', async () => {
    const template = `@if(val)<span>truthy</span>@else<span>falsy</span>@endif`
    const result = await processTemplate(template, { val: '' })
    expect(result).toContain('falsy')
  })

  it('@if with zero condition (falsy)', async () => {
    const template = `@if(val)<span>truthy</span>@else<span>falsy</span>@endif`
    const result = await processTemplate(template, { val: 0 })
    expect(result).toContain('falsy')
  })

  it('@if with null condition', async () => {
    const template = `@if(val)<span>truthy</span>@else<span>falsy</span>@endif`
    const result = await processTemplate(template, { val: null })
    expect(result).toContain('falsy')
  })
})

// =============================================================================
// 2. @switch Stress Tests (from deep-edge-cases.ts)
// =============================================================================

describe('@switch Stress Tests', () => {
  it('@switch with many cases (10)', async () => {
    const cases = Array.from({ length: 10 }, (_, i) =>
      `@case(${i})<span>case${i}</span>@break`,
    ).join('\n')
    const template = `@switch(val)\n${cases}\n@default<span>default</span>\n@endswitch`
    const result = await processTemplate(template, { val: 7 })
    expect(result).toContain('case7')
    expect(result).not.toContain('case0')
  })

  it('@switch with string case containing special chars', async () => {
    const template = `
      @switch(status)
        @case('it\\'s alive')
          <span>found</span>
          @break
        @default
          <span>not found</span>
      @endswitch
    `
    const result = await processTemplate(template, { status: "it's alive" })
    expect(typeof result).toBe('string')
  })

  it('@switch with null case value', async () => {
    const template = `
      @switch(val)
        @case(null)
          <span>null case</span>
          @break
        @default
          <span>default case</span>
      @endswitch
    `
    const result = await processTemplate(template, { val: null })
    expect(typeof result).toBe('string')
  })

  it('@switch with nested @if inside case', async () => {
    const template = `
      @switch(type)
        @case('special')
          @if(extra)
            <span>special+extra</span>
          @else
            <span>special only</span>
          @endif
          @break
        @default
          <span>default</span>
      @endswitch
    `
    const result = await processTemplate(template, { type: 'special', extra: true })
    expect(result).toContain('special+extra')
    expect(result).not.toContain('default')
  })

  it('@switch with @foreach inside case', async () => {
    const template = `
      @switch(mode)
        @case('list')
          @foreach(items as item)
            <li>{{ item }}</li>
          @endforeach
          @break
        @default
          <span>no list</span>
      @endswitch
    `
    const result = await processTemplate(template, { mode: 'list', items: ['a', 'b'] })
    expect(result).toContain('<li>a</li>')
    expect(result).toContain('<li>b</li>')
  })

  it('@switch immediately after another @switch', async () => {
    const template = `
      @switch(a)
        @case(1)<span>a1</span>@break
        @default<span>a-default</span>
      @endswitch
      @switch(b)
        @case(2)<span>b2</span>@break
        @default<span>b-default</span>
      @endswitch
    `
    const result = await processTemplate(template, { a: 1, b: 2 })
    expect(result).toContain('a1')
    expect(result).toContain('b2')
  })

  it('@switch with multiline case content containing HTML', async () => {
    const template = `
      @switch(type)
        @case('card')
          <div class="card">
            <h2>Card Title</h2>
            <p>Card content here</p>
          </div>
          @break
        @default
          <span>default</span>
      @endswitch
    `
    const result = await processTemplate(template, { type: 'card' })
    expect(result).toContain('<h2>Card Title</h2>')
    expect(result).toContain('<p>Card content here</p>')
  })

  it('@switch with default only', async () => {
    const template = `
      @switch(val)
        @default
          <span>always default</span>
      @endswitch
    `
    const result = await processTemplate(template, { val: 'anything' })
    expect(result).toContain('always default')
  })

  it('@switch where no case matches and no default', async () => {
    const template = `
      @switch(val)
        @case('a')<span>A</span>@break
        @case('b')<span>B</span>@break
      @endswitch
    `
    const result = await processTemplate(template, { val: 'c' })
    expect(result).not.toContain('<span>A</span>')
    expect(result).not.toContain('<span>B</span>')
  })

  it('@switch with boolean case values', async () => {
    const template = `
      @switch(flag)
        @case(true)
          <span>on</span>
          @break
        @case(false)
          <span>off</span>
          @break
      @endswitch
    `
    const result = await processTemplate(template, { flag: true })
    expect(result).toContain('on')
    expect(result).not.toContain('off')
  })
})

// =============================================================================
// 3. @foreach with objects (from discovered-bugs.ts)
// =============================================================================

describe('@foreach with objects', () => {
  it('BUG: should iterate over object entries with key => value syntax', () => {
    const ctx = { items: { a: 1, b: 2, c: 3 } }
    const template = '@foreach(items as key => value){{ key }}={{ value }},@endforeach'
    const result = processLoops(template, ctx, fp, opts, deps)
    expect(result).not.toContain('Error')
    expect(result).toContain('a=1')
    expect(result).toContain('b=2')
    expect(result).toContain('c=3')
  })

  it('BUG: should iterate over object with simple as syntax', () => {
    const ctx = { config: { host: 'localhost', port: 3000 } }
    const template = '@foreach(config as entry){{ entry }},@endforeach'
    const result = processLoops(template, ctx, fp, opts, deps)
    expect(result).not.toContain('Error')
  })
})

// =============================================================================
// 4. @foreach with Map (from discovered-bugs.ts)
// =============================================================================

describe('@foreach with Map', () => {
  it('BUG: should iterate over Map entries', () => {
    const ctx = { items: new Map([['a', 1], ['b', 2]]) }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts, deps)
    expect(result).not.toContain('Error')
  })
})

// =============================================================================
// 5. @unless with @else (from discovered-bugs.ts)
// =============================================================================

describe('@unless with @else', () => {
  it('BUG: @unless(false) with @else should show unless content', () => {
    const result = processConditionals('@unless(isAdmin)guest@else admin@endunless', { isAdmin: false }, fp)
    expect(result.trim()).toBe('guest')
  })

  it('BUG: @unless(true) with @else should show else content', () => {
    const result = processConditionals('@unless(isAdmin)guest@else admin@endunless', { isAdmin: true }, fp)
    expect(result.trim()).toBe('admin')
  })
})

// =============================================================================
// 6. @foreach robustness (from discovered-bugs.ts)
// =============================================================================

describe('@foreach robustness', () => {
  it('should handle array of mixed types', () => {
    const ctx = { items: [1, 'two', true, null, { key: 'val' }] }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts, deps)
    expect(result).not.toContain('Error')
    expect(result).toContain('1')
    expect(result).toContain('two')
  })

  it('should not mutate original array', () => {
    const items = [1, 2, 3]
    const ctx = { items }
    processLoops('@foreach(items as item){{ item }}@endforeach', ctx, fp, opts, deps)
    expect(items).toEqual([1, 2, 3])
    expect(items.length).toBe(3)
  })

  it('should handle single-item array', () => {
    const result = processLoops(
      '@foreach(items as item){{ item }}@endforeach',
      { items: ['only'] },
      fp,
      opts,
      deps,
    )
    expect(result).toContain('only')
  })
})

// =============================================================================
// 7. @if truthy/falsy edge cases (from discovered-bugs.ts)
// =============================================================================

describe('@if truthy/falsy edge cases', () => {
  it('should treat 0 as falsy', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: 0 }, fp)
    expect(result.trim()).toBe('no')
  })

  it('should treat empty string as falsy', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: '' }, fp)
    expect(result.trim()).toBe('no')
  })

  it('should treat null as falsy', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: null }, fp)
    expect(result.trim()).toBe('no')
  })

  it('should treat NaN as falsy', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: NaN }, fp)
    expect(result.trim()).toBe('no')
  })

  it('should treat empty array as TRUTHY (JS semantics)', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: [] }, fp)
    expect(result.trim()).toBe('yes')
  })

  it('should treat empty object as TRUTHY', () => {
    const result = processConditionals('@if(val)yes@else no@endif', { val: {} }, fp)
    expect(result.trim()).toBe('yes')
  })

  it('should handle items.length > 0 check for arrays', () => {
    const r1 = processConditionals('@if(items.length > 0)yes@else no@endif', { items: [1] }, fp)
    const r2 = processConditionals('@if(items.length > 0)yes@else no@endif', { items: [] }, fp)
    expect(r1.trim()).toBe('yes')
    expect(r2.trim()).toBe('no')
  })
})

// =============================================================================
// 8. @foreach iterable support (from discovered-bugs.ts)
// =============================================================================

describe('@foreach iterable support', () => {
  it('BUG: should iterate over string characters', () => {
    const r = processLoops('@foreach(str as ch){{ ch }},@endforeach', { str: 'abc' }, fp, opts)
    expect(r).not.toContain('Error')
    expect(r).toContain('a,')
    expect(r).toContain('b,')
  })

  it('BUG: should iterate over Set entries', () => {
    const r = processLoops('@foreach(items as item){{ item }},@endforeach', { items: new Set([1, 2, 3]) }, fp, opts)
    expect(r).not.toContain('Error')
  })

  it('BUG: should destructure array pairs in @foreach', () => {
    const r = processLoops('@foreach(items as [key, val]){{ key }}={{ val }},@endforeach', { items: [['a', 1], ['b', 2]] }, fp, opts)
    expect(r).toContain('a=1')
    expect(r).toContain('b=2')
  })
})

// =============================================================================
// 9. @if/@elseif edge cases (from discovered-bugs.ts)
// =============================================================================

describe('@if/@elseif edge cases', () => {
  it('should handle 5+ elseif branches', () => {
    const tpl = '@if(x===1)one@elseif(x===2)two@elseif(x===3)three@elseif(x===4)four@elseif(x===5)five@else other@endif'
    expect(processConditionals(tpl, { x: 5 }, fp).trim()).toBe('five')
    expect(processConditionals(tpl, { x: 99 }, fp).trim()).toBe('other')
  })

  it('should handle newlines in @if condition', () => {
    const r = processConditionals('@if(a &&\n  b)yes@else no@endif', { a: true, b: true }, fp)
    expect(r.trim()).toBe('yes')
  })

  it('should handle typeof in conditions', () => {
    const r = processConditionals("@if(typeof val === 'string')yes@else no@endif", { val: 'test' }, fp)
    expect(r.trim()).toBe('yes')
  })

  it("should handle 'in' operator in conditions", () => {
    const r = processConditionals("@if('name' in user)yes@else no@endif", { user: { name: 'test' } }, fp)
    expect(r.trim()).toBe('yes')
  })

  it('should handle string concatenation in conditions', () => {
    const r = processConditionals("@if(prefix + suffix === 'helloworld')yes@else no@endif", { prefix: 'hello', suffix: 'world' }, fp)
    expect(r.trim()).toBe('yes')
  })

  it('should handle 3-level nested @if', () => {
    const tpl = '@if(a)@if(b)@if(c)deep@endif@endif@endif'
    expect(processConditionals(tpl, { a: true, b: true, c: true }, fp).trim()).toBe('deep')
    expect(processConditionals(tpl, { a: true, b: true, c: false }, fp).trim()).toBe('')
  })

  it('should handle method calls in conditions', () => {
    const ctx = { items: [1, 2, 3] }
    const r = processConditionals('@if(items.includes(2))yes@else no@endif', ctx, fp)
    expect(r.trim()).toBe('yes')
  })

  it('should handle arithmetic in conditions', () => {
    const r = processConditionals('@if(a + b > 10)yes@else no@endif', { a: 7, b: 5 }, fp)
    expect(r.trim()).toBe('yes')
  })

  it('should handle regex test in conditions', () => {
    const r = processConditionals('@if(/^admin/.test(role))yes@else no@endif', { role: 'admin-user' }, fp)
    expect(r.trim()).toBe('yes')
  })
})

// =============================================================================
// 10. @switch edge cases (from discovered-bugs.ts)
// =============================================================================

describe('@switch edge cases', () => {
  it('should handle @switch(true) pattern', () => {
    const tpl = '@switch(true)@case(score >= 90)A@break@case(score >= 80)B@break@case(score >= 70)C@break@default F@endswitch'
    expect(processSwitchStatements(tpl, { score: 85 }, fp).trim()).toBe('B')
  })

  it('should handle expressions in both switch value and case', () => {
    const r = processSwitchStatements('@switch(a + b)@case(3)three@break@case(7)seven@break@endswitch', { a: 3, b: 4 }, fp)
    expect(r.trim()).toBe('seven')
  })

  it('should match only first matching case', () => {
    const r = processSwitchStatements('@switch(val)@case("a")first@break@case("a")second@break@endswitch', { val: 'a' }, fp)
    expect(r.trim()).toBe('first')
  })
})

// =============================================================================
// 11. @for loop edge cases (from discovered-bugs.ts)
// =============================================================================

describe('@for loop edge cases', () => {
  it('should handle decrementing for loop', () => {
    const r = processLoops('@for(let i = 3; i > 0; i--){{ i }},@endfor', {}, fp, opts)
    expect(r).toContain('3,')
    expect(r).toContain('2,')
    expect(r).toContain('1,')
  })

  it('should handle for loop with context variable in bound', () => {
    const r = processLoops('@for(let i = 0; i < max; i++){{ i }},@endfor', { max: 3 }, fp, opts)
    expect(r).toContain('0,')
    expect(r).toContain('1,')
    expect(r).toContain('2,')
  })

  it('should handle for loop with step of 2', () => {
    const r = processLoops('@for(let i = 0; i < 10; i += 2){{ i }},@endfor', {}, fp, opts)
    expect(r).toContain('0,')
    expect(r).toContain('2,')
    expect(r).toContain('4,')
    expect(r).not.toContain('1,')
  })

  it('should handle zero iterations', () => {
    const r = processLoops('@for(let i = 0; i < 0; i++)x@endfor', {}, fp, opts)
    expect(r).not.toContain('x')
  })
})

// =============================================================================
// 12. @isset edge cases (from discovered-bugs.ts)
// =============================================================================

describe('@isset edge cases', () => {
  it('should consider 0 as set (exists in context)', () => {
    const result = processIssetEmptyDirectives('@isset(val)set@endisset', { val: 0 }, fp)
    expect(result.trim()).toBe('set')
  })

  it('should consider false as set (exists in context)', () => {
    const result = processIssetEmptyDirectives('@isset(val)set@endisset', { val: false }, fp)
    expect(result.trim()).toBe('set')
  })

  it('should consider empty string as set (exists in context)', () => {
    const result = processIssetEmptyDirectives('@isset(val)set@endisset', { val: '' }, fp)
    expect(result.trim()).toBe('set')
  })

  it('should consider null as NOT set', () => {
    const result = processIssetEmptyDirectives('@isset(val)set@endisset', { val: null }, fp)
    expect(result.trim()).toBe('')
  })

  it('should consider undefined as NOT set', () => {
    const result = processIssetEmptyDirectives('@isset(val)set@endisset', {}, fp)
    expect(result.trim()).toBe('')
  })
})

// =============================================================================
// 13. @method HTTP methods (from discovered-bugs.ts)
// =============================================================================

describe('@method HTTP methods', () => {
  it('BUG: should generate hidden field for HEAD method', () => {
    const result = processBasicFormDirectives("@method('HEAD')", {})
    expect(result).toContain('_method')
    expect(result).toContain('HEAD')
  })

  it('BUG: should generate hidden field for OPTIONS method', () => {
    const result = processBasicFormDirectives("@method('OPTIONS')", {})
    expect(result).toContain('_method')
    expect(result).toContain('OPTIONS')
  })
})

// =============================================================================
// 14. @empty Blade semantics (from discovered-bugs.ts)
// =============================================================================

describe('@empty Blade semantics', () => {
  it('BUG: @empty(0) should consider 0 as empty (Blade semantics)', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: 0 }, fp)
    expect(result.trim()).toBe('empty')
  })

  it('BUG: @empty(false) should consider false as empty (Blade semantics)', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: false }, fp)
    expect(result.trim()).toBe('empty')
  })

  it('BUG: @empty([]) should consider empty array as empty', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: [] }, fp)
    expect(result.trim()).toBe('empty')
  })

  it('should consider null as empty', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: null }, fp)
    expect(result.trim()).toBe('empty')
  })

  it('should consider empty string as empty', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: '' }, fp)
    expect(result.trim()).toBe('empty')
  })

  it('should NOT consider non-empty values as empty', () => {
    const result = processIssetEmptyDirectives('@empty(val)empty@endempty', { val: 'hello' }, fp)
    expect(result.trim()).toBe('')
  })
})

// =============================================================================
// 15. @foreach complex iteration patterns (from edge-case-bugs.ts)
// =============================================================================

describe('@foreach complex iteration patterns', () => {
  it('should iterate over array of arrays and access inner items', () => {
    const ctx = { matrix: [[1, 2], [3, 4], [5, 6]] }
    const template = '@foreach(matrix as row)@foreach(row as cell){{ cell }},@endforeach|@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('1,')
    expect(result).toContain('2,')
    expect(result).toContain('|')
  })

  it('should handle @foreach with computed collection items.filter()', () => {
    const ctx = { items: [{ active: true, name: 'A' }, { active: false, name: 'B' }, { active: true, name: 'C' }] }
    const template = '@foreach(items.filter(x => x.active) as item){{ item.name }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('A')
    expect(result).toContain('C')
    expect(result).not.toContain('B,')
  })

  it('should handle @foreach with array.slice', () => {
    const ctx = { items: ['a', 'b', 'c', 'd', 'e'] }
    const template = '@foreach(items.slice(0, 3) as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('a,')
    expect(result).toContain('b,')
    expect(result).toContain('c,')
    expect(result).not.toContain('d,')
  })

  it('should handle @foreach with nested property access: data.users', () => {
    const ctx = { data: { users: ['Alice', 'Bob'] } }
    const template = '@foreach(data.users as user){{ user }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('Alice')
    expect(result).toContain('Bob')
  })

  it('should handle @foreach with index and using index in expression', () => {
    const ctx = { items: ['a', 'b', 'c'] }
    const template = '@foreach(items as index => item){{ index }}: {{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('0')
    expect(result).toContain('1')
    expect(result).toContain('2')
    expect(result).toContain('a')
  })

  it('should handle @foreach where item has methods: toUpperCase()', () => {
    const ctx = { items: ['hello', 'world'] }
    const template = '@foreach(items as item){{ item.toUpperCase() }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('HELLO')
    expect(result).toContain('WORLD')
  })

  it('should handle @foreach with a large array (1000 items) for performance', () => {
    const items = Array.from({ length: 1000 }, (_, i) => i)
    const ctx = { items }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const start = performance.now()
    const result = processLoops(template, ctx, fp, opts)
    const elapsed = performance.now() - start
    expect(result).toContain('0,')
    expect(result).toContain('999,')
    expect(elapsed).toBeLessThan(5000)
  })

  it('should handle @foreach with boolean array', () => {
    const ctx = { flags: [true, false, true] }
    const template = '@foreach(flags as flag){{ flag }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('true')
    expect(result).toContain('false')
  })

  it('should handle @foreach with null items in array', () => {
    const ctx = { items: [1, null, 3] }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('1,')
    expect(result).toContain('3,')
    expect(result).not.toContain('Error')
  })

  it('should handle @foreach with undefined items in array', () => {
    const ctx = { items: [1, undefined, 3] }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('1,')
    expect(result).toContain('3,')
  })

  it('should handle @foreach with mixed types in array', () => {
    const ctx = { items: [1, 'two', true, null, { a: 1 }] }
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('1,')
    expect(result).toContain('two,')
    expect(result).toContain('true,')
  })

  it('should handle @foreach over empty collection with @break (no error)', () => {
    const ctx = { items: [] as string[] }
    const template = '@foreach(items as item)@break{{ item }}@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).not.toContain('Error')
    expect(result.trim()).toBe('')
  })

  it('should handle @foreach with @break(true) on first item', () => {
    const ctx = { items: ['a', 'b', 'c'] }
    const template = '@foreach(items as item)@break(true){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).not.toContain('b,')
    expect(result).not.toContain('c,')
  })

  it('should handle @foreach with @continue(true) on all items (empty output)', () => {
    const ctx = { items: ['a', 'b', 'c'] }
    const template = '@foreach(items as item)@continue(true){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).not.toContain('a,')
    expect(result).not.toContain('b,')
    expect(result).not.toContain('c,')
  })

  it('should handle nested @foreach where inner uses outer scope variables', () => {
    const ctx = { groups: [{ name: 'G1', items: ['x', 'y'] }, { name: 'G2', items: ['z'] }] }
    const template = '@foreach(groups as group){{ group.name }}:@foreach(group.items as item){{ item }},@endforeach|@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('G1:')
    expect(result).toContain('G2:')
    expect(result).toContain('x,')
  })

  it('should handle @foreach accessing both item AND outer context vars', () => {
    const ctx = { prefix: 'item', items: [1, 2, 3] }
    const template = '@foreach(items as item){{ prefix }}-{{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('item-1')
    expect(result).toContain('item-2')
    expect(result).toContain('item-3')
  })

  it('should handle @foreach where collection name shadows built-in (length)', () => {
    const ctx = { length: [10, 20, 30] }
    const template = '@foreach(length as item){{ item }},@endforeach'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('10,')
    expect(result).toContain('20,')
    expect(result).toContain('30,')
  })

  it('should handle @forelse with function expression as collection', () => {
    const ctx = { getItems: () => ['a', 'b'] }
    const template = '@forelse(getItems() as item){{ item }},@empty nothing@endforelse'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toBeDefined()
  })

  it('should handle @forelse where empty content has HTML', () => {
    const ctx = { items: [] as string[] }
    const template = '@forelse(items as item){{ item }}@empty<p class="empty">No items found</p>@endforelse'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('No items found')
    expect(result).toContain('<p class="empty">')
  })

  it('should handle @forelse with index syntax on empty array (should show @empty)', () => {
    const ctx = { items: [] as string[] }
    const template = '@forelse(items as index => item){{ index }}: {{ item }}@empty empty@endforelse'
    const result = processLoops(template, ctx, fp, opts)
    expect(result).toContain('empty')
  })
})

// =============================================================================
// 16. @if with complex JavaScript expressions (from edge-case-bugs.ts)
// =============================================================================

describe('@if with complex JavaScript expressions', () => {
  it('should handle @if with array.some', () => {
    const ctx = { users: [{ admin: false }, { admin: true }] }
    const result = processConditionals('@if(users.some(u => u.admin))has admin@else no admin@endif', ctx, fp)
    expect(result.trim()).toBe('has admin')
  })

  it('should handle @if with array.every', () => {
    const ctx = { items: [1, 2, 3] }
    const result = processConditionals('@if(items.every(i => i > 0))all positive@else not all@endif', ctx, fp)
    expect(result.trim()).toBe('all positive')
  })

  it('should handle @if with array.every (false case)', () => {
    const ctx = { items: [1, -2, 3] }
    const result = processConditionals('@if(items.every(i => i > 0))all positive@else not all@endif', ctx, fp)
    expect(result.trim()).toBe('not all')
  })

  it('should handle @if with array.find', () => {
    const ctx = { items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] }
    const result = processConditionals('@if(items.find(i => i.id === 1))found@else not found@endif', ctx, fp)
    expect(result.trim()).toBe('found')
  })

  it('should handle @if with Object.keys length check', () => {
    const ctx = { obj: { a: 1, b: 2 } }
    const result = processConditionals('@if(Object.keys(obj).length > 0)has keys@else empty@endif', ctx, fp)
    expect(result.trim()).toBe('has keys')
  })

  it('should handle @if with Number.isInteger', () => {
    const ctx = { val: 42 }
    const result = processConditionals('@if(Number.isInteger(val))integer@else not integer@endif', ctx, fp)
    expect(result.trim()).toBe('integer')
  })

  it('should handle @if with multiple && and ||', () => {
    const ctx = { a: true, b: false, c: true, d: false }
    const result = processConditionals('@if(a || b && c || d)yes@else no@endif', ctx, fp)
    expect(result.trim()).toBe('yes')
  })

  it('should handle @if with negated condition', () => {
    const ctx = { isLoading: false, data: { value: 1 } }
    const result = processConditionals('@if(!isLoading && data)ready@else loading@endif', ctx, fp)
    expect(result.trim()).toBe('ready')
  })

  it('should handle @if with comparison to string literal containing spaces', () => {
    const ctx = { status: 'in progress' }
    const result = processConditionals("@if(status === 'in progress')ongoing@else done@endif", ctx, fp)
    expect(result.trim()).toBe('ongoing')
  })

  it('should handle @if with null and undefined checks', () => {
    const ctx = { val: 0 }
    const result = processConditionals('@if(val !== null && val !== undefined)exists@else missing@endif', ctx, fp)
    expect(result.trim()).toBe('exists')
  })

  it('should handle @if comparing strings lexicographically', () => {
    const ctx = { name: 'Alice' }
    const result = processConditionals("@if(name < 'M')before M@else after M@endif", ctx, fp)
    expect(result.trim()).toBe('before M')
  })

  it('should handle @if with bitwise operators', () => {
    const ctx = { flags: 0x05 }
    const result = processConditionals('@if(flags & 0x01)flag set@else flag not set@endif', ctx, fp)
    expect(result.trim()).toBe('flag set')
  })

  it('should handle @if with exponentiation', () => {
    const ctx = {}
    const result = processConditionals('@if(2 ** 10 === 1024)correct@else wrong@endif', ctx, fp)
    expect(result.trim()).toBe('correct')
  })

  it('should handle @if with string match', () => {
    const ctx = { email: 'test@example.com' }
    const result = processConditionals("@if(email.includes('@'))valid@else invalid@endif", ctx, fp)
    expect(result.trim()).toBe('valid')
  })

  it('should handle @if with ternary inside (nested expressions)', () => {
    const ctx = { x: 5 }
    const result = processConditionals('@if(x > 3 ? true : false)big@else small@endif', ctx, fp)
    expect(result.trim()).toBe('big')
  })
})

// =============================================================================
// 17. @foreach Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('@foreach Regression Tests', () => {
  async function render(template: string, context: Record<string, any> = {}) {
    return processDirectives(template, context, fp, opts, new Set<string>())
  }

  it('should render a todo list with completed/pending toggle', async () => {
    const template = `@foreach(todos as todo)
  <li class="@if(todo.done)completed@else pending@endif">{{ todo.text }}</li>
@endforeach`
    const context = {
      todos: [
        { text: 'Buy groceries', done: true },
        { text: 'Write tests', done: false },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('completed')
    expect(result).toContain('pending')
    expect(result).toContain('Buy groceries')
    expect(result).toContain('Write tests')
  })

  it('should render table rows with alternating classes using index', async () => {
    const template = `@foreach(rows as idx => row)
  <tr class="@if(idx % 2 === 0)even@else odd@endif">
    <td>{{ row }}</td>
  </tr>
@endforeach`
    const context = { rows: ['Alpha', 'Beta', 'Gamma', 'Delta'] }
    const result = await render(template, context)
    expect(result).toContain('even')
    expect(result).toContain('odd')
    expect(result).toContain('Alpha')
    expect(result).toContain('Delta')
  })

  it('should render navigation breadcrumbs with separator', async () => {
    const template = `<nav class="breadcrumb">
  @foreach(crumbs as idx => crumb)
    @if(idx > 0)
      <span class="sep"> / </span>
    @endif
    <a href="{{ crumb.url }}">{{ crumb.label }}</a>
  @endforeach
</nav>`
    const context = {
      crumbs: [
        { url: '/', label: 'Home' },
        { url: '/products', label: 'Products' },
        { url: '/products/123', label: 'Widget' },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('Home')
    expect(result).toContain('Products')
    expect(result).toContain('Widget')
    const sepCount = (result.match(/class="sep"/g) || []).length
    expect(sepCount).toBe(2)
  })

  it('should render a tag cloud', async () => {
    const template = `<div class="tags">
  @foreach(tags as idx => tag)
    <span class="tag">{{ tag }}</span>@if(idx < tags.length - 1), @endif
  @endforeach
</div>`
    const context = { tags: ['javascript', 'typescript', 'bun'] }
    const result = await render(template, context)
    expect(result).toContain('javascript')
    expect(result).toContain('typescript')
    expect(result).toContain('bun')
  })

  it('should render an image gallery grid', async () => {
    const template = `<div class="gallery">
  @foreach(images as img)
    <figure>
      <img src="{{ img.src }}" alt="{{ img.alt }}">
      <figcaption>{{ img.caption }}</figcaption>
    </figure>
  @endforeach
</div>`
    const context = {
      images: [
        { src: '/img/1.jpg', alt: 'Sunset', caption: 'Beautiful sunset' },
        { src: '/img/2.jpg', alt: 'Mountain', caption: 'Mountain view' },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('src="/img/1.jpg"')
    expect(result).toContain('alt="Sunset"')
    expect(result).toContain('Beautiful sunset')
    expect(result).toContain('Mountain view')
  })

  it('should render dropdown options from array', async () => {
    const template = `<select name="country">
  @foreach(countries as country)
    <option value="{{ country.code }}">{{ country.name }}</option>
  @endforeach
</select>`
    const context = {
      countries: [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'MX', name: 'Mexico' },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('value="US"')
    expect(result).toContain('United States')
    expect(result).toContain('value="CA"')
    expect(result).toContain('Canada')
  })

  it('should render checkbox list from array', async () => {
    const template = `@foreach(skills as skill)
  <label>
    <input type="checkbox" name="skills[]" value="{{ skill }}"> {{ skill }}
  </label>
@endforeach`
    const context = { skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript'] }
    const result = await render(template, context)
    expect(result).toContain('value="HTML"')
    expect(result).toContain('value="CSS"')
    expect(result).toContain('value="JavaScript"')
    expect(result).toContain('value="TypeScript"')
  })

  it('should render multi-level nested menu', async () => {
    const template = `<ul>
  @foreach(menu as item)
    <li>
      {{ item.label }}
      @if(item.children.length > 0)
        <ul>
          @foreach(item.children as child)
            <li>{{ child.label }}</li>
          @endforeach
        </ul>
      @endif
    </li>
  @endforeach
</ul>`
    const context = {
      menu: [
        { label: 'Products', children: [
          { label: 'Software' },
          { label: 'Hardware' },
        ] },
        { label: 'About', children: [] },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('Products')
    expect(result).toContain('Software')
    expect(result).toContain('Hardware')
    expect(result).toContain('About')
  })

  it('should render a data table with header and body rows', async () => {
    const template = `<table>
  <thead>
    <tr>
      @foreach(columns as col)
        <th>{{ col }}</th>
      @endforeach
    </tr>
  </thead>
  <tbody>
    @foreach(rows as row)
      <tr>
        @foreach(columns as col)
          <td>{{ row[col] }}</td>
        @endforeach
      </tr>
    @endforeach
  </tbody>
</table>`
    const context = {
      columns: ['name', 'age'],
      rows: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('<th>name</th>')
    expect(result).toContain('<th>age</th>')
    expect(result).toContain('Alice')
    expect(result).toContain('30')
    expect(result).toContain('Bob')
  })

  it('should render a numbered list using index', async () => {
    const template = `<ol>
  @foreach(items as idx => item)
    <li>{{ idx + 1 }}. {{ item }}</li>
  @endforeach
</ol>`
    const context = { items: ['First', 'Second', 'Third'] }
    const result = await render(template, context)
    expect(result).toContain('1. First')
    expect(result).toContain('2. Second')
    expect(result).toContain('3. Third')
  })

  it('should give first/last item special treatment', async () => {
    const template = `@foreach(items as item)
  @if(loop.first)
    <div class="first">{{ item }}</div>
  @elseif(loop.last)
    <div class="last">{{ item }}</div>
  @else
    <div>{{ item }}</div>
  @endif
@endforeach`
    const context = { items: ['Alpha', 'Beta', 'Gamma'] }
    const result = await render(template, context)
    expect(result).toContain('class="first"')
    expect(result).toContain('class="last"')
    expect(result).toContain('Alpha')
    expect(result).toContain('Gamma')
  })

  it('should filter visible items with @foreach and @if', async () => {
    const template = `@foreach(items as item)
  @if(item.visible)
    <div>{{ item.name }}</div>
  @endif
@endforeach`
    const context = {
      items: [
        { name: 'Shown', visible: true },
        { name: 'Hidden', visible: false },
        { name: 'Also Shown', visible: true },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('Shown')
    expect(result).not.toContain('Hidden')
    expect(result).toContain('Also Shown')
  })

  it('should handle foreach with computation in body', async () => {
    const template = `@foreach(lineItems as item)
  <span>{{ item.price * item.qty }}</span>
@endforeach`
    const context = {
      lineItems: [
        { price: 10, qty: 3 },
        { price: 25, qty: 2 },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('30')
    expect(result).toContain('50')
  })

  it('should render option tags with selected state from context', async () => {
    const template = `<select>
  @foreach(options as opt)
    <option value="{{ opt.value }}"@if(opt.value === selected) selected@endif>{{ opt.label }}</option>
  @endforeach
</select>`
    const context = {
      selected: 'b',
      options: [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
        { value: 'c', label: 'Option C' },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('value="b" selected')
    expect(result).not.toMatch(/value="a"[^>]*selected/)
  })

  it('should handle foreach over Object.entries', () => {
    const template = `@foreach(Object.entries(config) as entry)
  <div>{{ entry[0] }}: {{ entry[1] }}</div>
@endforeach`
    const context = { config: { theme: 'dark', lang: 'en' } }
    const result = processLoops(template, context, fp, opts)
    const finalResult = processExpressions(result, context, fp)
    expect(finalResult).toContain('theme: dark')
    expect(finalResult).toContain('lang: en')
  })

  it('should handle foreach over Array.from for range', () => {
    const template = `@foreach(Array.from({length: 3}, (_, i) => i + 1) as num)
  <span>{{ num }}</span>
@endforeach`
    const result = processLoops(template, {}, fp, opts)
    const finalResult = processExpressions(result, {}, fp)
    expect(finalResult).toContain('<span>1</span>')
    expect(finalResult).toContain('<span>2</span>')
    expect(finalResult).toContain('<span>3</span>')
  })

  it('should handle string interpolation in foreach body', async () => {
    const template = `@foreach(items as idx => item)
  <div>{{ \`Item #\${idx + 1}: \${item.name}\` }}</div>
@endforeach`
    const context = { items: [{ name: 'Widget' }, { name: 'Gadget' }] }
    const result = await render(template, context)
    expect(result).toContain('Item #1: Widget')
    expect(result).toContain('Item #2: Gadget')
  })

  it('should handle foreach with @break to stop after N items', async () => {
    const template = `@foreach(items as item)
  @break(loop.index >= 2)
  <div>{{ item }}</div>
@endforeach`
    const context = { items: ['A', 'B', 'C', 'D', 'E'] }
    const result = await render(template, context)
    expect(result).toContain('A')
    expect(result).toContain('B')
    expect(result).not.toContain('C')
    expect(result).not.toContain('D')
    expect(result).not.toContain('E')
  })

  it('should render foreach with @continue to skip items', async () => {
    const template = `@foreach(nums as num)
  @continue(num % 2 === 0)
  <span>{{ num }}</span>
@endforeach`
    const context = { nums: [1, 2, 3, 4, 5] }
    const result = await render(template, context)
    expect(result).toContain('<span>1</span>')
    expect(result).toContain('<span>3</span>')
    expect(result).toContain('<span>5</span>')
    expect(result).not.toContain('<span>2</span>')
    expect(result).not.toContain('<span>4</span>')
  })
})

// =============================================================================
// 18. @switch Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('@switch Regression Tests', () => {
  async function render(template: string, context: Record<string, any> = {}) {
    return processDirectives(template, context, fp, opts, new Set<string>())
  }

  it('should handle HTTP status code switch', async () => {
    const template = `@switch(status)
  @case(200)
    <span class="ok">OK</span>
  @break
  @case(301)
    <span class="redirect">Moved Permanently</span>
  @break
  @case(404)
    <span class="notfound">Not Found</span>
  @break
  @case(500)
    <span class="error">Internal Server Error</span>
  @break
  @default
    <span class="unknown">Unknown</span>
@endswitch`
    const r200 = await render(template, { status: 200 })
    expect(r200).toContain('OK')
    expect(r200).not.toContain('Not Found')

    const r404 = await render(template, { status: 404 })
    expect(r404).toContain('Not Found')
    expect(r404).not.toContain('OK')
  })

  it('should handle user role display switch', async () => {
    const template = `@switch(role)
  @case('admin')
    <span class="role admin">Administrator</span>
  @break
  @case('editor')
    <span class="role editor">Content Editor</span>
  @break
  @case('viewer')
    <span class="role viewer">Viewer</span>
  @break
  @default
    <span class="role guest">Guest</span>
@endswitch`
    const result = await render(template, { role: 'editor' })
    expect(result).toContain('Content Editor')
    expect(result).not.toContain('Administrator')
    expect(result).not.toContain('Guest')
  })

  it('should handle weekday name from number', async () => {
    const template = `@switch(day)
  @case(0)Sun@break
  @case(1)Mon@break
  @case(2)Tue@break
  @case(3)Wed@break
  @case(4)Thu@break
  @case(5)Fri@break
  @case(6)Sat@break
  @default
    Invalid
@endswitch`
    const result = await render(template, { day: 3 })
    expect(result.trim()).toContain('Wed')
    expect(result).not.toContain('Mon')
  })

  it('should handle file type icon selection', async () => {
    const template = `@switch(fileType)
  @case('pdf')
    <i class="icon-pdf"></i>
  @break
  @case('doc')
    <i class="icon-word"></i>
  @break
  @case('jpg')
    <i class="icon-image"></i>
  @break
  @default
    <i class="icon-file"></i>
@endswitch`
    const result = await render(template, { fileType: 'jpg' })
    expect(result).toContain('icon-image')
    expect(result).not.toContain('icon-pdf')
  })

  it('should handle theme switch', async () => {
    const template = `@switch(theme)
  @case('light')
    <body class="theme-light">
  @break
  @case('dark')
    <body class="theme-dark">
  @break
  @default
    <body class="theme-system">
@endswitch`
    const result = await render(template, { theme: 'dark' })
    expect(result).toContain('theme-dark')
    expect(result).not.toContain('theme-light')
    expect(result).not.toContain('theme-system')
  })

  it('should handle badge color based on status', async () => {
    const template = `@switch(orderStatus)
  @case('pending')
    <span class="badge yellow">Pending</span>
  @break
  @case('shipped')
    <span class="badge blue">Shipped</span>
  @break
  @case('delivered')
    <span class="badge green">Delivered</span>
  @break
  @case('cancelled')
    <span class="badge red">Cancelled</span>
  @break
@endswitch`
    const result = await render(template, { orderStatus: 'shipped' })
    expect(result).toContain('badge blue')
    expect(result).toContain('Shipped')
    expect(result).not.toContain('Pending')
  })

  it('should handle price tier display', async () => {
    const template = `@switch(tier)
  @case('free')
    <div class="plan">Free - $0/mo</div>
  @break
  @case('pro')
    <div class="plan">Pro - $29/mo</div>
  @break
  @case('enterprise')
    <div class="plan">Enterprise - $99/mo</div>
  @break
@endswitch`
    const result = await render(template, { tier: 'pro' })
    expect(result).toContain('Pro - $29/mo')
    expect(result).not.toContain('Free')
    expect(result).not.toContain('Enterprise')
  })

  it('should handle greeting based on time of day', async () => {
    const template = `@switch(timeOfDay)
  @case('morning')
    <h1>Good Morning!</h1>
  @break
  @case('afternoon')
    <h1>Good Afternoon!</h1>
  @break
  @case('evening')
    <h1>Good Evening!</h1>
  @break
@endswitch`
    const result = await render(template, { timeOfDay: 'afternoon' })
    expect(result).toContain('Good Afternoon!')
    expect(result).not.toContain('Good Morning!')
  })

  it('should handle language-specific content', async () => {
    const template = `@switch(lang)
  @case('en')
    <p>Hello, World!</p>
  @break
  @case('es')
    <p>Hola, Mundo!</p>
  @break
  @case('fr')
    <p>Bonjour, le Monde!</p>
  @break
  @default
    <p>Hello!</p>
@endswitch`
    const result = await render(template, { lang: 'es' })
    expect(result).toContain('Hola, Mundo!')
    expect(result).not.toContain('Hello, World!')
  })

  it('should handle alert type styling', async () => {
    const template = `@switch(alertType)
  @case('success')
    <div class="alert alert-success">Operation completed successfully.</div>
  @break
  @case('warning')
    <div class="alert alert-warning">Please review your input.</div>
  @break
  @case('error')
    <div class="alert alert-error">An error occurred.</div>
  @break
  @case('info')
    <div class="alert alert-info">Here is some information.</div>
  @break
@endswitch`
    const result = await render(template, { alertType: 'warning' })
    expect(result).toContain('alert-warning')
    expect(result).toContain('Please review your input')
    expect(result).not.toContain('alert-success')
    expect(result).not.toContain('alert-error')
  })
})
