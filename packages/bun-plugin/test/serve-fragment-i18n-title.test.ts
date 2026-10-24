import { afterAll, beforeAll, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

const port = freePort()
const base = `http://127.0.0.1:${port}`
const serveSource = path.join(import.meta.dir, '../src/serve.ts')
let directory: string
let child: ReturnType<typeof Bun.spawn> | undefined
let output: Promise<string> | undefined
let errors: Promise<string> | undefined

beforeAll(async () => {
  directory = createTempDir('stx-fragment-title-i18n-')
  await Bun.write(path.join(directory, 'views/page.stx'), `<!DOCTYPE html>
<html><head><title>{t:page.title} | 100% &amp; &amp;lt;</title></head>
<body><main><h1>{t:page.title}</h1></main></body></html>`)
  await Bun.write(path.join(directory, 'views/literal.stx'), `<!DOCTYPE html>
<html><head><title>Literal &amp;lt; 100%</title></head><body><main>Literal</main></body></html>`)
  await Bun.write(path.join(directory, 'driver.ts'), `import { serve } from ${JSON.stringify(serveSource)}
await serve({ patterns: ['views'], port: ${port}, imageWarmup: false,
  i18n: { locales: ['en', 'de', 'nl'], defaultLocale: 'en', labels: {}, pickerSelector: '#lang-picker',
    translations: { en: { 'page.title': 'English & "quoted" <literal> 你好' }, de: { 'page.title': 'Deutsch & "zitiert" <literal> Grüß' } } }
})`)
  child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: directory, stdout: 'pipe', stderr: 'pipe' })
  output = new Response(child.stdout).text()
  errors = new Response(child.stderr).text()
  const deadline = Date.now() + 30_000
  while (true) {
    try { await fetch(`${base}/not-a-page`); break }
    catch {
      if (Date.now() > deadline) throw new Error('Title regression server did not start')
      await Bun.sleep(50)
    }
  }
}, 35_000)

afterAll(async () => {
  child?.kill()
  if (child) await child.exited
  await output
  await errors
  if (directory) await rm(directory, { recursive: true, force: true })
})

for (const [route, expected] of [
  ['/page', 'English & "quoted" <literal> 你好 | 100% & &lt;'],
  ['/de/page', 'Deutsch & "zitiert" <literal> Grüß | 100% & &lt;'],
  ['/nl/page', 'English & "quoted" <literal> 你好 | 100% & &lt;'],
  ['/literal', 'Literal &lt; 100%'],
]) {
  test(`fragment title uses the destination locale and preserves text: ${route}`, async () => {
    const full = await fetch(`${base}${route}`)
    expect(full.status).toBe(200)
    const html = await full.text()
    expect(html).not.toContain('{t:page.title}')
    const fragment = await fetch(`${base}${route}`, { headers: { 'X-STX-Router': 'true' } })
    expect(fragment.status).toBe(200)
    expect(fragment.headers.get('X-STX-Fragment')).toBe('true')
    const title = fragment.headers.get('X-STX-Title')
    expect(title).not.toBeNull()
    expect(decodeURIComponent(title!)).toBe(expected)
    expect(await fragment.text()).not.toContain('{t:page.title}')
  })
}
