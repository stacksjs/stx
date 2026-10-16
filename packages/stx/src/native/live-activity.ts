/** ActivityKit presentation data. Times are Unix epoch milliseconds. */
export interface NativeLiveActivityState {
  status?: string
  staleStatus?: string
  detail?: string
  distanceMeters?: number
  showsDistance?: boolean
  heartRate?: number | null
  durationSeconds?: number
  remainingSeconds?: number | null
  progress?: number
  timerStartedAt?: number | null
  timerEndsAt?: number | null
  paused?: boolean
  staleAt?: number | null
}

export interface NativeLiveActivityOptions extends NativeLiveActivityState {
  /** Stable application identifier; starting it again reattaches to the activity. */
  activityId: string
  title: string
  symbol?: string
  deepLink?: string
  tint?: string
}

export interface NativeLiveActivities {
  isAvailable: () => Promise<boolean>
  list: () => Promise<Array<{ id: string, activityId: string, title: string }>>
  start: (options: NativeLiveActivityOptions) => Promise<{ id: string }>
  update: (id: string, state: NativeLiveActivityState) => Promise<unknown>
  end: (id: string, state?: NativeLiveActivityState) => Promise<unknown>
}

export interface NativeLiveActivityController {
  update: (next: NativeLiveActivityOptions | null) => Promise<void>
  end: () => Promise<void>
}

/**
 * One declarative activity. Updates serialize and coalesce while native work is
 * pending. A stop or replacement during start waits for its id, then ends that
 * exact activity. Disposing a screen need not end a session running off-screen.
 */
export function createLiveActivity(bridge: NativeLiveActivities | null | undefined, onError?: (error: unknown) => void): NativeLiveActivityController {
  let desired: NativeLiveActivityOptions | null = null
  let desiredJSON = 'null'
  let revision = 0
  let applied = 0
  let current: { id: string, activityId: string } | null = null
  let shown = ''
  let pending: Promise<void> | null = null

  async function drain() {
    while (applied !== revision) {
      const mine = revision
      const next = desired
      const json = desiredJSON
      try {
        if (current && current.activityId !== next?.activityId) {
          await bridge!.end(current.id)
          current = null
          shown = ''
        }
        if (next && !current) {
          if (await bridge!.isAvailable()) {
            const result = await bridge!.start(next)
            if (!result?.id) throw new Error('Live Activities returned no activity id')
            current = { id: result.id, activityId: next.activityId }
            shown = json
          }
        }
        else if (next && current && json !== shown) {
          await bridge!.update(current.id, next)
          shown = json
        }
      }
      catch (error) {
        onError?.(error)
      }
      applied = mine
    }
  }

  function update(next: NativeLiveActivityOptions | null): Promise<void> {
    if (!bridge) return Promise.resolve()
    const json = JSON.stringify(next)
    if (json !== desiredJSON) {
      desiredJSON = json
      desired = next ? JSON.parse(json) : null
      revision++
    }
    if (!pending && applied !== revision)
      pending = drain().finally(() => {
        pending = null
        // A native callback can queue a new state after drain's last loop,
        // before this finalizer runs. Deliver it before resolving callers.
        if (applied !== revision) return update(desired)
      })
    return pending ?? Promise.resolve()
  }

  return { update, end: () => update(null) }
}
