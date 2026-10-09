/**
 * clearOfflineData - forget what the offline worker kept for the signed-in person
 *
 * The app's offline worker keeps API answers per signed-in token so the app
 * opens without a network (see the `offline` option of `serve`). Signing out
 * must take them with it: call this from the sign-out path. Screens and the
 * build's files stay cached; they hold nobody's data.
 */
export async function clearOfflineData(): Promise<void> {
  try {
    if (typeof caches !== 'undefined')
      await caches.delete('stx-data')
  }
  catch {}
  try {
    const controller = typeof navigator !== 'undefined' ? navigator.serviceWorker?.controller : null
    controller?.postMessage({ type: 'stx:clear-offline-data' })
  }
  catch {}
}

/** The cache media is kept in, shared with the offline worker, which answers from it. */
const MEDIA_CACHE = 'stx-media'

/**
 * Download what is not kept yet into the media cache, one at a time, each
 * streamed to the device rather than held in memory.
 *
 * Done here, by the open page, rather than by the worker: iOS gives a
 * service worker little time to finish what a message started, and a coach's
 * long upload outlasted it, so videos were never kept. A page that is open
 * has as long as it is open. A download cut short stores nothing, so the
 * next call starts it again.
 */
async function downloadMedia(urls: string[]): Promise<void> {
  if (typeof caches === 'undefined' || typeof fetch === 'undefined')
    return
  const cache = await caches.open(MEDIA_CACHE)
  for (const url of urls) {
    try {
      if (await cache.match(url))
        continue
      const response = await fetch(url, { credentials: 'same-origin' })
      if (response.status !== 200 || !response.body)
        continue
      await cache.put(url, new Response(response.body, {
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream', 'Accept-Ranges': 'bytes' },
      }))
    }
    catch {
      // No network, or no room: the next call tries again.
    }
  }
}

/**
 * cacheMedia - keep videos (or audio) on the device so they play offline
 *
 * Downloads each URL whole, streamed to the device, and from then on the
 * app's offline worker answers it from there, seeking (Range requests)
 * included. Already kept files are not fetched again; past the worker's
 * `mediaMaxBytes` the oldest others are dropped. Resolves with the URLs kept,
 * or [] where there is no offline worker (offline not enabled, or a web view
 * without one: on iOS an app's web view gets one only for app-bound domains).
 *
 * Same-origin media only: a video another site serves (an embedded player)
 * is that site's to deliver.
 */
export async function cacheMedia(urls: string[]): Promise<string[]> {
  const wanted = [...new Set((urls || []).filter(url => typeof url === 'string' && url))]
  if (!wanted.length || typeof navigator === 'undefined' || !navigator.serviceWorker)
    return []
  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
    ])
    const worker = registration && (registration.active || navigator.serviceWorker.controller)
    if (!worker || typeof MessageChannel === 'undefined')
      return []
    const absolute = wanted.map(url => new URL(url, location.href).toString())
    await downloadMedia(absolute)
    const channel = new MessageChannel()
    const answer = new Promise<string[]>((resolve) => {
      channel.port1.onmessage = event => resolve(Array.isArray(event.data?.kept) ? event.data.kept : [])
    })
    worker.postMessage({ type: 'stx:cache-media', urls: absolute }, [channel.port2])
    return await answer
  }
  catch {
    return []
  }
}

interface OfflineRuntime {
  updateReady: boolean
  onUpdateReady: (callback: () => void) => () => void
  applyUpdate: () => boolean
}

function offlineRuntime(): OfflineRuntime | null {
  return typeof window !== 'undefined' ? ((window as any).stxOffline as OfflineRuntime | undefined) ?? null : null
}

/**
 * onOfflineUpdateReady - hear that a new build of the app is installed and waiting
 *
 * The offline worker of a new deploy installs beside the running one and
 * waits, so nobody's screen changes under them mid-task. It takes over by
 * itself when no page of the app is on screen or the app starts cold. An app
 * that wants it sooner can offer "Update" here and call `applyOfflineUpdate()`;
 * one that is happy with the quiet default need not do anything.
 *
 * Runs at once when a build is already waiting. Returns an unsubscribe.
 */
export function onOfflineUpdateReady(callback: () => void): () => void {
  const runtime = offlineRuntime()
  if (runtime)
    return runtime.onUpdateReady(callback)
  if (typeof window === 'undefined')
    return () => {}
  // The register tag has not run (offline off, or a page without it): the
  // window event is the only way to hear of one.
  const listener = (): void => callback()
  window.addEventListener('stx:offline-update-ready', listener)
  return () => window.removeEventListener('stx:offline-update-ready', listener)
}

/**
 * applyOfflineUpdate - let the waiting build take over now, and reload into it
 *
 * Returns false when there is no build waiting (nothing to do).
 */
export function applyOfflineUpdate(): boolean {
  const runtime = offlineRuntime()
  return runtime ? runtime.applyUpdate() : false
}
