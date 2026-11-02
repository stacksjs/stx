import { expect, it } from 'bun:test'
import { join } from 'node:path'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { prepareInitialMedia } from '../../src/native/runtime/initial-media-mutations'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createNativeHost } from '../../src/native/runtime/native-host'
import { materializeNativeBindingTree } from '../../src/native/runtime/binding-tree'
import { createDocument, createNode } from '../../src/native/compiler/ir'

it.each([false, true])('creates a remounted shared Image with its current source, geometry and handlers (minify=%s)', async (minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-image-device.stx'), { root, minify })
  const phone = mountNativeScreen(result.code)
  try {
    await phone.settle()
    const probe = phone.context.imageProbe
    probe.shown.set(false)
    await phone.settle()
    probe.source.set(probe.tall)
    probe.fit.set('contain')
    probe.position.set('bottom')
    const start = phone.operations().length
    probe.shown.set(true)
    await phone.settle()
    const image = phone.byTestID('shared-photo')!
    const creation = phone.operations().slice(start).find(op => op.op === 'createNode' && op.id === image.id)
    expect(creation?.op).toBe('createNode')
    if (creation?.op !== 'createNode') throw new Error('missing initial image operation')
    expect(creation.node.props?.source).toBe(probe.tall)
    expect(creation.node.style).toMatchObject({ objectFit: 'contain', objectPosition: 'bottom' })
    expect(creation.node.events?.onLoad).toBeTruthy()
    expect(creation.node.events?.onError).toBeTruthy()
    phone.press(image, 'onLoad', { source: { width: 10, height: 20 } })
    expect(probe.loads()).toBe(1)
    const updateStart = phone.operations().length
    probe.source.set(probe.wide)
    await phone.settle()
    expect(phone.byTestID('shared-photo')).toBe(image)
    expect(phone.operations().slice(updateStart)).toContainEqual({ op: 'updateNode', id: image.id, patch: { props: { source: probe.wide } } })
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)

it('preserves native object sources, tombstones, explicit missing sources and existing-image updates', () => {
  const operations: NativeMutationOperation[] = [
    { op: 'createNode', id: 'new', node: { type: 'Image', props: { source: '/old.png' }, style: { objectFit: 'cover' }, events: { onLoad: 'old-handler' } } },
    { op: 'updateNode', id: 'new', patch: { props: { source: { uri: '/final.png', headers: { Authorization: 'fixture' } } }, style: { objectFit: null } as never, events: { onLoad: 'final-handler' } } },
    { op: 'updateNode', id: 'existing', patch: { props: { source: null } } },
    { op: 'createNode', id: 'empty', node: { type: 'Image', props: { source: '/clear.png' } } },
    { op: 'updateNode', id: 'empty', patch: { props: { source: null } } },
  ]
  const prepared = prepareInitialMedia(operations)
  expect(prepared[0]).toMatchObject({ op: 'createNode', node: { props: { source: { uri: '/final.png', headers: { Authorization: 'fixture' } } }, style: {}, events: { onLoad: 'final-handler' } } })
  expect(prepared[1]).toBe(operations[2])
  expect(prepared[2]).toMatchObject({ op: 'createNode', node: { props: {} } })
  expect(operations[0]).toMatchObject({ node: { props: { source: '/old.png' }, style: { objectFit: 'cover' } } })
  expect(prepareInitialMedia([operations[2]])[0]).toBe(operations[2])
})

it.each(['dispose', 'flush'] as const)('owns the pending image-creation task when explicitly asked to %s', async (action) => {
  const sent: NativeMutationOperation[][] = []
  const host = createNativeHost({ send: operations => sent.push(operations) })
  const document = createDocument(createNode('View', {}, {}, {}, [createNode('Image', { source: '/fixture.png' })]), { exports: {}, functions: [], code: '' }, { source: 'fixture' })
  const tree = materializeNativeBindingTree(document, { entries: [] }, host)
  host.snapshot(tree.root)
  host.insert(tree.root, host.clone(tree.root.children[0]))
  await Promise.resolve()
  expect(sent).toHaveLength(0)
  host[action]()
  await new Promise(resolve => setTimeout(resolve, 10))
  expect(sent).toHaveLength(action === 'flush' ? 1 : 0)
  host.dispose()
})

it('keeps already-mounted Image source updates at the ordinary microtask boundary', async () => {
  const sent: NativeMutationOperation[][] = []
  const host = createNativeHost({ send: operations => sent.push(operations) })
  const image = host.adopt({ __stxId: 'existing' }, 'Image')
  host.setAttribute(image, 'source', { uri: '/next.png' })
  await Promise.resolve()
  expect(sent).toEqual([[{ op: 'updateNode', id: 'existing', patch: { props: { source: { uri: '/next.png' } } } }]])
  host.dispose()
})
