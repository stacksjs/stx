/**
 * StxTextarea Builtin Component
 *
 * Renders a styled textarea with label, error/hint text, and optional
 * character count. Works with stx's `x-model` directive.
 *
 * Usage:
 *   <StxTextarea name="bio" label="Bio" rows="4" placeholder="Tell us about yourself" />
 *   <StxTextarea name="notes" maxlength="500" hint="Keep it brief" />
 *
 * Props:
 *   - name — textarea name (x-model target)
 *   - label — label text
 *   - rows — number of rows (default: 3)
 *   - placeholder — placeholder text
 *   - maxlength — maximum character count (shows counter)
 *   - disabled — boolean
 *   - required — boolean
 *   - error — error message
 *   - hint — help text
 *   - size — 'sm' | 'md' | 'lg' (default: 'md')
 *
 * @module builtins/textarea
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
  sm: { pad: 'padding:0.375rem 0.5rem', font: 'font-size:0.8125rem', label: 'font-size:0.75rem' },
  md: { pad: 'padding:0.5rem 0.75rem', font: 'font-size:0.875rem', label: 'font-size:0.8125rem' },
  lg: { pad: 'padding:0.625rem 1rem', font: 'font-size:1rem', label: 'font-size:0.875rem' },
}

let textareaStyleId = 0

export const StxTextareaBuiltin: BuiltinComponentDef = {
  name: 'StxTextarea',
  aliases: ['stx-textarea'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const label = resolveProp(props, 'label') || ''
    const rows = resolveProp(props, 'rows') || '3'
    const placeholder = resolveProp(props, 'placeholder') || ''
    const maxlength = resolveProp(props, 'maxlength') || ''
    const error = resolveProp(props, 'error') || ''
    const hint = resolveProp(props, 'hint') || ''
    const size = resolveProp(props, 'size') || 'md'
    const disabled = hasBooleanProp(props, 'disabled')
    const required = hasBooleanProp(props, 'required')

    const sizeSet = SIZE_STYLES[size] || SIZE_STYLES.md
    const id = `stx-textarea-${++textareaStyleId}`
    const borderColor = error ? '#ef4444' : '#d1d5db'

    const nameAttr = name ? ` name="${name}"` : ''
    const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : ''
    const maxlengthAttr = maxlength ? ` maxlength="${maxlength}"` : ''
    const disabledAttr = disabled ? ' disabled' : ''
    const requiredAttr = required ? ' required' : ''

    const labelHtml = label
      ? `<label style="${sizeSet.label};font-weight:500;color:#374151;margin-bottom:0.375rem;display:block">${label}${required ? '<span style="color:#ef4444;margin-left:0.125rem">*</span>' : ''}</label>`
      : ''

    const errorHtml = error
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#ef4444">${error}</p>`
      : ''

    const hintHtml = !error && hint
      ? `<p style="margin:0.25rem 0 0;font-size:0.75rem;color:#6b7280">${hint}</p>`
      : ''

    const counterHtml = maxlength
      ? `<span class="${id}-counter" style="display:block;text-align:right;font-size:0.75rem;color:#9ca3af;margin-top:0.125rem">0 / ${maxlength}</span>
<script>
(function(){
  var ta=document.querySelector('.${id}-field');
  var counter=document.querySelector('.${id}-counter');
  if(ta&&counter){ta.addEventListener('input',function(){counter.textContent=ta.value.length+' / ${maxlength}'});}
})();
</script>`
      : ''

    return `<div class="${id}" style="display:flex;flex-direction:column">
  ${labelHtml}
  <textarea${nameAttr}${placeholderAttr}${maxlengthAttr}${disabledAttr}${requiredAttr} rows="${rows}" class="${id}-field" style="width:100%;${sizeSet.pad};${sizeSet.font};border:1px solid ${borderColor};border-radius:0.375rem;background:#ffffff;color:#111827;outline:none;resize:vertical;font-family:inherit;transition:border-color 0.15s,box-shadow 0.15s${disabled ? ';opacity:0.5;cursor:not-allowed' : ''}"></textarea>
  ${counterHtml}
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
.${id}-counter{color:#6b7280!important}
}
</style>`
  },
}
