/**
 * `stx typecheck` knows an app's own composables (stacksjs/stx#1934).
 *
 * The runtime publishes every export from `composablesDir` as a bare global, so
 * a page calls `useSessionToken()` with no import. The checker only knew the
 * framework's globals from `stx.d.ts`, so an app's own composable was a hard
 * error — TS2552 "Cannot find name 'useSessionToken'. Did you mean
 * 'useSessionStorage'?" — on code that works in dev and in the static build. The
 * suggestion pointed at an unrelated built-in, which is worse than no
 * suggestion.
 *
 * The names are bound to their real modules through `typeof import(...)`, not to
 * `any`. `any` would silence the error while checking nothing, which is the same
 * shape as the bug it fixes: the checker reporting a verdict on a surface it
 * cannot see. So the tests below check both directions — the call resolves, AND
 * a wrong use of it is still caught.
 *
 * The composables directory is discovered from the process cwd, so these tests
 * run the checker with cwd pointed at a fixture rather than passing a path.
 * That is a global, so the cwd is restored in `finally` on every case.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearComposableCache } from '../../src/composable-loader'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const APP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-composables-tc-'))
const functionsDir = path.join(APP, 'functions')

beforeAll(async () => {
  fs.mkdirSync(functionsDir, { recursive: true })
  await Bun.write(
    path.join(functionsDir, 'session.ts'),
    [
      `export const SESSION_MAX_AGE = 30 * 24 * 60 * 60`,
      `export function useSessionToken(expiresIn?: number): { maxAge: number } {`,
      `  return { maxAge: expiresIn && expiresIn > 0 ? expiresIn : SESSION_MAX_AGE }`,
      `}`,
    ].join('\n'),
  )
})

afterAll(() => fs.rmSync(APP, { recursive: true, force: true }))

/** Typecheck one client block with the cwd pointed at the fixture app. */
async function check(name: string, script: string) {
  const file = path.join(APP, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)

  const previousCwd = process.cwd()
  process.chdir(APP)
  clearComposableCache()
  try {
    return await typecheckStxFiles([file], { templates: false })
  }
  finally {
    process.chdir(previousCwd)
    clearComposableCache()
  }
}

describe('an app composable called as a bare global', () => {
  it('resolves instead of reporting Cannot find name', async () => {
    const result = await check('settings.stx', `const authToken = useSessionToken()`)

    expect(result.diagnostics).toEqual([])
  })

  it('resolves an exported constant too, not only functions', async () => {
    const result = await check('const.stx', `const n: number = SESSION_MAX_AGE`)

    expect(result.diagnostics).toEqual([])
  })
})

describe('the declarations carry the real types', () => {
  it('catches a wrong argument type', async () => {
    // The assertion that makes the ones above meaningful. A `declare const
    // useSessionToken: any` would satisfy every "resolves" test while checking
    // nothing — which is exactly the blindness being fixed.
    const result = await check('wrong-arg.stx', `useSessionToken('soon')`)

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('catches a misspelled property on the result', async () => {
    const result = await check('typo-prop.stx', [
      `const s = useSessionToken()`,
      `const n: number = s.maxAge2`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.diagnostics.map(d => d.message).join('\n')).toContain('maxAge')
  })

  it('still reports a name that genuinely does not exist', async () => {
    const result = await check('missing.stx', `useNoSuchComposable()`)

    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.diagnostics[0].message).toContain('useNoSuchComposable')
  })
})

describe('the explicit import form', () => {
  it('typechecks, since it is the escape hatch for a name the runtime will not bind', async () => {
    const result = await check(
      'imported.stx',
      [
        `import { useSessionToken } from '@composables'`,
        `const s = useSessionToken()`,
        `const n: number = s.maxAge`,
      ].join('\n'),
    )

    expect(result.diagnostics).toEqual([])
  })
})
