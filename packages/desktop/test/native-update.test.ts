import { describe, expect, it } from 'bun:test'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AutoUpdater } from '../src/self-update'
import { createNativeUpdateApi, parsePantryUpdateManifest } from '../src/native-update'

const repository = 'stacksjs/launchpad'
function manifest() {
  return { schemaVersion: 1, repository, tag: 'v1.0.11', generatedAt: '2026-10-29T00:00:00Z', assets: [
    { name: 'Launchpad-1.0.11.dmg', size: 300, sha256: 'a'.repeat(64) },
    { name: 'Launchpad-1.0.11-58-darwin-arm64.tar.gz', size: 250, sha256: 'b'.repeat(64) },
  ] }
}

describe('Pantry update feed', () => {
  it('uses the release tag and verified DMG, never the privileged installer', () => {
    const parsed = parsePantryUpdateManifest(manifest(), repository, 'arm64')
    expect(parsed.version).toBe('1.0.11')
    expect(parsed.platforms.darwin).toEqual({ url: 'https://github.com/stacksjs/launchpad/releases/download/v1.0.11/Launchpad-1.0.11.dmg', size: 300, sha256: 'a'.repeat(64) })
  })
  it('rejects another repository and an incompatible architecture', () => {
    expect(() => parsePantryUpdateManifest(manifest(), 'other/repository', 'arm64')).toThrow('Invalid')
    expect(() => parsePantryUpdateManifest(manifest(), repository, 'x64')).toThrow('does not support')
  })
  it('rejects missing checksums, unsafe names, invalid sizes and ambiguous images', () => {
    for (const patch of [{ sha256: '' }, { name: '../App.dmg' }, { size: -1 }, { size: 1.5 }]) {
      const input = manifest()
      Object.assign(input.assets[0]!, patch)
      expect(() => parsePantryUpdateManifest(input, repository, 'arm64')).toThrow('disk image')
    }
    const input = manifest()
    input.assets.push({ ...input.assets[0]!, name: 'Other.dmg' })
    expect(() => parsePantryUpdateManifest(input, repository, 'arm64')).toThrow('disk image')
  })
  it('rejects malformed release metadata', () => {
    for (const input of [null, {}, { ...manifest(), tag: '../../main' }, { ...manifest(), generatedAt: 'bad' }, { ...manifest(), assets: null }])
      expect(() => parsePantryUpdateManifest(input, repository, 'arm64')).toThrow('Invalid')
  })
})

class FakeUpdater extends EventEmitter {
  error: Error | null = null
  update: { version: string } | null = { version: '1.0.11' }
  downloaded = true
  installs = 0
  gate: Promise<void> = Promise.resolve()
  async checkForUpdates() { await this.gate; return this.update }
  getLastError() { return this.error }
  async downloadUpdate() { this.emit('download-progress', { percent: 50 }); return this.downloaded ? '/verified/App.dmg' : null }
  async installUpdate(restart: boolean) { expect(restart).toBe(true); this.installs++ }
}
function fixture() {
  const updater = new FakeUpdater()
  const api = createNativeUpdateApi({ repository, currentVersion: '1.0.10', appPath: '/Applications/Fixture.app' }, async () => updater as unknown as AutoUpdater)
  const request = (path = '', method = 'GET') => api(new Request(`http://127.0.0.1/api/updates${path}`, { method }))
  const settled = async () => {
    for (let i = 0; i < 100; i++) {
      const state = await (await request())!.json()
      if (!['checking', 'downloading', 'installing'].includes(state.phase)) return state
      await Bun.sleep(1)
    }
    throw new Error('Operation did not settle')
  }
  return { updater, api, request, settled }
}

describe.skipIf(process.platform !== 'darwin')('native update API', () => {
  it('requires the check, download, install sequence and relaunches via Craft', async () => {
    const f = fixture()
    expect((await f.request('/install', 'POST'))!.status).toBe(409)
    expect((await f.request('/check', 'POST'))!.status).toBe(202)
    expect((await f.settled()).phase).toBe('available')
    await f.request('/download', 'POST')
    expect((await f.settled()).phase).toBe('ready')
    await f.request('/install', 'POST')
    expect((await f.settled()).phase).toBe('installed')
    expect(f.updater.installs).toBe(1)
  })
  it('serializes concurrent requests without waiting on the operation', async () => {
    const f = fixture()
    let release = () => {}
    f.updater.gate = new Promise<void>(resolve => { release = resolve })
    expect((await f.request('/check', 'POST'))!.status).toBe(202)
    expect((await (await f.request())!.json()).phase).toBe('checking')
    expect((await f.request('/check', 'POST'))!.status).toBe(409)
    release()
    expect((await f.settled()).phase).toBe('available')
  })
  it('keeps failed checks distinct from being up to date and permits retry', async () => {
    const f = fixture()
    f.updater.update = null
    f.updater.error = new Error('Network unavailable')
    await f.request('/check', 'POST')
    expect((await f.settled()).error).toBe('Network unavailable')
    f.updater.error = null
    await f.request('/check', 'POST')
    expect((await f.settled()).phase).toBe('current')
  })
  it('does not permit installing a failed download', async () => {
    const f = fixture()
    await f.request('/check', 'POST'); await f.settled()
    f.updater.downloaded = false
    await f.request('/download', 'POST')
    expect((await f.settled()).phase).toBe('error')
    expect((await f.request('/install', 'POST'))!.status).toBe(409)
    expect(f.updater.installs).toBe(0)
  })
  it('leaves App Store copies on the App Store update path', async () => {
    const appPath = mkdtempSync(join(tmpdir(), 'store-update-'))
    let initialized = false
    try {
      mkdirSync(join(appPath, 'Contents/_MASReceipt'), { recursive: true })
      writeFileSync(join(appPath, 'Contents/_MASReceipt/receipt'), 'fixture')
      const api = createNativeUpdateApi({ repository, currentVersion: '1.0.10', appPath }, async () => { initialized = true; return new FakeUpdater() as unknown as AutoUpdater })
      const response = await api(new Request('http://localhost/api/updates/check', { method: 'POST' }))
      expect(response!.status).toBe(409)
      expect((await response!.json()).phase).toBe('unavailable')
      expect(initialized).toBe(false)
    }
    finally { rmSync(appPath, { recursive: true, force: true }) }
  })
  it('ignores unrelated routes and rejects reads that mutate state', async () => {
    const f = fixture()
    expect(await f.api(new Request('http://localhost/api/commands'))).toBeNull()
    expect((await f.request('/install'))!.status).toBe(405)
    expect((await (await f.request())!.json()).phase).toBe('idle')
  })
})
