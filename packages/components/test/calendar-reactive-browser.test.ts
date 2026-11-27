import { afterAll, beforeAll, expect, it } from 'bun:test'
import { type BrowserPage, openBrowserPage } from './support/browser-page'

let page: BrowserPage
beforeAll(async () => {
  page = await openBrowserPage({ name: 'calendar-reactive', ready: 'window.calendarProbe && document.querySelector("[data-calendar-host] button[aria-selected=true]")', body: `<script client>
const locale = state('en-US'); const value = state('2026-12-15T00:00:00'); const min = state(null); const max = state(null); const shown = state(true)
const previousLabel = state(undefined); const nextLabel = state(undefined)
window.calendarProbe = { value, min, max, shown, locale, previousLabel, nextLabel }
</script><div data-calendar-host :if="shown"><Calendar :value="value" :minDate="min" :maxDate="max" :locale="locale" :previousMonthLabel="previousLabel" :nextMonthLabel="nextLabel" /></div>` })
}, 90_000)
afterAll(() => page?.close())

it('updates the chosen date and month from parent data and clears selection', async () => {
  await page.run("calendarProbe.value.set('2027-01-20T00:00:00')")
  expect(await page.until('document.querySelector("button[aria-selected=true]")?.textContent === "20"')).toBe(true)
  expect(await page.json('return document.querySelector("[data-calendar-host]").textContent')).toContain('2027')
  await page.run('calendarProbe.value.set(null)')
  expect(await page.until('!document.querySelector("button[aria-selected=true]")')).toBe(true)
})

it('updates bounds without replacing the calendar root and restores a remount', async () => {
  await page.run("calendarProbe.value.set('2026-12-15T00:00:00'); window.originalCalendar = document.querySelector('[data-calendar-host] > div')")
  expect(await page.until('document.querySelector("button[aria-selected=true]")?.textContent === "15"')).toBe(true)
  await page.run("calendarProbe.min.set('2026-12-16T00:00:00'); calendarProbe.max.set('2026-12-20T00:00:00')")
  expect(await page.until('document.querySelector("button[aria-selected=true]")?.disabled === true')).toBe(true)
  expect(await page.json("return document.querySelector('[data-calendar-host] > div') === window.originalCalendar")).toBe(true)
  await page.run('calendarProbe.shown.set(false)')
  expect(await page.until('!document.querySelector("[data-calendar-host]")')).toBe(true)
  await page.run("calendarProbe.min.set(null); calendarProbe.max.set(null); calendarProbe.value.set('2027-02-10T00:00:00'); calendarProbe.shown.set(true)")
  expect(await page.until('document.querySelector("button[aria-selected=true]")?.textContent === "10"')).toBe(true)
  expect(await page.errors()).toEqual([])
})

it('updates the displayed locale without changing the selected day', async () => {
  await page.run("calendarProbe.locale.set('fr-FR')")
  expect(await page.until('document.querySelector("[data-calendar-host]").textContent.includes("février")')).toBe(true)
  expect(await page.json('return document.querySelector("button[aria-selected=true]").textContent')).toBe('10')
  expect(await page.errors()).toEqual([])
})

it('accepts localized accessible names for previous and next month', async () => {
  const buttonsNamed = (labels: string[]) => labels.map(label => `document.querySelector('[data-calendar-host] button[aria-label="${label}"]')`).join(' && ')
  const defaults = buttonsNamed(['Previous month', 'Next month'])
  expect(await page.json(`return Boolean(${defaults})`)).toBe(true)
  await page.run("calendarProbe.previousLabel.set('Mes anterior'); calendarProbe.nextLabel.set('Mes siguiente')")
  expect(await page.until(buttonsNamed(['Mes anterior', 'Mes siguiente']))).toBe(true)
  expect(await page.json(`return Boolean(${defaults})`)).toBe(false)
  expect(await page.errors()).toEqual([])
})
