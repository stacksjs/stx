import { afterEach, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { createTempDir } from '../../src/temp-dir'

const cwd = process.cwd()
let project = ''

afterEach(async () => {
  process.chdir(cwd)
  if (project) await rm(project, { recursive: true, force: true })
})

test.each(['ssg', 'site builder'])('%s defers classic scripts when configured', async (builder) => {
  project = createTempDir('stx-deferred-build-')
  await Bun.write(join(project, 'stx.config.ts'), 'export default { deferScripts: true }\n')
  await Bun.write(join(project, 'views/index.stx'), `
    <html><head><script client stx-inline>globalThis.beforePaint = true</script></head>
    <body><main><h1>Ready to read</h1><button :text="count">0</button></main>
    <script client>const count = state(0)</script></body></html>
  `)
  process.chdir(project)

  if (builder === 'ssg') {
    const { generateStaticSite } = await import('../../src/ssg')
    await generateStaticSite({ pagesDir: 'views', outputDir: 'dist' })
  }
  else {
    const { buildStaticSite } = await import('../../src/site-builder/build')
    await buildStaticSite({ name: 'Fixture', url: 'https://fixture.example', pagesDir: 'views', outDir: 'dist' })
  }

  const output = await Bun.file(join(project, 'dist/index.html')).text()
  const classic = Array.from(output.matchAll(/<script\b([^>]*)>/g), match => match[1]!)
    .filter(attributes => !/\b(?:type|stx-inline|data-stx-theme-guard)\b/.test(attributes))
  expect(classic.some(script => script.includes('data-stx-runtime'))).toBe(true)
  expect(classic.length).toBeGreaterThan(2)
  for (const script of classic) {
    expect(script).toContain(' defer')
    const src = script.match(/\bsrc="([^"]+)"/)?.[1]
    expect(src).toStartWith('/_stx/')
    expect(await Bun.file(join(project, 'dist', src!)).exists()).toBe(true)
  }
  expect(output).toMatch(/<script[^>]+stx-inline[^>]*>[^<]*beforePaint/)
  if (builder === 'site builder')
    expect(output).toMatch(/<script data-stx-theme-guard="1">/)
})
