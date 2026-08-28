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

/** The newest mtime under a directory, or 0 when it does not exist. */
function newestMtime(directory: string): number {
  if (!existsSync(directory))
    return 0

  return readdirSync(directory).reduce((newest, name) => {
    const fullPath = join(directory, name)
    const stat = statSync(fullPath)
    const mtime = stat.isDirectory() ? newestMtime(fullPath) : stat.mtimeMs

    return Math.max(newest, mtime)
  }, 0)
}

/**
 * When the build last ran, judged by one file only the build writes.
 *
 * Not the newest mtime anywhere under `dist/`: other suites in this package
 * write into it - the SSG build does - so "something in dist is newer than
 * src" is true even when the build has not run in a week.
 */
/**
 * How long the hook below may take.
 *
 * The build is ~10s, and a `beforeAll` gets 5s by default - so the rebuild
 * branch could never finish. It went unnoticed because the branch only ran when
 * `dist/` was absent, which is a clean checkout: exactly the case nobody runs
 * this suite in, and exactly the case it exists for. Generous rather than
 * tight, because a slow machine failing the build hook says nothing about the
 * package's exports.
 */
const BUILD_TIMEOUT_MS = 300_000

function lastBuiltAt(): number {
  const marker = join(packageRoot, 'dist', 'index.js')

  return existsSync(marker) ? statSync(marker).mtimeMs : 0
}

describe('package export surface', () => {
  beforeAll(() => {
    /*
     * Rebuild when the build output is OLDER than the sources, not merely when
     * it is absent.
     *
     * `dist/` is gitignored, so every checkout starts without it and the
     * absence check covered that. What it did not cover is the common case: a
     * dist from last week and a source file added since. This suite then
     * asserts "every public source module ships JS" against output that never
     * saw the module, and fails naming a file the author did not touch - which
     * is how a suite becomes something people learn to ignore.
     *
     * The other direction is worse and quieter: a dist built from newer source
     * than the checkout lets a genuinely missing module pass.
     */
    if (existsSync(join(packageRoot, 'dist', 'expressions.js')) && lastBuiltAt() >= newestMtime(join(packageRoot, 'src')))
      return

    const result = Bun.spawnSync(['bun', '--bun', 'build.ts'], {
      cwd: packageRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    expect(result.exitCode, result.stderr.toString()).toBe(0)
  }, BUILD_TIMEOUT_MS)

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
