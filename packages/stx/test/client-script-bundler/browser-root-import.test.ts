import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

// These tests exercise the bundler's INLINING mechanics -- import resolution,
// rebasing, dependency tracking, binding exposure. Since stacksjs/stx#1957 a
// component's own imports are served by the page-level module registry rather
// than inlined, so these mechanics run in the registry build, which calls the
// bundler with externalizeUserModules: false. The tests target that mode
// directly; component-bundles-share-modules.test.ts covers the other side.

const TMP = path.join(import.meta.dir, 'temp-browser-root')

describe('client-script-bundler browser-root imports', () => {
  let projectRoot: string
  let templatePath: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    templatePath = path.join(projectRoot, 'Dashboard.stx')
    await fs.promises.mkdir(projectRoot, { recursive: true })
    await Bun.write(path.join(projectRoot, 'stats.ts'), 'export const stats = [1, 2, 3]\n')
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('bundles local modules while preserving host-served browser imports', async () => {
    const script = [
      `import { stats } from './stats'`,
      `const loadChart = () => import('/__deps/charts.js')`,
      `const total = stats.reduce((sum, value) => sum + value, 0)`,
    ].join('\n')

    const output = await bundleClientScript(script, templatePath, { projectRoot, externalizeUserModules: false })

    expect(output).not.toContain(`from "./stats"`)
    expect(output).toContain('var stats = [1, 2, 3]')
    expect(output).toContain('import("/__deps/charts.js")')
    expect(output).toContain('var total = stats.reduce')
  })
})
