import { expect, it } from 'bun:test'
import { createNativeHost } from '../../src/native/runtime/native-host'

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
