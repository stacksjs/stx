/**
 * Drivly — standalone dev server
 *
 * Runs the drivly example without depending on the `stx dev` CLI.
 * Routes based on file system convention:
 *   /                  → pages/index.stx
 *   /search            → pages/search.stx
 *   /cars/:id          → pages/cars/[id].stx  (params.id available)
 *   /book/:id          → pages/book/[id].stx
 *   /host/dashboard    → pages/host/dashboard.stx
 *   /<anything>        → pages/<anything>.stx
 *
 * Usage:
 *   bun examples/drivly/serve.ts
 */

import path from 'node:path'
import { processDirectives, injectRouterScript } from '../../packages/stx/src/process'
import { extractVariables } from '../../packages/stx/src/variable-extractor'
import { interpolateScriptExpressions } from '../../packages/stx/src/expressions'

const ROOT = path.resolve(import.meta.dir)
const PAGES = path.join(ROOT, 'pages')

async function fileExists(p: string): Promise<boolean> {
  try {
    return await Bun.file(p).exists()
  }
  catch {
    return false
  }
}

/**
 * Resolve a URL pathname to a concrete .stx file.
 * Supports both static files and dynamic segments [id].stx.
 */
async function resolvePage(pathname: string): Promise<{ file: string, params: Record<string, string> } | null> {
  // Normalize: /foo/ → /foo, '' → '/'
  let p = pathname.replace(/\/+$/, '')
  if (!p) p = '/'

  // Root
  if (p === '/') {
    const idx = path.join(PAGES, 'index.stx')
    return (await fileExists(idx)) ? { file: idx, params: {} } : null
  }

  // 1. Exact match: /foo/bar → pages/foo/bar.stx
  const direct = path.join(PAGES, p + '.stx')
  if (await fileExists(direct)) return { file: direct, params: {} }

  // 2. Index: /foo → pages/foo/index.stx
  const asIndex = path.join(PAGES, p, 'index.stx')
  if (await fileExists(asIndex)) return { file: asIndex, params: {} }

  // 3. Dynamic: walk directory, match [param].stx
  // Example: /cars/tesla-model-3 → pages/cars/[id].stx with { id: 'tesla-model-3' }
  const segments = p.split('/').filter(Boolean)
  const last = segments.pop()!
  const parentDir = path.join(PAGES, ...segments)

  const { readdirSync, statSync } = await import('node:fs')
  try {
    if (statSync(parentDir).isDirectory()) {
      const entries = readdirSync(parentDir)
      const dynamicEntry = entries.find((e: string) => /^\[[^\]]+\]\.stx$/.test(e))
      if (dynamicEntry) {
        const paramName = dynamicEntry.slice(1, -5)
        return {
          file: path.join(parentDir, dynamicEntry),
          params: { [paramName]: decodeURIComponent(last) },
        }
      }
    }
  }
  catch {}

  return null
}

const STX_OPTIONS = {
  componentsDir: path.join(ROOT, 'components'),
  layoutsDir: path.join(ROOT, 'layouts'),
  partialsDir: path.join(ROOT, 'partials'),
}

async function renderPage(resolved: { file: string, params: Record<string, string> }): Promise<string> {
  const raw = await Bun.file(resolved.file).text()

  // Extract ONLY <script server> blocks — they run here for variable extraction
  // and must not leak into the rendered HTML. Every other script type
  // (<script>, <script client>, type="module", signal-using) stays in the
  // template so processDirectives/processSignals can consolidate them into a
  // single __stx_setup_ function. Removing them here splits layout signals
  // from page signals into separate scopes and breaks :text/:show bindings
  // on pages where both exist (e.g. /host/list).
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  const serverScripts: string[] = []
  let template = raw
  let m: RegExpExecArray | null
  while ((m = scriptRegex.exec(raw)) !== null) {
    if (/\bserver\b/.test(m[1])) {
      serverScripts.push(m[2])
      template = template.replace(m[0], '')
    }
  }

  const ctx: Record<string, any> = {
    __filename: resolved.file,
    __dirname: path.dirname(resolved.file),
    params: resolved.params,
  }
  for (const s of serverScripts) {
    await extractVariables(s, ctx, resolved.file)
  }

  const deps = new Set<string>()
  let html = await processDirectives(template, ctx, resolved.file, STX_OPTIONS, deps)

  // Interpolate {{ expr }} / {!! expr !!} only inside the merged __stx_setup_
  // function. A template-wide interpolation would match `{{ … }}` inside the
  // signals runtime's own regex literals (e.g. /{{\s*(.+?)\s*}}/) and crash
  // on evaluation. The setup function is the one place user `<script client>`
  // bodies live after processScriptSetup's merge.
  html = html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
    (full, attrs: string, body: string) => {
      if (!/function\s+__stx_setup_/.test(body)) return full
      return `<script${attrs}>${interpolateScriptExpressions(body, ctx)}</script>`
    },
  )

  // Inject the canonical SPA router. Standalone serve.ts bypasses the
  // main render pipeline, so we hook it in here — otherwise we miss the
  // built-in progress bar + click interception on StxLink elements.
  html = await injectRouterScript(html)
  return html
}

const PORT = Number(process.env.PORT) || 3131
const server = Bun.serve({
  port: PORT,
  development: true,
  async fetch(req) {
    const url = new URL(req.url)
    const pathname = url.pathname

    // Static asset passthrough from /public
    if (/\.(css|js|map|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$/.test(pathname)) {
      const pub = path.join(ROOT, 'public', pathname)
      if (await fileExists(pub)) return new Response(Bun.file(pub))
      return new Response('Not found', { status: 404 })
    }

    try {
      const resolved = await resolvePage(pathname)
      if (!resolved) {
        return new Response('<h1>404</h1><p>Page not found</p><p><a href="/">Home</a></p>', {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        })
      }
      const html = await renderPage(resolved)
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
    catch (err: any) {
      console.error('Error rendering', pathname, err)
      return new Response('<pre>' + String(err?.stack || err) + '</pre>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    }
  },
})

console.log('\n  🚗 Drivly running at ' + server.url)
console.log('     Try: /, /search, /cars/tesla-model-3-2024, /book/porsche-911-carrera-2023\n')
