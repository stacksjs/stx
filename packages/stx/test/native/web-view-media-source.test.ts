/**
 * A web view's media with a bound `src`. HTML writes `<img :src="url()">` and
 * `<video :src="clip()">`; the native hosts read `source`. The translator
 * renames a static `src` (html-to-ir.ts); a binding keeps its `src` name in
 * the IR and the native host maps it when it is set (prop-names.ts
 * `nativePropName`). Either way the host gets `source` as the plain URL
 * string, not React Native's `{ uri }`, and a bound one follows its signal.
 */
import { expect, test } from 'bun:test'
import { mountWebView, webApp } from './web-view-app'

test('a bound img and video src is the native source, and follows its signal', async () => {
  const root = webApp({
    'views/media.stx': `<script client>
  const pic = state('/first.png')
  const clip = state('/first.mp4')
  function next() {
    pic.set('/second.png')
    clip.set('/second.mp4')
  }
</script>
<div>
  <img testid="static" src="/static.png" alt="Static" />
  <img testid="bound" :src="pic()" alt="Bound" />
  <img testid="templated" src="{{ pic() }}" alt="Templated" />
  <img testid="alpine" x-src="pic()" alt="Alpine" />
  <video testid="clip" :src="clip()" controls></video>
  <button testid="next" @click="next()">Next</button>
</div>
`,
  })
  const phone = await mountWebView(root, { Media: 'views/media.stx' }, 'Media')
  try {
    expect(phone.byTestID('static')!.props.source).toBe('/static.png')
    expect(phone.byTestID('bound')!.type).toBe('Image')
    expect(phone.byTestID('bound')!.props.source).toBe('/first.png')
    expect(phone.byTestID('bound')!.props.src).toBeUndefined()
    expect(phone.byTestID('templated')!.props.source).toBe('/first.png')
    expect(phone.byTestID('alpine')!.props.source).toBe('/first.png')
    expect(phone.byTestID('clip')!.type).toBe('Video')
    expect(phone.byTestID('clip')!.props.source).toBe('/first.mp4')
    phone.press(phone.byTestID('next')!)
    await phone.settle()
    expect(phone.byTestID('bound')!.props.source).toBe('/second.png')
    expect(phone.byTestID('templated')!.props.source).toBe('/second.png')
    expect(phone.byTestID('alpine')!.props.source).toBe('/second.png')
    expect(phone.byTestID('clip')!.props.source).toBe('/second.mp4')
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
