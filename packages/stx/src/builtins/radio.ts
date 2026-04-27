/**
 * StxRadioGroup + StxRadio Builtin Components
 *
 * StxRadioGroup renders a fieldset with a group label. It parses
 * `<StxRadio>` items from its slot content and renders styled radio
 * inputs. Works with stx's `x-model` directive on the radio inputs.
 *
 * Usage:
 *   <StxRadioGroup name="plan" label="Plan">
 *     <StxRadio value="free" label="Free" description="Basic features" />
 *     <StxRadio value="pro" label="Pro" description="All features" />
 *   </StxRadioGroup>
 *
 * StxRadioGroup Props:
 *   - name — radio group name (x-model target)
 *   - label — group label text
 *   - required — boolean
 *
 * StxRadio Props (parsed from slot):
 *   - value — radio value
 *   - label — label text
 *   - description — small text below label
 *   - disabled — boolean
 *   - checked — initial checked state
 *
 * @module builtins/radio
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

interface RadioItem {
  value: string
  label: string
  description: string
  disabled: boolean
  checked: boolean
}

function parseRadioItems(slotContent: string): RadioItem[] {
  const items: RadioItem[] = []
  // Match both self-closing and open/close StxRadio tags
  const regex = /<StxRadio\s([^>]*?)\/?>(?:<\/StxRadio>)?/gi
  let match

  while ((match = regex.exec(slotContent)) !== null) {
    const attrs = match[1] || ''
    const getValue = (name: string): string => {
      const attrMatch = new RegExp(`${name}="([^"]*)"`, 'i').exec(attrs)
      return attrMatch ? attrMatch[1] : ''
    }
    const hasFlag = (name: string): boolean => {
      // Check for name="true", name="", or bare name attribute
      return new RegExp(`(?:^|\\s)${name}(?:="[^"]*"|(?=\\s|$|\\/>))`, 'i').test(attrs)
    }

    items.push({
      value: getValue('value'),
      label: getValue('label'),
      description: getValue('description'),
      disabled: hasFlag('disabled'),
      checked: hasFlag('checked'),
    })
  }

  return items
}

let radioGroupStyleId = 0

export const StxRadioGroupBuiltin: BuiltinComponentDef = {
  name: 'StxRadioGroup',
  aliases: ['stx-radio-group'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const label = resolveProp(props, 'label') || ''
    const required = hasBooleanProp(props, 'required')

    const id = `stx-radio-${++radioGroupStyleId}`
    const items = parseRadioItems(slotContent)

    const legendHtml = label
      ? `<legend style="font-size:0.8125rem;font-weight:500;color:#374151;margin-bottom:0.5rem;padding:0">${label}${required ? '<span style="color:#ef4444;margin-left:0.125rem">*</span>' : ''}</legend>`
      : ''

    const itemsHtml = items.map((item) => {
      const nameAttr = name ? ` name="${name}"` : ''
      const valueAttr = item.value ? ` value="${item.value}"` : ''
      const checkedAttr = item.checked ? ' checked' : ''
      const disabledAttr = item.disabled ? ' disabled' : ''
      const cursorStyle = item.disabled ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'

      const itemLabel = item.label || item.description
        ? `<span style="display:flex;flex-direction:column"><span style="font-size:0.875rem;font-weight:500;color:#111827">${item.label}</span>${item.description ? `<small style="font-size:0.75rem;color:#6b7280">${item.description}</small>` : ''}</span>`
        : ''

      return `<label class="${id}-item" style="display:inline-flex;align-items:flex-start;gap:0.5rem;${cursorStyle}">
  <input type="radio"${nameAttr}${valueAttr}${checkedAttr}${disabledAttr} style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" />
  <span class="${id}-dot" style="display:inline-flex;align-items:center;justify-content:center;width:1.125rem;height:1.125rem;flex-shrink:0;border:2px solid #d1d5db;border-radius:9999px;background:#ffffff;transition:border-color 0.15s;margin-top:0.0625rem">
    <span class="${id}-inner" style="display:none;width:0.5rem;height:0.5rem;border-radius:9999px;background:#2563eb"></span>
  </span>
  ${itemLabel}
</label>`
    }).join('\n')

    return `<fieldset class="${id}" style="border:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.5rem">
  ${legendHtml}
  ${itemsHtml}
</fieldset>
<style>
.${id}-item input:checked + .${id}-dot{border-color:#2563eb}
.${id}-item input:checked + .${id}-dot .${id}-inner{display:block}
.${id}-item input:focus-visible + .${id}-dot{outline:2px solid #2563eb;outline-offset:2px}
@media(prefers-color-scheme:dark){
.${id}-dot{background:#1f2937;border-color:#4b5563}
.${id}-item input:checked + .${id}-dot{border-color:#3b82f6}
.${id}-inner{background:#3b82f6!important}
.${id} legend{color:#d1d5db!important}
.${id}-item span>span{color:#f3f4f6}
.${id}-item small{color:#9ca3af!important}
}
</style>`
  },
}

/**
 * StxRadio is a no-op builtin. It is only meaningful inside StxRadioGroup
 * which parses it from slot content. If used standalone, it renders nothing.
 */
export const StxRadioBuiltin: BuiltinComponentDef = {
  name: 'StxRadio',
  aliases: ['stx-radio'],

  render(_props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    // StxRadio items are parsed by StxRadioGroup; standalone use renders nothing
    return ''
  },
}
