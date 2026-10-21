import { stripCommentsAndLiterals } from './strip-literals'

export function extractExports(setupContent: string, mutableOnly = false): string {
  // Share the lexer used by bundle binding discovery. In particular, a regex
  // after `return` is an expression, not division: counting its braces can
  // expose private bundle helpers and put undefined names in the setup return.
  // Positions remain intact for declaration and destructuring recognition.
  const code = stripCommentsAndLiterals(setupContent)
  const names: string[] = []
  const seen = new Set<string>()
  let depth = 0
  let i = 0
  const len = code.length

  // Check for variable/function declaration at current position (only at depth 0)
  const checkDeclaration = (): void => {
    if (depth !== 0) return

    /*
     * A declaration, with or without an initializer (stacksjs/stx#1919).
     *
     * This required `=` immediately after the name, so a binding that is
     * declared and assigned later never reached the scope object this function
     * builds — and a template reading it evaluated to nothing. Silently: no
     * console error, no diagnostic, the element just renders empty.
     *
     * The form that costs the most is the typed one, because adding types is
     * what produces it. `let rows = null` became `let rows!: () => Row[]` with
     * the assignment and the template untouched, and the rendered row count
     * went from 2 to 0.
     *
     * So the terminator is anything a declaration can legally be followed by,
     * rather than `=` alone:
     *
     *   let x = 1     initializer
     *   let x!: T     definite assignment, assigned later
     *   let x: T      annotation, assigned later
     *   let x;        bare
     *   let x, y      first declarator (multi-declarator is a pre-existing gap)
     *
     * Matching the terminator rather than trying to consume the type is what
     * makes `let x!: () => string[]` work: an annotation can contain `=`, so
     * any attempt to scan past it stops on the arrow.
     */
    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:[!:;,\n]|=(?!=)|$)/)
    if (declMatch) {
      if (mutableOnly && declMatch[1] === 'const') return
      const varName = declMatch[2]
      if (!seen.has(varName)) {
        names.push(varName)
        seen.add(varName)
      }
      return
    }

    // Object destructuring: const { a, b: alias, c = default } = ...
    const destructMatch = code.slice(i).match(/^(?:const|let|var)\s+\{([^}]+)\}\s*=/)
    if (destructMatch) {
      if (mutableOnly && code.slice(i).startsWith('const')) return
      destructMatch[1].split(',').forEach((s) => {
        const trimmed = s.trim()
        if (!trimmed) return
        const colonIdx = trimmed.indexOf(':')
        const namePart = colonIdx >= 0 ? trimmed.slice(colonIdx + 1).trim() : trimmed
        const name = namePart.split(/[\s=]/)[0]
        if (name && !seen.has(name)) {
          names.push(name)
          seen.add(name)
        }
      })
      return
    }

    // Array destructuring: const [a, b, ...rest] = ...
    const arrayDestructMatch = code.slice(i).match(/^(?:const|let|var)\s+\[([^\]]+)\]\s*=/)
    if (arrayDestructMatch) {
      if (mutableOnly && code.slice(i).startsWith('const')) return
      arrayDestructMatch[1].split(',').forEach((s) => {
        const trimmed = s.trim().replace(/^\.\.\./, '')
        if (!trimmed) return
        const name = trimmed.split(/[\s=]/)[0]
        if (name && !seen.has(name)) {
          names.push(name)
          seen.add(name)
        }
      })
      return
    }

    if (mutableOnly) return

    // Check for function declarations
    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
      return
    }

    // Check for async function declarations
    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
    }
  }

  while (i < len) {
    // Track brace depth
    if (code[i] === '{') {
      depth++
      i++
      continue
    }
    if (code[i] === '}') {
      depth--
      i++
      continue
    }

    // Check for declarations at word boundaries (only at depth 0)
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }

    i++
  }

  return names.join(', ')
}

/** Mutable lexical bindings stay live after setup, including onMount assignments. */
export function scopePropertyDescriptor(name: string): string {
  return `{ enumerable: true, configurable: true, get() { return ${name} }, set(__stxValue_${name}) { ${name} = __stxValue_${name} } }`
}

export function scopeProperties(source: string, names = extractExports(source).split(',').map(name => name.trim()).filter(Boolean)): string {
  const mutable = new Set(extractExports(source, true).split(',').map(name => name.trim()))
  return names.map(name => mutable.has(name)
    ? `get ${name}() { return ${name} }, set ${name}(__stxValue_${name}) { ${name} = __stxValue_${name} }`
    : name).join(', ')
}


/** A bundle's public namespace retains its module's live export descriptors. */
export function scopeObject(source: string, names?: string[]): string {
  const object = `{ ${scopeProperties(source, names)} }`
  return extractExports(source).split(',').some(name => name.trim() === '__stxLiveBindings')
    ? `Object.defineProperties(${object}, Object.getOwnPropertyDescriptors(__stxLiveBindings))`
    : object
}
