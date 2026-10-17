import { afterEach, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processCustomElements } from '../../src/component-processing'
import { processComponents } from '../../src/component-renderer'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

const directories: string[] = []
afterEach(() => {
  clearComponentCache()
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

for (const renderer of ['unified', 'legacy'] as const) {
  describe(`${renderer} acronym component resolution`, () => {
    for (const filename of ['MCPConnect', 'mcp-connect']) {
      it(`renders MCPConnect from ${filename}.stx with props and slots`, async () => {
        const dir = createTempDir('stx-acronym-')
        directories.push(dir)
        const components = join(dir, 'components')
        const file = join(components, `${filename}.stx`)
        await Bun.write(file, '<section><h2>{{ title }}</h2><slot /></section>')
        const dependencies = new Set<string>()
        const template = '<MCPConnect title="AI apps"><p>Connect HQ</p></MCPConnect>'
        const options = { componentsDir: components, projectRoot: dir }
        const page = join(dir, 'page.stx')
        const result = renderer === 'unified'
          ? await processComponents(template, {}, page, options, dependencies)
          : await processCustomElements(template, {}, page, components, options, dependencies)
        expect(result).toContain('<h2>AI apps</h2>')
        expect(result).toContain('<p>Connect HQ</p>')
        expect(result).not.toContain('Component not found')
        expect(dependencies.has(file)).toBe(true)
      })
    }
  })
}
