/**
 * What the page renderer has been doing, said in the server's log.
 *
 * Admission bounds renders but kept no count of them, so a renderer refusing
 * every page and one rendering every page slowly looked the same from outside:
 * the only way to tell was to retry until a request got a slot and time it.
 * Two lines answer that instead. A render slower than `slowMs` is named as it
 * finishes, with how long it waited and how long it ran, and once an interval
 * with traffic in it, one line totals renders, wait, run time and refusals by
 * class. A quiet interval prints nothing.
 *
 * Paths are logged without their query string, which is where a token or an
 * address someone typed would be.
 */
import type { RenderPriority } from './render-admission'

export interface RenderReportOptions {
  /** Name every render that ran longer than this, in milliseconds. Unset: none are named. */
  slowMs?: number
  /** Total the renderer's work once this often, in milliseconds. Unset: no summary. */
  intervalMs?: number
  /** Where the lines go. Default: `console.warn`, which is what a service's journal keeps. */
  log?: (line: string) => void
}

export type RenderOutcome = 'rendered' | 'failed' | 'refused' | 'expired' | 'aborted'

export interface RenderRecord {
  label: string
  priority: RenderPriority
  outcome: RenderOutcome
  waitedMs: number
  ranMs: number
}

interface ClassTotals {
  rendered: number
  failed: number
  refused: number
  expired: number
  aborted: number
  ran: number[]
  waitedMax: number
  slowest: { label: string, ms: number } | null
}

function emptyTotals(): ClassTotals {
  return { rendered: 0, failed: 0, refused: 0, expired: 0, aborted: 0, ran: [], waitedMax: 0, slowest: null }
}

/** The value below which `fraction` of the samples fall. */
export function percentile(samples: readonly number[], fraction: number): number {
  if (samples.length === 0)
    return 0
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)]!
}

/** A request's path, without the query string. */
export function renderLabel(request?: Request): string {
  if (!request)
    return '(no request)'
  try {
    return new URL(request.url).pathname
  }
  catch {
    return '(unparseable url)'
  }
}

export function createRenderReport(options: RenderReportOptions = {}) {
  const log = options.log ?? ((line: string) => console.warn(line))
  const slowMs = options.slowMs
  let totals: Record<RenderPriority, ClassTotals> = { foreground: emptyTotals(), background: emptyTotals() }
  let timer: ReturnType<typeof setInterval> | undefined

  function describe(priority: RenderPriority, t: ClassTotals): string | null {
    const count = t.rendered + t.failed + t.refused + t.expired + t.aborted
    if (count === 0)
      return null
    const parts = [`${t.rendered} rendered`]
    if (t.failed) parts.push(`${t.failed} failed`)
    if (t.refused) parts.push(`${t.refused} refused`)
    if (t.expired) parts.push(`${t.expired} expired waiting`)
    if (t.aborted) parts.push(`${t.aborted} abandoned`)
    if (t.ran.length)
      parts.push(`run p50 ${Math.round(percentile(t.ran, 0.5))}ms p95 ${Math.round(percentile(t.ran, 0.95))}ms`)
    if (t.waitedMax > 0)
      parts.push(`longest wait ${Math.round(t.waitedMax)}ms`)
    if (t.slowest)
      parts.push(`slowest ${t.slowest.label} ${Math.round(t.slowest.ms)}ms`)
    return `${priority}: ${parts.join(', ')}`
  }

  /** The summary line for the interval so far, and a fresh interval. Null when there was no traffic. */
  function flush(): string | null {
    const lines = (['foreground', 'background'] as const)
      .map(priority => describe(priority, totals[priority]))
      .filter((line): line is string => line !== null)
    totals = { foreground: emptyTotals(), background: emptyTotals() }
    return lines.length ? `[stx] renders: ${lines.join('; ')}` : null
  }

  if (options.intervalMs !== undefined) {
    if (!Number.isSafeInteger(options.intervalMs) || options.intervalMs < 1000)
      throw new RangeError('A render report interval is a whole number of milliseconds, at least 1000')
    timer = setInterval(() => {
      const line = flush()
      if (line)
        log(line)
    }, options.intervalMs)
    timer.unref?.()
  }

  return {
    record(entry: RenderRecord): void {
      const t = totals[entry.priority]
      t[entry.outcome]++
      t.waitedMax = Math.max(t.waitedMax, entry.waitedMs)
      if (entry.outcome === 'rendered' || entry.outcome === 'failed') {
        t.ran.push(entry.ranMs)
        if (!t.slowest || entry.ranMs > t.slowest.ms)
          t.slowest = { label: entry.label, ms: entry.ranMs }
        if (slowMs !== undefined && entry.ranMs >= slowMs)
          log(`[stx] slow render ${Math.round(entry.ranMs)}ms ${entry.label} (${entry.priority}, waited ${Math.round(entry.waitedMs)}ms${entry.outcome === 'failed' ? ', failed' : ''})`)
      }
    },
    flush,
    stop(): void {
      if (timer)
        clearInterval(timer)
    },
  }
}
