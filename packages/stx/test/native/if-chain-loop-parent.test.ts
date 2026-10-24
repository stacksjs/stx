import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('keeps conditional chains attached when a loop is revealed and replaced', async () => {
  const { code } = await compileNativeScreen(`<script client>
const data = state({ people: [] })
window.probe = { data }
</script><div><section :if="data.people.length"><div :for="person in data.people" :key="person.id"><img :if="person.avatar" :src="person.avatar" /><span :else>{{ person.name }}</span></div></section></div>`, { minify: false })
  const phone = mountNativeScreen(code)
  const errors: unknown[] = []
  phone.context.console = { ...console, error: (...args: unknown[]) => errors.push(args) }
  try {
    await phone.settle()
    phone.context.probe.data.set({ people: [{ id: 1, name: 'Ava', avatar: null }] })
    await phone.settle()
    expect(phone.texts()).toContain('Ava')
    phone.context.probe.data.set({ people: [] })
    await phone.settle()
    phone.context.probe.data.set({ people: [{ id: 2, name: 'Ben', avatar: null }] })
    await phone.settle()
    expect(phone.texts()).toContain('Ben')
    expect(errors).toEqual([])
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
