/**
 * STX Media - Client-Side Upload Handler
 *
 * Handle file uploads with progress tracking, validation, and preview.
 *
 * @module media/client/upload-handler
 */

// =============================================================================
// Types
// =============================================================================

export interface UploadHandlerOptions {
  /** Upload endpoint URL */
  endpoint: string
  /** HTTP method */
  method?: 'POST' | 'PUT' | 'PATCH'
  /** Request headers */
  headers?: Record<string, string>
  /** Form field name */
  fieldName?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Accepted MIME types */
  accept?: string[]
  /** Timeout in ms */
  timeout?: number
  /** Include credentials */
  withCredentials?: boolean
  /** Additional form data */
  formData?: Record<string, string>
  /** Chunk size for chunked uploads */
  chunkSize?: number
}

export interface UploadProgress {
  /** File being uploaded */
  file: File
  /** Bytes loaded */
  loaded: number
  /** Total bytes */
  total: number
  /** Percentage complete (0-100) */
  percent: number
  /** Upload speed in bytes/sec */
  speed?: number
  /** Estimated time remaining in ms */
  timeRemaining?: number
  /** Current chunk (for chunked uploads) */
  chunk?: number
  /** Total chunks (for chunked uploads) */
  totalChunks?: number
}

export interface UploadResult {
  /** Whether upload succeeded */
  success: boolean
  /** Uploaded file URL */
  url?: string
  /** File ID from server */
  id?: string
  /** File name */
  name?: string
  /** File size */
  size?: number
  /** MIME type */
  type?: string
  /** Error message if failed */
  error?: string
  /** Server response data */
  data?: Record<string, unknown>
}

export interface FileValidationResult {
  /** Whether file is valid */
  valid: boolean
  /** Error message */
  error?: string
  /** Error code */
  code?: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'FILE_TOO_SMALL'
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Partial<UploadHandlerOptions> = {
  method: 'POST',
  fieldName: 'file',
  timeout: 60000,
  withCredentials: false,
}

// =============================================================================
// File Validation
// =============================================================================

/**
 * Validate a file before upload
 */
export function validateFile(file: File, options: Partial<UploadHandlerOptions> = {}): FileValidationResult {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size (${formatSize(file.size)}) exceeds maximum (${formatSize(options.maxSize)})`,
      code: 'FILE_TOO_LARGE',
    }
  }

  // Check file type
  if (options.accept && options.accept.length > 0) {
    const isValidType = options.accept.some((accept) => {
      if (accept.endsWith('/*')) {
        // Wildcard match (e.g., 'image/*')
        const prefix = accept.slice(0, -1)
        return file.type.startsWith(prefix)
      }
      return file.type === accept
    })

    if (!isValidType) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed`,
        code: 'INVALID_TYPE',
      }
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// =============================================================================
// Upload Functions
// =============================================================================

/**
 * Upload a single file with progress tracking
 *
 * @example
 * ```typescript
 * const result = await uploadFile(file, {
 *   endpoint: '/api/upload',
 *   onProgress: (progress) => console.log(progress.percent + '%')
 * })
 * ```
 */
export async function uploadFile(
  file: File,
  options: UploadHandlerOptions,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate file
  const validation = validateFile(file, opts)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      name: file.name,
      size: file.size,
      type: file.type,
    }
  }

  // Use chunked upload for large files
  if (opts.chunkSize && file.size > opts.chunkSize) {
    return uploadChunked(file, opts, onProgress)
  }

  return uploadSingle(file, opts, onProgress)
}

/**
 * Upload a single file (non-chunked)
 */
async function uploadSingle(
  file: File,
  options: UploadHandlerOptions,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const startTime = Date.now()
    let lastLoaded = 0
    let lastTime = startTime

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const now = Date.now()
        const timeDiff = (now - lastTime) / 1000 // seconds
        const loadedDiff = event.loaded - lastLoaded

        const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0
        const remaining = event.total - event.loaded
        const timeRemaining = speed > 0 ? (remaining / speed) * 1000 : undefined

        lastLoaded = event.loaded
        lastTime = now

        onProgress({
          file,
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
          speed,
          timeRemaining,
        })
      }
    })

    // Completion handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({
            success: true,
            url: data.url,
            id: data.id,
            name: file.name,
            size: file.size,
            type: file.type,
            data,
          })
        } catch {
          resolve({
            success: true,
            name: file.name,
            size: file.size,
            type: file.type,
          })
        }
      } else {
        resolve({
          success: false,
          error: `Upload failed with status ${xhr.status}`,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }
    })

    // Error handlers
    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network error during upload',
        name: file.name,
        size: file.size,
        type: file.type,
      })
    })

    xhr.addEventListener('timeout', () => {
      resolve({
        success: false,
        error: 'Upload timed out',
        name: file.name,
        size: file.size,
        type: file.type,
      })
    })

    // Build form data
    const formData = new FormData()
    formData.append(options.fieldName || 'file', file)

    // Add additional form data
    if (options.formData) {
      for (const [key, value] of Object.entries(options.formData)) {
        formData.append(key, value)
      }
    }

    // Configure request
    xhr.open(options.method || 'POST', options.endpoint)
    xhr.timeout = options.timeout || 60000
    xhr.withCredentials = options.withCredentials || false

    // Set headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        xhr.setRequestHeader(key, value)
      }
    }

    // Send
    xhr.send(formData)
  })
}

/**
 * Upload a file in chunks (for large files)
 */
async function uploadChunked(
  file: File,
  options: UploadHandlerOptions,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const chunkSize = options.chunkSize!
  const totalChunks = Math.ceil(file.size / chunkSize)
  let uploadedSize = 0
  let uploadId: string | undefined

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const start = chunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunkBlob = file.slice(start, end)

    const formData = new FormData()
    formData.append(options.fieldName || 'file', chunkBlob, file.name)
    formData.append('chunk', String(chunk))
    formData.append('totalChunks', String(totalChunks))
    formData.append('fileName', file.name)
    formData.append('fileSize', String(file.size))
    formData.append('fileType', file.type)

    if (uploadId) {
      formData.append('uploadId', uploadId)
    }

    // Add additional form data
    if (options.formData) {
      for (const [key, value] of Object.entries(options.formData)) {
        formData.append(key, value)
      }
    }

    try {
      const response = await fetch(options.endpoint, {
        method: options.method || 'POST',
        headers: options.headers,
        credentials: options.withCredentials ? 'include' : 'same-origin',
        body: formData,
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Chunk ${chunk + 1}/${totalChunks} failed with status ${response.status}`,
          name: file.name,
          size: file.size,
          type: file.type,
        }
      }

      const data = await response.json()

      // Get upload ID from first chunk response
      if (!uploadId && data.uploadId) {
        uploadId = data.uploadId
      }

      uploadedSize = end

      if (onProgress) {
        onProgress({
          file,
          loaded: uploadedSize,
          total: file.size,
          percent: Math.round((uploadedSize / file.size) * 100),
          chunk: chunk + 1,
          totalChunks,
        })
      }

      // Final chunk - return result
      if (chunk === totalChunks - 1) {
        return {
          success: true,
          url: data.url,
          id: data.id || uploadId,
          name: file.name,
          size: file.size,
          type: file.type,
          data,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Chunk upload failed: ${error}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    }
  }

  return {
    success: false,
    error: 'Unknown error during chunked upload',
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadHandlerOptions,
  onProgress?: (file: File, progress: UploadProgress) => void,
  onComplete?: (file: File, result: UploadResult) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (const file of files) {
    const result = await uploadFile(file, options, (progress) => {
      if (onProgress) {
        onProgress(file, progress)
      }
    })

    results.push(result)

    if (onComplete) {
      onComplete(file, result)
    }
  }

  return results
}

// =============================================================================
// Preview Generation
// =============================================================================

/**
 * Generate a preview data URL for an image file
 */
export function generateImagePreview(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Create canvas for resize
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Scale down if needed
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        } else {
          reject(new Error('Could not get canvas context'))
        }
      }

      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Generate preview for video file (first frame)
 */
export function generateVideoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      reject(new Error('File is not a video'))
      return
    }

    const video = document.createElement('video')
    const canvas = document.createElement('canvas')

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadeddata = () => {
      // Seek to first frame
      video.currentTime = 0.1
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } else {
        reject(new Error('Could not get canvas context'))
      }

      // Clean up
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Could not load video'))
    }

    video.src = URL.createObjectURL(file)
  })
}

// =============================================================================
// Client Runtime
// =============================================================================

/**
 * Generate client-side upload handler runtime
 */
export function generateUploadRuntime(): string {
  return `
(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};

  window.STX.uploadFile = function(file, options, onProgress) {
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable && onProgress) {
          onProgress({
            file: file,
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            resolve({ success: true, url: data.url, id: data.id, data: data });
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          resolve({ success: false, error: 'Upload failed: ' + xhr.status });
        }
      });

      xhr.addEventListener('error', function() {
        resolve({ success: false, error: 'Network error' });
      });

      var formData = new FormData();
      formData.append(options.fieldName || 'file', file);

      xhr.open(options.method || 'POST', options.endpoint);
      if (options.headers) {
        for (var key in options.headers) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
      xhr.send(formData);
    });
  };

  window.STX.validateFile = function(file, options) {
    if (options.maxSize && file.size > options.maxSize) {
      return { valid: false, error: 'File too large' };
    }
    if (options.accept && options.accept.length) {
      var valid = options.accept.some(function(type) {
        return type.endsWith('/*') ? file.type.startsWith(type.slice(0, -1)) : file.type === type;
      });
      if (!valid) return { valid: false, error: 'Invalid file type' };
    }
    return { valid: true };
  };
})();
`.trim()
}
