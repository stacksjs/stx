/**
 * useClipboard - Reactive clipboard composable
 *
 * Provides easy access to the Clipboard API with fallbacks.
 */

export interface ClipboardRef {
  /** Current clipboard text (if readable) */
  text: string
  /** Whether clipboard is supported */
  isSupported: boolean
  /** Whether currently copying */
  copied: boolean
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>
  /** Read text from clipboard (requires permission) */
  read: () => Promise<string>
  /** Subscribe to copy events */
  subscribe: (callback: (text: string) => void) => () => void
}

/**
 * Create a clipboard helper
 *
 * @example
 * ```ts
 * const clipboard = useClipboard()
 *
 * // Copy text
 * await clipboard.copy('Hello World')
 *
 * // Check if copy was successful
 * if (clipboard.copied) {
 *   console.log('Copied!')
 * }
 * ```
 */
export function useClipboard(options: { timeout?: number } = {}): ClipboardRef {
  const { timeout = 1500 } = options

  const subscribers = new Set<(text: string) => void>()
  let currentText = ''
  let copied = false
  let copiedTimeout: ReturnType<typeof setTimeout> | null = null

  const isSupported = typeof navigator !== 'undefined' && 'clipboard' in navigator

  const notify = (text: string) => {
    for (const callback of subscribers) {
      try {
        callback(text)
      } catch (e) {
        console.error('[useClipboard] Subscriber error:', e)
      }
    }
  }

  const copy = async (text: string): Promise<boolean> => {
    if (!isSupported) {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        currentText = text
        copied = true
        notify(text)

        if (copiedTimeout) clearTimeout(copiedTimeout)
        copiedTimeout = setTimeout(() => { copied = false }, timeout)

        return true
      } catch {
        return false
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      currentText = text
      copied = true
      notify(text)

      if (copiedTimeout) clearTimeout(copiedTimeout)
      copiedTimeout = setTimeout(() => { copied = false }, timeout)

      return true
    } catch {
      return false
    }
  }

  const read = async (): Promise<string> => {
    if (!isSupported) return ''

    try {
      const text = await navigator.clipboard.readText()
      currentText = text
      return text
    } catch {
      return ''
    }
  }

  return {
    get text() { return currentText },
    get isSupported() { return isSupported },
    get copied() { return copied },
    copy,
    read,
    subscribe: (callback) => {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
  }
}

/**
 * Copy text to clipboard (one-shot helper)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const clipboard = useClipboard()
  return clipboard.copy(text)
}
