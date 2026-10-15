import { describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { extractVariables } from '../../src/variable-extractor'

describe('server imports belong to the template application', () => {
  it('resolves a package subpath beside the template rather than beside the engine', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'stx-app-import-'))
    try {
      const dependency = path.join(root, 'node_modules', 'app-owned-module')
      mkdirSync(dependency, { recursive: true })
      writeFileSync(path.join(dependency, 'package.json'), JSON.stringify({ name: 'app-owned-module', type: 'module', exports: { './screen': './screen.js' } }))
      writeFileSync(path.join(dependency, 'screen.js'), 'export const render = () => "Application version"')
      const context: Record<string, unknown> = {}
      await extractVariables('import { render } from "app-owned-module/screen"\nexport const result = render()', context, path.join(root, 'Route.stx'))
      expect(context.result).toBe('Application version')
    }
    finally { rmSync(root, { recursive: true, force: true }) }
  })
})
