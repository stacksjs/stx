/**
 * StxChip Builtin Component
 *
 * Renders a chip/tag element for labels and categories. Similar to Badge
 * but with more padding, intended for tag lists and filter UIs.
 *
 * Usage:
 *   <StxChip>TypeScript</StxChip>
 *   <StxChip closable>React</StxChip>
 *   <StxChip color="blue" variant="solid">Featured</StxChip>
 *
 * Props:
 *   - color — 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' (default: 'gray')
 *   - variant — 'solid' | 'outline' | 'subtle' (default: 'subtle')
 *   - size — 'sm' | 'md' (default: 'md')
 *   - closable — boolean, shows a close (x) button
 *
 * @module builtins/chip
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
  closeHover: string
  darkCloseHover: string
}

const COLORS: Record<string, ColorSet> = {
  gray: {
    subtle: { bg: '#f3f4f6', text: '#374151', darkBg: '#374151', darkText: '#d1d5db' },
    solid: { bg: '#6b7280', text: '#ffffff', darkBg: '#9ca3af', darkText: '#111827' },
    outline: { border: '#d1d5db', text: '#374151', darkBorder: '#6b7280', darkText: '#d1d5db' },
    closeHover: '#d1d5db',
    darkCloseHover: '#4b5563',
  },
  red: {
    subtle: { bg: '#fef2f2', text: '#991b1b', darkBg: '#450a0a', darkText: '#fca5a5' },
    solid: { bg: '#dc2626', text: '#ffffff', darkBg: '#ef4444', darkText: '#ffffff' },
    outline: { border: '#fca5a5', text: '#991b1b', darkBorder: '#b91c1c', darkText: '#fca5a5' },
    closeHover: '#fecaca',
    darkCloseHover: '#7f1d1d',
  },
  green: {
    subtle: { bg: '#f0fdf4', text: '#166534', darkBg: '#052e16', darkText: '#86efac' },
    solid: { bg: '#16a34a', text: '#ffffff', darkBg: '#22c55e', darkText: '#ffffff' },
    outline: { border: '#86efac', text: '#166534', darkBorder: '#15803d', darkText: '#86efac' },
    closeHover: '#bbf7d0',
    darkCloseHover: '#14532d',
  },
  blue: {
    subtle: { bg: '#eff6ff', text: '#1e40af', darkBg: '#172554', darkText: '#93c5fd' },
    solid: { bg: '#2563eb', text: '#ffffff', darkBg: '#3b82f6', darkText: '#ffffff' },
    outline: { border: '#93c5fd', text: '#1e40af', darkBorder: '#1d4ed8', darkText: '#93c5fd' },
    closeHover: '#bfdbfe',
    darkCloseHover: '#1e3a5f',
  },
  yellow: {
    subtle: { bg: '#fefce8', text: '#854d0e', darkBg: '#422006', darkText: '#fde047' },
    solid: { bg: '#ca8a04', text: '#ffffff', darkBg: '#eab308', darkText: '#422006' },
    outline: { border: '#fde047', text: '#854d0e', darkBorder: '#a16207', darkText: '#fde047' },
    closeHover: '#fef08a',
    darkCloseHover: '#713f12',
  },
  purple: {
    subtle: { bg: '#faf5ff', text: '#6b21a8', darkBg: '#3b0764', darkText: '#d8b4fe' },
    solid: { bg: '#9333ea', text: '#ffffff', darkBg: '#a855f7', darkText: '#ffffff' },
    outline: { border: '#d8b4fe', text: '#6b21a8', darkBorder: '#7e22ce', darkText: '#d8b4fe' },
    closeHover: '#e9d5ff',
    darkCloseHover: '#581c87',
  },
}

const SIZE_STYLES: Record<string, string> = {
  sm: 'font-size:0.75rem;padding:0.25rem 0.625rem;line-height:1.125rem',
  md: 'font-size:0.8125rem;padding:0.375rem 0.75rem;line-height:1.25rem',
}

let chipStyleId = 0

export const StxChipBuiltin: BuiltinComponentDef = {
  name: 'StxChip',
  aliases: ['stx-chip'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const color = resolveProp(props, 'color') || 'gray'
    const variant = resolveProp(props, 'variant') || 'subtle'
    const size = resolveProp(props, 'size') || 'md'
    const closable = hasBooleanProp(props, 'closable')

    const colorSet = COLORS[color] || COLORS.gray
    const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md

    const id = `stx-chip-${++chipStyleId}`

    let baseStyle = `display:inline-flex;align-items:center;gap:0.375rem;border-radius:9999px;font-weight:500;white-space:nowrap;cursor:default;${sizeStyle}`
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

    const closeButtonHtml = closable
      ? `<span class="${id}-close" data-stx-chip-close role="button" aria-label="Remove" style="display:inline-flex;align-items:center;justify-content:center;width:1rem;height:1rem;border-radius:9999px;cursor:pointer;margin-left:-0.125rem;font-size:0.75rem;line-height:1;opacity:0.7;transition:opacity 0.15s,background 0.15s">&times;</span>`
      : ''

    return `<span class="${id}" style="${baseStyle}">${slotContent}${closeButtonHtml}</span>
<style>
@media(prefers-color-scheme:dark){.${id}{${darkOverrides}}.${id}-close:hover{background:${colorSet.darkCloseHover}}}
.${id}-close:hover{opacity:1;background:${colorSet.closeHover}}
</style>`
  },
}
