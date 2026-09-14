import type { StxOptions } from '../../src/types'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processESImports } from '../../src/component-renderer'

const filePath = path.join(import.meta.dir, 'es-import-host.stx')
const componentPath = path.resolve(import.meta.dir, '../../src/components/StxLink.stx')
const componentSpec = '../../src/components/StxLink.stx'

async function process(template: string): Promise<{
  output: string
  context: Record<string, any>
  dependencies: Set<string>
}> {
  const context: Record<string, any> = {}
  const dependencies = new Set<string>()
  const output = await processESImports(template, context, filePath, {} as StxOptions, dependencies)
  return { output, context, dependencies }
}

describe('processESImports', () => {
  it('bypasses CSS important substrings without starting an import scan', async () => {
    const template = '<style>.card{color:red!important}</style><main>content</main>'
    const result = await process(template)

    expect(result.output).toBe(template)
    expect(result.context.__importedComponents).toBeUndefined()
    expect(result.dependencies.size).toBe(0)
  })

  it('leaves unresolved JavaScript imports byte-identical', async () => {
    const template = '<script client>import { helper } from "./missing"\nhelper()</script>'
    const result = await process(template)

    expect(result.output).toBe(template)
    expect(result.dependencies.size).toBe(0)
  })

  it('registers and removes a component import', async () => {
    const template = `<script client>\nimport StxLink from '${componentSpec}'\nconst ready = true\n</script><StxLink />`
    const result = await process(template)
    const registered = result.context.__importedComponents as Map<string, string>

    expect(result.output).toBe('<script client>\nconst ready = true\n</script><StxLink />')
    expect(registered.get('StxLink')).toBe(componentPath)
    expect(registered.get('stxlink')).toBe(componentPath)
    expect(registered.get('stx-link')).toBe(componentPath)
    expect(result.dependencies).toEqual(new Set([componentPath]))
  })

  it('splices only changed script ranges and preserves existing normalization', async () => {
    const template = `<p>before</p><script>import { helper } from './missing'\nhelper()</script><SCRIPT client>\nimport StxLink from '${componentSpec}'\n</SCRIPT><p>after</p>`
    const result = await process(template)

    expect(result.output).toBe(`<p>before</p><script>import { helper } from './missing'\nhelper()</script><script client>\n</script><p>after</p>`)
    expect(result.dependencies).toEqual(new Set([componentPath]))
  })
})
