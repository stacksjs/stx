import type { Signal } from '../signals-api'
import { onDestroy, state } from '../signals-api'

type ScrollLockTarget =
  | HTMLElement
  | null
  | undefined
  | { current?: HTMLElement | null, value?: HTMLElement | null }
  | (() => HTMLElement | null | undefined)

interface ScrollLockState {
  count: number
  overflow: string
}

const scrollLockStates = new WeakMap<HTMLElement, ScrollLockState>()

function resolveTarget(target?: ScrollLockTarget): HTMLElement | null {
  let value = target
  if (typeof value === 'function')
    value = value()
  if (value && typeof value === 'object' && 'current' in value)
    value = value.current
  if (value && typeof value === 'object' && !('nodeType' in value) && 'value' in value)
    value = value.value
  return (value as HTMLElement | null | undefined) || document.body || document.documentElement
}

function acquire(element: HTMLElement): void {
  const existing = scrollLockStates.get(element)
  if (existing) {
    existing.count += 1
    return
  }
  scrollLockStates.set(element, { count: 1, overflow: element.style.overflow })
  element.style.overflow = 'hidden'
}

function release(element: HTMLElement): void {
  const existing = scrollLockStates.get(element)
  if (!existing)
    return
  existing.count -= 1
  if (existing.count > 0)
    return
  element.style.overflow = existing.overflow
  scrollLockStates.delete(element)
}

/**
 * Reactively lock scrolling on an element, defaulting to the document body.
 *
 * Multiple locks on the same element are reference counted, so releasing one
 * overlay cannot restore scrolling while another overlay is still open.
 */
export function useScrollLock(target?: ScrollLockTarget): Signal<boolean> {
  const locked = state(false)
  let lockedElement: HTMLElement | null = null
  const unsubscribe = locked.subscribe((value) => {
    if (value) {
      if (lockedElement)
        return
      lockedElement = resolveTarget(target)
      if (lockedElement)
        acquire(lockedElement)
    }
    else if (lockedElement) {
      release(lockedElement)
      lockedElement = null
    }
  })

  onDestroy(() => {
    unsubscribe()
    if (lockedElement) {
      release(lockedElement)
      lockedElement = null
    }
  })

  return locked
}
