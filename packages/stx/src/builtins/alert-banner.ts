/**
 * StxAlert Builtin Component
 *
 * Renders an inline alert/banner with type-based styling, optional title,
 * close button, and variant support.
 *
 * Usage:
 *   <StxAlert type="info" title="Note">This feature is in beta.</StxAlert>
 *   <StxAlert type="warning" closable>Your trial expires in 3 days.</StxAlert>
 *   <StxAlert type="error">Failed to connect.</StxAlert>
 *   <StxAlert type="success" title="Deployed!" variant="filled">Your changes are live.</StxAlert>
 *
 * Props:
 *   - type — 'info' | 'warning' | 'error' | 'success' (default: 'info')
 *   - title — optional heading text
 *   - closable — whether to show a close button (boolean attribute)
 *   - variant — 'subtle' | 'filled' | 'outline' (default: 'subtle')
 *   - icon — custom icon HTML override
 *
 * @module builtins/alert-banner
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function hasBooleanProp(props: ResolvedProps, key: string): boolean {
  if (props.static[key] === true) return true
  if (props.static[key] === '' || props.static[key] === 'true') return true
  if (props.serverDynamic[key] !== undefined) return !!props.serverDynamic[key]
  return false
}

/* Lucide-style 20x20 SVG icons per alert type */
const TYPE_ICONS: Record<string, string> = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
}

/* Color tokens for each type: [border, subtle-bg, subtle-text, filled-bg, filled-text, icon-color] */
interface TypeColors {
  border: string
  subtleBg: string
  subtleText: string
  filledBg: string
  filledText: string
  icon: string
  darkSubtleBg: string
  darkSubtleText: string
  darkBorder: string
}

const TYPE_COLORS: Record<string, TypeColors> = {
  info: {
    border: '#3b82f6',
    subtleBg: '#eff6ff',
    subtleText: '#1e40af',
    filledBg: '#3b82f6',
    filledText: '#ffffff',
    icon: '#3b82f6',
    darkSubtleBg: 'rgba(59,130,246,0.15)',
    darkSubtleText: '#93bbfd',
    darkBorder: '#2563eb',
  },
  warning: {
    border: '#f59e0b',
    subtleBg: '#fffbeb',
    subtleText: '#92400e',
    filledBg: '#f59e0b',
    filledText: '#ffffff',
    icon: '#f59e0b',
    darkSubtleBg: 'rgba(245,158,11,0.15)',
    darkSubtleText: '#fbbf24',
    darkBorder: '#d97706',
  },
  error: {
    border: '#ef4444',
    subtleBg: '#fef2f2',
    subtleText: '#991b1b',
    filledBg: '#ef4444',
    filledText: '#ffffff',
    icon: '#ef4444',
    darkSubtleBg: 'rgba(239,68,68,0.15)',
    darkSubtleText: '#fca5a5',
    darkBorder: '#dc2626',
  },
  success: {
    border: '#22c55e',
    subtleBg: '#f0fdf4',
    subtleText: '#166534',
    filledBg: '#22c55e',
    filledText: '#ffffff',
    icon: '#22c55e',
    darkSubtleBg: 'rgba(34,197,94,0.15)',
    darkSubtleText: '#86efac',
    darkBorder: '#16a34a',
  },
}

let alertCounter = 0

export const StxAlertBannerBuiltin: BuiltinComponentDef = {
  name: 'StxAlert',
  aliases: ['stx-alert'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const type = resolveProp(props, 'type') || 'info'
    const title = resolveProp(props, 'title')
    const closable = hasBooleanProp(props, 'closable')
    const variant = resolveProp(props, 'variant') || 'subtle'
    const customIcon = resolveProp(props, 'icon')

    const colors = TYPE_COLORS[type] || TYPE_COLORS.info
    const iconHtml = customIcon || TYPE_ICONS[type] || TYPE_ICONS.info

    const alertId = `stx-alert-${++alertCounter}`

    // Build variant-specific styles
    let bgStyle: string
    let textStyle: string
    let borderStyle: string

    if (variant === 'filled') {
      bgStyle = `background:${colors.filledBg}`
      textStyle = `color:${colors.filledText}`
      borderStyle = `border-left:4px solid rgba(255,255,255,0.3)`
    }
    else if (variant === 'outline') {
      bgStyle = 'background:transparent'
      textStyle = `color:${colors.subtleText}`
      borderStyle = `border:1px solid ${colors.border};border-left:4px solid ${colors.border}`
    }
    else {
      // subtle (default)
      bgStyle = `background:${colors.subtleBg}`
      textStyle = `color:${colors.subtleText}`
      borderStyle = `border-left:4px solid ${colors.border}`
    }

    const titleHtml = title
      ? `<div style="font-weight:600;margin-bottom:0.25rem">${title}</div>`
      : ''

    const closeButtonHtml = closable
      ? `<button onclick="this.closest('[role=alert]').style.display='none'" style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0.25rem;margin:-0.25rem -0.25rem -0.25rem 0.5rem;color:inherit;opacity:0.6;line-height:1" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
      : ''

    const iconColor = variant === 'filled' ? colors.filledText : colors.icon

    return `<div id="${alertId}" role="alert" data-stx-alert="${type}" data-stx-alert-variant="${variant}" style="${bgStyle};${textStyle};${borderStyle};border-radius:0.5rem;padding:0.875rem 1rem;display:flex;align-items:flex-start;gap:0.75rem;font-size:0.875rem;line-height:1.5">
  <div style="color:${iconColor};margin-top:0.125rem">${iconHtml}</div>
  <div style="flex:1;min-width:0">${titleHtml}<div>${slotContent}</div></div>${closeButtonHtml}
</div>
<style>
@media(prefers-color-scheme:dark){#${alertId}[data-stx-alert-variant="subtle"]{background:${colors.darkSubtleBg}!important;color:${colors.darkSubtleText}!important;border-left-color:${colors.darkBorder}!important}#${alertId}[data-stx-alert-variant="outline"]{color:${colors.darkSubtleText}!important;border-color:${colors.darkBorder}!important;border-left-color:${colors.darkBorder}!important}}
</style>`
  },
}
