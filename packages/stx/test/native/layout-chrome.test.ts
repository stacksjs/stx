/**
 * The layout contract: a layout marks its chrome (`data-native-chrome`), and
 * a native screen does not draw it. Its links become the app's: `tabs` for
 * the tab bar (the bundle reports them for the app's tab configuration),
 * `bar` for the navigation bar's buttons. The content, and the overlays
 * beside it, render as on the web.
 */
import { expect, test } from 'bun:test'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { extractLayoutChrome } from '../../src/native/compiler/layout-chrome'
import { mountWebView, webApp } from './web-view-app'

test('takes the chrome out of the page and keeps its links', async () => {
  const { html, chrome } = await extractLayoutChrome(`
<nav data-native-chrome="tabs" class="flex">
  <a href="/today" data-native-icon="i-lucide-house">Today</a>
  <a href="/plans" class="px-2"><i class="i-lucide-calendar"></i>
    Plans </a>
  <a href="https://example.com/blog">Blog</a>
  <a href="#menu">Menu</a>
</nav>
<header data-native-chrome="bar">
  <div><a href="/settings" aria-label="Settings" class="i-lucide-settings"></a></div>
  <a href="/inbox" data-native-icon="tray">Inbox &amp; mail</a>
</header>
<main><p>Content</p></main>
<footer data-native-chrome><a href="/privacy">Privacy</a></footer>
<div id="toast"></div>`)
  expect(chrome).toEqual({
    tabs: [
      { path: '/today', title: 'Today', symbol: 'house' },
      { path: '/plans', title: 'Plans', symbol: 'calendar' },
    ],
    bar: [
      { path: '/settings', title: 'Settings', symbol: 'gearshape' },
      { path: '/inbox', title: 'Inbox & mail', symbol: 'tray' },
    ],
  })
  expect(html).not.toContain('data-native-chrome')
  expect(html).not.toContain('Privacy')
  expect(html).toContain('<main><p>Content</p></main>')
  expect(html).toContain('<div id="toast"></div>')
})

test('a page that marks no chrome is left as it is', async () => {
  const page = '<nav><a href="/a">A</a></nav><main>Hi</main>'
  expect(await extractLayoutChrome(page)).toEqual({ html: page, chrome: null })
})

const APP = {
  'partials/app-nav.stx': `<nav data-native-chrome="tabs">
  <a href="/today" data-native-icon="i-lucide-house">Today</a>
  <a href="/plans" data-native-icon="i-lucide-calendar">Plans</a>
</nav>
<header data-native-chrome="bar">
  <a href="/settings" aria-label="Settings"><i class="i-lucide-settings"></i></a>
</header>
`,
  'layouts/app.stx': `@include('app-nav')
<main class="p-4">
  @yield('content')
</main>
<footer data-native-chrome><p>Footer links</p></footer>
<div><p>Toast host</p></div>
`,
  'views/today.stx': `@extends('layouts/app')
@section('content')
<p>Today's sessions</p>
@endsection
`,
  'views/settings.stx': `@extends('layouts/app')
@section('content')
<p>Your settings</p>
@endsection
`,
}

test('a web view in a chromed layout draws its content, not the chrome', async () => {
  const phone = await mountWebView(webApp(APP), { Today: 'views/today.stx' }, 'Today')
  const texts = phone.texts()
  expect(texts).toContain('Today\'s sessions')
  expect(texts).toContain('Toast host')
  for (const chrome of ['Today', 'Plans', 'Footer links']) expect(texts).not.toContain(chrome)
})

test('the layout\'s bar links are navigation-bar buttons that open their paths', async () => {
  const root = webApp(APP)
  const phone = await mountWebView(root, { Today: 'views/today.stx' }, 'Today', { routeURL: '/today' })
  expect(phone.barButtons()).toEqual(['layout:/settings'])
  expect(phone.bars.findLast(bar => bar.rightButtons)?.rightButtons).toEqual([
    { id: 'layout:/settings', accessibilityLabel: 'Settings', symbol: 'gearshape' },
  ])
  phone.tapBar('layout:/settings')
  await phone.settle()
  expect(phone.opened).toEqual(['/settings'])
  // Not on the screen it opens.
  const settings = await mountWebView(root, { Settings: 'views/settings.stx' }, 'Settings', { routeURL: '/settings' })
  expect(settings.barButtons()).toEqual([])
})

test('the app\'s own chrome comes first, and keeps its button for the same path', async () => {
  const root = webApp({
    ...APP,
    'views/today.stx': `@extends('layouts/app')
@section('content')
<script client>
  onMount(() => {
    craft.navigation.setChrome({ rightButtons: [
      { id: 'account', symbol: 'person.crop.circle', open: '/account' },
      { id: 'settings', symbol: 'gear', open: '/settings' },
    ] })
  })
</script>
<p>Today's sessions</p>
@endsection
`,
  })
  const phone = await mountWebView(root, { Today: 'views/today.stx' }, 'Today', { routeURL: '/today' })
  expect(phone.barButtons()).toEqual(['account', 'settings'])
})

test('the bundle reports each screen\'s tabs, for the app\'s tab bar', async () => {
  const root = webApp(APP)
  const result = await compileNativeBundle({ root, screens: { Today: 'views/today.stx', Settings: 'views/settings.stx' } })
  const tabs = [
    { path: '/today', title: 'Today', symbol: 'house' },
    { path: '/plans', title: 'Plans', symbol: 'calendar' },
  ]
  expect(result.chrome?.Today?.tabs).toEqual(tabs)
  expect(result.chrome?.Settings?.tabs).toEqual(tabs)
  expect(result.chrome?.Today?.bar).toEqual([{ path: '/settings', title: 'Settings', symbol: 'gearshape' }])
})

test('the chrome\'s own scripts do not run on a phone, and the content\'s still do', async () => {
  // The site's nav reads the browser (a colour-scheme query, a menu's key
  // listener): leaving its markup out but running its setup broke the screen.
  const root = webApp({
    'components/SiteNav.stx': `<script client>
  globalThis.__navRan = true
  const scheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  const open = state(false)
</script>
<nav data-native-chrome class="flex"><a href="/today">Today</a><button @click="open.set(!open())">Menu</button></nav>
`,
    'components/Greeting.stx': `<script client>
  globalThis.__greetingRan = true
  const name = state('Ava')
</script>
<p>Hello {{ name }}</p>
`,
    'layouts/app.stx': `<SiteNav />
<main>@yield('content')</main>
`,
    'views/today.stx': `@extends('layouts/app')
@section('content')
<Greeting />
@endsection
`,
  })
  const ran = globalThis as { __navRan?: boolean, __greetingRan?: boolean }
  delete ran.__navRan
  delete ran.__greetingRan
  const phone = await mountWebView(root, { Today: 'views/today.stx' }, 'Today')
  expect(phone.texts()).toContain('Hello Ava')
  expect(phone.texts()).not.toContain('Menu')
  expect(phone.errors ?? []).toEqual([])
  const { code } = await compileNativeBundle({ root, screens: { Today: 'views/today.stx' } })
  expect(code).not.toContain('__navRan')
  expect(code).toContain('__greetingRan')
})

test('a component the chrome and the content both use still runs in the content', async () => {
  // Used twice, its setup is a shared factory, defined once ahead of the first
  // use: inside the chrome, here. Leaving the chrome out kept that definition.
  const root = webApp({
    'components/Badge.stx': `<script client>
  const count = state(3)
</script>
<span>{{ count }} new</span>
`,
    'components/SiteNav.stx': `<script client>
  const open = state(false)
</script>
<nav data-native-chrome class="flex"><a href="/today">Today</a><Badge /></nav>
`,
    'layouts/app.stx': `<SiteNav />
<main>@yield('content')</main>
`,
    'views/today.stx': `@extends('layouts/app')
@section('content')
<p>Inbox</p>
<Badge />
@endsection
`,
  })
  const phone = await mountWebView(root, { Today: 'views/today.stx' }, 'Today')
  expect(phone.texts()).toContain('Inbox')
  expect(phone.texts()).toContain('3 new')
  expect(phone.texts().filter(text => text === '3 new')).toHaveLength(1)
})
