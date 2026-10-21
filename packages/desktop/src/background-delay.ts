import { hasBridge, requireBridge } from './_bridge'

export interface BackgroundDelayOptions {
  signal?: AbortSignal
}

/**
 * Wait without hidden-page timer throttling in a native Craft application.
 * macOS deadlines run on the native main loop and release their activity on
 * completion, cancellation, navigation, or window destruction. Ordinary web
 * pages use their browser's timer behavior.
 */
export function backgroundDelay(delayMs: number, options: BackgroundDelayOptions = {}): Promise<void> {
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 86_400_000)
    return Promise.reject(new RangeError('delayMs must be an integer between 0 and 86400000'))
  const { signal } = options
  const aborted = (): DOMException => new DOMException('Background delay aborted', 'AbortError')
  if (signal?.aborted) return Promise.reject(aborted())
  if (hasBridge('timers')) {
    return requireBridge<{ sleep: (ms: number, options: BackgroundDelayOptions) => Promise<void> }>('timers').sleep(delayMs, options)
  }
  if (typeof window !== 'undefined' && window.craft)
    return Promise.reject(new Error('Native background deadlines require a Craft runtime with timers.sleep support'))
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel)
      resolve()
    }, delayMs)
    function cancel(): void {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      reject(aborted())
    }
    signal?.addEventListener('abort', cancel, { once: true })
  })
}
