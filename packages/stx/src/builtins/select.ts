/**
 * StxSelect Builtin Component
 *
 * Renders a styled `<select>` element with a custom chevron, label, and
 * error/hint support. Slot content passes through as `<option>` elements.
 * Works with stx's `x-model` directive.
 *
 * Usage:
 *   <StxSelect name="role" label="Role">
 *     <option value="admin">Admin</option>
 *     <option value="editor">Editor</option>
 *   </StxSelect>
 *
 * Props:
 *   - name — select name (x-model target)
 *   - label — label text
 *   - placeholder — placeholder option text (adds a disabled hidden option)
 *   - disabled — boolean
 *   - required — boolean
 *   - error — error message
 *   - hint — help text
 *   - size — 'sm' | 'md' | 'lg' (default: 'md')
 *   - multiple — boolean, enables multi-select
 *
 * @module builtins/select
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

const SIZE_STYLES: Record<string, { pad: string, font: string, label: string }> = {
  sm: { pad: 'padding:0.375rem 2rem 0.375rem 0.5rem', font: 'font-size:0.8125rem', label: 'font-size:0.75rem' },
  md: { pad: 'padding:0.5rem 2.25rem 0.5rem 0.75rem', font: 'font-size:0.875rem', label: 'font-size:0.8125rem' },
  lg: { pad: 'padding:0.625rem 2.5rem 0.625rem 1rem', font: 'font-size:1rem', label: 'font-size:0.875rem' },
}

const CHEVRON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'

let selectStyleId = 0

export const StxSelectBuiltin: BuiltinComponentDef = {
  name: 'StxSelect',
  aliases: ['stx-select'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const label = resolveProp(props, 'label') || ''
    const placeholder = resolveProp(props, 'placeholder') || ''
    const error = resolveProp(props, 'error') || ''
    const hint = resolveProp(props, 'hint') || ''
    const size = resolveProp(props, 'size') || 'md'
    const disabled = hasBooleanProp(props, 'disabled')
    const required = hasBooleanProp(props, 'required')
    const multiple = hasBooleanProp(props, 'multiple')

    const sizeSet = SIZE_STYLES[size] || SIZE_STYLES.md
    const id = `stx-select-${++selectStyleId}`
    const borderColor = error ? '#ef4444' : '#d1d5db'

    const nameAttr = name ? ` name="${name}"` : ''
    const disabledAttr = disabled ? ' disabled' : ''
    const requiredAttr = required ? ' required' : ''
    const multipleAttr = multiple ? ' multiple' : ''

    const labelHtml = label
      ? `<label style="${sizeSet.label};font-weight:500;color:#374151;margin-bottom:0.375rem;display:block">${label}${required ? '<span style="color:#ef4444;margin-left:0.125rem">*</span>' : ''}</label>`
      : ''

    const placeholderOption = placeholder
      ? `<option value="" disabled selected hidden>${placeholder}</option>`
      : ''

    const errorHtml = error
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#ef4444">${error}</p>`
      : ''

    const hintHtml = !error && hint
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#6b7280">${hint}</p>`
      : ''

    const chevronHtml = !multiple
      ? `<span style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);pointer-events:none;color:#9ca3af;display:flex;align-items:center">${CHEVRON_SVG}</span>`
      : ''

    return `<div class="${id}" style="display:flex;flex-direction:column">
  ${labelHtml}
  <div style="position:relative;display:flex;align-items:center">
    <select${nameAttr}${disabledAttr}${requiredAttr}${multipleAttr} class="${id}-field" style="width:100%;${sizeSet.pad};${sizeSet.font};border:1px solid ${borderColor};border-radius:0.375rem;background:#ffffff;color:#111827;outline:none;appearance:none;font-family:inherit;transition:border-color 0.15s,box-shadow 0.15s${disabled ? ';opacity:0.5;cursor:not-allowed' : ';cursor:pointer'}">${placeholderOption}${slotContent}</select>
    ${chevronHtml}
  </div>
  ${errorHtml}${hintHtml}
</div>
<style>
.${id}-field:focus{border-color:${error ? '#ef4444' : '#2563eb'};box-shadow:0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)'}}
@media(prefers-color-scheme:dark){
.${id}-field{background:#1f2937;color:#f3f4f6;border-color:${error ? '#ef4444' : '#4b5563'}}
.${id}-field:focus{border-color:${error ? '#ef4444' : '#3b82f6'};box-shadow:0 0 0 3px ${error ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}}
.${id} label{color:#d1d5db!important}
.${id} p{color:${error ? '#fca5a5' : '#9ca3af'}!important}
}
</style>`
  },
}
