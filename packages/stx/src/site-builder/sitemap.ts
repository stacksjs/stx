import type { PageMeta, SiteConfig } from './types'

export interface SitemapEntry {
  path: string
  page?: PageMeta
}

/**
 * Generate sitemap.xml content from a list of built pages.
 * Pages with `sitemap: false` in their config are excluded.
 */
export function generateSitemap(site: SiteConfig, entries: SitemapEntry[]): string {
  const baseUrl = site.url.replace(/\/$/, '')
  const now = new Date().toISOString().slice(0, 10)

  const items = entries
    .filter(e => e.page?.sitemap !== false)
    .map((e) => {
      const url = `${baseUrl}${e.path}`
      const priority = e.page?.priority ?? (e.path === '/' ? 1.0 : 0.8)
      const changefreq = e.page?.changefreq ?? 'monthly'
      return [
        '  <url>',
        `    <loc>${escape(url)}</loc>`,
        `    <lastmod>${now}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n')
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    items.join('\n'),
    '</urlset>',
    '',
  ].join('\n')
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
