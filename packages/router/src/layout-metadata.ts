export interface LayoutMetadata {
  layout: string
  group: string
}

export function deriveLayoutGroup(layoutPath: string): string {
  const normalized = layoutPath.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  const layoutsIndex = segments.lastIndexOf('layouts')
  const layoutSegment = layoutsIndex >= 0 ? segments[layoutsIndex + 1] : segments.at(-1)

  if (!layoutSegment)
    return 'app'

  return layoutSegment.replace(/\.stx$/i, '') || 'app'
}

export function extractLayoutMetadata(html: string): LayoutMetadata {
  const layoutMeta = html.match(/<meta\b[^>]*name=["']stx-layout["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  const groupMeta = html.match(/<meta\b[^>]*name=["']stx-layout-group["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  const layoutComment = html.match(/<!--\s*stx-layout:\s*([^ ]+)\s*-->/i)
  const layout = layoutMeta?.[1] || layoutComment?.[1] || ''

  return {
    layout,
    group: groupMeta?.[1] || deriveLayoutGroup(layout),
  }
}

/**
 * Request headers the router sends with a fragment request: the layout the
 * page it is on was drawn with.
 *
 * A fragment only fits the layout it was cut from. When the router's page is
 * on another layout it used to read the answer, see the layout change, and
 * ask for the whole document, so the server rendered the page twice for one
 * click (on one app two 1.25 MB renders and two data lookups). Told what the
 * router has, the server answers that request with the document itself.
 */
export const HAVE_LAYOUT_HEADER = 'X-STX-Have-Layout'
export const HAVE_LAYOUT_GROUP_HEADER = 'X-STX-Have-Layout-Group'

/**
 * Whether a page on `next` cannot be swapped in as a fragment where the router
 * is on `have`. The router's own rule (checkLayoutChange in client.ts): another
 * layout group, or another named layout within the same group.
 */
export function layoutChanges(have: LayoutMetadata, next: LayoutMetadata): boolean {
  const haveGroup = have.group || deriveLayoutGroup(have.layout)
  const nextGroup = next.group || deriveLayoutGroup(next.layout)
  if (haveGroup !== nextGroup)
    return true
  return Boolean(have.layout && next.layout && have.layout !== next.layout)
}

/**
 * The layout a router request says its page is on, or null when it says
 * nothing: a router from before these headers, which still reads the
 * fragment's headers and fetches the document itself.
 */
export function layoutTheRouterHas(headers: { get: (name: string) => string | null }): LayoutMetadata | null {
  const layout = headers.get(HAVE_LAYOUT_HEADER)
  const group = headers.get(HAVE_LAYOUT_GROUP_HEADER)
  if (layout === null && group === null)
    return null
  return { layout: layout ?? '', group: group ?? '' }
}
