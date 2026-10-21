/**
 * The index of the `}` that starts the `}}` closing a mustache span opened at
 * `openIndex` (the index of its first `{`), or -1 when nothing closes it.
 *
 * Not to be confused with strip-literals' findInterpolationEnd, which closes a
 * JS `${ ... }` interpolation on a single brace.
 *
 * Braces inside the expression are counted and string literals are skipped, so
 * the span is read whole. The matchers here were `/\{\{([\s\S]*?)\}\}/`, which
 * is lazy and knows neither, so ONE level of object nesting ended the
 * expression early:
 *
 *   {{ JSON.stringify({a:1}) }}      worked
 *   {{ JSON.stringify({a:{b:1}}) }}  became `JSON.stringify({a:{b:1`
 *
 * The truncated expression failed to evaluate, which yields empty, and the rest
 * of it leaked as literal text -- pages shipped `) }}` where a value belonged,
 * including inside attribute values, with no error and no warning. A `}}` in a
 * string (`{{ "a}}b" }}`) ended it early the same way.
 */
export function findMustacheEnd(input: string, openIndex: number, braces: number = 2): number {
  let depth = 0
  let quote: string | null = null

  for (let i = openIndex + braces; i < input.length; i++) {
    const character = input[i]

    if (quote) {
      if (character === '\\') {
        i++
        continue
      }
      if (character === quote)
        quote = null
      continue
    }

    if (character === '"' || character === '\'' || character === '`') {
      quote = character
      continue
    }
    if (character === '{') {
      depth++
      continue
    }
    if (character === '}') {
      if (depth > 0) {
        depth--
        continue
      }
      let run = 0
      while (input[i + run] === '}') run++
      if (run >= braces)
        return i
    }
  }

  return -1
}

