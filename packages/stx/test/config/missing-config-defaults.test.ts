/**
 * A project with no stx config loads the defaults.
 *
 * bunfig's result API rejects with ConfigNotFoundError when it finds no file.
 * Its published builds up to 0.15.20 never recognised that error by name, so
 * the rejection never fired and stx came to rely on getting defaults; 0.15.21
 * fixed the name and loading any project without a config threw (it stopped
 * the 0.2.568 release in its installed-package smoke). The rejection here is
 * the one a bundled bunfig throws: its own class, recognised only by name.
 *
 * The loader is passed in rather than mocked: mock.module('bunfig') lasts for
 * the whole test process and emptied every later test's stx.config.
 */
import { describe, expect, it } from 'bun:test'
import { discoverConfig } from '../../src/config'

class ConfigNotFoundError extends Error {
  override readonly name = 'ConfigNotFoundError'
}

const options = { name: 'stx', alias: 'ui', cwd: '/nowhere', defaultConfig: { componentsDir: 'components' } }

describe('a project without an stx config', () => {
  it('loads the defaults instead of throwing', async () => {
    const result = await discoverConfig(options, async () => {
      throw new ConfigNotFoundError('Configuration "stx" or alias "ui" not found')
    })
    expect(result.config).toEqual({ componentsDir: 'components' })
  })

  it('still reports a config that exists but cannot load', async () => {
    const broken = new Error('Unexpected token')
    broken.name = 'ConfigLoadError'
    await expect(discoverConfig(options, async () => { throw broken })).rejects.toBe(broken)
  })

  it('returns a config that loads', async () => {
    const result = await discoverConfig(options, async () => ({ config: { componentsDir: 'src/components' } }))
    expect(result.config).toEqual({ componentsDir: 'src/components' })
  })
})
