/**
 * `<WebView tab>`: a web page beside native controls. The primitive names the
 * host's WebView type and keeps the props that say which tab it shows.
 */
import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { createTempDir } from '../../src/temp-dir'

function find(node: any, type: string): any {
  if (!node || typeof node !== 'object') return null
  if (node.type === type) return node
  for (const child of node.children ?? []) {
    const hit = find(child, type)
    if (hit) return hit
  }
  return null
}

it('compiles a WebView to the host type with its tab, static or bound', async () => {
  const root = createTempDir('stx-web-view-')
  const file = join(root, 'Main.stx')
  const source = `<script client>const current = state('t2')</script>
<View class="flex-1"><WebView tab="t1" class="flex-1" /><WebView :tab="current" testID="pane" /></View>`
  await Bun.write(file, source)
  try {
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(join(nativePrimitivesDir(), 'WebView.stx'))
    const first = find(result.document.root ?? result.document, 'WebView')
    expect(first).toBeTruthy()
    expect(first.props.tab).toBe('t1')
    expect(result.diagnostics.filter((d: any) => d.severity === 'error')).toEqual([])
    expect(result.html).toContain('data-native="WebView"')
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)
