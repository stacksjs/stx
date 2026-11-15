/**
 * What an update row says for each state an updater reports.
 */
import { describe, expect, it } from 'bun:test'
import { SETTINGS_UPDATE_LABELS, settingsUpdateView } from '../../src/ui/settings/update'

const base = { currentVersion: '2.4', selfUpdating: true }

describe('settingsUpdateView', () => {
  it('names the app and its version', () => {
    expect(settingsUpdateView({ ...base, state: 'idle' }, 'Library').title).toBe('Library 2.4')
    expect(settingsUpdateView({ ...base, state: 'idle' }).title).toBe('2.4')
    expect(settingsUpdateView(null, 'Library')).toEqual({ title: 'Library', sentence: '', action: null, actionLabel: '', busy: false, progress: '', failed: false })
    expect(settingsUpdateView(undefined).title).toBe('')
  })

  it('offers a check when idle, current or failed', () => {
    expect(settingsUpdateView({ ...base, state: 'idle' }, 'Library')).toMatchObject({ sentence: 'Check for a newer version.', action: 'check', actionLabel: 'Check Now', busy: false })
    expect(settingsUpdateView({ ...base, state: 'current' }, 'Library')).toMatchObject({ sentence: 'Library is up to date.', action: 'check' })
    expect(settingsUpdateView({ ...base, state: 'current' })).toMatchObject({ sentence: 'This app is up to date.' })
    expect(settingsUpdateView({ ...base, state: 'checking' }, 'Library')).toMatchObject({ sentence: 'Checking for updates...', action: 'check', busy: true })
    expect(settingsUpdateView({ ...base, state: 'error', error: 'The feed did not answer.' })).toMatchObject({ sentence: 'The feed did not answer.', action: 'check', failed: true })
    expect(settingsUpdateView({ ...base, state: 'error' })).toMatchObject({ sentence: 'The update could not be completed.', failed: true })
  })

  it('offers the install with its progress, then the restart', () => {
    expect(settingsUpdateView({ ...base, state: 'available', version: '2.5' }, 'Library')).toMatchObject({ sentence: 'Version 2.5 is available.', action: 'install', actionLabel: 'Download and Install', busy: false })
    expect(settingsUpdateView({ ...base, state: 'available' })).toMatchObject({ sentence: 'An update is available.' })
    expect(settingsUpdateView({ ...base, state: 'downloading', version: '2.5', progress: 0.416 })).toMatchObject({ sentence: 'Downloading version 2.5...', action: 'install', busy: true, progress: '42%' })
    expect(settingsUpdateView({ ...base, state: 'downloading', progress: 7 }).progress).toBe('100%')
    expect(settingsUpdateView({ ...base, state: 'downloading', progress: -1 }).progress).toBe('0%')
    expect(settingsUpdateView({ ...base, state: 'downloading' })).toMatchObject({ sentence: 'Downloading the update...', progress: '' })
    expect(settingsUpdateView({ ...base, state: 'installing', version: '2.5' })).toMatchObject({ sentence: 'Installing version 2.5...', action: 'install', busy: true, progress: '' })
    expect(settingsUpdateView({ ...base, state: 'installed', version: '2.5' }, 'Library')).toMatchObject({ sentence: 'Version 2.5 is installed. Restart Library to finish updating.', action: 'relaunch', actionLabel: 'Restart to Update', busy: false })
  })

  it('never offers an install to an app that cannot replace itself', () => {
    expect(settingsUpdateView({ ...base, selfUpdating: false, state: 'unavailable', reason: 'Updates come from the Mac App Store.' }, 'Library')).toMatchObject({ sentence: 'Updates come from the Mac App Store.', action: null, actionLabel: '' })
    expect(settingsUpdateView({ ...base, selfUpdating: false, state: 'unavailable' }, 'Library')).toMatchObject({ sentence: 'Library cannot update itself.', action: null })
    expect(settingsUpdateView({ ...base, selfUpdating: false, state: 'available', version: '2.5', reason: 'Move Library to Applications.' }, 'Library')).toMatchObject({ sentence: 'Version 2.5 is available. Move Library to Applications.', action: 'check' })
  })

  it('says nothing for a state it does not know', () => {
    expect(settingsUpdateView({ ...base, state: 'paused' as never }, 'Library')).toMatchObject({ title: 'Library 2.4', sentence: '', action: null })
    expect(Object.keys(SETTINGS_UPDATE_LABELS)).toEqual(['check', 'install', 'relaunch'])
  })
})
