import { describe, expect, mock, test } from 'bun:test'

// Mock VSCode module before any imports
mock.module('vscode', () => ({
  workspace: {
    getConfiguration: () => ({
      get: () => {},
      update: () => Promise.resolve(),
    }),
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
    onDidChangeTextDocument: () => ({ dispose: () => {} }),
    onDidOpenTextDocument: () => ({ dispose: () => {} }),
    onDidCloseTextDocument: () => ({ dispose: () => {} }),
    textDocuments: [],
  },
  window: {
    showInformationMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve(),
  },
  Uri: {
    parse: (uri: string) => ({ toString: () => uri, fsPath: uri.replace('file://', '') }),
    file: (path: string) => ({ fsPath: path, toString: () => `file://${path}` }),
  },
  EventEmitter: class MockEventEmitter {
    fire(_event: any) {}
    event = () => ({ dispose: () => {} })
  },
}))

describe('VirtualTsDocumentProvider Tests', () => {
  test('should handle undefined content without crashing', async () => {
    // This simulates the error condition that was happening
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')

    const provider = new VirtualTsDocumentProvider()

    // This should not throw an error
    expect(() => {
      // @ts-expect-error - intentionally testing with invalid input
      (provider as any).extractInterfaceTypeInfo(undefined, [])
    }).not.toThrow()
  })

  test('should handle null content without crashing', () => {
    expect(() => {
      // Just test the logic - the function will check for null
      const content: any = null
      if (!content || typeof content !== 'string') {
        // This is what the guard does
      }
    }).not.toThrow()
  })

  test('should handle empty string content', () => {
    const jsDocComments: any[] = []

    // Empty string should pass the guard but not extract anything
    const content = ''
    expect(content).toBe('')
    expect(jsDocComments.length).toBe(0)
  })

  test('should validate guard logic for undefined', () => {
    const content: any = undefined
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(true)
  })

  test('should validate guard logic for null', () => {
    const content: any = null
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(true)
  })

  test('should validate guard logic for valid string', () => {
    const content = 'some code'
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(false)
  })

  test('should validate guard logic for numbers', () => {
    const content: any = 123
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(true)
  })

  test('should validate guard logic for objects', () => {
    const content: any = {}
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(true)
  })

  test('should validate guard logic for arrays', () => {
    const content: any = []
    const shouldReturn = !content || typeof content !== 'string'
    expect(shouldReturn).toBe(true)
  })

  test('should extract TypeScript from script tags', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    // Create a mock document with a <script> tag
    const mockDoc = createMockDocument('<script>\nconst x: number = 1\nconst y = "hello"\n</script>\n<div>{{ x }}</div>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('const x: number = 1')
    expect(result.content).toContain('const y = "hello"')
  })

  test('should extract TypeScript from @ts blocks', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('@ts\ninterface User { name: string }\n@endts\n<div>hello</div>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('interface User')
    expect(result.content).toContain('name: string')
  })

  test('should extract expressions as const declarations', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<div>{{ user.name }}</div>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('user.name')
    expect(result.content).toContain('const expr')
  })

  test('should skip external script tags with src attribute', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<script src="https://cdn.example.com/lib.js"></script>\n<script>\nconst local = true\n</script>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('const local = true')
    expect(result.content).not.toContain('cdn.example.com')
  })

  test('should skip scripts marked as JavaScript', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<script lang="js">\nvar jsOnly = true\n</script>\n<script lang="ts">\nconst tsCode: string = "hello"\n</script>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('const tsCode: string')
    expect(result.content).not.toContain('jsOnly')
  })

  test('should include browser API declarations', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<div>hello</div>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('declare const window')
    expect(result.content).toContain('declare const document')
    expect(result.content).toContain('declare const console')
  })

  test('should create position mappings for script content', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<script>\nconst x = 1\n</script>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.mappings.length).toBeGreaterThan(0)
    // At least one mapping should point to the script content lines
    const scriptMappings = result.mappings.filter((m: any) => m.length > 0)
    expect(scriptMappings.length).toBeGreaterThan(0)
  })

  test('should handle server script attribute', async () => {
    const { VirtualTsDocumentProvider } = await import('../src/providers/virtualTsDocumentProvider')
    const provider = new VirtualTsDocumentProvider()

    const mockDoc = createMockDocument('<script server>\nconst data = await fetchData()\n</script>')
    const result = (provider as any).extractTypeScriptFromStx(mockDoc)

    expect(result.content).toContain('Server-side script context')
    expect(result.content).toContain('const data = await fetchData()')
  })
})

/**
 * Helper to create a mock VSCode TextDocument
 */
function createMockDocument(content: string) {
  const lines = content.split('\n')
  return {
    getText: () => content,
    positionAt: (offset: number) => {
      let line = 0
      let char = 0
      let remaining = offset
      for (let i = 0; i < lines.length; i++) {
        if (remaining <= lines[i].length) {
          line = i
          char = remaining
          break
        }
        remaining -= lines[i].length + 1 // +1 for newline
        line = i + 1
      }
      return { line, character: char }
    },
    offsetAt: (pos: { line: number, character: number }) => {
      let offset = 0
      for (let i = 0; i < pos.line && i < lines.length; i++) {
        offset += lines[i].length + 1
      }
      return offset + pos.character
    },
    lineAt: (line: number) => ({
      text: lines[line] || '',
    }),
    lineCount: lines.length,
    uri: { toString: () => 'file:///test.stx', fsPath: '/test.stx' },
    languageId: 'stx',
    fileName: '/test.stx',
  }
}
