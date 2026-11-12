/**
 * A page of components in a real browser, for the tests that need one.
 *
 * What a virtualized list draws, where a menu lands, what a drag does to a
 * layout: none of it is visible to a DOM emulator, which lays nothing out. This
 * renders an stx page the way the dev server would, serves it, and opens it in
 * a headless engine. WebKit where there is one, since a Craft window is a
 * WKWebView.
 */
import { WebView } from 'bun'
import { resolve } from 'node:path'
import { generateCss } from '../../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../../stx/src/process'

const ROOT = resolve(import.meta.dir, '../..')
const APPLE = process.platform === 'darwin'

export interface BrowserPage {
  /** Run a function body in the page and return what it returns. */
  run: <T = unknown>(body: string) => Promise<T>
  /** The same, for anything JSON can carry. Awaits a returned promise. */
  json: <T = any>(body: string) => Promise<T>
  /** Wait until an expression is truthy in the page. */
  until: (expression: string, attempts?: number) => Promise<boolean>
  /** Script errors the page has raised since it loaded. */
  errors: () => Promise<string[]>
  close: () => void
  apple: boolean
}

export interface BrowserPageOptions {
  /** The body of the page: stx markup, with a `<script client>` if it needs one. */
  body: string
  /** Values the page's `{{ }}` expressions can read. */
  context?: Record<string, unknown>
  /** A name for the page file, which stx uses for its scope ids. */
  name: string
  width?: number
  height?: number
  /** An expression that is truthy once the page is ready to be tested. */
  ready: string
}

export async function openBrowserPage(options: BrowserPageOptions): Promise<BrowserPage> {
  const source = `<!doctype html><html><head><meta charset="utf-8"><script>window.__errors=[];window.addEventListener('error',function(e){window.__errors.push(String(e.message))});window.addEventListener('unhandledrejection',function(e){window.__errors.push('rejection: '+String(e.reason))})</script></head><body style="margin:0">${options.body}</body></html>`
  const html = await processDirectives(source, options.context ?? {}, resolve(ROOT, `${options.name}.stx`), { componentsDir: resolve(ROOT, 'src/ui'), root: ROOT, cache: false, debug: false } as any, new Set())
  const css = await generateCss(html, ROOT)
  const page = html.replace('</head>', `<style>${css}</style></head>`)

  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch: () => new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  })
  const view = new WebView({ headless: true, width: options.width ?? 1000, height: options.height ?? 800, backend: APPLE ? { type: 'webkit' } : { type: 'chrome', url: false } } as any)
  await view.navigate(server.url.href)

  const run = <T = unknown>(body: string): Promise<T> => view.evaluate(`(() => { ${body} })()`) as Promise<T>
  const json = async <T = any>(body: string): Promise<T> => JSON.parse(await run<string>(`return Promise.resolve((() => { ${body} })()).then(result => JSON.stringify(result === undefined ? null : result))`))
  const until = async (expression: string, attempts = 200): Promise<boolean> => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (await view.evaluate(`Boolean(${expression})`))
        return true
      await Bun.sleep(25)
    }
    return false
  }

  if (!await until(options.ready)) {
    const errors = await json<string[]>('return window.__errors')
    view.close()
    server.stop(true)
    throw new Error(`The page never became ready (${options.ready}). Script errors: ${JSON.stringify(errors)}`)
  }

  return {
    run,
    json,
    until,
    errors: () => json<string[]>('return window.__errors'),
    close: () => {
      view.close()
      server.stop(true)
    },
    apple: APPLE,
  }
}

/** Helpers every page script can use: synthetic pointer, mouse and key events. */
export const EVENTS = `
  const pointer = (target, type, x, y, extra) => target.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }, extra || {})))
  const mouse = (target, type, x, y, extra) => target.dispatchEvent(new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0 }, extra || {})))
  const press = (target, key, extra) => target.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, extra || {})))
  const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
`
