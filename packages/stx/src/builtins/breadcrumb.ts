/**
 * StxBreadcrumb Builtin Component
 *
 * Renders an accessible breadcrumb navigation from StxBreadcrumbItem children.
 *
 * Usage:
 *   <StxBreadcrumb separator="/">
 *     <StxBreadcrumbItem to="/">Home</StxBreadcrumbItem>
 *     <StxBreadcrumbItem to="/settings">Settings</StxBreadcrumbItem>
 *     <StxBreadcrumbItem>Security</StxBreadcrumbItem>
 *   </StxBreadcrumb>
 *
 * Props:
 *   - separator — character(s) between items (default: '/')
 *
 * @module builtins/breadcrumb
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

interface BreadcrumbItem {
  to?: string
  text: string
}

function parseItems(slotContent: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  const regex = /<StxBreadcrumbItem(?:\s[^>]*)?\s*(?:\/>|>([\s\S]*?)<\/StxBreadcrumbItem>)/gi
  let match

  while ((match = regex.exec(slotContent)) !== null) {
    const tag = match[0]
    const toMatch = tag.match(/\bto\s*=\s*"([^"]*)"/)
    const text = match[1] ? match[1].trim() : ''
    items.push({ to: toMatch ? toMatch[1] : undefined, text })
  }

  return items
}

export const StxBreadcrumbBuiltin: BuiltinComponentDef = {
  name: 'StxBreadcrumb',
  aliases: ['stx-breadcrumb'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const separator = resolveProp(props, 'separator') || '/'
    const items = parseItems(slotContent)

    if (items.length === 0) {
      return '<!-- StxBreadcrumb: no items found -->'
    }

    const sepHtml = `<span aria-hidden="true" style="margin:0 0.5rem;color:var(--stx-breadcrumb-sep,#9ca3af)">${separator}</span>`

    const listItems = items.map((item, i) => {
      const isLast = i === items.length - 1
      if (isLast) {
        return `<li style="display:inline-flex;align-items:center"><span aria-current="page" style="font-weight:600;color:var(--stx-breadcrumb-active,#111827)">${item.text}</span></li>`
      }
      const link = item.to
        ? `<a href="${item.to}" data-stx-link style="color:var(--stx-breadcrumb-link,#6b7280);text-decoration:none">${item.text}</a>`
        : `<span style="color:var(--stx-breadcrumb-link,#6b7280)">${item.text}</span>`
      return `<li style="display:inline-flex;align-items:center">${link}${sepHtml}</li>`
    })

    return `<nav aria-label="Breadcrumb">
  <ol style="display:flex;align-items:center;list-style:none;margin:0;padding:0;flex-wrap:wrap">${listItems.join('')}</ol>
</nav>
<style>
@media(prefers-color-scheme:dark){
  [aria-label="Breadcrumb"]{--stx-breadcrumb-sep:#6b7280;--stx-breadcrumb-link:#9ca3af;--stx-breadcrumb-active:#f3f4f6}
}
[aria-label="Breadcrumb"] a:hover{text-decoration:underline!important}
</style>`
  },
}
