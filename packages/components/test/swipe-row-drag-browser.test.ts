/**
 * A SwipeRow on a web page follows a finger and settles open or closed
 * (the request from lastsoulultra/HQ: it used to jump), in a real browser.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { swipeOffset, swipeSettlesOpen } from '../src/ui/list/swipe-row'
import { type BrowserPage, openBrowserPage } from './support/browser-page'

describe('the settle rules', () => {
  it('rubber-bands past the ends', () => {
    expect(swipeOffset(-40, 88)).toBe(-40)
    expect(swipeOffset(30, 88)).toBe(10)
    expect(swipeOffset(-118, 88)).toBe(-98)
  })
  it('opens past half the reveal or on a leftward fling', () => {
    expect(swipeSettlesOpen(-50, 88)).toBe(true)
    expect(swipeSettlesOpen(-40, 88)).toBe(false)
    expect(swipeSettlesOpen(-20, 88, -0.8)).toBe(true)
    expect(swipeSettlesOpen(-80, 88, 0.8)).toBe(false)
  })
})

let page: BrowserPage
beforeAll(async () => {
  page = await openBrowserPage({
    name: 'swipe-row-drag',
    width: 390,
    ready: 'document.querySelector("[testid=row-actions]") && window.stx',
    body: `<SwipeRow testID="row" :actions="[{ id: 'delete', label: 'Delete', destructive: true }]"><p>Row</p></SwipeRow>`,
  })
}, 90_000)
afterAll(() => page?.close())

const slider = 'document.querySelector("[testid=row-delete]").parentElement.parentElement'
const pointer = (type: string, x: number, y = 20) => `${slider}.dispatchEvent(new PointerEvent(${JSON.stringify(type)}, { pointerType: 'touch', pointerId: 1, clientX: ${x}, clientY: ${y}, bubbles: true }))`

it('follows a horizontal touch drag 1:1, without a transition, and settles open', async () => {
  await page.run(pointer('pointerdown', 300))
  await page.run(pointer('pointermove', 290))
  await page.run(pointer('pointermove', 260))
  expect(await page.json(`return [${slider}.style.transform, ${slider}.style.transition]`)).toEqual(['translateX(-40px)', 'none'])
  await page.run(pointer('pointermove', 240))
  await page.run(pointer('pointerup', 240))
  expect(await page.until(`${slider}.style.transform === 'translateX(-88px)'`)).toBe(true)
  expect(await page.json(`return [${slider}.style.transition, document.querySelector("[testid=row-actions]").getAttribute('aria-expanded')]`)).toEqual(['transform 250ms ease-out', 'true'])
})

it('settles closed when let go short of half, and leaves a vertical drag to the page', async () => {
  await page.run(pointer('pointerdown', 200))
  await page.run(pointer('pointermove', 230))
  await page.run(pointer('pointermove', 260))
  await page.run(pointer('pointerup', 260))
  expect(await page.until(`${slider}.style.transform === 'translateX(0px)'`)).toBe(true)
  await page.run(`${pointer('pointerdown', 200, 20)}; ${pointer('pointermove', 195, 60)}; ${pointer('pointermove', 150, 90)}`)
  expect(await page.json(`return ${slider}.style.transform`), 'a vertical drag never moves the row').toBe('translateX(0px)')
  await page.run(pointer('pointerup', 150, 90))
  expect(await page.errors()).toEqual([])
})
