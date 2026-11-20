/**
 * <RenderSurface> in a real browser (stacksjs/stx#2108): a <canvas> takes
 * the frames a phone's RenderSurface would, and says ready, resize, a taken
 * name and an unavailable device the way the host does.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../stx/test-utils/browser-timeout'
import type { BrowserPage } from './support/browser-page'
import { openBrowserPage } from './support/browser-page'

allowForARealBrowser()

const SCREEN = `
<script client>
import { presentFrame, startRenderLoop, renderSurfaceHost } from './src/ui/render-surface/render-surface'
const shown = state(true)
window.heard = []
window.probe = { presentFrame, startRenderLoop, renderSurfaceHost, shown }
</script>
<div id="stage" style="width:200px;height:100px;display:flex;flex-direction:column">
  <div :if="shown()" style="flex:1;display:flex;flex-direction:column">
    <RenderSurface surface="game" class="flex-1" label="Game" @ready="heard.push(['ready', $event])" @resize="heard.push(['resize', $event])" @error="heard.push(['error', $event])" />
  </div>
</div>
<RenderSurface surface="game" @error="heard.push(['duplicate', $event])" />
<div style="width:40px;height:20px;display:flex"><RenderSurface class="flex-1" filter="linear" :opaque="false" @ready="heard.push(['unnamed', $event.surface])" /></div>
<div style="width:40px;height:20px;display:flex"><RenderSurface class="flex-1" @ready="heard.push(['unnamed', $event.surface])" /></div>`

const HELPERS = `
  const later = (fn, ms) => new Promise(done => setTimeout(() => done(fn()), ms || 120))
  const canvas = name => Array.from(document.querySelectorAll('canvas')).find(c => c.getAttribute('surface') === name && c.isConnected)
  const pixels = (name, w, h) => Array.from(canvas(name).getContext('2d').getImageData(0, 0, w, h).data)
  const caught = fn => { try { fn(); return 'no error' } catch (e) { return e instanceof TypeError ? 'TypeError' : String(e.code) } }
`

let page: BrowserPage
let bare: BrowserPage

beforeAll(async () => {
  page = await openBrowserPage({ name: 'render-surface-browser', width: 600, height: 400, body: SCREEN, ready: `window.heard && window.heard.some(entry => entry[0] === 'ready')` })
  // A browser with no 2D canvas: the box says so instead of staying blank.
  bare = await openBrowserPage({ name: 'render-surface-no-canvas', width: 400, height: 200, body: `<script>HTMLCanvasElement.prototype.getContext = () => null</script>${SCREEN}`, ready: `window.heard && window.heard.length > 0` })
}, 90_000)

afterAll(() => {
  page?.close()
  bare?.close()
})

describe('a RenderSurface in a browser', () => {
  it('is ready with its size, by name, and each unnamed one has its own', async () => {
    const heard = await page.json(`return heard.slice()`)
    const ready = heard.find((entry: any[]) => entry[0] === 'ready')[1]
    expect(ready).toMatchObject({ surface: 'game', width: 200, height: 100 })
    expect(ready.pixelWidth).toBe(Math.round(200 * ready.scale))
    const unnamed = heard.filter((entry: any[]) => entry[0] === 'unnamed').map((entry: any[]) => entry[1])
    expect(unnamed).toHaveLength(2)
    expect(new Set(unnamed).size).toBe(2)
    expect(await page.json(`return probe.renderSurfaceHost()`)).toBe('canvas')
    expect(await page.errors()).toEqual([])
  })

  it('draws a frame\'s 0xAARRGGBB words, opaque unless it says otherwise', async () => {
    const drawn = await page.json(`${HELPERS}
      const ok = probe.presentFrame('game', new Uint32Array([0xFFFF0000, 0xFF00FF00, 0xFF0000FF, 0x00FFFFFF]), 2, 2)
      return { ok, pixels: pixels('game', 2, 2), size: [canvas('game').width, canvas('game').height], rendering: canvas('game').style.imageRendering }`)
    expect(drawn).toEqual({
      ok: true,
      // The last word's alpha is zero: an opaque surface draws it anyway.
      pixels: [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255],
      size: [2, 2],
      rendering: 'pixelated',
    })
    // Not opaque: premultiplied words, straight alpha in the canvas.
    const name = await page.json(`return heard.filter(entry => entry[0] === 'unnamed')[0][1]`)
    const clear = await page.json(`${HELPERS}
      probe.presentFrame(${JSON.stringify(name)}, new Uint32Array([0x80800000]), 1, 1)
      return { pixels: pixels(${JSON.stringify(name)}, 1, 1), rendering: canvas(${JSON.stringify(name)}).style.imageRendering }`)
    expect(clear.pixels[0]).toBeGreaterThanOrEqual(254)
    expect(clear.pixels[3]).toBe(128)
    expect(clear.rendering).toBe('auto')
  })

  it('refuses what a phone would refuse', async () => {
    expect(await page.json(`${HELPERS} return [
      caught(() => probe.presentFrame('game', [0, 0], 1, 2)),
      caught(() => probe.presentFrame('game', new Uint32Array(3), 2, 2)),
      caught(() => probe.presentFrame('game', new Uint32Array(1), 0, 1)),
      caught(() => probe.presentFrame('game', new Uint32Array(1), 1.5, 1)),
      caught(() => probe.presentFrame('', new Uint32Array(1), 1, 1)),
      caught(() => probe.presentFrame('nowhere', new Uint32Array(1), 1, 1)),
    ]`)).toEqual(['TypeError', 'TypeError', 'TypeError', 'TypeError', 'TypeError', 'NOT_FOUND'])
  })

  it('reports a second surface of a name that is taken, and the first keeps drawing', async () => {
    const duplicate = (await page.json(`return heard.filter(entry => entry[0] === 'duplicate')`))
    expect(duplicate).toEqual([['duplicate', { surface: 'game', code: 'DUPLICATE', message: expect.stringContaining('game') }]])
    expect(await page.json(`${HELPERS} probe.presentFrame('game', new Uint32Array([0xFF112233]), 1, 1); return pixels('game', 1, 1)`)).toEqual([0x11, 0x22, 0x33, 255])
  })

  it('says resize when its box changes', async () => {
    const resized = await page.json(`${HELPERS}
      heard.length = 0
      document.getElementById('stage').style.width = '300px'
      return later(() => heard.filter(entry => entry[0] === 'resize').map(entry => entry[1].width), 200)`)
    expect(resized).toEqual([300])
  })

  it('lets go of its name when removed, ending a loop quietly, and takes it again when back', async () => {
    const result = await page.json(`${HELPERS}
      return (async () => {
      let frames = 0
      const loop = probe.startRenderLoop('game', () => { frames++; return { pixels: new Uint32Array([0xFF000000 | frames]), width: 1, height: 1 } })
      await later(() => {}, 100)
      const drew = frames > 0 && !loop.ended
      heard.length = 0
      probe.shown.set(false)
      await later(() => {}, 120)
      const gone = caught(() => probe.presentFrame('game', new Uint32Array(1), 1, 1))
      const ended = loop.ended
      probe.shown.set(true)
      await later(() => {}, 200)
      return { drew, gone, ended, again: heard.filter(entry => entry[0] === 'ready').map(entry => entry[1].surface), back: caught(() => probe.presentFrame('game', new Uint32Array(1), 1, 1)) }
      })()`)
    expect(result).toEqual({ drew: true, gone: 'NOT_FOUND', ended: true, again: ['game'], back: 'no error' })
    expect(await page.errors()).toEqual([])
  })
})

describe('where nothing can draw one', () => {
  it('says so in the box and reports UNAVAILABLE', async () => {
    const result = await bare.json(`return {
      errors: heard.filter(entry => entry[0] === 'error').map(entry => entry[1].code),
      shown: Array.from(document.querySelectorAll('[data-render-surface] [role="status"]')).filter(el => getComputedStyle(el).display !== 'none').map(el => el.textContent.trim()),
    }`)
    expect(result.errors).toEqual(['UNAVAILABLE'])
    expect(result.shown).toContain('This device cannot draw this view.')
  })
})
