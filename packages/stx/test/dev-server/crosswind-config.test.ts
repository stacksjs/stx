import { afterEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { loadCrosswindConfig } from '../../src/dev-server/crosswind'

// =============================================================================
// Regression: the crosswind config loader must NOT emit noisy error stacks
// when the config file is simply missing. Earlier we handed off directly to
// bunfig's `loadConfigWithResult`, which searches 250+ fallback paths and
// then logs a multi-screen ConfigNotFoundError dump on every request when
// no config file is found. The dev server was run from repo root while the
// actual config lived in `examples/drivly/crosswind.config.ts` — every page
// build produced a wall of red error output.
//
// The fix pre-checks for the file's existence and only hands off to bunfig
// when it's actually there. Missing config → silent `null`.
// =============================================================================

const TMP_ROOT = path.join('/tmp', `stx-crosswind-config-${process.pid}-${Date.now()}`)

async function mkTmpDir(name: string): Promise<string> {
  const dir = path.join(TMP_ROOT, name)
  await Bun.$`mkdir -p ${dir}`.quiet()
  return dir
}

afterEach(async () => {
  await Bun.$`rm -rf ${TMP_ROOT}`.quiet().nothrow()
})

describe('loadCrosswindConfig (dev-server)', () => {
  it('returns null silently when no crosswind config exists at cwd', async () => {
    const dir = await mkTmpDir('no-config')

    // Capture any stderr noise that bunfig's error logger would otherwise
    // emit. Without the pre-check, bunfig logs a multi-screen error here.
    const origError = console.error
    const origWarn = console.warn
    const errorLogs: string[] = []
    const warnLogs: string[] = []
    console.error = (...args: unknown[]) => errorLogs.push(args.map(a => String(a)).join(' '))
    console.warn = (...args: unknown[]) => warnLogs.push(args.map(a => String(a)).join(' '))

    try {
      const result = await loadCrosswindConfig(dir)
      expect(result).toBeNull()
      // No config-not-found noise should reach stderr
      expect(errorLogs.join('\n')).not.toContain('ConfigNotFound')
      expect(errorLogs.join('\n')).not.toContain('Configuration loading failed')
      expect(warnLogs.join('\n')).not.toContain('ConfigNotFound')
    }
    finally {
      console.error = origError
      console.warn = origWarn
    }
  })

  it('loads a crosswind.config.ts when present', async () => {
    const dir = await mkTmpDir('has-config')
    await Bun.write(path.join(dir, 'crosswind.config.ts'), `
      export default {
        content: ['./pages/**/*.stx'],
        theme: { extend: { colors: { brand: '#FF3E54' } } },
      }
    `)

    const result = await loadCrosswindConfig(dir)
    expect(result).not.toBeNull()
    expect((result as any).content).toEqual(['./pages/**/*.stx'])
    expect((result as any).theme?.extend?.colors?.brand).toBe('#FF3E54')
  })

  it('loads a crosswind.config.js (JS variant)', async () => {
    const dir = await mkTmpDir('js-config')
    await Bun.write(
      path.join(dir, 'crosswind.config.js'),
      'export default { content: ["./src/**/*.html"] }',
    )

    const result = await loadCrosswindConfig(dir)
    expect(result).not.toBeNull()
    expect((result as any).content).toEqual(['./src/**/*.html'])
  })

  it('honors the passed `cwd` and does NOT fall back to process.cwd()', async () => {
    // Put the config in a NESTED directory that isn't process.cwd(). If
    // the loader ignored our `cwd` argument and fell back to the default
    // search root (process.cwd()), it would either find some unrelated
    // config up the tree or return null. Passing the correct cwd must
    // find exactly our file.
    const outer = await mkTmpDir('outer')
    const inner = await mkTmpDir('outer/inner-app')
    await Bun.write(
      path.join(inner, 'crosswind.config.ts'),
      `export default { content: ['inner-only'] }`,
    )

    const result = await loadCrosswindConfig(inner)
    expect((result as any)?.content).toEqual(['inner-only'])

    // The outer dir has no config — must still return null silently.
    const outerResult = await loadCrosswindConfig(outer)
    expect(outerResult).toBeNull()
  })
})
