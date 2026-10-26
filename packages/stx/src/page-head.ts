import { escapeAttr } from './builtins/escape'
import { scanAtElementPosition } from './html-masking'
import { decodeTitleEntities } from './spa-nav'

// Preserve authored entities verbatim: the browser, not a partial entity
// table, decodes them once. Only syntax-significant raw characters change.
function quoteValue(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Only page metadata travels across a fragment swap; never executable head state. */
export function pageHeadFragment(html: string): string {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1] ?? ''
  const tag = /<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>|<title\b[^>]*>[\s\S]*?<\/title\s*>/giy
  const tags = scanAtElementPosition(head, (source, index) => {
    tag.lastIndex = index
    return tag.exec(source) ? tag.lastIndex : -1
  })
  const metadata: string[] = []
  for (const { token } of tags) {
    if (/^<title\b/i.test(token)) {
      metadata.push(`<title>${quoteValue(token.replace(/^<title\b[^>]*>|<\/title\s*>$/gi, ''))}</title>`)
      continue
    }
    const attrs: Record<string, string> = Object.create(null)
    const attributes = token.replace(/^<\w+\b|>$/g, '')
    for (const match of attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const name = match[1].toLowerCase()
      if (!(name in attrs)) attrs[name] = match[2] ?? match[3] ?? match[4] ?? ''
    }
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
