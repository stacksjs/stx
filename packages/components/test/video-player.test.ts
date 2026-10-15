import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../stx/src/process'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

/**
 * <Video> is ts-video-player's <video-player>: one player that plays a file,
 * a stream, or a YouTube or Vimeo link behind its own controls, and follows
 * a parent's choice of video, so a dialog can play whichever one was chosen.
 */

const SOURCE = readFileSync(path.join(import.meta.dir, '../src/ui/video/Video.stx'), 'utf8')
const DIR = path.join(import.meta.dir, '../src/ui/video')

async function render(markup: string): Promise<string> {
  return processDirectives(markup, {}, path.join(DIR, 'video-audit.stx'), { componentsDir: DIR, root: DIR, buildMode: 'serve', cache: false } as any, new Set<string>())
}

afterEach(() => closeBrowser())

describe('Video', () => {
  it('renders ts-video-player with its controls', async () => {
    const html = await render('<Video src="/media/demo.mp4" poster="/media/demo.jpg" label="Demo" />')
    expect(html).toContain('<video-player')
    expect(html).toContain('src="/media/demo.mp4"')
    expect(html).toContain('aria-label="Demo"')
    expect(html).toContain('<video-skin>')
    expect(html).toContain('<media-play-button')
    expect(SOURCE).toContain(`import { registerElements } from 'ts-video-player/elements'`)
  })

  it('never offers a YouTube or Vimeo page as a link out', async () => {
    for (const src of ['https://www.youtube.com/watch?v=aclHkVaku9U', 'https://youtu.be/aclHkVaku9U', 'https://vimeo.com/1084537']) {
      const html = await render(`<Video src="${src}" label="Clip" />`)
      expect(html).not.toMatch(/<a\b/)
      expect(html).not.toContain('target="_blank"')
      // The native fallback cannot play a page, so it is not handed one.
      expect(html).not.toMatch(/<video data-native-fallback[^>]*src=/)
    }
  })

  it('names its controls only from the player, in the page language', () => {
    // ts-video-player names each button from the page's lang; a fixed English
    // aria-label on the host would contradict it.
    expect(SOURCE).not.toMatch(/<media-[\w-]+[^>]*aria-label=/)
  })

  it('does not autoplay the hidden fallback alongside the player', () => {
    expect(SOURCE).not.toMatch(/<video data-native-fallback[^>]*autoplay/)
    expect(SOURCE).toMatch(/<video data-native-fallback[^>]*preload="none"/)
  })

  it('follows the chosen video, its shape and its name, and stops when there is none', async () => {
    const app = await renderApp({
      'layouts/app.stx': layout(''),
      'components/Video.stx': SOURCE,
      'components/Host.stx': `<script client>
const chosen = state('')
const shape = state('16/9')
const name = state('')
function choose(src, ratio, label) { chosen.set(src); shape.set(ratio); name.set(label) }
</script>
<div id="host"><Video :src="chosen()" :aspectRatio="shape()" :label="name()" autoplay /></div>`,
      'pages/index.stx': page('app', '<Host />'),
    }, { '/': 'pages/index.stx' })
    try {
      const browser = await boot(app, '/')
      await settle()
      const host = find(browser, '#host').closest('[data-stx-scope]')
      const scope = browser.window.stx._scopes[host.getAttribute('data-stx-scope')]
      const player = () => find(browser, 'video-player')
      expect(player().hasAttribute('src')).toBe(false)
      scope.choose('/media/short.mp4', 0.5625, 'Goblet squat')
      await settle()
      expect(player().getAttribute('src')).toBe('/media/short.mp4')
      expect(player().getAttribute('style')).toContain('aspect-ratio: 0.5625')
      expect(player().getAttribute('aria-label')).toBe('Goblet squat')
      expect(player().hasAttribute('autoplay')).toBe(true)
      scope.choose('', '16/9', '')
      await settle()
      expect(player().hasAttribute('src')).toBe(false)
      expect(player().getAttribute('style')).toContain('aspect-ratio: 16/9')
    }
    finally { await app.dispose() }
  })
})
