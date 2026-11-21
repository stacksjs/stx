/** @internal Link caller cancellation to an owned request and clean up both listeners. */
export function linkRequestAbort(
  controller: AbortController | null,
  upstream: AbortSignal | null | undefined,
  onAbort: () => void,
): () => void {
  const signal = controller?.signal ?? upstream
  function forward() { controller?.abort(upstream?.reason) }
  function unlink() {
    if (controller) upstream?.removeEventListener('abort', forward)
    signal?.removeEventListener('abort', canceled)
  }
  function canceled() {
    unlink()
    onAbort()
  }

  if (signal?.aborted) canceled()
  else {
    signal?.addEventListener('abort', canceled, { once: true })
    if (controller) {
      if (upstream?.aborted) forward()
      else upstream?.addEventListener('abort', forward, { once: true })
    }
  }
  return unlink
}
