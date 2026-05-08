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
