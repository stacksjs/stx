import { describe, expect, it } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGitHubUpdateManifest, githubLatestAssetUrl, githubReleaseAssetUrl } from '../src/self-update'

describe('GitHub release URLs', () => {
  it('points the app at whatever release is latest, without knowing a version', () => {
    expect(githubLatestAssetUrl('stacksjs/barista', 'update.json'))
      .toBe('https://github.com/stacksjs/barista/releases/latest/download/update.json')
  })

  it('points a manifest entry at the release it belongs to', () => {
    expect(githubReleaseAssetUrl('stacksjs/barista', 'v0.1.0', 'Barista-0.1.0.dmg'))
      .toBe('https://github.com/stacksjs/barista/releases/download/v0.1.0/Barista-0.1.0.dmg')
  })
})

describe('GitHub update manifest', () => {
  it('hashes each artifact and derives its download URL from the tag', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-update-'))
    try {
      const dmg = join(dir, 'Barista-0.1.0.dmg')
      writeFileSync(dmg, 'pretend disk image')
      chmodSync(dmg, 0o644)

      const manifest = createGitHubUpdateManifest({
        repository: 'stacksjs/barista',
        version: '0.1.0',
        releaseNotes: 'First release',
        artifacts: { darwin: dmg },
      })

      expect(manifest.version).toBe('0.1.0')
      expect(manifest.releaseNotes).toBe('First release')
      expect(manifest.platforms.darwin.url)
        .toBe('https://github.com/stacksjs/barista/releases/download/v0.1.0/Barista-0.1.0.dmg')
      expect(manifest.platforms.darwin.size).toBe('pretend disk image'.length)
      // sha256 of the artifact, so a tampered download is rejected on install.
      expect(manifest.platforms.darwin.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('honours an explicit tag and skips platforms with no artifact', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-update-'))
    try {
      const dmg = join(dir, 'App.dmg')
      writeFileSync(dmg, 'x')

      const manifest = createGitHubUpdateManifest({
        repository: 'acme/app',
        version: '2.0.0',
        tag: 'release-2.0.0',
        artifacts: { darwin: dmg, win32: undefined, linux: undefined },
      })

      expect(manifest.platforms.darwin.url)
        .toBe('https://github.com/acme/app/releases/download/release-2.0.0/App.dmg')
      expect(Object.keys(manifest.platforms)).toEqual(['darwin'])
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
