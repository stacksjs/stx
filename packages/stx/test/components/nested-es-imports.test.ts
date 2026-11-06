import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-nested-imports-')
const components = join(root, 'components')
const kit = join(root, 'node_modules/@scope/kit')
function write(file: string, content: string) { mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, content) }
beforeAll(() => {
  write(join(root, 'package.json'), '{"name":"nested-imports-fixture"}')
  write(join(kit, 'package.json'), '{"name":"@scope/kit"}')
  write(join(kit, 'src/ui/Dropdown.stx'), '<div data-kit-menu><slot /></div>')
  write(join(components, 'Dropdown.stx'), '<div data-host-menu>Host</div>')
  write(join(components, 'Sibling.stx'), '<Dropdown />')
})
afterAll(() => rmSync(root, { recursive: true, force: true }))

for (const mode of ['client', 'server']) {
  describe(`component imports in a nested ${mode} script`, () => {
    it('uses the explicit package import locally and preserves the sibling host component', async () => {
      write(join(components, 'Imported.stx'), `<script ${mode}>import { Dropdown as OwnDropdown } from '@scope/kit'\n</script><OwnDropdown>Three choices</OwnDropdown>`)
      const html = await processDirectives('<Imported /><Sibling />', {}, join(root, 'Home.stx'), { componentsDir: components, projectRoot: root }, new Set())
      expect(html).toContain('data-kit-menu')
      expect(html).toContain('Three choices')
      expect(html).toContain('data-host-menu')
      expect(html).not.toContain('<OwnDropdown')
      expect(html).not.toContain("from '@scope/kit'")
    })
  })
}
