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

import type { AppHeadConfig } from './types/config-types'

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
    /** Extra styles to inject in <head> (e.g. Crosswind CSS, scoped styles) */
    styles?: string[]
    /** Extra scripts to inject before </body> (e.g. signals runtime, router) */
    bodyScripts?: string[]
    /** Extra scripts/tags for <head> */
    headScripts?: string[]
    /** Stacks to inject (from @push directives) */
    headStack?: string
    bodyStack?: string
  } = {},
): string {
  const {
    title: configTitle = 'stx App',
    lang = 'en',
    meta = [],
    link = [],
    script: headScriptTags = [],
    headRaw = '',
    bodyClass = '',
    bodyAttrs = {},
  } = headConfig

  const pageTitle = options.title || configTitle

  // Build <meta> tags
  const defaultMeta = [
    { charset: 'UTF-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
  ]
  const allMeta = [...defaultMeta, ...meta]
  const metaTags = allMeta.map(m => {
    const attrs = Object.entries(m).map(([k, v]) => `${k}="${v}"`).join(' ')
    return `  <meta ${attrs}>`
  }).join('\n')

  // Build <link> tags
  const linkTags = link.map(l => {
    const attrs = Object.entries(l).map(([k, v]) => `${k}="${v}"`).join(' ')
    return `  <link ${attrs}>`
  }).join('\n')

  // Build <head> script tags (from config)
  const configHeadScripts = headScriptTags.map(s => {
    if (s.src) {
      const attrs = Object.entries(s).filter(([k]) => k !== 'content').map(([k, v]) => `${k}="${v}"`).join(' ')
      return `  <script ${attrs}></script>`
    }
    if (s.content) {
      return `  <script>${s.content}</script>`
    }
    return ''
  }).filter(Boolean).join('\n')

  // Build body attributes
  const bodyAttrStr = Object.entries(bodyAttrs).map(([k, v]) => ` ${k}="${v}"`).join('')
  const bodyClassStr = bodyClass ? ` class="${bodyClass}"` : ''

  // Compose <head>. The cloak style goes in early (before user styles and
  // scripts) so the [x-cloak] rule is live before first paint — prevents the
  // conditional-directive FOUC (#1736).
  const headParts = [
    metaTags,
    `  <title>${pageTitle}</title>`,
    `  ${CLOAK_STYLE}`,
    linkTags,
    configHeadScripts,
    headRaw ? `  ${headRaw}` : '',
    ...(options.styles || []).map(s => `  ${s}`),
    ...(options.headScripts || []).map(s => `  ${s}`),
    options.headStack || '',
  ].filter(Boolean)

  // Compose body
  const bodyParts = [
    content,
    ...(options.bodyScripts || []).map(s => s),
    options.bodyStack || '',
  ].filter(Boolean)

  return `<!DOCTYPE html>
<html lang="${lang}">
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
export function hasDocumentShell(html: string): boolean {
  return /<!DOCTYPE\b/i.test(html) || /<html[\s>]/i.test(html)
}

/**
 * Wrap HTML in a document shell if it doesn't already have one.
 * This is the main entry point — called at the top level after all
 * directive processing is complete.
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
