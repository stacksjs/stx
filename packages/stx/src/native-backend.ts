export interface NativeBackendOptions {
  html: string
  fetch: (request: Request) => Response | null | Promise<Response | null>
  maxRequestBodySize?: number
  /** Flush application state before the managed backend exits. Limited to two seconds. */
  shutdown?: () => void | Promise<void>
}

/** Host an embedded app on an authenticated, ephemeral loopback origin. */
export async function runNativeBackend(options: NativeBackendOptions): Promise<void> {
  if (!process.argv.includes('--serve'))
    throw new Error('Launch the native application bundle, rather than its backend helper.')
  const token = crypto.randomUUID()
  const cookie = `stx_native=${token}`
  let authenticated = false
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    maxRequestBodySize: options.maxRequestBodySize ?? 32 * 1024 * 1024,
    async fetch(request) {
      const url = new URL(request.url)
      if (request.headers.get('host') !== `127.0.0.1:${server.port}`)
        return new Response('Forbidden', { status: 403 })
      const origin = request.headers.get('origin')
      if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site')
        return new Response('Forbidden', { status: 403 })
      if (!authenticated && request.method === 'GET' && url.pathname === '/' && url.searchParams.get('session') === token) {
        authenticated = true
        return new Response(null, { status: 303, headers: {
          location: '/',
          'set-cookie': `${cookie}; HttpOnly; SameSite=Strict; Path=/`,
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        } })
      }
      if (!request.headers.get('cookie')?.split(';').some(value => value.trim() === cookie))
        return new Response('Forbidden', { status: 403 })
      if (request.method === 'GET' && url.pathname === '/')
        return new Response(options.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } })
      return await options.fetch(request) ?? new Response('Not Found', { status: 404 })
    },
  })
  const url = `${server.url}?session=${token}`
  console.log(url)
  let stopping = false
  const stop = () => {
    if (stopping) return
    stopping = true
    server.stop(true)
    const timeout = setTimeout(() => {
      console.error('Native backend shutdown exceeded two seconds.')
      process.exit(1)
    }, 2000)
    void Promise.resolve().then(() => options.shutdown?.()).then(() => {
      clearTimeout(timeout)
      process.exit(0)
    }, () => {
      clearTimeout(timeout)
      console.error('Native backend shutdown failed.')
      process.exit(1)
    })
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  if (process.argv.includes('--managed')) {
    // The native parent holds this pipe open. EOF is also delivered when the
    // parent crashes or AppKit terminates without unwinding Zig defers.
    void (async () => {
      try { for await (const _ of Bun.stdin.stream()) { /* lifetime lease */ } }
      finally { stop() }
    })()
  }
}
