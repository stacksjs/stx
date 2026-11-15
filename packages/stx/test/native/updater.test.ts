/**
 * `craft.updater`: in-app updates of a directly distributed Mac app.
 *
 * The host's `Updater` module answers `status`, `check`, `install` and
 * `relaunch`, and reports every change of state or progress as the
 * CRAFT_EVENT `craftUpdaterChange`. A screen draws from the status, so a
 * host that cannot update says so in a status rather than by throwing.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

const source = `<script client>
const seen = state([])
window.probe = { seen, updater: () => craft.updater, flags: () => craft.capabilities }
onMount(() => {
  if (craft.updater) onDestroy(craft.updater.onChange(status => seen.set([...seen(), status])))
})
</script>
<View><Text>Updates</Text></View>`

afterEach(unmountAllNativeScreens)

async function mount(options: Parameters<typeof mountNativeScreen>[2]) {
  const { code } = await compileNativeScreen(source)
  const screen = mountNativeScreen(code, 'Screen', options)
  await screen.settle()
  return screen
}

describe('craft.updater', () => {
  it('forwards each call to the Updater module and hears its changes', async () => {
    const calls: string[] = []
    const mac = await mount({
      platform: 'macos',
      capabilities: ['desktop', 'updater'],
      appVersion: '2.4',
      native: (module, method, args) => {
        if (module !== 'Updater') return null
        calls.push(`${method}(${args.length})`)
        if (method === 'status') return { currentVersion: '2.4', state: 'idle', selfUpdating: true }
        if (method === 'check') return { currentVersion: '2.4', state: 'available', selfUpdating: true, version: '2.5', notes: 'Faster.' }
        if (method === 'install') return { currentVersion: '2.4', state: 'installed', selfUpdating: true, version: '2.5' }
        return null
      },
    })
    const updater = mac.context.probe.updater()
    expect(mac.context.probe.flags().updater).toBe(true)
    expect(await updater.status()).toEqual({ currentVersion: '2.4', state: 'idle', selfUpdating: true })
    expect(await updater.check()).toMatchObject({ state: 'available', version: '2.5', notes: 'Faster.' })
    expect(await updater.install()).toMatchObject({ state: 'installed', version: '2.5' })
    expect(await updater.relaunch()).toBeUndefined()
    expect(calls).toEqual(['status(0)', 'check(0)', 'install(0)', 'relaunch(0)'])
    expect(mac.natives.filter(name => name.startsWith('Updater.'))).toEqual(['Updater.status', 'Updater.check', 'Updater.install', 'Updater.relaunch'])

    mac.craftEvent('craftUpdaterChange', { currentVersion: '2.4', state: 'downloading', selfUpdating: true, version: '2.5', progress: 0.5 })
    // Another event, and one with no status in it, are not changes.
    mac.craftEvent('craftDesktopCommand', { id: 'escape' })
    mac.craftEvent('craftUpdaterChange', null)
    await mac.settle()
    expect(mac.context.probe.seen()).toEqual([{ currentVersion: '2.4', state: 'downloading', selfUpdating: true, version: '2.5', progress: 0.5 }])
  })

  it('answers unavailable on a desktop host with no Updater module, and never rejects a check', async () => {
    const mac = await mount({
      platform: 'macos',
      capabilities: ['desktop'],
      appVersion: '2.4',
      native: (module) => {
        if (module === 'Updater') throw Object.assign(new Error('Unsupported native capability Updater.status'), { code: 'CAPABILITY_DISABLED' })
        return null
      },
    })
    const updater = mac.context.probe.updater()
    const unavailable = { currentVersion: '2.4', state: 'unavailable', selfUpdating: false, reason: 'This version of the app cannot update itself.' }
    expect(await updater.status()).toEqual(unavailable)
    expect(await updater.check()).toEqual(unavailable)
    expect(await updater.install()).toEqual(unavailable)
  })

  it('reports a failed call as an error status', async () => {
    const mac = await mount({
      platform: 'macos',
      capabilities: ['desktop', 'updater'],
      appVersion: '2.4',
      native: (module) => {
        if (module === 'Updater') throw Object.assign(new Error('The feed did not answer.'), { code: 'NETWORK_ERROR' })
        return null
      },
    })
    expect(await mac.context.probe.updater().check()).toEqual({ currentVersion: '2.4', state: 'error', selfUpdating: false, error: 'The feed did not answer.' })
  })

  it('is absent on a phone', async () => {
    const phone = await mount({ platform: 'ios', capabilities: ['storage'] })
    expect(phone.context.probe.updater()).toBeUndefined()
    expect(phone.context.probe.flags().updater).toBe(false)
  })
})
