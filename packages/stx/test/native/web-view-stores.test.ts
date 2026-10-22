/**
 * A web view's stores on a native screen: the app's `storesDir` is bundled
 * into the screen ahead of its scripts, as the page loads it ahead of its
 * own, so `useStore` finds what `defineStore` made. A screen has one
 * instance of each store, which the view and its components share.
 */
import { expect, test } from 'bun:test'
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
