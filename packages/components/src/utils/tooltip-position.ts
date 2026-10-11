export interface TooltipAnchor { left: number, top: number, right: number, bottom: number }
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

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
