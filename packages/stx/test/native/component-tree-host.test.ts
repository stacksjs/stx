import { expect, it } from 'bun:test'
import { createNativeHost } from '../../src/native/runtime/native-host'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'

it('routes presses from existing and inserted buttons to the nearest listening ancestors', () => {
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch) })
  const root = host.adopt({ __stxId: 'root' }, 'View')
  const button = host.adopt({ __stxId: 'button' }, 'Button')
  host.insert(root, button)
  const targets: unknown[] = []
  host.listen(root, 'click', (event: any) => targets.push(event.target))
  host.flush()
  const press = (id: string) => {
    const handlers = operations.flatMap(op => op.op === 'updateNode' && op.id === id
      ? [op.patch.events?.onPress]
      : op.op === 'createNode' && op.id === id ? [op.node.events?.onPress] : []).filter(Boolean)
    expect(handlers.length).toBeGreaterThan(0)
    host.dispatch(handlers.at(-1)!, {})
  }
  press('button')
  const next = host.clone(button)
  host.insert(root, next)
  host.flush()
  press(next.__stxId)
  expect(targets).toEqual([button, next])
  host.remove(next)
  press(next.__stxId)
  expect(targets).toHaveLength(2)
  host.dispose()
})

it('reports owned child changes without a DOM, batching and canceling callbacks (#2089)', async () => {
  const host = createNativeHost({ send() {} })
  const root = host.adopt({ __stxId: 'root' }, 'View')
  const left = host.adopt({ __stxId: 'left' }, 'View')
  const right = host.adopt({ __stxId: 'right' }, 'View')
  const tab = host.adopt({ __stxId: 'tab' }, 'Button')
  host.insert(root, left)
  host.insert(root, right)
  host.setAttribute(tab, 'role', 'tab')
  expect(host.getAttribute(tab, 'role')).toBe('tab')
  expect(host.getAttribute(tab, 'missing')).toBeNull()
  let roots = 0
  let lefts = 0
  let rights = 0
  const stop = host.observeChildren(root, () => roots++)
  host.observeChildren(left, () => lefts++)
  host.observeChildren(right, () => rights++)
  host.insert(left, tab)
  host.setAttribute(tab, 'aria-selected', 'true')
  expect(host.parent(tab)).toBe(left)
  await Promise.resolve()
  expect([roots, lefts, rights]).toEqual([1, 1, 0])

  host.insert(right, tab)
  expect(host.parent(tab)).toBe(right)
  await Promise.resolve()
  expect([roots, lefts, rights]).toEqual([2, 2, 1])
  host.remove(tab)
  expect(host.parent(tab)).toBeNull()
  stop()
  await Promise.resolve()
  expect([roots, lefts, rights]).toEqual([2, 2, 2])

  host.insert(right, tab)
  host.dispose()
  await Promise.resolve()
  expect([roots, lefts, rights]).toEqual([2, 2, 2])
})
