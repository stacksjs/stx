import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  fetch: globalThis.fetch,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

function installRouter(html: string, fetchImpl: typeof fetch, config: Record<string, unknown> = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
    ...config,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    fetch: fetchImpl,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
  })

  new Function(getRouterScript())()

  return window as Window & { stxRouter: any }
}

function response(html: string, headers: Record<string, string> = {}) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      ...headers,
    },
  })
}

async function waitForRouterSwap() {
  await new Promise(resolve => setTimeout(resolve, 180))
}

describe('router browser navigation behavior', () => {
  it('swaps only the container for same-layout fragments', async () => {
    const calls: string[] = []
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/shop/index.stx">
          <meta name="stx-layout-group" content="shop">
        </head>
        <body><nav>Shop nav</nav><main>Home</main></body>
      </html>
    `, async (url) => {
      calls.push(String(url))
      return response('<section>Gift boxes</section>', {
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/shop/index.stx',
        'X-STX-Layout-Group': 'shop',
      })
    })

    await window.stxRouter.navigate('/gifts?sort=popular')
    await waitForRouterSwap()

    expect(calls).toEqual(['/gifts?sort=popular'])
    expect(window.document.querySelector('nav')?.textContent).toBe('Shop nav')
    expect(window.document.querySelector('main')?.innerHTML).toContain('Gift boxes')
    expect(window.stxRouter.cache['/gifts?sort=popular']).toContain('Gift boxes')
  })

  it('fetches the full page for same-group layout identity changes', async () => {
    const calls: string[] = []
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/shop/index.stx">
          <meta name="stx-layout-group" content="shop">
        </head>
        <body><nav>Shop nav</nav><main>Home</main></body>
      </html>
    `, async (url, init) => {
      calls.push(`${String(url)}:${(init as RequestInit | undefined)?.headers ? JSON.stringify((init as RequestInit).headers) : ''}`)
      if ((init as RequestInit | undefined)?.headers && JSON.stringify((init as RequestInit).headers).includes('X-STX-Router')) {
        return response('<section>Product fragment</section>', {
          'X-STX-Fragment': 'true',
          'X-STX-Layout': 'layouts/shop/product.stx',
          'X-STX-Layout-Group': 'shop',
        })
      }

      return response(`
        <html>
          <head>
            <meta name="stx-layout" content="layouts/shop/product.stx">
            <meta name="stx-layout-group" content="shop">
          </head>
          <body><nav>Product nav</nav><main>Product full page</main></body>
        </html>
      `)
    })

    await window.stxRouter.navigate('/products/candle')
    await waitForRouterSwap()

    expect(calls.length).toBe(2)
    expect(window.document.querySelector('nav')?.textContent).toBe('Product nav')
    expect(window.document.querySelector('main')?.textContent).toContain('Product full page')
  })

  it('updates document.title from the X-STX-Title header on a fragment swap', async () => {
    const window = installRouter(`
      <html>
        <head>
          <title>Home</title>
          <meta name="stx-layout" content="layouts/site">
          <meta name="stx-layout-group" content="site">
        </head>
        <body><nav>Nav</nav><main>Home</main></body>
      </html>
    `, async () => {
      return response('<section>Writing</section>', {
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/site',
        'X-STX-Layout-Group': 'site',
        'X-STX-Title': encodeURIComponent('Blog - Chris Breuer'),
      })
    }, { interceptAllLinks: true })

    await window.stxRouter.navigate('/blog')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.innerHTML).toContain('Writing')
    expect(window.document.title).toBe('Blog - Chris Breuer')
  })

  it('does a native full navigation for non-stx documents instead of corrupting the shell', async () => {
    // A route on the same origin rendered by another engine (e.g. a BunPress
    // blog) carries none of the stx layout markers. The router must NOT splice
    // its <main> into the stx shell — it should hand off to a full navigation.
    const calls: string[] = []
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/site">
          <meta name="stx-layout-group" content="site">
        </head>
        <body><nav>Site nav</nav><main>Home</main></body>
      </html>
    `, async (url) => {
      calls.push(String(url))
      return response('<html><head><title>Docs</title></head><body><main>Foreign engine content</main></body></html>')
    }, { interceptAllLinks: true })

    await window.stxRouter.navigate('/blog')
    await waitForRouterSwap()

    // The stx shell keeps its own content; the foreign page is never spliced in.
    expect(window.document.querySelector('main')?.textContent).toContain('Home')
    expect(window.document.querySelector('main')?.textContent).not.toContain('Foreign engine content')
  })

  it('fetches full pages for custom app-shell containers', async () => {
    const calls: string[] = []
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body>
          <div data-shell>
            <nav>Home nav</nav>
            <main>Home</main>
          </div>
        </body>
      </html>
    `, async (url, init) => {
      calls.push(JSON.stringify((init as RequestInit | undefined)?.headers || {}))
      return response(`
        <html>
          <head>
            <meta name="stx-layout" content="layouts/app.stx">
            <meta name="stx-layout-group" content="app">
          </head>
          <body>
            <div data-shell>
              <nav>Queue nav</nav>
              <main>Queue full page</main>
            </div>
          </body>
        </html>
      `)
    }, { container: '[data-shell]' })

    await window.stxRouter.navigate('/queue')
    await waitForRouterSwap()

    expect(calls.length).toBe(1)
    expect(calls[0]).not.toContain('X-STX-Router')
    expect(window.document.querySelector('[data-shell] nav')?.textContent).toBe('Queue nav')
    expect(window.document.querySelector('[data-shell] main')?.textContent).toContain('Queue full page')
  })

  it('reruns scoped page scripts that live outside custom app-shell containers', async () => {
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body>
          <div data-shell>
            <nav>Home nav</nav>
            <main>Home</main>
          </div>
        </body>
      </html>
    `, async () => response(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body>
          <div data-shell>
            <nav>Composer nav</nav>
            <main><button id="add-post">Add</button><span id="count">0</span></main>
          </div>
          <script data-stx-scoped>
            document.getElementById('add-post')?.addEventListener('click', () => {
              const count = document.getElementById('count')
              count.textContent = String(Number(count.textContent || '0') + 1)
            })
          </script>
        </body>
      </html>
    `), { container: '[data-shell]' })

    await window.stxRouter.navigate('/composer')
    await waitForRouterSwap()

    const injectedScripts = [...window.document.querySelectorAll('script[data-stx-page]')]
      .map(script => script.textContent || '')
      .join('\n')

    expect(injectedScripts).toContain('add-post')
  })

  it('uses query-aware keys for prefetch cache entries', async () => {
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/shop/index.stx">
          <meta name="stx-layout-group" content="shop">
        </head>
        <body><main>Home</main></body>
      </html>
    `, async () => response('<section>Bath salts</section>', {
      'X-STX-Fragment': 'true',
      'X-STX-Layout': 'layouts/shop/index.stx',
      'X-STX-Layout-Group': 'shop',
    }))

    window.stxRouter.prefetch('/products?category=bath')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(window.stxRouter.cache['/products?category=bath']).toContain('Bath salts')
    expect(window.stxRouter.cache['/products']).toBeUndefined()
  })
})
