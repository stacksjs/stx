import { describe, expect, it } from 'bun:test'
import { transformStoreImports } from '../../src/state-management'

describe('Store Imports Transformation', () => {
  describe('transformStoreImports', () => {
    it('should transform @stores import to window.__STX_STORES__', () => {
      const input = `import { appStore } from '@stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('const { appStore } = window.__STX_STORES__')
      expect(output).not.toContain('import')
      expect(output).not.toContain('@stores')
    })

    it('should transform multiple store imports', () => {
      const input = `import { appStore, chatStore, settingsStore } from '@stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('const { appStore, chatStore, settingsStore } = window.__STX_STORES__')
    })

    it('should handle stx/stores import path', () => {
      const input = `import { myStore } from 'stx/stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('const { myStore } = window.__STX_STORES__')
    })

    it('should handle single quotes', () => {
      const input = `import { store1, store2 } from '@stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('const { store1, store2 } = window.__STX_STORES__')
    })

    it('should handle imports with extra whitespace', () => {
      const input = `import {   appStore  ,  chatStore   } from '@stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('appStore')
      expect(output).toContain('chatStore')
      expect(output).toContain('window.__STX_STORES__')
    })

    it('should preserve other code around the import', () => {
      const input = `
        const x = 5
        import { store } from '@stores'
        const y = 10
      `
      const output = transformStoreImports(input)
      expect(output).toContain('const x = 5')
      expect(output).toContain('const y = 10')
      expect(output).toContain('const { store } = window.__STX_STORES__')
    })

    it('should handle import with semicolon', () => {
      const input = `import { store } from '@stores';`
      const output = transformStoreImports(input)
      expect(output).toContain('const { store } = window.__STX_STORES__')
      expect(output).not.toContain('import')
    })

    it('should handle import without semicolon', () => {
      const input = `import { store } from '@stores'`
      const output = transformStoreImports(input)
      expect(output).toContain('const { store } = window.__STX_STORES__')
    })

    it('should not transform non-store imports', () => {
      const input = `import { something } from './other-module'`
      const output = transformStoreImports(input)
      expect(output).toContain('import { something }')
      expect(output).not.toContain('window.__STX_STORES__')
    })

    it('should handle multiple imports in same file', () => {
      const input = `
        import { store1 } from '@stores'
        import { helper } from './utils'
        import { store2 } from '@stores'
      `
      const output = transformStoreImports(input)
      expect(output).toContain('const { store1 } = window.__STX_STORES__')
      expect(output).toContain('const { store2 } = window.__STX_STORES__')
      expect(output).toContain('import { helper }')
    })
  })
})
