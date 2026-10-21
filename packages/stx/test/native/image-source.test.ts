import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { expect, it } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { createNativeHost } from '../../src/native/runtime/native-host'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('translates an img src to native source without overriding an explicit native source', async () => {
  const { root } = await translateHtmlToIR('<img src="/first.png" alt="Photo">')
  expect(root.type).toBe('Image')
  expect(root.props.source).toBe('/first.png')
  expect(root.props.src).toBeUndefined()
  const explicit = await translateHtmlToIR('<img src="/fallback.png" source="/native.png">')
  expect(explicit.root.props.source).toBe('/native.png')
  const ordinary = await translateHtmlToIR('<div src="/metadata.png"></div>')
  expect(ordinary.root.props.src).toBe('/metadata.png')
  expect(ordinary.root.props.source).toBeUndefined()
})

it('maps image src reads, writes and removal to the same native prop', () => {
  const batches: NativeMutationOperation[][] = []
  const host = createNativeHost({ send: operations => batches.push(operations), schedule: () => {} })
  const image = host.adopt({ __stxId: 'image' }, 'Image')
  host.setAttribute(image, 'src', '/first.png')
  expect(host.getAttribute(image, 'src')).toBe('/first.png')
  expect(host.getAttribute(image, 'source')).toBe('/first.png')
  host.removeAttribute(image, 'src')
  expect(host.getAttribute(image, 'source')).toBeNull()
  host.flush()
  expect(batches.flat()).toEqual([
    { op: 'updateNode', id: 'image', patch: { props: { source: '/first.png' } } },
    { op: 'updateNode', id: 'image', patch: { props: { source: null } } },
  ])
  host.dispose()
})

it.each([false, true])('updates and clears a native img without changing legacy source bindings (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const url = state('/first.png')
const legacy = state({ uri: '/legacy.png' })
window.probe = { url, legacy }
</script><div><img testID="image" :src="url" /><Image testID="legacy" :source="legacy" resizeMode="contain" /></div>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    expect(phone.byTestID('image')!.props.source).toBe('/first.png')
    expect(phone.byTestID('legacy')!.props).toMatchObject({ source: { uri: '/legacy.png' }, resizeMode: 'contain' })
    phone.context.probe.url.set('/second.png')
    phone.context.probe.legacy.set({ uri: '/next-legacy.png' })
    await phone.settle()
    expect(phone.byTestID('image')!.props.source).toBe('/second.png')
    expect(phone.byTestID('legacy')!.props.source).toEqual({ uri: '/next-legacy.png' })
    phone.context.probe.url.set(null)
    await phone.settle()
    expect(phone.byTestID('image')!.props.source).toBeNull()
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
