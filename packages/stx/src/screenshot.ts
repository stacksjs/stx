/**
 * Screenshot capture for stx pages — powered by Bun's native `WebView`.
 *
 * Renders a built HTML file, a `file://`/`http(s)://` URL, or every `*.html` in
 * a directory to a PNG using {@link https://bun.com/reference/bun/WebView Bun's headless WebView}.
 * On macOS this uses the system WebKit (`WKWebView`) — **zero external
 * dependencies, no browser to install**. On other platforms pass
 * `backend: 'chrome'` (uses an installed Chrome via the DevTools protocol).
 */

import { WebView } from 'bun'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/** WebView viewport dimensions are clamped to [1, 16384] by Bun. */
const MAX_DIMENSION = 16384

export interface ScreenshotOptions {
  /** Viewport width in CSS px. @default 1440 */
  width?: number
  /** Viewport height in CSS px. @default 2200 */
  height?: number
  /** ms to let the page settle after navigation before capturing. @default 800 */
  waitMs?: number
  /** Hard cap on waiting for navigation to finish. @default 15000 */
  timeoutMs?: number
  /** Image format. @default 'png' */
  format?: 'png' | 'jpeg' | 'webp'
  /** WebView backend. macOS defaults to system WebKit; elsewhere use 'chrome'. */
  backend?: 'webkit' | 'chrome'
  /**
   * Capture the entire scrollable page rather than just the viewport. The page
   * is measured (`scrollHeight`) and re-rendered at its full height so nothing
   * is cut off — ideal for long pages (dashboards, docs). Clamped to WebView's
   * 16384px ceiling. @default false
   */
  fullPage?: boolean
  /**
   * Wait until this CSS selector is present in the DOM before capturing (polls
   * the page via `evaluate`). Use for content that renders after load (data
   * fetched client-side, hydration, fonts swapped in).
   */
  waitSelector?: string
}

export interface ShotResult {
  input: string
  output: string
  bytes: number
}

/** Turn an input (path or URL) into a navigable URL. */
function toUrl(input: string): string {
  if (/^https?:\/\//.test(input) || input.startsWith('file://'))
    return input
  return `file://${path.resolve(input)}`
}

/** Resolve once navigation completes (+ a short settle), with a timeout fallback. */
function waitForNavigation(view: any, waitMs: number, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false
    const finish = (): void => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    view.onNavigated = () => setTimeout(finish, waitMs)
    setTimeout(finish, timeoutMs)
  })
}

/** Poll the page until `selector` exists, or `timeoutMs` elapses (best-effort). */
async function waitForSelector(view: any, selector: string, timeoutMs: number): Promise<void> {
  const expr = `!!document.querySelector(${JSON.stringify(selector)})`
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (await view.evaluate(expr))
        return
    }
    catch {
      // Navigation may still be settling; keep polling until the deadline.
    }
    await new Promise(r => setTimeout(r, 100))
  }
}

/** Measure the full scrollable document height in CSS px (0 on failure). */
async function measureFullHeight(view: any): Promise<number> {
  try {
    const h = await view.evaluate(
      'Math.ceil(Math.max('
      + 'document.documentElement.scrollHeight, document.documentElement.offsetHeight, '
      + 'document.body ? document.body.scrollHeight : 0, document.body ? document.body.offsetHeight : 0))',
    )
    return typeof h === 'number' && Number.isFinite(h) && h > 0 ? Math.min(h, MAX_DIMENSION) : 0
  }
  catch {
    return 0
  }
}

/** Capture a single page to `output` using Bun's headless WebView. */
export async function captureScreenshot(input: string, output: string, opts: ScreenshotOptions = {}): Promise<ShotResult> {
  const width = Math.min(opts.width ?? 1440, MAX_DIMENSION)
  const height = Math.min(opts.height ?? 2200, MAX_DIMENSION)
  const waitMs = opts.waitMs ?? 800
  const timeoutMs = opts.timeoutMs ?? 15000
  const format = opts.format ?? 'png'
  const url = toUrl(input)

  const open = (h: number): any => new WebView({
    url,
    width,
    height: h,
    headless: true,
    ...(opts.backend ? { backend: opts.backend } : {}),
  } as any)

  let view = open(height)
  try {
    await waitForNavigation(view, waitMs, timeoutMs)
    if (opts.waitSelector)
      await waitForSelector(view, opts.waitSelector, timeoutMs)

    // Full-page: WebView has no resize(), so measure the document and re-render
    // at its full height. Only re-render when the page is actually taller than
    // the current viewport (a no-op otherwise).
    if (opts.fullPage) {
      const full = await measureFullHeight(view)
      if (full > height) {
        view.close()
        view = open(full)
        await waitForNavigation(view, waitMs, timeoutMs)
        if (opts.waitSelector)
          await waitForSelector(view, opts.waitSelector, timeoutMs)
      }
    }

    const buf = await view.screenshot({ encoding: 'buffer', format } as any)
    mkdirSync(path.dirname(path.resolve(output)), { recursive: true })
    await Bun.write(output, buf as any)
  }
  finally {
    view.close()
  }

  if (!existsSync(output))
    throw new Error(`Screenshot was not produced for ${input}`)
  return { input, output, bytes: statSync(output).size }
}

/**
 * Capture `input` — a file, URL, or directory of `*.html` — to PNG(s) in
 * `outDir`. Returns one result per page.
 */
export async function captureScreenshots(input: string, outDir: string, opts: ScreenshotOptions = {}): Promise<ShotResult[]> {
  mkdirSync(outDir, { recursive: true })

  let pages: string[]
  if (!/^https?:\/\//.test(input) && existsSync(input) && statSync(input).isDirectory())
    pages = readdirSync(input).filter(f => f.endsWith('.html')).map(f => path.join(input, f))
  else
    pages = [input]

  const ext = opts.format ?? 'png'
  const results: ShotResult[] = []
  for (const page of pages) {
    const name = /^https?:\/\//.test(page)
      ? new URL(page).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'index'
      : path.basename(page).replace(/\.html?$/, '')
    // Captured sequentially — one WebView at a time keeps memory + WebKit happy.
    results.push(await captureScreenshot(page, path.join(outDir, `${name}.${ext}`), opts))
  }
  return results
}
