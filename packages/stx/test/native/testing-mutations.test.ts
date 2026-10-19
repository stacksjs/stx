import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, type NativeNode, type NativeOperation } from '../../src/native/testing'
import { validateTestMutations } from '../../src/native/testing-mutations'

it('rejects cross-parent placement atomically instead of simulating unsupported portals', async () => {
  const { code } = await compileNativeScreen('<div testID="root"><div testID="owner"><button testID="child">Keep</button></div></div>')
  for (const op of ['insertChild', 'moveChild']) {
    const phone = mountNativeScreen(code, 'Screen')
    try {
      await phone.settle()
      const root = phone.byTestID('root')!
      const owner = phone.byTestID('owner')!
      const child = phone.byTestID('child')!
      const before = JSON.stringify([...phone.nodes])
      phone.context.__stxNativeBridge.postMessage(JSON.stringify({ type: 'MUTATE', payload: { batchId: 'invalid-probe', operations: [
        { op: 'updateNode', id: child.id, patch: { props: { testID: 'should-not-apply' } } },
        { op, parentId: root.id, childId: child.id, index: 1 },
      ] } }))
      const error = op === 'insertChild' ? 'NODE_ATTACHED' : 'NOT_A_CHILD'
      await expect(phone.settle()).rejects.toThrow(error)
      expect(phone.mutationErrors).toMatchObject([{ code: error, operationIndex: 1 }])
      expect(JSON.stringify([...phone.nodes])).toBe(before)
      expect(owner.children).toContain(child)
    }
    finally { phone.unmount() }
  }
}, 30_000)

it('validates the entire evolving topology without mutating the input tree', () => {
  const node = (id: string, type = 'View'): NativeNode => ({ id, type, props: {}, style: {}, events: {}, children: [] })
  const root = node('root')
  const a = node('a')
  const b = node('b')
  root.children = [a, b]
  const nodes = new Map([root, a, b].map(value => [value.id, value]))
  const check = (...ops: unknown[]) => validateTestMutations(nodes, ops as NativeOperation[])
  expect(check({ op: 'moveChild', parentId: 'root', childId: 'a', index: 1 })).toBeNull()
  expect(check({ op: 'moveChild', parentId: 'root', childId: 'a', index: 2 })?.code).toBe('INVALID_INDEX')
  expect(check({ op: 'insertChild', parentId: 'a', childId: 'root', index: 0 })?.code).toBe('CYCLE')
  expect(check({ op: 'removeNode', id: 'root' }, { op: 'updateNode', id: 'a', patch: {} })?.code).toBe('UNKNOWN_NODE')
  expect(check(
    { op: 'createNode', id: 'text', node: node('text', 'Text') },
    { op: 'createNode', id: 'new', node: node('new') },
    { op: 'insertChild', parentId: 'text', childId: 'new', index: 0 },
  )?.code).toBe('INVALID_PARENT')
  expect(check(
    { op: 'createNode', id: 'new', node: node('new') },
    { op: 'insertChild', parentId: 'root', childId: 'new', index: 2 },
    { op: 'moveChild', parentId: 'root', childId: 'new', index: 0 },
  )).toBeNull()
  expect(root.children).toEqual([a, b])
  expect(nodes.has('new')).toBe(false)
})
