/**
 * Catch a head config key that stx would otherwise ignore without a word.
 *
 * `app.head` is a plain object, so a misspelled key type-checks in any config
 * file that is not strictly typed and then simply never renders. An app wrote
 * `app.head.links: [...]` (the key is `link`) and for five months no page got
 * its favicon or its font stylesheets, with nothing in any log.
 *
 * Two answers, depending on how sure the guess is:
 *
 *   - The plural of a list key (`links`, `metas`, `scripts`, `styles`) is
 *     unambiguous: it is READ as the singular, merged after any singular
 *     entries, and a warning says to rename it.
 *   - Any other unknown key is left alone and warned about, naming the closest
 *     known key when one is a near miss (`bodyclass` -> `bodyClass`,
 *     `htmlattrs` -> `htmlAttrs`, `metta` -> `meta`).
 *
 * Each warning is printed once per process, so a key read on every render
 * says so once, at the first page served.
 *
 * @module head-keys
 */

/** Keys `app.head` in stx.config understands (see `AppHeadConfig`). */
export const APP_HEAD_KEYS: readonly string[] = ['title', 'lang', 'meta', 'link', 'script', 'headRaw', 'htmlAttrs', 'bodyClass', 'bodyAttrs']

/** Keys `useHead()` understands (see `HeadConfig`). */
export const USE_HEAD_KEYS: readonly string[] = ['title', 'titleTemplate', 'base', 'meta', 'link', 'script', 'style', 'htmlAttrs', 'bodyAttrs']

/** Plural spellings read as the singular list key they obviously mean. */
const PLURAL_ALIASES: Readonly<Record<string, string>> = {
  links: 'link',
  metas: 'meta',
  scripts: 'script',
  styles: 'style',
}

const warned = new Set<string>()
const normalized = new WeakMap<object, Record<string, unknown>>()

/** Forget which warnings were printed, so a test sees them again. */
export function resetHeadKeyWarnings(): void {
  warned.clear()
}

function warnOnce(message: string): void {
  if (warned.has(message))
    return
  warned.add(message)
  console.warn(message)
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = current
    }
  }
  return row[b.length]!
}

/** The known key an unknown one most likely meant, or undefined. */
export function nearestHeadKey(key: string, known: readonly string[]): string | undefined {
  const lower = key.toLowerCase()
  const caseOnly = known.find(k => k.toLowerCase() === lower)
  if (caseOnly)
    return caseOnly
  const plural = PLURAL_ALIASES[lower]
  if (plural && known.includes(plural))
    return plural
  let best: string | undefined
  let bestDistance = Infinity
  for (const candidate of known) {
    const d = distance(lower, candidate.toLowerCase())
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  // Two edits for a real word, one for a short key: `lang` vs `link` is two
  // and must not be offered for each other.
  const allowed = Math.min(key.length, best?.length ?? 0) <= 4 ? 1 : 2
  return bestDistance <= allowed ? best : undefined
}

/**
 * Read a head config with the plural list keys folded into their singular,
 * warning (once) about those and about any other key stx does not know.
 *
 * Returns the input itself when every key is known. Memoized per object, so a
 * config read on every render is checked once.
 */
export function normalizeHeadKeys<T extends Record<string, any>>(
  head: T | null | undefined,
  options: { known: readonly string[], source: string },
): T {
  if (!head || typeof head !== 'object' || Array.isArray(head))
    return (head || {}) as T

  const cached = normalized.get(head)
  if (cached)
    return cached as T

  const { known, source } = options
  let result: Record<string, any> = head

  for (const key of Object.keys(head)) {
    if (known.includes(key))
      continue

    const alias = PLURAL_ALIASES[key]
    if (alias && known.includes(alias) && Array.isArray(head[key])) {
      if (result === head)
        result = { ...head }
      const singular = Array.isArray(result[alias]) ? result[alias] : []
      result[alias] = [...singular, ...head[key]]
      delete result[key]
      warnOnce(`[stx] ${source}.${key} is not a head key; reading it as ${source}.${alias}. Rename it to \`${alias}\`.`)
      continue
    }

    // app.head has no style list: a stylesheet there is a link.
    if (/^styles?$/.test(key) && !known.includes('style')) {
      warnOnce(`[stx] ${source}.${key} is not a head key and is ignored. Use \`link\` with rel: 'stylesheet', or \`headRaw\` for an inline <style>.`)
      continue
    }

    const suggestion = nearestHeadKey(key, known)
    warnOnce(suggestion
      ? `[stx] ${source}.${key} is not a head key and is ignored. Did you mean \`${suggestion}\`?`
      : `[stx] ${source}.${key} is not a head key and is ignored. Known keys: ${known.join(', ')}.`)
  }

  normalized.set(head, result)
  return result as T
}
