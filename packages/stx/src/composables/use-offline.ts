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

/**
 * cacheMedia - keep videos (or audio) on the device so they play offline
 *
 * Asks the app's offline worker to download each URL whole and answer it
 * from the device from then on, seeking (Range requests) included. Already
 * kept files are not fetched again; past the worker's `mediaMaxBytes` the
 * oldest others are dropped. Resolves with the URLs kept, or [] where there is
 * no offline worker (offline not enabled, or a browser without one).
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
    const channel = new MessageChannel()
    const answer = new Promise<string[]>((resolve) => {
      channel.port1.onmessage = event => resolve(Array.isArray(event.data?.kept) ? event.data.kept : [])
    })
    worker.postMessage({ type: 'stx:cache-media', urls: wanted.map(url => new URL(url, location.href).toString()) }, [channel.port2])
    return await answer
  }
  catch {
    return []
  }
}
