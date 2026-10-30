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
  it('rejects names that could address another application', () => {
    expect(() => applicationDataDirectory('../Other')).toThrow()
    expect(() => applicationDataDirectory('Example', { platform: 'darwin', bundleIdentifier: '../other' })).toThrow()
  })
})
