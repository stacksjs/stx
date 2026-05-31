/**
 * StxDrawer Builtin Component
 *
 * Renders a hidden slide-in panel with slot content. Opened/closed via
 * the runtime `drawer.open(id)` / `drawer.close(id)` / `drawer.toggle(id)` globals.
 *
 * Usage:
 *   <StxDrawer id="settings" side="right" size="md">
 *     <h2>Settings</h2>
 *     <p>Drawer content here</p>
 *   </StxDrawer>
 *
 * Props:
 *   - id (required) — unique drawer identifier
 *   - side — 'left' | 'right' (default: 'right')
 *   - size — 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   - closeOnBackdrop — whether clicking backdrop closes drawer (default: true)
 *   - closeOnEscape — whether Escape key closes drawer (default: true)
 *   - overlay — whether to show backdrop overlay (default: true)
 *
 * @module builtins/drawer
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'
import { escapeAttr } from './escape'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

const SIZE_WIDTHS: Record<string, string> = {
  sm: '16rem',
  md: '24rem',
  lg: '32rem',
  xl: '40rem',
}

export const StxDrawerBuiltin: BuiltinComponentDef = {
  name: 'StxDrawer',
  aliases: ['stx-drawer'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const rawId = resolveProp(props, 'id')
    if (!rawId) {
      console.warn('[stx] <StxDrawer> requires an "id" prop')
      return '<!-- StxDrawer: missing id prop -->'
    }
    const id = escapeAttr(rawId)

    const side = resolveProp(props, 'side') || 'right'
    const size = resolveProp(props, 'size') || 'md'
    const closeOnBackdrop = resolveProp(props, 'closeOnBackdrop') !== 'false'
    const closeOnEscape = resolveProp(props, 'closeOnEscape') !== 'false'
    const overlay = resolveProp(props, 'overlay') !== 'false'
    const width = SIZE_WIDTHS[size] || SIZE_WIDTHS.md

    const isLeft = side === 'left'
    const positionStyle = isLeft ? 'left:0' : 'right:0'
    const translateHidden = isLeft ? 'translateX(-100%)' : 'translateX(100%)'
    const animName = isLeft ? 'stx-drawer-slide-left' : 'stx-drawer-slide-right'

    const backdropBg = overlay ? 'background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)' : 'background:transparent;pointer-events:none'

    return `<div id="stx-drawer-${id}" class="stx-drawer-backdrop" data-stx-drawer="${id}" data-close-backdrop="${closeOnBackdrop}" data-close-escape="${closeOnEscape}" style="display:none;position:fixed;inset:0;z-index:99999;${backdropBg};opacity:0;transition:opacity 0.2s ease" role="dialog" aria-modal="true">
  <div class="stx-drawer-panel" style="position:fixed;top:0;bottom:0;${positionStyle};width:${width};max-width:100vw;transform:${translateHidden};transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);background:var(--stx-drawer-bg,#fff);color:var(--stx-drawer-text,#1f2937);box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow-y:auto;pointer-events:auto">
    <div style="padding:1.5rem">${slotContent}</div>
  </div>
</div>
<style>
@media(prefers-color-scheme:dark){[data-stx-drawer]{--stx-drawer-bg:#1f2937;--stx-drawer-text:#f3f4f6}}
.stx-drawer-backdrop[data-stx-drawer-open]{display:block!important;opacity:1}
.stx-drawer-backdrop[data-stx-drawer-open] .stx-drawer-panel{transform:translateX(0)}
</style>`
  },
}
