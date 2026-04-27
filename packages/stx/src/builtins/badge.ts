/**
 * StxBadge Builtin Component
 *
 * Renders an inline badge/label span with color and variant support.
 *
 * Usage:
 *   <StxBadge>New</StxBadge>
 *   <StxBadge color="red" variant="outline">Critical</StxBadge>
 *   <StxBadge color="green" dot>Active</StxBadge>
 *
 * Props:
 *   - color — 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' (default: 'gray')
 *   - variant — 'solid' | 'outline' | 'subtle' (default: 'subtle')
 *   - size — 'xs' | 'sm' | 'md' (default: 'sm')
 *   - dot — boolean, shows a leading colored dot
 *
 * @module builtins/badge
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

interface ColorSet {
  subtle: { bg: string, text: string, darkBg: string, darkText: string }
  solid: { bg: string, text: string, darkBg: string, darkText: string }
  outline: { border: string, text: string, darkBorder: string, darkText: string }
  dot: string
}

const COLORS: Record<string, ColorSet> = {
  gray: {
    subtle: { bg: '#f3f4f6', text: '#374151', darkBg: '#374151', darkText: '#d1d5db' },
    solid: { bg: '#6b7280', text: '#ffffff', darkBg: '#9ca3af', darkText: '#111827' },
    outline: { border: '#d1d5db', text: '#374151', darkBorder: '#6b7280', darkText: '#d1d5db' },
    dot: '#6b7280',
  },
  red: {
    subtle: { bg: '#fef2f2', text: '#991b1b', darkBg: '#450a0a', darkText: '#fca5a5' },
    solid: { bg: '#dc2626', text: '#ffffff', darkBg: '#ef4444', darkText: '#ffffff' },
    outline: { border: '#fca5a5', text: '#991b1b', darkBorder: '#b91c1c', darkText: '#fca5a5' },
    dot: '#dc2626',
  },
  green: {
    subtle: { bg: '#f0fdf4', text: '#166534', darkBg: '#052e16', darkText: '#86efac' },
    solid: { bg: '#16a34a', text: '#ffffff', darkBg: '#22c55e', darkText: '#ffffff' },
    outline: { border: '#86efac', text: '#166534', darkBorder: '#15803d', darkText: '#86efac' },
    dot: '#16a34a',
  },
  blue: {
    subtle: { bg: '#eff6ff', text: '#1e40af', darkBg: '#172554', darkText: '#93c5fd' },
    solid: { bg: '#2563eb', text: '#ffffff', darkBg: '#3b82f6', darkText: '#ffffff' },
    outline: { border: '#93c5fd', text: '#1e40af', darkBorder: '#1d4ed8', darkText: '#93c5fd' },
    dot: '#2563eb',
  },
  yellow: {
    subtle: { bg: '#fefce8', text: '#854d0e', darkBg: '#422006', darkText: '#fde047' },
    solid: { bg: '#ca8a04', text: '#ffffff', darkBg: '#eab308', darkText: '#422006' },
    outline: { border: '#fde047', text: '#854d0e', darkBorder: '#a16207', darkText: '#fde047' },
    dot: '#ca8a04',
  },
  purple: {
    subtle: { bg: '#faf5ff', text: '#6b21a8', darkBg: '#3b0764', darkText: '#d8b4fe' },
    solid: { bg: '#9333ea', text: '#ffffff', darkBg: '#a855f7', darkText: '#ffffff' },
    outline: { border: '#d8b4fe', text: '#6b21a8', darkBorder: '#7e22ce', darkText: '#d8b4fe' },
    dot: '#9333ea',
  },
}

const SIZE_STYLES: Record<string, string> = {
  xs: 'font-size:0.625rem;padding:0.0625rem 0.375rem;line-height:1rem',
  sm: 'font-size:0.75rem;padding:0.125rem 0.5rem;line-height:1.125rem',
  md: 'font-size:0.8125rem;padding:0.1875rem 0.625rem;line-height:1.25rem',
}

let badgeStyleId = 0

export const StxBadgeBuiltin: BuiltinComponentDef = {
  name: 'StxBadge',
  aliases: ['stx-badge'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const color = resolveProp(props, 'color') || 'gray'
    const variant = resolveProp(props, 'variant') || 'subtle'
    const size = resolveProp(props, 'size') || 'sm'
    const showDot = hasBooleanProp(props, 'dot')

    const colorSet = COLORS[color] || COLORS.gray
    const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm

    const id = `stx-badge-${++badgeStyleId}`

    let baseStyle = `display:inline-flex;align-items:center;gap:0.25rem;border-radius:9999px;font-weight:500;white-space:nowrap;${sizeStyle}`
    let darkOverrides = ''

    if (variant === 'solid') {
      const s = colorSet.solid
      baseStyle += `;background:${s.bg};color:${s.text}`
      darkOverrides = `background:${s.darkBg};color:${s.darkText}`
    }
    else if (variant === 'outline') {
      const s = colorSet.outline
      baseStyle += `;background:transparent;color:${s.text};border:1px solid ${s.border}`
      darkOverrides = `color:${s.darkText};border-color:${s.darkBorder}`
    }
    else {
      // subtle (default)
      const s = colorSet.subtle
      baseStyle += `;background:${s.bg};color:${s.text}`
      darkOverrides = `background:${s.darkBg};color:${s.darkText}`
    }

    const dotHtml = showDot
      ? `<span style="display:inline-block;width:0.375rem;height:0.375rem;border-radius:9999px;background:${colorSet.dot};flex-shrink:0"></span>`
      : ''

    return `<span class="${id}" style="${baseStyle}">${dotHtml}${slotContent}</span>
<style>
@media(prefers-color-scheme:dark){.${id}{${darkOverrides}}}
</style>`
  },
}
