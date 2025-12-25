/**
 * useShare - Web Share API wrapper
 *
 * Share content using the native share dialog on supported devices.
 *
 * @example
 * ```ts
 * const { isSupported, share, canShare } = useShare()
 *
 * // Share text
 * await share({ title: 'Check this out!', text: 'Amazing content', url: 'https://example.com' })
 *
 * // Share files
 * await share({ files: [imageFile] })
 *
 * // Check if specific content can be shared
 * if (canShare({ files: [pdfFile] })) {
 *   await share({ files: [pdfFile] })
 * }
 * ```
 */

export interface ShareData {
  /** Title of the shared content */
  title?: string
  /** Text/description to share */
  text?: string
  /** URL to share */
  url?: string
  /** Files to share (images, documents, etc.) */
  files?: File[]
}

export interface ShareResult {
  /** Whether the share was successful */
  success: boolean
  /** Error if share failed */
  error?: Error
  /** Whether user cancelled the share */
  cancelled?: boolean
}

export interface ShareRef {
  /** Check if Web Share API is supported */
  isSupported: () => boolean
  /** Check if file sharing is supported */
  isFileShareSupported: () => boolean
  /** Check if specific data can be shared */
  canShare: (data?: ShareData) => boolean
  /** Share content using native dialog */
  share: (data: ShareData) => Promise<ShareResult>
}

/**
 * Check if Web Share API is supported
 */
function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

/**
 * Check if file sharing is supported
 */
function isFileShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'canShare' in navigator
}

/**
 * Reactive share composable
 */
export function useShare(): ShareRef {
  const supported = isShareSupported()
  const fileSupported = isFileShareSupported()

  const canShare = (data?: ShareData): boolean => {
    if (!supported) return false
    if (!data) return true

    // If files are included, check with canShare
    if (data.files && data.files.length > 0) {
      if (!fileSupported) return false
      try {
        return navigator.canShare(data as globalThis.ShareData)
      } catch {
        return false
      }
    }

    // Basic share data is always supported if API exists
    return !!(data.title || data.text || data.url)
  }

  const share = async (data: ShareData): Promise<ShareResult> => {
    if (!supported) {
      return {
        success: false,
        error: new Error('Web Share API is not supported'),
      }
    }

    // Validate data
    if (!data.title && !data.text && !data.url && (!data.files || data.files.length === 0)) {
      return {
        success: false,
        error: new Error('Share data must include at least one of: title, text, url, or files'),
      }
    }

    // Check if this specific data can be shared
    if (!canShare(data)) {
      return {
        success: false,
        error: new Error('This content cannot be shared on this device'),
      }
    }

    try {
      await navigator.share(data as globalThis.ShareData)
      return { success: true }
    } catch (err) {
      // User cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, cancelled: true }
      }
      return {
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }
    }
  }

  return {
    isSupported: () => supported,
    isFileShareSupported: () => fileSupported,
    canShare,
    share,
  }
}

/**
 * Simple share helper
 */
export async function share(data: ShareData): Promise<ShareResult> {
  return useShare().share(data)
}

/**
 * Share a URL with optional title and text
 */
export async function shareURL(
  url: string,
  title?: string,
  text?: string
): Promise<ShareResult> {
  return share({ url, title, text })
}

/**
 * Share text content
 */
export async function shareText(text: string, title?: string): Promise<ShareResult> {
  return share({ text, title })
}

/**
 * Share files
 */
export async function shareFiles(
  files: File[],
  title?: string,
  text?: string
): Promise<ShareResult> {
  return share({ files, title, text })
}

/**
 * Create a shareable file from a blob
 */
export function createShareableFile(
  blob: Blob,
  filename: string,
  mimeType?: string
): File {
  return new File([blob], filename, { type: mimeType || blob.type })
}

/**
 * Share current page
 */
export async function shareCurrentPage(text?: string): Promise<ShareResult> {
  if (typeof document === 'undefined' || typeof location === 'undefined') {
    return { success: false, error: new Error('Not in browser environment') }
  }

  return share({
    title: document.title,
    url: location.href,
    text,
  })
}

/**
 * Copy to clipboard as fallback when share is not supported
 */
export async function shareWithFallback(
  data: ShareData,
  fallbackMessage?: string
): Promise<ShareResult & { usedFallback?: boolean }> {
  const sharer = useShare()

  // Try native share first
  if (sharer.isSupported() && sharer.canShare(data)) {
    const result = await sharer.share(data)
    if (result.success || result.cancelled) {
      return result
    }
  }

  // Fallback to clipboard
  const textToCopy = data.url || data.text || data.title || ''
  if (!textToCopy) {
    return { success: false, error: new Error('Nothing to copy') }
  }

  try {
    await navigator.clipboard.writeText(textToCopy)
    if (fallbackMessage) {
      alert(fallbackMessage)
    }
    return { success: true, usedFallback: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
      usedFallback: true,
    }
  }
}
