/**
 * Resolving `@meta(...)` arguments to a tag.
 *
 * `@meta` has three entry points -- the registered custom directive that stages
 * the tag on the head (seo.ts `metaDirective`), the head pass for renders
 * without custom directives (head.ts `processMetaDirective`), and the inline
 * pass that partials use (seo.ts `processMetaDirectives`) -- and they used to
 * read their arguments three different ways. A quoted value could be looked up
 * in the context as if it were a variable name, and an unquoted one that was
 * not a bare variable (`post.author`) was sent as literal text. One resolver
 * now serves all three. It lives apart from both seo.ts and head.ts because
 * seo.ts already imports head.ts.
 */
import type { ErrorCode } from './errors/codes'
import { ErrorCodes } from './error-handling'
import { describeValue, evaluateDirectiveArgument, isPlainRecord, parseStringLiteral } from './directive-arguments'

/**
 * Namespaces whose tags are addressed by `property`, not `name`.
 *
 * Open Graph and its relatives are RDFa vocabularies, so the attribute is
 * `property`; a `<meta name="og:title">` is ignored by every scraper that
 * implements the spec. Twitter cards are the exception people expect to be a
 * property and are not: the card spec says `name`.
 */
export const PROPERTY_NAMESPACES = ['og:', 'article:', 'book:', 'profile:', 'fb:', 'music:', 'video:']

/**
 * An unquoted first argument that is a tag name, not an expression:
 * `@meta(description, '...')`, `@meta(og:image, '...')`. Documented once, and
 * `og:image` is not valid JavaScript anyway. Anything else unquoted -- a member
 * access, a call, a template literal -- is evaluated.
 */
const BARE_META_NAME = /^[a-z][\w-]*(?::[\w:-]+)?$/i

export type MetaTagAttrs = { name: string, content: string } | { property: string, content: string }

export type ResolvedMeta =
  | { kind: 'tag', tag: MetaTagAttrs }
  | { kind: 'empty' }
  | { kind: 'error', message: string, code: ErrorCode }

/**
 * Resolve `@meta(...)` arguments, given as written (quotes kept), to a tag.
 *
 * - `@meta('author', 'Jane')`: literal text. A quoted value is never looked up
 *   in the context, so `@meta('description', 'title')` means the word.
 * - `@meta('author', author)`, `@meta('og:title', post.title)`,
 *   `@meta('keywords', tags)`: the second argument is evaluated. An array joins
 *   with ", "; `null`, `undefined`, `false` and `''` render nothing.
 * - `@meta('og:title')`: the one-argument form reads the context by the part
 *   after the colon (`title`), then `openGraph.title`.
 */
export function resolveMetaArguments(args: string[], context: Record<string, unknown>): ResolvedMeta {
  if (args.length < 1)
    return { kind: 'error', message: 'meta directive requires at least the meta name', code: ErrorCodes.INVALID_DIRECTIVE_SYNTAX }
  if (args.length > 2)
    return { kind: 'error', message: `@meta takes a name and a value, got ${args.length} arguments`, code: ErrorCodes.INVALID_DIRECTIVE_SYNTAX }

  const name = resolveMetaName(args[0], context)
  if (typeof name !== 'string')
    return name

  let content: string
  if (args.length === 2) {
    const value = resolveMetaValue(args[1], context)
    if (typeof value !== 'string')
      return value
    content = value
  }
  else {
    const segment = name.includes(':') ? name.slice(name.indexOf(':') + 1) : name
    const openGraph = context.openGraph as Record<string, unknown> | undefined
    const found = context[segment] ?? (isPlainRecord(openGraph) ? openGraph[segment] : undefined)
    content = found === undefined || found === null || typeof found === 'object' ? '' : String(found)
  }

  if (!content)
    return { kind: 'empty' }

  const usesProperty = PROPERTY_NAMESPACES.some(prefix => name.startsWith(prefix))
  return { kind: 'tag', tag: usesProperty ? { property: name, content } : { name, content } }
}

function resolveMetaName(raw: string, context: Record<string, unknown>): string | ResolvedMeta {
  const literal = parseStringLiteral(raw)
  if (literal !== null)
    return literal.trim() ? literal : { kind: 'error', message: 'the meta name is empty', code: ErrorCodes.INVALID_DIRECTIVE_SYNTAX }

  if (BARE_META_NAME.test(raw.trim()))
    return raw.trim()

  const result = evaluateDirectiveArgument(raw, context)
  if (!result.ok)
    return { kind: 'error', message: `meta name: ${result.message}`, code: result.code }
  if (typeof result.value !== 'string' || !result.value.trim())
    return { kind: 'error', message: `the meta name must be a non-empty string, got ${describeValue(result.value)}`, code: ErrorCodes.TYPE_ERROR }

  return result.value
}

function resolveMetaValue(raw: string, context: Record<string, unknown>): string | ResolvedMeta {
  const literal = parseStringLiteral(raw)
  if (literal !== null)
    return literal

  const result = evaluateDirectiveArgument(raw, context)
  if (!result.ok)
    return { kind: 'error', message: result.message, code: result.code }

  const value = result.value
  if (value === undefined || value === null || value === false)
    return ''
  if (Array.isArray(value))
    return value.filter(item => item !== undefined && item !== null && item !== '').map(String).join(', ')
  if (typeof value === 'object' && !(value instanceof Date))
    return { kind: 'error', message: `the content must be text, got ${describeValue(value)}`, code: ErrorCodes.TYPE_ERROR }

  return String(value)
}
