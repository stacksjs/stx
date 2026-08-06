/**
 * Which files under a page root are actually public routes.
 *
 * `components/`, `layouts/` and `partials/` under `pagesDir` are building
 * blocks, not pages. They were already filtered out of the generated route
 * manifest and route types — but only there (`codegen.ts`), which meant the
 * manifest and the live route table disagreed: `.stx/routes.ts` said a site had
 * 30 routes while `Router.routes` had 34, and the four extra ones were served,
 * statically built to HTML, and advertised in sitemap.xml as public URLs
 * (stacksjs/stx#1866).
 *
 * One reporting app worked around it structurally — deleting
 * `resources/views/layouts/` so layouts *could not* be routed — which is the
 * kind of fix that only exists because the framework made it necessary.
 *
 * The rule lives here so the scanner and the codegen share it rather than
 * restating it. The codegen's version also only matched a leading segment, so
 * `resources/views/admin/components/x.stx` slipped through it.
 *
 * @module page-routes
 */

/** Directories under a page root whose contents are never public routes. */
export const NON_PAGE_DIRS: readonly string[] = ['components', 'layouts', 'partials']

/**
 * True when a path relative to a page root sits inside a non-page directory,
 * at any depth.
 *
 * Accepts either OS-native or POSIX separators.
 */
export function isNonPageRoutePath(relativePath: string): boolean {
  const segments = relativePath.split(/[\\/]/).filter(Boolean)
  // The final segment is the file itself; a file merely NAMED components.stx
  // is a legitimate page.
  return segments.slice(0, -1).some(segment => NON_PAGE_DIRS.includes(segment))
}

/**
 * True when a URL pattern points *into* a non-page directory.
 *
 * `/components/foo` and `/admin/components/foo` qualify; bare `/components`
 * does not, and must not — the scanner already skips the directory, so the only
 * way that pattern exists is a real `components.stx` page. Excluding it here
 * would route the page but leave it out of `.stx/routes.ts` and the generated
 * route types, which is the manifest-versus-table disagreement this module was
 * added to end.
 */
export function isNonPageRoutePattern(pattern: string): boolean {
  return isNonPageRoutePath(pattern.replace(/^\//, ''))
}
