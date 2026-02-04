import { describe, expect, it } from 'bun:test'
import { isJavaScriptScript, shouldTranspileTypeScript, transpileTypeScript } from '../../src/utils'

describe('TypeScript Default Transpilation', () => {
  describe('shouldTranspileTypeScript', () => {
    it('should return true for plain script (TypeScript by default)', () => {
      expect(shouldTranspileTypeScript('')).toBe(true)
      expect(shouldTranspileTypeScript(' ')).toBe(true)
    })

    it('should return true for script client', () => {
      expect(shouldTranspileTypeScript(' client')).toBe(true)
    })

    it('should return true for script server', () => {
      expect(shouldTranspileTypeScript(' server')).toBe(true)
    })

    it('should return false for explicit js attribute', () => {
      expect(shouldTranspileTypeScript(' js')).toBe(false)
      expect(shouldTranspileTypeScript(' client js')).toBe(false)
    })

    it('should return false for lang="js"', () => {
      expect(shouldTranspileTypeScript(' lang="js"')).toBe(false)
      expect(shouldTranspileTypeScript(" lang='js'")).toBe(false)
      expect(shouldTranspileTypeScript(' lang=js')).toBe(false)
    })

    it('should return false for lang="javascript"', () => {
      expect(shouldTranspileTypeScript(' lang="javascript"')).toBe(false)
      expect(shouldTranspileTypeScript(" lang='javascript'")).toBe(false)
    })
  })

  describe('isJavaScriptScript', () => {
    it('should return true for js attribute', () => {
      expect(isJavaScriptScript(' js')).toBe(true)
      expect(isJavaScriptScript(' js ')).toBe(true)
    })

    it('should return true for lang="js"', () => {
      expect(isJavaScriptScript(' lang="js"')).toBe(true)
      expect(isJavaScriptScript(' lang="javascript"')).toBe(true)
    })

    it('should return false for ts attribute', () => {
      expect(isJavaScriptScript(' ts')).toBe(false)
      expect(isJavaScriptScript(' lang="ts"')).toBe(false)
    })

    it('should return false for plain script', () => {
      expect(isJavaScriptScript('')).toBe(false)
      expect(isJavaScriptScript(' client')).toBe(false)
    })
  })

  describe('transpileTypeScript', () => {
    it('should transpile TypeScript type annotations', () => {
      const ts = `const x: number = 5`
      const js = transpileTypeScript(ts)
      expect(js).not.toContain(': number')
      expect(js).toContain('const x')
      expect(js).toContain('5')
    })

    it('should transpile generic type parameters', () => {
      const ts = `const arr: Array<string> = []`
      const js = transpileTypeScript(ts)
      expect(js).not.toContain('Array<string>')
      expect(js).toContain('const arr')
      expect(js).toContain('[]')
    })

    it('should transpile interface declarations', () => {
      const ts = `
        interface User {
          name: string
          age: number
        }
        const user: User = { name: 'test', age: 25 }
      `
      const js = transpileTypeScript(ts)
      expect(js).not.toContain('interface')
      expect(js).toContain('const user')
      expect(js).toContain('name:')
      expect(js).toContain('test')
    })

    it('should transpile type aliases', () => {
      const ts = `
        type ID = string | number
        const id: ID = '123'
      `
      const js = transpileTypeScript(ts)
      expect(js).not.toContain('type ID')
      expect(js).toContain('const id')
    })

    it('should transpile function type annotations', () => {
      const ts = `
        function greet(name: string): string {
          return 'Hello ' + name
        }
      `
      const js = transpileTypeScript(ts)
      expect(js).not.toContain(': string')
      expect(js).toContain('function greet')
      expect(js).toContain('return')
    })

    it('should transpile arrow functions with types', () => {
      const ts = `const add = (a: number, b: number): number => a + b`
      const js = transpileTypeScript(ts)
      expect(js).not.toContain(': number')
      expect(js).toContain('const add')
      expect(js).toContain('=>')
    })

    it('should transpile async functions with types', () => {
      const ts = `
        async function fetchData(): Promise<string> {
          return 'data'
        }
      `
      const js = transpileTypeScript(ts)
      expect(js).not.toContain('Promise<string>')
      expect(js).toContain('async function fetchData')
    })

    it('should handle as type assertions', () => {
      const ts = `const el = document.getElementById('test') as HTMLElement`
      const js = transpileTypeScript(ts)
      expect(js).not.toContain('as HTMLElement')
      expect(js).toContain('document.getElementById')
    })

    it('should preserve runtime code', () => {
      const ts = `
        const state = window.stx.state<boolean>(false)
        state.set(true)
        console.log(state())
      `
      const js = transpileTypeScript(ts)
      expect(js).toContain('window.stx.state')
      expect(js).toContain('state.set(true)')
      expect(js).toContain('console.log')
      expect(js).not.toContain('<boolean>')
    })

    it('should handle class with typed properties', () => {
      const ts = `
        class Counter {
          private count: number = 0

          increment(): void {
            this.count++
          }

          getCount(): number {
            return this.count
          }
        }
      `
      const js = transpileTypeScript(ts)
      expect(js).not.toContain(': number')
      expect(js).not.toContain(': void')
      expect(js).toContain('class Counter')
      expect(js).toContain('increment()')
    })

    it('should handle destructuring with types', () => {
      const ts = `const { name, age }: { name: string, age: number } = user`
      const js = transpileTypeScript(ts)
      expect(js).not.toContain(': { name: string')
      expect(js).toContain('const { name, age }')
    })
  })
})
