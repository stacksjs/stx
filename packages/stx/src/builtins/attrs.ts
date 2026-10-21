/**
 * Attribute pass-through for builtin components.
 *
 * `<StxLink>`, `<StxImage>` and `<SafeImage>` all consume the props they know
 * about and forward whatever is left onto the element they render, so an author
 * can write `<StxLink to="/x" aria-label="Shop" data-testid="nav">` and have the
 * last two land on the `<a>`. Each of them grew its own copy of that loop, which
 * meant each of them independently forwarded the *camelized* prop key — emitting
 * `ariaLabel="Shop"`, an attribute no browser knows.
 *
 * One implementation, so the naming round-trip is right in one place.
 *
 * @module builtins/attrs
 */

import type { ResolvedProps } from '../component-registry'
import { escapeAttributeValue, escapeHtml } from '../expressions'
import { BOOLEAN_ATTRIBUTE_SENTINEL, stripControlChars } from '../prop-sentinels'

/**
 * Attributes that belong to the rendered DOM element rather than to the
 * component's private prop API. Component props such as `variant` and `size`
 * must stay inside the component, while accessibility, data and ordinary
 * global/element attributes should fall through to its root.
 */
const FALLTHROUGH_ATTRIBUTES = new Set([
  'accesskey', 'autocapitalize', 'autofocus', 'class', 'contenteditable',
  'dir', 'draggable', 'enterkeyhint', 'exportparts', 'hidden', 'id', 'inert',
  'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype',
  'lang', 'nonce', 'part', 'role', 'slot', 'spellcheck', 'style', 'tabindex',
  'title', 'translate',
  'accept', 'action', 'alt', 'autocomplete', 'capture', 'cite', 'cols',
  'colspan', 'content', 'controls', 'datetime', 'default', 'download',
  'enctype', 'for', 'form', 'formaction', 'formenctype', 'formmethod',
  'formnovalidate', 'formtarget', 'height', 'href', 'hreflang', 'kind',
  'label', 'loading', 'loop', 'max', 'maxlength', 'media', 'method', 'min',
  'minlength', 'multiple', 'muted', 'name', 'open', 'pattern', 'placeholder',
  'playsinline', 'poster', 'preload', 'readonly', 'referrerpolicy', 'rel',
  'required', 'reversed', 'rows', 'rowspan', 'scope', 'selected', 'shape',
  'size', 'span', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step',
  'target', 'type', 'usemap', 'value', 'width', 'wrap',
])

/** Whether an attribute should be visible on a component's DOM root. */
export function isFallthroughAttribute(name: string): boolean {
  const normalized = name.toLowerCase()
  return normalized.startsWith('aria-')
    || normalized.startsWith('data-')
    || FALLTHROUGH_ATTRIBUTES.has(normalized)
}

/**
 * Render the static props a builtin did not consume as HTML attributes.
 *
 * Names come back spelled the way the author wrote them: prop resolution
 * camelizes static attributes so a `.stx` component can destructure them, and
 * `staticNames` carries the original for exactly this case. Values are escaped —
 * a static attribute can still hold hostile text (`aria-label="<script>…"`).
 *
 * Boolean props render as bare attributes when true and are dropped when false,
 * matching how HTML boolean attributes work.
 *
 * @param props - The component's resolved props.
 * @param consumed - Prop names the builtin has already rendered itself.
 */
export function forwardStaticAttrs(props: ResolvedProps, consumed: Set<string>): string[] {
  const attrs: string[] = []

  for (const [key, value] of Object.entries(props.static)) {
    if (consumed.has(key))
      continue

    const name = props.staticNames?.[key] ?? key

    if (typeof value === 'boolean') {
      if (value)
        attrs.push(escapeHtml(name))
      continue
    }

    // A bare attribute arrives as the sentinel STRING, not a JS boolean, so the
    // check above misses it and the raw marker — leading NUL included — was
    // emitted as the attribute's value (#1816). It reached output through
    // element-level directives: a signal-driven @if/@else chain is rewritten
    // into attributes on the element, so `@else` lands on a builtin as a bare
    // attribute and gets forwarded here.
    if (value === BOOLEAN_ATTRIBUTE_SENTINEL) {
      attrs.push(escapeHtml(name))
      continue
    }

    // stripControlChars is belt and braces: a NUL in a response makes the whole
    // document invalid UTF-8, which is a disproportionate failure for the cost
    // of one check.
    attrs.push(`${escapeHtml(name)}="${escapeAttributeValue(name, stripControlChars(String(value)))}"`)
  }

  return attrs
}

/**
 * Render the server-evaluated `:prop` bindings a builtin did not consume.
 *
 * Only `static` was ever forwarded, so `<StxLink to="/x" :title="pageTitle">`
 * emitted an `<a>` with no title and no warning — the binding was resolved,
 * stored, and thrown away (stacksjs/stx#1930). Client-reactive `:prop` and
 * `@event` bindings already reach the element by another route (the component
 * renderer re-applies them to the root), which is what made the gap specific to
 * the server-evaluated ones and easy to miss.
 *
 * `null`, `undefined` and `false` DROP the attribute rather than rendering the
 * word — that is what makes `:aria-current="active ? 'page' : null"` express
 * "this attribute is conditional", which is the whole reason to reach for a
 * binding instead of a literal. `true` renders bare, as HTML booleans do.
 *
 * @param props - The component's resolved props.
 * @param consumed - Prop names the builtin has already rendered itself.
 */
export function forwardResolvedAttrs(props: ResolvedProps, consumed: Set<string>): string[] {
  const attrs: string[] = []

  for (const [key, value] of Object.entries(props.serverDynamic ?? {})) {
    if (consumed.has(key))
      continue

    if (value === null || value === undefined || value === false)
      continue

    const name = props.serverDynamicNames?.[key] ?? key

    if (value === true) {
      attrs.push(escapeHtml(name))
      continue
    }

    // Objects would stringify to "[object Object]", which is never a useful
    // attribute value — a builtin that wants structured data reads the prop
    // itself and marks it consumed.
    if (typeof value === 'object')
      continue

    attrs.push(`${escapeHtml(name)}="${escapeAttributeValue(name, stripControlChars(String(value)))}"`)
  }

  return attrs
}
