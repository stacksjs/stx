import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

/*
 * `basemap` is drawn by the host (Craft), which knows each platform's best
 * map: the screen only names it. It has to reach the host unchanged, static
 * or bound, and follow the screen when it changes.
 */
describe('Map basemap', () => {
  it('reaches the host as authored, and follows a bound value', async () => {
    const { code } = await compileNativeScreen(`<script client>
const layer = state('outdoors')
window.probe = { layer }
</script><View><Map testID="static" basemap="satellite" /><Map testID="bound" :basemap="layer()" /></View>`)
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      expect(phone.byTestID('static')!.props.basemap).toBe('satellite')
      expect(phone.byTestID('bound')!.props.basemap).toBe('outdoors')
      phone.context.probe.layer.set('hybrid')
      await phone.settle()
      expect(phone.byTestID('bound')!.props.basemap).toBe('hybrid')
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})
