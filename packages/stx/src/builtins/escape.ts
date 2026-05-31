/**
 * Shared HTML-attribute escaping for builtin components.
 *
 * Builtins interpolate prop values directly into their rendered markup. Any value
 * that can come from untrusted data (a `:prop="userData.x"` lands in
 * `serverDynamic`) must be escaped before it goes into an attribute, or a value
 * like `x" onload="alert(1)` breaks out of the attribute — an XSS sink.
 *
 * Escapes the five attribute-significant characters. Safe for both double- and
 * single-quoted attribute contexts.
 */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
