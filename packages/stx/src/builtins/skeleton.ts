/**
 * StxSkeleton Builtin Component
 *
 * Renders placeholder loading skeleton elements with pulse or wave animation.
 * Pure CSS — no JS runtime required.
 *
 * Usage:
 *   <StxSkeleton width="200px" height="1rem" />
 *   <StxSkeleton variant="circle" size="48px" />
 *   <StxSkeleton variant="rect" width="100%" height="200px" radius="lg" />
 *   <StxSkeleton count="3" />
 *
 * @module builtins/skeleton
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function resolveNumericProp(props: ResolvedProps, key: string, defaultValue: number): number {
  const raw = resolveProp(props, key)
  if (raw !== undefined) {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  return defaultValue
}

const RADIUS_MAP: Record<string, string> = {
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px',
}

export const StxSkeletonBuiltin: BuiltinComponentDef = {
  name: 'StxSkeleton',
  aliases: ['stx-skeleton'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const variant = resolveProp(props, 'variant') || 'text'
    const animate = resolveProp(props, 'animate') || 'pulse'
    const count = resolveNumericProp(props, 'count', 1)
    const size = resolveProp(props, 'size')
    const radiusKey = resolveProp(props, 'radius')

    let width = resolveProp(props, 'width') || '100%'
    let height = resolveProp(props, 'height') || '1rem'
    let borderRadius = radiusKey ? (RADIUS_MAP[radiusKey] || '0.25rem') : '0.25rem'

    if (variant === 'circle') {
      const dim = size || '48px'
      width = dim
      height = dim
      borderRadius = '9999px'
    }
    else if (variant === 'rect') {
      height = resolveProp(props, 'height') || '200px'
      if (radiusKey) {
        borderRadius = RADIUS_MAP[radiusKey] || '0.25rem'
      }
    }

    let animationCss = ''
    if (animate === 'pulse') {
      animationCss = 'animation:stx-skeleton-pulse 1.5s ease-in-out infinite;'
    }
    else if (animate === 'wave') {
      animationCss = 'background:linear-gradient(90deg,var(--stx-skeleton-base) 25%,var(--stx-skeleton-shine) 50%,var(--stx-skeleton-base) 75%);background-size:200% 100%;animation:stx-skeleton-wave 1.5s ease-in-out infinite;'
    }

    const baseStyle = `display:block;width:${width};height:${height};border-radius:${borderRadius};background:var(--stx-skeleton-base);${animationCss}`

    const items: string[] = []
    for (let i = 0; i < count; i++) {
      items.push(`<div class="stx-skeleton" style="${baseStyle}" aria-hidden="true"></div>`)
    }

    const gap = count > 1 ? `display:flex;flex-direction:column;gap:0.5rem;` : ''
    const wrapper = count > 1
      ? `<div style="${gap}">${items.join('')}</div>`
      : items[0]

    return `${wrapper}
<style>
:root{--stx-skeleton-base:#e5e7eb;--stx-skeleton-shine:#f3f4f6}
@media(prefers-color-scheme:dark){:root{--stx-skeleton-base:#374151;--stx-skeleton-shine:#4b5563}}
@keyframes stx-skeleton-pulse{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes stx-skeleton-wave{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>`
  },
}
