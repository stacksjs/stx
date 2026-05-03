import type { SiteConfig } from './types'

export function generateRobots(site: SiteConfig): string | null {
  const mode = site.robots ?? 'allow'

  if (mode === false) return null

  if (typeof mode === 'string' && mode !== 'allow' && mode !== 'disallow') {
    // Treat as raw robots.txt content
    return mode.endsWith('\n') ? mode : `${mode}\n`
  }

  const sitemapLine = site.sitemap !== false
    ? `Sitemap: ${site.url.replace(/\/$/, '')}/sitemap.xml\n`
    : ''

  if (mode === 'disallow') {
    return [
      'User-agent: *',
      'Disallow: /',
      '',
      sitemapLine,
    ].filter(Boolean).join('\n')
  }

  return [
    'User-agent: *',
    'Allow: /',
    '',
    sitemapLine,
  ].filter(Boolean).join('\n')
}
