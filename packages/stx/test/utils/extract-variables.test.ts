import { describe, expect, it } from 'bun:test'

// Import the function we need to test
// Note: extractVariableNames is not exported, so we test it indirectly
// through the component processing or create a test helper

// For now, we'll test the behavior through a simple inline implementation
// that mirrors what extractVariableNames does

function extractVariableNames(code: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  let depth = 0
  let i = 0
  const len = code.length

  const skipString = (quote: string): void => {
    i++
    while (i < len) {
      if (code[i] === '\\') { i += 2; continue }
      if (code[i] === quote) { i++; return }
      i++
    }
  }

  const skipTemplateLiteral = (): void => {
    i++
    while (i < len) {
      if (code[i] === '\\') { i += 2; continue }
      if (code[i] === '`') { i++; return }
      if (code[i] === '$' && code[i + 1] === '{') {
        i += 2
        let templateDepth = 1
        while (i < len && templateDepth > 0) {
          if (code[i] === '{') templateDepth++
          else if (code[i] === '}') templateDepth--
          else if (code[i] === '\'' || code[i] === '"') skipString(code[i])
          else if (code[i] === '`') skipTemplateLiteral()
          else i++
        }
        continue
      }
      i++
    }
  }

  const skipComment = (): boolean => {
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < len && code[i] !== '\n') i++
      return true
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      return true
    }
    return false
  }

  const checkDeclaration = (): void => {
    if (depth !== 0) return

    // Check for destructuring declarations
    const destructMatch = code.slice(i).match(/^(const|let|var)\s*\{([^}]+)\}\s*=/)
    if (destructMatch) {
      const vars = destructMatch[2].split(',').map(v => v.trim().split(':')[0].trim())
      for (const varName of vars) {
        if (varName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName) && !seen.has(varName)) {
          names.push(varName)
          seen.add(varName)
        }
      }
      return
    }

    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (declMatch) {
      const varName = declMatch[2]
      if (!seen.has(varName)) { names.push(varName); seen.add(varName) }
      return
    }

    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) { names.push(funcName); seen.add(funcName) }
      return
    }

    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) { names.push(funcName); seen.add(funcName) }
    }
  }

  while (i < len) {
    if (skipComment()) continue
    if (code[i] === '\'' || code[i] === '"') { skipString(code[i]); continue }
    if (code[i] === '`') { skipTemplateLiteral(); continue }
    if (code[i] === '{') { depth++; i++; continue }
    if (code[i] === '}') { depth--; i++; continue }
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }
    i++
  }

  return names
}

describe('Extract Variable Names', () => {
  describe('simple declarations', () => {
    it('should extract const declarations', () => {
      const code = `const count = 0`
      const names = extractVariableNames(code)
      expect(names).toContain('count')
    })

    it('should extract let declarations', () => {
      const code = `let value = 'test'`
      const names = extractVariableNames(code)
      expect(names).toContain('value')
    })

    it('should extract var declarations', () => {
      const code = `var oldStyle = true`
      const names = extractVariableNames(code)
      expect(names).toContain('oldStyle')
    })

    it('should extract multiple declarations', () => {
      const code = `
        const a = 1
        let b = 2
        var c = 3
      `
      const names = extractVariableNames(code)
      expect(names).toContain('a')
      expect(names).toContain('b')
      expect(names).toContain('c')
    })
  })

  describe('function declarations', () => {
    it('should extract function declarations', () => {
      const code = `function handleClick() { console.log('clicked') }`
      const names = extractVariableNames(code)
      expect(names).toContain('handleClick')
    })

    it('should extract async function declarations', () => {
      const code = `async function fetchData() { return await fetch('/api') }`
      const names = extractVariableNames(code)
      expect(names).toContain('fetchData')
    })

    it('should extract arrow functions assigned to const', () => {
      const code = `const onClick = () => console.log('clicked')`
      const names = extractVariableNames(code)
      expect(names).toContain('onClick')
    })
  })

  describe('destructuring declarations', () => {
    it('should extract variables from object destructuring', () => {
      const code = `const { appStore, chatStore } = window.__STX_STORES__`
      const names = extractVariableNames(code)
      expect(names).toContain('appStore')
      expect(names).toContain('chatStore')
    })

    it('should extract variables from destructuring with renaming', () => {
      const code = `const { state: myState } = window.stx`
      const names = extractVariableNames(code)
      expect(names).toContain('state')
    })

    it('should handle destructuring with multiple stores', () => {
      const code = `const { appStore, settingsStore, uiStore, chatStore } = window.__STX_STORES__`
      const names = extractVariableNames(code)
      expect(names).toContain('appStore')
      expect(names).toContain('settingsStore')
      expect(names).toContain('uiStore')
      expect(names).toContain('chatStore')
    })

    it('should handle let destructuring', () => {
      const code = `let { x, y } = point`
      const names = extractVariableNames(code)
      expect(names).toContain('x')
      expect(names).toContain('y')
    })
  })

  describe('nested scopes', () => {
    it('should NOT extract variables from nested functions', () => {
      const code = `
        const topLevel = 1
        function outer() {
          const nested = 2
        }
      `
      const names = extractVariableNames(code)
      expect(names).toContain('topLevel')
      expect(names).toContain('outer')
      expect(names).not.toContain('nested')
    })

    it('should NOT extract variables from nested blocks', () => {
      const code = `
        const outside = 1
        if (true) {
          const inside = 2
        }
      `
      const names = extractVariableNames(code)
      expect(names).toContain('outside')
      expect(names).not.toContain('inside')
    })
  })

  describe('edge cases', () => {
    it('should handle strings containing keywords', () => {
      const code = `const text = 'const fake = inside string'`
      const names = extractVariableNames(code)
      expect(names).toContain('text')
      expect(names).not.toContain('fake')
    })

    it('should handle template literals', () => {
      const code = 'const msg = `const inside = template`'
      const names = extractVariableNames(code)
      expect(names).toContain('msg')
      expect(names).not.toContain('inside')
    })

    it('should handle comments', () => {
      const code = `
        // const commented = 1
        const real = 2
        /* const multiline = 3 */
      `
      const names = extractVariableNames(code)
      expect(names).toContain('real')
      expect(names).not.toContain('commented')
      expect(names).not.toContain('multiline')
    })

    it('should not duplicate names', () => {
      const code = `
        const count = 0
        const count = 1
      `
      const names = extractVariableNames(code)
      const countOccurrences = names.filter(n => n === 'count').length
      expect(countOccurrences).toBe(1)
    })
  })

  describe('real-world component script', () => {
    it('should extract all variables from a typical component script', () => {
      const code = `
        const { appStore, chatStore, settingsStore } = window.__STX_STORES__

        const { state } = window.stx
        const isRecording = state(false)
        const showAudioPreview = state(false)

        const API_BASE_URL = 'http://localhost:3008/voide'

        function startRecording() {
          isRecording.set(true)
        }

        async function stopRecording() {
          isRecording.set(false)
          showAudioPreview.set(true)
        }
      `
      const names = extractVariableNames(code)

      // Destructured stores
      expect(names).toContain('appStore')
      expect(names).toContain('chatStore')
      expect(names).toContain('settingsStore')

      // Destructured window.stx
      expect(names).toContain('state')

      // Signal variables
      expect(names).toContain('isRecording')
      expect(names).toContain('showAudioPreview')

      // Constants
      expect(names).toContain('API_BASE_URL')

      // Functions
      expect(names).toContain('startRecording')
      expect(names).toContain('stopRecording')
    })
  })
})
