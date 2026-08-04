import type { PageMeta, SiteConfig } from './types'

/**
 * Replace stx's auto-injected default SEO block (which says "stx Project")
 * with site-specific tags. Looks for the marker comment stx inserts and
 * swaps the wrapped meta tags. If the block isn't found, prepends the
 * tags after <head>.
 */
export function injectSeo(html: string, site: SiteConfig, page: PageMeta = {}, pagePath: string = '/'): string {
  const seo = site.seo ?? {}
  const title = page.title ?? seo.title ?? site.name
  const description = page.description ?? seo.description ?? site.description ?? ''
  const image = page.image ?? seo.image
  const url = `${site.url.replace(/\/$/, '')}${pagePath}`
  const siteName = seo.siteName ?? site.name
  const ogType = seo.type ?? 'website'
  const locale = seo.locale ?? 'en_US'

  const tags: string[] = []
  if (seo.favicon) {
    const ext = seo.favicon.toLowerCase().split('.').pop()
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ''
    tags.push(`<link rel="icon"${mime ? ` type="${mime}"` : ''} href="${escapeAttr(seo.favicon)}">`)
  }
  tags.push(
    `<title>${escapeText(title)}</title>`,
    `<link rel="canonical" href="${escapeAttr(url)}">`,
    `<meta name="description" content="${escapeAttr(description)}">`,
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(description)}">`,
    `<meta property="og:type" content="${escapeAttr(ogType)}">`,
    `<meta property="og:url" content="${escapeAttr(url)}">`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}">`,
    `<meta property="og:locale" content="${escapeAttr(locale)}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`,
  )
  if (image) {
    tags.push(`<meta property="og:image" content="${escapeAttr(image)}">`)
    tags.push(`<meta name="twitter:image" content="${escapeAttr(image)}">`)
  }
  if (seo.twitter) {
    tags.push(`<meta name="twitter:site" content="@${escapeAttr(seo.twitter.replace(/^@/, ''))}">`)
    tags.push(`<meta name="twitter:creator" content="@${escapeAttr(seo.twitter.replace(/^@/, ''))}">`)
  }

  // Strip stx's auto-injected default block, if present
  const stxAutoBlockRe = /<!--\s*stx SEO Tags\s*-->[\s\S]*?<meta\s+name="twitter:description"[^>]*>\s*/i
  if (stxAutoBlockRe.test(html))
    html = html.replace(stxAutoBlockRe, '')

  // Strip any existing block we previously injected (idempotent rebuilds)
  html = html.replace(/<!--\s*SEO\s*-->[\s\S]*?<!--\s*\/SEO\s*-->\s*/g, '')

  // Strip stale tags emitted by stx's defaults that aren't in the marker
  // block. Every pattern is keyed to the placeholder text stx itself writes
  // ("stx Project", "A website built with stx"), so a real page's tags are
  // never caught by it.
  //
  // `og:type=website` and `twitter:card=summary_large_image` used to be in
  // this list keyed on nothing but their value, which is the value a real
  // page most often has: an app that asked for a large card had it deleted
  // here and replaced with `summary` below, and every link it shared showed
  // a thumbnail instead of the card it had built.
  html = html
    .replace(/<meta\s+name="title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')

  /*
   * Fill gaps; never overwrite.
   *
   * A page that authors its own head is the more specific source: it knows
   * the capability being described, the share card that belongs to it and the
   * locale it is being rendered in, none of which the site config can. This
   * used to strip the page's <title> and inject the config's title and og
   * tags ABOVE the page's own, so every page in the site shared one title and
   * one description, and crawlers — which take the first occurrence — showed
   * the generic pair with no image on every link anyone shared.
   *
   * Only the head is consulted, so an SVG <title> deep in the body cannot be
   * mistaken for the document's.
   */
  const headEnd = html.search(/<\/head>/i)
  const head = headEnd === -1 ? html : html.slice(0, headEnd)

  // The document shell ALWAYS emits a <title> — its default is 'stx App' — so a
  // plain "is there a title?" test reported one as declared on every page, and
  // site.seo.title could never take effect (stacksjs/stx#1792 item 6). A
  // placeholder title is treated as absent so the configured one replaces it.
  const PLACEHOLDER_TITLES = /^(?:stx App|stx Project|Document|Untitled)$/i
  const existingTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]?.trim()
  const titleIsPlaceholder = existingTitle === undefined
    || existingTitle === ''
    || PLACEHOLDER_TITLES.test(existingTitle)

  const declared = (tag: string): boolean => {
    const title = /^<title[\s>]/i.test(tag)
    if (title)
      return /<title[\s>]/i.test(head) && !titleIsPlaceholder

    const canonical = /rel="canonical"/i.test(tag)
    if (canonical)
      return /<link[^>]+rel=["']canonical["']/i.test(head)

    const key = /(?:property|name)="([^"]+)"/i.exec(tag)?.[1]
    if (!key)
      return false

    return new RegExp(`<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(head)
  }

  let missing = tags.filter(tag => !declared(tag))

  if (missing.length === 0)
    return html

  // A placeholder <title> must be REPLACED, not joined. Appending a second one
  // does nothing useful: browsers take the first, which is the placeholder we
  // are trying to displace.
  let output = html
  const titleTag = missing.find(tag => /^<title[\s>]/i.test(tag))
  if (titleTag && titleIsPlaceholder && /<title[^>]*>[\s\S]*?<\/title>/i.test(output)) {
    output = output.replace(/<title[^>]*>[\s\S]*?<\/title>/i, () => titleTag)
    missing = missing.filter(tag => tag !== titleTag)
    if (missing.length === 0)
      return output
  }

  const block = `<!-- SEO -->\n${missing.join('\n')}\n<!-- /SEO -->`

  // Injected at the END of the head rather than the start: a tag that is
  // there to fill a gap should not sit in front of the ones the page wrote.
  const outEnd = output.search(/<\/head>/i)
  if (outEnd !== -1)
    return `${output.slice(0, outEnd)}${block}\n${output.slice(outEnd)}`

  if (/<head[^>]*>/i.test(output))
    return output.replace(/<head([^>]*)>/i, `<head$1>\n${block}`)

  return `${block}\n${output}`
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
