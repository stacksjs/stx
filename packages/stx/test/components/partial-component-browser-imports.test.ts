import type { StxOptions } from '../../src/types'
import { expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getBundleFailures, clearBundleFailures } from '../../src/client-script-bundler'
import { processDirectives } from '../../src/process'

it('consumes included component imports before building browser scripts', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'stx-partial-browser-'))
  try {
    mkdirSync(path.join(root, 'partials'), { recursive: true })
    const pkg = path.join(root, 'node_modules', 'component-kit')
    mkdirSync(path.join(pkg, 'src'), { recursive: true })
    writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'component-kit', type: 'module', exports: './index.js' }))
    writeFileSync(path.join(pkg, 'src', 'Widget.stx'), '<section data-widget><slot /></section>')
    // A template component descriptor can share a package with server code.
    // It has already been consumed by the renderer and must not reach Bun's
    // browser registry as a namespace import of that package.
    writeFileSync(path.join(pkg, 'index.js'), "export { pipeline } from 'node:stream/promises'\nexport const Widget = { __stx: true }\n")
    writeFileSync(path.join(root, 'partials', 'sidebar.stx'), `<script client>
import { Widget } from 'component-kit'
const expanded = state(true)
</script>
<Widget><p :if="expanded">Conversation</p></Widget>`)
    clearBundleFailures()
    const html = await processDirectives("@include('sidebar')", {}, path.join(root, 'page.stx'), {
      root, partialsDir: path.join(root, 'partials'), buildMode: 'serve',
    } as StxOptions, new Set<string>())
    expect(html).toContain('data-widget')
    expect(html).toContain('Conversation')
    expect(html).not.toContain('npm:component-kit')
    expect(html).not.toContain('stream/promises')
    expect(getBundleFailures()).toHaveLength(0)
  }
  finally {
    clearBundleFailures()
    rmSync(root, { recursive: true, force: true })
  }
})
