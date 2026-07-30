/**
 * Self-updating apps.
 *
 * Craft owns the mechanics — fetch a manifest, verify the download by SHA-256
 * (and signature when one is configured), swap the app bundle. This module
 * re-exports that and adds the piece every app repeats: pointing it at GitHub
 * Releases.
 *
 * @example
 * ```typescript
 * import { createGitHubUpdater } from '@stacksjs/stx/desktop'
 *
 * const updater = createGitHubUpdater({
 *   repository: 'stacksjs/barista',
 *   currentVersion: '0.1.0',
 *   appPath: '/Applications/Barista.app',
 * })
 *
 * const update = await updater.checkForUpdates()
 * ```
 */
import { AutoUpdater, generateUpdateManifest } from 'craft-native'
import type { UpdateManifest, UpdaterConfig } from 'craft-native'

export { AutoUpdater, generateUpdateManifest }
export type { PlatformUpdate, UpdateManifest, UpdaterConfig, UpdaterEvent, UpdateProgress } from 'craft-native'

/** Manifest asset name an app publishes alongside its release artifacts. */
export const UPDATE_MANIFEST_ASSET = 'update.json'

export interface GitHubUpdaterOptions extends Omit<UpdaterConfig, 'updateUrl'> {
  /** `owner/repo`, e.g. `stacksjs/barista` */
  repository: string
  /**
   * Manifest asset name in the release. Defaults to `update.json`.
   * Must match what the build attached.
   */
  manifestAsset?: string
}

/**
 * URL of an asset on the repository's newest release.
 *
 * GitHub resolves `releases/latest/download/<asset>` to whichever release is
 * currently latest, so this stays correct without the app knowing any version.
 */
export function githubLatestAssetUrl(repository: string, asset: string): string {
  return `https://github.com/${repository}/releases/latest/download/${asset}`
}

/**
 * URL of an asset on a specific release tag. Used when building a manifest,
 * where the download has to point at the version being released rather than
 * at whatever is latest.
 */
export function githubReleaseAssetUrl(repository: string, tag: string, asset: string): string {
  return `https://github.com/${repository}/releases/download/${tag}/${asset}`
}

/** Point Craft's updater at a repository's latest GitHub release. */
export function createGitHubUpdater(options: GitHubUpdaterOptions): AutoUpdater {
  const { repository, manifestAsset = UPDATE_MANIFEST_ASSET, ...config } = options

  return new AutoUpdater({
    ...config,
    updateUrl: githubLatestAssetUrl(repository, manifestAsset),
  })
}

export interface GitHubManifestOptions {
  /** `owner/repo` the release lives in */
  repository: string
  /** Version being released, without a leading `v` */
  version: string
  /** Release tag the assets are attached to. Defaults to `v<version>`. */
  tag?: string
  releaseNotes?: string
  /** Downloadable artifact per platform, as a local path */
  artifacts: {
    darwin?: string
    win32?: string
    linux?: string
  }
}

/**
 * Build the manifest for a GitHub release, hashing each artifact and pointing
 * its URL at the release's own tag.
 */
export function createGitHubUpdateManifest(options: GitHubManifestOptions): UpdateManifest {
  const tag = options.tag ?? `v${options.version}`
  const platforms: Record<string, { path: string, url: string }> = {}

  for (const [platform, path] of Object.entries(options.artifacts)) {
    if (!path)
      continue
    platforms[platform] = {
      path,
      url: githubReleaseAssetUrl(options.repository, tag, path.split('/').pop()!),
    }
  }

  return generateUpdateManifest({
    version: options.version,
    releaseNotes: options.releaseNotes,
    platforms,
  })
}
