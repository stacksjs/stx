/**
 * useCompletion - inline "ghost text" completions for a text field.
 *
 * The editor-agnostic half of AI autocomplete: it owns WHEN to ask for a
 * suggestion and WHAT to keep of the answer, and nothing about how a
 * suggestion is drawn or where it comes from. A textarea, a contenteditable
 * and a native text view all call the same three methods; `<AiTextarea>` in
 * @stacksjs/components is the textarea that does it for you.
 *
 * ```ts
 * const completion = useCompletion({
 *   fetch: async ({ before, after }, signal) => {
 *     const res = await fetch('/api/complete', { method: 'POST', signal, body: JSON.stringify({ before, after }) })
 *     return (await res.json()).completion
 *   },
 * })
 *
 * // on every input / selection change:
 * completion.update(text.slice(0, caret), text.slice(caret), caret, { selecting: start !== end })
 * // draw completion.ghost() after the caret; on Tab:
 * insert(completion.accept())
 * ```
 *
 * What it guarantees:
 *   - Debounced: a burst of keystrokes asks once, `debounceMs` after the last.
 *   - One request at a time: a newer edit aborts the previous request through
 *     its AbortSignal.
 *   - Stale answers are discarded: a response for text that is no longer there
 *     never shows, whether or not the fetch honoured the abort.
 *   - No request while an IME composition is active, while text is selected,
 *     mid-word, or before `minChars` of text exist.
 *   - Typing the first characters of the suggestion CONSUMES it (the ghost
 *     shrinks, nothing is fetched); any other edit clears it.
 *   - Accepting does not immediately ask for the next suggestion; the next
 *     edit does.
 *
 * Delivery: demand-bundled into `<script client>` blocks like `useForm`
 * (framework-composables.ts takes this file whole and strips the import below,
 * since `state` is a runtime global by then), so keep it free of other imports.
 */
import type { Signal } from '../signals-api'
import { state } from '../signals-api'

export interface CompletionContext {
  /** Text before the caret. */
  before: string
  /** Text after the caret. */
  after: string
  /** The caret offset into the whole text. */
  caret: number
}

/** What the host knows about the field that the text alone does not say. */
export interface CompletionMeta {
  /** An IME composition is in progress: the text is provisional. */
  composing?: boolean
  /** A range is selected rather than a caret. */
  selecting?: boolean
  /** The host cannot draw a suggestion here (caret mid-line, say). */
  blocked?: boolean
}

export interface UseCompletionOptions {
  /**
   * Ask for the continuation. Receives an AbortSignal that fires when a newer
   * edit makes the answer pointless. Resolve `''` for "no suggestion".
   */
  fetch: (context: CompletionContext, signal: AbortSignal) => Promise<string | null | undefined>
  /** Quiet time after the last edit before asking. Default 250. */
  debounceMs?: number
  /** Fewest characters of text (trimmed) before the caret that earn a request. Default 12. */
  minChars?: number
  /** A boolean, or a function (a signal works) read on every update. Default true. */
  enabled?: boolean | string | (() => unknown)
}

export interface Completion {
  /** The suggestion still to be accepted, drawn after the caret. `''` when none. */
  ghost: Signal<string>
  /** True while a request is in flight. */
  pending: Signal<boolean>
  /** The last request failure, or null. Aborts are not failures. */
  error: Signal<Error | null>
  /** Tell it the field changed. Call on input, selection change, and composition end. */
  update: (before: string, after: string, caret: number, meta?: CompletionMeta) => void
  /** Take the whole suggestion. Returns the text to insert (`''` if none). */
  accept: () => string
  /** Take the next word of the suggestion (leading whitespace included). */
  acceptWord: () => string
  /** Drop the suggestion and any request, until the next edit. */
  dismiss: () => void
  /** Stop timers and requests for good. */
  destroy: () => void
}

export function useCompletion(options: UseCompletionOptions): Completion {
  const debounceMs = Math.max(0, options.debounceMs ?? 250)
  const minChars = Math.max(0, options.minChars ?? 12)

  const ghost = state('')
  const pending = state(false)
  const error = state<Error | null>(null)

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let token = 0
  let lastKey = ''
  let latest: CompletionContext = { before: '', after: '', caret: 0 }
  // The suggestion in full, and the text it was generated for. `ghost` is what
  // is left of it; this is what typed text is compared against.
  let suggestion = ''
  let anchor: { before: string, after: string } | null = null
  let destroyed = false

  function isEnabled(): boolean {
    const value = options.enabled
    const resolved = typeof value === 'function' ? value() : value
    if (typeof resolved === 'string')
      return !['false', '0', 'off', 'no'].includes(resolved.trim().toLowerCase())
    return resolved !== false
  }

  function cancelRequest(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    token++
    if (controller) {
      controller.abort()
      controller = undefined
    }
    if (pending())
      pending.set(false)
  }

  function clearSuggestion(): void {
    suggestion = ''
    anchor = null
    if (ghost() !== '')
      ghost.set('')
  }

  function schedule(context: CompletionContext): void {
    const mine = ++token
    timer = setTimeout(() => {
      timer = undefined
      if (destroyed || mine !== token)
        return
      const abort = new AbortController()
      controller = abort
      pending.set(true)
      error.set(null)

      Promise.resolve()
        .then(() => options.fetch(context, abort.signal))
        .then((result) => {
          // A newer edit got here first: this answer is for text that is gone.
          if (destroyed || mine !== token)
            return
          if (latest.before !== context.before || latest.after !== context.after || latest.caret !== context.caret)
            return
          controller = undefined
          pending.set(false)
          const text = typeof result === 'string' ? result : ''
          if (!text) {
            clearSuggestion()
            return
          }
          suggestion = text
          anchor = { before: context.before, after: context.after }
          ghost.set(text)
        })
        .catch((failure: unknown) => {
          if (destroyed || mine !== token)
            return
          controller = undefined
          pending.set(false)
          clearSuggestion()
          const aborted = failure instanceof Error && failure.name === 'AbortError'
          if (!aborted)
            error.set(failure instanceof Error ? failure : new Error(String(failure)))
        })
    }, debounceMs)
  }

  function update(before: string, after: string, caret: number, meta: CompletionMeta = {}): void {
    if (destroyed)
      return
    const key = `${caret}\u0000${meta.composing ? 1 : 0}${meta.selecting ? 1 : 0}${meta.blocked ? 1 : 0}\u0000${before}\u0000${after}`
    // The same state again (a selectionchange that moved nothing) changes nothing.
    if (key === lastKey)
      return
    lastKey = key
    latest = { before, after, caret }

    if (!isEnabled() || meta.composing || meta.selecting || meta.blocked) {
      cancelRequest()
      clearSuggestion()
      return
    }

    // Typing the start of the suggestion consumes it.
    if (anchor && suggestion && after === anchor.after && before.length >= anchor.before.length && before.startsWith(anchor.before)) {
      const typed = before.slice(anchor.before.length)
      if (suggestion.startsWith(typed)) {
        cancelRequest()
        const rest = suggestion.slice(typed.length)
        if (rest) {
          if (ghost() !== rest)
            ghost.set(rest)
        }
        else {
          // Fully typed or accepted: nothing to show, nothing to ask for until the next edit.
          clearSuggestion()
        }
        return
      }
    }

    // Any other edit: the suggestion no longer fits.
    cancelRequest()
    clearSuggestion()

    if (before.trim().length < minChars)
      return
    // Completing the middle of a word is rarely what anyone wants.
    if (/^[\p{L}\p{N}_]/u.test(after))
      return

    schedule({ before, after, caret })
  }

  function accept(): string {
    const text = ghost()
    if (!text)
      return ''
    // `suggestion` and `anchor` stay: the host inserts the text and calls
    // update(), which recognises it as the suggestion typed in full.
    ghost.set('')
    return text
  }

  function acceptWord(): string {
    const text = ghost()
    if (!text)
      return ''
    const match = /^\s*\S+/.exec(text)
    const word = match ? match[0] : text
    ghost.set(text.slice(word.length))
    return word
  }

  function dismiss(): void {
    cancelRequest()
    clearSuggestion()
  }

  function destroy(): void {
    destroyed = true
    cancelRequest()
    clearSuggestion()
  }

  return { ghost, pending, error, update, accept, acceptWord, dismiss, destroy }
}
