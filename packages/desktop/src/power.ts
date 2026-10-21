/**
 * Power Management API
 *
 * Holds native macOS IOKit assertions in the host process. Assertions are
 * released on stop, expiry, and process exit; macOS also releases them on crash.
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
import { createPowerAssertion } from './power-native'

// ============================================================================
// Types
// ============================================================================

export interface CaffeinateOptions {
  /** Description shown by macOS power diagnostics. */
  reason?: string
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
  /** Process ID of the host owning the native assertions */
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

let currentInstance: CaffeinateInstanceImpl | null = null

class CaffeinateInstanceImpl implements CaffeinateInstance {
  private _release: () => void
  private _startedAt: Date
  private _endsAt: Date | null
  private _options: CaffeinateOptions
  private _expireHandlers: Array<() => void> = []
  private _expireTimer: ReturnType<typeof setTimeout> | null = null
  private _stopped = false

  constructor(release: () => void, options: CaffeinateOptions) {
    this._release = release
    this._options = { ...options }
    this._startedAt = new Date()

    const duration = options.duration
    if (duration && duration > 0) {
      const durationMs = duration * 60 * 1000
      this._endsAt = new Date(this._startedAt.getTime() + durationMs)

      this._expireTimer = setTimeout(() => {
        this.stop()
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
    return process.pid
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
    return !this._stopped
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

    this._release()
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
 * Acquires native IOKit power assertions with the specified options.
 * If caffeinate is already active, the previous instance is stopped first.
 *
 * @param options - Caffeinate configuration
 * @returns A CaffeinateInstance for monitoring and controlling the session
 */
export function caffeinate(options: CaffeinateOptions = {}): CaffeinateInstance {
  if (options.duration !== undefined && options.duration !== -1
    && (!Number.isFinite(options.duration) || options.duration <= 0))
  throw new RangeError('duration must be positive minutes or -1 for indefinitely')

  // Acquire first: a failed replacement must leave the existing session intact.
  const release = createPowerAssertion(options)
  const instance = new CaffeinateInstanceImpl(release, options)
  decaffeinate()
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
      currentInstance = null
    }
    return
  }

  if (currentInstance) {
    currentInstance.stop()
  }
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

// Normal termination releases eagerly; the OS owns crash cleanup.
if (typeof process !== 'undefined')
  process.once('exit', () => decaffeinate())
