import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const video = join(root, 'src/ui/video/Video.stx')
const names = ['controls', 'autoplay', 'loop', 'muted'] as const
const cases = [
  { label: 'omitted', attributes: '', defaults: [true, false, false, false] },
  { label: 'enabled', attributes: 'controls autoplay loop muted', defaults: [true, true, true, true] },
  { label: 'disabled', attributes: 'controls="false" autoplay="false" loop="false" muted="false"', defaults: [false, false, false, false] },
  { label: 'false-like strings', attributes: 'controls="off" autoplay="0" loop="no" muted="FALSE"', defaults: [false, false, false, false] },
  { label: 'mixed', attributes: 'controls="off" autoplay="true" loop="no" muted="yes"', defaults: [false, true, false, true] },
]

it.each(cases)('normalizes Video flags and restores $label defaults without replacing the browser player', async ({ attributes, defaults }) => {
  const html = await processDirectives(`@import('Video', '${video}')
<!doctype html><html><head></head><body><script client>
const controls = state(undefined)
const autoplay = state(undefined)
const loop = state(undefined)
const muted = state(undefined)
const shown = state(true)
const url = state('')
window.probe = { controls, autoplay, loop, muted, shown, url, plays: 0 }
</script><section><div :if="shown">
<Video ${attributes} :controls="controls" :autoplay="autoplay" :loop="loop" :muted="muted" :src="url" label="Movie" @play="window.probe.plays++" />
</div></section></body></html>`, {}, join(root, 'video-booleans.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const tag = html.match(/<video-player\b[^>]*>/)![0]
  names.forEach((name, index) => expect(new RegExp(`\\s${name}(?=\\s|=|>)`).test(tag)).toBe(defaults[index]))
  const fallbackTag = html.match(/<video(?=\s)[^>]*>/)![0]
  for (const name of ['controls', 'loop', 'muted'] as const)
    expect(new RegExp(`\\s${name}(?=\\s|=|>)`).test(fallbackTag)).toBe(defaults[names.indexOf(name)])
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome', url: false } : undefined })
  const snapshot = () => view.evaluate(`(() => {
    const el = document.querySelector('video-player');
    if (!window.probe || !el?.player) return null;
    const fallback = el.querySelector('video[data-native-fallback]');
    const skin = el.querySelector('video-skin');
    return { flags: ['controls', 'autoplay', 'loop', 'muted'].map(name => el.hasAttribute(name)),
      policy: [el.player.state.controls, el.player.state.autoplay, el.player.state.loop],
      skinHidden: getComputedStyle(skin).display === 'none', skinInert: skin.inert,
      fallback: ['controls', 'loop', 'muted'].map(name => fallback.hasAttribute(name)), muted: el.player.state.muted,
      same: el === window.initialElement, samePlayer: el.player === window.initialPlayer, sameFallback: fallback === window.initialFallback,
      count: document.querySelectorAll('video-player').length, src: el.getAttribute('src') };
  })()`)
  const selected = async (expected: Record<string, unknown> | null) => {
    for (let i = 0; i < 150; i++) {
      const actual = await snapshot() as Record<string, unknown> | null
      if (expected === null ? actual === null : actual && Object.entries(expected).every(([key, value]) => JSON.stringify(actual[key]) === JSON.stringify(value))) {
        if (expected === null) expect(actual).toBeNull()
        else expect(actual).toMatchObject(expected)
        return
      }
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject(expected)
  }
  const flags = (values: boolean[]) => ({ flags: values, policy: values.slice(0, 3), skinHidden: !values[0], skinInert: !values[0],
    fallback: [values[0], values[2], values[3]], muted: values[3] })
  const retained = { same: true, samePlayer: true, sameFallback: true, count: 1 }
  const set = (value: unknown) => view.evaluate(`(() => { for (const name of ['controls', 'autoplay', 'loop', 'muted']) window.probe[name].set(${JSON.stringify(value)}) })()`)
  try {
    await view.navigate(server.url.href)
    await selected(flags(defaults))
    await view.evaluate(`(() => { window.initialElement = document.querySelector('video-player'); window.initialPlayer = window.initialElement.player; window.initialFallback = window.initialElement.querySelector('video[data-native-fallback]') })()`)
    for (const value of [false, 'false', 'off', 'no', '0', ' FALSE ', ' Off ', 0]) {
      await set(value)
      await selected({ ...flags([false, false, false, false]), ...retained })
    }
    for (const value of [true, 'true', 'on', 'yes', '1', '', 1, 'unknown']) {
      await set(value)
      await selected({ ...flags([true, true, true, true]), ...retained })
    }
    await set(null)
    await selected({ ...flags([true, false, false, false]), ...retained })
    await set(undefined)
    await selected({ ...flags(defaults), ...retained })
    await set(false)
    for (const name of names) {
      await view.evaluate(`window.probe.${name}.set(true)`)
      await selected({ ...flags(names.map(flag => flag === name)), ...retained })
      await view.evaluate(`window.probe.${name}.set('off')`)
      await selected({ ...flags([false, false, false, false]), ...retained })
    }
    // Cover attribute parsing independently of the typed parent-prop bridge.
    for (const value of ['off', '', 'no', 'yes']) {
      await view.evaluate(`(() => { const scope = document.querySelector('video-player').closest('[data-stx-scope]'); for (const name of ['controls', 'autoplay', 'loop', 'muted']) scope.setAttribute(name, ${JSON.stringify(value)}) })()`)
      await selected({ ...flags(Array(4).fill(value === '' || value === 'yes')), ...retained })
    }
    for (const value of [false, 'off', true, '', null, undefined]) {
      await view.evaluate('window.probe.shown.set(false)')
      await selected(null)
      await set(value)
      await view.evaluate('window.probe.shown.set(true)')
      await selected({ ...flags(value === undefined ? defaults : value === null ? [true, false, false, false] : Array(4).fill(value === true || value === '')), ...retained })
    }
    await set('off')
    await view.evaluate("window.probe.url.set('/replacement.mp4')")
    await selected({ ...flags([false, false, false, false]), ...retained, src: '/replacement.mp4' })
    // Count this dispatch only; the actual player may have emitted play while
    // processing a source/autoplay option earlier in the lifecycle.
    expect(await view.evaluate(`(() => { const before = window.probe.plays; document.querySelector('video-player').dispatchEvent(new CustomEvent('play', { bubbles: true })); return window.probe.plays - before })()`)).toBe(1)
  }
  finally { view.close(); server.stop(true) }
}, 60_000)
