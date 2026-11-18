/**
 * <BiometricSignIn> in a real browser: offered only where a kept credential
 * can come back, and each way a sign-in ends reaches the page as its event.
 * craft.biometrics is a stand-in here; the Keychain behind it is Craft's.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

// A Craft with Face ID enrolled and a token kept under "hq". `fake.mode`
// decides how the next read ends.
const FAKE_CRAFT = `<script>
window.fake = { mode: 'match', asked: [], kept: { hq: 'device-token-1' } }
const fail = code => Promise.reject(Object.assign(new Error(code), { code }))
window.craft = { platform: 'ios', capabilities: {}, biometrics: {
  isAvailable: () => Promise.resolve(true),
  getBiometricType: () => Promise.resolve('faceId'),
  storeCredential: (key, value) => { fake.kept[key] = value; return Promise.resolve() },
  getCredential: (key, reason) => {
    fake.asked.push([key, reason])
    if (fake.mode === 'cancel') return fail('AUTHENTICATION_CANCELLED')
    if (fake.mode === 'nomatch') return fail('AUTHENTICATION_FAILED')
    if (fake.mode === 'gone') return Promise.resolve(null)
    return Promise.resolve(fake.kept[key] || null)
  },
  hasCredential: key => Promise.resolve(key in fake.kept),
  deleteCredential: key => { delete fake.kept[key]; return Promise.resolve() },
} }
</script>`

const SCREEN = `
<script client>
const heard = []
window.heard = heard
</script>
<BiometricSignIn credentialKey="hq" reason="Sign in to HQ"
  @signin="heard.push(['signin', $event])"
  @fallback="heard.push(['fallback', $event])"
  @failed="heard.push(['failed', $event])" />`

const HELPERS = `
  const root = () => document.querySelector('[data-biometric-sign-in]')
  const button = () => root().querySelector('button')
  const shown = () => !!root() && getComputedStyle(root()).display !== 'none' && root().getBoundingClientRect().height > 0
  const later = (fn, ms) => new Promise(done => setTimeout(() => done(fn()), ms || 150))
  const press = mode => { fake.mode = mode; button().click(); return later(() => ({ shown: shown(), heard: heard.splice(0) })) }
`

let craft: BrowserPage
let web: BrowserPage

beforeAll(async () => {
  craft = await openBrowserPage({ name: 'biometric-sign-in-craft', width: 420, height: 240, body: FAKE_CRAFT + SCREEN, ready: `!!document.querySelector('[data-biometric-sign-in] button') && document.querySelector('[data-biometric-sign-in] button').textContent.trim().length > 0` })
  web = await openBrowserPage({ name: 'biometric-sign-in-web', width: 420, height: 240, body: SCREEN, ready: `!!document.querySelector('[data-biometric-sign-in]')` })
}, 90_000)

afterAll(() => {
  craft?.close()
  web?.close()
})

describe('in Craft with Face ID and a kept token', () => {
  it('offers the button by its name, with no script errors', async () => {
    expect(await craft.errors()).toEqual([])
    expect(await craft.json(`${HELPERS} return later(() => ({ shown: shown(), text: button().textContent.trim() }))`)).toEqual({ shown: true, text: 'Sign in with Face ID' })
  })

  it('signs in with the token, asking with the reason given', async () => {
    expect(await craft.json(`${HELPERS} return press('match')`)).toEqual({ shown: true, heard: [['signin', { token: 'device-token-1' }]] })
    expect(await craft.json(`return fake.asked.pop()`)).toEqual(['hq', 'Sign in to HQ'])
  })

  it('falls back on a cancel and reports a failed match, keeping the button', async () => {
    expect(await craft.json(`${HELPERS} return press('cancel')`)).toEqual({ shown: true, heard: [['fallback', { reason: 'cancelled' }]] })
    expect(await craft.json(`${HELPERS} return press('nomatch')`)).toEqual({ shown: true, heard: [['failed', { code: 'AUTHENTICATION_FAILED', message: 'AUTHENTICATION_FAILED' }]] })
  })

  it('forgets a token that cannot come back, and stops offering it', async () => {
    expect(await craft.json(`${HELPERS} return press('gone')`)).toEqual({ shown: false, heard: [['fallback', { reason: 'invalidated' }]] })
    expect(await craft.json(`return Object.keys(fake.kept)`)).toEqual([])
    expect(await craft.errors()).toEqual([])
  })
})

describe('in a browser', () => {
  it('offers nothing and raises nothing', async () => {
    expect(await web.json(`${HELPERS} return later(() => ({ shown: shown(), craft: typeof window.craft }))`)).toEqual({ shown: false, craft: 'undefined' })
    expect(await web.errors()).toEqual([])
  })
})
