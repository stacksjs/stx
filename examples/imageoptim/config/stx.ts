/**
 * stx config for the ImageOptim example.
 *
 * The `/optimize` endpoint is registered as an `apiRoute` so the standard
 * `stx dev` machinery serves both the page and the API. That means you can
 * run this example via `./bin/stx examples/imageoptim [--native]` from the
 * repo root — no custom server bootstrap needed.
 */

import type { StxConfig } from '../../../packages/stx/src/types'
import { optimize } from '../optimize'

/** Hard cap so a runaway upload can't OOM the dev server. */
const MAX_UPLOAD_BYTES = 256 * 1024 * 1024 // 256 MB

const config: Partial<StxConfig> = {
  pagesDir: 'pages',
  componentsDir: 'components',
  // `@include('DropZone')` resolves against partialsDir (default: 'partials/').
  // Point it at components/ so we don't need a separate directory just for
  // the small bits of chrome the page composes.
  partialsDir: 'components',
  cache: false,
  debug: false,
  app: {
    head: {
      title: 'ImageOptim',
    },
    // Real ImageOptim runs at roughly 640×500 logical pixels — a small
    // utility window. Anything larger looks comically big for what's
    // really just a drop target + a list.
    window: {
      width: 640,
      height: 500,
      darkMode: false,
      hotReload: true,
    },
  } as any,
  // Disable the auto-injected social-preview / SEO meta. They default to
  // "stx Project" / "A website built with stx templating engine", which
  // makes no sense for a local desktop app and clutters the head.
  seo: {
    enabled: false,
    socialPreview: false,
    defaultConfig: {
      title: 'ImageOptim',
      description: '',
    },
  } as any,
  apiRoutes: {
    '/optimize': async (req: Request) => {
      if (req.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { allow: 'POST' },
        })
      }

      const url = new URL(req.url)
      const path = url.searchParams.get('path')

      // Path mode: native file drop posted real filesystem paths via the
      // craft `onFileDrop` bridge. Read the file ourselves, optimize, and
      // (when smaller) write back in place. This is the *real* ImageOptim
      // workflow — drop a file, the file shrinks. Browsers can't surface
      // paths from JS drops, so this branch is only ever hit when running
      // via `--native` with a Craft binary that has the file-drop hook.
      if (path) {
        return optimizeOnDisk(path)
      }

      // Reject early on Content-Length to avoid buffering anything we'd
      // refuse anyway.
      const cl = req.headers.get('content-length')
      if (cl && Number(cl) > MAX_UPLOAD_BYTES) {
        return new Response(`Payload Too Large (max ${MAX_UPLOAD_BYTES} bytes)`, { status: 413 })
      }

      const name = url.searchParams.get('name') ?? 'image'
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''

      const bodyBytes = new Uint8Array(await req.arrayBuffer())
      if (bodyBytes.length > MAX_UPLOAD_BYTES) {
        return new Response(`Payload Too Large (max ${MAX_UPLOAD_BYTES} bytes)`, { status: 413 })
      }

      try {
        const result = await optimize(bodyBytes, ext)
        return resultResponse(result.bytes, {
          format: result.format,
          inputSize: result.inputSize,
          outputSize: result.outputSize,
          saved: result.saved,
          savedPct: result.savedPct,
          passthrough: result.passthrough,
          note: result.note ?? null,
          detail: result.detail ?? null,
        })
      }
      catch (err) {
        console.error('[/optimize] error:', err)
        return new Response(`Optimize failed: ${(err as Error).message}`, { status: 500 })
      }
    },
  },
}

async function optimizeOnDisk(path: string): Promise<Response> {
  // Path must be absolute. The native bridge always sends absolute paths
  // (NSURL.path is absolute), so a relative path here means a malicious
  // or buggy client — refuse rather than silently resolving against cwd.
  if (!path.startsWith('/')) {
    return new Response('path must be absolute', { status: 400 })
  }

  // Reject anything that isn't a regular file. Bun.file() happily
  // returns a handle for directories; trying to optimize a directory
  // would either return zero bytes or read every entry concatenated,
  // both of which would corrupt user data. Symlinks pointing outside
  // the user's expected scope are similar — refuse and force the user
  // to drop the underlying file.
  const { stat } = await import('node:fs/promises')
  let st: Awaited<ReturnType<typeof stat>>
  try {
    st = await stat(path)
  }
  catch {
    return new Response(`Not Found: ${path}`, { status: 404 })
  }
  if (!st.isFile()) {
    return new Response(`Not a regular file: ${path}`, { status: 400 })
  }

  const file = Bun.file(path)
  const size = file.size
  if (size > MAX_UPLOAD_BYTES) {
    return new Response(`Payload Too Large (max ${MAX_UPLOAD_BYTES} bytes)`, { status: 413 })
  }

  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const result = await optimize(bytes, ext)

    // Only write back when we actually made the file smaller. Writing
    // identical bytes would still bump mtime and trigger watchers for
    // no benefit; passing through preserves the original byte-for-byte.
    let wrote = false
    if (!result.passthrough && result.bytes.length < size) {
      await Bun.write(path, result.bytes)
      wrote = true
    }

    return resultResponse(new Uint8Array(0), {
      format: result.format,
      inputSize: result.inputSize,
      outputSize: result.outputSize,
      saved: result.saved,
      savedPct: result.savedPct,
      passthrough: result.passthrough,
      note: result.note ?? null,
      detail: result.detail ?? null,
      wrote,
      path,
    })
  }
  catch (err) {
    console.error('[/optimize on-disk] error:', err)
    return new Response(`Optimize failed: ${(err as Error).message}`, { status: 500 })
  }
}

function resultResponse(body: BodyInit, meta: Record<string, unknown>): Response {
  // HTTP header values must be ASCII (RFC 7230). Some notes contain
  // em-dashes / unicode, so we URI-encode the JSON.
  const m = { ...meta }
  if (typeof m.savedPct === 'number') m.savedPct = Number((m.savedPct as number).toFixed(3))
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'x-stx-result': encodeURIComponent(JSON.stringify(m)),
    },
  })
}

export default config
