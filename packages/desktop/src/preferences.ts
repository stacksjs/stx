/**
 * Preferences / Settings Storage API
 *
 * Simple JSON-based preferences storage for desktop applications.
 * Stores data in platform-appropriate locations with file watching
 * and change notification support.
 *
 * @example
 * ```typescript
 * import { createPreferences } from '@stacksjs/desktop'
 *
 * const prefs = createPreferences({
 *   name: 'my-app',
 *   defaults: {
 *     theme: 'dark',
 *     fontSize: 14,
 *     autoSave: true,
 *   },
 * })
 *
 * // Get a value
 * const theme = prefs.get('theme') // 'dark'
 *
 * // Set a value
 * prefs.set('theme', 'light')
 *
 * // Listen for changes
 * prefs.onChange('theme', (newVal, oldVal) => {
 *   console.log(`Theme changed from ${oldVal} to ${newVal}`)
 * })
 *
 * // Get all values
 * const all = prefs.getAll()
 *
 * // Reset to defaults
 * prefs.reset()
 * ```
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, watch } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir, platform } from 'node:os'

// ============================================================================
// Types
// ============================================================================

export interface PreferencesOptions<T extends Record<string, unknown>> {
  /** Application name (used for file path) */
  name: string
  /** Default preference values */
  defaults: T
  /** Custom storage path (overrides platform default) */
  path?: string
  /** Watch for external file changes. Default: true */
  watch?: boolean
}

export interface Preferences<T extends Record<string, unknown>> {
  /** Get a preference value */
  get<K extends keyof T>(key: K): T[K]
  /** Set a preference value */
  set<K extends keyof T>(key: K, value: T[K]): void
  /** Get all preference values */
  getAll(): T
  /** Check if a preference has been set (non-default) */
  has(key: keyof T): boolean
  /** Delete a preference (revert to default) */
  delete(key: keyof T): void
  /** Reset all preferences to defaults */
  reset(): void
  /** Listen for changes to a specific preference */
  onChange<K extends keyof T>(key: K, handler: (value: T[K], oldValue: T[K]) => void): () => void
  /** Listen for any preference change */
  onAnyChange(handler: (key: keyof T, value: unknown, oldValue: unknown) => void): () => void
  /** The file path where preferences are stored */
  readonly path: string
  /** Close the preferences (stop file watching) */
  close(): void
}

type ChangeHandler = (key: string, value: unknown, oldValue: unknown) => void

// ============================================================================
// Helpers
// ============================================================================

function getDefaultPrefsDir(appName: string): string {
  const os = platform()
  const home = homedir()

  switch (os) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', appName)
    case 'win32':
      return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), appName)
    default:
      return join(home, '.config', appName)
  }
}

// ============================================================================
// Implementation
// ============================================================================

class PreferencesImpl<T extends Record<string, unknown>> implements Preferences<T> {
  private _defaults: T
  private _data: Record<string, unknown>
  private _path: string
  private _changeHandlers: Map<string, Set<(value: unknown, oldValue: unknown) => void>> = new Map()
  private _anyChangeHandlers: Set<ChangeHandler> = new Set()
  private _watcher: ReturnType<typeof watch> | null = null
  private _writeTimer: ReturnType<typeof setTimeout> | null = null
  private _writing = false

  constructor(options: PreferencesOptions<T>) {
    this._defaults = { ...options.defaults }

    const dir = options.path
      ? dirname(options.path)
      : getDefaultPrefsDir(options.name)

    this._path = options.path || join(dir, 'preferences.json')

    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // Load existing preferences or create with defaults
    this._data = this._load()

    // Set up file watcher
    if (options.watch !== false) {
      this._setupWatcher()
    }
  }

  get path(): string {
    return this._path
  }

  get<K extends keyof T>(key: K): T[K] {
    if (key in this._data) {
      return this._data[key as string] as T[K]
    }
    return this._defaults[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    const oldValue = this.get(key)
    if (JSON.stringify(oldValue) === JSON.stringify(value))
      return

    this._data[key as string] = value
    this._scheduleSave()
    this._notifyChange(key as string, value, oldValue)
  }

  getAll(): T {
    return { ...this._defaults, ...this._data } as T
  }

  has(key: keyof T): boolean {
    return key in this._data
  }

  delete(key: keyof T): void {
    if (!(key in this._data))
      return
    const oldValue = this._data[key as string]
    delete this._data[key as string]
    this._scheduleSave()
    this._notifyChange(key as string, this._defaults[key], oldValue)
  }

  reset(): void {
    const oldData = { ...this._data }
    this._data = {}
    this._save()

    // Notify all changed keys
    for (const key of Object.keys(oldData)) {
      const defaultVal = (this._defaults as Record<string, unknown>)[key]
      this._notifyChange(key, defaultVal, oldData[key])
    }
  }

  onChange<K extends keyof T>(key: K, handler: (value: T[K], oldValue: T[K]) => void): () => void {
    const keyStr = key as string
    if (!this._changeHandlers.has(keyStr)) {
      this._changeHandlers.set(keyStr, new Set())
    }
    this._changeHandlers.get(keyStr)!.add(handler as (value: unknown, oldValue: unknown) => void)

    return () => {
      this._changeHandlers.get(keyStr)?.delete(handler as (value: unknown, oldValue: unknown) => void)
    }
  }

  onAnyChange(handler: ChangeHandler): () => void {
    this._anyChangeHandlers.add(handler)
    return () => {
      this._anyChangeHandlers.delete(handler)
    }
  }

  close(): void {
    if (this._watcher) {
      this._watcher.close()
      this._watcher = null
    }
    if (this._writeTimer) {
      clearTimeout(this._writeTimer)
      this._writeTimer = null
      // Flush pending writes
      this._save()
    }
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private _load(): Record<string, unknown> {
    try {
      if (existsSync(this._path)) {
        const content = readFileSync(this._path, 'utf-8')
        return JSON.parse(content)
      }
    }
    catch {
      // File doesn't exist or is corrupt, start fresh
    }
    return {}
  }

  private _save(): void {
    this._writing = true
    try {
      const json = JSON.stringify({ ...this._defaults, ...this._data }, null, 2)
      writeFileSync(this._path, json, 'utf-8')
    }
    catch (err) {
      console.error(`Failed to save preferences to ${this._path}:`, err)
    }
    finally {
      // Small delay before re-enabling watcher to avoid self-trigger
      setTimeout(() => {
        this._writing = false
      }, 100)
    }
  }

  private _scheduleSave(): void {
    if (this._writeTimer) {
      clearTimeout(this._writeTimer)
    }
    // Debounce writes by 50ms
    this._writeTimer = setTimeout(() => {
      this._writeTimer = null
      this._save()
    }, 50)
  }

  private _setupWatcher(): void {
    try {
      if (!existsSync(this._path)) {
        // Create the file first so we can watch it
        this._save()
      }

      this._watcher = watch(this._path, () => {
        if (this._writing)
          return

        // Reload and diff
        const newData = this._load()
        const oldData = { ...this._data }
        this._data = newData

        // Find changed keys
        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
        for (const key of allKeys) {
          const oldVal = key in oldData ? oldData[key] : (this._defaults as Record<string, unknown>)[key]
          const newVal = key in newData ? newData[key] : (this._defaults as Record<string, unknown>)[key]
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            this._notifyChange(key, newVal, oldVal)
          }
        }
      })
    }
    catch {
      // Watcher setup failed, preferences still work without watching
    }
  }

  private _notifyChange(key: string, value: unknown, oldValue: unknown): void {
    // Key-specific handlers
    const handlers = this._changeHandlers.get(key)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(value, oldValue)
        }
        catch {}
      }
    }

    // Any-change handlers
    for (const handler of this._anyChangeHandlers) {
      try {
        handler(key, value, oldValue)
      }
      catch {}
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a preferences store for your application.
 *
 * Preferences are stored as JSON in a platform-appropriate location:
 * - macOS: ~/Library/Application Support/{name}/preferences.json
 * - Windows: %APPDATA%/{name}/preferences.json
 * - Linux: ~/.config/{name}/preferences.json
 */
export function createPreferences<T extends Record<string, unknown>>(
  options: PreferencesOptions<T>,
): Preferences<T> {
  return new PreferencesImpl(options)
}
