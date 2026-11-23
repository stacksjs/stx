import { expect, it } from 'bun:test'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { openBrowserPage } from '../../components/test/support/browser-page'
import { collectCspHashes } from '../src/csp-hashes'

it('publishes final hash manifests from both builders and navigates built artifacts under that policy', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stx-csp-static-'))
  const src = resolve(import.meta.dir, '../src')
  try {
    mkdirSync(join(root, 'pages'))
    const config = { enabled: true, precompile: true, useHashes: true, addMetaTag: true, directives: { 'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"] } }
    writeFileSync(join(root, 'stx.config.ts'), `export default {csp:${JSON.stringify(config)}, cache:false}`)
    for (const name of ['index', 'two']) {
      writeFileSync(join(root, 'pages', name + '.stx'), `<!doctype html><html><head><title>${name}</title></head><body><main data-stx-content><script client>
const count=state(1);window.builtProbe={name:'${name}', count};window.buildErrors=window.buildErrors||[];window.addEventListener('error',e=>window.buildErrors.push(e.message));window.addEventListener('securitypolicyviolation',e=>window.buildErrors.push(e.violatedDirective))
</script><button id="built-add" @click="count += 2">More</button><span id="built-count" x-text="count"></span><StxLink to="/two">Two</StxLink><StxLink to="/">Index</StxLink></main></body></html>`)
    }
    writeFileSync(join(root, 'build.ts'), `import {generateStaticSite} from ${JSON.stringify(join(src, 'ssg.ts'))};import {buildStaticSite} from ${JSON.stringify(join(src, 'site-builder/build.ts'))};await generateStaticSite({pagesDir:'pages',outputDir:'ssg',cache:false,sitemap:false,robots:false});await buildStaticSite({name:'CSP test',url:'https://example.com',pagesDir:'pages',outDir:'site',spa:true});`)
    const child = Bun.spawn([process.execPath, 'run', 'build.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    expect({ exit, error: exit ? stdout + stderr : '' }).toEqual({ exit: 0, error: '' })
    for (const output of ['ssg', 'site']) {
      const dir = join(root, output)
      const manifest = JSON.parse(readFileSync(join(dir, '_stx/csp-manifest.json'), 'utf8'))
      expect(manifest.header).not.toMatch(/unsafe-eval|nonce-/)
      const paths = Object.keys(manifest.pages)
      expect(paths.length).toBeGreaterThanOrEqual(2)
      for (const path of paths) {
        const html = readFileSync(join(dir, path), 'utf8')
        expect(collectCspHashes(html)).toEqual(manifest.pages[path])
        for (const hash of manifest.pages[path].scripts) expect(manifest.header).toContain(hash)
      }
      const page = await openBrowserPage({ name: 'built-csp-' + output, body: '', transformHtml: () => readFileSync(join(dir, 'index.html'), 'utf8'), headers: () => ({ 'Content-Security-Policy': manifest.header }), route: request => {
        const path = decodeURIComponent(new URL(request.url).pathname)
        const candidates = [join(dir, path), join(dir, path, 'index.html'), join(dir, path + '.html')]
        const file = candidates.find(file => existsSync(file) && statSync(file).isFile())
        if (path === '/') return undefined
        // Only generated local assets and pages are requested by this fixture.
        if (!file) return new Response('Missing artifact ' + path, { status: 404 })
        return new Response(Bun.file(file), { headers: { 'Content-Security-Policy': manifest.header } })
      }, ready: 'window.builtProbe && document.querySelector("#built-count")?.textContent === "1"' })
      try {
        await page.run("document.querySelector('a[href=\"/two\"]').click()")
        expect(await page.until('window.builtProbe.name === "two"')).toBe(true)
        await page.run("document.querySelector('#built-add').click()")
        expect(await page.until('document.querySelector("#built-count").textContent === "3"')).toBe(true)
        await page.run("document.querySelector('a[href=\"/\"]').click()")
        expect(await page.until('window.builtProbe.name === "index"')).toBe(true)
        expect(await page.json('return window.buildErrors')).toEqual([])
      }
      finally { page.close() }
    }
  }
  finally { rmSync(root, { recursive: true, force: true }) }
}, 90_000)
