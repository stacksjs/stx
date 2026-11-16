/**
 * A component under an :if that was never true leaves with its page
 * (stacksjs/stx#2189).
 *
 * Its markup is not drawn and its onMount does not run, but its script is set
 * up, as every component's is, once at load (#1737 needs the scope for a later
 * show). So an effect at the top of that script is made and runs. The router
 * releases a page's components by walking the page for their scopes, and a
 * hidden branch is off the page: nothing found them, and their effects kept
 * running after the page had gone. On the Stacks dashboard one store change
 * after Users and then Teams sent five requests, the Teams page's one and four
 * for components on neither page, and every further visit added two.
 *
 * A hidden branch's nodes are kept on the element that holds its placeholder
 * (__stx_detached_if) for the re-show. The teardown that already reached its
 * effects through that list now releases its components' scopes too.
 */
import { afterEach, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, sleep } from './spa-harness'

setDefaultTimeout(60_000)
afterEach(() => closeBrowser())

const STORE = `defineStore('bus', () => {
  const changes = state(0)
  return { changes }
})`

// Each instance names itself, and its effect says so on every store change.
const COUNTER = `<script client>
  ${STORE}
  const bus = useStore('bus')
  const name = window.__fx.next()
  effect(() => {
    bus.changes()
    window.__fx.runs.push(name)
  })
  onMount(() => window.__fx.mounts.push(name))
  onDestroy(() => window.__fx.destroys.push(name))
</script>
<div class="counter" :data-name="name">counter</div>`

const LINKS = `<nav><a href="/users" data-stx-link>Users</a><a href="/teams" data-stx-link>Teams</a></nav>`

/** One gated instance per model, the current one shown: the dashboard's shape. */
function screen(current: string): string {
  return `<script client>
  const current = state('${current}')
  window.__fx.show = value => current.set(value)
</script>
<div :if="current() === 'user'"><Counter /></div>
<div :if="current() === 'team'"><Counter /></div>
<div :if="current() === 'subscriber'"><Counter /></div>`
}

/** The same, through a wrapper drawing a dynamic component, as reported. */
const REGION = `<script client>
  const mounted = state(window.__fx.current === window.__fx.models[window.__fx.region++])
</script>
<div :if="mounted()"><component :is="'Counter'"></component></div>`

function dynamicScreen(current: string): string {
  return `<script client>
  window.__fx.current = '${current}'
  window.__fx.region = 0
</script>
<Region /><Region /><Region />`
}

const QUIET = { navDuration: 0, revalidate: false, prefetchVisible: false }

interface Fx { runs: string[], mounts: string[], destroys: string[], next: () => string, show?: (value: string) => void, models: string[], region: number, current?: string }

async function start(screens: (current: string) => string) {
  const app = await renderApp({
    'components/Counter.stx': COUNTER,
    'components/Region.stx': REGION,
    'layouts/app.stx': layout(LINKS),
    'pages/users.stx': page('app', screens('user')),
    'pages/teams.stx': page('app', screens('team')),
  }, { '/users': 'pages/users.stx', '/teams': 'pages/teams.stx' })
  let n = 0
  const fx: Fx = { runs: [], mounts: [], destroys: [], next: () => `c${++n}`, models: ['user', 'team', 'subscriber'], region: 0 }
  const browser = await boot(app, '/users', { history: true, globals: { __fx: fx, STX_ROUTER_OPTIONS: QUIET } })
  return { app, browser, fx }
}

/** Which instances one store change reaches. */
async function change(browser: any, fx: Fx): Promise<string[]> {
  fx.runs.length = 0
  const bus = browser.window.stx.useStore('bus')
  bus.changes.set(bus.changes() + 1)
  await sleep(40)
  return [...fx.runs].sort()
}

describe('a component under an :if that was never true', () => {
  it('stops running when the router swaps its page out', async () => {
    const { app, browser, fx } = await start(screen)
    expect(browser.errors).toEqual([])
    // c1 is shown; c2 and c3 are set up behind a false :if, and still listen
    // while their page is up: the setup is what keeps them for a later show.
    expect(browser.document.querySelectorAll('.counter').length).toBe(1)
    expect(await change(browser, fx)).toEqual(['c1', 'c2', 'c3'])

    await browser.navigate('/teams')
    expect(await change(browser, fx)).toEqual(['c4', 'c5', 'c6'])
    await browser.navigate('/users')
    expect(await change(browser, fx)).toEqual(['c7', 'c8', 'c9'])
    expect(browser.errors).toEqual([])
    await app.dispose()
  })

  it('leaves no scope of its own in the registry', async () => {
    const { app, browser } = await start(screen)
    const scopes = () => Object.keys(browser.window.stx._scopes).length
    const first = scopes()
    await browser.navigate('/teams')
    await browser.navigate('/users')
    await browser.navigate('/teams')
    expect(scopes()).toBe(first)
    await app.dispose()
  })

  it('is not told it was destroyed, having never mounted', async () => {
    const { app, browser, fx } = await start(screen)
    expect(fx.mounts).toEqual(['c1'])
    await browser.navigate('/teams')
    // The shown one unmounts with its page; the two never shown hear nothing.
    expect(fx.destroys).toEqual(['c1'])
    expect(fx.mounts).toEqual(['c1', 'c5'])
    await app.dispose()
  })

  it('is destroyed once, when it hid, after it was shown and hidden again', async () => {
    const { app, browser, fx } = await start(screen)
    fx.show!('team')
    await sleep(40)
    expect(fx.mounts).toEqual(['c1', 'c2'])
    expect(fx.destroys).toEqual(['c1'])
    await browser.navigate('/teams')
    // c1 released when it hid and c2 with the page: neither twice.
    expect(fx.destroys).toEqual(['c1', 'c2'])
    expect(await change(browser, fx)).toEqual(['c4', 'c5', 'c6'])
    await app.dispose()
  })
})

describe('a dynamic component under a false :if, in a wrapper', () => {
  it('stops running when the router swaps its page out', async () => {
    const { app, browser, fx } = await start(dynamicScreen)
    expect(browser.errors).toEqual([])
    expect(browser.document.querySelectorAll('.counter').length).toBe(1)
    expect((await change(browser, fx)).length).toBe(3)

    await browser.navigate('/teams')
    expect(browser.document.querySelectorAll('.counter').length).toBe(1)
    expect((await change(browser, fx)).length).toBe(3)
    await browser.navigate('/users')
    expect((await change(browser, fx)).length).toBe(3)
    expect(browser.errors).toEqual([])
    await app.dispose()
  })
})
