/**
 * One splice into `<head>` instead of one per thing being injected
 * (stacksjs/stx#1945).
 *
 * Several passes each add a small fragment to the head of a finished page: the
 * x-cloak style, the color-mode boot script, the build-id meta. Each was
 * written the obvious way -- find the anchor, return
 * `slice(0, i) + fragment + slice(i)` -- and each of those returns a NEW copy
 * of the whole document. On a 212KB page that is 212KB allocated to insert a
 * few hundred bytes, three times over, and the measured cost of the top-level
 * pipeline was dominated by exactly this shape: of 86 assignments in a render,
 * only ten produced a new string, and six of them were whole-document copies
 * made to insert something small.
 *
 * A pass that contributes a fragment instead of splicing it lets all of them
 * share one rebuild. Order is preserved within each anchor, which is the part
 * that matters: the boot script has to precede the cloak style in the head, and
 * both have to be live before first paint.
 *
 * Nothing here decides WHETHER a fragment applies. Each caller keeps its own
 * guard -- idempotence checks, config gates -- and simply contributes nothing
 * when it does not apply, so a page that needs no injections is not rebuilt.
 *
 * @module head-injection
 */

/** Fragments waiting to be spliced into one document. */
export interface HeadInjections {
  /** Inserted immediately after the `<head ...>` open tag, in push order. */
  afterOpen: string[]
  /** Inserted immediately before `</head>`, in push order. */
  beforeClose: string[]
}

export function createHeadInjections(): HeadInjections {
  return { afterOpen: [], beforeClose: [] }
}

/** Whether anything was contributed, so a caller can skip the rebuild entirely. */
export function hasHeadInjections(injections: HeadInjections): boolean {
  return injections.afterOpen.length > 0 || injections.beforeClose.length > 0
}

/**
 * Apply every collected fragment in a single pass.
 *
 * Returns `html` untouched -- the same reference, not a copy -- when there is
 * nothing to add or the document has no head to add it to. A page without a
 * `<head>` is not an error here: SPA fragments have nowhere to put these and
 * are served with the same information in response headers instead.
 */
export function applyHeadInjections(html: string, injections: HeadInjections): string {
  if (!hasHeadInjections(injections))
    return html

  const afterOpen = injections.afterOpen.join('')
  const beforeClose = injections.beforeClose.join('')

  // Resolved together, because both offsets index into the SAME string. Doing
  // one splice and then looking for the second anchor would search a document
  // whose offsets had already shifted.
  const headCloseIdx = html.lastIndexOf('</head>')
  const openAt = afterOpen ? headInsertionPoint(html) : null
  const closeAt = beforeClose && headCloseIdx !== -1 ? headCloseIdx : null

  if (openAt === null && closeAt === null)
    return html
  if (openAt !== null && closeAt !== null) {
    // The one rebuild this module exists for.
    return `${html.slice(0, openAt)}${afterOpen}${html.slice(openAt, closeAt)}${beforeClose}${html.slice(closeAt)}`
  }
  if (openAt !== null)
    return `${html.slice(0, openAt)}${afterOpen}${html.slice(openAt)}`
  return `${html.slice(0, closeAt!)}${beforeClose}${html.slice(closeAt!)}`
}

/** A `<meta charset>` that leads `<head>`, matched from a given offset. */
const LEADING_CHARSET_META = /\s*<meta\b[^>]*\bcharset\b[^>]*>/iy

/**
 * Offset of the canonical head-injection position: just inside `<head>`, after
 * a `<meta charset>` that leads it. `null` when the document has no head.
 *
 * Stepping over the charset is not cosmetic. The encoding declaration has to
 * land inside the document's first 1024 bytes, and what gets inserted here is
 * big enough to push it out -- the signals runtime is the whole client library,
 * the default SEO block ~500 bytes. Displacing it was then repaired at the end
 * of the pipeline by hoisting the charset back up, which rebuilt the whole
 * document (186KB on a 199KB page) to move three bytes. Every injector landing
 * after the charset means the order is right the first time and there is
 * nothing to repair (stacksjs/stx#1945).
 *
 * `hoistCharsetMeta` stays as the backstop for anything that does not come
 * through here.
 */
export function headInsertionPoint(html: string): number | null {
  const headOpen = /<head\b[^>]*>/i.exec(html)
  if (!headOpen)
    return null

  const afterTag = headOpen.index + headOpen[0].length
  // Sticky, so the test runs at that offset without copying the rest of the
  // document just to anchor it.
  LEADING_CHARSET_META.lastIndex = afterTag
  const charset = LEADING_CHARSET_META.exec(html)
  return charset ? afterTag + charset[0].length : afterTag
}
