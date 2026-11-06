/** A fetch-shaped transfer with real upload bytes and AbortSignal on web and native. */
export interface UploadFetchInit extends RequestInit {
  onUploadProgress?: (progress: { loaded: number, total: number }) => void
  timeoutMs?: number
}

function cancelled(signal?: AbortSignal | null): Error {
  if (signal?.reason instanceof Error) return signal.reason
  return typeof DOMException === 'function' ? new DOMException('The upload was aborted', 'AbortError') : Object.assign(new Error('The upload was aborted'), { name: 'AbortError' })
}

export function uploadFetch(url: string, init: UploadFetchInit = {}): Promise<Response> {
  if (init.signal?.aborted) return Promise.reject(cancelled(init.signal))
  // Native fetch implements the same callback through its owned Network task.
  if (!init.onUploadProgress || typeof XMLHttpRequest === 'undefined') return fetch(url, init)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      init.signal?.removeEventListener('abort', abort)
      if (error) { reject(error); return }
      try {
        if (xhr.status < 100 || xhr.status > 599) throw new TypeError('Upload received no HTTP response')
        const headers = new Headers()
        for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
          const colon = line.indexOf(':')
          if (colon > 0) headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim())
        }
        resolve(new Response(xhr.status === 204 || xhr.status === 304 ? null : xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers }))
      }
      catch (cause) { reject(cause) }
    }
    const abort = () => { xhr.abort(); finish(cancelled(init.signal)) }
    xhr.open(init.method || 'POST', url, true)
    xhr.timeout = init.timeoutMs ?? 600000
    xhr.withCredentials = init.credentials === 'include'
    new Headers(init.headers).forEach((value, name) => xhr.setRequestHeader(name, value))
    xhr.upload.onprogress = event => {
      if (settled || !event.lengthComputable || event.total <= 0) return
      try { init.onUploadProgress?.({ loaded: event.loaded, total: event.total }) }
      catch { /* A progress observer cannot change the transfer's result. */ }
    }
    xhr.onload = () => finish()
    xhr.onerror = () => finish(new TypeError('Upload network request failed'))
    xhr.ontimeout = () => finish(Object.assign(new Error('Upload timed out'), { name: 'TimeoutError' }))
    xhr.onabort = () => finish(cancelled(init.signal))
    init.signal?.addEventListener('abort', abort, { once: true })
    try { xhr.send(init.body as XMLHttpRequestBodyInit | null | undefined) }
    catch (error) { finish(error instanceof Error ? error : new Error(String(error))) }
  })
}
