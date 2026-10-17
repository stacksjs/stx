import path from 'node:path'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { registerServeModuleBundle } from '../../src/caching'
import { generateCss, resetCssCache } from '../../src/dev-server/ts-css'
import { createTempDir } from '../../src/temp-dir'

let root = ''
const originalEngine = process.env.CROSSWIND_SRC
const originalStateDir = process.env.STX_DIR

beforeAll(() => {
  root = createTempDir('stx-linked-css-memory-')
  for (const directory of ['partials', 'components', 'layouts']) mkdirSync(path.join(root, directory))
  process.env.STX_DIR = path.join(root, 'state')
  const engine = path.join(root, 'engine.ts')
  const actual = Bun.resolveSync('@stacksjs/ts-css/engine', import.meta.dir)
  // A bounded adapter over the real engine makes the allocation contract
  // deterministic without exhausting the machine running the regression.
  writeFileSync(engine, `
    import * as actual from ${JSON.stringify(actual)}
    export const CSSGenerator = actual.CSSGenerator
    export const defaultConfig = actual.defaultConfig
    export const inputs: number[] = []
    export function extractClasses(content: string) {
      inputs.push(content.length)
      if (content.length > 100_000) throw new RangeError('CSS extraction input exceeds one source')
      return actual.extractClasses(content)
    }
  `)
  process.env.CROSSWIND_SRC = engine
  resetCssCache()
})

afterAll(() => {
  if (originalEngine === undefined) delete process.env.CROSSWIND_SRC
  else process.env.CROSSWIND_SRC = originalEngine
  if (originalStateDir === undefined) delete process.env.STX_DIR
  else process.env.STX_DIR = originalStateDir
  resetCssCache()
  rmSync(root, { recursive: true, force: true })
})

describe('CSS generation from several linked module bundles', () => {
  it('extracts every distinct source without allocating a joined copy of their code', async () => {
    const first = registerServeModuleBundle(`export const tone = 'text-emerald-600'; // ${' '.repeat(60_000)}`)
    const second = registerServeModuleBundle(`export const tone = 'bg-rose-100'; // ${' '.repeat(60_000)}`)
    const page = `<div class="flex gap-2"></div><script src="${first}"></script><script src="${second}"></script><script src="${first}"></script>`
    const css = await generateCss(page, root)

    expect(css).toContain('.flex')
    expect(css).toContain('.gap-2')
    expect(css).toContain('.text-emerald-600')
    expect(css).toContain('.bg-rose-100')
    const { inputs } = await import(path.join(root, 'engine.ts'))
    expect(inputs).toHaveLength(3)
    expect(Math.max(...inputs)).toBeLessThan(100_000)
  })
})
