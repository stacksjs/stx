/**
 * Copy code to clipboard with visual feedback
 */
export interface CopyCodeOptions {
  code: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export interface CopyCodeResult {
  copied: boolean
  copy: () => Promise<void>
  reset: () => void
}

export function useCopyCode(options: CopyCodeOptions): CopyCodeResult {
  const { code, onSuccess, onError, timeout = 2000 } = options

  let copied = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const reset = () => {
    copied = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const copy = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }

      await navigator.clipboard.writeText(code)
      copied = true
      onSuccess?.()

      // Auto-reset after timeout
      timeoutId = setTimeout(() => {
        copied = false
        timeoutId = null
      }, timeout)
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to copy code')
      onError?.(err)
      console.error('Failed to copy code:', err)
    }
  }

  return {
    copied,
    copy,
    reset,
  }
}

/**
 * Simple synchronous copy function for direct use
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
