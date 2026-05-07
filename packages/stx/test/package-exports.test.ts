import { beforeAll, describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const packageRoot = join(import.meta.dir, '..')

describe('package export surface', () => {
  beforeAll(() => {
    if (existsSync(join(packageRoot, 'dist', 'expressions.js')))
      return

    const result = Bun.spawnSync(['bun', '--bun', 'build.ts'], {
      cwd: packageRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    expect(result.exitCode, result.stderr.toString()).toBe(0)
  })

  it('ships JavaScript for representative public subpath exports', async () => {
    const subpaths = [
      'expressions',
      'parser/tokenizer',
      'safe-evaluator',
      'types/index',
    ]

    for (const subpath of subpaths) {
      const jsPath = join(packageRoot, 'dist', `${subpath}.js`)
      const dtsPath = join(packageRoot, 'dist', `${subpath}.d.ts`)

      expect(existsSync(jsPath), `${subpath} is missing runtime JS`).toBe(true)
      expect(existsSync(dtsPath), `${subpath} is missing declarations`).toBe(true)

      const mod = await import(`@stacksjs/stx/${subpath}`)
      expect(Object.keys(mod).length, `${subpath} should import to a non-empty module`).toBeGreaterThan(0)
    }
  })

  it('keeps wildcard exports aligned for runtime and TypeScript consumers', () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

    expect(pkg.exports['./*']).toEqual({
      types: './dist/*.d.ts',
      import: './dist/*.js',
    })
  })
})
