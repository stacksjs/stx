/**
 * A prop written as a plain attribute reaches `useReactiveProp` with its type.
 *
 * Props are serialized into `data-stx-props` as written, and an attribute is a
 * string, so `<Pagination totalPages="10" currentPage="1" />` handed the
 * client "1". The server half already read it with `$num`; the client half
 * read it through `useReactiveProp`, which parsed a value from a live
 * attribute but passed one from `data-stx-props` through untouched. `"1" + 1`
 * is `"11"`, the page-range maths took its both-ellipses branch, and ten pages
 * rendered as `1 ... 1 2 3 4 5 6 7 8 9 10 ... 10`.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

const FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/Typed.stx': `<script client>
const count = useReactiveProp('count', 0)
const label = useReactiveProp('label', '')
const flag = useReactiveProp('flag', false)
window.TYPED = { count: count(), next: count() + 1, label: label(), flag: flag() }
</script>
<div class="typed">typed</div>
`,
  'views/typed.stx': page('default', `<div><Typed count="3" label="42" flag="false" /></div>`),
}

describe('a prop written as a plain attribute', () => {
  it('is a number where the component expects one, and keeps strings and booleans as they are', async () => {
    const app = await renderApp(FILES, { '/typed': 'views/typed.stx' })
    const browser = await boot(app, '/typed')

    expect(browser.window.TYPED).toEqual({ count: 3, next: 4, label: '42', flag: false })
    expect(browser.errors).toEqual([])

    await app.dispose()
  })

  it.each(['srcset', 'src-set'])('retains typed clears through the %s alias instead of restoring a static default', async (spelling) => {
    const app = await renderApp({
      ...FILES,
      'components/Alias.stx': `<script client>
const value = useReactiveProp('srcSet', '/default.png')
const count = useReactiveProp('count', 0)
const flag = useReactiveProp('flag', true)
effect(() => { window.aliasValue = value() })
effect(() => { window.typedDefaults = { count: count(), flag: flag() } })
</script><div>alias</div>`,
      'views/alias.stx': page('default', `<script client>
const value = state('/new.png')
const count = state(9)
const flag = state(true)
window.parentValue = value
window.parentCount = count
window.parentFlag = flag
</script><section><Alias srcSet="/initial.png" :${spelling}="value" count="3" :count="count" flag="false" :flag="flag" /></section>`),
    }, { '/alias': 'views/alias.stx' })
    try {
      const browser = await boot(app, '/alias')
      await settle()
      expect(browser.window.aliasValue).toBe('/new.png')
      for (const value of [null, '', '/again.png', null]) {
        browser.window.parentValue.set(value)
        await settle()
        expect(browser.window.aliasValue).toBe(value)
      }
      browser.window.parentValue.set(undefined)
      await settle()
      expect(browser.window.aliasValue).toBe('/initial.png')
      expect(browser.window.typedDefaults).toEqual({ count: 9, flag: true })
      browser.window.parentCount.set(null)
      browser.window.parentFlag.set(null)
      await settle()
      expect(browser.window.typedDefaults).toEqual({ count: null, flag: null })
      browser.window.parentCount.set(undefined)
      browser.window.parentFlag.set(undefined)
      await settle()
      expect(browser.window.typedDefaults).toEqual({ count: 3, flag: false })
      browser.window.parentValue.set('/before-batch.png')
      await settle()
      browser.window.parentValue.set(null)
      browser.window.parentValue.set(undefined)
      await settle()
      expect(browser.window.aliasValue).toBe('/initial.png')
      expect(browser.errors).toEqual([])
    }
    finally { closeBrowser(); await app.dispose() }
  })
})
