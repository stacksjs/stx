/**
 * A bound iframe src that changes does not pile up history.
 *
 * Every navigation of a frame already on the page is an entry in the page's
 * own history. A workout player that showed each step's video in one frame,
 * re-pointed per step, left an entry per step, and Back had to be tapped
 * through all of them before it left the screen. The runtime now takes the
 * frame out of the page, points it, and puts it back: a frame inserted afresh
 * loads without an entry, and its old ones go with it. The element stays the
 * same one, so its other bindings keep working.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

let booted = 0
async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `frame_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('a bound iframe src', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('re-points the same frame through a fresh insertion, not a navigation', async () => {
    const url = window.stx.state('https://www.youtube-nocookie.com/embed/one')
    await boot('<div data-box><iframe data-frame x-src="url"></iframe><p data-after>after</p></div>', { url })
    const frame = document.querySelector('[data-frame]')
    expect(frame.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/one')

    const removed: unknown[] = []
    const observer = new window.MutationObserver((records: any[]) => records.forEach(record => removed.push(...record.removedNodes)))
    observer.observe(document.querySelector('[data-box]'), { childList: true })

    url.set('https://www.youtube-nocookie.com/embed/two')
    await settle()
    observer.disconnect()

    const now = document.querySelector('[data-frame]')
    expect(now).toBe(frame)
    expect(now.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/two')
    expect(removed).toContain(frame)
    // Back where it was, before the paragraph that followed it.
    expect(now.nextElementSibling?.getAttribute('data-after')).toBe('')
  })

  it('leaves an unchanged src, and other elements, alone', async () => {
    const url = window.stx.state('/media/a.jpg')
    await boot('<div data-box2><img data-img x-src="url"></div>', { url })
    const removed: unknown[] = []
    const observer = new window.MutationObserver((records: any[]) => records.forEach(record => removed.push(...record.removedNodes)))
    observer.observe(document.querySelector('[data-box2]'), { childList: true })
    url.set('/media/b.jpg')
    await settle()
    observer.disconnect()
    expect(document.querySelector('[data-img]').getAttribute('src')).toBe('/media/b.jpg')
    expect(removed).toHaveLength(0)
  })

  it('does not write a src that is already the frame\'s own', async () => {
    // A rest and the set after it share a video: the binding re-runs on the
    // step change with the same URL. Writing it again reloads the frame,
    // and every reload was an entry in the page's history.
    const step = window.stx.state(0)
    const videos = ['https://www.youtube-nocookie.com/embed/same', 'https://www.youtube-nocookie.com/embed/same']
    await boot('<div data-box3><iframe data-frame3 x-src="videos[step]"></iframe></div>', { step, videos })
    const frame = document.querySelector('[data-frame3]')
    const writes: string[] = []
    const observer = new window.MutationObserver((records: any[]) => records.forEach(record => writes.push(record.attributeName)))
    observer.observe(frame, { attributes: true, attributeFilter: ['src'] })
    step.set(1)
    await settle()
    observer.disconnect()
    expect(frame.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/same')
    expect(writes).toHaveLength(0)
  })
})
