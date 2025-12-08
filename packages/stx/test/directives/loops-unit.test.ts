import { describe, expect, it } from 'bun:test'
import { processLoops } from '../../src/loops'

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
})
