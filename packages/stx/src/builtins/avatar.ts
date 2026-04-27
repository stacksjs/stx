/**
 * StxAvatar Builtin Component
 *
 * Renders a circular avatar with image, initials fallback, and optional
 * status indicator.
 *
 * Usage:
 *   <StxAvatar src="/photo.jpg" alt="Glenn" size="md" />
 *   <StxAvatar fallback="GT" color="indigo" />
 *   <StxAvatar src="/missing.jpg" fallback="?" status="online" />
 *
 * Props:
 *   - src — image URL
 *   - alt — alt text for image
 *   - fallback — initials text when image is absent or fails to load
 *   - size — 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   - color — background color name for fallback circle
 *   - status — 'online' | 'offline' | 'busy' | 'away' (optional dot indicator)
 *   - rounded — 'full' | 'md' | 'none' (default: 'full')
 *
 * @module builtins/avatar
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

const SIZE_MAP: Record<string, { px: number, font: string, statusSize: string }> = {
  xs: { px: 24, font: '0.625rem', statusSize: '6px' },
  sm: { px: 32, font: '0.75rem', statusSize: '8px' },
  md: { px: 40, font: '0.875rem', statusSize: '10px' },
  lg: { px: 48, font: '1rem', statusSize: '12px' },
  xl: { px: 64, font: '1.25rem', statusSize: '14px' },
}

const ROUNDED_MAP: Record<string, string> = {
  full: '9999px',
  md: '0.5rem',
  none: '0',
}

const COLOR_MAP: Record<string, { bg: string, text: string, darkBg: string, darkText: string }> = {
  gray: { bg: '#e5e7eb', text: '#374151', darkBg: '#4b5563', darkText: '#e5e7eb' },
  red: { bg: '#fecaca', text: '#991b1b', darkBg: '#7f1d1d', darkText: '#fecaca' },
  green: { bg: '#bbf7d0', text: '#166534', darkBg: '#14532d', darkText: '#bbf7d0' },
  blue: { bg: '#bfdbfe', text: '#1e40af', darkBg: '#1e3a5f', darkText: '#bfdbfe' },
  yellow: { bg: '#fef08a', text: '#854d0e', darkBg: '#713f12', darkText: '#fef08a' },
  purple: { bg: '#e9d5ff', text: '#6b21a8', darkBg: '#581c87', darkText: '#e9d5ff' },
  indigo: { bg: '#c7d2fe', text: '#3730a3', darkBg: '#312e81', darkText: '#c7d2fe' },
  pink: { bg: '#fbcfe8', text: '#9d174d', darkBg: '#831843', darkText: '#fbcfe8' },
}

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  offline: '#9ca3af',
  busy: '#ef4444',
  away: '#f59e0b',
}

let avatarStyleId = 0

export const StxAvatarBuiltin: BuiltinComponentDef = {
  name: 'StxAvatar',
  aliases: ['stx-avatar'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const src = resolveProp(props, 'src')
    const alt = resolveProp(props, 'alt') || ''
    const fallback = resolveProp(props, 'fallback') || '?'
    const size = resolveProp(props, 'size') || 'md'
    const color = resolveProp(props, 'color') || 'gray'
    const status = resolveProp(props, 'status')
    const rounded = resolveProp(props, 'rounded') || 'full'

    const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md
    const borderRadius = ROUNDED_MAP[rounded] || ROUNDED_MAP.full
    const colorConfig = COLOR_MAP[color] || COLOR_MAP.gray

    const id = `stx-avatar-${++avatarStyleId}`
    const dim = `${sizeConfig.px}px`

    const containerStyle = `position:relative;display:inline-flex;align-items:center;justify-content:center;width:${dim};height:${dim};border-radius:${borderRadius};overflow:visible;flex-shrink:0`

    let innerHtml: string

    if (src) {
      // Image avatar with onerror fallback to initials
      const fallbackEscaped = fallback.replace(/'/g, '&#39;').replace(/"/g, '&quot;')
      const imgStyle = `width:${dim};height:${dim};border-radius:${borderRadius};object-fit:cover;display:block`
      const fallbackStyle = `width:${dim};height:${dim};border-radius:${borderRadius};display:flex;align-items:center;justify-content:center;font-size:${sizeConfig.font};font-weight:600;background:${colorConfig.bg};color:${colorConfig.text}`
      innerHtml = `<img src="${src}" alt="${alt}" style="${imgStyle}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="${id}-fb" style="${fallbackStyle};display:none">${fallbackEscaped}</span>`
    }
    else {
      // Initials-only avatar
      const circleStyle = `width:${dim};height:${dim};border-radius:${borderRadius};display:flex;align-items:center;justify-content:center;font-size:${sizeConfig.font};font-weight:600;background:${colorConfig.bg};color:${colorConfig.text}`
      innerHtml = `<span class="${id}-fb" style="${circleStyle}">${fallback}</span>`
    }

    // Status dot
    let statusHtml = ''
    if (status && STATUS_COLORS[status]) {
      const dotSize = sizeConfig.statusSize
      const borderWidth = size === 'xs' ? '1.5px' : '2px'
      statusHtml = `<span style="position:absolute;bottom:0;right:0;width:${dotSize};height:${dotSize};border-radius:9999px;background:${STATUS_COLORS[status]};border:${borderWidth} solid #ffffff;box-sizing:content-box" class="${id}-status"></span>`
    }

    return `<span class="${id}" style="${containerStyle}">${innerHtml}${statusHtml}</span>
<style>
@media(prefers-color-scheme:dark){.${id}-fb{background:${colorConfig.darkBg}!important;color:${colorConfig.darkText}!important}.${id}-status{border-color:#1f2937!important}}
</style>`
  },
}
