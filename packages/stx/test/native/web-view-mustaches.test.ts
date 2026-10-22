/**
 * A web view's `{{ }}` on a native screen. The server evaluates what it can
 * and leaves the rest (a client signal, a call the device answers) for the
 * runtime; in the browser that runtime binds the page's text, and natively
 * the leftover is a binding like any `:text`. A server helper's call is left
 * too: the screen is built once for every phone, with no request behind it.
 */
import { expect, test } from 'bun:test'
import { mountWebView, webApp } from './web-view-app'

test('a mustache reading a signal is the text, and follows it', async () => {
  const root = webApp({
    'views/count.stx': `<script client>
  const count = state(0)
  const where = state('the cart')
  function add() { count.set(count() + 1) }
</script>
<div>
  <p testid="bare">{{ count }}</p>
  <p testid="words">Items: {{ count }} in {{ where }}</p>
  <button testid="add" @click="add()">Add</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Count: 'views/count.stx' }, 'Count')
  expect(phone.texts()).toContain('0')
  expect(phone.texts()).toContain('Items: 0 in the cart')
  expect(phone.texts().some(text => text.includes('{{'))).toBe(false)
  phone.press(phone.byTestID('add')!)
  await phone.settle()
  expect(phone.texts()).toContain('1')
  expect(phone.texts()).toContain('Items: 1 in the cart')
})

test('a button labelled by a mustache draws its label', async () => {
  const root = webApp({
    'views/label.stx': `<script client>
  const busy = state(false)
</script>
<div>
  <button testid="go" @click="busy.set(true)">{{ busy ? 'Saving…' : 'Save' }}</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Label: 'views/label.stx' }, 'Label')
  expect(phone.texts()).toContain('Save')
  phone.press(phone.byTestID('go')!)
  await phone.settle()
  expect(phone.texts()).toContain('Saving…')
})

test('a link\'s words from a mustache are its label', async () => {
  const root = webApp({
    'views/links.stx': `<script client>
  const label = state('Forgot password?')
</script>
<div>
  <a href="/forgot" testid="forgot" class="text-red-500">{{ label }}</a>
  <button testid="rename" @click="label.set('Reset it')">Rename</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Links: 'views/links.stx' }, 'Links')
  expect(phone.texts()).toContain('Forgot password?')
  expect(phone.texts().some(text => text.includes('{{'))).toBe(false)
  phone.press(phone.byTestID('rename')!)
  await phone.settle()
  expect(phone.texts()).toContain('Reset it')
})

test('a mustache in an attribute is that attribute\'s binding', async () => {
  const root = webApp({
    'views/search.stx': `<script client>
  const hint = state('Search workouts')
</script>
<div>
  <input testid="query" placeholder="{{ hint }}" />
</div>
`,
  })
  const phone = await mountWebView(root, { Search: 'views/search.stx' }, 'Search')
  expect(phone.byTestID('query')!.props.placeholder).toBe('Search workouts')
})

test('a server helper\'s call is the device\'s to answer, not the build machine\'s', async () => {
  const root = webApp({
    'layouts/app.stx': `<script server>
const t = key => 'build machine: ' + key
</script>
<main>@yield('content')</main>
`,
    'views/hello.stx': `@extends('layouts/app')
@section('content')
<script client>
  const ready = state(true)
  function t(key) { return 'device: ' + key }
</script>
<p :if="ready">{{ t('hello') }}</p>
@endsection
`,
  })
  const phone = await mountWebView(root, { Hello: 'views/hello.stx' }, 'Hello')
  expect(phone.texts()).toContain('device: hello')
})

test('a link\'s words beside its icon, from a mustache, are its label', async () => {
  // A back link: an icon, then the words. The words after the icon were
  // drawn as their braces, since only a link holding nothing but the
  // mustache was bound.
  const root = webApp({
    'views/back.stx': `<script client>
  const title = state('Store')
</script>
<div>
  <a href="/store" testid="back" class="inline-flex gap-2 items-center"><i aria-hidden="true" class="h-4 w-4 i-lucide-arrow-left"></i>{{ title }}</a>
  <button testid="rename" @click="title.set('Shop')">Rename</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Back: 'views/back.stx' }, 'Back')
  expect(phone.texts()).toContain('Store')
  expect(phone.texts().some(text => text.includes('{{'))).toBe(false)
  phone.press(phone.byTestID('rename')!)
  await phone.settle()
  expect(phone.texts()).toContain('Shop')
})

test('a mustache keeps the spaces its expression spells out', async () => {
  const root = webApp({
    'views/route.stx': `<script client>
  const distance = state('1.06 mi')
  const pace = state('8:03 /mi')
</script>
<div>
  <p testid="route">{{ distance() + '   ' + pace() }}</p>
</div>
`,
  })
  const phone = await mountWebView(root, { Route: 'views/route.stx' }, 'Route')
  expect(phone.texts()).toContain('1.06 mi   8:03 /mi')
})
