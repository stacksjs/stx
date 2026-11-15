/**
 * What an update row says, without a template.
 *
 * An app that updates itself shows the same row everywhere: its name and
 * version, a sentence about where the update stands, and the one button that
 * moves it on. `settingsUpdateView` turns the status the host reports
 * (`craft.updater`, or a web app's own updater) into those words, so the row
 * is a function of the status and nothing else.
 */

/** Where an update stands. The states `craft.updater` reports. */
export type SettingsUpdateState = 'unavailable' | 'idle' | 'checking' | 'current' | 'available' | 'downloading' | 'installing' | 'installed' | 'error'

/** The status an updater reports. The shape of `craft.updater`'s `UpdateStatus`. */
export interface SettingsUpdateStatus {
  currentVersion: string
  state: SettingsUpdateState
  /** False when the app cannot replace itself. */
  selfUpdating: boolean
  /** Why `selfUpdating` is false, as a sentence. */
  reason?: string
  /** The update's version, from `available` on. */
  version?: string
  notes?: string
  publishedAt?: string
  /** 0 to 1 while downloading. */
  progress?: number
  error?: string
  lastCheckedAt?: string
}

/** What the row's button does: the event the row emits when it is pressed. */
export type SettingsUpdateAction = 'check' | 'install' | 'relaunch'

export interface SettingsUpdateView {
  /** The app and the version it is: `Library 2.4`. */
  title: string
  /** Where the update stands, as a sentence. */
  sentence: string
  /** The button to show, or null for none. */
  action: SettingsUpdateAction | null
  actionLabel: string
  /** Work is under way: the button is there and cannot be pressed. */
  busy: boolean
  /** `42%` while downloading, otherwise empty. */
  progress: string
  /** The sentence reports a failure. */
  failed: boolean
}

/** The words on the button for each action. */
export const SETTINGS_UPDATE_LABELS: Readonly<Record<SettingsUpdateAction, string>> = {
  check: 'Check Now',
  install: 'Download and Install',
  relaunch: 'Restart to Update',
}

function percent(progress: unknown): string {
  const value = Number(progress)
  if (!Number.isFinite(value))
    return ''
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`
}

/**
 * The row for `status`.
 *
 * No status yet (the host has not answered) is the app's name and nothing to
 * press. An app that cannot replace itself (`selfUpdating: false`: a Mac App
 * Store copy, a read-only volume) is never offered an install; it says why.
 */
export function settingsUpdateView(status: Partial<SettingsUpdateStatus> | null | undefined, appName = ''): SettingsUpdateView {
  const name = String(appName || '').trim()
  const version = String(status?.currentVersion || '').trim()
  const title = [name, version].filter(Boolean).join(' ')
  const view = (sentence: string, action: SettingsUpdateAction | null, extra: Partial<SettingsUpdateView> = {}): SettingsUpdateView => ({
    title,
    sentence,
    action,
    actionLabel: action ? SETTINGS_UPDATE_LABELS[action] : '',
    busy: false,
    progress: '',
    failed: false,
    ...extra,
  })
  if (!status || typeof status.state !== 'string')
    return view('', null)

  const app = name || 'This app'
  const next = String(status.version || '').trim()
  const update = next ? `Version ${next}` : 'An update'
  const canInstall = status.selfUpdating !== false
  const why = String(status.reason || '').trim()

  switch (status.state) {
    case 'unavailable':
      return view(why || `${app} cannot update itself.`, null)
    case 'idle':
      return view('Check for a newer version.', 'check')
    case 'checking':
      return view('Checking for updates...', 'check', { busy: true })
    case 'current':
      return view(`${app} is up to date.`, 'check')
    case 'available':
      return canInstall
        ? view(`${update} is available.`, 'install')
        : view(`${update} is available. ${why || `${app} cannot update itself.`}`, 'check')
    case 'downloading':
      return view(`Downloading ${next ? `version ${next}` : 'the update'}...`, 'install', { busy: true, progress: percent(status.progress) })
    case 'installing':
      return view(`Installing ${next ? `version ${next}` : 'the update'}...`, 'install', { busy: true })
    case 'installed':
      return view(`${update} is installed. Restart ${app} to finish updating.`, 'relaunch')
    case 'error':
      return view(String(status.error || '').trim() || 'The update could not be completed.', 'check', { failed: true })
    default:
      return view('', null)
  }
}
