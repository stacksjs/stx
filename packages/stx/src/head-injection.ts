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
  const headOpen = /<head\b[^>]*>/i.exec(html)
  const headCloseIdx = html.lastIndexOf('</head>')

  const openAt = headOpen && (!afterOpen ? -1 : headOpen.index + headOpen[0].length)
  const closeAt = headCloseIdx === -1 || !beforeClose ? -1 : headCloseIdx

  if (openAt === -1 && closeAt === -1)
    return html
  if (openAt === null)
    return closeAt === -1 ? html : `${html.slice(0, closeAt)}${beforeClose}${html.slice(closeAt)}`

  if (openAt !== -1 && closeAt !== -1) {
    // The one rebuild this module exists for.
    return `${html.slice(0, openAt)}${afterOpen}${html.slice(openAt, closeAt)}${beforeClose}${html.slice(closeAt)}`
  }
  if (openAt !== -1)
    return `${html.slice(0, openAt)}${afterOpen}${html.slice(openAt)}`
  return `${html.slice(0, closeAt)}${beforeClose}${html.slice(closeAt)}`
}
