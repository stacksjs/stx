import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

/** The app-frame components on the web: the same files a native screen uses, as a page. */
const LIBRARY = path.join(import.meta.dir, '../../../components/src/ui/app-frame')

describe('app-frame components on the web', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('build into a page, each a scope with its primitives as HTML', async () => {
    for (const file of readdirSync(LIBRARY).filter(name => name.endsWith('.stx')))
      await Bun.write(path.join(TEMP_DIR, 'components', file), Bun.file(path.join(LIBRARY, file)))
    const page = await createTestFile('app-frame.stx', `<!DOCTYPE html><html><body>
<script client>
const rows = state([{ label: 'Inbox', symbol: 'tray', active: true }])
const tiles = [{ id: 'a', emoji: 'A' }, { id: 'b', emoji: 'B' }]
</script>
<AddressField text="example.com" />
<TileGrid :items="tiles" />
<SidebarRow :for="row in rows()" :key="row.label" :item="row" :theme="{ tint: '#11143f' }" />
<SidebarDivider action="Clear" />
<ContentCard :progress="0.5"><p>Page</p></ContentCard>
</body></html>`)
    const result = await Bun.build({ entrypoints: [page], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
    expect(result.success).toBe(true)
    const html = await getHtmlOutput(result)
    expect(html.match(/data-stx-scope=/g)?.length).toBeGreaterThanOrEqual(5)
    expect(html).toContain('<p>Page</p>')
    expect(html).not.toContain('Error evaluating')
  })
})
