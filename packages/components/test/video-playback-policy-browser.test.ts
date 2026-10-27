import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

// Actual local media makes play/ended/loop observable without an external codec
// fixture. The shared player uses the same policy for its audio/video providers.
function wave(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8044).fill(128)
  const data = new DataView(bytes.buffer)
  const text = (at: number, value: string) => [...value].forEach((char, i) => { bytes[at + i] = char.charCodeAt(0) })
  text(0, 'RIFF'); data.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ')
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true)
  data.setUint32(24, 8000, true); data.setUint32(28, 8000, true); data.setUint16(32, 1, true); data.setUint16(34, 8, true)
  text(36, 'data'); data.setUint32(40, 8000, true)
  return bytes
}

it.each([false, true])('updates real Video playback policy, source/defaults and remounts without replacing players (authored=%s)', async (initial) => {
  const root = join(import.meta.dir, '..')
  const component = join(root, 'src/ui/video/Video.stx')
  const html = await processDirectives(`@import('Video', '${component}')
<!doctype html><html><head></head><body><script client>
const controls = state(undefined)
const autoplay = state(undefined)
const loop = state(undefined)
const shown = state(true)
const url = state('/tone.wav')
window.probe = { controls, autoplay, loop, shown, url, ends: 0 }
</script><button id="unlock" onclick="document.querySelector('video-player').player.play().catch(() => {})">Play</button>
<section><div :if="shown"><Video src="/tone.wav" :src="url" controls autoplay="${initial}" loop="${initial}" muted
  :controls="controls" :autoplay="autoplay" :loop="loop" @ended="window.probe.ends++" /></div></section></body></html>`, {}, join(root, 'video-playback-policy.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch(request) {
    const path = new URL(request.url).pathname
    if (path.endsWith('.wav')) return new Response(wave(), { headers: { 'Content-Type': 'audio/wav' } })
    return path === '/' ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 })
  } })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  const wait = async (expression: string) => {
    for (let i = 0; i < 250; i++) {
      if (await view.evaluate<boolean>(expression)) return
      await Bun.sleep(20)
    }
    expect(await view.evaluate<boolean>(expression), expression).toBe(true)
  }
  const set = (key: string, value: unknown) => view.evaluate(`window.probe.${key}.set(${JSON.stringify(value)})`)
  const retained = async () => expect(await view.evaluate<boolean[]>(`(() => { const el = document.querySelector('video-player'); return [el === window.initialElement, el.player === window.initialPlayer, el.player.provider === window.initialProvider, el.player.provider.mediaElement === window.initialMedia] })()`)).toEqual([true, true, true, true])
  try {
    await view.navigate(server.url.href)
    await wait("!!window.probe && !!document.querySelector('video-player')?.player?.state.canPlay")
    await view.evaluate(`(() => { window.initialElement = document.querySelector('video-player'); window.initialPlayer = initialElement.player; window.initialProvider = initialPlayer.provider; window.initialMedia = initialProvider.mediaElement; })()`)
    expect(await view.evaluate<boolean[]>('[initialPlayer.state.controls, initialPlayer.state.autoplay, initialPlayer.state.loop]')).toEqual([true, initial, initial])
    // Grant genuine user activation; browser autoplay policy remains authoritative.
    await view.click('#unlock')
    await wait('initialPlayer.state.playing')
    await view.evaluate('initialPlayer.pause()')
    await set('autoplay', false)
    await set('loop', false)
    await wait('!initialPlayer.state.autoplay && !initialPlayer.state.loop && initialMedia.paused')
    const before = await view.evaluate<number>('window.probe.ends')
    await set('loop', true)
    await set('autoplay', true)
    await set('controls', false)
    await wait(`window.probe.ends >= ${before + 2}`)
    await wait("getComputedStyle(initialElement.querySelector('video-skin')).display === 'none' && initialElement.querySelector('video-skin').inert")
    expect(await view.evaluate<boolean>('initialMedia.loop')).toBe(false)
    await retained()
    await set('autoplay', 'off')
    await set('loop', 'no')
    await wait('!initialPlayer.state.autoplay && !initialPlayer.state.loop && initialPlayer.state.ended && initialMedia.paused')
    await set('url', '/replacement.wav')
    await wait('initialPlayer.state.canPlay && initialPlayer.state.src === "/replacement.wav"')
    await Bun.sleep(150)
    expect(await view.evaluate<boolean>('initialMedia.paused')).toBe(true)
    await retained()
    for (const defaults of [false, true]) {
      await set('shown', false)
      await wait("!document.querySelector('video-player')")
      await set('autoplay', defaults ? undefined : true)
      await set('loop', defaults ? undefined : true)
      await set('controls', defaults ? undefined : true)
      const source = defaults ? '/defaults.wav' : '/remount.wav'
      await set('url', source)
      await set('shown', true)
      await wait(`initialPlayer.state.canPlay && initialPlayer.state.src === ${JSON.stringify(source)}`)
      expect(await view.evaluate<boolean[]>('[initialPlayer.state.controls, initialPlayer.state.autoplay, initialPlayer.state.loop]')).toEqual([true, defaults ? initial : true, defaults ? initial : true])
      if (!defaults || initial) await wait('initialPlayer.state.playing')
      else { await Bun.sleep(150); expect(await view.evaluate<boolean>('initialMedia.paused')).toBe(true) }
      await retained()
      await set('autoplay', false)
      await set('loop', false)
      await view.evaluate('initialPlayer.pause()')
    }
  }
  finally { view.close(); server.stop(true) }
}, 90_000)
