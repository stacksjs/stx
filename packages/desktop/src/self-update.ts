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
import type { BundleIdentity, BundleTrustPolicy, BundleTrustResult, UpdateManifest, UpdaterConfig } from 'craft-native'
import { spawn } from 'node:child_process'
import process from 'node:process'
import {
  AutoUpdater,
  canReplaceBundle,
  clearQuarantine,
  extractBundle,
  generateUpdateManifest,
  readBundleIdentity,
  swapBundle,
  verifyBundleTrust,
} from 'craft-native'

export { AutoUpdater, generateUpdateManifest }

// The macOS bundle primitives, forwarded so an app never has to reach past
// `@stacksjs/desktop` into Craft for the half of self-updating that is file
// operations rather than HTTP.
export { canReplaceBundle, clearQuarantine, extractBundle, readBundleIdentity, swapBundle, verifyBundleTrust }
export type { BundleIdentity, BundleTrustPolicy, BundleTrustResult }
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

// =============================================================================
// The running bundle
// =============================================================================

/**
 * The `.app` the current process is running out of, or null outside one.
 *
 * Every self-updating app needs this and every one of them derives it
 * differently — usually as `../../..` from `process.execPath`, which is right
 * for `Foo.app/Contents/MacOS/Foo` and wrong for anything nested deeper.
 *
 * The *outermost* `.app` is the answer, not the nearest one. Apps embed whole
 * bundles inside themselves — XPC services, login items, a Sparkle updater —
 * and a process running from one of those is still part of the app the user
 * launched and installed. Taking the nearest bundle would have such a process
 * replace the fragment it happens to live in and leave the rest of the app at
 * the old version.
 *
 * Returns null for `bun run` in development, rather than pointing the updater
 * at a directory in the source tree.
 */
export function bundlePathForExecutable(execPath: string = process.execPath): string | null {
  const segments = execPath.split('/')
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].endsWith('.app'))
      return segments.slice(0, i + 1).join('/')
  }
  return null
}

/**
 * Team ID of the bundle this process is running from, or null.
 *
 * This is what makes "only install updates from us" a default rather than a
 * configuration step: an app does not have to know or hardcode its own Team
 * ID, because the copy already on disk is signed with it.
 */
export async function runningBundleTeamId(): Promise<string | null> {
  const appPath = bundlePathForExecutable()
  if (!appPath)
    return null
  const identity = await readBundleIdentity(appPath)
  return identity.teamId
}

// =============================================================================
// Relaunching
// =============================================================================

export interface RelaunchOptions {
  /** Bundle to start. Defaults to the bundle this process is running from. */
  appPath?: string
  /**
   * How to stop the copy that is running now.
   *
   * The default ends this process, which is right when the updater runs in
   * the process the user launched. It is wrong for the shape stx desktop apps
   * actually have — a launcher that spawns an agent and a window — where
   * ending the agent leaves the window open on a dead server and the launcher
   * still running. Those apps want {@link quitLauncher}.
   */
  quit?: () => void
  /**
   * Milliseconds to wait before quitting.
   *
   * An update triggered over HTTP has a response to flush; quitting in the
   * same tick means the caller sees a dropped connection and cannot tell a
   * successful install from a crash.
   */
  quitDelayMs?: number
}

/**
 * Quit the launcher that started this process.
 *
 * The stx desktop shape is one binary running as three processes: a launcher,
 * the agent it spawns, and the native window. Only the launcher can bring the
 * other two down, and it is this process's parent — so a `SIGTERM` there is
 * what "quit the app" means from inside the agent.
 */
export function quitLauncher(): void {
  const parent = process.ppid
  // ppid 1 means the parent already exited and launchd adopted us; there is
  // nothing above to signal, so ending this process is the whole app.
  if (parent > 1) {
    try {
      process.kill(parent, 'SIGTERM')
      return
    }
    catch {
      // Parent is gone, or not ours to signal. Fall through.
    }
  }
  process.exit(0)
}

/**
 * Start a fresh copy of the bundle, then stand the current one down.
 *
 * `open -n` rather than executing the binary directly: it goes through
 * LaunchServices, which registers the newly swapped bundle, gives it its own
 * activation and Dock entry, and starts it detached from this process — so
 * the new copy is not a child of the one that is about to exit.
 */
export function relaunchBundle(options: RelaunchOptions = {}): void {
  const appPath = options.appPath ?? bundlePathForExecutable()
  const quit = options.quit ?? (() => process.exit(0))

  if (appPath) {
    // No shell: a bundle path is user-controlled enough (`~/Applications`, a
    // renamed app) that quoting it into `sh -c` is a needless risk.
    const child = spawn('/usr/bin/open', ['-n', appPath], { detached: true, stdio: 'ignore' })
    child.unref()
  }

  const delay = options.quitDelayMs ?? 0
  if (delay > 0) {
    const timer = setTimeout(quit, delay)
    // Do not hold the event loop open for it; if the process is otherwise
    // finished, quitting early is the same outcome.
    timer.unref?.()
    return
  }

  quit()
}

// =============================================================================
// Self-updater
// =============================================================================

export interface SelfUpdaterOptions extends Omit<GitHubUpdaterOptions, 'appPath'> {
  /**
   * Bundle to replace. Defaults to the one this process is running from.
   */
  appPath?: string
  /**
   * Require the update to be signed by the same Apple Developer team as the
   * running copy. Defaults to true.
   *
   * Turning this off is only correct when a build genuinely changes teams, and
   * it should be a deliberate, temporary decision: without it the updater will
   * install any notarized bundle, and notarization is available to every Apple
   * developer account there is.
   */
  requireSameTeam?: boolean
}

/**
 * A GitHub-Releases updater for the app that is running, wired to the checks
 * macOS itself performs.
 *
 * Two things it does that a bare {@link AutoUpdater} cannot: it finds its own
 * bundle, and it pins the signing team to whatever signed that bundle. Both
 * are facts about the running app, so neither has to be configured, and an app
 * cannot get them subtly wrong by copying an example.
 */
export async function createSelfUpdater(options: SelfUpdaterOptions): Promise<AutoUpdater> {
  const { appPath, requireSameTeam = true, macos, ...rest } = options

  const bundle = appPath ?? bundlePathForExecutable()
  if (!bundle) {
    throw new Error(
      'createSelfUpdater: this process is not running from an .app bundle, so there is '
      + 'nothing to update. Pass `appPath` explicitly, or skip the updater in development.',
    )
  }

  // An explicit policy wins; otherwise pin to whoever signed the copy on disk.
  const teamId = macos?.teamId ?? (requireSameTeam ? (await readBundleIdentity(bundle)).teamId ?? undefined : undefined)

  return createGitHubUpdater({
    ...rest,
    appPath: bundle,
    macos: { ...macos, teamId },
    relaunch: options.relaunch ?? (target => relaunchBundle({ appPath: target, quit: quitLauncher, quitDelayMs: 250 })),
  })
}
