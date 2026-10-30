/** Pantry release feeds and the authenticated native-backend update endpoint. */
import type { AutoUpdater, SelfUpdaterOptions, UpdaterConfig } from './self-update'
import process from 'node:process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { bundlePathForExecutable, createSelfUpdater, githubReleaseAssetUrl } from './self-update'

export interface NativeUpdateState {
  currentVersion: string
  phase: 'idle' | 'checking' | 'available' | 'current' | 'downloading' | 'ready' | 'installing' | 'installed' | 'error' | 'unavailable'
  version?: string
  percent?: number
  error?: string
}

/** Convert Pantry's signed-release inventory into Craft's verified-download input. */
export function parsePantryUpdateManifest(input: unknown, repository: string, arch: string = process.arch): ReturnType<NonNullable<UpdaterConfig['parseManifest']>> {
  const manifest = input as { schemaVersion?: number, repository?: string, tag?: string, generatedAt?: string, assets?: Array<{ name: string, size: number, sha256: string }> } | null
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !manifest || manifest.schemaVersion !== 1
    || manifest.repository !== repository || typeof manifest.tag !== 'string'
    || !/^v\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.tag)
    || !manifest.generatedAt || !Number.isFinite(Date.parse(manifest.generatedAt)) || !Array.isArray(manifest.assets))
  throw new Error('Invalid Pantry release manifest')

  const archives = manifest.assets.filter(asset => typeof asset?.name === 'string' && /-darwin-(arm64|x64)\.tar\.gz$/.test(asset.name))
  if (archives.length && !archives.some(asset => asset.name.endsWith(`-darwin-${arch}.tar.gz`)))
    throw new Error(`This release does not support ${arch} Macs`)
  const images = manifest.assets.filter(asset => typeof asset?.name === 'string' && asset.name.endsWith('.dmg'))
  const candidates = images.length > 1 ? images.filter(asset => asset.name.includes(`-${arch}.`)) : images
  const asset = candidates[0]
  if (candidates.length !== 1 || !asset || !asset.name || /[/\\]/.test(asset.name)
    || !Number.isSafeInteger(asset.size) || asset.size <= 0 || !/^[a-f\d]{64}$/i.test(asset.sha256))
  throw new Error('Release must contain one compatible disk image with a SHA-256 checksum')

  return {
    version: manifest.tag.slice(1),
    releaseDate: manifest.generatedAt,
    platforms: { darwin: {
      url: githubReleaseAssetUrl(repository, encodeURIComponent(manifest.tag), encodeURIComponent(asset.name)),
      size: asset.size,
      sha256: asset.sha256,
    } },
  }
}

export async function createPantrySelfUpdater(options: SelfUpdaterOptions): Promise<AutoUpdater> {
  return createSelfUpdater({
    ...options,
    manifestAsset: 'release-manifest.json',
    parseManifest: input => parsePantryUpdateManifest(input, options.repository),
    autoDownload: false,
    autoInstall: false,
  })
}

/**
 * Mount only behind runNativeBackend's session authentication. This endpoint
 * accepts no paths, URLs or policies from the client. Operations serialize and
 * return promptly; GET reports throttled Craft progress without holding a request.
 */
export function createNativeUpdateApi(options: SelfUpdaterOptions, createUpdater: (options: SelfUpdaterOptions) => Promise<AutoUpdater> = createPantrySelfUpdater): (request: Request) => Promise<Response | null> {
  let state: NativeUpdateState = { currentVersion: options.currentVersion, phase: 'idle' }
  let updater: AutoUpdater | undefined
  let pending: Promise<void> | undefined
  const appPath = options.appPath ?? bundlePathForExecutable()
  if (!appPath || process.platform !== 'darwin')
    state = { ...state, phase: 'unavailable', error: 'Updates are available in the installed Mac app.' }
  else if (existsSync(join(appPath, 'Contents/_MASReceipt/receipt')))
    state = { ...state, phase: 'unavailable', error: 'Use the App Store to update this copy.' }

  const respond = (status = 200) => Response.json(state, { status, headers: { 'cache-control': 'no-store' } })
  return async (request: Request): Promise<Response | null> => {
    const path = new URL(request.url).pathname
    if (path !== '/api/updates' && !path.startsWith('/api/updates/')) return null
    if (path === '/api/updates' && request.method === 'GET') return respond()
    const action = path.slice('/api/updates/'.length)
    if (request.method !== 'POST' || !['check', 'download', 'install'].includes(action)) return respond(405)
    if (state.phase === 'unavailable') return respond(409)
    if (pending) return respond(409)
    if (action === 'download' && state.phase !== 'available') return respond(409)
    if (action === 'install' && state.phase !== 'ready') return respond(409)
    state = { ...state, phase: action === 'check' ? 'checking' : action === 'download' ? 'downloading' : 'installing', error: undefined, percent: undefined }
    pending = Promise.resolve().then(async () => {
      if (!updater) {
        updater = await createUpdater(options)
        updater.on('error', () => {}) // Craft retains the error for the operation below.
        updater.on('download-progress', progress => { state = { ...state, percent: progress.percent } })
      }
      if (action === 'check') {
        const update = await updater.checkForUpdates()
        if (updater.getLastError()) throw updater.getLastError()
        state = { currentVersion: options.currentVersion, phase: update ? 'available' : 'current', version: update?.version }
      }
      else if (action === 'download') {
        const downloaded = await updater.downloadUpdate()
        if (!downloaded) throw updater.getLastError() ?? new Error('Download failed')
        state = { ...state, phase: 'ready', percent: 100 }
      }
      else {
        await updater.installUpdate(true)
        state = { ...state, phase: 'installed', percent: 100 }
      }
    }).catch((error: unknown) => {
      state = { ...state, phase: 'error', error: error instanceof Error ? error.message : String(error) }
    }).finally(() => { pending = undefined })
    return respond(202)
  }
}
