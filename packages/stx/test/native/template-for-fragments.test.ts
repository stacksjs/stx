import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it.each([false, true])('retains keyed multi-node native template rows and their event handlers (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const rows = state([{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }])
window.fragmentProbe = { rows, taps: [] }
</script><section testID="root" class="flex-row"><template :for="item in rows()" :key="item.id">
<button :testID="item.id" @click="window.fragmentProbe.taps.push(item.id)">{{ item.name }}</button>
<input :testID="item.id + '-input'" :value="item.name" />
</template></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const before = ['a', 'a-input', 'b', 'b-input'].map(id => phone.byTestID(id)!.id)
    expect(phone.byTestID('root')!.children.filter(child => typeof child !== 'string').map(child => child.id)).toEqual(before)
    phone.context.fragmentProbe.rows.set([{ id: 'b', name: 'Updated' }, { id: 'a', name: 'Last' }])
    await phone.settle()
    expect(['a', 'a-input', 'b', 'b-input'].map(id => phone.byTestID(id)!.id)).toEqual(before)
    expect(phone.byTestID('b-input')!.props.value).toBe('Updated')
    phone.press(phone.byTestID('b')!)
    expect(phone.context.fragmentProbe.taps).toEqual(['b'])
    phone.context.fragmentProbe.rows.set([])
    await phone.settle()
    expect(phone.byTestID('a')).toBeUndefined()
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
