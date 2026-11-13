import { afterAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildStaticSite } from '@stacksjs/stx'

/*
 * A page that hands a component a named slot has a <template #name> in it.
 * The build took the first <template> of any kind for a single-file
 * component's wrapper, so the page became that one slot's inside: the rest of
 * the document was dropped, its @nolayout with it, and the remains were
 * wrapped in the site's default layout. The dev server never did this.
 */
const root = mkdtempSync(join(tmpdir(), 'stx-slot-page-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('a built page that passes a named slot', () => {
  it('keeps its whole document and stays out of the default layout', async () => {
    mkdirSync(join(root, 'pages'), { recursive: true })
    mkdirSync(join(root, 'components'), { recursive: true })
    mkdirSync(join(root, 'layouts'), { recursive: true })
    writeFileSync(join(root, 'layouts/default.stx'), '<html><body><header data-site-layout>site</header>@yield(\'content\')</body></html>')
    writeFileSync(join(root, 'components/Frame.stx'), '<section data-frame><nav><slot name="side" /></nav><main><slot /></main></section>')
    writeFileSync(join(root, 'pages/index.stx'), [
      '@nolayout',
      '<!DOCTYPE html>',
      '<html lang="en"><head><title>Slots</title></head><body>',
      '<Frame>',
      '  <template #side><a data-side-link href="/x">side link</a></template>',
      '  <p data-main-copy>main copy</p>',
      '</Frame>',
      '</body></html>',
    ].join('\n'))

    const previous = process.cwd()
    process.chdir(root)
    try {
      await buildStaticSite({ name: 'slots', url: 'http://127.0.0.1', pagesDir: 'pages', outDir: 'out', publicDir: 'pages/public', componentsDir: join(root, 'components'), sitemap: false, robots: false })
    }
    finally {
      process.chdir(previous)
    }

    const html = readFileSync(join(root, 'out/index.html'), 'utf8')
    expect(html).toContain('data-main-copy')
    expect(html).toContain('data-side-link')
    expect(html).toContain('data-frame')
    expect(html).not.toContain('data-site-layout')
  }, 60_000)
})
