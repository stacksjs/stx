import type { CompletionContext } from '../../src/composables/use-completion'
import { describe, expect, it } from 'bun:test'
import { useCompletion } from '../../src/composables/use-completion'

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

interface Call {
  context: CompletionContext
  signal: AbortSignal
  resolve: (text: string | null | undefined) => void
  reject: (error: unknown) => void
}

/** A fetch the test settles by hand, so ordering is under its control. */
function harness(options: { debounceMs?: number, minChars?: number, enabled?: boolean | (() => unknown) } = {}) {
  const calls: Call[] = []
  const completion = useCompletion({
    debounceMs: 5,
    minChars: 4,
    ...options,
    fetch: (context, signal) => new Promise((resolve, reject) => {
      calls.push({ context, signal, resolve, reject })
    }),
  })
  return { calls, completion }
}

/** Type `text` into the field char by char, as the host would call update(). */
function feed(completion: ReturnType<typeof useCompletion>, text: string, meta?: Parameters<ReturnType<typeof useCompletion>['update']>[3]) {
  completion.update(text, '', text.length, meta)
}

describe('useCompletion', () => {
  it('debounces: a burst of edits asks once, after the last', async () => {
    const { calls, completion } = harness({ debounceMs: 20 })
    for (const text of ['Hello', 'Hello w', 'Hello wo', 'Hello wor'])
      feed(completion, text)
    await sleep(5)
    expect(calls).toHaveLength(0)
    await sleep(30)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.context).toEqual({ before: 'Hello wor', after: '', caret: 9 })
    completion.destroy()
  })

  it('shows the suggestion once it arrives, and reports pending meanwhile', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    expect(completion.pending()).toBe(true)
    expect(completion.ghost()).toBe('')
    calls[0]!.resolve(' Madam,')
    await sleep(0)
    expect(completion.pending()).toBe(false)
    expect(completion.ghost()).toBe(' Madam,')
    completion.destroy()
  })

  it('aborts the previous request when a newer edit makes it pointless', async () => {
    const { calls, completion } = harness()
    feed(completion, 'The quick brown')
    await sleep(15)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.signal.aborted).toBe(false)

    feed(completion, 'The quick brown f')
    expect(calls[0]!.signal.aborted).toBe(true)
    expect(completion.pending()).toBe(false)
    await sleep(15)
    expect(calls).toHaveLength(2)
    completion.destroy()
  })

  it('discards a stale answer even when the fetch ignored the abort', async () => {
    const { calls, completion } = harness()
    feed(completion, 'The quick brown')
    await sleep(15)
    feed(completion, 'The quick brown f')
    // The first answer limps in after the text moved on.
    calls[0]!.resolve(' fox jumps')
    await sleep(0)
    expect(completion.ghost()).toBe('')

    await sleep(15)
    calls[1]!.resolve('ox')
    await sleep(0)
    expect(completion.ghost()).toBe('ox')
    completion.destroy()
  })

  it('discards an answer when the caret moved without the text changing', async () => {
    const { calls, completion } = harness()
    completion.update('Hello there', ' you', 11)
    await sleep(15)
    completion.update('Hello', ' there you', 5)
    calls[0]!.resolve(' friend')
    await sleep(0)
    expect(completion.ghost()).toBe('')
    completion.destroy()
  })

  it('accept() returns the whole suggestion and clears it', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam, I write')
    await sleep(0)
    expect(completion.accept()).toBe(' Madam, I write')
    expect(completion.ghost()).toBe('')
    expect(completion.accept()).toBe('')
    completion.destroy()
  })

  it('accepting does not immediately ask for the next suggestion', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    const text = completion.accept()
    feed(completion, `Dear Sir or${text}`)
    await sleep(20)
    expect(calls).toHaveLength(1)
    expect(completion.ghost()).toBe('')

    // The next edit does ask.
    feed(completion, 'Dear Sir or Madam,')
    await sleep(15)
    expect(calls).toHaveLength(2)
    completion.destroy()
  })

  it('acceptWord() takes one word at a time, whitespace included', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam, I write to')
    await sleep(0)
    expect(completion.acceptWord()).toBe(' Madam,')
    expect(completion.ghost()).toBe(' I write to')
    feed(completion, 'Dear Sir or Madam,')
    expect(completion.ghost()).toBe(' I write to')
    expect(completion.acceptWord()).toBe(' I')
    expect(completion.ghost()).toBe(' write to')
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('typing the start of the suggestion consumes it instead of discarding it', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam, I write')
    await sleep(0)

    feed(completion, 'Dear Sir or ')
    expect(completion.ghost()).toBe('Madam, I write')
    feed(completion, 'Dear Sir or Ma')
    expect(completion.ghost()).toBe('dam, I write')
    await sleep(20)
    expect(calls).toHaveLength(1)

    // Backspacing into the typed part re-shows the rest.
    feed(completion, 'Dear Sir or M')
    expect(completion.ghost()).toBe('adam, I write')
    completion.destroy()
  })

  it('an edit that diverges clears the ghost and asks again', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    feed(completion, 'Dear Sir or X')
    expect(completion.ghost()).toBe('')
    await sleep(15)
    expect(calls).toHaveLength(2)
    completion.destroy()
  })

  it('typing the whole suggestion leaves nothing to show and nothing to ask', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    feed(completion, 'Dear Sir or Madam')
    expect(completion.ghost()).toBe('')
    await sleep(20)
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('a change after the caret ends the suggestion', async () => {
    const { calls, completion } = harness()
    completion.update('Dear Sir or', '', 11)
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    completion.update('Dear Sir or', ' more', 11)
    expect(completion.ghost()).toBe('')
    completion.destroy()
  })

  it('dismiss() drops the ghost and the request, and an identical update does not bring them back', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    completion.dismiss()
    expect(completion.ghost()).toBe('')
    feed(completion, 'Dear Sir or')
    await sleep(20)
    expect(calls).toHaveLength(1)
    expect(completion.ghost()).toBe('')

    feed(completion, 'Dear Sir or M')
    await sleep(15)
    expect(calls).toHaveLength(2)
    completion.destroy()
  })

  it('makes no request while an IME composition is active', async () => {
    const { calls, completion } = harness()
    feed(completion, 'こんにちは世界です', { composing: true })
    await sleep(20)
    expect(calls).toHaveLength(0)

    // Composition ended: the same text now earns a request.
    feed(completion, 'こんにちは世界です', { composing: false })
    await sleep(15)
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('a composition that starts cancels the request and clears the ghost', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve(' Madam')
    await sleep(0)
    expect(completion.ghost()).toBe(' Madam')
    feed(completion, 'Dear Sir or', { composing: true })
    expect(completion.ghost()).toBe('')

    feed(completion, 'Dear Sir or m', { composing: false })
    await sleep(15)
    feed(completion, 'Dear Sir or ma', { composing: true })
    expect(calls[1]!.signal.aborted).toBe(true)
    completion.destroy()
  })

  it('makes no request while text is selected', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or', { selecting: true })
    await sleep(20)
    expect(calls).toHaveLength(0)
    completion.destroy()
  })

  it('makes no request when the host cannot draw one', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or', { blocked: true })
    await sleep(20)
    expect(calls).toHaveLength(0)
    completion.destroy()
  })

  it('makes no request mid-word', async () => {
    const { calls, completion } = harness()
    completion.update('Dear Sir or', 'der', 11)
    await sleep(20)
    expect(calls).toHaveLength(0)
    completion.update('Dear Sir or', ' later', 11)
    await sleep(15)
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('waits for minChars', async () => {
    const { calls, completion } = harness({ minChars: 12 })
    feed(completion, 'Hello there')
    await sleep(20)
    expect(calls).toHaveLength(0)
    feed(completion, 'Hello there, my friend')
    await sleep(15)
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('respects enabled, including a function read at update time', async () => {
    let on = false
    const { calls, completion } = harness({ enabled: () => on })
    feed(completion, 'Dear Sir or')
    await sleep(20)
    expect(calls).toHaveLength(0)
    on = true
    feed(completion, 'Dear Sir or M')
    await sleep(15)
    expect(calls).toHaveLength(1)
    completion.destroy()
  })

  it('an empty answer is no suggestion', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.resolve('')
    await sleep(0)
    expect(completion.ghost()).toBe('')
    expect(completion.pending()).toBe(false)
    completion.destroy()
  })

  it('a failed request leaves no ghost and reports the error; an abort is not an error', async () => {
    const { calls, completion } = harness()
    feed(completion, 'Dear Sir or')
    await sleep(15)
    calls[0]!.reject(new Error('502'))
    await sleep(0)
    expect(completion.ghost()).toBe('')
    expect(completion.error()?.message).toBe('502')

    feed(completion, 'Dear Sir or M')
    await sleep(15)
    calls[1]!.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    await sleep(0)
    expect(completion.error()).toBeNull()
    completion.destroy()
  })

  it('destroy() stops everything', async () => {
    const { calls, completion } = harness({ debounceMs: 20 })
    feed(completion, 'Dear Sir or')
    completion.destroy()
    await sleep(40)
    expect(calls).toHaveLength(0)
    feed(completion, 'Dear Sir or M')
    await sleep(40)
    expect(calls).toHaveLength(0)
  })
})
