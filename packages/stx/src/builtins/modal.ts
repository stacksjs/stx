/**
 * StxModal Builtin Component
 *
 * Renders a hidden modal dialog with slot content. Opened/closed via
 * the runtime `modal.open(id)` / `modal.close(id)` globals.
 *
 * Usage:
 *   <StxModal id="settings">
 *     <h2>Settings</h2>
 *     <p>Modal content here</p>
 *   </StxModal>
 *
 *   <StxModal id="delete-confirm" size="sm" closeOnBackdrop="false">
 *     <h3>Are you sure?</h3>
 *   </StxModal>
 *
 * Props:
 *   - id (required) — unique modal identifier
 *   - size — 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
 *   - closeOnBackdrop — whether clicking backdrop closes modal (default: true)
 *   - closeOnEscape — whether Escape key closes modal (default: true)
 *
 * @module builtins/modal
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

const SIZE_WIDTHS: Record<string, string> = {
  sm: 'max-width:24rem',
  md: 'max-width:32rem',
  lg: 'max-width:42rem',
  xl: 'max-width:56rem',
  full: 'max-width:calc(100vw - 2rem);max-height:calc(100vh - 2rem)',
}

export const StxModalBuiltin: BuiltinComponentDef = {
  name: 'StxModal',
  aliases: ['stx-modal'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const id = resolveProp(props, 'id')
    if (!id) {
      console.warn('[stx] <StxModal> requires an "id" prop')
      return '<!-- StxModal: missing id prop -->'
    }

    const size = resolveProp(props, 'size') || 'md'
    const closeOnBackdrop = resolveProp(props, 'closeOnBackdrop') !== 'false'
    const closeOnEscape = resolveProp(props, 'closeOnEscape') !== 'false'
    const maxWidth = SIZE_WIDTHS[size] || SIZE_WIDTHS.md

    return `<div id="stx-modal-${id}" class="stx-modal-backdrop" data-stx-modal="${id}" data-close-backdrop="${closeOnBackdrop}" data-close-escape="${closeOnEscape}" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);opacity:0;transition:opacity 0.2s ease" aria-modal="true" role="dialog">
  <div class="stx-modal-panel" style="${maxWidth};width:100%;margin:1rem;border-radius:0.75rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;transform:scale(0.95) translateY(8px);transition:transform 0.2s ease,opacity 0.2s ease;opacity:0;background:var(--stx-modal-bg,#fff);color:var(--stx-modal-text,#1f2937)">
    <div style="padding:1.5rem">${slotContent}</div>
  </div>
</div>
<style>
@media(prefers-color-scheme:dark){[data-stx-modal]{--stx-modal-bg:#1f2937;--stx-modal-text:#f3f4f6}}
.stx-modal-backdrop[data-stx-modal-open]{display:flex!important;opacity:1}
.stx-modal-backdrop[data-stx-modal-open] .stx-modal-panel{transform:scale(1) translateY(0);opacity:1}
</style>`
  },
}
