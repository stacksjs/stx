/**
 * StxPagination Builtin Component
 *
 * Renders an accessible pagination control with page buttons.
 * Dispatches `stx:page-change` CustomEvent with `detail.page` on click.
 *
 * Usage:
 *   <StxPagination total="100" perPage="10" current="1" />
 *   <StxPagination total="50" perPage="5" current="3" sibling="2" showEdges="true" />
 *
 * Props:
 *   - total (required) — total number of items
 *   - perPage — items per page (default: 10)
 *   - current — current page number (default: 1)
 *   - sibling — number of pages shown around current page (default: 1)
 *   - showEdges — show First/Last buttons (default: false)
 *
 * @module builtins/pagination
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function buildPageRange(current: number, totalPages: number, sibling: number): (number | '...')[] {
  const range: (number | '...')[] = []

  const leftSibling = Math.max(current - sibling, 1)
  const rightSibling = Math.min(current + sibling, totalPages)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + 2 * sibling
    for (let i = 1; i <= Math.min(leftCount, totalPages); i++) range.push(i)
    if (leftCount < totalPages) {
      range.push('...')
      range.push(totalPages)
    }
  }
  else if (showLeftDots && !showRightDots) {
    range.push(1)
    range.push('...')
    const rightCount = 3 + 2 * sibling
    for (let i = Math.max(totalPages - rightCount + 1, 2); i <= totalPages; i++) range.push(i)
  }
  else if (showLeftDots && showRightDots) {
    range.push(1)
    range.push('...')
    for (let i = leftSibling; i <= rightSibling; i++) range.push(i)
    range.push('...')
    range.push(totalPages)
  }
  else {
    for (let i = 1; i <= totalPages; i++) range.push(i)
  }

  return range
}

const BTN_BASE = 'display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;height:2.25rem;padding:0 0.5rem;border:1px solid var(--stx-pg-border,#d1d5db);border-radius:0.375rem;font-size:0.875rem;cursor:pointer;transition:background 0.15s,color 0.15s;background:var(--stx-pg-bg,#fff);color:var(--stx-pg-text,#374151)'
const BTN_ACTIVE = 'display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;height:2.25rem;padding:0 0.5rem;border:1px solid var(--stx-pg-active-border,#4f46e5);border-radius:0.375rem;font-size:0.875rem;font-weight:600;cursor:default;background:var(--stx-pg-active-bg,#4f46e5);color:var(--stx-pg-active-text,#fff)'
const BTN_DISABLED = 'display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;height:2.25rem;padding:0 0.5rem;border:1px solid var(--stx-pg-border,#d1d5db);border-radius:0.375rem;font-size:0.875rem;cursor:not-allowed;opacity:0.5;background:var(--stx-pg-bg,#fff);color:var(--stx-pg-text,#374151)'

export const StxPaginationBuiltin: BuiltinComponentDef = {
  name: 'StxPagination',
  aliases: ['stx-pagination'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const totalRaw = resolveProp(props, 'total')
    if (!totalRaw) {
      console.warn('[stx] <StxPagination> requires a "total" prop')
      return '<!-- StxPagination: missing total prop -->'
    }

    const total = Number.parseInt(totalRaw, 10)
    const perPage = Number.parseInt(resolveProp(props, 'perPage') || '10', 10)
    const current = Number.parseInt(resolveProp(props, 'current') || '1', 10)
    const sibling = Number.parseInt(resolveProp(props, 'sibling') || '1', 10)
    const showEdges = resolveProp(props, 'showEdges') === 'true'

    const totalPages = Math.max(1, Math.ceil(total / perPage))

    if (totalPages <= 1) {
      return '<!-- StxPagination: only one page -->'
    }

    const pages = buildPageRange(current, totalPages, sibling)
    const paginationId = `stx-pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const buttons: string[] = []

    if (showEdges) {
      buttons.push(current === 1
        ? `<button disabled style="${BTN_DISABLED}" aria-label="First page">&laquo;</button>`
        : `<button data-page="1" style="${BTN_BASE}" aria-label="First page">&laquo;</button>`)
    }

    buttons.push(current === 1
      ? `<button disabled style="${BTN_DISABLED}" aria-label="Previous page">&lsaquo;</button>`
      : `<button data-page="${current - 1}" style="${BTN_BASE}" aria-label="Previous page">&lsaquo;</button>`)

    for (const page of pages) {
      if (page === '...') {
        buttons.push(`<span style="${BTN_BASE};border:none;cursor:default">&hellip;</span>`)
      }
      else if (page === current) {
        buttons.push(`<button aria-current="page" style="${BTN_ACTIVE}">${page}</button>`)
      }
      else {
        buttons.push(`<button data-page="${page}" style="${BTN_BASE}">${page}</button>`)
      }
    }

    buttons.push(current === totalPages
      ? `<button disabled style="${BTN_DISABLED}" aria-label="Next page">&rsaquo;</button>`
      : `<button data-page="${current + 1}" style="${BTN_BASE}" aria-label="Next page">&rsaquo;</button>`)

    if (showEdges) {
      buttons.push(current === totalPages
        ? `<button disabled style="${BTN_DISABLED}" aria-label="Last page">&raquo;</button>`
        : `<button data-page="${totalPages}" style="${BTN_BASE}" aria-label="Last page">&raquo;</button>`)
    }

    return `<nav id="${paginationId}" aria-label="Pagination" style="display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap">
${buttons.join('\n')}
</nav>
<style>
@media(prefers-color-scheme:dark){
  #${paginationId}{--stx-pg-bg:#1f2937;--stx-pg-text:#d1d5db;--stx-pg-border:#4b5563;--stx-pg-active-bg:#4f46e5;--stx-pg-active-text:#fff;--stx-pg-active-border:#4f46e5}
}
#${paginationId} button:not([disabled]):not([aria-current]):hover{background:var(--stx-pg-hover-bg,#f3f4f6);color:var(--stx-pg-hover-text,#111827)}
@media(prefers-color-scheme:dark){#${paginationId} button:not([disabled]):not([aria-current]):hover{background:#374151;color:#f9fafb}}
</style>
<script>
(function(){var n=document.getElementById("${paginationId}");if(!n)return;n.addEventListener("click",function(e){var b=e.target.closest("button[data-page]");if(!b)return;var p=parseInt(b.getAttribute("data-page"),10);n.dispatchEvent(new CustomEvent("stx:page-change",{detail:{page:p},bubbles:true}))})})();
</script>`
  },
}
