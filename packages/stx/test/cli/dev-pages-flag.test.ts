/**
 * `stx dev --pages <dir>` (stacksjs/stx#1781).
 *
 * `stx build` accepted `--pages`; `stx dev` rejected it as an unknown option
 * and exited. Same flag, same concept, opposite answer per subcommand — so
 * `"dev": "stx dev --pages pages"` in a package.json hard-failed while the
 * sibling `build` script kept working. It landed under a caret range, so a
 * routine install removed a CLI flag with no deprecation window; downstream
 * (`stacksjs/ts-cloud` `packages/ui`) `bun run dev` simply stopped working and
 * nobody ran that UI locally for a while.
 *
 * Precedence is flag > `stx.config.ts` pagesDir > `pages`. The flag carries NO
 * clapp default on purpose: an unconditional `'pages'` would override a config
 * `pagesDir`, which is how Stacks apps point at `views/`.
 *
 * Each case runs against a directory where the target does NOT exist, so
 * serveApp bails before binding a port — the error message names the directory
 * it resolved, which is exactly what these assert.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-dev-pages')
const CLI_PATH = path.join(TEST_DIR, '../../bin/cli.ts')

function runCLI(args: string[], cwd: string = TEMP_DIR): { out: string, exitCode: number | null } {
  const child = Bun.spawnSync(['bun', CLI_PATH, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30000,
  })
  const decode = new TextDecoder()
  return {
    out: decode.decode(child.stdout) + decode.decode(child.stderr),
    exitCode: child.exitCode,
  }
}

const CONFIGURED_DIR = path.join(TEMP_DIR, 'configured')

beforeAll(() => {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
  fs.mkdirSync(CONFIGURED_DIR, { recursive: true })
  fs.writeFileSync(path.join(CONFIGURED_DIR, 'stx.config.ts'), 'export default { pagesDir: "views" }\n')
})

afterAll(() => {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true })
})

describe('stx dev --pages', () => {
  it('is listed in --help', () => {
    const { out } = runCLI(['dev', '--help'])
    expect(out).toContain('--pages')
  })

  it('is not rejected as an unknown option', () => {
    // The actual break: `ClappError: Unknown option --pages`, exit before
    // anything ran.
    const { out } = runCLI(['dev', '--pages', 'src/pages'])
    expect(out).not.toContain('Unknown option')
  })

  it('points route discovery at the directory passed', () => {
    const { out } = runCLI(['dev', '--pages', 'src/pages'])
    expect(out).toContain('src/pages')
  })

  it('falls back to config pagesDir when the flag is absent', () => {
    // Guards the no-default decision: a clapp `{ default: 'pages' }` would
    // silently win over this and break every Stacks app (config pagesDir:
    // 'views').
    const { out } = runCLI(['dev'], CONFIGURED_DIR)
    expect(out).toContain('views')
    expect(out).not.toContain(`No 'pages' directory`)
  })

  it('overrides config pagesDir when passed', () => {
    const { out } = runCLI(['dev', '--pages', 'custom-pages'], CONFIGURED_DIR)
    expect(out).toContain('custom-pages')
  })

  it('reports where it looked instead of only how to scaffold', () => {
    // The old message ("Create a pages/ directory…") read as advice for a new
    // project. The common case is an existing project run one directory off.
    const { out } = runCLI(['dev'])
    expect(out).toContain('Looked in:')
    expect(out).toContain(TEMP_DIR)
    expect(out).toContain('--pages')
  })
})
