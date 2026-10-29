/** Bounds work before a render allocates its script contexts and HTML. */
export interface RenderAdmissionOptions {
  /** Active page renders per server. Default: 4. Proxy and asset traffic bypasses this gate. */
  renderConcurrency?: number
  /** Waiting page requests. Default: 32; zero rejects immediately when busy. */
  renderQueueLimit?: number
  /** Maximum wait before an uncached 503. Default: 15000 ms. */
  renderQueueTimeoutMs?: number
}

export class RenderAdmissionError extends Error {
  constructor(readonly status: 408 | 503) {
    super(status === 408 ? 'Request aborted' : 'Page rendering is busy; please retry')
    this.name = 'RenderAdmissionError'
  }
}

interface WaitingRender {
  start: () => void
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
  const waiting: WaitingRender[] = []
  let active = 0

  function release(): void {
    active--
    waiting.shift()?.start()
  }

  async function acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted)
      throw new RenderAdmissionError(408)
    if (active < concurrency) {
      active++
      return
    }
    if (waiting.length >= queueLimit)
      throw new RenderAdmissionError(503)

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
        reject(new RenderAdmissionError(status))
      }
      const abort = () => fail(408)
      const entry: WaitingRender = {
        start() {
          if (settled)
            return
          settled = true
          cleanup()
          active++
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
    async run<T>(start: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      await acquire(signal)
      try {
        // A disconnect cannot free the slot while its script still runs.
        // Doing so would let disconnected clients create unbounded work.
        if (signal?.aborted)
          throw new RenderAdmissionError(408)
        return await start()
      }
      finally {
        release()
      }
    },
  }
}
