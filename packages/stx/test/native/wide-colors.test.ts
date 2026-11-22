/**
 * Display P3 on hosts that draw it (stacksjs/ts-css#38).
 *
 * A screen ships sRGB hex, which every host draws. Its leaf records the P3
 * value of each colour the hex clamps, and only a host that reports
 * `displayP3Colors` gets those swapped in. Any other host, and any path that
 * misses the swap, still gets the hex, never a value it would draw near-black.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'
import type { LeafEntry } from '../../src/native/compiler/headwind-to-style'
import { withLeafEntries } from '../../src/native/compiler/headwind-to-style'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { tsCssLeafEntries } from '../../src/native/compiler/ts-css-leaf'
import { prepareSharedNativeScreen } from '../../src/native/runtime/shared-screen'
import { wideColorMap, withWideColors } from '../../src/native/runtime/wide-colors'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'
import { restoreGlobalsAfterEach } from '../../test-utils/native-globals'

declare const window: any

restoreGlobalsAfterEach()

const entries = tsCssLeafEntries(new CSSGenerator(defaultConfig as never))
const BLUE_500 = 'color(display-p3 0.2664 0.4912 0.9886)'

describe('wide colours', () => {
  describe('what the build records', () => {
    /** blue-500 is one of the 82 the hex clamps. */
    it('should keep the hex and record the P3 value beside it', () => {
      expect(entries('bg-blue-500')).toEqual({ style: { backgroundColor: '#2b7fff' }, p3: { '#2b7fff': BLUE_500 } })
    })

    it('should carry the alpha into both', () => {
      expect(entries('bg-blue-500/50')).toEqual({ style: { backgroundColor: '#2b7fff80' }, p3: { '#2b7fff80': 'color(display-p3 0.2664 0.4912 0.9886 / 0.5)' } })
    })

    /** red-500 and the neutrals fit sRGB: the hex draws them exactly. */
    it('should record nothing for a colour sRGB holds', () => {
      expect(entries('bg-red-500')).toEqual({ style: { backgroundColor: '#fb2c36' } })
      expect(entries('text-slate-500')).toEqual({ style: { color: '#62748e' } })
      expect(entries('bg-black')).toEqual({ style: { backgroundColor: '#000000' } })
      expect(entries('bg-[#2b7fff]')).toEqual({ style: { backgroundColor: '#2b7fff' } })
    })
  })

  describe('the swap', () => {
    it('should collect each screen\'s swaps from its leaf', () => {
      const leaf: Record<string, LeafEntry> = { 'bg-blue-500': entries('bg-blue-500')!, 'bg-red-500': entries('bg-red-500')! }
      expect(wideColorMap(leaf)).toEqual(new Map([['#2b7fff', BLUE_500]]))
      expect(wideColorMap({ 'bg-red-500': entries('bg-red-500')! })).toBeUndefined()
      expect(wideColorMap(undefined)).toBeUndefined()
    })

    /** Swapping a hex two colours share would draw one as the other. */
    it('should leave a hex two colours clamp to as sRGB', () => {
      const leaf: Record<string, LeafEntry> = {
        a: { style: {}, p3: { '#2b7fff': BLUE_500, '#00ff00': 'color(display-p3 0 1 0)' } },
        b: { style: {}, p3: { '#2B7FFF': 'color(display-p3 0.2 0.5 1)' } },
      }
      expect(wideColorMap(leaf)).toEqual(new Map([['#00ff00', 'color(display-p3 0 1 0)']]))
    })

    it('should swap colour properties only, at any depth', () => {
      const map = new Map([['#2b7fff', BLUE_500]])
      const payload = { style: { backgroundColor: '#2B7FFF', width: 10 }, props: { text: '#2b7fff' }, children: [{ style: { color: '#2b7fff', borderColor: '#000000' } }] }
      expect(withWideColors(payload, map)).toEqual({ style: { backgroundColor: BLUE_500, width: 10 }, props: { text: '#2b7fff' }, children: [{ style: { color: BLUE_500, borderColor: '#000000' } }] })
    })

    it('should copy on write, and change nothing the caller holds', () => {
      const map = new Map([['#2b7fff', BLUE_500]])
      const untouched = { style: { color: '#000000' } }
      const payload = { children: [{ style: { color: '#2b7fff' } }, untouched], _classTable: { styles: [{ color: '#2b7fff' }] } }
      const sent = withWideColors(payload, map)
      expect(payload.children[0]!.style.color).toBe('#2b7fff')
      expect(sent.children[1]).toBe(untouched)
      expect(sent._classTable).toBe(payload._classTable)
      expect(withWideColors(untouched, map)).toBe(untouched)
    })
  })

  describe('a screen', () => {
    afterEach(() => {
      delete window.__stx_host
    })

    async function sentTo(capabilities: string[] | undefined) {
      const compiled = await withLeafEntries(entries, () => compileScreenSource(`<script client>
const on = state(false)
function flip() { on.set(!on()) }
</script>
<View class="bg-blue-500">
<Text class="text-red-500">Static</Text>
<View :class="on() ? 'bg-blue-500' : 'bg-white'"></View>
<Button @click="flip()">Flip</Button>
</View>`, path.join(import.meta.dir, 'Wide.stx')))
      const sent: any[] = []
      let receive: (raw: string) => void = () => {}
      const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
        postMessage: raw => sent.push(JSON.parse(raw)),
        onMessage: (callback) => { receive = callback },
        ...(capabilities ? { capabilities } : {}),
      })
      installNodeConstants()
      window.__stx_host = screen.host
      new Function(generateSignalsRuntimeDev())()
      new Function(compiled.setup!.code)()
      screen.mount(window.stx, window.__stx_latestSetup)
      screen.host.flush()
      const operations = () => sent.filter(m => m.type === 'MUTATE').flatMap(m => m.payload.operations)
      const flip = operations().map(op => op.patch?.events?.onPress).find(Boolean)
      sent.splice(0, sent.length, ...sent.filter(m => m.type === 'RENDER'))
      receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: flip, nativeEvent: {} } }))
      screen.host.flush()
      const render = sent.find(m => m.type === 'RENDER').payload.document
      const patched = operations().map(op => op.patch?.style?.backgroundColor).filter(Boolean)
      screen.unmount()
      return { compiled, render, patched }
    }

    it('should draw P3 on a host that reports it', async () => {
      const { compiled, render, patched } = await sentTo(['displayP3Colors'])
      expect(render.style.backgroundColor).toBe(BLUE_500)
      // red-500 fits sRGB, so it stays hex even here.
      expect(render.children[0].style.color).toBe('#fb2c36')
      expect(patched).toEqual([BLUE_500])
      // The screen it holds is still sRGB.
      expect(compiled.document.root.style?.backgroundColor).toBe('#2b7fff')
    })

    it('should send sRGB to a host that does not', async () => {
      for (const capabilities of [undefined, ['storage']]) {
        const { render, patched } = await sentTo(capabilities)
        expect(render.style.backgroundColor).toBe('#2b7fff')
        expect(patched).toEqual(['#2b7fff'])
      }
    })
  })
})
