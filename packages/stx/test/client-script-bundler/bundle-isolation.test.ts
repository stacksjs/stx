import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

const TMP = path.join(import.meta.dir, 'temp-isolation')

describe('client-script-bundler isolation', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    await fs.promises.mkdir(projectRoot, { recursive: true })
    await Bun.write(path.join(projectRoot, 'first.ts'), 'export const shared = 1\n')
    await Bun.write(path.join(projectRoot, 'second.ts'), 'export const shared = 2\n')
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('keeps internal declarations from separate client bundles isolated', async () => {
    const first = await bundleClientScript(
      `import { shared } from './first'\nconst firstValue = shared`,
      path.join(projectRoot, 'First.stx'),
      { projectRoot },
    )
    const second = await bundleClientScript(
      `import { shared } from './second'\nconst secondValue = shared`,
      path.join(projectRoot, 'Second.stx'),
      { projectRoot },
    )

    expect(() => new Function(`${first}\n${second}`)).not.toThrow()
    expect(first).toContain('var firstValue = __stxBundle_')
    expect(second).toContain('var secondValue = __stxBundle_')
  })
})
