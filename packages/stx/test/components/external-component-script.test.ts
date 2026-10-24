import { expect, test } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderView } from '../../src/build-views'
import { createTempDir } from '../../src/temp-dir'

for (const [reactive, serverFirst] of [[false, true], [true, true], [false, false], [true, false]]) {
  test(`external component scripts resolve server attributes without becoming setup code (reactive=${reactive}, serverFirst=${serverFirst})`, async () => {
    const root = createTempDir('stx-external-component-script-')
    const componentsDir = join(root, 'components')
    mkdirSync(componentsDir)
    const server = `<script server>
const source = 'https://hq.test/elements.js?brand=lsu&section=plans'
const nonce = 'quote"value'
</script>`
    await Bun.write(join(componentsDir, 'Embed.stx'), `${serverFirst ? server : ''}
${reactive ? '<script client>const ready = state(true)</script>' : ''}
<script type="module" src="{{ source }}" nonce="{{ nonce }}"></script>
${serverFirst ? '' : server}
<p ${reactive ? ':if="ready"' : ''}>Training</p>`)
    const page = join(root, 'Page.stx')
    await Bun.write(page, '<!DOCTYPE html><html><body><Embed /></body></html>')
    const html = await renderView(page, {}, { componentsDir, cache: false })
    const script = html.match(/<script\b[^>]*\bsrc="https:\/\/hq\.test\/elements\.js[^>]*>[\s\S]*?<\/script>/)?.[0]
    expect(script).toBe('<script type="module" src="https://hq.test/elements.js?brand=lsu&amp;section=plans" nonce="quote&quot;value"></script>')
    expect(html.includes('{{ source }}')).toBe(false)
  })
}
