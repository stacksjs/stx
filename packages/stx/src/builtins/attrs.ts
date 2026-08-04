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
import { escapeAttr } from './escape'
import { BOOLEAN_ATTRIBUTE_SENTINEL, stripControlChars } from '../prop-sentinels'

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
        attrs.push(escapeAttr(name))
      continue
    }

    // A bare attribute arrives as the sentinel STRING, not a JS boolean, so the
    // check above misses it and the raw marker — leading NUL included — was
    // emitted as the attribute's value (#1816). It reached output through
    // element-level directives: a signal-driven @if/@else chain is rewritten
    // into attributes on the element, so `@else` lands on a builtin as a bare
    // attribute and gets forwarded here.
    if (value === BOOLEAN_ATTRIBUTE_SENTINEL) {
      attrs.push(escapeAttr(name))
      continue
    }

    // stripControlChars is belt and braces: a NUL in a response makes the whole
    // document invalid UTF-8, which is a disproportionate failure for the cost
    // of one check.
    attrs.push(`${escapeAttr(name)}="${escapeAttr(stripControlChars(String(value)))}"`)
  }

  return attrs
}
