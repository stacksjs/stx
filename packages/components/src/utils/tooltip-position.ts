export interface TooltipAnchor { left: number, top: number, right: number, bottom: number }
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

interface NativeTooltipBounds {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  unit: 'points' | 'dp'
  coordinateSpace: 'screenViewport'
}
interface NativeTooltipView {
  measure: () => Promise<NativeTooltipBounds>
  parentElement?: NativeTooltipView | null
}

/** Read real host bounds, returning coordinates relative to the panel's positioning parent. */
export async function measureTooltipPosition(trigger: HTMLElement | NativeTooltipView, panel: HTMLElement | NativeTooltipView, preferred: TooltipSide = 'top') {
  if ('measure' in trigger) {
    if (!('measure' in panel)) throw new Error('Tooltip panel requires native viewMeasure support')
    const [anchor, bounds, origin] = await Promise.all([
      trigger.measure(), panel.measure(), panel.parentElement?.measure(),
    ])
    for (const box of [bounds, origin]) {
      if (box && (box.unit !== anchor.unit || box.coordinateSpace !== anchor.coordinateSpace
        || box.viewportWidth !== anchor.viewportWidth || box.viewportHeight !== anchor.viewportHeight))
      throw new Error('Tooltip measurements must share viewport dimensions, coordinates, and units')
    }
    if (!bounds.width || !bounds.height) return null
    const point = tooltipPosition({ left: anchor.x, top: anchor.y, right: anchor.x + anchor.width, bottom: anchor.y + anchor.height }, bounds, { width: anchor.viewportWidth, height: anchor.viewportHeight }, preferred)
    return { ...point, left: point.left - (origin?.x ?? 0), top: point.top - (origin?.y ?? 0) }
  }
  if (!('getBoundingClientRect' in panel)) throw new Error('Tooltip panel requires browser layout measurements')
  const rect = panel.getBoundingClientRect()
  const viewport = trigger.ownerDocument.defaultView
  if (!rect.width || !rect.height || !viewport) return null
  const origin = panel.offsetParent?.getBoundingClientRect()
  const point = tooltipPosition(trigger.getBoundingClientRect(), rect, { width: viewport.innerWidth, height: viewport.innerHeight }, preferred)
  return { ...point, left: point.left - (origin?.left ?? 0), top: point.top - (origin?.top ?? 0) }
}

/** Position in viewport coordinates; flip when possible, then keep every edge readable. */
export function tooltipPosition(anchor: TooltipAnchor, panel: { width: number, height: number }, viewport: { width: number, height: number }, preferred: TooltipSide = 'top') {
  const gap = 8
  const edge = 8
  let side: TooltipSide = ['top', 'bottom', 'left', 'right'].includes(preferred) ? preferred : 'top'
  if (side === 'top' && anchor.top - panel.height - gap < edge && anchor.bottom + gap + panel.height <= viewport.height - edge) side = 'bottom'
  else if (side === 'bottom' && anchor.bottom + gap + panel.height > viewport.height - edge && anchor.top - gap - panel.height >= edge) side = 'top'
  else if (side === 'left' && anchor.left - gap - panel.width < edge && anchor.right + gap + panel.width <= viewport.width - edge) side = 'right'
  else if (side === 'right' && anchor.right + gap + panel.width > viewport.width - edge && anchor.left - gap - panel.width >= edge) side = 'left'
  const middleX = (anchor.left + anchor.right) / 2
  const middleY = (anchor.top + anchor.bottom) / 2
  let left = side === 'left' ? anchor.left - gap - panel.width : side === 'right' ? anchor.right + gap : middleX - panel.width / 2
  let top = side === 'top' ? anchor.top - gap - panel.height : side === 'bottom' ? anchor.bottom + gap : middleY - panel.height / 2
  left = Math.max(edge, Math.min(left, viewport.width - panel.width - edge))
  top = Math.max(edge, Math.min(top, viewport.height - panel.height - edge))
  return { left, top, side, arrowX: Math.max(8, Math.min(middleX - left, panel.width - 8)), arrowY: Math.max(8, Math.min(middleY - top, panel.height - 8)) }
}
