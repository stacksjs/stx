/**
 * Make a substituted VALUE unreadable as template syntax.
 *
 * A value reaches the output in the middle of a pipeline: expression passes run
 * again over component expansion and over loop bodies, and the client runtime
 * reads the document afterwards. So whatever a value contains gets a second
 * look, and text that looks like template syntax is acted on -- the value is
 * data, and data must not become markup.
 *
 * Every replacement here is a character reference, so nothing needs restoring
 * afterwards and no placeholder can leak into a page. What a reader sees is
 * unchanged: the browser decodes the references before anything reads them, an
 * attribute parses back to the original character, and JSON.parse of a data
 * attribute still works.
 *
 * Two modules escape values -- expressions.ts for template output and
 * server-components.ts for its own substitution -- and they have to agree, so
 * the rules live here rather than in either of them. This module deliberately
 * imports nothing: server-components.ts keeps its own dependency-light escaping
 * and can use this without pulling in the expression machinery.
 *
 * @module template-syntax-escape
 */

/**
 * A zero-width joiner. It breaks a syntax pattern while changing nothing a
 * reader sees: no width, no line-breaking behaviour, and it copies as an
 * invisible character.
 */
export const WORD_JOINER = '&#8288;'

/**
 * Directive-looking text in a value, which a later directive pass would act on.
 *
 * Two shapes can do damage. `@name(...)` is a directive call -- a value holding
 * `@if(true)X@endif` had its X rendered, and the same value in a component prop
 * reached the page as markup. A block ender or a mid-block keyword needs no
 * parentheses to matter: an `@endif` inside a value closes the conditional it
 * sits in, so the rest of that block escapes its condition.
 *
 * What follows the `@` decides it, not what precedes it. An earlier version
 * required a non-word character before the `@` so that email addresses kept
 * their bytes, but a value ending `X@endif` then closed the block it sat in --
 * the very corruption this prevents. Encoding is invisible to a reader anyway,
 * so the safe direction is to encode: `first@example.com` is untouched because
 * `example.com` is neither a call nor a block keyword, and an address that does
 * collide (`bob@endor.com`) still renders exactly as written.
 */
const DIRECTIVE_IN_VALUE
  = /@(?=[a-zA-Z_]\w*\s*\(|end[a-zA-Z]*\b|else(?:if)?\b|empty\b|case\b|default\b|break\b|continue\b|fallback\b)/g

/** `{{` as `{` + joiner + `{`, so neither pass can read the run as syntax. */
function joinBraces(length: number): string {
  return Array.from({ length }, () => '&#123;').join(WORD_JOINER)
}

/**
 * Neutralise template syntax in an ALREADY HTML-escaped value.
 *
 * Call it after HTML escaping: it relies on `<`, `>` and the quotes being gone,
 * and on `{`, `}`, `@` and `(` still being themselves.
 */
export function neutralizeTemplateSyntax(escaped: string): string {
  return escaped
    // A run, not a single brace: `{{{ x }}}` with only its first brace encoded
    // still leaves `{{ x }}` behind for the next pass to evaluate.
    .replace(/\{{2,}/g, match => joinBraces(match.length))
    // `{!! raw !!}` splices without escaping, so one brace is enough here.
    .replace(/\{(?=!)/g, `&#123;${WORD_JOINER}`)
    .replace(DIRECTIVE_IN_VALUE, '&#64;')
}
