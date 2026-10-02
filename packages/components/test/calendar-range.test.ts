/**
 * `<Calendar mode="range">`, and the class bug it uncovered
 * (stacksjs/stx#1981).
 *
 * Calendar was single-date only — `value`, `minDate`, `maxDate`,
 * `disabledDates`, `locale`, `firstDayOfWeek`, `showToday`, `highlightToday`
 * and nothing else — so every app needing "last 7 days / custom range" built
 * its own picker. The reporter has four near-identical copies hand-ported
 * between repos: "four copies of the same bugs, fixed four times", and the
 * single largest piece of duplicated UI they have.
 *
 * Range selection is the half an app cannot reasonably compose from what
 * exists, which is why it lands here rather than in `<DateRangePicker>`.
 *
 * Driven through the component's own scope rather than by clicking: this
 * harness renders the `@click` attribute without wiring it as a DOM listener,
 * the same reason dialog-modal-behaviour.test.ts calls its handler directly.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

const FILES = (tag: string) => ({
  'layouts/app.stx': layout(''),
  'components/Calendar.stx': readFileSync(path.join(UI, 'calendar/Calendar.stx'), 'utf-8'),
  'pages/index.stx': page('app', `<div id="host">${tag}</div>`),
})

interface Cal {
  scope: Record<string, any>
  dispose: () => Promise<void>
}

async function mount(tag: string): Promise<Cal> {
  const app = await renderApp(FILES(tag), { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()
  const scopes = browser.window.stx._scopes || {}
  const scope = Object.values(scopes).find((s: any) => typeof s?.selectDate === 'function') as Record<string, any>
  if (!scope)
    throw new Error('calendar scope not registered')
  return { scope, dispose: () => app.dispose() }
}

const day = (y: number, m: number, d: number) => new Date(y, m, d)

afterEach(() => {
  closeBrowser()
})

describe('#1981 — Calendar range mode', () => {
  it('opens a range on the first click and closes it on the second', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))

      expect(cal.scope.rangeStart()).not.toBeNull()
      expect(cal.scope.rangeEnd()).toBeNull()

      cal.scope.selectDate(day(2026, 0, 14))

      expect(cal.scope.rangeStart()!.getDate()).toBe(10)
      expect(cal.scope.rangeEnd()!.getDate()).toBe(14)
    }
    finally {
      await cal.dispose()
    }
  })

  /*
   * Clicking before the start reads as "I meant to begin here", which is what
   * every range picker does rather than refusing the click.
   */
  it('orders the range when the second click is earlier', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 20))
      cal.scope.selectDate(day(2026, 0, 5))

      expect(cal.scope.rangeStart()!.getDate()).toBe(5)
      expect(cal.scope.rangeEnd()!.getDate()).toBe(20)
    }
    finally {
      await cal.dispose()
    }
  })

  it('starts a new range once one is complete', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 5))
      cal.scope.selectDate(day(2026, 0, 9))
      cal.scope.selectDate(day(2026, 0, 20))

      expect(cal.scope.rangeStart()!.getDate()).toBe(20)
      expect(cal.scope.rangeEnd()).toBeNull()
    }
    finally {
      await cal.dispose()
    }
  })

  it('includes the days between the ends, and excludes those outside', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))
      cal.scope.selectDate(day(2026, 0, 14))

      expect(cal.scope.isInSpan(day(2026, 0, 12))).toBe(true)
      expect(cal.scope.isInSpan(day(2026, 0, 10))).toBe(true)
      expect(cal.scope.isInSpan(day(2026, 0, 14))).toBe(true)
      expect(cal.scope.isInSpan(day(2026, 0, 9))).toBe(false)
      expect(cal.scope.isInSpan(day(2026, 0, 15))).toBe(false)
    }
    finally {
      await cal.dispose()
    }
  })

  /*
   * The span previews between the two clicks. Without it a range picker gives
   * no feedback at the moment the user is deciding.
   */
  it('previews the span under the cursor while the range is half-made', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))
      cal.scope.onDayHover(day(2026, 0, 13))

      expect(cal.scope.isInSpan(day(2026, 0, 12))).toBe(true)

      // And stops once the range is settled, so the preview cannot outlive it.
      cal.scope.selectDate(day(2026, 0, 11))
      cal.scope.onDayHover(day(2026, 0, 20))

      expect(cal.scope.isInSpan(day(2026, 0, 15))).toBe(false)
    }
    finally {
      await cal.dispose()
    }
  })

  it('leaves single mode exactly as it was', async () => {
    const cal = await mount('<Calendar />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))

      expect(cal.scope.selectedDate()!.getDate()).toBe(10)
      // Range state stays untouched, so nothing paints a span.
      expect(cal.scope.rangeStart()).toBeNull()
      expect(cal.scope.isInSpan(day(2026, 0, 10))).toBe(false)
    }
    finally {
      await cal.dispose()
    }
  })
})

/**
 * The bug found while adding the above: every branch of `dayClasses` appended
 * straight onto the previous string, so the class either side of each join was
 * destroyed —
 *
 *   flex … transition-colorstext-fgcursor-pointer hover:bg-surface-hoverbg-accent-solid
 *
 * Five classes lost, `bg-accent-solid` among them, so the SELECTED day had no
 * background at all in every app shipping this component.
 */
describe('#1981 — a day cell keeps every class it is given', () => {
  it('separates the classes it joins', async () => {
    const cal = await mount('<Calendar />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))
      const cls: string = cal.scope.dayClasses({ date: day(2026, 0, 10), isCurrentMonth: true })
      const classes = cls.split(/\s+/).filter(Boolean)

      // The three that were being eaten at the joins.
      expect(classes).toContain('transition-colors')
      expect(classes).toContain('text-fg')
      expect(classes).toContain('cursor-pointer')
      // And the one whose loss made the selected day invisible.
      expect(classes).toContain('bg-accent-solid')
      // Nothing welded together.
      expect(cls).not.toMatch(/colorstext|hoverbg|-hoverbg-/)
    }
    finally {
      await cal.dispose()
    }
  })

  it('paints a range middle differently from its ends', async () => {
    const cal = await mount('<Calendar mode="range" />')
    try {
      cal.scope.selectDate(day(2026, 0, 10))
      cal.scope.selectDate(day(2026, 0, 14))

      const end = cal.scope.dayClasses({ date: day(2026, 0, 10), isCurrentMonth: true }).split(/\s+/)
      const middle = cal.scope.dayClasses({ date: day(2026, 0, 12), isCurrentMonth: true }).split(/\s+/)
      const outside = cal.scope.dayClasses({ date: day(2026, 0, 20), isCurrentMonth: true }).split(/\s+/)

      expect(end).toContain('bg-accent-solid')
      expect(middle).toContain('bg-accent-soft')
      expect(middle).toContain('text-accent-soft-ink')
      // Square middles, rounded ends, or a run reads as separate chips.
      expect(middle).toContain('rounded-none')
      expect(end).toContain('rounded-control')
      expect(outside).not.toContain('bg-accent-soft')
    }
    finally {
      await cal.dispose()
    }
  })
})

/**
 * `<Calendar />` with no props renders a real month (stacksjs/stx#1981).
 *
 * The client script inlined each optional date through
 * `{{ iso === null ? 'null' : iso }}`, which emits the STRING `"null"` —
 * `{{ }}` in a client script produces a JSON literal — so the guard
 * `"null" ? new Date("null") : null` was always taken and every optional date
 * became an Invalid Date. With no props at all:
 *
 *   currentMonth   Invalid Date
 *   monthYearLabel "Invalid Date NaN"
 *   selectedDate   Invalid Date
 *   minDate        Invalid Date
 *   calendarDays   42 cells, every date Invalid
 *
 * So the component has never worked without an explicit `value`, which is
 * some of why four apps hand-rolled a date picker rather than composing this
 * one. Found while adding range mode, and the larger half of that work.
 */
describe('#1981 — Calendar works with no props at all', () => {
  it('renders a real month, not Invalid Date', async () => {
    const cal = await mount('<Calendar />')
    try {
      const month: Date = cal.scope.currentMonth()

      expect(Number.isNaN(month.getTime())).toBe(false)
      expect(String(cal.scope.monthYearLabel())).not.toContain('Invalid')
      expect(String(cal.scope.monthYearLabel())).not.toContain('NaN')
    }
    finally {
      await cal.dispose()
    }
  })

  it('gives every day cell a real date', async () => {
    const cal = await mount('<Calendar />')
    try {
      const days: Array<{ date: Date }> = cal.scope.calendarDays()

      expect(days.length).toBe(42)
      expect(days.every(d => !Number.isNaN(d.date.getTime()))).toBe(true)
    }
    finally {
      await cal.dispose()
    }
  })

  /*
   * The absent ones are absent, rather than Invalid Dates pretending to be
   * present. `isDisabled` compared against them and every comparison with an
   * Invalid Date is false, so the bounds silently did nothing.
   */
  it('leaves an unset date null rather than invalid', async () => {
    const cal = await mount('<Calendar />')
    try {
      expect(cal.scope.minDate).toBeNull()
      expect(cal.scope.maxDate).toBeNull()
      expect(cal.scope.selectedDate()).toBeNull()
      expect(cal.scope.rangeStart()).toBeNull()
      expect(cal.scope.rangeEnd()).toBeNull()
    }
    finally {
      await cal.dispose()
    }
  })

  it('still honours the bounds it is given', async () => {
    const cal = await mount('<Calendar min-date="2026-01-10" max-date="2026-01-20" />')
    try {
      expect(cal.scope.minDate).not.toBeNull()
      expect(Number.isNaN(cal.scope.minDate.getTime())).toBe(false)
      // And they actually gate a click now that they are real dates.
      expect(cal.scope.isDisabled(day(2026, 0, 5))).toBe(true)
      expect(cal.scope.isDisabled(day(2026, 0, 15))).toBe(false)
      expect(cal.scope.isDisabled(day(2026, 0, 25))).toBe(true)
    }
    finally {
      await cal.dispose()
    }
  })
})
