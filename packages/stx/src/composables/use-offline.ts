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
