import { afterEach, describe, expect, it } from 'bun:test'
import { DEFAULT_STATE_DIR, rebaseOntoStateDir, setStateDir, stateDir, stateDirName } from '../src/state-dir'

afterEach(() => {
  setStateDir(null)
  delete process.env.STX_DIR
})

describe('state directory', () => {
  it('defaults to a hidden .stx in the project root', () => {
    expect(stateDirName()).toBe(DEFAULT_STATE_DIR)
    expect(stateDir('/srv/app', 'cache')).toBe('/srv/app/.stx/cache')
  })

  it('follows the configured directory', () => {
    setStateDir('storage/framework/stx')
    expect(stateDir('/srv/app', 'bundle-tmp')).toBe('/srv/app/storage/framework/stx/bundle-tmp')
  })

  it('lets the environment override the config', () => {
    setStateDir('storage/framework/stx')
    process.env.STX_DIR = 'var/stx'
    expect(stateDir('/srv/app', 'cache')).toBe('/srv/app/var/stx/cache')
  })

  it('ignores a blank configured value', () => {
    setStateDir('   ')
    expect(stateDirName()).toBe(DEFAULT_STATE_DIR)
  })

  /**
   * An absolute value is what lets one setting cover both the code that
   * resolves against `process.cwd()` and the code that resolves against an app
   * directory somewhere below it.
   */
  it('pins state to an absolute directory regardless of the root passed in', () => {
    setStateDir('/srv/app/storage/framework/stx')
    expect(stateDir('/srv/app/resources', 'cache')).toBe('/srv/app/storage/framework/stx/cache')
  })
})

describe('rebaseOntoStateDir', () => {
  it('moves the whole family of default `.stx/` paths', () => {
    setStateDir('storage/framework/stx')
    expect(rebaseOntoStateDir('.stx/cache')).toBe('storage/framework/stx/cache')
    expect(rebaseOntoStateDir('.stx/ssg-cache')).toBe('storage/framework/stx/ssg-cache')
    expect(rebaseOntoStateDir('.stx/dist/story')).toBe('storage/framework/stx/dist/story')
    expect(rebaseOntoStateDir('.stx')).toBe('storage/framework/stx')
  })

  it('leaves a path the user pointed somewhere else alone', () => {
    setStateDir('storage/framework/stx')
    expect(rebaseOntoStateDir('tmp/cache')).toBe('tmp/cache')
    expect(rebaseOntoStateDir('/var/cache/stx')).toBe('/var/cache/stx')
    // Not a path segment boundary — a sibling directory, not ours.
    expect(rebaseOntoStateDir('.stx-serve/cache')).toBe('.stx-serve/cache')
  })

  it('is a no-op when nothing configures a state directory', () => {
    expect(rebaseOntoStateDir('.stx/cache')).toBe('.stx/cache')
  })
})
