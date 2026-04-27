/**
 * StxProgress Builtin Component
 *
 * Renders an accessible progress bar with optional stripes, animation,
 * indeterminate mode, and label display.
 *
 * Usage:
 *   <StxProgress value="75" max="100" color="green" />
 *   <StxProgress indeterminate color="blue" size="sm" />
 *   <StxProgress value="75" striped animated label="Uploading..." showValue />
 *
 * @module builtins/progress
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function resolveBoolProp(props: ResolvedProps, key: string): boolean {
  if (props.serverDynamic[key] !== undefined) return Boolean(props.serverDynamic[key])
  const val = props.static[key]
  if (val === true || val === '' || val === 'true') return true
  if (typeof val === 'string') return val === key
  return false
}

function resolveNumericProp(props: ResolvedProps, key: string, defaultValue: number): number {
  const raw = resolveProp(props, key)
  if (raw !== undefined) {
    const parsed = Number.parseFloat(raw)
    if (!Number.isNaN(parsed)) return parsed
  }
  return defaultValue
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  purple: '#a855f7',
}

const SIZE_MAP: Record<string, string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
}

export const StxProgressBuiltin: BuiltinComponentDef = {
  name: 'StxProgress',
  aliases: ['stx-progress'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const value = resolveNumericProp(props, 'value', 0)
    const max = resolveNumericProp(props, 'max', 100)
    const colorName = resolveProp(props, 'color') || 'blue'
    const sizeName = resolveProp(props, 'size') || 'md'
    const indeterminate = resolveBoolProp(props, 'indeterminate')
    const striped = resolveBoolProp(props, 'striped')
    const animated = resolveBoolProp(props, 'animated')
    const label = resolveProp(props, 'label')
    const showValue = resolveBoolProp(props, 'showValue')

    const barColor = COLOR_MAP[colorName] || COLOR_MAP.blue
    const height = SIZE_MAP[sizeName] || SIZE_MAP.md
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0

    const trackStyle = `position:relative;width:100%;height:${height};background:#e5e7eb;border-radius:9999px;overflow:hidden`

    let barBg = `background:${barColor};`
    if (striped || animated) {
      barBg = `background:repeating-linear-gradient(45deg,${barColor},${barColor} 10px,rgba(255,255,255,0.15) 10px,rgba(255,255,255,0.15) 20px);`
      if (animated) {
        barBg += `background-size:28.28px 100%;animation:stx-progress-stripes 1s linear infinite;`
      }
    }

    let barStyle: string
    let ariaAttrs: string

    if (indeterminate) {
      barStyle = `position:absolute;top:0;left:0;height:100%;width:30%;border-radius:9999px;${barBg}animation:stx-progress-indeterminate 1.5s ease-in-out infinite;`
      ariaAttrs = `role="progressbar" aria-valuemin="0" aria-valuemax="${max}"`
    }
    else {
      barStyle = `height:100%;width:${pct}%;border-radius:9999px;${barBg}transition:width 0.3s ease;`
      ariaAttrs = `role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}"`
    }

    let html = ''

    if (label) {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;font-size:0.875rem">`
      html += `<span>${label}</span>`
      if (showValue && !indeterminate) {
        html += `<span>${pct}%</span>`
      }
      html += `</div>`
    }
    else if (showValue && !indeterminate) {
      html += `<div style="text-align:right;font-size:0.875rem;margin-bottom:0.25rem">${pct}%</div>`
    }

    html += `<div ${ariaAttrs} style="${trackStyle}">`
    html += `<div style="${barStyle}"></div>`
    html += `</div>`

    html += `
<style>
@keyframes stx-progress-indeterminate{0%{left:-30%;width:30%}50%{width:40%}100%{left:100%;width:30%}}
@keyframes stx-progress-stripes{0%{background-position:28.28px 0}100%{background-position:0 0}}
</style>`

    return html
  },
}
