/**
 * A static build with its generated CSS shared looks exactly like one without
 * (stacksjs/stx#2230): every element's computed style is compared, page by
 * page, at a phone width and a desktop width, on a direct load and after a
 * client-side navigation from another page.
 */
import { afterAll, beforeAll, expect, it } from 'bun:test'
import { WebView } from 'bun'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { createTempDir } from '../../src/temp-dir'

const PAGES: Record<string, string> = {
  // p-4 is this page's alone; md:p-8 is shared and must still win at md.
  index: '<p id="probe" class="p-4 md:p-8 text-sm">Home</p><div class="px-6 sm:px-2">x</div>',
  // An authored style that overrides a utility, where the page wrote it.
  about: '<style>.text-lg { line-height: 3rem } #probe { padding-left: 3px }</style><p id="probe" class="px-2 md:p-8 text-lg">About</p><div class="px-6 sm:px-2 leading-6">x</div>',
  pricing: '<p id="probe" class="md:p-8 grid gap-4 text-sm leading-6">Pricing</p><div class="hidden md:block">x</div>',
  contact: '<p id="probe" class="md:p-8 flex items-center text-lg">Contact</p><div class="block md:hidden">x</div>',
}
const LABELS: Record<string, string> = { index: 'Home', about: 'About', pricing: 'Pricing', contact: 'Contact' }
const PROPS = ['padding-top', 'padding-left', 'padding-right', 'display', 'gap', 'align-items', 'font-size', 'line-height', 'font-weight', 'text-decoration-line', 'color', 'background-color', 'margin-left', 'max-width']

let root = ''
const servers: Array<ReturnType<typeof Bun.serve>> = []
const originalCwd = process.cwd()

async function build(out: string, shareCss: boolean): Promise<void> {
  process.chdir(root)
  const { generateStaticSite } = await import('../../src/ssg')
  await generateStaticSite({ pagesDir: 'views', outputDir: out, shareCss })
  process.chdir(originalCwd)
}

function serveDir(dir: string): string {
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch(request) {
    const pathname = new URL(request.url).pathname
    const file = pathname === '/' ? 'index.html' : existsSync(path.join(dir, pathname)) ? pathname : `${pathname}.html`
    const full = path.join(dir, file)
    if (!existsSync(full)) return new Response('missing', { status: 404 })
    return new Response(Bun.file(full))
  } })
  servers.push(server)
  return server.url.href.replace(/\/$/, '')
}

const SNAPSHOT = `JSON.stringify([...document.body.querySelectorAll('*')].filter(el => !['SCRIPT','STYLE','TEMPLATE'].includes(el.tagName) && el.id !== 'stx-route-announcer').map(el => { const cs = getComputedStyle(el); return el.tagName + (el.id ? '#' + el.id : '') + ' ' + ${JSON.stringify(PROPS)}.map(p => cs.getPropertyValue(p)).join('|') }))`

async function snapshot(base: string, page: string, width: number, from?: string): Promise<string[]> {
  const view = new WebView({ headless: true, width, height: 800, backend: process.platform === 'darwin' ? { type: 'webkit' } : { type: 'chrome', url: false } } as any)
  try {
    const until = async (expression: string) => {
      for (let i = 0; i < 200; i++) {
        if (await view.evaluate(`Boolean(${expression})`)) return true
        await Bun.sleep(25)
      }
      return false
    }
    if (from) {
      await view.navigate(`${base}/${from === 'index' ? '' : from}`)
      expect(await until(`document.readyState === 'complete' && document.querySelector('#probe') && [...document.querySelectorAll('link[rel=stylesheet]')].every(l => l.sheet)`)).toBe(true)
      await view.evaluate(`(() => { window.__sameDocument = true; document.querySelector('a[data-stx-link][href="/${page === 'index' ? '' : page}"]').click() })()`)
      expect(await until(`document.querySelector('#probe')?.textContent === ${JSON.stringify(LABELS[page])}`)).toBe(true)
      expect(await view.evaluate('window.__sameDocument === true'), 'a client-side navigation, not a reload').toBe(true)
      expect(await until(`![...document.querySelectorAll('link[data-stx-css-pending]')].length`)).toBe(true)
    }
    else {
      await view.navigate(`${base}/${page === 'index' ? '' : page}`)
      expect(await until(`document.querySelector('#probe') && [...document.querySelectorAll('link[rel=stylesheet]')].every(l => l.sheet)`)).toBe(true)
    }
    return JSON.parse(await view.evaluate(SNAPSHOT) as string)
  }
  finally {
    view.close()
  }
}

let on = ''
let off = ''
let grouped = ''
beforeAll(async () => {
  root = createTempDir('stx-share-css-')
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}\n')
  const nav = Object.keys(PAGES).map(page => `<StxLink to="/${page === 'index' ? '' : page}" class="font-bold underline">${page}</StxLink>`).join('')
  for (const [page, body] of Object.entries(PAGES))
    await Bun.write(path.join(root, 'views', `${page}.stx`), `<!doctype html><html><head><title>${page}</title></head><body><nav class="flex gap-2 p-2 bg-gray-100 text-gray-900">${nav}</nav><main data-stx-content class="mx-auto max-w-3xl">${body}</main></body></html>\n`)
  await build('dist-on', true)
  await build('dist-off', false)
  for (const page of ['index', 'about']) {
    const file = path.join(root, 'views', `${page}.stx`)
    const html = await Bun.file(file).text()
    await Bun.write(file, html.replace('<head>', '<head><meta name="stx-css-group" content="workspace">'))
  }
  await build('dist-grouped', true)
  grouped = serveDir(path.join(root, 'dist-grouped'))
  on = serveDir(path.join(root, 'dist-on'))
  off = serveDir(path.join(root, 'dist-off'))
}, 120_000)

afterAll(() => {
  process.chdir(originalCwd)
  for (const server of servers) server.stop(true)
  if (root) rmSync(root, { recursive: true, force: true })
})

it('splits the sheets: one shared, small per-page ones after it', () => {
  const index = readFileSync(path.join(root, 'dist-on', 'index.html'), 'utf8')
  const links = [...index.matchAll(/<link data-css="generated" rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]!)
  expect(links).toHaveLength(2)
  const shared = readdirSync(path.join(root, 'dist-on', '_stx')).filter(name => name.endsWith('.css'))
  const before = readdirSync(path.join(root, 'dist-off', '_stx')).filter(name => name.endsWith('.css'))
  const size = (dir: string, names: string[]) => names.reduce((sum, name) => sum + readFileSync(path.join(root, dir, '_stx', name)).length, 0)
  expect(size('dist-on', shared)).toBeLessThan(size('dist-off', before) / 2)
})

it.each(Object.keys(PAGES).flatMap(page => [[page, 390], [page, 1100]] as const))('%s at %ipx looks the same on a direct load', async (page, width) => {
  expect(await snapshot(on, page, width)).toEqual(await snapshot(off, page, width))
}, 60_000)

/*
 * Compared with the unshared build after the SAME navigation, not with a direct
 * load: the router moves a destination's generated sheet to the end of <head>,
 * after the page's own <style>, so an authored rule tied in specificity with a
 * utility loses after a client-side navigation in either build. Sharing must
 * not change that either way.
 */
it.each([['index', 'about'], ['about', 'pricing'], ['pricing', 'contact'], ['contact', 'index']] as const)('%s reached from %s looks the same as without sharing', async (page, from) => {
  for (const width of [390, 1100])
    expect(await snapshot(on, page, width, from)).toEqual(await snapshot(off, page, width, from))
}, 60_000)


it('gives a named group one full stylesheet without adding its rules to other pages', async () => {
  const urlsFor = (page: string) => [...readFileSync(path.join(root, 'dist-grouped', `${page}.html`), 'utf8')
    .matchAll(/<link data-css="generated" rel="stylesheet" href="([^"]+)">/g)].map(match => match[1]!)
  const workspace = urlsFor('index')
  expect(workspace).toHaveLength(1)
  expect(urlsFor('about')).toEqual(workspace)
  expect(urlsFor('pricing')).not.toContain(workspace[0]!)

  for (const width of [390, 1100]) {
    expect(await snapshot(grouped, 'index', width)).toEqual(await snapshot(off, 'index', width))
    expect(await snapshot(grouped, 'about', width, 'index')).toEqual(await snapshot(off, 'about', width, 'index'))
    expect(await snapshot(grouped, 'pricing', width, 'about')).toEqual(await snapshot(off, 'pricing', width, 'about'))
  }
}, 60_000)
