/**
 * Process pipeline edge case tests - redistributed from bugs/ directory.
 *
 * Covers: Process Pipeline Stress Tests and Process Directive Miscellaneous
 * from deep-edge-cases.ts.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processBasicFormDirectives } from '../../src/forms'
import { processForms } from '../../src/forms'
import { processDirectives } from '../../src/process'

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
  const deps = new Set<string>()
  return processDirectives(template, context, filePath, options, deps)
}

// =============================================================================
// 1. Process Pipeline Stress Tests (from deep-edge-cases.ts)
// =============================================================================

describe('Process Pipeline Stress Tests', () => {
  it('template with 100 {{ }} expressions', async () => {
    const exprs = Array.from({ length: 100 }, (_, i) => `{{ val_${i} }}`).join(' ')
    const context: Record<string, any> = {}
    for (let i = 0; i < 100; i++) context[`val_${i}`] = `v${i}`
    const result = await processTemplate(exprs, context)
    for (let i = 0; i < 100; i++) {
      expect(result).toContain(`v${i}`)
    }
  })

  it('template with 50 sequential @if blocks', async () => {
    const blocks = Array.from({ length: 50 }, (_, i) =>
      `@if(show_${i})<span>${i}</span>@endif`,
    ).join('\n')
    const context: Record<string, any> = {}
    for (let i = 0; i < 50; i++) context[`show_${i}`] = i % 2 === 0
    const result = await processTemplate(blocks, context)
    for (let i = 0; i < 50; i++) {
      if (i % 2 === 0) {
        expect(result).toContain(`<span>${i}</span>`)
      }
      else {
        expect(result).not.toContain(`<span>${i}</span>`)
      }
    }
  })

  it('template mixing conditionals, expressions, and forms', async () => {
    const template = `
      @if(show)
        <h1>{{ title }}</h1>
        @csrf
      @endif
    `
    const result = await processTemplate(template, { show: true, title: 'Test' })
    expect(result).toContain('Test')
    expect(result).toContain('_token')
  })

  it('template with @foreach of 500 items', async () => {
    const template = `@foreach(items as item){{ item }},@endforeach`
    const items = Array.from({ length: 500 }, (_, i) => `i${i}`)
    const result = await processTemplate(template, { items })
    expect(result).toContain('i0')
    expect(result).toContain('i499')
  })

  it('deeply nested structures: @if > @foreach > @if > expression', async () => {
    const template = `
      @if(show)
        @foreach(items as item)
          @if(item.visible)
            {{ item.name }}
          @endif
        @endforeach
      @endif
    `
    const items = [
      { name: 'visible-item', visible: true },
      { name: 'hidden-item', visible: false },
    ]
    const result = await processTemplate(template, { show: true, items })
    expect(result).toContain('visible-item')
    expect(result).not.toContain('hidden-item')
  })

  it('@foreach where each item has a @switch', async () => {
    const template = `
      @foreach(items as item)
        @switch(item.type)
          @case('a')
            <span>Type A: {{ item.name }}</span>
            @break
          @case('b')
            <span>Type B: {{ item.name }}</span>
            @break
          @default
            <span>Other: {{ item.name }}</span>
        @endswitch
      @endforeach
    `
    const items = [
      { type: 'a', name: 'Alpha' },
      { type: 'b', name: 'Beta' },
      { type: 'c', name: 'Gamma' },
    ]
    const result = await processTemplate(template, { items })
    expect(result).toContain('Type A: Alpha')
    expect(result).toContain('Type B: Beta')
    expect(result).toContain('Other: Gamma')
  })

  it('@csrf inside @foreach produces tokens', async () => {
    const template = `@foreach(items as item)<form>@csrf</form>@endforeach`
    const result = await processTemplate(template, { items: [1, 2, 3] })
    const tokenMatches = result.match(/_token/g)
    expect(tokenMatches).not.toBeNull()
    expect(tokenMatches!.length).toBe(3)
  })

  it('template with HTML comments interspersed between directives', async () => {
    const template = `
      <!-- comment before -->
      @if(show)
        <!-- comment inside -->
        <div>visible</div>
      @endif
      <!-- comment after -->
    `
    const result = await processTemplate(template, { show: true })
    expect(result).toContain('visible')
  })

  it('template with @push/@prepend and @stack', async () => {
    const template = `
      @push('scripts')
        <script>console.log('pushed')</script>
      @endpush
      @prepend('scripts')
        <script>console.log('prepended')</script>
      @endprepend
      <div>@stack('scripts')</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('prepended')
    expect(result).toContain('pushed')
  })

  it('template with multiline @if conditions', async () => {
    const template = `
      @if(
        items.length > 0
      )
        <span>has items</span>
      @endif
    `
    const result = await processTemplate(template, { items: [1, 2] })
    expect(result).toContain('has items')
  })

  it('template with raw HTML that looks like directives but is inside strings', async () => {
    const template = `<div>{{ text }}</div>`
    const result = await processTemplate(template, { text: '@if(true)fake@endif' })
    expect(result).toContain('@if(true)fake@endif')
  })

  it('template where same variable is used in multiple scopes', async () => {
    const template = `
      @foreach(items as item)
        {{ item }}
      @endforeach
      @foreach(items as item)
        {{ item }}
      @endforeach
    `
    const result = await processTemplate(template, { items: ['A', 'B'] })
    const countA = (result.match(/A/g) || []).length
    expect(countA).toBeGreaterThanOrEqual(2)
  })

  it('template with @break inside nested @if inside @foreach', async () => {
    const template = `
      @foreach(items as item)
        @if(item === 'stop')
          @break
        @endif
        <span>{{ item }}</span>
      @endforeach
    `
    const result = await processTemplate(template, { items: ['a', 'b', 'stop', 'c'] })
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).not.toContain('<span>stop</span>')
  })

  it('template with @continue inside nested @if inside @foreach', async () => {
    const template = `
      @foreach(items as item)
        @if(item === 'skip')
          @continue
        @endif
        <span>{{ item }}</span>
      @endforeach
    `
    const result = await processTemplate(template, { items: ['a', 'skip', 'c'] })
    expect(result).toContain('<span>a</span>')
    expect(result).toContain('<span>c</span>')
    expect(result).not.toContain('<span>skip</span>')
  })

  it('template with expressions containing pipe chars in strings', async () => {
    const result = await processTemplate(`{{ text }}`, { text: 'a|b' })
    expect(result).toContain('a|b')
  })

  it('template with HTML attributes containing {{ }}', async () => {
    const template = `<input value="{{ val }}">`
    const result = await processTemplate(template, { val: 'hello' })
    expect(result).toContain('value="hello"')
  })

  it('template with @error for field with errors', async () => {
    const template = `
      @error('email')
        <span>{{ $message }}</span>
      @enderror
    `
    const result = processForms(template, {
      errors: { email: 'Email is required' },
    }, 'test.stx', defaultOptions)
    expect(result).toContain('Email is required')
  })

  it('template with @seo at top and expressions in body', async () => {
    const template = `
      @seo({
        title: 'Test Page',
        description: 'A test page'
      })
      <div>{{ content }}</div>
    `
    const result = await processTemplate(template, { content: 'Hello World' })
    expect(result).toContain('Test Page')
    expect(result).toContain('Hello World')
  })

  it('template processes 1000-item @foreach in reasonable time', async () => {
    const template = `@foreach(items as item){{ item }}@endforeach`
    const items = Array.from({ length: 1000 }, (_, i) => `x${i}`)
    const start = performance.now()
    const result = await processTemplate(template, { items })
    const elapsed = performance.now() - start
    expect(result).toContain('x999')
    expect(elapsed).toBeLessThan(5000)
  })

  it('escaped @@ directives: @@ produces literal @', async () => {
    const template = `
      @if(true)
        <span>real</span>
      @endif
      <p>contact: user@@example.com</p>
    `
    const result = await processTemplate(template)
    expect(result).toContain('real')
    expect(result).toContain('user@')
  })

  it('template with @for loop counting backwards', async () => {
    const template = `@for(let i = 5; i > 0; i--)<span>{{ i }}</span>@endfor`
    const result = await processTemplate(template)
    expect(result).toContain('<span>5</span>')
    expect(result).toContain('<span>1</span>')
  })

  it('template with @while loop', async () => {
    const template = `
      @while(counter > 0)
        <span>{{ counter }}</span>
      @endwhile
    `
    const result = await processTemplate(template, { counter: 3 })
    expect(typeof result).toBe('string')
  })

  it('template with multiple @form blocks on same page', async () => {
    const template = `
      @form('POST', '/login')
      @endform
      @form('POST', '/register')
      @endform
    `
    const result = processForms(template, {}, 'test.stx', defaultOptions)
    const formMatches = result.match(/<form/g)
    expect(formMatches).not.toBeNull()
    expect(formMatches!.length).toBe(2)
  })
})

// =============================================================================
// 2. Process Directive Miscellaneous (from deep-edge-cases.ts)
// =============================================================================

describe('Process Directive Miscellaneous', () => {
  it('@method directive for PUT', async () => {
    const template = `@method('PUT')`
    const result = processBasicFormDirectives(template, {})
    expect(result).toContain('_method')
    expect(result).toContain('PUT')
  })

  it('@method directive for DELETE', async () => {
    const template = `@method('DELETE')`
    const result = processBasicFormDirectives(template, {})
    expect(result).toContain('_method')
    expect(result).toContain('DELETE')
  })

  it('@method directive for PATCH', async () => {
    const template = `@method('PATCH')`
    const result = processBasicFormDirectives(template, {})
    expect(result).toContain('_method')
    expect(result).toContain('PATCH')
  })

  it('@csrf generates a token input', async () => {
    const template = `@csrf`
    const result = processBasicFormDirectives(template, {})
    expect(result).toContain('_token')
    expect(result).toContain('type="hidden"')
  })

  it('@csrf uses existing token from context', async () => {
    const template = `@csrf`
    const result = processBasicFormDirectives(template, {
      csrf: { token: 'my-custom-token-123' },
    })
    expect(result).toContain('my-custom-token-123')
  })

  it('empty template returns empty string', async () => {
    const result = await processTemplate('')
    expect(result.trim()).toBe('')
  })

  it('template with only whitespace', async () => {
    const result = await processTemplate('   \n\t  ')
    expect(result.trim()).toBe('')
  })

  it('template with only HTML no directives', async () => {
    const result = await processTemplate('<div>Hello World</div>')
    expect(result).toContain('<div>Hello World</div>')
  })

  it('@unless directive (negation of @if)', async () => {
    const template = `@unless(hidden)<span>visible</span>@endunless`
    const result = await processTemplate(template, { hidden: false })
    expect(result).toContain('visible')
  })

  it('@unless directive with truthy hides content', async () => {
    const template = `@unless(hidden)<span>visible</span>@endunless`
    const result = await processTemplate(template, { hidden: true })
    expect(result).not.toContain('visible')
  })

  it('@isset directive', async () => {
    const template = `@isset(name)<span>{{ name }}</span>@endisset`
    const result = await processTemplate(template, { name: 'Test' })
    expect(result).toContain('Test')
  })

  it('@isset with undefined variable hides content', async () => {
    const template = `@isset(name)<span>{{ name }}</span>@endisset`
    const result = await processTemplate(template, {})
    expect(result).not.toContain('<span>')
  })

  it('@empty directive', async () => {
    const template = `@empty(items)<span>No items</span>@endempty`
    const result = await processTemplate(template, { items: [] })
    expect(result).toContain('No items')
  })

  it('@empty with non-empty array hides content', async () => {
    const template = `@empty(items)<span>No items</span>@endempty`
    const result = await processTemplate(template, { items: [1, 2, 3] })
    expect(result).not.toContain('No items')
  })

  it('@forelse with empty array shows empty block', async () => {
    const template = `
      @forelse(items as item)
        <li>{{ item }}</li>
      @empty
        <li>No items</li>
      @endforelse
    `
    const result = await processTemplate(template, { items: [] })
    expect(result).toContain('No items')
  })

  it('@forelse with items shows items', async () => {
    const template = `
      @forelse(items as item)
        <li>{{ item }}</li>
      @empty
        <li>No items</li>
      @endforelse
    `
    const result = await processTemplate(template, { items: ['A', 'B'] })
    expect(result).toContain('<li>A</li>')
    expect(result).toContain('<li>B</li>')
    expect(result).not.toContain('No items')
  })

  it('@foreach with index variable', async () => {
    const template = `@foreach(items as index => item)<span>{{ index }}:{{ item }}</span>@endforeach`
    const result = await processTemplate(template, { items: ['a', 'b', 'c'] })
    expect(result).toContain('0:a')
    expect(result).toContain('1:b')
    expect(result).toContain('2:c')
  })

  it('@if with @elseif and @else', async () => {
    const template = `
      @if(val === 'a')
        <span>A</span>
      @elseif(val === 'b')
        <span>B</span>
      @else
        <span>other</span>
      @endif
    `
    const resultA = await processTemplate(template, { val: 'a' })
    expect(resultA).toContain('<span>A</span>')
    expect(resultA).not.toContain('<span>B</span>')

    const resultB = await processTemplate(template, { val: 'b' })
    expect(resultB).toContain('<span>B</span>')

    const resultC = await processTemplate(template, { val: 'c' })
    expect(resultC).toContain('<span>other</span>')
  })
})

// =============================================================================
// Server-script stripping vs tag-like text inside the body (regression)
// =============================================================================

describe('server script stripping with tag-like text in body', () => {
  it('does not corrupt the document when a comment mentions <script server>', async () => {
    const template = `<script server>
// Fallback page meta. Every page overrides these from its own <script server>
const title = 'T'
</script>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{ title }}</title>
</head>
<body>
  <main>hello</main>
</body>
</html>
`
    const out = await processTemplate(template, { title: 'T' })
    expect(out).toContain('<!DOCTYPE html>')
    expect(out).toContain('<meta charset="utf-8">')
    expect(out).toContain('<main>hello</main>')
    // document starts at the doctype (no sliced prefix), exactly one head
    expect(out.trimStart().startsWith('<!DOCTYPE')).toBe(true)
    expect((out.match(/<head>/g) || []).length).toBe(1)
  })

  it('strips multiple sibling server scripts cleanly', async () => {
    const template = `<script server>
const a = 1 // <script server> lookalike one
</script>
<script server>
const b = 2
</script>
<p>{{ a }}-{{ b }}</p>
`
    const out = await processTemplate(template, { a: 1, b: 2 })
    expect(out).toContain('<p>1-2</p>')
    expect(out).not.toContain('script server')
  })
})
