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
 * entry file beside a bundled copy and no installed one to fall back on, or a
 * worker that dies before it is ready), {@link runImageTask} reports that, the
 * caller runs the pass in-thread exactly as before, and one warning says why.
 *
 * The thread comes from `node:worker_threads`, never the global `Worker`. The
 * global is whatever the app left on `globalThis`, and a Stacks app's preloader
 * copies `@stacksjs/queue`'s exports there, including a queue `Worker` class.
 * `new Worker(entry)` then built a queue worker, the first `addEventListener`
 * threw, and the pass failed before a single image was touched. A module
 * import cannot be replaced that way. In Bun both constructors start the same
 * thread with the same structured clone, so the results are unchanged.
 *
 * @module builtins/image-worker
 */

import fs from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker as ThreadWorker } from 'node:worker_threads'

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

/** How the installed package exposes the worker entry (its `./*` export). */
const INSTALLED_WORKER_ENTRY = '@stacksjs/stx/builtins/image-warmup-worker'

/**
 * The worker entry to start.
 *
 * Beside this module when stx runs as published or from source: `.ts` from
 * `src/`, `.js` from `dist/`, which mirrors `src/` file for file.
 *
 * Otherwise stx has been bundled into the app's server. A Stacks deploy
 * builds `storage/framework/runtime/production/serve.js` with every
 * dependency inlined, and Bun's bundler does not follow a `new Worker(new
 * URL(...))`, so nothing sits beside the chunk this code landed in. The same
 * install the bundle was built from is still on disk, though, so the entry is
 * resolved from the app's root.
 */
export function imageWorkerEntry(root = process.cwd()): string | undefined {
  const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js'
  try {
    const sibling = new URL(`./image-warmup-worker.${extension}`, import.meta.url)
    if (sibling.protocol === 'file:' && fs.existsSync(fileURLToPath(sibling)))
      return fileURLToPath(sibling)
  }
  catch {}
  try {
    const resolved = typeof Bun !== 'undefined' ? Bun.resolveSync(INSTALLED_WORKER_ENTRY, root) : undefined
    return resolved && isInstalledEntry(resolved) ? resolved : undefined
  }
  catch {
    return undefined
  }
}

/**
 * Whether a resolved entry is the app's own install rather than a copy in
 * Bun's global package cache.
 *
 * With no `node_modules` to look in, Bun's resolver falls back to
 * auto-install and answers with a copy in `~/.bun/install/cache` - whatever
 * version of stx happens to be there, not the one the server was built from,
 * and without its dependencies installed. A worker started from it dies
 * before it is ready (`Cannot find package 'ts-images'`), after the server
 * has already waited on it. Having no entry is the honest answer there, and
 * the pass runs on the serving thread with a warning that says so.
 *
 * Refuses the cache rather than requiring `node_modules` in the path: Bun
 * resolves symlinks, so a linked install (a workspace, `bun link`) answers
 * with its real path, which need not contain `node_modules` at all.
 */
export function isInstalledEntry(path: string, env: Record<string, string | undefined> = process.env): boolean {
  const normalized = path.replace(/\\/g, '/')
  // Cache entries are named `<name>@<version>@@@<n>` (with the registry host
  // between the @@ when it is not the default one).
  if (normalized.split('/').some(segment => /@\d[^/]*@@@\d+$/.test(segment)))
    return false
  const caches = [
    env.BUN_INSTALL_CACHE_DIR,
    join(env.BUN_INSTALL || join(os.homedir(), '.bun'), 'install', 'cache'),
  ].filter((dir): dir is string => !!dir).map(dir => `${dir.replace(/\\/g, '/').replace(/\/$/, '')}/`)
  return !caches.some(cache => normalized.startsWith(cache))
}

interface WorkerReply {
  type: 'ready' | 'result' | 'error'
  value?: unknown
  error?: { name?: string, message: string, stack?: string }
}

let warnedUnavailable = false

/**
 * Say, once per process, that the pass is back on the serving thread and why.
 *
 * The fallback keeps the results right but costs the serving thread the whole
 * pass, which is what the worker exists to avoid; a deploy that silently lost
 * it would only show up as slow first pages.
 */
function unavailable(reason: string): typeof WORKER_UNAVAILABLE {
  if (!warnedUnavailable) {
    warnedUnavailable = true
    console.warn(
      `[stx] image worker unavailable (${reason}); running the image pass on the serving thread instead. `
      + `Results are the same, but requests may stall while it runs.`,
    )
  }
  return WORKER_UNAVAILABLE
}

/** Forget that the fallback warning was printed. For tests. */
export function resetImageWorkerWarning(): void {
  warnedUnavailable = false
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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
  if (typeof ThreadWorker !== 'function')
    return unavailable('node:worker_threads has no Worker in this runtime')
  const entry = imageWorkerEntry()
  if (!entry)
    return unavailable('no image-warmup-worker entry beside this module or in the installed @stacksjs/stx')

  await acquire()
  try {
    return await new Promise<T | typeof WORKER_UNAVAILABLE>((resolve, reject) => {
      let worker: ThreadWorker
      try {
        worker = new ThreadWorker(entry)
      }
      catch (error) {
        resolve(unavailable(`could not start ${entry}: ${messageOf(error)}`))
        return
      }

      let ready = false
      let settled = false
      const finish = (settle: () => void) => {
        if (settled)
          return
        settled = true
        settle()
        void worker.terminate()
      }

      worker.on('message', (reply: WorkerReply) => {
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
      worker.on('error', (error: unknown) => {
        finish(() => ready
          ? reject(error instanceof Error ? error : new Error(messageOf(error) || 'image worker crashed'))
          : resolve(unavailable(`the worker failed before it was ready: ${messageOf(error)}`)))
      })
      worker.on('exit', (code: number) => {
        finish(() => ready
          ? reject(new Error('image worker exited before it finished'))
          : resolve(unavailable(`the worker exited with code ${code} before it was ready`)))
      })
    })
  }
  finally {
    release()
  }
}
