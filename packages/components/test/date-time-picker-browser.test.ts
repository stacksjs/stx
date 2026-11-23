import type { BrowserPage } from './support/browser-page'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { openBrowserPage } from './support/browser-page'

let page: BrowserPage
beforeAll(async () => {
  page = await openBrowserPage({ name: 'date-time-picker', ready: 'window.scheduleProbe && document.querySelector("[data-date-time-trigger]")', body: `<script client>
const value = state('2026-12-01T14:30:00Z'); const zone = state('America/New_York'); const min = state(null); const max = state(null)
const disabled = state(false); const shown = state(true); const suggested = state('2026-12-03T17:00:00Z'); const changes = []
function changed(detail) { changes.push(detail); value.set(detail.value) }
window.scheduleProbe = { value, zone, min, max, disabled, shown, suggested, changes }
</script><div :if="shown"><DateTimePicker :value="value" :timeZone="zone" :minDate="min" :maxDate="max" :disabled="disabled" :suggestedTime="suggested" @change="changed" /></div><button id="outside">Outside</button>` })
}, 90_000)
afterAll(() => page?.close())

const open = async () => {
  await page.run('document.querySelector("[data-date-time-trigger]").click()')
  expect(await page.until('document.querySelector("[data-date-time-clock]") && document.querySelector("[data-date-time-panel] button[aria-selected=true]")')).toBe(true)
}
const close = async () => {
  await page.run('document.querySelector("[data-date-time-cancel]")?.click()')
  expect(await page.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
}

describe('shared workspace DateTimePicker (#2222)', () => {
  it('edits in the workspace zone, uses Calendar, and emits only after Apply', async () => {
    await open()
    expect(await page.json('return document.querySelector("[data-date-time-clock]").value')).toBe('09:30')
    expect(await page.json('return document.querySelector("[data-date-time-panel]").textContent')).toContain('America/New_York')
    await page.run(`const panel = document.querySelector('[data-date-time-panel]');
const day = Array.from(panel.querySelectorAll('button[aria-label]')).find(button => button.getAttribute('aria-label') === '12/2/2026');
if (!day) throw new Error('Calendar day missing'); day.click();`)
      expect(await page.json('return scheduleProbe.changes.length')).toBe(0)
      await page.run(`const input = document.querySelector('[data-date-time-clock]'); input.value = '16:45'; input.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-date-time-apply]').click()`)
      expect(await page.until('scheduleProbe.changes.length === 1')).toBe(true)
      expect(await page.json('return scheduleProbe.changes[0]')).toEqual({ value: '2026-12-02T21:45:00.000Z', timeZone: 'America/New_York', preset: null })
      expect(await page.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
      expect(await page.json('return document.activeElement.hasAttribute("data-date-time-trigger")')).toBe(true)
    })

    it('follows parent value/zone/bounds updates without replacing its trigger', async () => {
      await page.run("window.originalTrigger = document.querySelector('[data-date-time-trigger]'); scheduleProbe.zone.set('Asia/Manila'); scheduleProbe.value.set('2026-12-05T16:15:00Z')")
      await open()
      expect(await page.json('return document.querySelector("[data-date-time-clock]").value')).toBe('00:15')
      expect(await page.json('return document.querySelector("button[aria-selected=true]").textContent')).toBe('6')
      await page.run("scheduleProbe.value.set('2026-12-07T01:00Z'); scheduleProbe.min.set('2026-12-07T02:00Z')")
      expect(await page.until('document.querySelector("[data-date-time-clock]").value === "09:00" && document.querySelector("[data-date-time-apply]").disabled')).toBe(true)
      const count = await page.json('return scheduleProbe.changes.length')
      await page.run("document.querySelector('[data-date-time-apply]').click()")
      expect(await page.json('return scheduleProbe.changes.length')).toBe(count)
      expect(await page.json('return document.querySelector("[data-date-time-trigger]") === window.originalTrigger')).toBe(true)
      await page.run('scheduleProbe.min.set(null)')
      await close()
    })

    it('supports app-owned recommendations and rejects a DST gap', async () => {
      await page.run("scheduleProbe.zone.set('America/New_York'); scheduleProbe.value.set('2026-03-08T06:30:00Z')")
      await open()
      await page.run(`const input = document.querySelector('[data-date-time-clock]'); input.value = '02:30'; input.dispatchEvent(new Event('input', { bubbles: true }))`)
      expect(await page.until('document.querySelector("[data-date-time-apply]").disabled')).toBe(true)
      expect(await page.json('return document.querySelector("[data-date-time-panel]").textContent')).toContain('may not exist')
      await page.run("document.querySelector('[data-date-time-preset=suggested]').click()")
      expect(await page.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
      expect(await page.json('return scheduleProbe.changes[scheduleProbe.changes.length - 1]')).toEqual({ value: '2026-12-03T17:00:00.000Z', timeZone: 'America/New_York', preset: 'suggested' })
    })

    it('preserves an existing later folded instant and supports Escape and clear', async () => {
      await page.run("scheduleProbe.value.set('2026-11-01T06:30:15.123Z')")
      await open()
      await page.run("document.querySelector('[data-date-time-apply]').click()")
      expect(await page.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
      expect(await page.json('return scheduleProbe.value()')).toBe('2026-11-01T06:30:15.123Z')
      await open()
      await page.run("document.querySelector('[data-date-time-clock]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))")
      expect(await page.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
      await open()
      await page.run("document.querySelector('[data-date-time-clear]').click()")
      expect(await page.until('scheduleProbe.value() === null')).toBe(true)
    })

    it('reacts to disabled and survives a conditional remount with current props', async () => {
      await page.run('scheduleProbe.disabled.set(true)')
      expect(await page.until('document.querySelector("[data-date-time-trigger]").disabled')).toBe(true)
      await page.run("document.querySelector('[data-date-time-trigger]').click()")
      expect(await page.json('return !!document.querySelector("[data-date-time-panel]")')).toBe(false)
      await page.run('scheduleProbe.shown.set(false)')
      expect(await page.until('!document.querySelector("[data-date-time-trigger]")')).toBe(true)
      await page.run("scheduleProbe.disabled.set(false); scheduleProbe.zone.set('UTC'); scheduleProbe.value.set('2027-01-02T10:45Z'); scheduleProbe.shown.set(true)")
      expect(await page.until('document.querySelector("[data-date-time-trigger]")')).toBe(true)
      await open()
      expect(await page.json('return document.querySelector("[data-date-time-clock]").value')).toBe('10:45')
      await close()
      expect(await page.errors()).toEqual([])
    })
  })

  it('wires both relative shortcuts and blocks an invalid workspace timezone', async () => {
    await open()
    const hour = await page.json(`const before = Date.now(); document.querySelector('[data-date-time-preset=hour]').click(); const after = Date.now(); const detail = scheduleProbe.changes[scheduleProbe.changes.length - 1]; return { before, after, detail }`)
    expect(hour.detail.preset).toBe('hour')
    expect(Date.parse(hour.detail.value)).toBeGreaterThanOrEqual(hour.before + 3600000)
    expect(Date.parse(hour.detail.value)).toBeLessThanOrEqual(hour.after + 3600000)
    await open()
    const tomorrow = await page.json(`const now = new Date(); const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 9)).toISOString(); document.querySelector('[data-date-time-preset=tomorrow]').click(); return { expected, detail: scheduleProbe.changes[scheduleProbe.changes.length - 1] }`)
    expect(tomorrow.detail).toEqual({ value: tomorrow.expected, timeZone: 'UTC', preset: 'tomorrow' })
    await open()
    await page.run("scheduleProbe.zone.set('not/a-timezone')")
    expect(await page.until('document.querySelector("[data-date-time-apply]").disabled')).toBe(true)
    expect(await page.json('return document.querySelector("[data-date-time-panel]").textContent')).toContain('valid workspace timezone')
    await page.run("scheduleProbe.zone.set('UTC')")
    await close()
    expect(await page.errors()).toEqual([])
  })

  it('retains a choice when used without a parent value binding', async () => {
    const standalone = await openBrowserPage({ name: 'date-time-uncontrolled', body: '<DateTimePicker timeZone="UTC" />', ready: 'document.querySelector("[data-date-time-trigger]") && window.stx' })
    try {
      await standalone.run('document.querySelector("[data-date-time-trigger]").click()')
      expect(await standalone.until('document.querySelector("[data-date-time-preset=tomorrow]")')).toBe(true)
      await standalone.run('document.querySelector("[data-date-time-preset=tomorrow]").click()')
      expect(await standalone.until('!document.querySelector("[data-date-time-panel]")')).toBe(true)
      expect(await standalone.json('return document.querySelector("[data-date-time-trigger]").textContent')).not.toContain('Choose date and time')
      await standalone.run('document.querySelector("[data-date-time-trigger]").click()')
      expect(await standalone.until('document.querySelector("[data-date-time-clock]")?.value === "09:00"')).toBe(true)
      expect(await standalone.errors()).toEqual([])
    }
    finally { standalone.close() }
  })

it('keeps its panel within a small viewport when the trigger is near the footer', async () => {
  const compact = await openBrowserPage({ name: 'date-time-viewport', width: 375, height: 500, body: '<div style="position:absolute;right:16px;bottom:16px"><DateTimePicker /></div>', ready: 'document.querySelector("[data-date-time-trigger]") && window.stx' })
  try {
    await compact.run('document.querySelector("[data-date-time-trigger]").click()')
    expect(await compact.until('document.querySelector("[data-date-time-panel]")?.style.top')).toBe(true)
    const bounds = await compact.json('const r = document.querySelector("[data-date-time-panel]").getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight }')
    expect(bounds.left).toBeGreaterThanOrEqual(7)
    expect(bounds.top).toBeGreaterThanOrEqual(7)
    expect(bounds.right).toBeLessThanOrEqual(bounds.width - 7)
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.height - 7)
    expect(await compact.errors()).toEqual([])
  }
  finally { compact.close() }
})
