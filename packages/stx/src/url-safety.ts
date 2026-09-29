/**
 * A substituted value cannot introduce a URL scheme the page did not ask for.
 *
 * `{{ }}` escapes HTML, which stops a value closing its attribute or opening a
 * tag -- and says nothing about what the attribute means. `javascript:alert(1)`
 * contains no character escaping touches, so
 * `<a href="{{ url }}">` with a stored URL ran script on click, from a value a
 * person typed. The same goes for `vbscript:` (old Edge, still shipped in
 * Windows-embedded browsers) and for `data:text/html`, which navigates to a
 * document the attacker wrote, on the page's own origin in some browsers.
 *
 * What is *not* here matters as much:
 *
 * - **Only the scheme position.** `href="/search?q={{ term }}"` is left alone:
 *   a scheme can only be at the start of a URL, so a value substituted after
 *   anything else cannot introduce one.
 * - **Only URL attributes.** `title="{{ text }}"` keeps every byte. A value is
 *   rewritten only where the browser would resolve it as a URL.
 * - **`{!! !!}` is untouched**, as it is for HTML: the raw form is how a
 *   template says it vouches for the value, and a sanitizer with no way out is
 *   one people work around.
 * - **`data:image/...` still loads**, which `<StxImage>`'s own blur placeholder
 *   needs; only the data URLs that carry a document are refused.
 *
 * Refused values are prefixed rather than emptied, the way Angular does it: the
 * value stays visible in the DOM and in view-source, so the person debugging it
 * sees what was blocked instead of an attribute that mysteriously went away,
 * and `unsafe:javascript:alert(1)` is an unknown scheme, so a click does
 * nothing.
 */

/** What a refused value is rewritten to, so it is inert but still readable. */
export const UNSAFE_URL_PREFIX = 'unsafe:'

/** Attributes the browser follows as a navigation, or as a form's target. */
const NAVIGABLE = 'href|xlink:href|action|formaction|ping|cite|manifest|data|to'
/** Attributes the browser fetches as a subresource. */
const FETCHED = 'src|srcset|poster|background'

/**
 * A `<script>` scheme, however it is spelled. Browsers ignore ASCII whitespace
 * and C0 controls inside a scheme and match it case-insensitively, so
 * `java\tscript:` and `JavaScript:` are the same URL -- the check normalises
 * before testing rather than trying to enumerate the spellings.
 *
 * Entity-encoded spellings (`&#106;avascript:`) need nothing here: the HTML
 * escape that runs first turns their `&` into `&amp;`, so the browser reads
 * them as text and never as a scheme.
 */
const SCRIPT_SCHEME = /^(?:javascript|vbscript|livescript|mocha|view-source):/
/** Data URLs that carry a document rather than a media file. */
const DOCUMENT_DATA = /^data:(?:text\/html|text\/xml|application\/xhtml\+xml|application\/xml|image\/svg\+xml)/
/** In a fetched subresource, only a document that scripts is a problem. */
const FETCHED_DATA = /^data:(?:text\/html|application\/xhtml\+xml)/

const STRIPPED = new RegExp('[\\u0000-\\u0020\\u00A0\\u1680\\u2000-\\u200F\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]+', 'g')

function normalizeScheme(value: string): string {
  return value.replace(STRIPPED, '').toLowerCase()
}

/** Which policy an attribute name gets, or null when it holds no URL. */
export function urlAttributeKind(name: string): 'navigable' | 'fetched' | null {
  const lower = name.toLowerCase()
  if (new RegExp(`^(?:${NAVIGABLE})$`).test(lower)) return 'navigable'
  if (new RegExp(`^(?:${FETCHED})$`).test(lower)) return 'fetched'
  return null
}

/** Whether this value would introduce a scheme the attribute must not follow. */
export function isDangerousUrl(value: string, kind: 'navigable' | 'fetched' = 'navigable'): boolean {
  const normalized = normalizeScheme(value)
  if (SCRIPT_SCHEME.test(normalized)) return true
  return kind === 'navigable' ? DOCUMENT_DATA.test(normalized) : FETCHED_DATA.test(normalized)
}

/** The value as it may be written, refused ones prefixed to make them inert. */
export function sanitizeUrlValue(value: string, kind: 'navigable' | 'fetched' = 'navigable'): string {
  return isDangerousUrl(value, kind) ? UNSAFE_URL_PREFIX + value : value
}

/**
 * The attribute a substitution at the end of `before` is landing in the scheme
 * position of, or null.
 *
 * `before` is everything already written, so its tail says where the next
 * characters go: inside an open quoted attribute value, with nothing before
 * them in that value. Anything already written into the value means the
 * substitution cannot be the scheme, and an unquoted value is not matched --
 * the interpolation passes write quoted attributes.
 */
export function urlSchemePosition(before: string): 'navigable' | 'fetched' | null {
  const open = before.match(/(?:^|[\s"'`/])([A-Za-z][\w:-]*)\s*=\s*(["'])([^"']*)$/)
  if (!open) return null
  // Something is already in the value, so the scheme is already decided.
  if (open[3].trim() !== '') return null
  return urlAttributeKind(open[1])
}

/**
 * The tail of the already-written output that a scheme check needs.
 *
 * A page can hold hundreds of substitutions, and slicing the whole output at
 * each one is quadratic -- one of the compile budgets in
 * scripts/performance-budgets.ts is what would notice. Only the enclosing tag's
 * last attribute matters, so a window is enough.
 */
export function schemeWindow(output: string, offset: number, span = 256): string {
  if (offset <= span) return output.slice(0, offset)
  const window = output.slice(offset - span, offset)
  // A window can begin in the middle of a name, and the tail of one name can
  // read as a whole different name (`data-href="` cut down to `href="`), so it
  // starts at the first boundary inside the window instead.
  const boundary = window.search(/[\s"'`/]/)
  return boundary === -1 ? '' : window.slice(boundary)
}

/**
 * Decide the final text for a value that was just substituted: `escaped` as it
 * is, or prefixed when it landed in the scheme position of a URL attribute and
 * introduces a scheme that attribute must not follow.
 *
 * The decision reads the raw value, not the escaped one, so it is testing what
 * the browser will resolve rather than what the HTML escape happened to leave.
 */
export function sanitizeSubstitutedUrl(before: string, raw: string, escaped: string = raw): string {
  const kind = urlSchemePosition(before)
  return kind && isDangerousUrl(raw, kind) ? UNSAFE_URL_PREFIX + escaped : escaped
}
