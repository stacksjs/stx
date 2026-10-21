import { dirname, join } from 'node:path'

export interface NativeBackendOptions {
  html: string
  fetch: (request: Request) => Response | null | Promise<Response | null>
  title: string
  width: number
  height: number
  maxRequestBodySize?: number
  devTools?: boolean
}

/** Host an embedded app on an authenticated, ephemeral loopback origin. */
export async function runNativeBackend(options: NativeBackendOptions): Promise<void> {
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
  // A serve-only process supports CLI clients and packaged integration tests.
  if (process.argv.includes('--serve')) {
    console.log(url)
    const stop = () => { server.stop(true); process.exit(0) }
    process.once('SIGTERM', stop)
    process.once('SIGINT', stop)
    return
  }
  const craft = Bun.spawn([
    join(dirname(process.execPath), 'craft-runtime'), url,
    '--title', options.title, '--width', String(options.width), '--height', String(options.height),
    ...(options.devTools ? [] : ['--no-devtools']),
  ], { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
  const stop = () => { craft.kill('SIGTERM'); server.stop(true) }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  try { process.exitCode = await craft.exited }
  finally {
    server.stop(true)
    process.removeListener('SIGTERM', stop)
    process.removeListener('SIGINT', stop)
  }
}
