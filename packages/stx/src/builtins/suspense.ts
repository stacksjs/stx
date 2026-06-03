/**
 * Suspense Builtin Component (stacksjs/stx#1742)
 *
 * A client loading boundary. Renders three regions that the signals runtime
 * (`bindSuspense`) toggles based on the aggregated state of descendant suspense
 * queries (`useQuery` / `useFetch` with `{ suspense: true }`):
 *
 *   - `[data-stx-suspense-fallback]` — shown while any descendant query loads
 *   - `[data-stx-suspense-error]`    — shown when a descendant query errors
 *   - `[data-stx-suspense-content]`  — shown once all descendant queries resolve
 *
 * The default slot is the content; `fallback` / `errorFallback` come from props
 * or from `slot="fallback"` / `slot="error"` elements in the slot content.
 *
 * ```stx
 * <Suspense fallback="Loading…">
 *   <CommentsList />   <!-- uses useQuery(url, { suspense: true }) -->
 * </Suspense>
 *
 * <Suspense>
 *   <template slot="fallback"><Skeleton count="2" /></template>
 *   <template slot="error">Couldn't load comments.</template>
 *   <CommentsList />
 * </Suspense>
 * ```
 *
 * @module builtins/suspense
 */

import type { BuiltinComponentDef, RenderContext, ResolvedProps } from '../component-registry'

/** Resolve a string prop from static or server-dynamic bindings. */
function resolveProp(props: ResolvedProps, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (props.serverDynamic[key] !== undefined)
      return String(props.serverDynamic[key])
    const val = props.static[key]
    if (typeof val === 'string')
      return val
  }
  return undefined
}

/**
 * Extract a `slot="name"` / `<template slot="name">` region from slot content,
 * returning the region's inner HTML and the content with that region removed.
 */
function extractSlot(content: string, name: string): { region: string | null, rest: string } {
  // Match a top-level element carrying slot="name" (template unwraps to its inner HTML).
  const re = new RegExp(
    `<(template|div|span)[^>]*\\bslot=["']${name}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i',
  )
  const m = content.match(re)
  if (!m)
    return { region: null, rest: content }
  return { region: m[2], rest: content.replace(m[0], '') }
}

export const SuspenseBuiltin: BuiltinComponentDef = {
  name: 'Suspense',
  aliases: ['suspense'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const fallbackSlot = extractSlot(slotContent, 'fallback')
    const afterFallback = fallbackSlot.rest
    const errorSlot = extractSlot(afterFallback, 'error')
    const content = errorSlot.rest

    const fallback = fallbackSlot.region
      ?? resolveProp(props, 'fallback')
      ?? '<div class="stx-suspense-loading">Loading…</div>'
    const errorFallback = errorSlot.region
      ?? resolveProp(props, 'errorFallback', 'error-fallback')
      ?? '<div class="stx-suspense-error">Something went wrong.</div>'

    // Content starts hidden + fallback shown: descendant suspense queries are
    // client-side, so there's nothing real to show until they resolve. The
    // runtime reveals content the instant the queries settle (or immediately if
    // there are none). Content stays in the DOM (hidden) so its scripts run and
    // register their queries.
    return `<div data-stx-suspense>`
      + `<div data-stx-suspense-fallback>${fallback}</div>`
      + `<div data-stx-suspense-error hidden>${errorFallback}</div>`
      + `<div data-stx-suspense-content hidden>${content}</div>`
      + `</div>`
  },
}
