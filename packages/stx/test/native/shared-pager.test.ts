import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

const pager = join(import.meta.dir, '../../../components/src/ui/pager/Pager.stx')
afterEach(unmountAllNativeScreens)

describe.each(['ios', 'android'] as const)('shared Pager on %s', (platform) => {
  it('uses platform paging, follows the model and reports settled swipes once', async () => {
    const { code } = await compileNativeScreen(`@import('Pager', '${pager}')
<script client>
const index = state(1)
const changes = []
globalThis.probe = { index, changes }
</script>
<Pager testID="tour" v-model:index="index" @change="changes.push($event)" label="Tour">
  <section>One</section><section>Two</section><section>Three</section>
</Pager>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const track = phone.ofType('ScrollView')[0]!
    expect(track.props.pagingEnabled).toBe(true)
    expect(track.props.pageIndex).toBe(1)
    phone.press(track, 'onPageSelected', { index: 1, count: 3 })
    await phone.settle()
    expect(phone.context.probe.changes).toEqual([])
    phone.press(track, 'onPageSelected', { index: 2, count: 3 })
    phone.press(track, 'onPageSelected', { index: 2, count: 3 })
    await phone.settle()
    expect(phone.context.probe.index()).toBe(2)
    expect(phone.context.probe.changes).toEqual([2])
    phone.context.probe.index.set(0)
    await phone.settle()
    expect(track.props.pageIndex).toBe(0)
    expect(phone.texts()).not.toContain('{{')
    expect(phone.mutationErrors).toEqual([])
  })
})
