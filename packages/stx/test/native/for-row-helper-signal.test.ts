/**
 * The native host's half of test/router/for-row-helper-signal.test.ts: a :for
 * row on a native screen follows a signal its bindings read only through a
 * helper (the member's bookings, through action(item)).
 */
import { afterEach, expect, it } from 'bun:test'
import { unmountAllNativeScreens } from '../../src/native/testing'
import { mountWebView, webApp } from './web-view-app'

afterEach(() => unmountAllNativeScreens())

const SCREEN = `<script client>
  const sessions = state([])
  const bookings = state([])
  const membership = state(null)
  const loaded = state(false)
  const busyId = state(0)
  function classAction(session, booking) {
    if (booking && booking.status === 'waitlisted') return 'leave'
    return session.spots_left === 0 ? 'waitlist' : 'book'
  }
  function memberBookingFor(rows, id) { return rows.find(row => row.class_session_id === id && row.status !== 'cancelled') ?? null }
  function classActionLabel(a) { return ({ book: 'Book', waitlist: 'Join waitlist', leave: 'Leave waitlist' })[a] || '' }
  function classPlaceLine(a) { return a === 'leave' ? 'On the waitlist' : '' }
  const timetable = derived(() => [{ date: '2026-10-22', sessions: sessions() }])
  function action(item) { return classAction(item, memberBookingFor(bookings(), item.id)) }
  function canAct(item) {
    const next = action(item)
    if ((next === 'book' || next === 'waitlist') && loaded() && !membership()) return false
    return ['book', 'waitlist', 'cancel', 'leave'].includes(next)
  }
  function load(status) {
    sessions.set([{ id: 7, name: 'Strength', spots_left: 0 }, { id: 8, name: 'Yoga', spots_left: 2 }])
    bookings.set([{ id: 1, class_session_id: 7, status }])
    membership.set({ id: 3 })
    loaded.set(true)
  }
  window.probe = { load }
</script>
<div>
  <section :for="day in timetable" :key="day.date">
    <h2 :text="day.date"></h2>
    <div :for="item in day.sessions" :key="item.id">
      <p :text="item.name"></p>
      <p :if="classPlaceLine(action(item))" :text="classPlaceLine(action(item))"></p>
      <button :if="canAct(item)" type="button" :disabled="busyId !== 0" :text="classActionLabel(action(item))"></button>
    </div>
  </section>
</div>
`

it('a native :for row redraws when only a signal a helper reads changes', async () => {
  const root = webApp({ 'views/classes.stx': SCREEN })
  const phone = await mountWebView(root, { Classes: 'views/classes.stx' }, 'Classes')
  phone.context.probe.load('cancelled')
  await phone.settle()
  expect(phone.texts()).toContain('Join waitlist')
  phone.context.probe.load('waitlisted')
  await phone.settle()
  expect(phone.texts()).toContain('On the waitlist')
  expect(phone.texts()).toContain('Leave waitlist')
  expect(phone.texts()).not.toContain('Join waitlist')
}, 30_000)
