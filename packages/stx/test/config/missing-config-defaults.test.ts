/**
 * A project with no stx config loads the defaults.
 *
 * bunfig's result API rejects with ConfigNotFoundError when it finds no file.
 * Its published builds up to 0.15.20 never recognised that error by name, so
 * the rejection never fired and stx came to rely on getting defaults; 0.15.21
 * fixed the name and loading any project without a config threw (it stopped
 * the 0.2.568 release in its installed-package smoke). The rejection here is
 * the one a bundled bunfig throws: its own class, recognised only by name.
 */
import { afterAll, describe, expect, it, mock } from 'bun:test'
import fs from 'node:fs'
import { createTempDir } from '../../src/temp-dir'

class ConfigNotFoundError extends Error {
  override readonly name = 'ConfigNotFoundError'
}

const bunfig = await import('bunfig')
mock.module('bunfig', () => ({
  ...bunfig,
  loadConfigWithResult: async () => {
    throw new ConfigNotFoundError('Configuration "stx" or alias "ui" not found')
  },
}))

const dir = createTempDir('stx-missing-config-')

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('a project without an stx config', () => {
  it('loads the defaults instead of throwing', async () => {
    const { loadStxConfig } = await import('../../src/config')
    const config = await loadStxConfig(dir)
    expect(config).toBeTruthy()
    expect(typeof config.componentsDir).toBe('string')
  })
})
