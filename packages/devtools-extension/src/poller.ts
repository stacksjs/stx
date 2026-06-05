/**
 * A start/stop interval poller (stacksjs/stx#1747) — drives the panel's live
 * refresh. The timer functions are injectable so it's unit-testable without
 * real time (and works the same against `window.setInterval`).
 */
export interface PollerDeps {
  /** Called on each tick. May be async; rejections are swallowed (best-effort). */
  tick: () => void | Promise<void>
  intervalMs: number
  // eslint-disable-next-line ts/no-explicit-any
  setInterval?: (fn: () => void, ms: number) => any
  // eslint-disable-next-line ts/no-explicit-any
  clearInterval?: (id: any) => void
}

export interface Poller {
  start: () => void
  stop: () => void
  running: () => boolean
}

export function createPoller(deps: PollerDeps): Poller {
  const set = deps.setInterval || setInterval
  const clear = deps.clearInterval || clearInterval
  // eslint-disable-next-line ts/no-explicit-any
  let id: any = null

  return {
    start() {
      if (id !== null)
        return // already running — idempotent
      id = set(() => { void deps.tick() }, deps.intervalMs)
    },
    stop() {
      if (id === null)
        return
      clear(id)
      id = null
    },
    running() {
      return id !== null
    },
  }
}
