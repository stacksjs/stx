import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applicationDataDirectory } from '../src/application-data'

describe('application data across distribution channels', () => {
  it('keeps using the existing sandbox container without copying or merging databases', () => {
    const home = mkdtempSync(join(tmpdir(), 'native-data-'))
    const options = { home, platform: 'darwin' as const, bundleIdentifier: 'com.example.app' }
    try {
      expect(applicationDataDirectory('Example', options)).toBe(join(home, 'Library/Application Support/Example'))
      mkdirSync(join(home, 'Library/Containers/com.example.app'), { recursive: true })
      expect(applicationDataDirectory('Example', options)).toBe(join(home, 'Library/Containers/com.example.app/Data/Library/Application Support/Example'))
      const sandboxHome = join(home, 'Library/Containers/com.example.app/Data')
      expect(applicationDataDirectory('Example', { ...options, home: sandboxHome })).toBe(join(sandboxHome, 'Library/Application Support/Example'))
    }
    finally { rmSync(home, { recursive: true, force: true }) }
  })
  it('isolates explicit and environment profiles from a live sandbox container', () => {
    const home = mkdtempSync(join(tmpdir(), 'native-profile-'))
    const previous = process.env.STX_DATA_HOME
    try {
      mkdirSync(join(home, 'Library/Containers/com.example.app'), { recursive: true })
      process.env.STX_DATA_HOME = join(home, 'qualification')
      expect(applicationDataDirectory('Example', { home, platform: 'darwin', bundleIdentifier: 'com.example.app' })).toBe(join(home, 'qualification/Example'))
      expect(applicationDataDirectory('Example', { dataRoot: join(home, 'explicit') })).toBe(join(home, 'explicit/Example'))
      expect(() => applicationDataDirectory('Example', { dataRoot: '../relative' })).toThrow('absolute')
      expect(() => applicationDataDirectory('Example', { dataRoot: '/invalid' + String.fromCharCode(0) + 'root' })).toThrow()
    }
    finally {
      if (previous === undefined) delete process.env.STX_DATA_HOME
      else process.env.STX_DATA_HOME = previous
      rmSync(home, { recursive: true, force: true })
    }
  })
  it('rejects names that could address another application', () => {
    expect(() => applicationDataDirectory('../Other')).toThrow()
    expect(() => applicationDataDirectory('Example', { platform: 'darwin', bundleIdentifier: '../other' })).toThrow()
  })
})
