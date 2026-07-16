import { beforeAll, describe, expect, it } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const packageRoot = join(import.meta.dir, '..')

function collectTypeScriptModules(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name)
    if (statSync(fullPath).isDirectory())
      return collectTypeScriptModules(fullPath)

    return name.endsWith('.ts') && !name.endsWith('.d.ts') ? [fullPath] : []
  })
}

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
      'component-library',
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

  it('emits valid, self-resolving ESM for every public source module', () => {
    const sourceRoot = join(packageRoot, 'src')
    const scanner = new Bun.Transpiler({ loader: 'js' })

    for (const sourcePath of collectTypeScriptModules(sourceRoot)) {
      const subpath = relative(sourceRoot, sourcePath).replace(/\.ts$/, '')
      const jsPath = join(packageRoot, 'dist', `${subpath}.js`)
      const dtsPath = join(packageRoot, 'dist', `${subpath}.d.ts`)

      expect(existsSync(jsPath), `${subpath} is missing runtime JS`).toBe(true)
      expect(existsSync(dtsPath), `${subpath} is missing declarations`).toBe(true)

      const code = readFileSync(jsPath, 'utf8')
      let imports: ReturnType<typeof scanner.scan>['imports']
      try {
        imports = scanner.scan(code).imports
      }
      catch (error) {
        throw new Error(`${subpath} is invalid JavaScript: ${error instanceof Error ? error.message : error}`)
      }

      for (const imported of imports) {
        if (!imported.path.startsWith('.'))
          continue

        const dependencyPath = resolve(dirname(jsPath), imported.path)
        expect(existsSync(dependencyPath), `${subpath} has an unresolved import: ${imported.path}`).toBe(true)
      }
    }
  })
})
