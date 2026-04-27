/**
 * StxCheckbox Builtin Component
 *
 * Renders a styled checkbox with a custom checkmark via CSS. The native
 * checkbox is visually hidden and a styled box is shown. Works with stx's
 * `x-model` directive.
 *
 * Usage:
 *   <StxCheckbox name="terms" label="I agree to the terms" required />
 *   <StxCheckbox name="newsletter" label="Subscribe" description="Weekly digest" color="green" />
 *
 * Props:
 *   - name — input name (x-model target)
 *   - label — label text
 *   - description — small text below label
 *   - disabled — boolean
 *   - required — boolean
 *   - color — 'blue' | 'green' | 'red' | 'purple' (default: 'blue')
 *   - checked — initial checked state
 *
 * @module builtins/checkbox
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

const COLOR_MAP: Record<string, { bg: string, darkBg: string, ring: string }> = {
  blue: { bg: '#2563eb', darkBg: '#3b82f6', ring: 'rgba(37,99,235,0.3)' },
  green: { bg: '#16a34a', darkBg: '#22c55e', ring: 'rgba(22,163,74,0.3)' },
  red: { bg: '#dc2626', darkBg: '#ef4444', ring: 'rgba(220,38,38,0.3)' },
  purple: { bg: '#9333ea', darkBg: '#a855f7', ring: 'rgba(147,51,234,0.3)' },
}

let checkboxStyleId = 0

export const StxCheckboxBuiltin: BuiltinComponentDef = {
  name: 'StxCheckbox',
  aliases: ['stx-checkbox'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const label = resolveProp(props, 'label') || ''
    const description = resolveProp(props, 'description') || ''
    const color = resolveProp(props, 'color') || 'blue'
    const disabled = hasBooleanProp(props, 'disabled')
    const required = hasBooleanProp(props, 'required')
    const checked = hasBooleanProp(props, 'checked')

    const colorSet = COLOR_MAP[color] || COLOR_MAP.blue
    const id = `stx-checkbox-${++checkboxStyleId}`

    const nameAttr = name ? ` name="${name}"` : ''
    const checkedAttr = checked ? ' checked' : ''
    const disabledAttr = disabled ? ' disabled' : ''
    const requiredAttr = required ? ' required' : ''
    const cursorStyle = disabled ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'

    const labelHtml = label || description
      ? `<span style="display:flex;flex-direction:column"><span style="font-size:0.875rem;font-weight:500;color:#111827">${label}${required ? '<span style="color:#ef4444;margin-left:0.125rem">*</span>' : ''}</span>${description ? `<small style="font-size:0.75rem;color:#6b7280">${description}</small>` : ''}</span>`
      : ''

    // Checkmark SVG path
    const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

    return `<label class="${id}" style="display:inline-flex;align-items:flex-start;gap:0.5rem;${cursorStyle}">
  <input type="checkbox"${nameAttr}${checkedAttr}${disabledAttr}${requiredAttr} style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" />
  <span class="${id}-box" style="display:inline-flex;align-items:center;justify-content:center;width:1.125rem;height:1.125rem;flex-shrink:0;border:2px solid #d1d5db;border-radius:0.25rem;background:#ffffff;transition:background-color 0.15s,border-color 0.15s;margin-top:0.0625rem">
    <span class="${id}-check" style="display:none;line-height:0">${checkSvg}</span>
  </span>
  ${labelHtml}
</label>
<style>
.${id} input:checked + .${id}-box{background:${colorSet.bg};border-color:${colorSet.bg}}
.${id} input:checked + .${id}-box .${id}-check{display:inline-flex}
.${id} input:focus-visible + .${id}-box{outline:2px solid ${colorSet.bg};outline-offset:2px}
@media(prefers-color-scheme:dark){
.${id}-box{background:#1f2937;border-color:#4b5563}
.${id} input:checked + .${id}-box{background:${colorSet.darkBg};border-color:${colorSet.darkBg}}
.${id} span>span{color:#f3f4f6}
.${id} small{color:#9ca3af!important}
}
</style>`
  },
}
