/**
 * A web view's stores on a native screen: the app's `storesDir` is bundled
 * into the screen ahead of its scripts, as the page loads it ahead of its
 * own, so `useStore` finds what `defineStore` made. A screen has one
 * instance of each store, which the view and its components share.
 */
import { expect, test } from 'bun:test'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { mountWebView, webApp } from './web-view-app'

const CART = `import { defineStore, state, derived } from '@stacksjs/stx'

export const cart = defineStore('cart', () => {
  const items = state([])
  const count = derived(() => items().length)
  function add(name) { items.set([...items(), name]) }
  return { items, count, add }
})
`

test('useStore finds the app\'s stores on a native screen', async () => {
  const root = webApp({
    'stores/cart.ts': CART,
    'views/shop.stx': `<script client>
  const cart = useStore('cart')
  const count = cart.count
  function add() { cart.add('socks') }
</script>
<div>
  <p :text="'In the cart: ' + count">In the cart</p>
  <button testid="add" @click="add()">Add</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Shop: 'views/shop.stx' }, 'Shop')
  expect(phone.texts()).toContain('In the cart: 0')
  phone.press(phone.byTestID('add')!)
  await phone.settle()
  expect(phone.texts()).toContain('In the cart: 1')
})

test('the view and its components share one instance of a store', async () => {
  const root = webApp({
    'stores/cart.ts': CART,
    'components/CartBadge.stx': `<script client>
  const cart = useStore('cart')
  const count = cart.count
</script>
<span :text="'Badge ' + count">Badge</span>
`,
    'views/shop.stx': `<script client>
  const cart = useStore('cart')
  function add() { cart.add('hat') }
</script>
<div>
  <CartBadge />
  <button testid="add" @click="add()">Add</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Shop: 'views/shop.stx' }, 'Shop')
  expect(phone.texts()).toContain('Badge 0')
  phone.press(phone.byTestID('add')!)
  phone.press(phone.byTestID('add')!)
  await phone.settle()
  expect(phone.texts()).toContain('Badge 2')
})

test('a screen that reads no store does not carry the stores, nor run them', async () => {
  const root = webApp({
    'stores/cart.ts': `${CART}
localStorage.setItem('cart-store-ran', 'yes')
`,
    'views/about.stx': `<script client>
  const shown = state('About us')
</script>
<div><p :text="shown">…</p></div>
`,
    'views/shop.stx': `<script client>
  const cart = useStore('cart')
  const count = cart.count
</script>
<div><p :text="'In the cart: ' + count">…</p></div>
`,
  })
  const { code } = await compileNativeBundle({ root, screens: { About: 'views/about.stx' } })
  expect(code).not.toContain('cart-store-ran')
  const about = await mountWebView(root, { About: 'views/about.stx' }, 'About')
  expect(about.texts()).toContain('About us')
  expect(about.stored['stx.localStorage:cart-store-ran']).toBeUndefined()
  const shop = await mountWebView(root, { Shop: 'views/shop.stx' }, 'Shop')
  expect(shop.texts()).toContain('In the cart: 0')
  expect(shop.stored['stx.localStorage:cart-store-ran']).toBe('yes')
})
