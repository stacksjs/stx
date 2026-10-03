/**
 * `<DateRangePicker>` — the picker four apps each maintained a copy of
 * (stacksjs/stx#1981).
 *
 * Range selection lives on `<Calendar mode="range">`, which is the half an app
 * cannot reasonably compose; this is the trigger, the panel and the preset row
 * around it. The reporter's four copies ran 12–16 buttons and 4–5 selects each,
 * hand-ported between repos — "four copies of the same bugs, fixed four times",
 * and the single largest piece of duplicated UI they had.
 *
 * Driven through the component's own scope rather than by clicking, like the
 * other component tests here: this harness renders `@click` without wiring it
 * as a DOM listener.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

interface Picker {
  scope: Record<string, any>
  /** The nested Calendar's own scope. */
  calendar: Record<string, any> | undefined
  errors: string[]
  dispose: () => Promise<void>
}

async function mount(tag = '<DateRangePicker />'): Promise<Picker> {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Calendar.stx': readFileSync(path.join(UI, 'calendar/Calendar.stx'), 'utf-8'),
    'components/DateRangePicker.stx': readFileSync(path.join(UI, 'date-range-picker/DateRangePicker.stx'), 'utf-8'),
    'pages/index.stx': page('app', `<div id="host">${tag}</div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.applyPreset === 'function') as Record<string, any>
  if (!scope)
    throw new Error('date range picker scope not registered')
  const calendar = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.selectDate === 'function') as Record<string, any> | undefined
  return { scope, calendar, errors: browser.errors, dispose: () => app.dispose() }
}

/** Days between two dates, counted inclusively — the way a preset means it. */
function inclusiveDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1
}

afterEach(() => {
  closeBrowser()
})

describe('#1981 — DateRangePicker presets', () => {
  it('shows the placeholder until something is chosen', async () => {
    const p = await mount()
    try {
      expect(p.scope.label()).toBe('Select dates')
      expect(p.scope.rangeStart()).toBeNull()
    }
    finally {
      await p.dispose()
    }
  })

  /*
   * Inclusive, ending today: "last 7 days" is today and the six before it,
   * which is what every dashboard means by it. Off by one here is the kind of
   * bug that was being fixed four times.
   */
  it('counts a preset inclusively, ending today', async () => {
    const p = await mount()
    try {
      for (const days of [7, 30, 90]) {
        p.scope.applyPreset(days)
        const from: Date = p.scope.rangeStart()
        const to: Date = p.scope.rangeEnd()

        expect(inclusiveDays(from, to), `${days}-day preset`).toBe(days)
        expect(to.toDateString()).toBe(new Date().toDateString())
      }
    }
    finally {
      await p.dispose()
    }
  })

  it('marks the preset in effect, and closes the panel', async () => {
    const p = await mount()
    try {
      p.scope.applyPreset(30)

      expect(p.scope.activePreset()).toBe(30)
      expect(p.scope.isOpen()).toBe(false)
    }
    finally {
      await p.dispose()
    }
  })

  it('takes its presets from the prop', async () => {
    const p = await mount('<DateRangePicker :presets="[1, 14]" />')
    try {
      p.scope.applyPreset(14)

      expect(inclusiveDays(p.scope.rangeStart(), p.scope.rangeEnd())).toBe(14)
    }
    finally {
      await p.dispose()
    }
  })

  it('labels a chosen range with both ends', async () => {
    const p = await mount()
    try {
      p.scope.applyPreset(7)

      expect(p.scope.label()).toContain(' - ')
      expect(p.scope.label()).not.toBe('Select dates')
    }
    finally {
      await p.dispose()
    }
  })

  it('clears back to the placeholder', async () => {
    const p = await mount()
    try {
      p.scope.applyPreset(7)
      p.scope.clear()

      expect(p.scope.rangeStart()).toBeNull()
      expect(p.scope.rangeEnd()).toBeNull()
      expect(p.scope.activePreset()).toBeNull()
      expect(p.scope.label()).toBe('Select dates')
    }
    finally {
      await p.dispose()
    }
  })
})

describe('#1981 — DateRangePicker and the calendar inside it', () => {
  /*
   * A half-made range is not an answer. Emitting on the first click would fire
   * `change` twice per selection, and a consumer refetching on it would run a
   * query against a range with no end.
   */
  it('waits for both ends before answering', async () => {
    const p = await mount()
    try {
      p.scope.onCalendarChange({ detail: { start: new Date(2026, 0, 10), end: null } })

      expect(p.scope.rangeStart()!.getDate()).toBe(10)
      expect(p.scope.rangeEnd()).toBeNull()
      // Still open, because the user is mid-selection.
      expect(p.scope.isOpen()).toBe(false)

      p.scope.onCalendarChange({ detail: { start: new Date(2026, 0, 10), end: new Date(2026, 0, 14) } })

      expect(p.scope.rangeEnd()!.getDate()).toBe(14)
    }
    finally {
      await p.dispose()
    }
  })

  it('stops calling it a preset once a range is picked by hand', async () => {
    const p = await mount()
    try {
      p.scope.applyPreset(7)
      expect(p.scope.activePreset()).toBe(7)

      p.scope.onCalendarChange({ detail: { start: new Date(2026, 0, 10), end: new Date(2026, 0, 14) } })

      expect(p.scope.activePreset()).toBeNull()
    }
    finally {
      await p.dispose()
    }
  })

  it('ignores an event with nothing in it', async () => {
    const p = await mount()
    try {
      p.scope.applyPreset(7)
      const before = p.scope.rangeStart()

      p.scope.onCalendarChange(null)
      p.scope.onCalendarChange({ detail: null })
      p.scope.onCalendarChange({ detail: { start: null, end: null } })

      expect(p.scope.rangeStart()).toBe(before)
    }
    finally {
      await p.dispose()
    }
  })

  /*
   * The composition itself: `@change` on the `<Calendar>` tag, the obvious
   * way. That once looked like it broke Calendar's own scope - its
   * `monthYearLabel` stopped resolving - but it was the test DOM dropping
   * every attribute after the first `@`-prefixed one, `data-stx-scope`
   * included (stacksjs/stx#2018). This asserts the arrangement stays clean.
   */
  it('nests a working Calendar, with no hydration complaints', async () => {
    const p = await mount()
    try {
      expect(p.errors).toEqual([])
      expect(p.calendar, 'Calendar registered its own scope').toBeTruthy()
      expect(typeof p.calendar!.monthYearLabel()).toBe('string')
    }
    finally {
      await p.dispose()
    }
  })

  it('hears a range picked on the Calendar through @change on its tag', async () => {
    const p = await mount()
    try {
      const from = new Date()
      from.setDate(from.getDate() - 3)
      const to = new Date()
      p.calendar!.selectDate(from)
      p.calendar!.selectDate(to)
      await settle()

      expect(p.scope.rangeStart()?.toDateString()).toBe(from.toDateString())
      expect(p.scope.rangeEnd()?.toDateString()).toBe(to.toDateString())
      expect(p.scope.activePreset()).toBeNull()
    }
    finally {
      await p.dispose()
    }
  })
})
