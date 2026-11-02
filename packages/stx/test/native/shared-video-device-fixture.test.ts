import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('runs the shared Video device fixture (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-video-device.stx'), { root, minify })
  expect(result.dependencies).toContain(join(root, 'packages/components/src/ui/video/Video.stx'))
  expect(result.dependencies).toContain(join(root, 'packages/stx/src/native/primitives/Video.stx'))
  // Browser custom-element fallback selectors have no native meaning. Keep
  // those exact diagnostics visible; any additional diagnostic is a failure.
  expect(result.diagnostics.filter(item => !['dropped-subtree: script', 'dropped-subtree: style'].includes(item.message))).toEqual([
    { level: 'warning', message: 'unsupported-style-rule: style: video-player:not(:defined) video-skin' },
    { level: 'warning', message: 'unsupported-style-rule: style: video-player:defined>[data-native-fallback]' },
  ])
  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    const video = phone.byTestID('shared-movie')!
    const legacy = phone.byTestID('legacy-movie')!
    const probe = phone.context.videoProbe
    expect(video.type).toBe('Video')
    expect(video.props).toMatchObject({ controls: false, autoplay: false, loop: false, muted: true, paused: false })
    probe.source.set('file:///fixture.mp4')
    probe.legacySource.set('file:///legacy.mp4')
    await phone.settle()
    expect(video.props.source).toBe('file:///fixture.mp4')
    expect(legacy.props.source).toEqual({ uri: 'file:///legacy.mp4' })
    const start = phone.operations().length
    for (const action of ['controls', 'autoplay', 'loop', 'muted'])
      phone.press(phone.byTestID(`video-${action}`)!)
    await phone.settle()
    expect(video.props).toMatchObject({ controls: true, autoplay: true, loop: true, muted: false })
    expect(phone.byTestID('shared-movie')).toBe(video)
    expect(phone.operations().slice(start).some(op => op.op === 'updateNode' && op.patch.props?.source !== undefined)).toBe(false)
    for (const [event, payload] of [['onLoadStart', {}], ['onLoad', { duration: 2 }], ['onPlay', {}], ['onPause', {}], ['onEnd', {}], ['onProgress', { currentTime: 1 }], ['onError', { message: 'fixture error' }]] as const)
      phone.press(video, event, payload)
    expect([probe.starts(), probe.loads(), probe.plays(), probe.pauses(), probe.ends(), probe.progress(), probe.errors()]).toEqual([1, 1, 1, 1, 1, 1, ['fixture error']])
    phone.press(phone.byTestID('video-toggle')!)
    await phone.settle()
    expect(phone.byTestID('shared-movie')).toBeUndefined()
    phone.press(video, 'onPlay', {})
    expect(probe.plays()).toBe(1)
    phone.press(phone.byTestID('video-defaults')!)
    probe.source.set('file:///current.mp4')
    await phone.settle()
    const remountStart = phone.operations().length
    phone.press(phone.byTestID('video-toggle')!)
    await phone.settle()
    expect(phone.byTestID('shared-movie')!.props).toMatchObject({ source: 'file:///current.mp4', controls: true, autoplay: false, loop: false, muted: false })
    const creation = phone.operations().slice(remountStart).find(op => op.op === 'createNode' && op.id === video.id)
    expect(creation?.op).toBe('createNode')
    if (creation?.op !== 'createNode') throw new Error('missing remounted video creation')
    expect(creation.node.props).toMatchObject({ source: 'file:///current.mp4', controls: true, autoplay: false, loop: false, muted: false })
    expect(phone.byTestID('legacy-movie')).toBe(legacy)
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.source.set('file:///disposed.mp4')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
