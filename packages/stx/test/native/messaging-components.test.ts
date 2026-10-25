import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

it('keeps shared conversation rows and bubbles reactive on a native host', async () => {
  const root = createTempDir('stx-messaging-')
  const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(plugin)}] }`)
  const file = join(root, 'Screen.stx')
  await Bun.write(file, `<script client>
const item = state({title:'Maya Chen',preview:'Bring the climbing gear',initials:'MC',unread:2})
const selected = state(false)
const body = state('See you at the trailhead')
const choices = []
const unsent = state(false)
globalThis.probe = {item,selected,body,choices,unsent}
</script><View><ConversationListItem testID="row" :item="item()" :selected="selected()" @choose="choices.push($event.title)" /><MessageBubble testID="bubble" :body="body()" :outgoing="selected()" :color="selected() ? '#ffffff' : '#1d1d1f'" :unsent="unsent()" quote="An earlier message" :edited="true" metadataColor="#737377" :background="selected() ? '#007aff' : '#e9e9eb'" /></View>`)
  const { code, diagnostics } = await compileSharedScreenBundle(file, { root })
  expect(diagnostics.filter(item => item.message !== 'dropped-subtree: script')).toEqual([])
  const screen = mountNativeScreen(code, 'Screen')
  try {
    await screen.settle()
    expect(screen.texts()).toContain('Maya Chen')
    expect(screen.texts()).toContain('Bring the climbing gear')
    expect(screen.texts()).toContain('See you at the trailhead')
    screen.press(screen.byTestID('row')!)
    await screen.settle()
    expect(Array.from(screen.context.probe.choices)).toEqual(['Maya Chen'])
    screen.context.probe.item.set({ title: 'Sam Rivera', preview: 'The van is ready', initials: 'SR' })
    screen.context.probe.body.set('Thank you for finding a van')
    screen.context.probe.selected.set(true)
    await screen.settle()
    expect(screen.texts()).toContain('Sam Rivera')
    expect(screen.texts()).not.toContain('Maya Chen')
    expect(screen.texts()).toContain('Thank you for finding a van')
    expect(screen.find(node => node.style.backgroundColor === '#007aff')).toBeDefined()
    const metadata = (text: string) => screen.find(node => node.props.text === text || node.children.includes(text))
    expect(metadata('An earlier message')?.style.color).toBe('#737377')
    expect(metadata('Edited')?.style.color).toBe('#737377')
    screen.context.probe.unsent.set(true)
    await screen.settle()
    expect(metadata('Message unsent')?.style.color).toBe('#737377')
  }
  finally { screen.unmount() }
})
