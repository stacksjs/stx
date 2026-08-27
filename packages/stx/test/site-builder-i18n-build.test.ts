import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { buildStaticSite } from '../src/site-builder/build'

setDefaultTimeout(30000)

/**
 * The static build's half of the layout-group contract.
 *
 * `stampLocaleLayoutGroup` is unit-tested next door; what regressed here was
 * that the static build never called it. Only the dev server stamped the meta,
 * so a language switch on a built site swapped `<main>` and left `<nav>` and
 * `<footer>` in the previous language — invisible in development, wrong in
 * production. Asserting the built HTML is the only version of this test that
 * would have caught it.
 */
describe('buildStaticSite: per-locale layout group', () => {
  let cwd = ''
  let dir = ''
  let counter = 0

  beforeEach(async () => {
    cwd = process.cwd()
    dir = path.join(import.meta.dir, `temp-i18n-build-${++counter}`)
    await fs.promises.mkdir(path.join(dir, 'views'), { recursive: true })
    await fs.promises.mkdir(path.join(dir, 'translations'), { recursive: true })

    await Bun.write(
      path.join(dir, 'views/index.stx'),
      `<!DOCTYPE html>
<html><head><title>t</title></head>
<body><nav>{t:nav.home}</nav><main>page</main></body>
</html>\n`,
    )
    await Bun.write(path.join(dir, 'translations/en.json'), JSON.stringify({ nav: { home: 'Home' } }))
    await Bun.write(path.join(dir, 'translations/de.json'), JSON.stringify({ nav: { home: 'Start' } }))
    process.chdir(dir)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  async function build(): Promise<void> {
    await buildStaticSite({
      name: 'Test',
      url: 'https://example.com',
      pagesDir: 'views',
      outDir: 'dist',
      i18n: {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        translationsDir: 'translations',
        format: 'json',
      },
    } as any)
  }

  const groupOf = (html: string) => html.match(/name="stx-layout-group"\s+content="([^"]+)"/)?.[1]

  test('each locale gets its own group, so a language switch swaps the chrome', async () => {
    await build()

    const en = await fs.promises.readFile(path.join(dir, 'dist/index.html'), 'utf8')
    const de = await fs.promises.readFile(path.join(dir, 'dist/de/index.html'), 'utf8')

    expect(groupOf(en)).toBe('i18n:en')
    expect(groupOf(de)).toBe('i18n:de')
    // The router only forces a full-body swap when the group actually differs.
    expect(groupOf(en)).not.toBe(groupOf(de))
  })

  test('the chrome each locale ships is already translated', async () => {
    await build()

    const en = await fs.promises.readFile(path.join(dir, 'dist/index.html'), 'utf8')
    const de = await fs.promises.readFile(path.join(dir, 'dist/de/index.html'), 'utf8')

    expect(en).toContain('<nav>Home</nav>')
    expect(de).toContain('<nav>Start</nav>')
  })

  test('stamps the meta exactly once per page', async () => {
    await build()

    const de = await fs.promises.readFile(path.join(dir, 'dist/de/index.html'), 'utf8')
    expect(de.match(/name="stx-layout-group"/g)).toHaveLength(1)
  })
})
