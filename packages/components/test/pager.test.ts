/**
 * Pager: full-width pages in a scroll-snap track, the page shown a model the
 * page drives with its own buttons. Driven by the real runtime through the SPA
 * harness. The harness lays nothing out, so the swipe test gives the track a
 * width and scrolls it by hand.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')
const component = (rel: string) => readFileSync(path.join(UI, rel), 'utf-8')

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Pager.stx': component('pager/Pager.stx'),
  'components/PagerDots.stx': component('pager/PagerDots.stx'),
  'pages/tour.stx': page('app', `<script client>
const step = state(1)
const changes = []
const slides = state([{ id: 'b', title: 'Two' }, { id: 'c', title: 'Three' }])
window.PAGE = { step, changes, slides }
</script>
<Pager v-model:index="step" label="Welcome tour" dotsLabel="Tour pages" @change="changes.push($event)">
  <section data-id="a"><input data-field /> One</section>
  <section :for="slide in slides" :key="slide.id" :data-id="slide.id">{{ slide.title }}</section>
</Pager>`),
  'pages/locked.stx': page('app', `<script client>
const step = state(0)
window.PAGE = { step }
</script>
<Pager v-model:index="step" swipe="false" dots="false" label="Questions">
  <section>Q1</section>
  <section>Q2</section>
</Pager>
<PagerDots v-model:index="step" :count="2" label="Question pages" className="text-white" />`),
}

const ROUTES = { '/tour': 'pages/tour.stx', '/locked': 'pages/locked.stx' }

async function open(route: string) {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, route)
  await settle(20)
  return { browser, dispose: () => app.dispose() }
}

function slides(browser: any): any[] {
  return Array.from(browser.document.querySelectorAll('.stx-pager-track > section'))
}

function current(browser: any): string[] {
  return slides(browser).map((s: any) => `${s.getAttribute('aria-label')}:${s.hasAttribute('inert') ? 'inert' : 'live'}`)
}

function press(browser: any, el: any, key: string) {
  el.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

afterEach(() => closeBrowser())

describe('Pager', () => {
  it('is a named carousel whose pages are labelled slides, the ones off screen inert', async () => {
    const { browser, dispose } = await open('/tour')
    try {
      const region = browser.document.querySelector('[aria-roledescription="carousel"]')
      expect(region.getAttribute('aria-label')).toBe('Welcome tour')
      expect(slides(browser).every((s: any) => s.getAttribute('aria-roledescription') === 'slide')).toBe(true)
      expect(current(browser)).toEqual(['1 of 3:inert', '2 of 3:live', '3 of 3:inert'])
    }
    finally { await dispose() }
  })

  it('draws a dot per page, the current one marked, and a dot moves there', async () => {
    const { browser, dispose } = await open('/tour')
    try {
      const dots = Array.from(browser.document.querySelectorAll('[aria-label="Tour pages"] button')) as any[]
      expect(dots.map(d => d.getAttribute('aria-label'))).toEqual(['Go to page 1', 'Go to page 2', 'Go to page 3'])
      expect(dots.map(d => d.getAttribute('aria-current'))).toEqual([null, 'step', null])
      dots[2].click()
      await settle()
      expect(browser.window.PAGE.step()).toBe(2)
      expect(browser.window.PAGE.changes).toEqual([2])
      expect(current(browser)).toEqual(['1 of 3:inert', '2 of 3:inert', '3 of 3:live'])
    }
    finally { await dispose() }
  })

  it('follows the page\'s model and keeps up with pages a :for adds', async () => {
    const { browser, dispose } = await open('/tour')
    try {
      browser.window.PAGE.step.set(0)
      await settle()
      expect(current(browser)[0]).toBe('1 of 3:live')
      browser.window.PAGE.slides.set([...browser.window.PAGE.slides(), { id: 'd', title: 'Four' }])
      await settle(30)
      expect(current(browser)).toEqual(['1 of 4:live', '2 of 4:inert', '3 of 4:inert', '4 of 4:inert'])
      expect(browser.document.querySelectorAll('[aria-label="Tour pages"] button').length).toBe(4)
    }
    finally { await dispose() }
  })

  it('steps with the arrow keys, but not while typing in a field', async () => {
    const { browser, dispose } = await open('/tour')
    try {
      const region = browser.document.querySelector('[aria-roledescription="carousel"]')
      press(browser, region, 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.step()).toBe(2)
      press(browser, region, 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.step()).toBe(2)
      browser.window.PAGE.step.set(0)
      await settle()
      press(browser, browser.document.querySelector('[data-field]'), 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.step()).toBe(0)
    }
    finally { await dispose() }
  })

  it('reports a swipe that settles on another page', async () => {
    const { browser, dispose } = await open('/tour')
    try {
      const track = browser.document.querySelector('.stx-pager-track')
      Object.defineProperty(track, 'clientWidth', { configurable: true, get: () => 400 })
      track.scrollLeft = 800
      track.dispatchEvent(new browser.window.Event('scroll'))
      await settle(40)
      expect(browser.window.PAGE.step()).toBe(2)
      expect(browser.window.PAGE.changes).toEqual([2])
    }
    finally { await dispose() }
  })

  it('leaves moving to the page\'s buttons with swipe="false", dots placed apart', async () => {
    const { browser, dispose } = await open('/locked')
    try {
      const track = browser.document.querySelector('.stx-pager-track')
      expect(track.className).toContain('overflow-x-hidden')
      expect(track.className).not.toContain('snap-mandatory')
      expect(browser.document.querySelector('[aria-roledescription="carousel"] [role="group"][aria-label="Pages"]')).toBeNull()
      press(browser, browser.document.querySelector('[aria-roledescription="carousel"]'), 'ArrowRight')
      await settle()
      expect(browser.window.PAGE.step()).toBe(0)

      const dots = Array.from(browser.document.querySelectorAll('[aria-label="Question pages"] button')) as any[]
      expect(dots.length).toBe(2)
      dots[1].click()
      await settle()
      expect(browser.window.PAGE.step()).toBe(1)
      expect(current(browser)).toEqual(['1 of 2:inert', '2 of 2:live'])
    }
    finally { await dispose() }
  })
})
