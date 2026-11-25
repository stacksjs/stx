/** Bounds work before a render allocates its script contexts and HTML. */
export interface RenderAdmissionOptions {
  /** Active page renders per server. Default: 4. Proxy and asset traffic bypasses this gate. */
  renderConcurrency?: number
  /** Waiting page requests. Default: 32; zero rejects immediately when busy. */
  renderQueueLimit?: number
  /** Maximum wait before an uncached 503. Default: 15000 ms. */
  renderQueueTimeoutMs?: number
  /**
   * Which page requests an application ranks below a person navigating.
   * Return `'background'` to lower a request; anything else leaves it as the
   * request itself asked (a prefetch is already background). It can only
   * lower: no answer here moves a request ahead of navigation.
   *
   * For traffic an application can name but cannot refuse outright, such as
   * signed-out visits to pages a crawler is told not to walk. A resolver that
   * throws or rejects leaves the request where it was, so a bug here costs
   * isolation and never a person's page. It may answer asynchronously, which
   * is what telling a real session from a cookie that only looks like one
   * takes; it is asked before the request waits for a slot, so keep it cheap.
   */
  renderPriority?: (request: Request) => RenderPriority | null | undefined | Promise<RenderPriority | null | undefined>
  /** Background renders at once. Default: half of `renderConcurrency`, at least 1. Never above it. */
  renderBackgroundConcurrency?: number
  /** Background requests waiting. Default: `renderQueueLimit` minus `renderConcurrency`. Never above the queue. */
  renderBackgroundQueueLimit?: number
  /**
   * `Retry-After`, in seconds, on a refused background request. Default: 1.
   * A busy page for a person is worth retrying at once; a crawler told the
   * same thing comes straight back.
   */
  renderBackgroundRetryAfterSeconds?: number
}

export class RenderAdmissionError extends Error {
  constructor(readonly status: 408 | 503, readonly retryAfterSeconds = 1) {
    super(status === 408 ? 'Request aborted' : 'Page rendering is busy; please retry')
    this.name = 'RenderAdmissionError'
  }
}

interface WaitingRender {
  start: () => void
  priority: RenderPriority
}

export type RenderPriority = 'foreground' | 'background'

/** A caller can lower its own priority, never take priority above navigation. */
export function renderRequestPriority(request?: Request): RenderPriority {
  const purpose = `${request?.headers.get('purpose') || ''} ${request?.headers.get('sec-purpose') || ''}`
  return purpose.toLowerCase().split(/[;,\s]+/).some(value => value === 'prefetch' || value === 'prerender')
    ? 'background'
    : 'foreground'
}

function integer(value: number | undefined, fallback: number, minimum: number): number {
  if (value === undefined)
    return fallback
  if (!Number.isSafeInteger(value) || value < minimum)
    throw new RangeError(`Render admission requires an integer >= ${minimum}`)
  return value
}

export function createRenderAdmission(options: RenderAdmissionOptions = {}) {
  const concurrency = integer(options.renderConcurrency, 4, 1)
  const queueLimit = integer(options.renderQueueLimit, 32, 0)
  const timeoutMs = integer(options.renderQueueTimeoutMs, 15_000, 1)
  // Speculation may use spare capacity, but cannot occupy every render slot
  // or every waiting place before a person opens a page.
  const backgroundConcurrency = Math.min(concurrency, integer(options.renderBackgroundConcurrency, Math.max(1, Math.floor(concurrency / 2)), 1))
  const backgroundQueueLimit = Math.min(queueLimit, integer(options.renderBackgroundQueueLimit, Math.max(0, queueLimit - concurrency), 0))
  const backgroundRetryAfter = integer(options.renderBackgroundRetryAfterSeconds, 1, 1)
  function refuse(status: 408 | 503, priority: RenderPriority): RenderAdmissionError {
    return new RenderAdmissionError(status, priority === 'background' ? backgroundRetryAfter : 1)
  }
  const waiting: WaitingRender[] = []
  let active = 0
  let activeBackground = 0

  function release(priority: RenderPriority): void {
    active--
    if (priority === 'background') activeBackground--
    // Precache work must not put a person's next page behind an entire
    // backlog. Preserve FIFO within each class and keep the same capacity.
    while (active < concurrency && waiting.length) {
      const foreground = waiting.findIndex(entry => entry.priority === 'foreground')
      if (foreground < 0 && activeBackground >= backgroundConcurrency) break
      waiting.splice(foreground < 0 ? 0 : foreground, 1)[0]?.start()
    }
  }

  async function acquire(signal: AbortSignal | undefined, priority: RenderPriority): Promise<void> {
    if (signal?.aborted)
      throw refuse(408, priority)
    if (active < concurrency && (priority === 'foreground' || activeBackground < backgroundConcurrency)) {
      active++
      if (priority === 'background') activeBackground++
      return
    }
    if (waiting.length >= queueLimit || priority === 'background' && waiting.filter(entry => entry.priority === 'background').length >= backgroundQueueLimit)
      throw refuse(503, priority)

    await new Promise<void>((resolve, reject) => {
      let settled = false
      const cleanup = () => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', abort)
      }
      const fail = (status: 408 | 503) => {
        if (settled)
          return
        settled = true
        const index = waiting.indexOf(entry)
        if (index !== -1)
          waiting.splice(index, 1)
        cleanup()
        reject(refuse(status, priority))
      }
      const abort = () => fail(408)
      const entry: WaitingRender = {
        priority,
        start() {
          if (settled)
            return
          settled = true
          cleanup()
          active++
          if (priority === 'background') activeBackground++
          resolve()
        },
      }
      const timer = setTimeout(() => fail(503), timeoutMs)
      timer.unref?.()
      waiting.push(entry)
      signal?.addEventListener('abort', abort, { once: true })
      if (signal?.aborted)
        abort()
    })
  }

  return {
    /** The class a request renders in: its own ask, lowered by the application's. */
    async priorityOf(request?: Request): Promise<RenderPriority> {
      const own = renderRequestPriority(request)
      if (own === 'background' || !request || !options.renderPriority)
        return own
      try {
        return await options.renderPriority(request) === 'background' ? 'background' : own
      }
      catch {
        return own
      }
    },
    async run<T>(start: () => Promise<T>, signal?: AbortSignal, priority: RenderPriority = 'foreground'): Promise<T> {
      await acquire(signal, priority)
      try {
        // A disconnect cannot free the slot while its script still runs.
        // Doing so would let disconnected clients create unbounded work.
        if (signal?.aborted)
          throw new RenderAdmissionError(408)
        return await start()
      }
      finally {
        release(priority)
      }
    },
  }
}
