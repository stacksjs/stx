import { afterEach, expect, test } from 'bun:test'
import { uploadFetch } from '../../src/media/client/upload-fetch'

const original = globalThis.XMLHttpRequest
let current: any
class Transfer {
  upload: any = {}
  status = 201
  statusText = 'Created'
  responseText = '{"video":{"url":"/video.mp4"}}'
  headers: Record<string, string> = {}
  onload: any; onerror: any; onabort: any
  aborted = false
  constructor() { current = this }
  open() {}
  send() {}
  getAllResponseHeaders() { return 'Content-Type: application/json\r\n' }
  setRequestHeader(name: string, value: string) { this.headers[name] = value }
  abort() { this.aborted = true; this.onabort?.() }
}
afterEach(() => { globalThis.XMLHttpRequest = original })

test('upload fetch reports actual bytes and retains authentication and HTTP errors', async () => {
  globalThis.XMLHttpRequest = Transfer as any
  const progress: unknown[] = []
  const result = uploadFetch('/video', { headers: { Authorization: 'Bearer own' }, onUploadProgress: value => progress.push(value) })
  current.upload.onprogress({ lengthComputable: true, loaded: 42, total: 100 })
  expect(progress).toEqual([{ loaded: 42, total: 100 }])
  expect(current.headers.authorization).toBe('Bearer own')
  current.status = 422
  current.onload()
  const response = await result
  expect(response.status).toBe(422)
  expect(response.headers.get('Content-Type')).toBe('application/json')
  expect(await response.json()).toEqual({ video: { url: '/video.mp4' } })
})

test('aborting cancels the transfer rather than just abandoning its result', async () => {
  globalThis.XMLHttpRequest = Transfer as any
  const controller = new AbortController()
  const result = uploadFetch('/video', { signal: controller.signal, onUploadProgress() {} })
  controller.abort()
  await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  expect(current.aborted).toBe(true)
  await expect(uploadFetch('/video', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
})
