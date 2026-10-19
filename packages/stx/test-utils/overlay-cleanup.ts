/**
 * Retire overlays before replacing a generated runtime on the shared test DOM.
 * Clearing body.innerHTML alone leaves its document-level Escape listener and
 * scroll lock alive, even after window.stx points at the next runtime.
 */
export function closeTestOverlays(runtimeWindow: {
  stx?: { overlays?: { list: () => string[], close: (id: string) => void } }
}): void {
  const overlays = runtimeWindow.stx?.overlays
  if (!overlays) return
  for (const id of overlays.list().reverse())
    overlays.close(id)
}
