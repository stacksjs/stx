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
 * One failure, with its position kept separate rather than baked into a string.
 *
 * A terminal wants `path:line:col: message`; a dev-server overlay wants to draw
 * a code frame and put a caret under the column. Both are rendered from this,
 * so the two cannot drift into disagreeing about where the error is (#1884).
 */
export interface BuildFailureDetail {
  file?: string
  line?: number
  column?: number
  message: string
  /** The offending source line, when Bun reported one. */
  lineText?: string
}

/**
 * Pull every failure out of whatever was thrown, with positions intact.
 *
 * @param error whatever was thrown — BuildMessage, AggregateError, Error, or
 * anything else
 * @param sourcePath the real file being compiled. Preferred over the position's
 * own `file`, which is a synthetic entry name on the transpiler path.
 */
export function describeBuildFailure(error: unknown, sourcePath?: string): BuildFailureDetail[] {
  const details: BuildFailureDetail[] = []

  for (const item of unwrap(error)) {
    if (isBuildMessageLike(item)) {
      const position = item.position || undefined
      // A synthetic entry name is worse than useless — it sends the reader to a
      // file that does not exist.
      details.push({
        file: sourcePath || position?.file,
        line: position?.line,
        column: position?.column,
        message: item.message ?? '',
        lineText: position?.lineText,
      })
      continue
    }

    details.push({
      file: sourcePath,
      message: item instanceof Error ? item.message : String(item),
    })
  }

  return details
}

/**
 * Render a build failure as `path:line:column: message`, falling back to the
 * plain message when no position is available.
 */
export function formatBuildFailure(error: unknown, sourcePath?: string): string {
  return describeBuildFailure(error, sourcePath)
    .map((detail) => {
      const where = detail.file
        ? `${detail.file}${detail.line ? `:${detail.line}${detail.column ? `:${detail.column}` : ''}` : ''}`
        : ''
      const snippet = detail.lineText ? `\n    ${detail.lineText.trim()}` : ''
      return where ? `${where}: ${detail.message}${snippet}` : `${detail.message}${snippet}`
    })
    .join('\n')
}

/**
 * Find a failure's line in the ORIGINAL source.
 *
 * The client-script bundler compiles a temp entry under `.stx/bundle-tmp`, so
 * Bun's `position.line` counts lines in THAT file — for a `<script client>`
 * block halfway down a page it is off by however many lines precede the block,
 * and for an unresolved import it comes back as `-1`. Pointing an overlay at
 * that line is worse than pointing at none: it sends the reader to code that is
 * fine.
 *
 * `lineText` is the one thing that survives the move. If it occurs exactly once
 * in the source, that is the line. Ambiguous or absent yields nothing, which the
 * caller renders as a message with no frame.
 */
export function locateFailureLine(source: string, lineText?: string): number | undefined {
  const needle = lineText?.trim()
  if (!needle)
    return undefined

  const lines = source.split('\n')
  let found: number | undefined
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== needle)
      continue
    if (found !== undefined)
      return undefined
    found = i + 1
  }
  return found
}

/** One line of a code frame. */
export interface CodeFrameLine {
  number: number
  text: string
  /** The line the error is on. */
  isError: boolean
}

/**
 * The lines around a failure, for an overlay to draw.
 *
 * Returns the offending line plus `context` lines either side, which is what
 * turns "Could not resolve" into something a reader can act on without opening
 * the file. Empty when there is no line to centre on.
 */
export function buildCodeFrame(source: string, line?: number, context = 2): CodeFrameLine[] {
  if (!line || line < 1)
    return []

  const lines = source.split('\n')
  const start = Math.max(1, line - context)
  const end = Math.min(lines.length, line + context)
  const frame: CodeFrameLine[] = []

  for (let n = start; n <= end; n++)
    frame.push({ number: n, text: lines[n - 1] ?? '', isError: n === line })

  return frame
}
