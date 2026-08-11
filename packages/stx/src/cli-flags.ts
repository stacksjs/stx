/**
 * Read a flag that may legitimately appear more than once.
 *
 * The CLI parser collapses repeats to the LAST value — `--lib a --lib b` arrives
 * as the string `"b"`, and the same is true of `<path...>` and `[path...]`, so
 * there is no option spec that expresses "repeatable". The typecheck command
 * documented `--lib` as repeatable and had an `Array.isArray(options.lib)`
 * branch that could therefore never run: a project splitting its ambient
 * declarations across two files silently got whichever one it listed last
 * (stacksjs/stx#1925, stacksjs/stx#1926).
 *
 * The failure points the wrong way, which is what made it expensive. Listing
 * every declaration file — the obvious move, and what "repeatable" invites —
 * lands on the UNHELPED baseline, because the one file that was helping got
 * replaced by one that does not cover those names. That reads as "the flag does
 * nothing" rather than "the flag is dropping all but one of my files", and it
 * changes which errors are reported rather than merely how many: names that
 * would resolve come back as `Cannot find name`, hiding the real diagnostics
 * underneath them.
 *
 * So the values are read from argv, where all of them still are.
 *
 * @module cli-flags
 */

/**
 * Every value given for `flag`, in the order written.
 *
 * Accepts both spellings — `--lib a` and `--lib=a` — because a user who has
 * been told a flag repeats will reasonably try either.
 *
 * Values are returned verbatim; resolving them against a directory is the
 * caller's business, since it is the caller that knows what they name.
 */
export function collectRepeatedFlag(argv: readonly string[], flag: string): string[] {
  const values: string[] = []
  const inline = `${flag}=`

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg.startsWith(inline)) {
      const value = arg.slice(inline.length)
      if (value)
        values.push(value)
      continue
    }

    // `--lib` followed by its value. A following token that is itself a flag
    // means the value is missing, and consuming it would silently eat the next
    // option.
    if (arg === flag) {
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        values.push(next)
        i++
      }
    }
  }

  return values
}
