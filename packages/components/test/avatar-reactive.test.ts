import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

afterEach(() => closeBrowser())

it('updates uploaded avatars and recovers from a failed previous image', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Avatar.stx': readFileSync(path.join(import.meta.dir, '../src/ui/avatar/Avatar.stx'), 'utf8'),
    'components/Host.stx': `<script client>
const photo = state('')
const person = state('Chris Breuer')
function changePhoto(src) { photo.set(src) }
</script>
<div id="host"><Avatar :src="photo()" :alt="person()" className="probe" /></div>`,
    'pages/index.stx': page('app', '<Host />'),
  }, { '/': 'pages/index.stx' })
  try {
    const browser = await boot(app, '/')
    await settle()
    const host = find(browser, '#host').closest('[data-stx-scope]')
    const scope = browser.window.stx._scopes[host.getAttribute('data-stx-scope')]
    expect(find(browser, '.probe').textContent).toContain('CB')
    expect(browser.document.querySelector('.probe img')).toBeNull()
    scope.changePhoto('/uploads/avatars/chris.jpg')
    await settle()
    expect(find(browser, '.probe img').getAttribute('src')).toBe('/uploads/avatars/chris.jpg')
    expect(find(browser, '.probe img').getAttribute('alt')).toBe('Chris Breuer')
    const avatar = find(browser, '.probe').closest('[data-stx-scope]')
    browser.window.stx._scopes[avatar.getAttribute('data-stx-scope')].onImageError({ type: 'error' })
    await settle()
    expect(browser.document.querySelector('.probe img')).toBeNull()
    expect(find(browser, '.probe').textContent).toContain('CB')
    scope.changePhoto('/uploads/avatars/new.jpg')
    await settle()
    expect(find(browser, '.probe img').getAttribute('src')).toBe('/uploads/avatars/new.jpg')
    scope.changePhoto('')
    await settle()
    expect(browser.document.querySelector('.probe img')).toBeNull()
  }
  finally { await app.dispose() }
})

it('top-aligns the container so it adds no baseline space under the circle', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Avatar.stx': readFileSync(path.join(import.meta.dir, '../src/ui/avatar/Avatar.stx'), 'utf8'),
    'pages/index.stx': page('app', '<Avatar src="/uploads/avatars/chris.jpg" alt="Chris Breuer" className="probe" />'),
  }, { '/': 'pages/index.stx' })
  try {
    const browser = await boot(app, '/')
    await settle()
    const classes = find(browser, '.probe').classList
    expect(classes.contains('align-top')).toBe(true)
    expect(classes.contains('inline-flex')).toBe(true)
    expect(classes.contains('shrink-0')).toBe(true)
    expect(classes.contains('inline-block')).toBe(false)
  }
  finally { await app.dispose() }
})

it('keeps the initials current in an :if that hides and shows again (a chat header)', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Avatar.stx': readFileSync(path.join(import.meta.dir, '../src/ui/avatar/Avatar.stx'), 'utf8'),
    'components/Host.stx': `<script client>
const selected = state({ name: 'Jx Bee', avatar: '' })
const has = derived(() => !!selected())
const selectedName = derived(() => selected()?.name || '')
const selectedAvatar = derived(() => selected()?.avatar || '')
function pick(next) { selected.set(next) }
</script>
<div id="host"><div :if="has"><Avatar :src="selectedAvatar" :alt="selectedName" className="probe" /><h2 class="name" :text="selectedName"></h2></div></div>`,
    'pages/index.stx': page('app', '<Host />'),
  }, { '/': 'pages/index.stx' })
  try {
    const browser = await boot(app, '/')
    await settle()
    const host = find(browser, '#host').closest('[data-stx-scope]')
    const scope = browser.window.stx._scopes[host.getAttribute('data-stx-scope')]
    expect(find(browser, '.probe').textContent).toContain('JB')
    scope.pick(null)
    await settle()
    scope.pick({ name: 'Clara Winter', avatar: '' })
    await settle()
    expect(find(browser, '.name').textContent).toBe('Clara Winter')
    expect(find(browser, '.probe').textContent).toContain('CW')
  }
  finally { await app.dispose() }
})
