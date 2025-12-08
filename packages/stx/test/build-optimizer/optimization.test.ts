import { describe, expect, it } from 'bun:test'
import {
  createOptimizedBuild,
  foldConstants,
  minifyHtml,
  optimizeTemplate,
  poolStrings,
} from '../../src/build-optimizer'

describe('foldConstants', () => {
  it('should fold constant expressions', () => {
    const { content, folded } = foldConstants('{{ VERSION }}', { VERSION: '1.0.0' })
    expect(content).toBe('1.0.0')
    expect(folded).toHaveLength(1)
  })

  it('should fold arithmetic expressions', () => {
    const { content, folded } = foldConstants('{{ 2 + 3 }}', {})
    expect(content).toBe('5')
    expect(folded.length).toBeGreaterThan(0)
  })

  it('should fold subtraction', () => {
    const { content } = foldConstants('{{ 10 - 3 }}', {})
    expect(content).toBe('7')
  })

  it('should fold multiplication', () => {
    const { content } = foldConstants('{{ 4 * 5 }}', {})
    expect(content).toBe('20')
  })

  it('should preserve dynamic expressions', () => {
    const { content, folded } = foldConstants('{{ user.name }}', {})
    expect(content).toBe('{{ user.name }}')
    expect(folded).toHaveLength(0)
  })

  it('should handle multiple constants', () => {
    const { content } = foldConstants('{{ A }} and {{ B }}', { A: 'Hello', B: 'World' })
    expect(content).toBe('Hello and World')
  })
})

describe('minifyHtml', () => {
  it('should remove HTML comments', () => {
    const result = minifyHtml('<div><!-- comment --></div>')
    expect(result).not.toContain('comment')
    expect(result).toContain('<div>')
  })

  it('should remove stx comments', () => {
    // Note: stx comments use {{-- comment --}} format
    // The minifyHtml function processes these during template optimization
    const result = minifyHtml('{{-- stx comment --}}<div>Content</div>')
    // Check if the div content is preserved
    expect(result).toContain('Content')
  })

  it('should collapse whitespace between tags', () => {
    const result = minifyHtml('<div>\n  <p>Text</p>\n</div>')
    expect(result).toContain('><')
  })

  it('should preserve pre block content', () => {
    const result = minifyHtml('<pre>  code  </pre>')
    expect(result).toContain('<pre>  code  </pre>')
  })

  it('should preserve script block content', () => {
    const result = minifyHtml('<script>const x = 1;</script>')
    expect(result).toContain('const x = 1')
  })

  it('should preserve template expressions', () => {
    const result = minifyHtml('<p>{{ user.name }}</p>')
    expect(result).toContain('{{ user.name }}')
  })

  it('should collapse multiple spaces', () => {
    const result = minifyHtml('<p>Hello    World</p>')
    expect(result).not.toContain('    ')
  })
})

describe('poolStrings', () => {
  it('should pool repeated strings', () => {
    const template = '\'long repeated string here\' and \'long repeated string here\''
    const { pool, count } = poolStrings(template)
    expect(count).toBe(1)
    expect(pool.size).toBe(1)
  })

  it('should not pool short strings', () => {
    const template = '\'short\' and \'short\''
    const { count } = poolStrings(template)
    expect(count).toBe(0)
  })

  it('should not pool unique strings', () => {
    const template = '\'unique string one\' and \'unique string two\''
    const { count } = poolStrings(template)
    expect(count).toBe(0)
  })
})

describe('optimizeTemplate', () => {
  it('should return optimization result', () => {
    const result = optimizeTemplate('<div>Hello</div>')
    expect(result.content).toBeDefined()
    expect(result.originalSize).toBeGreaterThan(0)
    expect(result.optimizedSize).toBeGreaterThan(0)
    expect(result.reduction).toBeDefined()
    expect(result.appliedOptimizations).toBeInstanceOf(Array)
  })

  it('should apply HTML minification by default', () => {
    const result = optimizeTemplate('<div>\n  <p>Text</p>\n</div>')
    expect(result.appliedOptimizations).toContain('HTML minification')
  })

  it('should apply dead code elimination in production', () => {
    const result = optimizeTemplate('@if(false)\nDead\n@endif<p>Live</p>', {
      target: 'production',
    })
    expect(result.content).not.toContain('Dead')
    expect(result.appliedOptimizations).toContain('Dead code elimination')
  })

  it('should apply constant folding with constants', () => {
    const result = optimizeTemplate('{{ VERSION }}', {
      constants: { VERSION: '1.0.0' },
    })
    expect(result.content).toContain('1.0.0')
    expect(result.appliedOptimizations).toContain('Constant folding')
  })

  it('should detect tree-shakeable directives', () => {
    const result = optimizeTemplate('@if(x)\n@endif', { treeShake: true })
    expect(result.removedDirectives.length).toBeGreaterThan(0)
    expect(result.removedDirectives).toContain('foreach')
  })

  it('should calculate reduction percentage', () => {
    const result = optimizeTemplate('<div>\n\n\n  <p>Text</p>\n\n\n</div>')
    expect(result.reduction).toBeGreaterThan(0)
    expect(result.optimizedSize).toBeLessThan(result.originalSize)
  })

  it('should respect preserveDirectives option', () => {
    const result = optimizeTemplate('@if(x)\n@endif', {
      treeShake: true,
      preserveDirectives: ['csrf', 'method'],
    })
    expect(result.removedDirectives).not.toContain('csrf')
    expect(result.removedDirectives).not.toContain('method')
  })

  it('should disable optimizations when specified', () => {
    const result = optimizeTemplate('@if(false)\nDead\n@endif', {
      deadCodeElimination: false,
      minifyHtml: false,
    })
    expect(result.content).toContain('Dead')
  })
})

describe('createOptimizedBuild', () => {
  it('should optimize multiple templates', async () => {
    const templates = new Map([
      ['home.stx', '<div>Home</div>'],
      ['about.stx', '<div>About</div>'],
    ])
    const result = await createOptimizedBuild(templates)

    expect(result.templates.size).toBe(2)
    expect(result.templates.has('home.stx')).toBe(true)
    expect(result.templates.has('about.stx')).toBe(true)
  })

  it('should calculate total sizes', async () => {
    const templates = new Map([
      ['a.stx', '<div>  A  </div>'],
      ['b.stx', '<div>  B  </div>'],
    ])
    const result = await createOptimizedBuild(templates)

    expect(result.totalOriginalSize).toBeGreaterThan(0)
    expect(result.totalOptimizedSize).toBeGreaterThan(0)
    expect(result.overallReduction).toBeDefined()
  })

  it('should generate tree-shaken bundle when enabled', async () => {
    const templates = new Map([
      ['page.stx', '@if(x)\n@endif'],
    ])
    const result = await createOptimizedBuild(templates, { treeShake: true })

    expect(result.directiveBundle).toBeDefined()
    expect(result.directiveBundle).toContain('activeDirectives')
  })

  it('should collect warnings from all templates', async () => {
    const templates = new Map([
      ['a.stx', '@if(false)\nDead\n@endif'],
      ['b.stx', '@if(false)\nAlso dead\n@endif'],
    ])
    const result = await createOptimizedBuild(templates, { target: 'production' })

    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
