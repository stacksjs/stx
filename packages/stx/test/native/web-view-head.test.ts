/**
 * `useHead` on a native screen: the title names the screen, as `<title>`
 * names a browser tab, so it becomes the navigation title. Everything else a
 * page puts in its head (meta, links, html and body attributes) has nothing
 * to go to on a phone and is ignored, without the screen failing on it.
 */
import { expect, test } from 'bun:test'
import { mountWebView, webApp } from './web-view-app'

const titles = (bars: any[]): string[] => bars.filter(bar => 'title' in bar).map(bar => bar.title)

test('a server script\'s useHead title is the navigation title', async () => {
  const root = webApp({
    'views/billing.stx': `<script server>
  useHead({ title: 'Billing' })
</script>
<div><p>Plans</p></div>
`,
  })
  const phone = await mountWebView(root, { Billing: 'views/billing.stx' }, 'Billing')
  expect(titles(phone.bars)).toEqual(['Billing'])
})

test('a client useHead title, and every later one, is the navigation title', async () => {
  const root = webApp({
    'views/inbox.stx': `<script client>
  const unread = state(2)
  useHead({ title: 'Inbox' })
  function read() {
    unread.set(0)
    useHead({ title: 'Inbox (read)' })
  }
</script>
<div><button testid="read" @click="read()">Read all</button></div>
`,
  })
  const phone = await mountWebView(root, { Inbox: 'views/inbox.stx' }, 'Inbox')
  expect(titles(phone.bars)).toEqual(['Inbox'])
  phone.press(phone.byTestID('read')!)
  await phone.settle()
  expect(titles(phone.bars)).toEqual(['Inbox', 'Inbox (read)'])
  expect(phone.context.document.title).toBe('Inbox (read)')
})

test('meta tags, links and document attributes are ignored', async () => {
  const root = webApp({
    'views/about.stx': `<script client>
  useHead({
    title: 'About',
    meta: [{ name: 'description', content: 'Who we are' }],
    link: [{ rel: 'canonical', href: 'https://example.test/about' }],
    htmlAttrs: { lang: 'de', class: 'dark' },
    bodyAttrs: { class: 'about-page' },
  })
  useSeoMeta({ description: 'Who we are', ogTitle: 'About us' })
  const shown = state('ready')
</script>
<div><p :text="shown">loading</p></div>
`,
  })
  const phone = await mountWebView(root, { About: 'views/about.stx' }, 'About')
  expect(phone.texts()).toContain('ready')
  // useSeoMeta names the page by its ogTitle, as it does document.title on the web.
  expect(titles(phone.bars)).toEqual(['About', 'About us'])
})
