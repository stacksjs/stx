/**
 * A dynamic page segment never captures a file name.
 *
 * `resources/views/[username].stx` rendered a full "Profile not found" page
 * for `/favicon.ico`, `/apple-touch-icon.png` and every `/wp-login.php` a
 * scanner sent. See file-requests.ts for the rule and why it is a list of
 * known extensions rather than "anything with a dot".
 */
import { describe, expect, it } from 'bun:test'
import { bracketPathToRegex, createRouter, isFileRequestPath, matchRoute, patternToRegex } from '../src'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('isFileRequestPath', () => {
  it('names the files browsers and scanners ask a site for', () => {
    for (const path of ['/favicon.ico', '/apple-touch-icon.png', '/wp-login.php', '/foo.txt', '/robots.txt', '/sitemap.xml', '/site.webmanifest', '/.env', '/js/app.js', '/backup.sql', '/a/b/c.tar.gz', '/IMG_0001.JPG'])
      expect(isFileRequestPath(path)).toBe(true)
  })

  it('leaves pages alone, including the explicit page extensions', () => {
    for (const path of ['/', '/chris', '/docs/guide', '/about.html', '/about.htm', '/docs/guide.md', '/page.stx'])
      expect(isFileRequestPath(path)).toBe(false)
  })

  it('does not mistake an identifier with a dot for a file', () => {
    // Usernames, versions and TLD-shaped names are pages, not files.
    for (const path of ['/john.doe', '/docs/v1.2', '/releases/1.0.0', '/user.github.io', '/bun.sh', '/acme.dev', '/v2.0.0-rc.1'])
      expect(isFileRequestPath(path)).toBe(false)
  })

  it('only reads the last segment, and ignores query and hash', () => {
    expect(isFileRequestPath('/files.zip/readme')).toBe(false)
    expect(isFileRequestPath('/favicon.ico?v=2')).toBe(true)
    expect(isFileRequestPath('/chris?file=a.png')).toBe(false)
    expect(isFileRequestPath('/chris#a.png')).toBe(false)
  })

  it('matches all-lowercase and all-uppercase extensions', () => {
    expect(isFileRequestPath('/logo.PNG')).toBe(true)
    expect(isFileRequestPath('/logo.png')).toBe(true)
  })
})

describe('patternToRegex — page routes refuse a final file segment', () => {
  const { regex } = patternToRegex('/:username', { page: true })

  it('still matches a page', () => {
    expect(regex.test('/chris')).toBe(true)
    expect(regex.test('/john.doe')).toBe(true)
  })

  it('does not match a file name', () => {
    for (const path of ['/favicon.ico', '/apple-touch-icon.png', '/wp-login.php', '/foo.txt'])
      expect(regex.test(path)).toBe(false)
  })

  it('only guards the param that ends the pattern', () => {
    const { regex: nested, params } = patternToRegex('/:owner/:repository/settings', { page: true })
    expect(params).toEqual(['owner', 'repository'])
    expect('/acme/three.js/settings'.match(nested)?.slice(1)).toEqual(['acme', 'three.js'])

    const { regex: tail } = patternToRegex('/:owner/:repository', { page: true })
    expect(tail.test('/acme/app')).toBe(true)
    expect(tail.test('/acme/logo.png')).toBe(false)
  })

  it('guards an optional final param', () => {
    const { regex: optional } = patternToRegex('/blog/:slug?', { page: true })
    expect(optional.test('/blog')).toBe(true)
    expect(optional.test('/blog/hello')).toBe(true)
    expect(optional.test('/blog/feed.xml')).toBe(false)
  })

  it('exempts a catch-all, which claims the rest of the URL dots and all', () => {
    const { regex: docs } = patternToRegex('/docs/:slug*', { page: true })
    for (const path of ['/docs/guide.md', '/docs/v1.2', '/docs/src/index.ts', '/docs/assets/diagram.png'])
      expect(docs.test(path)).toBe(true)

    const { regex: browser } = bracketPathToRegex('/[owner]/[repository]/tree/[ref]/[...path]', { page: true })
    expect('/stacks/stx/tree/main/src/index.ts'.match(browser)?.slice(1)).toEqual(['stacks', 'stx', 'main', 'src/index.ts'])
  })

  it('leaves non-page routes untouched, where a file name is a legitimate param', () => {
    const { regex: api } = patternToRegex('/api/files/:name')
    expect(api.test('/api/files/report.pdf')).toBe(true)
    const { regex: bracket } = bracketPathToRegex('/files/[name]')
    expect(bracket.test('/files/report.pdf')).toBe(true)
  })
})

describe('file router — the route table refuses file names too', () => {
  it('routes /chris to [username] and /favicon.ico to nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-file-requests-'))
    try {
      mkdirSync(join(dir, 'pages'), { recursive: true })
      writeFileSync(join(dir, 'pages', '[username].stx'), '<p>profile</p>')
      writeFileSync(join(dir, 'pages', 'about.stx'), '<p>about</p>')
      const routes = createRouter(dir, { pagesDir: 'pages', emit: false }).routes

      expect(matchRoute('/chris', routes)?.params).toEqual({ username: 'chris' })
      expect(matchRoute('/about', routes)?.route.pattern).toBe('/about')
      expect(matchRoute('/favicon.ico', routes)).toBeNull()
      expect(matchRoute('/wp-login.php', routes)).toBeNull()

      // The same regex sources ship to the client as owned routes, so the SPA
      // router leaves a link to /favicon.ico to the browser as well.
      const owned = routes.map(route => new RegExp(route.regex.source))
      expect(owned.some(re => re.test('/favicon.ico'))).toBe(false)
      expect(owned.some(re => re.test('/chris'))).toBe(true)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
