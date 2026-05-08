import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDynamicComponents } from '../../src/dynamic-components'
import { processDirectives } from '../../src/process'

const tempDirs: string[] = []

async function makeTempDir() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-component-security-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => fs.promises.rm(dir, { recursive: true, force: true })))
})

describe('component rendering security', () => {
  it('escapes forwarded event handlers on file-based component roots', async () => {
    const dir = await makeTempDir()
    const componentsDir = path.join(dir, 'components')
    await fs.promises.mkdir(componentsDir, { recursive: true })
    await Bun.write(path.join(componentsDir, 'Card.stx'), '<article><slot /></article>')

    const output = await processDirectives(
      '<Card @click="save(&quot;x&quot;) <script>alert(1)</script>">Hello</Card>',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir, debug: false },
      new Set(),
    )

    expect(output).toContain('id="__stx_evt_0"')
    expect(output).not.toContain('<script>alert(1)</script>')
    expect(output).not.toContain('save(&quot;x&quot;) <script>')
  })

  it('escapes builtin component event handlers and static attributes', async () => {
    const dir = await makeTempDir()
    const output = await processDirectives(
      '<StxLink to="/shop" aria-label="<script>alert(1)</script>" @click="track(&quot;candle&quot;) <img src=x>">Shop</StxLink>',
      {},
      path.join(dir, 'page.stx'),
      { debug: false },
      new Set(),
    )

    expect(output).toContain('id="__stx_evt_0"')
    expect(output).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt;"')
    expect(output).not.toContain('@@click')
    expect(output).not.toContain('<img src=x>')
  })

  it('escapes unsafe dynamic-component diagnostics inside HTML comments', async () => {
    const dir = await makeTempDir()
    const output = await processDynamicComponents(
      '<component :is="missing--><script>alert(1)</script>"></component>',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), debug: false },
      new Set(),
    )

    expect(output).toContain('dynamic component: could not resolve')
    expect(output).not.toContain('--><script>')
    expect(output).not.toContain('<script>alert(1)</script>')
  })
})
