/**
 * StxSwitch Builtin Component
 *
 * Renders a toggle switch backed by a hidden checkbox, styled with CSS-only
 * transitions. Works with stx's `x-model` directive on the inner checkbox.
 *
 * Usage:
 *   <StxSwitch name="darkMode" label="Dark Mode" />
 *   <StxSwitch name="notify" size="lg" color="green" />
 *   <StxSwitch name="updates" label="Email updates" description="Receive weekly digest" />
 *
 * Props:
 *   - name — input name (also the x-model target)
 *   - label — label text
 *   - size — 'sm' | 'md' | 'lg' (default: 'md')
 *   - color — 'blue' | 'green' | 'red' | 'purple' (default: 'blue')
 *   - disabled — boolean
 *   - description — small text below the label
 *   - checked — initial checked state
 *
 * @module builtins/switch
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

const COLOR_MAP: Record<string, { on: string, darkOn: string }> = {
  blue: { on: '#2563eb', darkOn: '#3b82f6' },
  green: { on: '#16a34a', darkOn: '#22c55e' },
  red: { on: '#dc2626', darkOn: '#ef4444' },
  purple: { on: '#9333ea', darkOn: '#a855f7' },
}

const SIZE_MAP: Record<string, { track: string, thumb: string, translate: string }> = {
  sm: {
    track: 'width:36px;height:20px',
    thumb: 'width:16px;height:16px',
    translate: 'translateX(16px)',
  },
  md: {
    track: 'width:44px;height:24px',
    thumb: 'width:20px;height:20px',
    translate: 'translateX(20px)',
  },
  lg: {
    track: 'width:52px;height:28px',
    thumb: 'width:24px;height:24px',
    translate: 'translateX(24px)',
  },
}

let switchStyleId = 0

export const StxSwitchBuiltin: BuiltinComponentDef = {
  name: 'StxSwitch',
  aliases: ['stx-switch'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const name = resolveProp(props, 'name') || ''
    const label = resolveProp(props, 'label') || ''
    const description = resolveProp(props, 'description') || ''
    const size = resolveProp(props, 'size') || 'md'
    const color = resolveProp(props, 'color') || 'blue'
    const disabled = hasBooleanProp(props, 'disabled')
    const checked = hasBooleanProp(props, 'checked')

    const colorSet = COLOR_MAP[color] || COLOR_MAP.blue
    const sizeSet = SIZE_MAP[size] || SIZE_MAP.md

    const id = `stx-switch-${++switchStyleId}`

    const nameAttr = name ? ` name="${name}"` : ''
    const checkedAttr = checked ? ' checked' : ''
    const disabledAttr = disabled ? ' disabled' : ''
    const cursorStyle = disabled ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'

    const labelHtml = label || description
      ? `<span style="display:flex;flex-direction:column">${label ? `<span style="font-size:0.875rem;font-weight:500;color:#111827">${label}</span>` : ''}${description ? `<small style="font-size:0.75rem;color:#6b7280">${description}</small>` : ''}</span>`
      : ''

    return `<label class="${id}" style="display:inline-flex;align-items:center;gap:0.75rem;${cursorStyle}">
  <input type="checkbox"${nameAttr}${checkedAttr}${disabledAttr} style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" />
  <span class="${id}-track" style="position:relative;display:inline-flex;align-items:center;flex-shrink:0;${sizeSet.track};border-radius:9999px;background:#d1d5db;transition:background-color 0.2s ease">
    <span class="${id}-thumb" style="position:absolute;left:2px;${sizeSet.thumb};border-radius:9999px;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s ease"></span>
  </span>
  ${labelHtml}
</label>
<style>
.${id} input:checked + .${id}-track{background:${colorSet.on}}
.${id} input:checked + .${id}-track .${id}-thumb{transform:${sizeSet.translate}}
.${id} input:focus-visible + .${id}-track{outline:2px solid ${colorSet.on};outline-offset:2px}
@media(prefers-color-scheme:dark){
.${id} .${id}-track{background:#4b5563}
.${id} input:checked + .${id}-track{background:${colorSet.darkOn}}
.${id} span>span{color:#f3f4f6}
.${id} small{color:#9ca3af!important}
}
</style>`
  },
}
