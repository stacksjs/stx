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

/** Capture a single page to `output` using Bun's headless WebView. */
export async function captureScreenshot(input: string, output: string, opts: ScreenshotOptions = {}): Promise<ShotResult> {
  const width = opts.width ?? 1440
  const height = opts.height ?? 2200
  const waitMs = opts.waitMs ?? 800
  const timeoutMs = opts.timeoutMs ?? 15000
  const format = opts.format ?? 'png'

  const view = new WebView({
    url: toUrl(input),
    width,
    height,
    headless: true,
    ...(opts.backend ? { backend: opts.backend } : {}),
  } as any)

  try {
    // Resolve once navigation completes (+ a short settle), with a timeout
    // fallback in case onNavigated never fires.
    await new Promise<void>((resolve) => {
      let settled = false
      const finish = (): void => {
        if (!settled) {
          settled = true
          resolve()
        }
      }
      const v = view as any
      v.onNavigated = () => setTimeout(finish, waitMs)
      setTimeout(finish, timeoutMs)
    })

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
