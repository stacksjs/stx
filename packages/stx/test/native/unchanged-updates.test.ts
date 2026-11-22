import { expect, it } from 'bun:test'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { createNativeHost } from '../../src/native/runtime/native-host'

// A screen that asks its server again on every return publishes the same data
// as new objects, so every binding runs again and says what it said before.
// Sent on, each of those is a label measured and a view laid out for nothing,
// on the thread that is scrolling. HQ's Today sent 146 of them per return.
async function adopted(html: string) {
  const { root } = await translateHtmlToIR(html)
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch), schedule: () => {} })
  const node = host.adopt({ __stxId: 'node' }, root.type, null, root)
  host.snapshot(node)
  const sent = () => { host.flush(); return operations.splice(0) }
  sent()
  return { host, node, sent }
}

it('does not send a label the words it already shows', async () => {
  const { host, node, sent } = await adopted('<span>Easy ride</span>')
  host.setText(node, 'Easy ride')
  expect(sent()).toEqual([])
  host.setText(node, 'Tempo ride')
  expect(sent()).toEqual([{ op: 'updateNode', id: 'node', patch: { children: ['Tempo ride'] } }])
  host.setText(node, 'Tempo ride')
  expect(sent()).toEqual([])
})

it('does not send the classes a view already has, and sends new ones', async () => {
  const { host, node, sent } = await adopted('<div class="p-4 bg-white"></div>')
  host.setAttribute(node, 'class', 'p-4 bg-white')
  expect(sent()).toEqual([])
  host.setAttribute(node, 'class', 'p-2 bg-white')
  const updates = sent()
  expect(updates).toHaveLength(1)
  expect((updates[0] as any).patch.style).toMatchObject({ padding: 8 })
})

it('does not send a view a prop it already holds, by value', async () => {
  const { host, node, sent } = await adopted('<div></div>')
  host.setAttribute(node, 'testID', 'row-1')
  host.setAttribute(node, 'card', { id: 1, title: 'Easy ride' })
  expect(sent()).toHaveLength(2)
  host.setAttribute(node, 'testID', 'row-1')
  host.setAttribute(node, 'card', { id: 1, title: 'Easy ride' })
  expect(sent()).toEqual([])
  host.setAttribute(node, 'card', { id: 1, title: 'Tempo ride' })
  expect(sent()).toHaveLength(1)
  // The same object again may have been changed in place: it cannot be told apart, so it is sent.
  const held = { id: 2 }
  host.setAttribute(node, 'card', held)
  held.id = 3
  host.setAttribute(node, 'card', held)
  expect(sent()).toHaveLength(2)
})

it('still sends a control the value it was last sent, since a control changes on the host', async () => {
  const { host, node, sent } = await adopted('<div data-native="ScrollView"></div>')
  host.setAttribute(node, 'refreshing', false)
  host.setAttribute(node, 'refreshing', false)
  expect(sent().filter(operation => operation.op === 'updateNode')).toHaveLength(2)
})
