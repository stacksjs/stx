/**
 * The slowest frame of the last second, in milliseconds.
 *
 * What "typing smoothly" means, measured where it is felt: a keystroke that
 * takes too long shows up as one long gap between two frames. Sixteen is a
 * frame at sixty a second; a number that stays near it while a key is held
 * down is an editor that is keeping up.
 */
export function createFrameMeter(report: (slowest: number) => void): { stop: () => void } {
  let previous = performance.now()
  let slowest = 0
  let windowStart = previous
  let frame = 0

  const tick = (now: number): void => {
    slowest = Math.max(slowest, now - previous)
    previous = now

    if (now - windowStart >= 1000) {
      report(Math.round(slowest))
      slowest = 0
      windowStart = now
    }

    frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)

  return { stop: () => cancelAnimationFrame(frame) }
}
