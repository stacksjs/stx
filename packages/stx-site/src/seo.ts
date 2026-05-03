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

  const tags: string[] = [
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
  ]
  if (image) {
    tags.push(`<meta property="og:image" content="${escapeAttr(image)}">`)
    tags.push(`<meta name="twitter:image" content="${escapeAttr(image)}">`)
  }
  if (seo.twitter) {
    tags.push(`<meta name="twitter:site" content="@${escapeAttr(seo.twitter.replace(/^@/, ''))}">`)
    tags.push(`<meta name="twitter:creator" content="@${escapeAttr(seo.twitter.replace(/^@/, ''))}">`)
  }

  const block = `<!-- SEO -->\n${tags.join('\n')}\n<!-- /SEO -->`

  // Strip stx's auto-injected default block, if present
  const stxAutoBlockRe = /<!--\s*stx SEO Tags\s*-->[\s\S]*?<meta\s+name="twitter:description"[^>]*>\s*/i
  if (stxAutoBlockRe.test(html))
    html = html.replace(stxAutoBlockRe, '')

  // Strip any existing block we previously injected (idempotent rebuilds)
  html = html.replace(/<!--\s*SEO\s*-->[\s\S]*?<!--\s*\/SEO\s*-->\s*/g, '')

  // Strip stale tags emitted by stx's defaults that aren't in the marker block
  html = html
    .replace(/<meta\s+name="title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')
    .replace(/<meta\s+property="og:type"\s+content="website"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:card"\s+content="summary_large_image"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:title"\s+content="stx Project"[^>]*>\s*/g, '')
    .replace(/<meta\s+name="twitter:description"\s+content="A website built with stx[^"]*"[^>]*>\s*/g, '')

  // Inject after <head ...> (preserves any existing <title>, fonts, etc.)
  if (/<head[^>]*>/i.test(html))
    return html.replace(/<head([^>]*)>/i, `<head$1>\n${block}`)

  return `${block}\n${html}`
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
