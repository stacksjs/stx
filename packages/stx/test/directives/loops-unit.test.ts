import { describe, expect, it } from 'bun:test'
import { processLoops } from '../../src/loops'
import type { StxOptions } from '../../src/types'
import { processDirectives } from '../../src/process'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultOptions,
): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('processLoops - Unit Tests', () => {
  describe('@break directive', () => {
    it('should process @break(condition) in foreach loops', () => {
      const template = `@foreach (items as item)
@break(item > 3)
<li>{{ item }}</li>
@endforeach`
      const context = { items: [1, 2, 3, 4, 5] }
      const result = processLoops(template, context, 'test.stx')

      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>2</li>')
      expect(result).toContain('<li>3</li>')
      expect(result).not.toContain('<li>4</li>')
      expect(result).not.toContain('<li>5</li>')
    })

    it('should process unconditional @break in foreach loops', () => {
      const template = `@foreach (items as item)
@if (item === 3)
@break
@endif
<li>{{ item }}</li>
@endforeach`
      const context = { items: [1, 2, 3, 4, 5] }
      const result = processLoops(template, context, 'test.stx')

      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>2</li>')
      expect(result).not.toContain('<li>3</li>')
      expect(result).not.toContain('<li>4</li>')
      expect(result).not.toContain('<li>5</li>')
    })
  })

  describe('@continue directive', () => {
    it('should process @continue(condition) in foreach loops', () => {
      const template = `@foreach (items as item)
@continue(item % 2 === 0)
<li>{{ item }}</li>
@endforeach`
      const context = { items: [1, 2, 3, 4, 5] }
      const result = processLoops(template, context, 'test.stx')

      // Should only include odd numbers
      expect(result).toContain('<li>1</li>')
      expect(result).not.toContain('<li>2</li>')
      expect(result).toContain('<li>3</li>')
      expect(result).not.toContain('<li>4</li>')
      expect(result).toContain('<li>5</li>')
    })

    it('should process unconditional @continue in foreach loops', () => {
      const template = `@foreach (items as item)
@if (item === 3)
@continue
@endif
<li>{{ item }}</li>
@endforeach`
      const context = { items: [1, 2, 3, 4, 5] }
      const result = processLoops(template, context, 'test.stx')

      // Should include all except 3
      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>2</li>')
      expect(result).not.toContain('<li>3</li>')
      expect(result).toContain('<li>4</li>')
      expect(result).toContain('<li>5</li>')
    })
  })

  describe('@for loop with break/continue', () => {
    it('should process @break(condition) in for loops', () => {
      const template = `@for (let i = 1; i <= 10; i++)
@break(i > 5)
<li>{{ i }}</li>
@endfor`
      const context = {}
      const result = processLoops(template, context, 'test.stx')

      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>5</li>')
      expect(result).not.toContain('<li>6</li>')
      expect(result).not.toContain('<li>10</li>')
    })

    it('should process @continue(condition) in for loops', () => {
      const template = `@for (let i = 1; i <= 5; i++)
@continue(i === 3)
<li>{{ i }}</li>
@endfor`
      const context = {}
      const result = processLoops(template, context, 'test.stx')

      expect(result).toContain('<li>1</li>')
      expect(result).toContain('<li>2</li>')
      expect(result).not.toContain('<li>3</li>')
      expect(result).toContain('<li>4</li>')
      expect(result).toContain('<li>5</li>')
    })
  })

  describe('@while loop with break/continue', () => {
    it('should process @break in while loops', () => {
      const template = `@while (true)
@break(true)
<li>Should not appear</li>
@endwhile`
      const context = {}
      const result = processLoops(template, context, 'test.stx')

      expect(result).not.toContain('Should not appear')
    })
  })

  describe('@for template literal injection prevention', () => {
    it('should escape ${ in loop body to prevent template literal injection', async () => {
      const template = '@for(let i = 0; i < 2; i++)\n<div>${"safe"}</div>\n@endfor'
      const result = await processTemplate(template)
      expect(result).toContain('${"safe"}')
    })

    it('should still allow normal {{ }} expressions in loop body', async () => {
      const template = '@for(let i = 0; i < 3; i++)\n<span>{{ i }}</span>\n@endfor'
      const result = await processTemplate(template)
      expect(result).toContain('<span>0</span>')
      expect(result).toContain('<span>1</span>')
      expect(result).toContain('<span>2</span>')
    })

    it('should escape backticks in loop body', async () => {
      const template = '@for(let i = 0; i < 1; i++)\n<div>`hello`</div>\n@endfor'
      const result = await processTemplate(template)
      expect(result).toContain('`hello`')
    })
  })

  describe('@while template literal injection prevention', () => {
    it('should escape ${ in while body', async () => {
      const template = '@while(whileCount < 1)\n<div>${"safe"}</div>\n@endwhile'
      const result = await processTemplate(template, { whileCount: 0 })
      expect(result).toContain('${"safe"}')
    })

    it('should still allow normal {{ }} expressions in while body', async () => {
      const template = '@while(whileCount < 2)\n<span>{{ whileCount }}</span>\n@endwhile'
      const result = await processTemplate(template, { whileCount: 0 })
      expect(result).toContain('<span>')
    })
  })

  describe('@for does not match @foreach', () => {
    it('should process @for and @foreach independently', async () => {
      const template = `@for(let i = 0; i < 2; i++)
<div>for-{{ i }}</div>
@endfor
@foreach(items as item)
<span>each-{{ item }}</span>
@endforeach`
      const result = await processTemplate(template, { items: ['a', 'b'] })
      expect(result).toContain('for-0')
      expect(result).toContain('for-1')
      expect(result).toContain('each-a')
      expect(result).toContain('each-b')
    })

    it('should not confuse @endfor with @endforeach', async () => {
      const template = `@foreach(items as item)
<span>{{ item }}</span>
@endforeach`
      const result = await processTemplate(template, { items: ['x', 'y'] })
      expect(result).toContain('<span>x</span>')
      expect(result).toContain('<span>y</span>')
    })
  })

  describe('@forelse with @empty', () => {
    it('should handle @forelse with @empty correctly', async () => {
      const template = `@forelse(items as item)<li>{{ item }}</li>@empty<p>No items</p>@endforelse`
      const result = await processTemplate(template, { items: [] })
      expect(result).toContain('No items')
    })

    it('should render items when array is non-empty', async () => {
      const template = `@forelse(items as item)<li>{{ item }}</li>@empty<p>No items</p>@endforelse`
      const result = await processTemplate(template, { items: ['a', 'b'] })
      expect(result).toContain('<li>a</li>')
      expect(result).toContain('<li>b</li>')
      expect(result).not.toContain('No items')
    })
  })

  describe('@foreach with parens in string arguments', () => {
    it('should handle parens inside string arguments', async () => {
      const template = `@foreach(items as item)<p>{{ item }}</p>@endforeach`
      const result = await processTemplate(template, { items: ['hello (world)', 'test'] })
      expect(result).toContain('hello (world)')
      expect(result).toContain('test')
    })
  })

  describe('Loop body template literal injection', () => {
    it('should not interpret ${} in loop body as template literal injection', async () => {
      const result = await processTemplate(
        `@for(item in items)<p>Item</p>@endfor`,
        { items: ['a', 'b'] },
      )
      expect(result).toContain('<p>Item</p>')
    })
  })
})
