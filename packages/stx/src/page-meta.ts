/**
 * Reading `definePageMeta({ … })` out of a template's source.
 *
 * `PageMeta.layout` was part of the public type and appeared in
 * `definePageMeta`'s own documentation example, but no code path read it. A
 * page declaring `definePageMeta({ layout: 'app' })` type-checked, looked like
 * the idiomatic declaration, and rendered with no layout at all
 * (stacksjs/stx#1879).
 *
 * The cost was not just the missing layout. With no working typed way to say
 * "this page belongs to the app layout group", pages hand-wrote
 * `<meta name="stx-layout" content="app">` — a copy of a marker stx emits
 * itself. The router's full-document-vs-fragment swap decision hinges on that
 * string, so a page asserting a group it does not belong to is a routing
 * hazard, not a cosmetic one.
 *
 * The extraction lives here because four separate regexes over
 * `definePageMeta` had accumulated across `ssg.ts`, `page-response.ts` and
 * `bun-plugin`'s serve path, each recognising a slightly different subset.
 *
 * @module page-meta
 */

/**
 * Parse the first `definePageMeta({ … })` call in `source`.
 *
 * Object literals only — the call is read statically, before any script has
 * run, so a computed argument cannot be resolved and returns `null` rather
 * than half a result.
 */
export function extractPageMetaFromSource(source: string): Record<string, any> | null {
  const match = source.match(/\bdefinePageMeta\s*\(\s*(\{[\s\S]*?\})\s*\)/m)
  if (!match)
    return null
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return ${match[1]}`)() as Record<string, any>
  }
  catch {
    return null
  }
}

/**
 * The layout a page declares, if any.
 *
 * `false` is meaningful and distinct from "not declared" — it means the same
 * as `@nolayout`, so it must survive as `false` rather than collapsing into
 * `undefined`.
 */
export function pageMetaLayout(meta: Record<string, any> | null | undefined): string | false | undefined {
  const layout = meta?.layout
  if (layout === false)
    return false
  return typeof layout === 'string' && layout.trim() ? layout.trim() : undefined
}
