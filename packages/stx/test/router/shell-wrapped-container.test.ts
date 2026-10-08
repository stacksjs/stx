/**
 * A layout whose router container sits inside a component's slot.
 *
 * A component's instance script is emitted after the component that holds it,
 * so when the layout wraps `<main>` in a shell component (an app shell with
 * its tab bar), every component on the page has its script after `</main>`.
 * The fragment builder left out every instance script outside the container
 * as the layout's own chrome (#1958), so a page reached by navigation came up
 * with its components dead: a countdown ring showing `{{ remainingLabel }}`,
 * a sheet that never opened. Whose script it is follows from where its root
 * is, not where the script landed.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { extractContainerContent } from '../../src/app-shell'
import { boot, closeBrowser, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

const SHELL_LAYOUT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Harness</title>
</head>
<body>
  <Shell>
    <main>
      @yield('content')
    </main>
  </Shell>
</body>
</html>
`

const FILES = {
  'layouts/default.stx': SHELL_LAYOUT,
  'components/Shell.stx': `<script client>
const shellReady = state(true)
</script>
<div class="shell" :class="shellReady ? 'ready' : ''"><slot /><nav class="tabs">tabs</nav></div>
`,
  'components/Ring.stx': `<script client>
const value = useReactiveProp('value', 0)
const label = useReactiveProp('label', '')
const ringStyle = derived(() => 'width:' + (Number(value()) || 0) + 'px')
</script>
<div class="ring" :aria-label="label()" :style="ringStyle()"><div class="ring-center"><slot /></div></div>
`,
  'views/home.stx': page('default', `<script client>
const homeOpen = state(true)
</script>
<p :if="homeOpen" class="home">home</p>
`),
  'views/ring.stx': page('default', `<script client>
const total = state(null)
const remainingLabel = derived(() => total() === null ? '' : '0:' + total())
window.SET_TOTAL = value => total.set(value)
</script>
<div :if="total !== null" class="holder">
  <Ring :value="total" :label="remainingLabel + ' left'"><span class="count">{{ remainingLabel }}</span></Ring>
</div>
`),
}

describe('a page in a layout that wraps its container in a component', () => {
  it('keeps its components alive when reached by navigation', async () => {
    const app = await renderApp(FILES, { '/': 'views/home.stx', '/ring': 'views/ring.stx' })
    const browser = await boot(app, '/')
    await browser.navigate('/ring')
    browser.window.SET_TOTAL(30)
    await settle()

    expect(browser.document.querySelector('.count')?.textContent?.trim()).toBe('0:30')
    expect(browser.document.querySelector('.ring')?.getAttribute('style')?.replace(/\s/g, '')).toContain('width:30px')
    // A prop built from the page's client values is bound, not baked in on
    // the server as 'undefined left'.
    expect(browser.document.querySelector('.ring')?.getAttribute('aria-label')).toBe('0:30 left')
    browser.window.SET_TOTAL(45)
    await settle()
    expect(browser.document.querySelector('.count')?.textContent?.trim()).toBe('0:45')
    expect(browser.document.querySelector('.ring')?.getAttribute('aria-label')).toBe('0:45 left')
    // The shell's own script stays out: it is still running on screen.
    expect(browser.document.querySelectorAll('.shell').length).toBe(1)
    expect(browser.errors).toEqual([])
    await app.dispose()
  })

  it('carries the page\'s instance scripts in its fragment, and not the shell\'s', async () => {
    const app = await renderApp(FILES, { '/ring': 'views/ring.stx' })
    const html = app.documents.get('/ring')!
    const fragment = extractContainerContent(html, 'main')
    const owners = (source: string) => Array.from(source.matchAll(/data-stx-owner="([^"]+)"/g), match => match[1]!)
    expect(owners(html).some(owner => owner.includes('ring'))).toBe(true)
    expect(owners(fragment).some(owner => owner.includes('ring'))).toBe(true)
    expect(owners(fragment).some(owner => owner.includes('shell'))).toBe(false)
    await app.dispose()
  })
})
