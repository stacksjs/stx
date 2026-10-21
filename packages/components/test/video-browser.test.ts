import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

it('still registers the browser player, forwards events once and pauses when its source clears', async () => {
  const root = join(import.meta.dir, '..')
  const component = join(root, 'src/ui/video/Video.stx')
  const html = await processDirectives(`@import('Video', '${component}')
<!doctype html><html><head></head><body>
<script client>
const url = state('')
window.probe = { url, plays: 0 }
</script><section><Video :src="url" @play="window.probe.plays++" /></section>
</body></html>`, {}, join(root, 'video-browser.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch: request => new URL(request.url).pathname === '/'
      ? new Response(html, { headers: { 'Content-Type': 'text/html' } })
      : new Response('', { status: 404 }),
  })
  const view = new WebView({ headless: true })
  const ready = `!!window.probe && !!customElements.get('video-player') && !!document.querySelector('video-player').player`
  try {
    await view.navigate(server.url.href)
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(ready)) break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(ready)).toBe(true)
    expect(await view.evaluate(`!!customElements.get('media-play-button')`)).toBe(true)
    await view.evaluate(`(() => {
      const player = document.querySelector('video-player');
      player.dispatchEvent(new CustomEvent('play', { bubbles: true }));
      window.probe.url.set('/movie.mp4');
    })()`)
    await Bun.sleep(50)
    expect(await view.evaluate('window.probe.plays')).toBe(1)
    expect(await view.evaluate(`document.querySelector('video-player').getAttribute('src')`)).toBe('/movie.mp4')
    await view.evaluate(`(() => {
      window.probe.pauses = 0;
      document.querySelector('video-player').player.pause = () => { window.probe.pauses++ };
      window.probe.url.set(null);
    })()`)
    await Bun.sleep(50)
    expect(await view.evaluate(`document.querySelector('video-player').hasAttribute('src')`)).toBe(false)
    expect(await view.evaluate('window.probe.pauses > 0')).toBe(true)
  }
  finally {
    view.close()
    server.stop(true)
  }
}, 30_000)
