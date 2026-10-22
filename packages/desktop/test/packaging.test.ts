import { afterAll, describe, expect, test } from 'bun:test'
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'stx-packaging-'))
const modulePath = join(import.meta.dir, '../src/packaging.ts')
afterAll(() => rmSync(directory, { recursive: true, force: true }))

function resolveInChild(explicit?: string, env: Record<string, string | undefined> = {}) {
  return Bun.spawnSync([process.execPath, '-e', `import { resolveCraftExecutablePath } from ${JSON.stringify(modulePath)}; console.log(resolveCraftExecutablePath(${JSON.stringify(explicit)}))`], {
    env: { ...process.env, CRAFT_BIN: undefined, PATH: directory, ...env },
  })
}

describe('native runtime packaging', () => {
  test('explicit source builds resolve without Pantry and follow filesystem links', () => {
    const result = resolveInChild(process.execPath)
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString().trim()).toBe(realpathSync(process.execPath))
  })

  test('rejects activation scripts instead of silently copying them into a bundle', () => {
    const script = join(directory, 'launcher')
    writeFileSync(script, '#!/bin/sh\nexit 0\n')
    chmodSync(script, 0o755)
    const result = resolveInChild(script)
    expect(result.exitCode).not.toBe(0)
    expect(result.stderr.toString()).toContain('requires a native executable')
  })

  test.skipIf(process.platform === 'win32')('asks Pantry for the provider and propagates resolution failures', () => {
    const pantry = join(directory, 'pantry')
    const argumentsFile = join(directory, 'arguments')
    writeFileSync(pantry, '#!/bin/sh\nprintf "%s\\n" "$@" > "$ARGUMENTS_FILE"\nprintf "%s\\n" "$PROVIDER_FILE"\n')
    chmodSync(pantry, 0o755)
    const result = resolveInChild(undefined, { ARGUMENTS_FILE: argumentsFile, PROVIDER_FILE: process.execPath })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString().trim()).toBe(realpathSync(process.execPath))
    expect(readFileSync(argumentsFile, 'utf8')).toBe('which\ncraft\n--resolve\n')
    writeFileSync(pantry, '#!/bin/sh\nprintf "provider is missing\\n" >&2\nexit 1\n')
    const failure = resolveInChild()
    expect(failure.exitCode).not.toBe(0)
    expect(failure.stderr.toString()).toContain('provider is missing')
  })
})
