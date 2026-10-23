import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it.each(['ios', 'android'] as const)('preserves helper-keyed profile nodes on %s after insertion and reorder', async (platform) => {
  const { code } = await compileNativeScreen(`<script client>
const people = state([{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }])
function profileKey(person) { return 'person:' + person.id }
globalThis.keyProbe = { people }
</script><section data-native="FlatList"><button :for="person in people" :key="profileKey(person)" :testID="person.id" :text="person.name"></button></section>`, { name: 'KeyProfiles', minify: true })
  const phone = mountNativeScreen(code, 'KeyProfiles', { platform })
  try {
    await phone.settle()
    const before = ['a', 'b'].map(id => phone.byTestID(id)!.id)
    phone.context.keyProbe.people.set([{ id: 'c', name: 'New' }, { id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }])
    await phone.settle()
    expect(['a', 'b'].map(id => phone.byTestID(id)!.id)).toEqual(before)
    phone.context.keyProbe.people.set([{ id: 'b', name: 'Updated' }, { id: 'c', name: 'New' }, { id: 'a', name: 'Last' }])
    await phone.settle()
    expect(['a', 'b'].map(id => phone.byTestID(id)!.id)).toEqual(before)
    expect(phone.texts()).toEqual(expect.arrayContaining(['Updated', 'New', 'Last']))
    expect(phone.mutationErrors).toEqual([])
  }
  finally {
    phone.unmount()
  }
}, 30_000)
