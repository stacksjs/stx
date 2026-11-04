interface ObservableBrowser {
  cdp: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  addEventListener: (type: string, listener: (event: Event) => void) => void
  removeEventListener: (type: string, listener: (event: Event) => void) => void
}

/**
 * Retain Chrome's disconnect reason even when it dies between operations.
 * Bun otherwise replaces that reason with "view is closed" on the next read.
 *
 * This reserves the view's single pending cdp() slot until teardown. Use only
 * with a dedicated Chrome fixture that does not issue other cdp() commands.
 * Dispose before the fixture's normal close; never reopen or retry a view.
 * Keep it opt-in: an outstanding request can affect the view's GC/liveness,
 * so a diagnostic pass does not qualify the original unobserved execution.
 */
export async function observeBrowserLifecycle(
  view: ObservableBrowser,
  label: string,
  report: (message: string) => void = message => console.error(message),
): Promise<{ dispose: () => void, settled: Promise<void> }> {
  let disposed = false
  const emit = (reason: string) => {
    if (!disposed) report(`[browser lifecycle] ${label}: ${reason}`)
  }
  const onEvent = (event: Event) => {
    const data = (event as Event & { data?: unknown }).data
    emit(`${event.type}: ${JSON.stringify(data)}`)
  }
  const events = ['Inspector.targetCrashed', 'Inspector.detached']
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const event of events) view.removeEventListener(event, onEvent)
  }
  for (const event of events) view.addEventListener(event, onEvent)
  try {
    await view.cdp('Inspector.enable')
    // Keep the promise reachable in the page, so GC cannot settle the probe
    // with "Promise was collected" instead of a native lifecycle failure.
    const settled = view.cdp('Runtime.evaluate', {
      expression: "globalThis[Symbol.for('stx.test.browser-lifecycle')] = new Promise(() => {})",
      awaitPromise: true,
    }).then(() => emit('Lifecycle probe unexpectedly settled'), error => emit(error instanceof Error ? error.stack ?? String(error) : String(error)))
    return { dispose, settled }
  }
  catch (error) {
    dispose()
    throw error
  }
}
