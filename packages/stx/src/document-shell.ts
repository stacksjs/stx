/**
 * Document Shell Generator
 *
 * Auto-generates the HTML document wrapper around page content.
 * No .stx file needs to write <!DOCTYPE>, <html>, <head>, or <body>.
 * The shell is configured via stx.config.ts `app.head` and enhanced
 * at build/serve time with runtime scripts, CSS, and meta tags.
 *
 * @module document-shell
 */

import type { ColorModeBootConfig } from './color-mode-boot'
import type { AppHeadConfig } from './types/config-types'
import { generateColorModeBootScript } from './color-mode-boot'

/**
 * Inline x-cloak rule shipped in the SSR <head> (stacksjs/stx#1736).
 *
 * Must be parsed by the browser BEFORE first paint — so it goes in the head
 * as static markup, not injected by the runtime script (which runs after the
 * body has already painted, the window where false `:if` branches / hidden
 * `:show` elements flash). The `data-stx-cloak` marker makes injection
 * idempotent. The runtime's own late injection (signals.ts) is retained as a
 * belt-and-suspenders for SPA-nav fragments that arrive without SSR head
 * emission.
 */
export const CLOAK_STYLE = '<style data-stx-cloak>[x-cloak]{display:none !important}</style>'

/**
 * Markers recording which `<html>` attributes stx itself wrote from `htmlAttrs`
 * (stacksjs/stx#1798).
 *
 * The router needs them to reconcile the root element across an SPA layout
 * change. It cannot just diff `<html>` against the incoming document: by then
 * the color-mode boot script has added its own `dark` class / `data-theme`, and
 * `animation.ts` has added `data-reduced-motion`, none of which exist in the
 * server response — a blind diff would strip them on every navigation and
 * flash the wrong theme. These say exactly what stx put there, so the router
 * can remove precisely that much and leave runtime state alone.
 *
 * `class` is tracked separately because it is the one attribute that gets
 * *merged* into at runtime, so it has to be reconciled token-by-token rather
 * than replaced wholesale.
 */
export const HTML_ATTRS_MARKER = 'data-stx-html-attrs'
export const HTML_CLASS_MARKER = 'data-stx-html-class'

/** Attribute names safe to emit unquoted-name into an open tag. */
const SAFE_ATTR_NAME = /^[A-Za-z_:][\w:.-]*$/

function escapeAttr(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Escape a value being emitted as element TEXT rather than as an attribute.
 *
 * `<title>` is RCDATA: markup inside it is not parsed, but the closing tag is
 * still recognised, so an unescaped title containing a closing title tag ends
 * the element early and everything after it is parsed as markup. A title is
 * routinely user-influenced — frontmatter, a server script, a database row —
 * which made this a stored XSS (stacksjs/stx#1792, part one item 4).
 *
 * Escaping `<` is what closes it; `&` is escaped too so an existing entity in a
 * legitimate title round-trips instead of being double-decoded.
 */
function escapeText(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Emit `k="v"` pairs with every value attribute-escaped. */
/**
 * The identity of a `<meta>` tag, for deduplication.
 *
 * Shared by both places that merge config head tags into a page, because they
 * disagreed: injectConfigHeadTags deduped and generateDocumentShell just
 * concatenated, so the same `app.head.meta` produced one `<meta charset>` on a
 * page that owned its document and two on a page built through the shell
 * (stacksjs/stx#1840). One key, one answer.
 *
 * Returns '' for a tag with no identifying attribute, which the callers treat
 * as "cannot dedup, keep it".
 */
export function metaDedupKey(m: Record<string, string>): string {
  if (m.name)
    return `name="${m.name}"`
  if (m.property)
    return `property="${m.property}"`
  if (m.charset != null)
    return 'charset='
  if (m['http-equiv'])
    return `http-equiv="${m['http-equiv']}"`
  return ''
}

function attrPairs(entries: Record<string, unknown>, skip?: (key: string) => boolean): string {
  return Object.entries(entries)
    .filter(([k]) => !skip?.(k))
    .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
    .join(' ')
}

/**
 * Build the attribute string for the shell's `<html>` open tag.
 *
 * `htmlAttrs.lang` wins over the `lang` option so `useHead({ htmlAttrs: { lang } })`
 * is not emitted twice (two `lang=` attributes on one element is a parse error
 * that browsers resolve by keeping the first — i.e. silently ignoring the
 * more specific one).
 *
 * @param htmlAttrs - Attributes from config `app.head.htmlAttrs` / `useHead()`
 * @param lang - The `lang` option, used unless `htmlAttrs.lang` overrides it
 * @returns Leading-space-prefixed attribute string, e.g. ` lang="en" class="marketing"`
 */
export function buildHtmlAttrs(htmlAttrs: Record<string, string> = {}, lang: string = 'en'): string {
  const rest: string[] = []
  const managed: string[] = []
  let className = ''
  let resolvedLang = lang

  for (const [rawName, value] of Object.entries(htmlAttrs || {})) {
    if (value == null)
      continue
    const name = rawName.trim()
    if (!SAFE_ATTR_NAME.test(name))
      continue
    const lower = name.toLowerCase()
    if (lower === 'lang') {
      resolvedLang = String(value)
      continue
    }
    if (lower === 'class') {
      className = String(value).trim()
      continue
    }
    rest.push(` ${name}="${escapeAttr(String(value))}"`)
    managed.push(name)
  }

  let out = ` lang="${escapeAttr(resolvedLang)}"`
  if (className)
    out += ` class="${escapeAttr(className)}"`
  out += rest.join('')
  // Markers only when there is something for the router to undo.
  if (className)
    out += ` ${HTML_CLASS_MARKER}="${escapeAttr(className)}"`
  if (managed.length)
    out += ` ${HTML_ATTRS_MARKER}="${escapeAttr(managed.join(' '))}"`
  return out
}

/**
 * Merge a page's `htmlAttrs` over the config's.
 *
 * Per-key override, except `class`, which unions: a global
 * `app.head.htmlAttrs.class` (`h-full`, a font class, …) shouldn't silently
 * vanish the moment one page adds a class of its own. Same rule as
 * `applyHtmlAttrs`, so "class unions, everything else overrides" holds at every
 * point htmlAttrs are combined.
 */
export function mergeHtmlAttrs(
  base: Record<string, string> = {},
  override: Record<string, string> = {},
): Record<string, string> {
  const merged = { ...base, ...override }
  if (base.class && override.class) {
    const tokens = base.class.split(/\s+/).filter(Boolean)
    for (const token of override.class.split(/\s+/).filter(Boolean)) {
      if (!tokens.includes(token))
        tokens.push(token)
    }
    merged.class = tokens.join(' ')
  }
  return merged
}

/**
 * Merge `htmlAttrs` into a document that rendered its OWN `<html>` tag.
 *
 * `generateDocumentShell` only runs for pages without a shell, so a page or
 * layout that writes `<html>` itself — the common case, and what SSG emits —
 * would otherwise drop `useHead({ htmlAttrs })` entirely. Whether the attribute
 * lands should not depend on who wrote the document element.
 *
 * `class` unions with what the template already put there (the template's own
 * classes are never dropped); every other attribute is overwritten. Only the
 * classes stx contributed are recorded in the marker, so an SPA navigation
 * removes those and leaves the hand-written ones in place.
 */
export function applyHtmlAttrs(html: string, htmlAttrs: Record<string, string> = {}): string {
  if (!htmlAttrs || Object.keys(htmlAttrs).length === 0)
    return html

  const openTag = html.match(/<html\b([^>]*)>/i)
  if (!openTag)
    return html

  const existing: Record<string, string> = {}
  const order: string[] = []
  const attrRe = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(openTag[1])) !== null) {
    const name = m[1]
    if (!(name in existing))
      order.push(name)
    existing[name] = m[2] ?? m[3] ?? m[4] ?? ''
  }

  const addedClasses: string[] = []
  const managed: string[] = []

  for (const [rawName, value] of Object.entries(htmlAttrs)) {
    if (value == null)
      continue
    const name = rawName.trim()
    if (!SAFE_ATTR_NAME.test(name))
      continue
    const lower = name.toLowerCase()

    if (lower === 'class') {
      const present = (existing.class || '').split(/\s+/).filter(Boolean)
      for (const token of String(value).split(/\s+/).filter(Boolean)) {
        if (!present.includes(token)) {
          present.push(token)
          addedClasses.push(token)
        }
      }
      if (!('class' in existing))
        order.push('class')
      existing.class = present.join(' ')
      continue
    }

    if (!(name in existing))
      order.push(name)
    existing[name] = String(value)
    if (lower !== 'lang')
      managed.push(name)
  }

  if (addedClasses.length) {
    if (!(HTML_CLASS_MARKER in existing))
      order.push(HTML_CLASS_MARKER)
    existing[HTML_CLASS_MARKER] = addedClasses.join(' ')
  }
  if (managed.length) {
    if (!(HTML_ATTRS_MARKER in existing))
      order.push(HTML_ATTRS_MARKER)
    existing[HTML_ATTRS_MARKER] = managed.join(' ')
  }

  const rebuilt = order.map(name => ` ${name}="${escapeAttr(existing[name])}"`).join('')
  // Function replacement: an attribute value containing `$&` or `$1` would
  // otherwise be re-expanded as a replacement pattern.
  return html.replace(openTag[0], () => `<html${rebuilt}>`)
}

/**
 * Insert the inline x-cloak <style> before </head> if a head exists and the
 * style isn't already present. Idempotent (guards on the data-stx-cloak
 * marker). No-op when the output has no </head> — those paths fall back to
 * the runtime's late injection.
 */
export function injectCloakStyle(html: string): string {
  if (html.includes('data-stx-cloak'))
    return html
  const headCloseIdx = html.lastIndexOf('</head>')
  if (headCloseIdx === -1)
    return html
  return `${html.slice(0, headCloseIdx)}${CLOAK_STYLE}\n${html.slice(headCloseIdx)}`
}

/**
 * Pull the page's own `<link>` / `<style>` off the front of a fragment so the
 * shell can put them in `<head>` where they belong.
 *
 * A fragment page (no `<html>/<head>/<body>` of its own) writes its font links
 * and scoped styles at the top of the file. Without this they land verbatim in
 * `<body>`, which *renders* fine — browsers honour `<link>` and `<style>` in
 * body — but breaks SPA navigation: the router reconciles `head style` and
 * `head link[rel=stylesheet]` only, so on a container-only swap the incoming
 * page's CSS is never applied and the form/page paints unstyled. It looked
 * correct on reload and wrong on navigation, which is what made it hard to see.
 *
 * Deliberately conservative: only the leading run is hoisted (whitespace,
 * comments and `<script>` blocks are stepped over, never moved), so a `<style>`
 * sitting next to the markup it styles further down the page is left alone.
 */
export function hoistLeadingHeadTags(content: string): { body: string, hoisted: string[] } {
  const hoisted: string[] = []
  let i = 0

  while (i < content.length) {
    const rest = content.slice(i)

    const ws = rest.match(/^\s+/)
    if (ws) { i += ws[0].length; continue }

    if (rest.startsWith('<!--')) {
      const end = content.indexOf('-->', i)
      if (end === -1) break
      i = end + 3
      continue
    }

    // Stepped over, not hoisted — a script here is usually the signals/setup
    // block, and it must keep its position relative to the markup it drives.
    const scriptOpen = rest.match(/^<script\b[^>]*>/i)
    if (scriptOpen) {
      const end = content.toLowerCase().indexOf('</script>', i + scriptOpen[0].length)
      if (end === -1) break
      i = end + '</script>'.length
      continue
    }

    const link = rest.match(/^<link\b[^>]*>/i)
    if (link) { hoisted.push(link[0]); i += link[0].length; continue }

    // <meta> too: a fragment declaring `stx-layout` needs it in <head> for the
    // router's layout-group comparison to read it off the fetched document.
    const meta = rest.match(/^<meta\b[^>]*>/i)
    if (meta) { hoisted.push(meta[0]); i += meta[0].length; continue }

    const style = rest.match(/^<style\b[^>]*>[\s\S]*?<\/style>/i)
    if (style) { hoisted.push(style[0]); i += style[0].length; continue }

    break
  }

  if (hoisted.length === 0)
    return { body: content, hoisted }

  // Rebuild the body without the hoisted tags, keeping everything that was
  // stepped over. Splicing by index would drop the scripts and comments.
  let body = ''
  let j = 0
  while (j < content.length && j < i) {
    const rest = content.slice(j)
    const link = rest.match(/^<link\b[^>]*>/i)
    if (link && hoisted.includes(link[0])) { j += link[0].length; continue }
    const meta = rest.match(/^<meta\b[^>]*>/i)
    if (meta && hoisted.includes(meta[0])) { j += meta[0].length; continue }
    const style = rest.match(/^<style\b[^>]*>[\s\S]*?<\/style>/i)
    if (style && hoisted.includes(style[0])) { j += style[0].length; continue }
    body += content[j]
    j++
  }
  body += content.slice(i)

  return { body, hoisted }
}

/**
 * Generate the full HTML document shell wrapping page content.
 *
 * @param content - The rendered page/layout HTML (no document wrapper)
 * @param headConfig - Head configuration from stx.config.ts
 * @param options - Additional options for script/style injection
 * @returns Complete HTML document
 */
export function generateDocumentShell(
  content: string,
  headConfig: AppHeadConfig = {},
  options: {
    /** Page-specific title (overrides config) */
    title?: string
    /**
     * The title is already HTML and must NOT be escaped again.
     *
     * Set when the title was lifted out of author-written markup — an
     * `@head <title>` block or `@section('title')` — where entities are already
     * in their final form and any interpolation has already been escaped by
     * `{{ }}`. Escaping it a second time renders `Caf&eacute; &amp; Bar` as
     * `Caf&amp;eacute; &amp;amp; Bar`.
     *
     * A title from `useHead({ title })` is a plain JS string and must stay
     * escaped — that is the XSS path (#1792 item 4).
     */
    titleIsHtml?: boolean
    /** Extra styles to inject in <head> (e.g. Crosswind CSS, scoped styles) */
    styles?: string[]
    /** Extra scripts to inject before </body> (e.g. signals runtime, router) */
    bodyScripts?: string[]
    /** Extra scripts/tags for <head> */
    headScripts?: string[]
    /** Stacks to inject (from @push directives) */
    headStack?: string
    bodyStack?: string
    /**
     * Pre-paint color-mode config (stacksjs/stx#1794). When present, the boot
     * script is emitted at the very top of <head> — above the stylesheets,
     * because a stylesheet link ahead of it would block its execution and
     * delay the one thing it exists to do early.
     */
    colorMode?: ColorModeBootConfig
  } = {},
): string {
  const {
    title: configTitle = 'stx App',
    lang = 'en',
    meta = [],
    link = [],
    script: headScriptTags = [],
    headRaw = '',
    htmlAttrs = {},
    bodyClass = '',
    bodyAttrs = {},
  } = headConfig

  const pageTitle = options.title || configTitle

  // Build <meta> tags.
  //
  // The defaults yield to config rather than stacking with it. Declaring
  // `charset` or `viewport` in app.head.meta — the obvious place for site-wide
  // head tags — used to emit TWO of each on every page built through the shell,
  // while a page topped up by injectConfigHeadTags correctly got one. Same
  // config, different head, depending only on whether the page owned its own
  // document (stacksjs/stx#1840).
  //
  // Config wins for the same reason the page's own head wins in
  // injectConfigHeadTags: between an author's declaration and a framework
  // default, the author's is the more specific statement of intent.
  const defaultMeta: Record<string, string>[] = [
    { charset: 'UTF-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
  ]
  const configuredMetaKeys = new Set(
    (meta as Record<string, string>[]).map(metaDedupKey).filter(Boolean),
  )
  const allMeta = [
    ...defaultMeta.filter(d => !configuredMetaKeys.has(metaDedupKey(d))),
    ...meta,
  ]
  const metaTags = allMeta.map(m => {
    return `  <meta ${attrPairs(m)}>`
  }).join('\n')

  // Build <link> tags
  const linkTags = link.map(l => {
    return `  <link ${attrPairs(l)}>`
  }).join('\n')

  // Build <head> script tags (from config)
  const configHeadScripts = headScriptTags.map(s => {
    if (s.src) {
      return `  <script ${attrPairs(s, k => k === 'content')}></script>`
    }
    if (s.content) {
      return `  <script>${s.content}</script>`
    }
    return ''
  }).filter(Boolean).join('\n')

  // Build <html> and <body> attributes
  const htmlAttrStr = buildHtmlAttrs(htmlAttrs, lang)
  const bodyAttrStr = Object.entries(bodyAttrs).map(([k, v]) => ` ${k}="${escapeAttr(String(v))}"`).join('')
  const bodyClassStr = bodyClass ? ` class="${escapeAttr(bodyClass)}"` : ''

  // Compose <head>. The cloak style goes in early (before user styles and
  // scripts) so the [x-cloak] rule is live before first paint — prevents the
  // conditional-directive FOUC (#1736).
  // The page's own head tags come out of the fragment body — see
  // hoistLeadingHeadTags. They sit AFTER options.styles (Crosswind) so the page
  // still wins the cascade exactly as it did when it rendered inside <body>.
  const { body: pageBody, hoisted: pageHeadTags } = hoistLeadingHeadTags(content)

  const headParts = [
    metaTags,
    // Directly after <meta charset>, ahead of every stylesheet: the theme has
    // to be on the root element before first paint, and CSS blocks scripts.
    options.colorMode ? `  ${generateColorModeBootScript(options.colorMode)}` : '',
    `  <title>${options.titleIsHtml ? pageTitle : escapeText(pageTitle)}</title>`,
    `  ${CLOAK_STYLE}`,
    linkTags,
    configHeadScripts,
    headRaw ? `  ${headRaw}` : '',
    ...(options.styles || []).map(s => `  ${s}`),
    ...pageHeadTags.map(s => `  ${s}`),
    ...(options.headScripts || []).map(s => `  ${s}`),
    options.headStack || '',
  ].filter(Boolean)

  // Compose body
  const bodyParts = [
    pageBody,
    ...(options.bodyScripts || []).map(s => s),
    options.bodyStack || '',
  ].filter(Boolean)

  return `<!DOCTYPE html>
<html${htmlAttrStr}>
<head>
${headParts.join('\n')}
</head>
<body${bodyClassStr}${bodyAttrStr}>
${bodyParts.join('\n')}
</body>
</html>`
}

/**
 * Check if HTML already has a document shell (<!DOCTYPE> or <html>).
 * Templates that extend layouts with document shells should not be
 * double-wrapped — the visible artifact of a double-wrap is the user's
 * `<title>` getting nested under the auto-shell's default `stx App`,
 * which then wins for `document.title` because it appears first.
 *
 * The check is permissive on placement: if the rendered output contains
 * a `<!DOCTYPE>` or `<html>` ANYWHERE, the user has supplied a shell.
 * Earlier this only checked the leading bytes after stripping comments,
 * but other directives (signals runtime, scoped scripts, theme guards)
 * happily prepend their own `<script>` tags before any layout markup,
 * which made the check spuriously fail and auto-shell wrap the user's
 * complete HTML doc as if it were just body content.
 */
/**
 * Does this string OPEN a full HTML document?
 *
 * Anchored, but tolerant of what stx's own pipeline prepends: whitespace, HTML
 * comments, and `<script>` blocks (the signals runtime, scoped setup scripts,
 * theme guards) all routinely land ahead of a layout's markup.
 *
 * The check used to be `/<!DOCTYPE\b/i` — unanchored — so the literal text
 * `<!DOCTYPE` ANYWHERE made a fragment look like a document and sent it through
 * wrapper-stripping. Easy to hit on any page that documents HTML: a doctype in
 * a comment, in a `<pre><code>` sample, or in a JS string (stacksjs#1787). The
 * `<html>` half was already anchored, so the asymmetry was clearly accidental.
 *
 * Note this is the opposite bias from `hasDocumentShell` in document-shell.ts,
 * which stays permissive on purpose: there, a false negative double-wraps a
 * complete document, so leaning towards "yes, it's a document" is the safe
 * direction. Here a false positive shreds a fragment, so it leans the other way.
 */
export function startsDocument(html: string): boolean {
  let i = 0
  while (i < html.length) {
    const rest = html.slice(i)

    const ws = rest.match(/^\s+/)
    if (ws) {
      i += ws[0].length
      continue
    }

    if (rest.startsWith('<!--')) {
      const end = html.indexOf('-->', i)
      if (end === -1)
        return false
      i = end + 3
      continue
    }

    // Step over leading <script> and <style>. Both legitimately precede the
    // wrapper in real output (an injected boot script, a hoisted style), and
    // treating such a document as a fragment would wrap it and nest <html>.
    const preamble = rest.match(/^<(script|style)\b[^>]*>/i)
    if (preamble) {
      const closeTag = `</${preamble[1].toLowerCase()}>`
      const end = html.toLowerCase().indexOf(closeTag, i + preamble[0].length)
      if (end === -1)
        return false
      i = end + closeTag.length
      continue
    }

    return /^<!DOCTYPE\b/i.test(rest) || /^<html[\s>]/i.test(rest)
  }
  return false
}

/**
 * Does this output already carry a document wrapper?
 *
 * ANCHORED, and it has to be. The test used to be an unanchored
 * `/<html[\s>]/i.test(html)`, so a DOCTYPE or an html tag mentioned ANYWHERE —
 * including inside an HTML comment — reported a shell that was not there
 * (stacksjs/stx#1792, part one item 3).
 *
 * The cascade was silent and severe: no shell means no `<head>`, so
 * `injectCloakStyle` bails and every element stx deliberately cloaked renders
 * VISIBLE; no `<meta name="stx-layout">`; and with neither that meta nor
 * `data-stx-content` the router's document sniff fails, so every navigation
 * hard-reloads. One comment mentioning the root element was enough, and the
 * reporter ended up writing a house rule telling authors not to name the tag in
 * prose.
 *
 * Shares `startsDocument` with the app-shell path, which was anchored for the
 * same reason in #1787 and had been the outlier's correct twin ever since.
 */
export function hasDocumentShell(html: string): boolean {
  return startsDocument(html)
}

/**
 * Inject the config `app.head` tags — script / meta / link / headRaw, but NOT
 * `title` — into an EXISTING `<head>`.
 *
 * `generateDocumentShell` populates config head only when IT builds the shell.
 * A page whose layout already renders `<html><head>` (the common case, and what
 * SSG/static builds emit) skips that path, so global config head never lands —
 * most visibly a site-wide analytics `<script>` (Fathom/Contentsquare/…) that
 * silently never injects on layout-based or statically-built pages.
 *
 * Idempotent: skips a `<script src>`, `<link href>`, meta name/property/charset/
 * http-equiv, or inline `<script>` content already present in the head, so it's
 * safe to run even when the layout or `useHead` already emitted the same tag.
 * `title` is intentionally excluded — the page/layout owns its own title.
 */
export function injectConfigHeadTags(html: string, headConfig: AppHeadConfig = {}): string {
  const headCloseIdx = html.lastIndexOf('</head>')
  if (headCloseIdx === -1)
    return html

  const { meta = [], link = [], script = [], headRaw = '' } = headConfig
  const head = html.slice(0, headCloseIdx)
  const parts: string[] = []

  for (const m of meta as Record<string, string>[]) {
    const dedup = metaDedupKey(m)
    if (dedup && head.includes(dedup))
      continue
    parts.push(`  <meta ${attrPairs(m)}>`)
  }

  for (const l of link as Record<string, string>[]) {
    if (l.href && head.includes(`href="${l.href}"`))
      continue
    parts.push(`  <link ${attrPairs(l)}>`)
  }

  for (const s of script as Record<string, any>[]) {
    if (s.src) {
      if (head.includes(`src="${s.src}"`))
        continue
      parts.push(`  <script ${attrPairs(s, k => k === 'content')}></script>`)
    }
    else if (s.content) {
      if (head.includes(s.content))
        continue
      parts.push(`  <script>${s.content}</script>`)
    }
  }

  if (headRaw && !head.includes(headRaw))
    parts.push(`  ${headRaw}`)

  if (parts.length === 0)
    return html
  return `${html.slice(0, headCloseIdx)}${parts.join('\n')}\n${html.slice(headCloseIdx)}`
}

/**
 * Wrap HTML in a document shell if it doesn't already have one.
 * This is the main entry point — called at the top level after all
 * directive processing is complete.
 *
 * When the html ALREADY has a shell we don't re-wrap (and don't touch its
 * head here — the caller injects config-only head via `injectConfigHeadTags`,
 * so runtime `useHead` tags aren't double-emitted).
 */
export function ensureDocumentShell(
  html: string,
  headConfig: AppHeadConfig = {},
  options: Parameters<typeof generateDocumentShell>[2] = {},
): string {
  if (hasDocumentShell(html)) {
    return html
  }
  return generateDocumentShell(html, headConfig, options)
}
