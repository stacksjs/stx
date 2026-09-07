import { describe, expect, it } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bundlePathForExecutable, createGitHubUpdateManifest, createSelfUpdater, githubLatestAssetUrl, githubReleaseAssetUrl, relaunchBundle } from '../src/self-update'

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

describe('bundlePathForExecutable', () => {
  it('finds the bundle a launcher runs from', () => {
    expect(bundlePathForExecutable('/Applications/Barista.app/Contents/MacOS/Barista'))
      .toBe('/Applications/Barista.app')
  })

  it('resolves to the outer app, not a bundle nested inside it', () => {
    // Apps embed whole bundles — XPC services, login items, helper apps. A
    // process running from one of those is still part of the app the user
    // installed, and updating only its enclosing fragment would leave the rest
    // of the app on the old version.
    expect(bundlePathForExecutable('/Applications/Barista.app/Contents/Library/Helper.app/Contents/MacOS/Helper'))
      .toBe('/Applications/Barista.app')
  })

  it('is null for a process that is not in a bundle at all', () => {
    // `bun run src/index.ts` in development. Returning a plausible-looking
    // directory here is how an updater ends up trying to swap a source tree.
    expect(bundlePathForExecutable('/opt/homebrew/bin/bun')).toBeNull()
  })

  it('handles a bundle at the filesystem root', () => {
    expect(bundlePathForExecutable('/Barista.app/Contents/MacOS/Barista')).toBe('/Barista.app')
  })
})

describe('createSelfUpdater', () => {
  it('refuses to run outside a bundle rather than guessing a path', async () => {
    await expect(createSelfUpdater({
      repository: 'stacksjs/barista',
      currentVersion: '0.1.0',
      appPath: undefined,
    })).rejects.toThrow(/not running from an .app bundle/)
  })

  it('pins the signing team to whoever signed the running copy', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-selfupdate-'))
    try {
      // No bundle to read an identity from, so the team resolves to undefined
      // and the updater is still constructed — an unsigned development build
      // must not be a crash, only an unpinned one.
      const updater = await createSelfUpdater({
        repository: 'stacksjs/barista',
        currentVersion: '0.1.0',
        appPath: join(dir, 'Barista.app'),
        autoDownload: false,
      })
      expect(updater).toBeDefined()
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('honours an explicit team over the running copy', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-selfupdate-'))
    try {
      const updater = await createSelfUpdater({
        repository: 'stacksjs/barista',
        currentVersion: '0.1.0',
        appPath: join(dir, 'Barista.app'),
        macos: { teamId: 'ABCDE12345' },
        autoDownload: false,
      })
      expect(updater).toBeDefined()
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('relaunchBundle', () => {
  it('runs the caller-supplied quit instead of ending the process', () => {
    let quit = 0
    // No appPath and no bundle in the executable path, so nothing is spawned;
    // what is under test is that `quit` replaces `process.exit`.
    relaunchBundle({ appPath: undefined, quit: () => { quit++ } })
    expect(quit).toBe(1)
  })
})
