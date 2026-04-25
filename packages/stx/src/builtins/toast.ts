/**
 * StxToast Builtin Component
 *
 * Renders a fixed-position toast notification container. The runtime
 * `toast()` global (success / error / info / warning / dismiss) creates
 * and animates individual toast elements inside this container.
 *
 * Usage:
 *   <StxToast />
 *   <StxToast position="top-right" max="5" />
 *   <StxToast position="bottom-left" />
 *
 * Positions: top-right (default), top-left, top-center,
 *            bottom-right, bottom-left, bottom-center
 *
 * @module builtins/toast
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function resolveNumericProp(props: ResolvedProps, key: string, defaultValue: number): number {
  const raw = resolveProp(props, key)
  if (raw !== undefined) {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed)) return parsed
  }
  return defaultValue
}

const POSITION_STYLES: Record<string, string> = {
  'top-right': 'top:1rem;right:1rem',
  'top-left': 'top:1rem;left:1rem',
  'top-center': 'top:1rem;left:50%;transform:translateX(-50%)',
  'bottom-right': 'bottom:1rem;right:1rem',
  'bottom-left': 'bottom:1rem;left:1rem',
  'bottom-center': 'bottom:1rem;left:50%;transform:translateX(-50%)',
}

export const StxToastBuiltin: BuiltinComponentDef = {
  name: 'StxToast',
  aliases: ['stx-toast'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const position = resolveProp(props, 'position') || 'top-right'
    const max = resolveNumericProp(props, 'max', 5)

    const posStyle = POSITION_STYLES[position] || POSITION_STYLES['top-right']

    return `<div id="stx-toast-container" data-stx-toast-position="${position}" data-stx-toast-max="${max}" style="position:fixed;${posStyle};z-index:999999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;max-width:24rem;width:100%"></div>
<style>
@keyframes stx-toast-in{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes stx-toast-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100%)}}
@keyframes stx-toast-in-left{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
@keyframes stx-toast-out-left{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
@keyframes stx-toast-in-center{from{opacity:0;transform:translateY(-1rem)}to{opacity:1;transform:translateY(0)}}
@keyframes stx-toast-out-center{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-1rem)}}
</style>`
  },
}
