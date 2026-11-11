import { escapeAttr } from './builtins/escape'
import { scanAtElementPosition } from './html-masking'
import { decodeTitleEntities } from './spa-nav'

// Preserve authored entities verbatim: the browser, not a partial entity
// table, decodes them once. Only syntax-significant raw characters change.
function quoteValue(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Tags where an element can start, so one written inside a script, style or
// comment is never read as the page's own.
function headTags(html: string): string[] {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1] ?? ''
  const tag = /<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>|<title\b[^>]*>[\s\S]*?<\/title\s*>/giy
  return scanAtElementPosition(head, (source, index) => {
    tag.lastIndex = index
    return tag.exec(source) ? tag.lastIndex : -1
  }).map(({ token }) => token)
}

// Lowercased names, first duplicate wins, as the HTML parser reads them.
function tagAttributes(token: string): Record<string, string> {
  const attrs: Record<string, string> = Object.create(null)
  const attributes = token.replace(/^<\w+\b|>$/g, '')
  for (const match of attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const name = match[1].toLowerCase()
    if (!(name in attrs)) attrs[name] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attrs
}

/** Only page metadata travels across a fragment swap; never executable head state. */
export function pageHeadFragment(html: string): string {
  const metadata: string[] = []
  for (const token of headTags(html)) {
    if (/^<title\b/i.test(token)) {
      metadata.push(`<title>${quoteValue(token.replace(/^<title\b[^>]*>|<\/title\s*>$/gi, ''))}</title>`)
      continue
    }
    const attrs = tagAttributes(token)
    if (/^<meta\b/i.test(token)) {
      const kind = attrs.property ? 'property' : 'name'
      const name = decodeTitleEntities(attrs[kind] ?? '').toLowerCase()
      if (name === 'description' || /^(?:og|twitter):[\w:]+$/.test(name))
        metadata.push(`<meta ${kind}="${escapeAttr(name)}" content="${quoteValue(attrs.content ?? '')}">`)
    }
    else {
      const rel = decodeTitleEntities(attrs.rel ?? '').toLowerCase()
      if (rel === 'canonical' || (rel === 'alternate' && attrs.hreflang)) {
        metadata.push(`<link rel="${rel}" href="${quoteValue(attrs.href ?? '')}"${rel === 'alternate' ? ` hreflang="${quoteValue(attrs.hreflang)}"` : ''}>`)
      }
    }
  }
  // Inert in older clients; an explicitly empty template clears old managed
  // metadata. No template means an older server, whose head we leave alone.
  return `<template data-stx-page-head="1">${metadata.join('')}</template>\n`
}

// What decides how a stylesheet is fetched and when it applies. Nothing else
// on the tag crosses a fragment swap.
const PAGE_CSS_ATTRIBUTES = ['media', 'crossorigin', 'integrity']

/**
 * The stylesheets the page's head links, for a fragment swap to add to the
 * live document.
 *
 * A fragment is the container's inner content, so a page reached by a link
 * click never brought the `<link rel="stylesheet">` its own head declares and
 * rendered with the previous page's CSS. They are assets, not metadata, so
 * they travel beside the metadata template rather than inside it (#2121), and
 * the router only ever adds the ones the document lacks.
 *
 * Generated utility sheets (`data-css`) are left out: they reach the router
 * their own way, and it orders them itself. Empty when the page links none,
 * which a router reads the same as an older server that sends nothing.
 */
export function pageCssFragment(html: string): string {
  const links: string[] = []
  for (const token of headTags(html)) {
    if (!/^<link\b/i.test(token)) continue
    const attrs = tagAttributes(token)
    if (decodeTitleEntities(attrs.rel ?? '').trim().toLowerCase() !== 'stylesheet') continue
    if (!attrs.href || 'data-css' in attrs || 'disabled' in attrs) continue
    const kept = PAGE_CSS_ATTRIBUTES.filter(name => name in attrs).map(name => ` ${name}="${quoteValue(attrs[name])}"`).join('')
    links.push(`<link rel="stylesheet" href="${quoteValue(attrs.href)}"${kept}>`)
  }
  return links.length ? `<template data-stx-page-css="1">${links.join('')}</template>\n` : ''
}
