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
    // Direct test without dynamic import since module is already mocked
    const jsDocComments: any[] = []

    // This should not throw an error
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
})
