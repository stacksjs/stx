import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { expect, it } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { createNativeHost } from '../../src/native/runtime/native-host'

it('keeps native Video as a leaf without browser fallback or control nodes', async () => {
  for (const tag of ['video', 'video-player data-native="Video"']) {
    const { root, diagnostics } = await translateHtmlToIR(`<${tag} src="/movie.mp4" controls>
      <video src="/fallback.mp4"></video>
      <video-skin><media-play-button></media-play-button><svg><path d="M0 0" /></svg></video-skin>
    </${tag.split(' ')[0]}>`)
    expect(root.type).toBe('Video')
    expect(root.props.source).toBe('/movie.mp4')
    expect(root.props.src).toBeUndefined()
    expect(root.children).toEqual([])
    expect(diagnostics.filter(item => item.kind === 'unmapped-tag')).toEqual([])
  }
  const view = await translateHtmlToIR('<div><unknown-control></unknown-control></div>')
  expect(view.diagnostics).toContainEqual({ kind: 'unmapped-tag', tag: 'unknown-control' })
})

it('maps video src reads, writes and removal to source while preserving legacy source values', () => {
  const batches: NativeMutationOperation[][] = []
  const host = createNativeHost({ send: operations => batches.push(operations), schedule: () => {} })
  const video = host.adopt({ __stxId: 'video' }, 'Video')
  host.setAttribute(video, 'src', '/first.mp4')
  expect(host.getAttribute(video, 'source')).toBe('/first.mp4')
  host.removeAttribute(video, 'src')
  expect(host.getAttribute(video, 'source')).toBeNull()
  host.setAttribute(video, 'source', { uri: '/legacy.mp4' })
  // DOM-like attribute reads stringify; the bridge retains the typed object.
  expect(host.getAttribute(video, 'src')).toBe('[object Object]')
  host.flush()
  expect(batches.flat()).toEqual([
    { op: 'updateNode', id: 'video', patch: { props: { source: '/first.mp4' } } },
    { op: 'updateNode', id: 'video', patch: { props: { source: null } } },
    { op: 'updateNode', id: 'video', patch: { props: { source: { uri: '/legacy.mp4' } } } },
  ])
  host.dispose()
})
