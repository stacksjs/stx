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

function installRouter(html: string, fetchImpl: typeof fetch) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
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
