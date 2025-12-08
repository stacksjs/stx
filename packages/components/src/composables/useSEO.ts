/**
 * SEO and meta tag utilities for STX components
 */

export interface SEOMetaOptions {
  title?: string
  description?: string
  author?: string
  keywords?: string[]
  ogImage?: string
  ogImageWidth?: string
  ogImageHeight?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterCreator?: string
  canonical?: string
}

/**
 * Set document title
 */
export function setTitle(title: string, template?: string) {
  if (typeof document === 'undefined')
    return

  document.title = template ? template.replace('%s', title) : title
}

/**
 * Set meta tag
 */
export function setMeta(name: string, content: string, isProperty = false) {
  if (typeof document === 'undefined')
    return

  const attribute = isProperty ? 'property' : 'name'
  let meta = document.querySelector(`meta[${attribute}="${name}"]`)

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

/**
 * Set link tag
 */
export function setLink(rel: string, href: string) {
  if (typeof document === 'undefined')
    return

  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    document.head.appendChild(link)
  }

  link.setAttribute('href', href)
}

/**
 * Use SEO meta tags
 */
export function useSEO(options: SEOMetaOptions) {
  const {
    title,
    description,
    author,
    keywords,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    twitterCard = 'summary_large_image',
    twitterSite,
    twitterCreator,
    canonical,
  } = options

  // Set title
  if (title) {
    setTitle(title)
    setMeta('og:title', title, true)
    setMeta('twitter:title', title)
  }

  // Set description
  if (description) {
    setMeta('description', description)
    setMeta('og:description', description, true)
    setMeta('twitter:description', description)
  }

  // Set author
  if (author) {
    setMeta('author', author)
  }

  // Set keywords
  if (keywords && keywords.length > 0) {
    setMeta('keywords', keywords.join(', '))
  }

  // Set Open Graph image
  if (ogImage) {
    setMeta('og:image', ogImage, true)
    setMeta('twitter:image', ogImage)
  }

  if (ogImageWidth) {
    setMeta('og:image:width', ogImageWidth, true)
  }

  if (ogImageHeight) {
    setMeta('og:image:height', ogImageHeight, true)
  }

  // Set Twitter card
  setMeta('twitter:card', twitterCard)

  if (twitterSite) {
    setMeta('twitter:site', twitterSite)
  }

  if (twitterCreator) {
    setMeta('twitter:creator', twitterCreator)
  }

  // Set canonical URL
  if (canonical) {
    setLink('canonical', canonical)
  }

  // Set og:type
  setMeta('og:type', 'website', true)

  // Set og:url from current URL
  if (typeof window !== 'undefined') {
    setMeta('og:url', window.location.href, true)
  }
}

/**
 * Generate SEO meta tags as HTML string for server-side rendering
 */
export function generateSEOTags(options: SEOMetaOptions): string {
  const tags: string[] = []

  const {
    title,
    description,
    author,
    keywords,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    twitterCard = 'summary_large_image',
    twitterSite,
    twitterCreator,
    canonical,
  } = options

  if (title) {
    tags.push(`<title>${escapeHtml(title)}</title>`)
    tags.push(`<meta property="og:title" content="${escapeHtml(title)}" />`)
    tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`)
  }

  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}" />`)
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}" />`)
    tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`)
  }

  if (author) {
    tags.push(`<meta name="author" content="${escapeHtml(author)}" />`)
  }

  if (keywords && keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords.join(', '))}" />`)
  }

  if (ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`)
    tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`)
  }

  if (ogImageWidth) {
    tags.push(`<meta property="og:image:width" content="${escapeHtml(ogImageWidth)}" />`)
  }

  if (ogImageHeight) {
    tags.push(`<meta property="og:image:height" content="${escapeHtml(ogImageHeight)}" />`)
  }

  tags.push(`<meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`)

  if (twitterSite) {
    tags.push(`<meta name="twitter:site" content="${escapeHtml(twitterSite)}" />`)
  }

  if (twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${escapeHtml(twitterCreator)}" />`)
  }

  if (canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`)
  }

  tags.push('<meta property="og:type" content="website" />')

  return tags.join('\n')
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
