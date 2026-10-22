/**
 * A binding in a :for row re-runs when a signal it read through a helper
 * changes, whether or not the row's item did.
 *
 * Pinned with HQ's member timetable as it was before it worked around a report
 * that it did not (hq.training b23c332a5): two nested keyed loops, and a row
 * whose place line and button read the member's bookings only through
 * action(item). Joining a full class's waitlist rewrites sessions with the same
 * rows and changes one booking, so only bookings tells the row anything. On a
 * full load, on a routed visit and on a second routed visit, the row follows.
 */
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, sleep } from './spa-harness'

afterEach(() => closeBrowser())

const GYM = `export function classAction(session, booking) {
  if (session.status === 'cancelled') return 'cancelled'
  if (booking?.status === 'booked') return 'cancel'
  if (booking?.status === 'waitlisted') return 'leave'
  return session.spots_left === 0 ? 'waitlist' : 'book'
}
export function classActionLabel(action) {
  return ({ book: 'Book', waitlist: 'Join waitlist', cancel: 'Cancel', leave: 'Leave waitlist' })[action] || ''
}
export function classPlaceLine(action) {
  if (action === 'cancel') return 'Booked'
  if (action === 'leave') return 'On the waitlist'
  return ''
}
export function memberBookingFor(bookings, sessionId) {
  return bookings.find(row => Number(row.class_session_id) === Number(sessionId) && row.status !== 'cancelled') ?? null
}
export function classDays(sessions, today) {
  const days = new Map()
  for (const session of [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date))) {
    const list = days.get(session.session_date) ?? []
    list.push(session)
    days.set(session.session_date, list)
  }
  return [...days.entries()].map(([date, list]) => ({ date, label: date, sessions: list }))
}
`

const CLASSES = `<script client>
  import { classAction, classActionLabel, classDays, classPlaceLine, memberBookingFor } from '../functions/gym'
  const t = (key, params) => key + (params && params.name ? ' ' + params.name : '')
  const today = '2026-10-22'
  const sessions = state([])
  const bookings = state([])
  const membership = state(null)
  const gymSlug = state('')
  const loading = state(true)
  const loaded = state(false)
  const failed = state('')
  const notice = state('')
  const problem = state('')
  const busyId = state(0)
  const timetable = derived(() => classDays(sessions(), today))
  const credits = derived(() => membership() ? 'Classes: 4' : '')
  const needsJoin = derived(() => loaded() && !membership())
  const joinPath = derived(() => gymSlug() ? '/join/' + gymSlug() : '')
  function action(item) {
    return classAction(item, memberBookingFor(bookings(), item.id))
  }
  function canAct(item) {
    const next = action(item)
    if ((next === 'book' || next === 'waitlist') && loaded() && !membership()) return false
    return ['book', 'waitlist', 'cancel', 'leave'].includes(next)
  }
  function buttonClass(item) {
    const next = action(item)
    if (next === 'book') return 'btn-primary'
    if (next === 'waitlist') return 'btn-secondary text-[#c93400]'
    return 'btn-danger-ghost'
  }
  function placeClass(item) {
    return action(item) === 'leave' ? 'text-[#c93400]' : 'text-[#248a3d]'
  }
  function classDetail(item) { return item.name + ' detail ' + item.spots_left }
  async function load() {
    failed.set('')
    try {
      const api = globalThis.__gymApi
      const [rows, mine, home] = await Promise.all([api('sessions'), api('bookings'), api('home')])
      sessions.set(Array.isArray(rows) ? rows : [])
      bookings.set(Array.isArray(mine) ? mine : [])
      membership.set(home?.membership ?? null)
      gymSlug.set(home?.gym?.slug ?? '')
      loaded.set(true)
    }
    catch (cause) {
      failed.set(String(cause))
    }
    finally {
      loading.set(false)
    }
  }
  async function act(item) {
    if (busyId()) return
    const next = action(item)
    if (!['book', 'waitlist', 'cancel', 'leave'].includes(next)) return
    notice.set('')
    problem.set('')
    busyId.set(item.id)
    try {
      const answer = await globalThis.__gymApi('book', item.id)
      notice.set(answer?.booking?.status === 'waitlisted' ? t('waitlisted', { name: item.name }) : t('booked', { name: item.name }))
      await load()
    }
    catch (cause) {
      problem.set(String(cause))
    }
    finally {
      busyId.set(0)
    }
  }
  onMount(() => { void load() })
</script>
<div class="flex flex-col gap-4" data-gym-classes>
  <div class="flex flex-wrap gap-3">
    <div class="min-w-0">
      <h1 class="page-title">Classes</h1>
      <p :if="credits" class="mt-1 text-sm" :text="credits" data-gym-classes-credits></p>
    </div>
  </div>
  <div :if="loading" class="mt-10 animate-spin" role="status"></div>
  <p :if="needsJoin && !joinPath" class="text-sm" data-gym-classes-needs-membership>Needs membership</p>
  <div :if="notice" class="flex gap-2" role="status" data-gym-classes-notice>
    <span class="shrink-0 h-4 w-4"></span>
    <p class="flex-1 text-sm" :text="notice"></p>
  </div>
  <p :if="problem" class="text-sm" role="alert" :text="problem" data-gym-classes-problem></p>
  <section :for="day in timetable" :key="day.date" class="flex flex-col gap-2" :data-gym-classes-day="day.date">
    <h2 class="px-1" :text="day.label"></h2>
    <div class="flex flex-col p-0 card">
      <div :for="item in day.sessions" :key="item.id" class="flex gap-3 items-center px-4 py-3" :data-gym-class="item.id">
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate" :class="item.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900'" :text="item.name"></p>
          <p class="mt-0.5 text-sm" :text="classDetail(item)"></p>
          <p :if="classPlaceLine(action(item))" class="mt-0.5 font-medium text-[13px]" :class="placeClass(item)" :text="classPlaceLine(action(item))" :data-gym-class-place="item.id"></p>
        </div>
        <button :if="canAct(item)" type="button" @click="act(item)" :disabled="busyId !== 0" class="shrink-0 btn-sm" :class="buttonClass(item)" :data-gym-class-action="item.id" :text="classActionLabel(action(item))"></button>
      </div>
    </div>
  </section>
  <p :if="loaded && !sessions.length" class="mt-6 text-center" data-gym-classes-none>None</p>
  <div :if="failed" class="flex flex-col gap-3" role="alert" data-gym-classes-failed>
    <p class="text-sm" :text="failed"></p>
    <button type="button" @click="load()" class="btn-secondary">Retry</button>
  </div>
  <p :if="loaded" class="mb-6 mt-2 text-xs">Rules</p>
</div>`

it('a :for row redraws when only a signal a helper reads changes', async () => {
  let waitlisted = false
  ;(globalThis as any).__gymApi = async (what: string) => {
    await sleep(1)
    if (what === 'sessions') return [{ id: 7, name: 'Strength', session_date: '2026-10-22', spots_left: 0 }, { id: 8, name: 'Yoga', session_date: '2026-10-22', spots_left: 2 }]
    if (what === 'bookings') return [{ id: 1, class_session_id: 7, status: waitlisted ? 'waitlisted' : 'cancelled' }]
    if (what === 'home') return { membership: { id: 3 } }
    if (what === 'book') { waitlisted = true; return { ok: true, booking: { status: 'waitlisted' } } }
  }
  const app = await renderApp({
    'layouts/app.stx': layout('<nav><a data-stx-link href="/gym/classes">Classes</a></nav>'),
    'functions/gym.ts': GYM,
    'pages/home.stx': page('app', '<script client>const greeting = state("Home")</script><p id="home" :text="greeting"></p>'),
    'pages/classes.stx': page('app', CLASSES),
  }, { '/': 'pages/home.stx', '/gym/classes': 'pages/classes.stx' })
  try {
    for (const route of ['direct', 'routed', 'revisit']) {
      waitlisted = false
      const browser = route === 'direct' ? await boot(app, '/gym/classes') : await boot(app, '/')
      if (route !== 'direct') await browser.navigate('/gym/classes')
      if (route === 'revisit') { await browser.navigate('/'); await browser.navigate('/gym/classes') }
      await sleep(50)
      expect(browser.errors).toEqual([])
      expect(find(browser, '[data-gym-class-action="7"]')?.textContent).toBe('Join waitlist')
      find(browser, '[data-gym-class-action="7"]').click()
      await sleep(80)
      expect(find(browser, '[data-gym-class-place="7"]')?.textContent).toBe('On the waitlist')
      expect(find(browser, '[data-gym-class-action="7"]')?.textContent).toBe('Leave waitlist')
    }
  }
  finally {
    delete (globalThis as any).__gymApi
    await app.dispose()
  }
}, 30_000)
