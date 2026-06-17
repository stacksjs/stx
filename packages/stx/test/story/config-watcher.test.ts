/**
 * Tests for story config-watcher config resolution
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { findConfigFile, getConfigModifiedTime } from '../../src/story/config-watcher'

describe('findConfigFile', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-config-watcher-'))
  })

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  test('returns null when no config exists', () => {
    expect(findConfigFile(tmpRoot)).toBeNull()
  })

  test('resolves a root stx.config.ts (back-compat)', () => {
    const configPath = path.join(tmpRoot, 'stx.config.ts')
    fs.writeFileSync(configPath, 'export default {}\n')

    expect(findConfigFile(tmpRoot)).toBe(configPath)
  })

  test('resolves a config/stx.ts after the config moved into config/', () => {
    fs.mkdirSync(path.join(tmpRoot, 'config'))
    const configPath = path.join(tmpRoot, 'config', 'stx.ts')
    fs.writeFileSync(configPath, 'export default {}\n')

    expect(findConfigFile(tmpRoot)).toBe(configPath)
  })

  test('resolves a .config/stx.ts', () => {
    fs.mkdirSync(path.join(tmpRoot, '.config'))
    const configPath = path.join(tmpRoot, '.config', 'stx.ts')
    fs.writeFileSync(configPath, 'export default {}\n')

    expect(findConfigFile(tmpRoot)).toBe(configPath)
  })

  test('prefers a root stx.config.ts over config/stx.ts when both exist', () => {
    const rootPath = path.join(tmpRoot, 'stx.config.ts')
    fs.writeFileSync(rootPath, 'export default {}\n')
    fs.mkdirSync(path.join(tmpRoot, 'config'))
    fs.writeFileSync(path.join(tmpRoot, 'config', 'stx.ts'), 'export default {}\n')

    expect(findConfigFile(tmpRoot)).toBe(rootPath)
  })

  test('getConfigModifiedTime resolves via config/stx.ts', async () => {
    fs.mkdirSync(path.join(tmpRoot, 'config'))
    fs.writeFileSync(path.join(tmpRoot, 'config', 'stx.ts'), 'export default {}\n')

    const mtime = await getConfigModifiedTime(tmpRoot)
    expect(typeof mtime).toBe('number')
  })
})
