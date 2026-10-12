/**
 * useBreathPacer - play a guided breathing pattern, step by step
 *
 * A breathing exercise is a list of timed steps: breathe in, hold, breathe
 * out, hold empty, natural breathing between rounds, an open hold that ends
 * when the person needs to breathe. This module answers the questions every
 * breathing screen asks of such a list (where are we, how full is the pacer,
 * how long is left) and plays one: start, pause, resume, ±seek, end an open
 * hold now, and a callback as each step begins (for a spoken cue, a haptic
 * tap or a tone).
 *
 * The timing is the page's own clock (`performance.now`), so a paused pacer
 * never counts the pause, and a page that moves the clock in a test moves the
 * pacer with it. Pure helpers (`positionAt`, `pacerScale`, …) work on the
 * server too.
 *
 * @example
 * ```ts
 * const pacer = useBreathPacer(steps, { onStep: (step) => speak(step.kind) })
 * pacer.start()
 * // each frame: const at = pacer.tick(); orb.style.transform = `scale(${pacerScale(at)})`
 * ```
 */

/**
 * What one moment of an exercise asks for.
 *
 * in / out      a paced breath, the pacer growing or shrinking
 * hold          lungs comfortably full
 * pause         lungs comfortably empty
 * breathe       natural, unpaced breathing
 * sniff         a short top-up inhale (the second half of a physiological sigh)
 * hum           a slow exhale, humming
 * pulse         a short, sharp exhale with a passive inhale
 * retention     an empty-lung hold after power breathing
 * recover       one full breath in, held
 */
export type BreathStepKind = 'in' | 'out' | 'hold' | 'pause' | 'breathe' | 'sniff' | 'hum' | 'pulse' | 'retention' | 'recover'

export interface BreathPacerStep {
  kind: BreathStepKind
  /** How long the step lasts, in seconds. */
  seconds: number
  /** The person may end it early ("breathe when you need to"). */
  open?: boolean
}

export interface BreathPosition<S extends BreathPacerStep = BreathPacerStep> {
  /** Index of the current step; `steps.length` once done. */
  index: number
  step: S | null
  /** Seconds into the current step. */
  into: number
  /** 0..1 through the current step. */
  progress: number
  /** Whole seconds left in the current step, rounded up for display. */
  remaining: number
  /** Seconds into the whole exercise. */
  elapsed: number
  /** The whole exercise, in seconds. */
  total: number
  done: boolean
}

/** Start offsets of each step, and the total. */
export function stepOffsets(steps: readonly BreathPacerStep[]): { starts: number[], total: number } {
  const starts: number[] = []
  let total = 0
  for (const step of steps) {
    starts.push(total)
    total += Math.max(0, step.seconds)
  }
  return { starts, total }
}

/** Where `elapsed` seconds into the steps falls. */
export function positionAt<S extends BreathPacerStep>(steps: readonly S[], elapsed: number): BreathPosition<S> {
  const { starts, total } = stepOffsets(steps)
  const at = Math.max(0, Math.min(total, elapsed))
  if (!steps.length || at >= total)
    return { index: steps.length, step: null, into: 0, progress: 1, remaining: 0, elapsed: total, total, done: true }
  let low = 0
  let high = steps.length - 1
  while (low < high) {
    const middle = (low + high + 1) >> 1
    if (starts[middle]! <= at) low = middle
    else high = middle - 1
  }
  const step = steps[low]!
  const into = at - starts[low]!
  return { index: low, step, into, progress: step.seconds > 0 ? Math.min(1, into / step.seconds) : 1, remaining: Math.ceil(step.seconds - into), elapsed: at, total, done: false }
}

/**
 * End an open step (a hold) now: the step becomes as long as it was actually
 * held, and everything after it moves up. Returns the new steps and how long
 * the hold lasted (0 when the current step is not open).
 */
export function endStepEarly<S extends BreathPacerStep>(steps: readonly S[], elapsed: number): { steps: S[], held: number } {
  const position = positionAt(steps, elapsed)
  if (!position.step?.open) return { steps: steps.slice(), held: 0 }
  const held = Math.max(0.5, Math.round(position.into * 10) / 10)
  const next = steps.slice()
  next[position.index] = { ...position.step, seconds: held }
  return { steps: next, held }
}

/** Jump `delta` seconds, never past either end. */
export function seekBreath(steps: readonly BreathPacerStep[], elapsed: number, delta: number): number {
  const { total } = stepOffsets(steps)
  return Math.max(0, Math.min(total, elapsed + delta))
}

/**
 * How full the pacer is at a position: 0.6 empty to 1 full, eased so a breath
 * feels round. Natural breathing drifts gently around the middle.
 */
export function pacerScale(position: Pick<BreathPosition, 'step' | 'progress' | 'elapsed'>): number {
  const step = position.step
  if (!step) return 0.6
  const ease = (value: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, value))) / 2
  switch (step.kind) {
    case 'in':
      return 0.6 + 0.4 * ease(position.progress)
    case 'sniff':
      return 0.92 + 0.08 * ease(position.progress)
    case 'out':
    case 'hum':
      return 1 - 0.4 * ease(position.progress)
    case 'hold':
    case 'recover':
      return 1
    case 'pause':
    case 'retention':
      return 0.6
    case 'pulse':
      return position.progress < 0.3 ? 0.8 - 0.1 * (position.progress / 0.3) : 0.7 + 0.1 * ((position.progress - 0.3) / 0.7)
    default:
      return 0.78 + 0.04 * Math.sin(position.elapsed / 5 * Math.PI)
  }
}

export interface BreathPacerOptions<S extends BreathPacerStep> {
  /** Called as each step begins (including the first), with its position. */
  onStep?: (step: S, position: BreathPosition<S>, previous: S | null) => void
  /** Called once when the last step ends. */
  onDone?: (activeSeconds: number) => void
  /** The clock, in milliseconds. Default `performance.now`. */
  now?: () => number
}

export interface BreathPacer<S extends BreathPacerStep> {
  readonly steps: S[]
  readonly state: 'ready' | 'running' | 'paused' | 'done'
  /** Seconds actually spent running (pauses and skipped time excluded). */
  readonly activeSeconds: number
  /** The longest open hold ended so far, in seconds. */
  readonly longestHold: number
  start: () => void
  pause: () => void
  resume: () => void
  /** Move by `delta` seconds (±10 is the usual button). */
  seek: (delta: number) => void
  /** End the current open hold now; returns how long it lasted (0 if none). */
  breatheNow: () => number
  /** Replace the steps (e.g. new settings) and go back to the start. */
  reset: (steps?: S[]) => void
  /** Read the clock: fires onStep/onDone as needed and returns where we are. */
  tick: () => BreathPosition<S>
  position: () => BreathPosition<S>
}

/**
 * A breathing exercise that plays. Call `tick()` on an interval or each frame;
 * it moves the position on and calls `onStep` as steps begin.
 */
export function useBreathPacer<S extends BreathPacerStep>(initial: S[], options: BreathPacerOptions<S> = {}): BreathPacer<S> {
  const clock = options.now ?? (() => (globalThis.performance ? globalThis.performance.now() : Date.now()))
  let steps = initial.slice()
  let state: BreathPacer<S>['state'] = 'ready'
  let base = 0
  let resumedAt = 0
  let active = 0
  let lastIndex = -1
  let longestHold = 0

  const elapsed = () => state === 'running' ? base + (clock() - resumedAt) / 1000 : base
  const bank = () => {
    if (state === 'running') active += (clock() - resumedAt) / 1000
  }

  function noteHold(step: S | undefined | null) {
    if (step?.open) longestHold = Math.max(longestHold, Math.round(step.seconds))
  }

  const pacer: BreathPacer<S> = {
    get steps() { return steps },
    get state() { return state },
    get activeSeconds() { return active + (state === 'running' ? (clock() - resumedAt) / 1000 : 0) },
    get longestHold() { return longestHold },
    start() {
      base = 0
      active = 0
      lastIndex = -1
      longestHold = 0
      resumedAt = clock()
      state = 'running'
      pacer.tick()
    },
    pause() {
      if (state !== 'running') return
      bank()
      base = elapsed()
      state = 'paused'
    },
    resume() {
      if (state !== 'paused') return
      resumedAt = clock()
      state = 'running'
    },
    seek(delta) {
      const at = seekBreath(steps, elapsed(), delta)
      bank()
      base = at
      resumedAt = clock()
      lastIndex = positionAt(steps, at).index
    },
    breatheNow() {
      const ended = endStepEarly(steps, elapsed())
      if (!ended.held) return 0
      steps = ended.steps
      longestHold = Math.max(longestHold, Math.round(ended.held))
      return ended.held
    },
    reset(next) {
      if (next) steps = next.slice()
      state = 'ready'
      base = 0
      active = 0
      lastIndex = -1
    },
    tick() {
      const position = positionAt(steps, elapsed())
      if (state !== 'running') return position
      if (position.done) {
        bank()
        base = position.total
        state = 'done'
        noteHold(steps[steps.length - 1])
        options.onDone?.(active)
        return position
      }
      if (position.index !== lastIndex) {
        const previous = position.index > 0 ? steps[position.index - 1]! : null
        if (lastIndex >= 0) noteHold(previous)
        lastIndex = position.index
        options.onStep?.(position.step!, position, previous)
      }
      return position
    },
    position: () => positionAt(steps, elapsed()),
  }
  return pacer
}
