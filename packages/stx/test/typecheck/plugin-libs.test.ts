/**
 * The `libs` of the stx entry in an app's tsconfig reach `stx typecheck`
 * (stacksjs/stx#2028).
 *
 * A global the app installs - Stacks' per-request `requestContext` - is
 * declared in the app's own files, which the checker only saw when handed
 * `--lib`. The editor plugin cannot be handed a flag, so the page passed the
 * gate and showed "Cannot find name" in the editor. Both now read this list.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findStxPluginEntry, STX_TS_PLUGIN_NAME } from '../../src/stx-plugin-config'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const root = mkdtempSync(join(tmpdir(), 'stx-plugin-libs-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

function read(file: string): Record<string, any> | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  }
  catch {
    return undefined
  }
}
const exists = (file: string): boolean => existsSync(file)

function app(name: string, files: Record<string, string>): string {
  const dir = join(root, name)
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(join(dir, file, '..'), { recursive: true })
    writeFileSync(join(dir, file), text)
  }
  return dir
}

describe('findStxPluginEntry', () => {
  it('resolves libs against the config that declares them, through extends', () => {
    const dir = app('extends', {
      'tsconfig.json': JSON.stringify({ extends: './framework/tsconfig.app.json' }),
      'framework/tsconfig.app.json': JSON.stringify({ compilerOptions: { plugins: [{ name: STX_TS_PLUGIN_NAME, libs: ['./types/globals.d.ts'] }] } }),
    })
    expect(findStxPluginEntry(join(dir, 'resources', 'views'), read, exists)).toEqual({
      configPath: join(dir, 'framework', 'tsconfig.app.json'),
      libs: [join(dir, 'framework', 'types', 'globals.d.ts')],
    })
  })

  it('stops at a config whose own plugins list replaces its base\'s', () => {
    const dir = app('replaced', {
      'tsconfig.json': JSON.stringify({ extends: './base.json', compilerOptions: { plugins: [{ name: 'other' }] } }),
      'base.json': JSON.stringify({ compilerOptions: { plugins: [{ name: STX_TS_PLUGIN_NAME, libs: ['./a.d.ts'] }] } }),
    })
    expect(findStxPluginEntry(dir, read, exists)).toBeUndefined()
  })
})

describe('stx typecheck', () => {
  it('checks a page against the declared libs', async () => {
    const dir = app('page', {
      'tsconfig.json': JSON.stringify({ compilerOptions: { plugins: [{ name: STX_TS_PLUGIN_NAME, libs: ['./types/request.d.ts'] }] } }),
      'types/request.d.ts': 'export {}\ndeclare global {\n  const requestContext: { cookie: (name: string) => string | undefined }\n}\n',
      'page.stx': '<script server>\nconst token: string | undefined = requestContext.cookie(\'cart\')\nconst wrong: number = requestContext.cookie(\'cart\')\n</script>\n<p>{{ token }}</p>',
    })
    const result = await typecheckStxFiles([join(dir, 'page.stx')], { templates: false })
    // Typed, not merely declared: the second line is a real error.
    expect(result.diagnostics.filter(d => d.category === 'error').map(d => [d.line, d.code])).toEqual([[3, 2322]])
  })
})
