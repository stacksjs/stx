/**
 * StxMeter Builtin Component
 *
 * Renders an accessible meter element with auto-determined color
 * based on value thresholds (low/high/optimum).
 *
 * Usage:
 *   <StxMeter value="75" min="0" max="100" low="30" high="70" label="CPU Usage" showValue />
 *
 * @module builtins/meter
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
  if (val === true || val === '' || val === 'true') return val === true || val === '' || val === 'true'
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

const METER_COLORS = {
  low: '#22c55e',
  mid: '#eab308',
  high: '#ef4444',
}

function determineMeterColor(value: number, low: number, high: number, _optimum: number): string {
  if (value <= low) return METER_COLORS.low
  if (value <= high) return METER_COLORS.mid
  return METER_COLORS.high
}

export const StxMeterBuiltin: BuiltinComponentDef = {
  name: 'StxMeter',
  aliases: ['stx-meter'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const min = resolveNumericProp(props, 'min', 0)
    const max = resolveNumericProp(props, 'max', 100)
    const value = resolveNumericProp(props, 'value', min)
    const low = resolveNumericProp(props, 'low', min + (max - min) * 0.3)
    const high = resolveNumericProp(props, 'high', min + (max - min) * 0.7)
    const optimum = resolveNumericProp(props, 'optimum', min + (max - min) * 0.5)
    const label = resolveProp(props, 'label')
    const showValue = resolveBoolProp(props, 'showValue')

    const range = max - min
    const pct = range > 0 ? Math.min(Math.max(Math.round(((value - min) / range) * 100), 0), 100) : 0
    const barColor = determineMeterColor(value, low, high, optimum)

    const trackStyle = `position:relative;width:100%;height:0.75rem;background:#e5e7eb;border-radius:9999px;overflow:hidden`
    const barStyle = `height:100%;width:${pct}%;background:${barColor};border-radius:9999px;transition:width 0.3s ease`

    const ariaAttrs = `role="meter" aria-valuenow="${value}" aria-valuemin="${min}" aria-valuemax="${max}"`

    let html = ''

    if (label || showValue) {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;font-size:0.875rem">`
      if (label) {
        html += `<span>${label}</span>`
      }
      if (showValue) {
        html += `<span>${value}</span>`
      }
      html += `</div>`
    }

    html += `<div ${ariaAttrs} style="${trackStyle}">`
    html += `<div style="${barStyle}"></div>`
    html += `</div>`

    return html
  },
}
