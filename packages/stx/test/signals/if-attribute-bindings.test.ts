import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let booted = 0

async function boot(markup: string, scope: Record<string, unknown>) {
  const name = `if_attrs_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  // Retain the actual nodes before :if takes the initially-false ones out.
  const elements = Array.from(document.querySelectorAll('[data-player]')) as Element[]
  const writes = elements.map((element) => {
    const values: string[] = []
    const original = element.setAttribute.bind(element)
    element.setAttribute = (name, value) => {
      if (name === 'src') values.push(String(value))
      original(name, value)
    }
    return values
  })
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
  return { elements, writes }
}

for (const debug of [true, false]) {
  describe(`conditional attribute bindings (debug=${debug})`, () => {
    beforeAll(() => {
      installNodeConstants()
      globalThis.MutationObserver = window.MutationObserver
      // eslint-disable-next-line no-new-func
      new Function(debug ? generateSignalsRuntimeDev() : generateSignalsRuntime())()
    })

    it('only gives the selected exercise player its URL, including after repeated toggles', async () => {
      const exercisePlay = window.stx.state({ kind: 'file', url: '/media/one.mp4' })
      const { elements: [video, frame], writes: [videoWrites, frameWrites] } = await boot(
        `<video data-player :if="exercisePlay.kind === 'file'" x-src="exercisePlay.url"></video>`
        + `<iframe data-player :if="exercisePlay.kind === 'embed'" x-src="exercisePlay.url"></iframe>`,
        { exercisePlay },
      )
      expect(videoWrites).toEqual(['/media/one.mp4'])
      expect(frameWrites).toEqual([])
      expect(frame.getAttribute('src')).toBeNull()

      exercisePlay.set({ kind: 'embed', url: 'https://www.youtube-nocookie.com/embed/one' })
      await settle()
      expect(video.isConnected).toBe(false)
      expect(frame.isConnected).toBe(true)
      expect(videoWrites).toEqual(['/media/one.mp4'])
      expect(frameWrites).toEqual(['https://www.youtube-nocookie.com/embed/one'])

      exercisePlay.set({ kind: 'embed', url: 'https://www.youtube-nocookie.com/embed/two' })
      await settle()
      expect(videoWrites).toEqual(['/media/one.mp4'])
      expect(frameWrites).toEqual([
        'https://www.youtube-nocookie.com/embed/one',
        'https://www.youtube-nocookie.com/embed/two',
      ])

      exercisePlay.set({ kind: 'file', url: '/media/two.mp4' })
      await settle()
      expect(document.querySelector('video')).toBe(video)
      expect(videoWrites).toEqual(['/media/one.mp4', '/media/two.mp4'])
      expect(frameWrites).toHaveLength(2)

      exercisePlay.set({ kind: 'none', url: '/media/hidden.mp4' })
      await settle()
      exercisePlay.set({ kind: 'none', url: '/media/latest.mp4' })
      await settle()
      expect(videoWrites).toHaveLength(2)
      expect(frameWrites).toHaveLength(2)
      exercisePlay.set({ kind: 'file', url: '/media/latest.mp4' })
      await settle()
      expect(videoWrites).toEqual(['/media/one.mp4', '/media/two.mp4', '/media/latest.mp4'])
      expect(frameWrites).toHaveLength(2)
    })

    it('refreshes attributes when only the condition changes on reinsertion', async () => {
      const open = window.stx.state(true)
      const url = window.stx.state('/media/one.mp4')
      const { elements: [video], writes: [writes] } = await boot(
        '<video data-player :if="open" x-src="url"></video>', { open, url },
      )
      open.set(false)
      url.set('/media/two.mp4')
      url.set('/media/latest.mp4')
      await settle()
      expect(writes).toEqual(['/media/one.mp4'])
      open.set(true)
      await settle()
      expect(document.querySelector('video')).toBe(video)
      expect(writes).toEqual(['/media/one.mp4', '/media/latest.mp4'])
      // Re-showing with the same source still avoids reloading the media.
      open.set(false)
      open.set(true)
      await settle()
      expect(writes).toHaveLength(2)
    })

    it('keeps nested owners while both inner and outer elements are detached', async () => {
      const outer = window.stx.state(true)
      const inner = window.stx.state(true)
      const url = window.stx.state('/media/one.mp4')
      const { elements: [video], writes: [writes] } = await boot(
        '<section :if="outer"><video data-player :if="inner" x-src="url"></video></section>',
        { outer, inner, url },
      )
      outer.set(false)
      inner.set(false)
      url.set('/media/two.mp4')
      inner.set(true)
      await settle()
      expect(video.isConnected).toBe(false)
      expect(writes).toEqual(['/media/one.mp4'])
      outer.set(true)
      await settle()
      expect(video.isConnected).toBe(true)
      expect(writes).toEqual(['/media/one.mp4', '/media/two.mp4'])

      inner.set(false)
      outer.set(false)
      url.set('/media/three.mp4')
      outer.set(true)
      await settle()
      expect(writes).toHaveLength(2)
      inner.set(true)
      await settle()
      expect(writes).toEqual(['/media/one.mp4', '/media/two.mp4', '/media/three.mp4'])
    })

    it('suspends attributes on reused if/else branches and their descendants', async () => {
      const file = window.stx.state(true)
      const url = window.stx.state('/media/one.mp4')
      const { elements: [video, frame], writes: [videoWrites, frameWrites] } = await boot(
        '<section :if="file"><video data-player x-bind:src="url"></video></section>'
        + '<iframe data-player :else :src="url"></iframe>',
        { file, url },
      )
      window.stx.batch(() => {
        file.set(false)
        url.set('https://www.youtube-nocookie.com/embed/one')
      })
      await settle()
      expect(video.isConnected).toBe(false)
      expect(videoWrites).toEqual(['/media/one.mp4'])
      expect(frame.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/one')
      const frameWriteCount = frameWrites.length

      window.stx.batch(() => {
        file.set(true)
        url.set('/media/two.mp4')
      })
      await settle()
      expect(document.querySelector('video')).toBe(video)
      expect(videoWrites).toEqual(['/media/one.mp4', '/media/two.mp4'])
      expect(frameWrites).toHaveLength(frameWriteCount)
    })

    it('defers removals, booleans, ARIA states, and live control values too', async () => {
      const open = window.stx.state(true)
      const label = window.stx.state('one')
      const disabled = window.stx.state(false)
      const pressed = window.stx.state(true)
      const value = window.stx.state('first')
      const { elements: [input] } = await boot(
        '<input data-player :if="open" x-title="label" x-disabled="disabled" x-aria-pressed="pressed" x-value="value">',
        { open, label, disabled, pressed, value },
      )
      open.set(false)
      label.set(null)
      disabled.set(true)
      pressed.set(false)
      value.set('latest')
      await settle()
      expect(input.getAttribute('title')).toBe('one')
      expect(input.hasAttribute('disabled')).toBe(false)
      expect(input.getAttribute('aria-pressed')).toBe('true')
      expect(input.getAttribute('value')).toBe('first')
      open.set(true)
      await settle()
      expect(input.hasAttribute('title')).toBe(false)
      expect(input.hasAttribute('disabled')).toBe(true)
      expect(input.getAttribute('aria-pressed')).toBe('false')
      expect(input.getAttribute('value')).toBe('latest')
    })

    it('defers class and style bindings until the branch returns', async () => {
      const open = window.stx.state(true)
      const classes = window.stx.state('first')
      const styles = window.stx.state({ color: 'red' })
      const { elements: [element] } = await boot(
        '<div data-player :if="open" x-class="classes" x-style="styles"></div>',
        { open, classes, styles },
      )
      open.set(false)
      classes.set('latest')
      styles.set({ color: 'blue' })
      await settle()
      expect(element.className).toBe('first')
      expect((element as HTMLElement).style.color).toBe('red')
      open.set(true)
      await settle()
      expect(element.className).toBe('latest')
      expect((element as HTMLElement).style.color).toBe('blue')
    })
  })
}
