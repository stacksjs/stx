export interface AnimationFrameOptions {
  /** Start immediately. Defaults to true. */
  immediate?: boolean
  /** Maximum delta in milliseconds. Defaults to 100, preventing catch-up after suspension. */
  maxDelta?: number
}

export interface AnimationFrameControls {
  readonly active: boolean
  resume: () => void
  pause: () => void
  stop: () => void
}

/** A paint-synchronized clock for canvas, simulations and visualizers. Delta is milliseconds.
 * Hidden documents suspend work and resume with a zero delta. stop permanently disposes it.
 * SSR returns inert controls. STX registers cleanup with the owning component when available.
 */
export function useAnimationFrame(callback: (delta: number, timestamp: number) => void, options: AnimationFrameOptions = {}): AnimationFrameControls {
  const maxDelta = options.maxDelta ?? 100
  if (!Number.isFinite(maxDelta) || maxDelta <= 0) throw new RangeError('maxDelta must be positive and finite')
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function')
    return { active: false, resume() {}, pause() {}, stop() {} }

  let wanted = false
  let disposed = false
  let frame: number | null = null
  let previous: number | null = null
  let generation = 0
  const cancel = (): void => {
    generation++
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    previous = null
  }
  const schedule = (): void => {
    if (!wanted || disposed || document.hidden || frame !== null) return
    const revision = generation
    frame = requestAnimationFrame((now) => {
      frame = null
      const delta = previous === null ? 0 : Math.max(0, Math.min(maxDelta, now - previous))
      previous = now
      try { callback(delta, now) }
      catch (error) { controls.pause(); throw error }
      if (generation === revision) schedule()
    })
  }
  const visibility = (): void => { cancel(); schedule() }
  const controls: AnimationFrameControls = {
    get active() { return wanted && !disposed },
    resume() { if (disposed || wanted) return; wanted = true; schedule() },
    pause() { wanted = false; cancel() },
    stop() { if (disposed) return; disposed = true; wanted = false; cancel(); document.removeEventListener('visibilitychange', visibility) },
  }
  document.addEventListener('visibilitychange', visibility)
  const lifecycle = globalThis as typeof globalThis & { onDestroy?: (cleanup: () => void) => void }
  lifecycle.onDestroy?.(controls.stop)
  if (options.immediate !== false) controls.resume()
  return controls
}
