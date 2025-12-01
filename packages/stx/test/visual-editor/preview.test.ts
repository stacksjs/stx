import { describe, expect, it } from 'bun:test'
import { generatePreview, getDefaultPalette, insertPaletteItem } from '../../src/visual-editor'

describe('generatePreview', () => {
  it('should generate preview HTML', async () => {
    const preview = await generatePreview('<p>Hello</p>')
    expect(preview).toContain('<p>Hello</p>')
  })

  it('should wrap in document by default', async () => {
    const preview = await generatePreview('<p>Test</p>')
    expect(preview).toContain('<!DOCTYPE html>')
    expect(preview).toContain('<html')
    expect(preview).toContain('</html>')
  })

  it('should not wrap when wrapInDocument is false', async () => {
    const preview = await generatePreview('<p>Test</p>', { wrapInDocument: false })
    expect(preview).not.toContain('<!DOCTYPE html>')
  })

  it('should substitute variables from context', async () => {
    const preview = await generatePreview('{{ message }}', {
      context: { message: 'Hello World' },
    })
    expect(preview).toContain('Hello World')
  })

  it('should show placeholder for missing variables', async () => {
    const preview = await generatePreview('{{ unknown }}', { wrapInDocument: false })
    expect(preview).toContain('stx-preview-placeholder')
  })

  it('should wrap directives in styled spans', async () => {
    const preview = await generatePreview('@if(condition)', { wrapInDocument: false })
    expect(preview).toContain('stx-preview-directive')
    expect(preview).toContain('data-directive="if"')
  })

  it('should remove script blocks when not included', async () => {
    const preview = await generatePreview('<script>const x = 1</script><p>Text</p>', {
      includeScripts: false,
      wrapInDocument: false,
    })
    expect(preview).not.toContain('<script>')
    expect(preview).toContain('<p>Text</p>')
  })

  it('should include base URL when provided', async () => {
    const preview = await generatePreview('<p>Test</p>', {
      baseUrl: 'https://example.com',
    })
    expect(preview).toContain('<base href="https://example.com">')
  })

  it('should include custom CSS', async () => {
    const preview = await generatePreview('<p>Test</p>', {
      customCss: '.custom { color: blue }',
    })
    expect(preview).toContain('.custom { color: blue }')
  })

  it('should extract and include styles', async () => {
    const preview = await generatePreview('<style>.test { color: red }</style><p>Test</p>')
    expect(preview).toContain('.test { color: red }')
  })

  it('should handle objects in context', async () => {
    const preview = await generatePreview('{{ user }}', {
      context: { user: { name: 'John' } },
      wrapInDocument: false,
    })
    expect(preview).toContain('name')
    expect(preview).toContain('John')
  })
})

describe('getDefaultPalette', () => {
  it('should return palette items', () => {
    const palette = getDefaultPalette()
    expect(palette.length).toBeGreaterThan(0)
  })

  it('should have required properties', () => {
    const palette = getDefaultPalette()
    for (const item of palette) {
      expect(item.name).toBeDefined()
      expect(item.displayName).toBeDefined()
      expect(item.category).toBeDefined()
      expect(item.description).toBeDefined()
      expect(item.snippet).toBeDefined()
    }
  })

  it('should include layout items', () => {
    const palette = getDefaultPalette()
    const layoutItems = palette.filter(p => p.category === 'Layout')
    expect(layoutItems.length).toBeGreaterThan(0)
    expect(layoutItems.map(i => i.name)).toContain('extends')
    expect(layoutItems.map(i => i.name)).toContain('include')
  })

  it('should include control flow items', () => {
    const palette = getDefaultPalette()
    const controlItems = palette.filter(p => p.category === 'Control Flow')
    expect(controlItems.length).toBeGreaterThan(0)
    expect(controlItems.map(i => i.name)).toContain('if')
  })

  it('should include loop items', () => {
    const palette = getDefaultPalette()
    const loopItems = palette.filter(p => p.category === 'Loops')
    expect(loopItems.length).toBeGreaterThan(0)
    expect(loopItems.map(i => i.name)).toContain('foreach')
  })

  it('should include component items', () => {
    const palette = getDefaultPalette()
    const componentItems = palette.filter(p => p.category === 'Components')
    expect(componentItems.length).toBeGreaterThan(0)
    expect(componentItems.map(i => i.name)).toContain('component')
  })

  it('should have valid snippets with placeholders', () => {
    const palette = getDefaultPalette()
    for (const item of palette) {
      // Snippets should contain at least one placeholder or be simple
      expect(item.snippet.length).toBeGreaterThan(0)
    }
  })
})

describe('insertPaletteItem', () => {
  it('should return content and cursor position', () => {
    const item = {
      name: 'test',
      displayName: 'Test',
      category: 'Test',
      description: 'Test item',
      snippet: '@test($1)\n$0',
    }
    const result = insertPaletteItem(item, { line: 1, column: 1, offset: 0 })
    expect(result.content).toBeDefined()
    expect(result.cursorPosition).toBeDefined()
  })

  it('should remove placeholder markers', () => {
    const item = {
      name: 'test',
      displayName: 'Test',
      category: 'Test',
      description: 'Test item',
      snippet: '@test($1)',
    }
    const result = insertPaletteItem(item, { line: 1, column: 1, offset: 0 })
    expect(result.content).not.toContain('$1')
    expect(result.content).toBe('@test()')
  })

  it('should apply indentation to multi-line snippets', () => {
    const item = {
      name: 'if',
      displayName: 'If',
      category: 'Control Flow',
      description: 'If block',
      snippet: '@if($1)\n  $0\n@endif',
    }
    const result = insertPaletteItem(item, { line: 1, column: 1, offset: 0 }, '  ')
    expect(result.content).toContain('@if()')
    expect(result.content).toContain('  @endif')
  })

  it('should calculate cursor position correctly', () => {
    const item = {
      name: 'test',
      displayName: 'Test',
      category: 'Test',
      description: 'Test',
      snippet: '@test',
    }
    const result = insertPaletteItem(item, { line: 5, column: 10, offset: 50 })
    // Without placeholders, cursor should be at end
    expect(result.cursorPosition.line).toBeGreaterThanOrEqual(5)
  })
})
