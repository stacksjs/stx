/**
 * Moving on from a web view on a native screen: `<a href>`, `<StxLink>`,
 * `navigate()`, `location` and `history` all go through Craft navigation, by
 * the web path the link names. The app's native routes are its web paths, so
 * nothing is rewritten on the way (no `/m` prefix).
 */
import { expect, test } from 'bun:test'
import { mountWebView, webApp } from './web-view-app'

const linkTo = (phone: Awaited<ReturnType<typeof mountWebView>>, href: string) => {
  const link = phone.find(node => node.props.href === href)
  if (!link) throw new Error(`no link to ${href}`)
  return link
}

test('pressing a link or a StxLink opens its web path', async () => {
  const root = webApp({
    'views/home.stx': `<div>
  <a href="/plans/12">Plan</a>
  <StxLink to="/settings/profile">Profile</StxLink>
  <a href="settings">Relative</a>
  <a href="https://fixture.invalid/workouts?week=2">Own site</a>
</div>
`,
  })
  const phone = await mountWebView(root, { Home: 'views/home.stx' }, 'Home')
  phone.press(linkTo(phone, '/plans/12'))
  phone.press(linkTo(phone, '/settings/profile'))
  phone.press(linkTo(phone, 'settings'))
  phone.press(linkTo(phone, 'https://fixture.invalid/workouts?week=2'))
  await phone.settle()
  expect(phone.opened).toEqual(['/plans/12', '/settings/profile', '/settings', '/workouts?week=2'])
})

test('a link a binding points elsewhere opens where it points now', async () => {
  const root = webApp({
    'views/plans.stx': `<script client>
  const id = state(1)
  function next() { id.set(id() + 1) }
</script>
<div>
  <StxLink :to="'/plans/' + id">This plan</StxLink>
  <button testid="next" @click="next()">Next</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Plans: 'views/plans.stx' }, 'Plans')
  phone.press(phone.byTestID('next')!)
  await phone.settle()
  phone.press(linkTo(phone, '/plans/2'))
  await phone.settle()
  expect(phone.opened).toEqual(['/plans/2'])
})

test('a link in a list row opens its own path, for rows added later too', async () => {
  const root = webApp({
    'views/plans.stx': `<script client>
  const plans = state([{ id: 1, name: 'Base' }, { id: 2, name: 'Build' }])
  function more() { plans.set([...plans(), { id: 3, name: 'Peak' }]) }
</script>
<div>
  <a :for="plan in plans" :key="plan.id" :href="'/plans/' + plan.id" :text="plan.name">Plan</a>
  <button testid="more" @click="more()">More</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Plans: 'views/plans.stx' }, 'Plans')
  phone.press(linkTo(phone, '/plans/2'))
  phone.press(phone.byTestID('more')!)
  await phone.settle()
  phone.press(linkTo(phone, '/plans/3'))
  await phone.settle()
  expect(phone.opened).toEqual(['/plans/2', '/plans/3'])
})

test('a link\'s own click runs first, and one that prevents it stays', async () => {
  const root = webApp({
    'views/home.stx': `<script client>
  const seen = state('none')
  function track() { seen.set('tracked') }
  function stay() { seen.set('stayed') }
</script>
<div>
  <p :text="seen">none</p>
  <a href="/stats" @click="track()">Stats</a>
  <a href="/elsewhere" @click.prevent="stay()">Stay</a>
  <a href="#top">Top</a>
  <a href="javascript:void(0)">Nothing</a>
</div>
`,
  })
  const phone = await mountWebView(root, { Home: 'views/home.stx' }, 'Home')
  phone.press(linkTo(phone, '/stats'))
  await phone.settle()
  expect(phone.texts()).toContain('tracked')
  phone.press(linkTo(phone, '/elsewhere'))
  phone.press(linkTo(phone, '#top'))
  phone.press(linkTo(phone, 'javascript:void(0)'))
  await phone.settle()
  expect(phone.texts()).toContain('stayed')
  expect(phone.opened).toEqual(['/stats'])
})

test('another site, mail and phone links go to the system', async () => {
  const root = webApp({
    'views/contact.stx': `<div>
  <a href="https://maps.example.com/gym">Map</a>
  <a href="mailto:coach@example.com">Mail</a>
</div>
`,
  })
  const urls: unknown[] = []
  const phone = await mountWebView(root, { Contact: 'views/contact.stx' }, 'Contact', {
    capabilities: ['linking'],
    native: (module, method, args) => { if (module === 'Linking') urls.push(args[0]); return true },
  })
  phone.press(linkTo(phone, 'https://maps.example.com/gym'))
  phone.press(linkTo(phone, 'mailto:coach@example.com'))
  await phone.settle()
  expect(urls).toEqual(['https://maps.example.com/gym', 'mailto:coach@example.com'])
  expect(phone.opened).toEqual([])
})

test('navigate(), location and history move the screen', async () => {
  const root = webApp({
    'views/account.stx': `<script client>
  function settings() { navigate('/settings') }
  function login() { navigate('/login?next=' + encodeURIComponent(location.pathname), { replace: true }) }
  function away() { location.href = '/goodbye' }
  function back() { history.back() }
</script>
<div>
  <button testid="settings" @click="settings()">Settings</button>
  <button testid="login" @click="login()">Log in</button>
  <button testid="away" @click="away()">Away</button>
  <button testid="back" @click="back()">Back</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Account: 'views/account.stx' }, 'Account')
  for (const id of ['settings', 'login', 'away', 'back']) phone.press(phone.byTestID(id)!)
  await phone.settle()
  expect(phone.opened).toEqual(['/settings', '/login?next=%2F', '/goodbye'])
  expect(phone.replaced).toEqual(['/login?next=%2F'])
  expect(phone.moves).toEqual(['back'])
})

test('location reads the address the host opened the screen at', async () => {
  const root = webApp({
    'views/plan.stx': `<script client>
  const where = state(location.pathname + location.search)
</script>
<div><p :text="where">?</p></div>
`,
  })
  const phone = await mountWebView(root, { Plan: 'views/plan.stx' }, 'Plan')
  expect(phone.texts()).toContain('/')
  const opened = await mountWebView(root, { Plan: 'views/plan.stx' }, 'Plan', { routeURL: '/plans/12?week=2' })
  expect(opened.texts()).toContain('/plans/12?week=2')
})
