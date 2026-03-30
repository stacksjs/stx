/**
 * StxLink Builtin Component
 *
 * Renders a client-side navigation-aware `<a>` element with support for
 * active class management, prefetching, and reactive href bindings.
 * Produces plain HTML — no wrapper component or custom element overhead.
 *
 * @module builtins/stx-link
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

/**
 * Escape a string for safe use inside an HTML attribute value.
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Resolve the `to` prop from any binding category.
 * Returns an object indicating whether the value is a static string
 * or a client-reactive expression.
 */
function resolveTo(props: ResolvedProps): { value: string, reactive: boolean } {
  // Client-reactive takes priority — expression is preserved for signals
  if (props.clientReactive.to) {
    return { value: props.clientReactive.to, reactive: true }
  }

  // Server-dynamic — already evaluated at compile time
  if (props.serverDynamic.to !== undefined) {
    return { value: String(props.serverDynamic.to), reactive: false }
  }

  // Static string
  if (typeof props.static.to === 'string') {
    return { value: props.static.to, reactive: false }
  }

  return { value: '#', reactive: false }
}

export const StxLinkBuiltin: BuiltinComponentDef = {
  name: 'StxLink',
  aliases: ['stx-link'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const to = resolveTo(props)

    // Resolve class
    const className = (typeof props.static.class === 'string' ? props.static.class : '')
      || (typeof props.static.className === 'string' ? props.static.className : '')

    // Active class names
    const activeClass = typeof props.static.activeClass === 'string'
      ? props.static.activeClass
      : 'active'
    const exactActiveClass = typeof props.static.exactActiveClass === 'string'
      ? props.static.exactActiveClass
      : 'exact-active'

    // Prefetch
    const prefetch = props.static.prefetch === true
      || props.static.prefetch === 'true'
      || props.serverDynamic.prefetch === true

    // Build attribute list
    const attrs: string[] = []

    // href — reactive or static
    if (to.reactive) {
      attrs.push(`:href="${escapeAttr(to.value)}"`)
    }
    else {
      attrs.push(`href="${escapeAttr(to.value)}"`)
    }

    if (className) {
      attrs.push(`class="${escapeAttr(className)}"`)
    }

    attrs.push('data-stx-link')
    attrs.push(`data-stx-active-class="${escapeAttr(activeClass)}"`)
    attrs.push(`data-stx-exact-active-class="${escapeAttr(exactActiveClass)}"`)

    if (prefetch) {
      attrs.push('data-stx-prefetch')
    }

    // Preserve event bindings
    for (const [event, handler] of Object.entries(props.events)) {
      attrs.push(`@${escapeAttr(event)}="${escapeAttr(handler)}"`)
    }

    // Forward any extra static attributes that are not consumed props
    const consumedStatic = new Set(['to', 'class', 'className', 'activeClass', 'exactActiveClass', 'prefetch'])
    for (const [key, value] of Object.entries(props.static)) {
      if (consumedStatic.has(key)) continue
      if (typeof value === 'boolean') {
        if (value) attrs.push(escapeAttr(key))
      }
      else {
        attrs.push(`${escapeAttr(key)}="${escapeAttr(value)}"`)
      }
    }

    return `<a ${attrs.join(' ')}>${slotContent}</a>`
  },
}
