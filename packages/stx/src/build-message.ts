/**
 * Make a Bun build failure say where it happened (stacksjs/stx#1810).
 *
 * A single unparseable view produced `BuildMessage: Unexpected ===` and nothing
 * else — no path, no line — leaving the reporter to binary-search the scanned
 * views by hand.
 *
 * The location was never missing. Bun computes it and puts it on
 * `BuildMessage.position`; it is `.message` and `.toString()` that omit it. And
 * because `BuildMessage` is not an `instanceof Error` and carries no `.stack`,
 * the usual `error instanceof Error ? error.message : String(error)` idiom —
 * which this codebase uses in a dozen places — reduces it to exactly that bare
 * string.
 *
 * Two further wrinkles this handles:
 *
 *  - `Bun.build()` does not throw a BuildMessage. It throws an AggregateError
 *    whose `.errors` holds them, so the useful detail is one level down.
 *  - `Bun.Transpiler.transformSync()` reports `position.file` as its synthetic
 *    entry name, never the real path. The caller knows the real one, so it is
 *    threaded in rather than trusted from the message.
 */

interface BuildMessagePosition {
  file?: string
  line?: number
  column?: number
  lineText?: string
}

interface BuildMessageLike {
  message?: string
  name?: string
  position?: BuildMessagePosition | null
}

/** A Bun BuildMessage is structurally identifiable; it is not an Error. */
function isBuildMessageLike(value: unknown): value is BuildMessageLike {
  if (!value || typeof value !== 'object')
    return false
  const candidate = value as BuildMessageLike
  return typeof candidate.message === 'string'
    && (candidate.name === 'BuildMessage' || candidate.name === 'ResolveMessage' || 'position' in candidate)
}

/** Unwrap the BuildMessages an AggregateError from Bun.build carries. */
function unwrap(error: unknown): unknown[] {
  if (error && typeof error === 'object' && Array.isArray((error as { errors?: unknown[] }).errors))
    return (error as { errors: unknown[] }).errors
  return [error]
}

/**
 * Render a build failure as `path:line:column: message`, falling back to the
 * plain message when no position is available.
 *
 * @param error whatever was thrown — BuildMessage, AggregateError, Error, or
 * anything else
 * @param sourcePath the real file being compiled. Preferred over the position's
 * own `file`, which is a synthetic entry name on the transpiler path.
 */
export function formatBuildFailure(error: unknown, sourcePath?: string): string {
  const parts: string[] = []

  for (const item of unwrap(error)) {
    if (isBuildMessageLike(item)) {
      const position = item.position || undefined
      // A synthetic entry name is worse than useless — it sends the reader to a
      // file that does not exist.
      const file = sourcePath || position?.file
      const where = file
        ? `${file}${position?.line ? `:${position.line}${position.column ? `:${position.column}` : ''}` : ''}`
        : ''
      const snippet = position?.lineText ? `\n    ${position.lineText.trim()}` : ''
      parts.push(where ? `${where}: ${item.message}${snippet}` : `${item.message}${snippet}`)
      continue
    }

    const message = item instanceof Error ? item.message : String(item)
    parts.push(sourcePath ? `${sourcePath}: ${message}` : message)
  }

  return parts.join('\n')
}
