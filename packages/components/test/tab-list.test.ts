/**
 * TabList: a tab strip whose selection and panels belong to the page
 * (stacksjs/stx#2058). Driven by the real runtime through the SPA harness.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')
const component = (rel: string) => readFileSync(path.join(UI, rel), 'utf-8')

const FILES = {
  'layouts/app.stx': layout(''),
  'components/TabList.stx': component('tabs/TabList.stx'),
  'components/Tab.stx': component('tabs/Tab.stx'),
  'pages/static.stx': page('app', `<script client>
const pageTab = state('sales')
const changes = []
window.PAGE = { pageTab, changes }
</script>
<TabList v-model:value="pageTab" label="Store sections" @change="changes.push($event)">
  <Tab value="products" controls="p-products">Products</Tab>
  <Tab value="coupons" controls="p-coupons" disabled>Coupons</Tab>
  <Tab value="sales" controls="p-sales">Sales</Tab>
</TabList>
<section :if="pageTab === 'sales'" id="p-sales" role="tabpanel">Sales panel</section>`),
  'pages/loop.stx': page('app', `<script client>
const filter = state('')
const options = state([{ value: 'all', label: 'All' }, { value: 'run', label: 'Run' }])
window.PAGE = { filter, options }
</script>
<TabList v-model:value="filter" label="Show" variant="pills" orientation="vertical">
  <button :for="o in options" :key="o.value" type="button" role="tab" :data-value="o.value">{{ o.label }}</button>
</TabList>`),
}

const ROUTES = { '/static': 'pages/static.stx', '/loop': 'pages/loop.stx' }

async function open(route: string) {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, route)
  await settle()
  return { browser, dispose: () => app.dispose() }
}

function tabs(browser: any): any[] {
  return Array.from(browser.document.querySelectorAll('[role="tab"]'))
}

function state(browser: any): string[] {
  return tabs(browser).map((t: any) => `${t.textContent.trim()}:${t.getAttribute('aria-selected')}/${t.getAttribute('tabindex')}`)
}

function press(browser: any, el: any, key: string) {
  el.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

afterEach(() => closeBrowser())

describe('TabList', () => {
  it('is a named tablist whose tabs point at their panels', async () => {
    const { browser, dispose } = await open('/static')
    try {
      const list = browser.document.querySelector('[role="tablist"]')
      expect(list.getAttribute('aria-label')).toBe('Store sections')
      expect(tabs(browser).map((t: any) => t.getAttribute('aria-controls'))).toEqual(['p-products', 'p-coupons', 'p-sales'])
    }
    finally { await dispose() }
  })

  it('marks the page\'s selection, with one tab stop on it', async () => {
    const { browser, dispose } = await open('/static')
    try {
      expect(state(browser)).toEqual(['Products:false/-1', 'Coupons:false/-1', 'Sales:true/0'])
    }
    finally { await dispose() }
  })

  it('follows the page\'s signal when it changes', async () => {
    const { browser, dispose } = await open('/static')
    try {
      browser.window.PAGE.pageTab.set('products')
      await settle()
      expect(state(browser)).toEqual(['Products:true/0', 'Coupons:false/-1', 'Sales:false/-1'])
    }
    finally { await dispose() }
  })

  it('selects on click and writes back to the page', async () => {
    const { browser, dispose } = await open('/static')
    try {
      const list = browser.document.querySelector('[role="tablist"]')
      const scope = browser.window.stx._scopes[list.closest('[data-stx-scope]').getAttribute('data-stx-scope')]
      scope.onClick({ target: tabs(browser)[0] })
      await settle()
      expect(browser.window.PAGE.pageTab()).toBe('products')
      expect(browser.window.PAGE.changes).toEqual(['products'])
      expect(state(browser)[0]).toBe('Products:true/0')
    }
    finally { await dispose() }
  })

  it('moves and selects with the arrows, Home and End, skipping a disabled tab', async () => {
    const { browser, dispose } = await open('/static')
    try {
      const [products, , sales] = tabs(browser)
      press(browser, sales, 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.pageTab()).toBe('products')
      expect(browser.document.activeElement).toBe(products)

      press(browser, products, 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.pageTab()).toBe('sales')

      press(browser, sales, 'Home')
      await settle()
      expect(browser.window.PAGE.pageTab()).toBe('products')
      press(browser, products, 'End')
      await settle()
      expect(browser.window.PAGE.pageTab()).toBe('sales')
    }
    finally { await dispose() }
  })

  it('works with plain role="tab" rows a :for renders, and keeps up as they change', async () => {
    const { browser, dispose } = await open('/loop')
    try {
      // Nothing selected yet: the first tab is still reachable.
      expect(state(browser)).toEqual(['All:false/0', 'Run:false/-1'])

      press(browser, tabs(browser)[0], 'ArrowDown')
      await settle()
      expect(browser.window.PAGE.filter()).toBe('run')

      browser.window.PAGE.options.set([...browser.window.PAGE.options(), { value: 'ride', label: 'Ride' }])
      await settle(20)
      expect(state(browser)).toEqual(['All:false/-1', 'Run:true/0', 'Ride:false/-1'])
    }
    finally { await dispose() }
  })
})
