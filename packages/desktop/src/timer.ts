/**
 * Timer / Scheduling Utilities
 *
 * Provides a rich timer API for desktop applications — useful for
 * Pomodoro timers, caffeinate countdowns, auto-save intervals, etc.
 *
 * @example
 * ```typescript
 * import { createTimer } from '@stacksjs/desktop'
 *
 * const timer = createTimer({
 *   duration: 25 * 60 * 1000, // 25 minutes
 *   onTick: (remaining) => {
 *     console.log(`${Math.ceil(remaining / 1000)}s remaining`)
 *   },
 *   onComplete: () => {
 *     console.log('Timer complete!')
 *   },
 * })
 *
 * timer.start()
 *
 * // Later...
 * timer.pause()
 * timer.resume()
 * timer.stop()
 * timer.reset()
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface TimerOptions {
  /** Duration in milliseconds */
  duration: number
  /** Called on each tick with remaining milliseconds */
  onTick?: (remaining: number) => void
  /** Called when the timer completes */
  onComplete?: () => void
  /** Milliseconds between ticks. Default: 1000 */
  tickInterval?: number
  /** Start the timer immediately. Default: false */
  autoStart?: boolean
}

export interface Timer {
  /** Start the timer */
  start(): void
  /** Stop the timer and reset */
  stop(): void
  /** Pause the timer */
  pause(): void
  /** Resume a paused timer */
  resume(): void
  /** Reset the timer to initial duration */
  reset(): void
  /** Whether the timer is currently running */
  readonly isRunning: boolean
  /** Whether the timer is paused */
  readonly isPaused: boolean
  /** Whether the timer has completed */
  readonly isComplete: boolean
  /** Remaining milliseconds */
  readonly remaining: number
  /** Elapsed milliseconds */
  readonly elapsed: number
  /** Total duration in milliseconds */
  readonly duration: number
  /** Progress as a fraction from 0 to 1 */
  readonly progress: number
  /** Register a completion handler */
  onComplete(handler: () => void): () => void
  /** Register a tick handler */
  onTick(handler: (remaining: number) => void): () => void
}

export interface IntervalOptions {
  /** Interval in milliseconds */
  interval: number
  /** Function to call on each interval */
  handler: () => void
  /** Start immediately. Default: true */
  immediate?: boolean
}

export interface Interval {
  /** Start the interval */
  start(): void
  /** Stop the interval */
  stop(): void
  /** Whether the interval is running */
  readonly isRunning: boolean
}

// ============================================================================
// Timer Implementation
// ============================================================================

class TimerImpl implements Timer {
  private _duration: number
  private _tickInterval: number
  private _remaining: number
  private _running = false
  private _paused = false
  private _complete = false
  private _intervalId: ReturnType<typeof setInterval> | null = null
  private _lastTick: number = 0
  private _completionHandlers: Set<() => void> = new Set()
  private _tickHandlers: Set<(remaining: number) => void> = new Set()

  constructor(options: TimerOptions) {
    this._duration = options.duration
    this._tickInterval = options.tickInterval || 1000
    this._remaining = options.duration

    if (options.onComplete)
      this._completionHandlers.add(options.onComplete)

    if (options.onTick)
      this._tickHandlers.add(options.onTick)

    if (options.autoStart)
      this.start()
  }

  get isRunning(): boolean {
    return this._running && !this._paused
  }

  get isPaused(): boolean {
    return this._paused
  }

  get isComplete(): boolean {
    return this._complete
  }

  get remaining(): number {
    if (this._running && !this._paused) {
      const elapsed = Date.now() - this._lastTick
      return Math.max(0, this._remaining - elapsed)
    }
    return Math.max(0, this._remaining)
  }

  get elapsed(): number {
    return this._duration - this.remaining
  }

  get duration(): number {
    return this._duration
  }

  get progress(): number {
    if (this._duration === 0)
      return 1
    return Math.min(1, this.elapsed / this._duration)
  }

  start(): void {
    if (this._running)
      return

    this._running = true
    this._paused = false
    this._complete = false
    this._lastTick = Date.now()

    this._startInterval()
  }

  stop(): void {
    this._clearInterval()
    this._running = false
    this._paused = false
    this._remaining = this._duration
  }

  pause(): void {
    if (!this._running || this._paused)
      return

    // Save remaining time accurately
    const elapsed = Date.now() - this._lastTick
    this._remaining = Math.max(0, this._remaining - elapsed)

    this._clearInterval()
    this._paused = true
  }

  resume(): void {
    if (!this._paused)
      return

    this._paused = false
    this._lastTick = Date.now()
    this._startInterval()
  }

  reset(): void {
    this._clearInterval()
    this._running = false
    this._paused = false
    this._complete = false
    this._remaining = this._duration
  }

  onComplete(handler: () => void): () => void {
    this._completionHandlers.add(handler)
    return () => {
      this._completionHandlers.delete(handler)
    }
  }

  onTick(handler: (remaining: number) => void): () => void {
    this._tickHandlers.add(handler)
    return () => {
      this._tickHandlers.delete(handler)
    }
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private _startInterval(): void {
    this._clearInterval()

    this._intervalId = setInterval(() => {
      const now = Date.now()
      const elapsed = now - this._lastTick
      this._lastTick = now
      this._remaining = Math.max(0, this._remaining - elapsed)

      // Notify tick handlers
      for (const handler of this._tickHandlers) {
        try {
          handler(this._remaining)
        }
        catch {}
      }

      // Check for completion
      if (this._remaining <= 0) {
        this._clearInterval()
        this._running = false
        this._complete = true

        for (const handler of this._completionHandlers) {
          try {
            handler()
          }
          catch {}
        }
      }
    }, this._tickInterval)
  }

  private _clearInterval(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }
}

// ============================================================================
// Interval Implementation
// ============================================================================

class IntervalImpl implements Interval {
  private _interval: number
  private _handler: () => void
  private _immediate: boolean
  private _running = false
  private _intervalId: ReturnType<typeof setInterval> | null = null

  constructor(options: IntervalOptions) {
    this._interval = options.interval
    this._handler = options.handler
    this._immediate = options.immediate !== false

    if (this._immediate)
      this.start()
  }

  get isRunning(): boolean {
    return this._running
  }

  start(): void {
    if (this._running)
      return
    this._running = true
    this._intervalId = setInterval(() => {
      try {
        this._handler()
      }
      catch {}
    }, this._interval)
  }

  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
    this._running = false
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a countdown timer.
 */
export function createTimer(options: TimerOptions): Timer {
  return new TimerImpl(options)
}

/**
 * Create a repeating interval.
 */
export function createInterval(options: IntervalOptions): Interval {
  return new IntervalImpl(options)
}

/**
 * Create a simple delay/sleep promise.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format milliseconds as a human-readable time string.
 *
 * @example
 * ```typescript
 * formatTime(90000)   // "1:30"
 * formatTime(3661000) // "1:01:01"
 * formatTime(45000)   // "0:45"
 * ```
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Format milliseconds as a compact string for display.
 *
 * @example
 * ```typescript
 * formatCompact(90000)    // "1m 30s"
 * formatCompact(3600000)  // "1h"
 * formatCompact(7230000)  // "2h 0m"
 * ```
 */
export function formatCompact(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    if (minutes > 0)
      return `${hours}h ${minutes}m`
    return `${hours}h`
  }
  if (minutes > 0) {
    if (seconds > 0)
      return `${minutes}m ${seconds}s`
    return `${minutes}m`
  }
  return `${seconds}s`
}
