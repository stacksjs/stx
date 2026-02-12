/**
 * STX JSX Runtime
 *
 * Self-made JSX runtime for stx — no React, no Preact, no external dependencies.
 * This module provides the jsx/jsxs/Fragment functions that Bun's JSX transpiler calls,
 * plus renderToString() for SSR and renderToDOM() for client-side rendering.
 *
 * Usage in tsconfig.json:
 * ```json
 * {
 *   "compilerOptions": {
 *     "jsx": "react-jsx",
 *     "jsxImportSource": "@stacksjs/stx"
 *   }
 * }
 * ```
 *
 * @module jsx-runtime
 */

// =============================================================================
// Types
// =============================================================================

/** Virtual DOM node representation */
export interface VNode {
  type: string | ComponentFunction | typeof Fragment
  props: Record<string, any> | null
  children: Array<VNode | string>
  key?: string | number | null
  ref?: string | ((el: any) => void) | null
}

/** Function component type */
export type ComponentFunction = (props: Record<string, any>) => VNode | string | null

/** Fragment symbol - renders children without a wrapper element */
export const Fragment: unique symbol = Symbol.for('stx.Fragment')

// =============================================================================
// HTML Constants
// =============================================================================

/** Void elements that have no closing tag */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** Boolean attributes where presence = true */
const BOOLEAN_ATTRS = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert',
  'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate',
  'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
])

/** Map of JSX prop names to HTML attribute names */
const PROP_ALIASES: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  autoFocus: 'autofocus',
  autoPlay: 'autoplay',
  crossOrigin: 'crossorigin',
  dateTime: 'datetime',
  encType: 'enctype',
  formAction: 'formaction',
  formEncType: 'formenctype',
  formMethod: 'formmethod',
  formNoValidate: 'formnovalidate',
  formTarget: 'formtarget',
  frameBorder: 'frameborder',
  hrefLang: 'hreflang',
  httpEquiv: 'http-equiv',
  inputMode: 'inputmode',
  maxLength: 'maxlength',
  mediaGroup: 'mediagroup',
  minLength: 'minlength',
  noModule: 'nomodule',
  noValidate: 'novalidate',
  playsInline: 'playsinline',
  readOnly: 'readonly',
  rowSpan: 'rowspan',
  colSpan: 'colspan',
  srcDoc: 'srcdoc',
  srcLang: 'srclang',
  srcSet: 'srcset',
  useMap: 'usemap',
}

// =============================================================================
// HTML Escaping
// =============================================================================

/**
 * Escape special HTML characters in text content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escape a value for use in an HTML attribute.
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

// =============================================================================
// VNode Creation (called by Bun's JSX transpiler)
// =============================================================================

/**
 * Normalize children into a flat array of VNodes and strings.
 */
function normalizeChildren(children: any): Array<VNode | string> {
  if (children == null || typeof children === 'boolean')
    return []
  if (!Array.isArray(children))
    return [normalizeChild(children)]
  return children.flat(Infinity).map(normalizeChild).filter(c => c !== '')
}

/**
 * Normalize a single child value.
 */
function normalizeChild(child: any): VNode | string {
  if (child == null || typeof child === 'boolean')
    return ''
  if (typeof child === 'string')
    return child
  if (typeof child === 'number')
    return String(child)
  return child as VNode
}

/**
 * Create a VNode. This is the function Bun's JSX transpiler calls.
 *
 * @param type - Tag name string, component function, or Fragment symbol
 * @param props - Props object (may include children)
 * @param key - Optional key for list reconciliation
 */
export function jsx(type: string | ComponentFunction | typeof Fragment, props: Record<string, any> | null, key?: string | number | null): VNode {
  const { children, ref, key: _key, ...restProps } = props || {} as any
  return {
    type,
    props: Object.keys(restProps).length > 0 ? restProps : null,
    children: normalizeChildren(children),
    key: key ?? _key ?? undefined,
    ref: ref ?? undefined,
  }
}

/**
 * Same as jsx — Bun's transpiler uses jsxs when there are multiple static children.
 */
export const jsxs = jsx

/**
 * Development version of jsx with extra validation.
 */
export const jsxDEV = jsx

// =============================================================================
// Server-Side Rendering (renderToString)
// =============================================================================

/**
 * Render CSS style object to string.
 */
function renderStyle(style: Record<string, any>): string {
  return Object.entries(style)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => {
      // Convert camelCase to kebab-case
      const prop = k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
      const value = typeof v === 'number' && !prop.startsWith('--') && prop !== 'opacity' && prop !== 'z-index' && prop !== 'flex-grow' && prop !== 'flex-shrink' && prop !== 'order' && prop !== 'font-weight' && prop !== 'line-height'
        ? `${v}px`
        : String(v)
      return `${prop}: ${value}`
    })
    .join('; ')
}

/**
 * Render a class value (string, array, or object) to a class string.
 */
function renderClass(value: any): string {
  if (typeof value === 'string')
    return value
  if (Array.isArray(value))
    return value.filter(Boolean).map(renderClass).join(' ')
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).filter(([, v]) => v).map(([k]) => k).join(' ')
  return ''
}

/**
 * Render props/attributes to an HTML string.
 */
function renderAttributes(props: Record<string, any> | null): string {
  if (!props)
    return ''

  const parts: string[] = []

  for (const [key, value] of Object.entries(props)) {
    // Skip internal props
    if (key === 'key' || key === 'ref' || key === 'children' || key === 'innerHTML' || key === 'dangerouslySetInnerHTML')
      continue

    // Skip event handlers in SSR
    if (key.startsWith('on') && typeof value === 'function')
      continue

    // Resolve the actual attribute name
    const attrName = PROP_ALIASES[key] || key

    // Handle special cases
    if (attrName === 'class' || attrName === 'className') {
      const classStr = renderClass(value)
      if (classStr) {
        parts.push(` class="${escapeAttr(classStr)}"`)
      }
      continue
    }

    if (attrName === 'style') {
      const styleStr = typeof value === 'string' ? value : renderStyle(value)
      if (styleStr) {
        parts.push(` style="${escapeAttr(styleStr)}"`)
      }
      continue
    }

    // Boolean attributes
    if (BOOLEAN_ATTRS.has(attrName)) {
      if (value) {
        parts.push(` ${attrName}`)
      }
      continue
    }

    // Regular attributes
    if (value != null && value !== false) {
      parts.push(` ${attrName}="${escapeAttr(String(value))}"`)
    }
  }

  return parts.join('')
}

/**
 * Render a VNode tree to an HTML string.
 * This is the primary SSR function.
 *
 * @param vnode - The VNode or string to render
 * @returns HTML string
 */
export function renderToString(vnode: VNode | string | null | undefined | boolean | number): string {
  // Primitives
  if (vnode == null || typeof vnode === 'boolean')
    return ''
  if (typeof vnode === 'string')
    return escapeHtml(vnode)
  if (typeof vnode === 'number')
    return String(vnode)

  // Array of vnodes
  if (Array.isArray(vnode))
    return vnode.map(renderToString).join('')

  // Fragment
  if (vnode.type === Fragment) {
    return vnode.children.map(renderToString).join('')
  }

  // Function component
  if (typeof vnode.type === 'function') {
    const result = vnode.type({
      ...vnode.props,
      children: vnode.children.length === 1 ? vnode.children[0] : vnode.children.length > 0 ? vnode.children : undefined,
    })
    return renderToString(result as any)
  }

  // HTML element
  const tag = vnode.type as string
  const attrs = renderAttributes(vnode.props)

  // Handle innerHTML / dangerouslySetInnerHTML
  const innerHTML = vnode.props?.innerHTML ?? vnode.props?.dangerouslySetInnerHTML?.__html
  if (innerHTML != null) {
    return `<${tag}${attrs}>${innerHTML}</${tag}>`
  }

  // Void elements
  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs}>`
  }

  // Regular element with children
  const childHtml = vnode.children.map(renderToString).join('')
  return `<${tag}${attrs}>${childHtml}</${tag}>`
}

/**
 * Render a VNode tree to a readable stream for streaming SSR.
 */
export function renderToStream(vnode: VNode | string): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(renderToString(vnode))
      controller.close()
    },
  })
}

// =============================================================================
// Client-Side Rendering (renderToDOM)
// =============================================================================

/**
 * Apply props to a DOM element.
 */
function applyProps(el: Element, props: Record<string, any> | null): void {
  if (!props)
    return

  for (const [key, value] of Object.entries(props)) {
    if (key === 'key' || key === 'ref' || key === 'children' || key === 'innerHTML' || key === 'dangerouslySetInnerHTML')
      continue

    const attrName = PROP_ALIASES[key] || key

    // Event handlers
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value)
      continue
    }

    // Special handling
    if (attrName === 'class' || attrName === 'className') {
      const classStr = renderClass(value)
      if (classStr) {
        el.setAttribute('class', classStr)
      }
      continue
    }

    if (attrName === 'style') {
      const styleStr = typeof value === 'string' ? value : renderStyle(value)
      if (styleStr) {
        el.setAttribute('style', styleStr)
      }
      continue
    }

    if (BOOLEAN_ATTRS.has(attrName)) {
      if (value) {
        el.setAttribute(attrName, '')
      }
      continue
    }

    if (value != null && value !== false) {
      el.setAttribute(attrName, String(value))
    }
  }
}

/**
 * Render a VNode tree to real DOM nodes.
 *
 * @param vnode - The VNode or string to render
 * @param container - The parent DOM element to append to
 */
export function renderToDOM(vnode: VNode | string | null | undefined | boolean | number, container: Element): void {
  if (vnode == null || typeof vnode === 'boolean')
    return

  if (typeof vnode === 'string') {
    container.appendChild(document.createTextNode(vnode))
    return
  }

  if (typeof vnode === 'number') {
    container.appendChild(document.createTextNode(String(vnode)))
    return
  }

  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      renderToDOM(child, container)
    }
    return
  }

  // Fragment
  if (vnode.type === Fragment) {
    for (const child of vnode.children) {
      renderToDOM(child, container)
    }
    return
  }

  // Function component
  if (typeof vnode.type === 'function') {
    const result = vnode.type({
      ...vnode.props,
      children: vnode.children.length === 1 ? vnode.children[0] : vnode.children.length > 0 ? vnode.children : undefined,
    })
    renderToDOM(result as any, container)
    return
  }

  // HTML element
  const el = document.createElement(vnode.type as string)
  applyProps(el, vnode.props)

  // Handle innerHTML
  const innerHTML = vnode.props?.innerHTML ?? vnode.props?.dangerouslySetInnerHTML?.__html
  if (innerHTML != null) {
    el.innerHTML = innerHTML
  }
  else {
    for (const child of vnode.children) {
      renderToDOM(child, el)
    }
  }

  // Handle ref
  if (vnode.ref) {
    if (typeof vnode.ref === 'function') {
      vnode.ref(el)
    }
  }

  container.appendChild(el)
}

// =============================================================================
// Utility Components (for directive-like patterns in JSX)
// =============================================================================

/**
 * Conditional rendering component — equivalent to v-if / @if.
 *
 * ```tsx
 * <Show when={isVisible} fallback={<p>Hidden</p>}>
 *   <div>Visible content</div>
 * </Show>
 * ```
 */
export function Show(props: { when: any, fallback?: VNode | string | null, children?: any }): VNode | string | null {
  if (props.when) {
    return jsx(Fragment, { children: props.children })
  }
  return (props.fallback as any) ?? null
}

/**
 * List rendering component — equivalent to v-for / @foreach.
 *
 * ```tsx
 * <For each={items}>
 *   {(item, index) => <div key={item.id}>{item.name}</div>}
 * </For>
 * ```
 */
export function For<T>(props: { each: T[] | undefined | null, fallback?: VNode | string | null, children: ((item: T, index: number) => VNode | string) | Array<(item: T, index: number) => VNode | string> }): VNode | string | null {
  const items = props.each
  if (!items || items.length === 0) {
    return (props.fallback as any) ?? null
  }

  const renderFn = Array.isArray(props.children) ? props.children[0] : props.children
  const children = items.map((item, index) => renderFn(item, index))
  return jsx(Fragment, { children })
}

/**
 * Portal/Teleport component — renders children to a different DOM target.
 * Only effective on client-side; SSR renders children inline.
 *
 * ```tsx
 * <Portal to="body">
 *   <div class="modal">Modal content</div>
 * </Portal>
 * ```
 */
export function Portal(props: { to: string, children?: any }): VNode | string | null {
  // In SSR, just render children inline (will be moved on hydration)
  return jsx(Fragment, { children: props.children })
}

// =============================================================================
// createElement (h function) - alternative API
// =============================================================================

/**
 * Create a VNode using the h() function syntax (alternative to JSX).
 *
 * ```ts
 * import { h } from '@stacksjs/stx/jsx-runtime'
 *
 * const vnode = h('div', { class: 'container' },
 *   h('h1', null, 'Hello'),
 *   h('p', null, 'World')
 * )
 * ```
 */
export function h(type: string | ComponentFunction | typeof Fragment, props?: Record<string, any> | null, ...children: any[]): VNode {
  const { key, ref, ...restProps } = props || {} as any
  return {
    type,
    props: Object.keys(restProps).length > 0 ? restProps : {},
    children: normalizeChildren(children.length === 1 ? children[0] : children),
    key: key ?? undefined,
    ref: ref ?? undefined,
  }
}
