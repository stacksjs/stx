/**
 * Local HTTP listener — for OAuth callback flows.
 *
 * The native side binds a TCP socket on `127.0.0.1` and accepts one
 * request at a time. Each incoming request fires `craft:localServer:request`
 * with the parsed URL; apps respond via `respond({ status, body })`
 * within 5 seconds (the listener auto-replies with a default 200 page
 * after that to avoid hung sockets).
 *
 * **Typical OAuth flow:**
 * ```ts
 * const { port } = await localServer.start()
 * const off = localServer.onRequest(({ url }) => {
 *   const code = new URL(`http://x${url}`).searchParams.get('code')
 *   localServer.respond({ status: 200, body: '<h1>Done</h1>' })
 *   resolveCode(code)
 * })
 * await shell.openExternal(`https://provider.com/oauth?redirect=http://127.0.0.1:${port}/cb`)
 * ```
 *
 * No web fallback — there's no socket-binding equivalent.
 */
import { hasBridge, onCraftEvent, requireBridge } from './_bridge'

export interface LocalServerStartResult {
  port: number
  started: boolean
  alreadyRunning?: boolean
  reason?: string
}

export interface LocalServerRequestEvent {
  /** HTTP method (GET / POST / etc). */
  method: string
  /** Request path including query string (e.g. `/cb?code=abc`). */
  url: string
}

export interface LocalServerRespondOptions {
  /** HTTP status code. Default 200. */
  status?: number
  /** Response body. Default "OK". */
  body?: string
  /** Content-Type header. Default `text/html; charset=utf-8`. */
  contentType?: string
}

export interface LocalServerAPI {
  /**
   * Start the listener. Pass `port: 0` (default) to let the OS pick a
   * free port — read it from the resolved `port` field. Idempotent;
   * a second call while already running returns the existing port.
   */
  start: (port?: number, host?: string) => Promise<LocalServerStartResult>
  stop: () => Promise<void>
  /** Reply to the in-flight request. Must be called within 5s. */
  respond: (options?: LocalServerRespondOptions) => Promise<void>
  onRequest: (cb: (event: LocalServerRequestEvent) => void) => () => void

  /**
   * One-shot helper for OAuth flows: start the server, await the first
   * request, capture the URL, respond with a confirmation page, return
   * the URL. Throws if the bridge is unavailable.
   */
  awaitOAuthCallback: (options?: { port?: number, host?: string, timeoutMs?: number, successHTML?: string }) => Promise<{ url: string, port: number }>
}

export const localServer: LocalServerAPI = {
  async start(port = 0, host = '127.0.0.1') {
    if (!hasBridge('localServer')) return { port: 0, started: false, reason: 'bridge unavailable' }
    return await window.craft!.localServer.start(port, host)
  },
  async stop() {
    if (!hasBridge('localServer')) return
    await window.craft!.localServer.stop()
  },
  async respond(options) {
    if (!hasBridge('localServer')) return
    await window.craft!.localServer.respond(options || { status: 200, body: 'OK' })
  },
  onRequest(cb) {
    return onCraftEvent<LocalServerRequestEvent>('craft:localServer:request', cb)
  },

  async awaitOAuthCallback(options = {}) {
    requireBridge('localServer')

    const { port: requestedPort = 0, host = '127.0.0.1', timeoutMs = 5 * 60 * 1000, successHTML } = options
    const start = await this.start(requestedPort, host)
    if (!start.started) throw new Error(`localServer: start failed${start.reason ? ` — ${start.reason}` : ''}`)

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off()
        this.stop().catch(() => {})
        reject(new Error('localServer: OAuth callback timed out'))
      }, timeoutMs)

      const off = this.onRequest(({ url }) => {
        clearTimeout(timer)
        off()
        // Send a friendly success page so the user knows it worked.
        // The page closes itself after a moment — feels more polished
        // than leaving a blank tab open.
        const body = successHTML ?? `<!doctype html><meta charset="utf-8"><title>Done</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f7}</style>
<div><h1>You can close this tab.</h1><p>Returning to the app…</p></div>
<script>setTimeout(()=>window.close(),1500)</script>`
        this.respond({ status: 200, body, contentType: 'text/html; charset=utf-8' })
          .catch(() => {})
          .finally(() => this.stop().catch(() => {}))
        resolve({ url, port: start.port })
      })
    })
  },
}
