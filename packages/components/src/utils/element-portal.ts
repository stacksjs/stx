/** Move an already-bound element without changing its scope or DOM identity. */
export function portalElement(element: HTMLElement, target: HTMLElement): () => void {
  const source = element.parentNode
  const sibling = element.nextSibling
  target.appendChild(element)
  return () => {
    if (source?.isConnected) source.insertBefore(element, sibling?.parentNode === source ? sibling : null)
    else element.remove()
  }
}
