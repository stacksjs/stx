/**
 * Power Management API
 *
 * Provides control over system sleep behavior using macOS caffeinate.
 * Spawns and manages /usr/bin/caffeinate processes.
 *
 * @example
 * ```typescript
 * import { caffeinate, decaffeinate, isCaffeinated, getCaffeinateStatus } from '@stacksjs/desktop'
 *
 * // Prevent sleep indefinitely
 * const instance = caffeinate()
 *
 * // Prevent sleep for 30 minutes
 * const instance = caffeinate({ duration: 30 })
 *
 * // Prevent only display sleep for 1 hour
 * const instance = caffeinate({
 *   duration: 60,
 *   preventDisplaySleep: true,
 *   preventIdleSleep: false,
 *   preventSystemSleep: false,
 * })
 *
 * // Check status
 * console.log(isCaffeinated()) // true
 * console.log(getCaffeinateStatus())
 *
 * // Stop
 * decaffeinate()
 * ```
 */

import type { Subprocess } from 'bun'

// ============================================================================
// Types
// ============================================================================

export interface CaffeinateOptions {
  /** Duration in minutes. -1 or undefined = indefinite */
  duration?: number
  /** Prevent display from sleeping (-d flag). Default: true */
  preventDisplaySleep?: boolean
  /** Prevent system from idle sleeping (-i flag). Default: true */
  preventIdleSleep?: boolean
  /** Prevent system from sleeping (-s flag). Default: true */
  preventSystemSleep?: boolean
  /** Prevent disk from sleeping (-m flag). Default: false */
  preventDiskSleep?: boolean
  /** Create an assertion to prevent sleep on behalf of user (-u flag). Default: true */
  assertUserActivity?: boolean
}

export interface CaffeinateInstance {
  /** Process ID of the caffeinate process */
  readonly pid: number
  /** When caffeinate was started */
  readonly startedAt: Date
  /** When caffeinate will end (null = indefinite) */
  readonly endsAt: Date | null
  /** Options used to create this instance */
  readonly options: CaffeinateOptions
  /** Whether this instance is still active */
  readonly isActive: boolean
  /** Remaining milliseconds (null = indefinite, 0 = expired) */
  readonly remainingMs: number | null
  /** Elapsed milliseconds since start */
  readonly elapsedMs: number
  /** Stop this caffeinate instance */
  stop(): void
  /** Register a callback for when this instance expires (duration-based only) */
  onExpire(handler: () => void): void
}

export interface CaffeinateStatus {
  /** Whether caffeinate is currently active */
  active: boolean
  /** The current caffeinate instance, if any */
  instance: CaffeinateInstance | null
  /** When the current session started */
  startedAt: Date | null
  /** When the current session will end */
  endsAt: Date | null
  /** Duration in minutes (-1 = indefinite, null = not active) */
  durationMinutes: number | null
}

// ============================================================================
// Internal State
// ============================================================================

let currentProcess: Subprocess | null = null
let currentInstance: CaffeinateInstanceImpl | null = null

class CaffeinateInstanceImpl implements CaffeinateInstance {
  private _process: Subprocess
  private _startedAt: Date
  private _endsAt: Date | null
  private _options: CaffeinateOptions
  private _expireHandlers: Array<() => void> = []
  private _expireTimer: ReturnType<typeof setTimeout> | null = null
  private _stopped = false

  constructor(process: Subprocess, options: CaffeinateOptions) {
    this._process = process
    this._options = options
    this._startedAt = new Date()

    const duration = options.duration
    if (duration && duration > 0) {
      const durationMs = duration * 60 * 1000
      this._endsAt = new Date(this._startedAt.getTime() + durationMs)

      this._expireTimer = setTimeout(() => {
        this._stopped = true
        for (const handler of this._expireHandlers) {
          try {
            handler()
          }
          catch {}
        }
      }, durationMs)
    }
    else {
      this._endsAt = null
    }
  }

  get pid(): number {
    return this._process.pid
  }

  get startedAt(): Date {
    return this._startedAt
  }

  get endsAt(): Date | null {
    return this._endsAt
  }

  get options(): CaffeinateOptions {
    return { ...this._options }
  }

  get isActive(): boolean {
    if (this._stopped)
      return false
    // Check if process is still running
    return this._process.exitCode === null
  }

  get remainingMs(): number | null {
    if (!this._endsAt)
      return null
    const remaining = this._endsAt.getTime() - Date.now()
    return Math.max(0, remaining)
  }

  get elapsedMs(): number {
    return Date.now() - this._startedAt.getTime()
  }

  stop(): void {
    if (this._stopped)
      return
    this._stopped = true

    if (this._expireTimer) {
      clearTimeout(this._expireTimer)
      this._expireTimer = null
    }

    try {
      this._process.kill()
    }
    catch {
      // Process may have already exited
    }
  }

  onExpire(handler: () => void): void {
    this._expireHandlers.push(handler)
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start preventing the system from sleeping.
 *
 * Spawns a `/usr/bin/caffeinate` process with the specified options.
 * If caffeinate is already active, the previous instance is stopped first.
 *
 * @param options - Caffeinate configuration
 * @returns A CaffeinateInstance for monitoring and controlling the session
 */
export function caffeinate(options: CaffeinateOptions = {}): CaffeinateInstance {
  // Stop any existing instance
  decaffeinate()

  const {
    duration,
    preventDisplaySleep = true,
    preventIdleSleep = true,
    preventSystemSleep = true,
    preventDiskSleep = false,
    assertUserActivity = true,
  } = options

  // Build flags
  const flags: string[] = []
  if (preventDisplaySleep)
    flags.push('-d')
  if (preventIdleSleep)
    flags.push('-i')
  if (preventSystemSleep)
    flags.push('-s')
  if (preventDiskSleep)
    flags.push('-m')
  if (assertUserActivity)
    flags.push('-u')

  // Build args
  const args: string[] = [...flags]

  // Add duration if specified (in seconds)
  if (duration && duration > 0) {
    args.push('-t', String(duration * 60))
  }

  // Spawn caffeinate
  const proc = Bun.spawn(['/usr/bin/caffeinate', ...args], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })

  const instance = new CaffeinateInstanceImpl(proc, options)
  currentProcess = proc
  currentInstance = instance

  return instance
}

/**
 * Stop caffeinate and allow the system to sleep normally.
 *
 * @param instance - Specific instance to stop. If omitted, stops the current active instance.
 */
export function decaffeinate(instance?: CaffeinateInstance): void {
  if (instance) {
    instance.stop()
    if (currentInstance === instance) {
      currentProcess = null
      currentInstance = null
    }
    return
  }

  if (currentInstance) {
    currentInstance.stop()
  }
  currentProcess = null
  currentInstance = null
}

/**
 * Check if caffeinate is currently active.
 */
export function isCaffeinated(): boolean {
  return currentInstance !== null && currentInstance.isActive
}

/**
 * Get the current caffeinate status.
 */
export function getCaffeinateStatus(): CaffeinateStatus {
  if (!currentInstance || !currentInstance.isActive) {
    return {
      active: false,
      instance: null,
      startedAt: null,
      endsAt: null,
      durationMinutes: null,
    }
  }

  const opts = currentInstance.options
  const duration = opts.duration

  return {
    active: true,
    instance: currentInstance,
    startedAt: currentInstance.startedAt,
    endsAt: currentInstance.endsAt,
    durationMinutes: (duration && duration > 0) ? duration : -1,
  }
}

/**
 * Format remaining caffeinate time as a human-readable string.
 *
 * @example
 * ```typescript
 * formatRemainingTime(instance) // "25:30" or "∞"
 * ```
 */
export function formatRemainingTime(instance?: CaffeinateInstance | null): string {
  const inst = instance || currentInstance
  if (!inst || !inst.isActive)
    return '0:00'

  const remaining = inst.remainingMs
  if (remaining === null)
    return '∞'

  const totalSeconds = Math.ceil(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Get a formatted description of the caffeinate duration.
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0 || minutes === -1)
    return 'Indefinitely'
  if (minutes < 60)
    return `${minutes} minutes`
  if (minutes === 60)
    return '1 hour'
  if (minutes % 60 === 0)
    return `${minutes / 60} hours`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}
