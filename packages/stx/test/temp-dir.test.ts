import { afterEach, describe, expect, it } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import {
  createTempDir,
  keepTempDir,
  keepTempDirsRequested,
  KEEP_MARKER,
  liveTempDirs,
  removeAllTempDirs,
  removeTempDir,
  sweepOrphanedTempDirs,
  tempDirPrefix,
  withTempDir,
} from '../src/temp-dir'

// A sandbox of its own rather than the real temp folder, which other
// processes on a shared machine write to at the same time. Not `stx-`
// prefixed, so the sweep under test can never match it.
const sandboxes: string[] = []
function sandbox(): string {
  const dir = mkdtempSync(join(tmpdir(), 'temp-dir-test-'))
  sandboxes.push(dir)
  return dir
}

afterEach(() => {
  removeAllTempDirs()
  for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function age(path: string, ms: number): void {
  const then = new Date(Date.now() - ms)
  utimesSync(path, then, then)
}

describe('temp dirs', () => {
  it('stamps the owning pid into every name', () => {
    expect(tempDirPrefix('stx-native-cli-')).toBe(`stx-native-cli-p${process.pid}-`)
    expect(tempDirPrefix('native-cli')).toBe(`stx-native-cli-p${process.pid}-`)
    expect(tempDirPrefix('stx-')).toBe(`stx-p${process.pid}-`)

    const dir = createTempDir('stx-name-')
    expect(dir).toMatch(new RegExp(`/stx-name-p${process.pid}-\\w{6}$`))
    expect(existsSync(dir)).toBe(true)
    expect(liveTempDirs()).toContain(dir)
  })

  it('removes a directory and forgets it', () => {
    const dir = createTempDir('stx-remove-')
    writeFileSync(join(dir, 'file'), 'x')
    removeTempDir(dir)
    expect(existsSync(dir)).toBe(false)
    expect(liveTempDirs()).not.toContain(dir)
  })

  it('removes the directory when the work inside withTempDir fails', async () => {
    let seen = ''
    await expect(withTempDir('stx-fails-', (dir) => {
      seen = dir
      writeFileSync(join(dir, 'half-written'), 'x')
      throw new Error('forced failure')
    })).rejects.toThrow('forced failure')
    expect(seen).not.toBe('')
    expect(existsSync(seen)).toBe(false)
  })

  it('removes everything still live in one call', () => {
    const a = createTempDir('stx-a-')
    const b = createTempDir('stx-b-')
    removeAllTempDirs()
    expect(existsSync(a)).toBe(false)
    expect(existsSync(b)).toBe(false)
    expect(liveTempDirs()).toEqual([])
  })

  it('only listens for signals while it has directories to clean', () => {
    const before = process.listenerCount('SIGTERM')
    const dir = createTempDir('stx-listen-')
    expect(process.listenerCount('SIGTERM')).toBe(before + 1)
    expect(process.listenerCount('exit')).toBeGreaterThan(0)
    removeTempDir(dir)
    expect(process.listenerCount('SIGTERM')).toBe(before)
  })

  it('creates under another root when asked', () => {
    const root = sandbox()
    const dir = createTempDir('rooted', root)
    expect(readdirSync(root)).toEqual([dir.slice(root.length + 1)])
    removeTempDir(dir)
    expect(readdirSync(root)).toEqual([])
  })

  it('sweeps directories whose process is gone, and nothing else', () => {
    const root = sandbox()
    const dead = join(root, 'stx-native-cli-p999999-aB3dE5')
    const alive = join(root, `stx-native-cli-p${process.pid}-aB3dE5`)
    const other = join(root, 'stx-native-cli-p424242-aB3dE5')
    const young = join(root, 'stx-young-p999998-aB3dE5')
    const kept = join(root, 'stx-kept-p999997-aB3dE5')
    const foreign = join(root, 'stx-something-else')
    const legacy = join(root, 'stx-native-cli-aB3dE5')
    const file = join(root, 'stx-file-p999996-aB3dE5')
    for (const dir of [dead, alive, other, young, kept, foreign, legacy]) mkdirSync(dir)
    writeFileSync(file, '')
    writeFileSync(join(kept, KEEP_MARKER), '')
    for (const path of [dead, alive, other, kept, foreign, legacy, file]) age(path, 10 * 60_000)

    const removed = sweepOrphanedTempDirs({ root, isAlive: pid => pid === 424242 })

    expect(removed).toEqual([dead])
    expect(readdirSync(root).sort()).toEqual([
      'stx-file-p999996-aB3dE5',
      'stx-kept-p999997-aB3dE5',
      'stx-native-cli-aB3dE5',
      `stx-native-cli-p${process.pid}-aB3dE5`,
      'stx-native-cli-p424242-aB3dE5',
      'stx-something-else',
      'stx-young-p999998-aB3dE5',
    ].sort())
  })

  it('a kept directory survives removeTempDir, removeAllTempDirs and the sweep', () => {
    const root = sandbox()
    const dir = createTempDir('stx-keep-me-', root)
    keepTempDir(dir)
    removeTempDir(dir)
    removeAllTempDirs()
    age(dir, 10 * 60_000)
    sweepOrphanedTempDirs({ root, isAlive: () => false })
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(join(dir, KEEP_MARKER))).toBe(true)
  })

  it('STX_KEEP_TEMP is the switch that keeps every directory', () => {
    expect(keepTempDirsRequested({})).toBe(false)
    expect(keepTempDirsRequested({ STX_KEEP_TEMP: '' })).toBe(false)
    expect(keepTempDirsRequested({ STX_KEEP_TEMP: '0' })).toBe(false)
    expect(keepTempDirsRequested({ STX_KEEP_TEMP: 'false' })).toBe(false)
    expect(keepTempDirsRequested({ STX_KEEP_TEMP: '1' })).toBe(true)
    expect(keepTempDirsRequested({ STX_KEEP_TEMP: 'true' })).toBe(true)

    const root = sandbox()
    const previous = process.env.STX_KEEP_TEMP
    const warn = console.warn
    const warned: string[] = []
    process.env.STX_KEEP_TEMP = '1'
    console.warn = (message: string) => { warned.push(message) }
    try {
      const dir = createTempDir('inspect', root)
      expect(liveTempDirs()).not.toContain(dir)
      expect(existsSync(join(dir, KEEP_MARKER))).toBe(true)
      expect(warned.join('\n')).toContain(dir)
    }
    finally {
      console.warn = warn
      if (previous === undefined)
        delete process.env.STX_KEEP_TEMP
      else process.env.STX_KEEP_TEMP = previous
    }
  })
})
