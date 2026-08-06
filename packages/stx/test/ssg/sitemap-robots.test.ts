/**
 * The static build publishes a sitemap that is true and a robots.txt at all
 * (stacksjs/stx#1866).
 *
 * Three compounding gaps, all silent: `domain` defaulted to `http://localhost`
 * and read no config, so an app declaring `url: 'https://example.org'` shipped
 * 34 sitemap entries all pointing at localhost; there was no exclusion of any
 * kind, so `/login`, `/account` and every partial were advertised as public
 * URLs; and no robots.txt was produced even though stx contained two robots
 * generators, neither wired to this path.
 *
 * The reporting app's response is the tell: it hand-authored 26 lines of
 * robots.txt, restated every exclusion there, and added `noindex` to each
 * auth-walled page — three hand-maintained lists standing in for one build.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { isExcludedFromSitemap } from '../../src/ssg'
import { resolveSiteUrl, SITE_URL_FALLBACK } from '../../src/site-url'

let dir = ''
const originalCwd = process.cwd()

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-sitemap-'))
  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><h1>Home</h1></main>\n')
  await Bun.write(path.join(dir, 'views', 'login.stx'), '<main><h1>Login</h1></main>\n')
  await Bun.write(path.join(dir, 'views', 'components', 'site-nav.stx'), '<nav>nav</nav>\n')
})

afterEach(async () => {
  process.chdir(originalCwd)
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function build(options: Record<string, unknown> = {}): Promise<void> {
  process.chdir(dir)
  const { generateStaticSite } = await import('../../src/ssg')
  await generateStaticSite({ pagesDir: 'views', outputDir: 'dist', ...options })
}

function read(file: string): string {
  return existsSync(path.join(dir, 'dist', file)) ? require('node:fs').readFileSync(path.join(dir, 'dist', file), 'utf8') : ''
}

describe('the site URL', () => {
  it('prefers an explicit domain', async () => {
    const resolved = await resolveSiteUrl({ explicit: 'https://explicit.test', cwd: dir, env: {} })

    expect(resolved).toMatchObject({ url: 'https://explicit.test', source: 'option' })
  })

  it('reads site.url from stx.config', async () => {
    const resolved = await resolveSiteUrl({ stxConfig: { site: { url: 'https://from-stx.test' } }, cwd: dir, env: {} })

    expect(resolved).toMatchObject({ url: 'https://from-stx.test', source: 'stx.config' })
  })

  it('reads site.config.ts, which the site-builder path already honoured', async () => {
    await Bun.write(path.join(dir, 'site.config.ts'), `export default { url: 'https://from-file.test' }\n`)

    expect(await resolveSiteUrl({ cwd: dir, env: {} })).toMatchObject({
      url: 'https://from-file.test',
      source: 'site.config',
    })
  })

  it('falls back to the deploy environment, the only source CI has', async () => {
    const resolved = await resolveSiteUrl({ cwd: dir, env: { VERCEL_URL: 'preview-abc.vercel.app' } })

    // Vercel hands over a bare host; a sitemap needs a scheme.
    expect(resolved).toMatchObject({ url: 'https://preview-abc.vercel.app', source: 'env', via: 'VERCEL_URL' })
  })

  it('reports when it had to fall back, so the caller can warn', async () => {
    const resolved = await resolveSiteUrl({ cwd: dir, env: {} })

    expect(resolved).toMatchObject({ url: SITE_URL_FALLBACK, source: 'fallback' })
  })

  it('ignores an unusable value rather than throwing mid-sitemap', async () => {
    expect(await resolveSiteUrl({ explicit: 'not a url at all', cwd: dir, env: {} })).toMatchObject({
      source: 'fallback',
    })
  })
})

describe('sitemap exclusion', () => {
  const none: (string | RegExp)[] = []

  it('honours definePageMeta({ sitemap: false })', () => {
    expect(isExcludedFromSitemap('/login', '<html></html>', { sitemap: false }, none)).toBe(true)
  })

  it('honours a noindex robots meta the page already declares', () => {
    const html = '<meta name="robots" content="noindex, nofollow">'

    expect(isExcludedFromSitemap('/account', html, null, none)).toBe(true)
  })

  it('does not exclude a page whose robots meta indexes', () => {
    const html = '<meta name="robots" content="index, follow">'

    expect(isExcludedFromSitemap('/about', html, null, none)).toBe(false)
  })

  it('matches config entries exactly, as a subtree, or by regex', () => {
    expect(isExcludedFromSitemap('/login', '', null, ['/login'])).toBe(true)
    expect(isExcludedFromSitemap('/loginfoo', '', null, ['/login'])).toBe(false)
    expect(isExcludedFromSitemap('/sites/new', '', null, ['/sites/'])).toBe(true)
    expect(isExcludedFromSitemap('/sites', '', null, ['/sites/'])).toBe(true)
    expect(isExcludedFromSitemap('/admin/users', '', null, [/^\/admin/])).toBe(true)
    expect(isExcludedFromSitemap('/about', '', null, ['/login', /^\/admin/])).toBe(false)
  })
})

describe('the generated files', () => {
  it('uses the configured URL instead of localhost', async () => {
    await Bun.write(path.join(dir, 'site.config.ts'), `export default { url: 'https://example.org' }\n`)
    await build()

    expect(read('sitemap.xml')).toContain('<loc>https://example.org/</loc>')
    expect(read('sitemap.xml')).not.toContain('localhost')
  })

  it('keeps excluded routes out of the sitemap', async () => {
    await Bun.write(path.join(dir, 'site.config.ts'), `export default { url: 'https://example.org' }\n`)
    await build({ sitemapExclude: ['/login'] })

    expect(read('sitemap.xml')).toContain('https://example.org/')
    expect(read('sitemap.xml')).not.toContain('/login')
  })

  it('never lists a component as a public URL', async () => {
    await build()

    expect(read('sitemap.xml')).not.toContain('site-nav')
    // ...and does not build one to HTML either.
    expect(existsSync(path.join(dir, 'dist', 'components'))).toBe(false)
  })

  it('writes a robots.txt that agrees with the sitemap', async () => {
    await Bun.write(path.join(dir, 'site.config.ts'), `export default { url: 'https://example.org' }\n`)
    await build({ sitemapExclude: ['/login'] })

    const robots = read('robots.txt')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Disallow: /login')
    expect(robots).toContain('Sitemap: https://example.org/sitemap.xml')
  })

  it('can be turned off', async () => {
    await build({ robots: false })

    expect(existsSync(path.join(dir, 'dist', 'robots.txt'))).toBe(false)
  })
})
