/**
 * The extension build (stacksjs/stx#1747): bundles each entry to the file the
 * manifest references, and copies the static assets. Builds to a temp dir so it
 * doesn't touch the package's own dist/.
 */
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'bun:test'
import { build } from '../build'

const out = path.join(tmpdir(), 'stx-devtools-ext-build-test')

describe('extension build', () => {
  afterAll(async () => { await rm(out, { recursive: true, force: true }) })

  it('emits every manifest-referenced bundle + the static assets', async () => {
    await build(out)

    for (const f of ['content-script.js', 'inject.js', 'devtools.js', 'panel.js', 'manifest.json', 'devtools.html', 'panel.html'])
      expect(existsSync(path.join(out, f))).toBe(true)
  })

  it('bundles the bridge into inject.js (reads window.__stxDevtools)', async () => {
    await build(out)
    const inject = await Bun.file(path.join(out, 'inject.js')).text()
    expect(inject).toContain('__stxDevtools')
    expect(inject).toContain('stx-devtools') // the protocol channel marker
  })

  it('the built manifest references the emitted files', async () => {
    await build(out)
    const manifest = JSON.parse(await Bun.file(path.join(out, 'manifest.json')).text())
    expect(manifest.content_scripts[0].js).toContain('content-script.js')
    expect(manifest.web_accessible_resources[0].resources).toContain('inject.js')
    expect(manifest.devtools_page).toBe('devtools.html')
  })
})
