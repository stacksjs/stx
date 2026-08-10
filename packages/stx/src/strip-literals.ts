/**
 * Blank out comments and string literals, keeping every other character where
 * it was.
 *
 * A name mentioned in a comment or inside a string is not a reference to it.
 * The server-to-client bridge applies this before deciding what a client block
 * mentions, and `stx typecheck` has to apply exactly the same rule before
 * reporting what still crosses implicitly — a second copy that disagreed would
 * make the warning and the runtime describe different sets (#1868 ask 4).
 *
 * Lives in its own module for that reason. It was defined inside
 * `client-script.ts`, and the editor-facing `stx-virtual-ts.ts` cannot import
 * that without pulling the bundler in behind it; the alternative was a
 * second implementation, which is the failure this repo keeps repeating.
 *
 * Positions are preserved: every blanked character becomes a space and every
 * newline stays a newline, so an offset into the result is an offset into the
 * source.
 *
 * @module strip-literals
 */

/** Index just past the string literal whose opening quote is at `start`. */
function skipQuoted(code: string, start: number): number {
  const quote = code[start]
  let i = start + 1
  while (i < code.length) {
    if (code[i] === '\\') {
      i += 2
      continue
    }
    if (code[i] === quote)
      return i + 1
    i++
  }
  return code.length
}

/** Index just past the template literal whose backtick is at `start`. */
function skipTemplate(code: string, start: number): number {
  let i = start + 1
  while (i < code.length) {
    if (code[i] === '\\') {
      i += 2
      continue
    }
    if (code[i] === '`')
      return i + 1
    if (code[i] === '$' && code[i + 1] === '{') {
      i = findInterpolationEnd(code, i + 2)
      if (i < code.length)
        i++
      continue
    }
    i++
  }
  return code.length
}

/**
 * Index of the `}` closing an interpolation whose body starts at `start`.
 *
 * Literals and comments are skipped whole, so a brace inside them cannot be
 * mistaken for structure — `` `${ x ? "}" : y }` `` closes at the right place.
 */
export function findInterpolationEnd(code: string, start: number): number {
  let depth = 1
  let i = start
  while (i < code.length) {
    const ch = code[i]
    if (ch === '\\') {
      i += 2
      continue
    }
    if (ch === '"' || ch === '\'') {
      i = skipQuoted(code, i)
      continue
    }
    if (ch === '`') {
      i = skipTemplate(code, i)
      continue
    }
    if (ch === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++
      continue
    }
    if (ch === '/' && code[i + 1] === '*') {
      i += 2
      while (i < code.length && code.slice(i, i + 2) !== '*/') i++
      i += 2
      continue
    }
    if (ch === '{') {
      depth++
      i++
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0)
        return i
      i++
      continue
    }
    i++
  }
  return code.length
}

/**
 * Blank out comments and string literals, preserving length and line structure
 * so offsets still line up, so that identifier detection only ever sees code.
 *
 * Template-literal INTERPOLATIONS are kept, because `${...}` is code, not text.
 * Blanking them hid every identifier that appears only inside one — a helper
 * called as `${formatDate(d)}` looked unused to the auto-import scanner, and a
 * server value read as `` `/api/users/${userId}` `` looked unreferenced to the
 * data bridge, which would have withheld it and left the client throwing on an
 * undefined name.
 */
export function stripCommentsAndLiterals(code: string): string {
  let out = ''
  let i = 0

  while (i < code.length) {
    const two = code.slice(i, i + 2)

    if (two === '//') {
      while (i < code.length && code[i] !== '\n') out += ' ', i++
      continue
    }

    if (two === '/*') {
      while (i < code.length && code.slice(i, i + 2) !== '*/')
        out += code[i] === '\n' ? '\n' : ' ', i++
      out += '  '
      i += 2
      continue
    }

    const ch = code[i]
    if (ch === '"' || ch === '\'') {
      const quote = ch
      out += ' '
      i++
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          out += '  '
          i += 2
          continue
        }
        out += code[i] === '\n' ? '\n' : ' '
        i++
      }
      out += ' '
      i++
      continue
    }

    if (ch === '`') {
      out += ' '
      i++
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') {
          out += '  '
          i += 2
          continue
        }
        // `${` … `}` is code. Recurse so a nested literal or comment inside the
        // interpolation is blanked by the same rules.
        if (code[i] === '$' && code[i + 1] === '{') {
          const bodyStart = i + 2
          const bodyEnd = findInterpolationEnd(code, bodyStart)
          out += '  '
          out += stripCommentsAndLiterals(code.slice(bodyStart, bodyEnd))
          if (bodyEnd < code.length)
            out += ' '
          i = bodyEnd + 1
          continue
        }
        out += code[i] === '\n' ? '\n' : ' '
        i++
      }
      out += ' '
      i++
      continue
    }

    out += ch
    i++
  }

  return out
}
