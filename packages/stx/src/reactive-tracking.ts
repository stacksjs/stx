/**
 * The one piece of state that decides what is reactive to what.
 *
 * stx shipped two independent reactive systems in the same package entry, and
 * the only thing keeping them apart was a variable name: `signals-api.ts` had
 * `activeEffect`, `reactivity.ts` had `currentEffect`, and each recorded its
 * dependencies against its own. Both are the same shape — the nullary function
 * to re-run — so which system a value belonged to was decided entirely by
 * which module happened to declare the variable that was set when it was read.
 *
 * Measured before this module existed, on `import { … } from 'stx'`:
 *
 *     reactive() + effect()        INERT      reactive() + watchEffect()  REACTIVE
 *     ref()      + effect()        INERT      ref()      + watchEffect()  REACTIVE
 *     state()    + effect()        REACTIVE   state()    + watchEffect()  INERT
 *
 * Four of six silently dead. Not an error, not a warning — the effect ran once
 * and never again, which reads as "the value never changed". All eight names
 * come from the same entry point with nothing to tell an author which half of
 * the matrix they are standing in (stacksjs/stx#1885).
 *
 * Owning the state here rather than in either module is what makes the two
 * interoperate without one importing the other, which would be a cycle. It is
 * also why this file is small and has no opinions: everything else about a
 * signal — how it stores its value, when it considers itself changed, what it
 * exposes — stays where it was.
 *
 * ## What this does NOT bridge
 *
 * The client runtime in `signals.ts` is generated as a template literal and
 * owns a third copy of this state inside that string. No module can import it,
 * so the runtime is unaffected by this file and stays a separate system. See
 * CLAUDE.md item 40; the parity suites are what hold those two in step.
 *
 * @module reactive-tracking
 */

/** The effect currently collecting dependencies, if any. */
let activeSubscriber: (() => void) | null = null

/**
 * Nesting stack.
 *
 * Kept because an effect that runs another effect has to restore the outer one
 * rather than clear it — `setActiveSubscriber` returning the previous value is
 * what callers use to do that, and the stack makes the depth observable for
 * anything that needs it.
 */
const subscriberStack: Array<(() => void) | null> = []

/** Batching depth. Nested `batch()` calls flush once, at the outermost exit. */
let batchDepth = 0

/** Effects deferred until the current batch ends, de-duplicated by identity. */
const pendingEffects = new Set<() => void>()

/**
 * The effect currently collecting dependencies.
 *
 * A reactive read calls this and, when it is not null, records the result as a
 * subscriber. That is the whole of dependency tracking.
 */
export function getActiveSubscriber(): (() => void) | null {
  return activeSubscriber
}

/**
 * Make `subscriber` the one collecting dependencies, and return the previous.
 *
 * Returning the previous value rather than requiring the caller to read it
 * first is deliberate: the restore is the step that gets forgotten, and a
 * forgotten restore leaks the inner effect's identity into the outer scope, so
 * every subsequent read subscribes the wrong function. Pair with
 * {@link restoreActiveSubscriber} in a `finally`.
 */
export function setActiveSubscriber(subscriber: () => void): (() => void) | null {
  const previous = activeSubscriber

  subscriberStack.push(subscriber)
  activeSubscriber = subscriber

  return previous
}

/** Undo a {@link setActiveSubscriber}, restoring what was listening before. */
export function restoreActiveSubscriber(previous: (() => void) | null): void {
  subscriberStack.pop()
  activeSubscriber = previous
}

/** How deeply effects are currently nested. */
export function subscriberDepth(): number {
  return subscriberStack.length
}

/** Whether updates are currently being collected rather than applied. */
export function isBatching(): boolean {
  return batchDepth > 0
}

/**
 * Defer an effect to the end of the current batch.
 *
 * A `Set` rather than an array, so a signal written five times in one batch
 * still runs its subscribers once.
 */
export function enqueueEffect(effect: () => void): void {
  pendingEffects.add(effect)
}

/**
 * Collect updates rather than applying them, and run each affected effect once
 * when the outermost batch ends.
 *
 * Nested calls do not flush early — a `batch` inside a `batch` would otherwise
 * run the outer batch's pending effects against half-applied state.
 */
export function runBatched(fn: () => void): void {
  batchDepth++

  try {
    fn()
  }
  finally {
    batchDepth--

    if (batchDepth === 0) {
      // Drain into a local list first: an effect may write a signal, which
      // enqueues into the same set while it is being iterated.
      const queued = [...pendingEffects]
      pendingEffects.clear()

      for (const effect of queued)
        effect()
    }
  }
}

/**
 * Run `fn` with dependency tracking suspended.
 *
 * Reads inside are not recorded against the enclosing effect, which is what
 * `untrack`/`peek` are for in both modules.
 */
export function withoutTracking<T>(fn: () => T): T {
  const previous = activeSubscriber
  activeSubscriber = null

  try {
    return fn()
  }
  finally {
    activeSubscriber = previous
  }
}
