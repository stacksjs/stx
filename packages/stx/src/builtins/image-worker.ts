/**
 * Runs the image pass on a worker thread.
 *
 * Decoding and encoding (AVIF, WebP, thumbhash) is pure TypeScript and fully
 * synchronous per image. On the thread that also answers requests, a cold pass
 * over a photo-heavy `public/` held the event loop for most of its minutes:
 * every `await` a render made queued behind the next encode, so a first page
 * took 14-18s and a proxy in front of the server saw empty responses. On a
 * worker the same code runs to the same results, and the serving thread only
 * receives the finished catalog.
 *
 * The worker is the mechanism, not a requirement. Where one cannot start (no
 * `Worker` in the runtime, or the entry file missing because stx was bundled
 * into something else), {@link runImageTask} reports that and the caller runs
 * the pass in-thread exactly as before.
 *
 * @module builtins/image-worker
 */

import fs from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

/** Tasks the worker entry knows how to run. */
export type ImageTask = 'delivery' | 'placeholders'

/** Returned instead of a result when no worker could be started. */
export const WORKER_UNAVAILABLE: unique symbol = Symbol('stx.image-worker.unavailable')

/**
 * How many image workers may run at once.
 *
 * Serving needs a core of its own, so on a two-core box the placeholder and
 * delivery passes take turns in one worker instead of claiming both cores.
 * Two at most: the passes are the only callers, and a third would have
 * nothing to do.
 */
export function imageWorkerSlots(cores = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length): number {
  return Math.max(1, Math.min(2, cores - 1))
}

let active = 0
const waiting: Array<() => void> = []

async function acquire(): Promise<void> {
  if (active < imageWorkerSlots()) {
    active++
    return
  }
  await new Promise<void>(resolve => waiting.push(resolve))
  active++
}

function release(): void {
  active--
  waiting.shift()?.()
}

/**
 * The worker entry beside this module: `.ts` when running from source, `.js`
 * from the published `dist/`, which mirrors `src/` file for file.
 */
function workerEntry(): URL | undefined {
  const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js'
  const url = new URL(`./image-warmup-worker.${extension}`, import.meta.url)
  try {
    return url.protocol === 'file:' && fs.existsSync(fileURLToPath(url)) ? url : undefined
  }
  catch {
    return undefined
  }
}

interface WorkerReply {
  type: 'ready' | 'result' | 'error'
  value?: unknown
  error?: { name?: string, message: string, stack?: string }
}

/**
 * Run `task` with `args` on a worker thread and resolve with what it posts
 * back, or with {@link WORKER_UNAVAILABLE} when no worker could be started.
 *
 * A failure inside the task rejects, as the in-thread call would have thrown.
 * Only a worker that never became ready counts as unavailable, so a crash
 * mid-pass is never silently re-run on the serving thread.
 */
export async function runImageTask<T>(task: ImageTask, args: unknown): Promise<T | typeof WORKER_UNAVAILABLE> {
  if (typeof Worker === 'undefined')
    return WORKER_UNAVAILABLE
  const entry = workerEntry()
  if (!entry)
    return WORKER_UNAVAILABLE

  await acquire()
  try {
    return await new Promise<T | typeof WORKER_UNAVAILABLE>((resolve, reject) => {
      let worker: Worker
      try {
        worker = new Worker(entry)
      }
      catch {
        resolve(WORKER_UNAVAILABLE)
        return
      }

      let ready = false
      let settled = false
      const finish = (settle: () => void) => {
        if (settled)
          return
        settled = true
        settle()
        worker.terminate()
      }

      worker.addEventListener('message', (event: MessageEvent<WorkerReply>) => {
        const reply = event.data
        if (reply.type === 'ready') {
          ready = true
          worker.postMessage({ task, args })
          return
        }
        if (reply.type === 'result') {
          finish(() => resolve(reply.value as T))
          return
        }
        const error = new Error(reply.error?.message ?? 'image worker failed')
        if (reply.error?.name)
          error.name = reply.error.name
        if (reply.error?.stack)
          error.stack = reply.error.stack
        finish(() => reject(error))
      })
      worker.addEventListener('error', (event: ErrorEvent) => {
        finish(() => ready
          ? reject(event.error instanceof Error ? event.error : new Error(event.message || 'image worker crashed'))
          : resolve(WORKER_UNAVAILABLE))
      })
      worker.addEventListener('close', () => {
        finish(() => ready
          ? reject(new Error('image worker exited before it finished'))
          : resolve(WORKER_UNAVAILABLE))
      })
    })
  }
  finally {
    release()
  }
}
