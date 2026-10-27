import path from 'node:path'
import { describe, expect, it, spyOn } from 'bun:test'
import { processDirectives } from '../../stx/src/process'

async function render(tag: string, props: Record<string, unknown>): Promise<string> {
  const dir = path.resolve(import.meta.dir, `../src/ui/${tag.toLowerCase()}`)
  return processDirectives(`<${tag} :options="options" ${Object.keys(props).map(key => `:${key}="options.${key}"`).join(' ')} />`, { options: props }, path.join(dir, 'parity.stx'), { componentsDir: dir, root: dir, buildMode: 'serve', cache: false } as any, new Set<string>())
}

function config(html: string): any {
  const encoded = html.match(/data-media-config="([^"]+)"/)?.[1]
  expect(encoded).toBeDefined()
  return JSON.parse(encoded!.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>'))
}

const drm = {
  widevine: { url: '/licenses/widevine', headers: { Authorization: 'Bearer <secret>&' } },
  playready: { url: '/licenses/playready' },
  fairplay: { url: '/licenses/fairplay', certificateUrl: '/licenses/certificate' },
}

describe('media features formerly shadowed in Stacks defaults', () => {
  for (const tag of ['Audio', 'Video']) {
    it(`${tag} carries license descriptors on DASH sources and leaves progressive fallbacks alone`, async () => {
      const sources = [{ src: '/stream.MPD?token=1#start' }, { src: '/stream', type: 'application/dash+xml' }, { src: '/fallback.mp4', type: 'video/mp4' }]
      const html = await render(tag, { src: sources[0].src, sources, drm, tracks: [{ src: '/captions.vtt', kind: 'captions', srclang: 'en', default: true }] })
      const media = config(html)
      expect(media.drm).toEqual(drm)
      expect(media.sources).toEqual([{ ...sources[0], type: 'application/dash+xml', drm }, { ...sources[1], drm }, sources[2]])
      expect(media.tracks[0].language).toBe('en')
      expect(html).not.toContain('<secret>')
      expect(html).not.toContain('[object Object]')
    })

    it(`${tag} supports a single protected src and no DRM for ordinary files`, async () => {
      expect(config(await render(tag, { src: '/stream.mpd', drm })).sources).toEqual([{ src: '/stream.mpd', type: 'application/dash+xml', drm }])
      expect(config(await render(tag, { src: '/file.mp4' }))).toEqual({ sources: [{ src: '/file.mp4' }], tracks: [] })
    })
  }

  it('Audio renders metadata, waveform, translated controls and native fallback tracks', async () => {
    const html = await render('Audio', { src: '/episode.mp3', title: 'Episode', artist: 'Stacks', artwork: '/cover.jpg', waveform: '/wave.svg', class: 'episode', crossorigin: 'anonymous', autoplay: true, tracks: [{ src: '/chapters.vtt', kind: 'chapters', srclang: 'en', label: 'Chapters', default: true }] })
    for (const value of ['<video-player', 'Episode', 'Stacks', '/cover.jpg', '/wave.svg', 'episode', 'crossorigin="anonymous"', '<track', 'srclang="en"', 'waveform="/wave.svg"', '<media-airplay-button', '<media-remote-playback-button', '<media-settings-menu'])
      expect(html).toContain(value)
    expect(html).not.toMatch(/@(?:if|endif|foreach)/)
    expect(html).not.toMatch(/<audio[^>]*autoplay/)
    expect(html).toMatch(/<audio[^>]*preload="none"/)
    const plain = await render('Audio', { src: '/episode.mp3', controls: false })
    expect(plain).not.toContain('<video-skin>')
  })

  it('Image accepts default prop spellings and explicit art direction', async () => {
    const html = await render('Image', { src: '/photo.jpg', alt: 'Photo', srcset: '/small.jpg 320w', loading: 'eager', fit: 'contain', position: 'top', class: 'photo', sources: [{ srcset: '/wide.avif 960w', type: 'image/avif', media: '(min-width: 960px)' }], sizes: '50vw' })
    expect(html).not.toMatch(/@(?:if|endif|foreach)/)
    for (const value of ['class="photo"', 'srcset="/small.jpg 320w"', 'loading="eager"', 'object-fit: contain', 'object-position: top', 'media="(min-width: 960px)"', 'srcset="/wide.avif 960w"', 'sizes="50vw"'])
      expect(html).toContain(value)
    expect(await render('Image', { src: '/hero.jpg', alt: 'Hero', loading: 'lazy', priority: true })).toContain('loading="eager"')
  })

  it('Image requires meaningful alt unless explicitly decorative', async () => {
    const warning = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await render('Image', { src: '/photo.jpg' })
      expect(warning.mock.calls.flat().join(' ')).toContain('Image alt text is required unless decorative is true')
    }
    finally { warning.mockRestore() }
    const html = await render('Image', { src: '/decoration.svg', alt: 'ignored', decorative: true })
    expect(html).toContain('alt=""')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('<img alt="ignored"')
  })

  it('Image resolves placeholder modes instead of emitting mode names as CSS', async () => {
    for (const placeholder of ['blur', 'thumbhash', 'color']) {
      const html = await render('Image', { src: '/photo.jpg', alt: 'Photo', placeholder, placeholderColor: '#123456' })
      expect(html).toContain('background: #123456')
      expect(html).not.toContain(`background: ${placeholder}`)
    }
    for (const placeholder of ['/preview.jpg', 'data:image/png;base64,AAAA'])
      expect(await render('Image', { src: '/photo.jpg', alt: 'Photo', placeholder })).toContain(`background: url(&quot;${placeholder}&quot;)`)
    for (const placeholder of ['empty', 'none']) {
      // Inspect SSR paint, not background keys in the reactive client script.
      const picture = (await render('Image', { src: '/photo.jpg', alt: 'Photo', placeholder })).match(/<picture\b[^>]*>/)?.[0]
      expect(picture).toBeDefined()
      expect(picture).not.toContain('background:')
    }
  })
})
