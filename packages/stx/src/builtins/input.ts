/**
 * StxInput Builtin Component
 *
 * Renders a styled text input with label, error/hint text, optional icon,
 * and clearable button. Works with stx's `x-model` directive.
 *
 * Usage:
 *   <StxInput name="email" type="email" label="Email" placeholder="you@example.com" />
 *   <StxInput name="search" icon="search" clearable />
 *
 * Props:
 *   - name — input name (x-model target)
 *   - type — 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' (default: 'text')
 *   - label — label text
 *   - placeholder — placeholder text
 *   - disabled — boolean
 *   - required — boolean
 *   - error — error message (shows red border + text)
 *   - hint — help text
 *   - size — 'sm' | 'md' | 'lg' (default: 'md')
 *   - icon — left icon name (renders a small SVG)
 *   - clearable — boolean, shows a clear button
 *
 * @module builtins/input
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

const ICON_SVGS: Record<string, string> = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  email: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
}

const SIZE_STYLES: Record<string, { input: string, font: string, label: string }> = {
  sm: { input: 'padding:0.375rem 0.5rem', font: 'font-size:0.8125rem', label: 'font-size:0.75rem' },
  md: { input: 'padding:0.5rem 0.75rem', font: 'font-size:0.875rem', label: 'font-size:0.8125rem' },
  lg: { input: 'padding:0.625rem 1rem', font: 'font-size:1rem', label: 'font-size:0.875rem' },
}

let inputStyleId = 0

export const StxInputBuiltin: BuiltinComponentDef = {
  name: 'StxInput',
  aliases: ['stx-input'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const type = resolveProp(props, 'type') || 'text'
    const label = resolveProp(props, 'label') || ''
    const placeholder = resolveProp(props, 'placeholder') || ''
    const error = resolveProp(props, 'error') || ''
    const hint = resolveProp(props, 'hint') || ''
    const size = resolveProp(props, 'size') || 'md'
    const icon = resolveProp(props, 'icon') || ''
    const disabled = hasBooleanProp(props, 'disabled')
    const required = hasBooleanProp(props, 'required')
    const clearable = hasBooleanProp(props, 'clearable')

    const sizeSet = SIZE_STYLES[size] || SIZE_STYLES.md
    const id = `stx-input-${++inputStyleId}`

    const borderColor = error ? '#ef4444' : '#d1d5db'
    const hasIcon = icon && ICON_SVGS[icon]
    const leftPad = hasIcon ? 'padding-left:2.25rem' : ''

    const nameAttr = name ? ` name="${name}"` : ''
    const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : ''
    const disabledAttr = disabled ? ' disabled' : ''
    const requiredAttr = required ? ' required' : ''

    const labelHtml = label
      ? `<label style="${sizeSet.label};font-weight:500;color:#374151;margin-bottom:0.375rem;display:block">${label}${required ? '<span style="color:#ef4444;margin-left:0.125rem">*</span>' : ''}</label>`
      : ''

    const iconHtml = hasIcon
      ? `<span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;display:flex;align-items:center">${ICON_SVGS[icon]}</span>`
      : ''

    const clearBtn = clearable
      ? `<button type="button" class="${id}-clear" style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:0.25rem;display:flex;align-items:center" onclick="this.previousElementSibling.value='';this.previousElementSibling.dispatchEvent(new Event('input',{bubbles:true}))"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
      : ''

    const errorHtml = error
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#ef4444">${error}</p>`
      : ''

    const hintHtml = !error && hint
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#6b7280">${hint}</p>`
      : ''

    return `<div class="${id}" style="display:flex;flex-direction:column">
  ${labelHtml}
  <div style="position:relative;display:flex;align-items:center">
    ${iconHtml}
    <input type="${type}"${nameAttr}${placeholderAttr}${disabledAttr}${requiredAttr} class="${id}-field" style="width:100%;${sizeSet.input};${sizeSet.font};${leftPad};border:1px solid ${borderColor};border-radius:0.375rem;background:#ffffff;color:#111827;outline:none;transition:border-color 0.15s,box-shadow 0.15s${disabled ? ';opacity:0.5;cursor:not-allowed' : ''}" />
    ${clearBtn}
  </div>
  ${errorHtml}${hintHtml}
</div>
<style>
.${id}-field:focus{border-color:${error ? '#ef4444' : '#2563eb'};box-shadow:0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)'}}
.${id}-field::placeholder{color:#9ca3af}
@media(prefers-color-scheme:dark){
.${id}-field{background:#1f2937;color:#f3f4f6;border-color:${error ? '#ef4444' : '#4b5563'}}
.${id}-field:focus{border-color:${error ? '#ef4444' : '#3b82f6'};box-shadow:0 0 0 3px ${error ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}}
.${id} label{color:#d1d5db!important}
.${id} p{color:${error ? '#fca5a5' : '#9ca3af'}!important}
}
</style>`
  },
}
