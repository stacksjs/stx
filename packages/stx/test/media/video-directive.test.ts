import { describe, expect, it } from 'bun:test'
import { renderVideoComponent } from '../../src/media/video/index'

describe('@video directive - renderVideoComponent', () => {
  it('should render basic video with controls', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/intro.mp4', controls: true },
      { isDev: true },
    )

    expect(result.html).toContain('<video')
    expect(result.html).toContain('/videos/intro.mp4')
    expect(result.html).toContain('controls')
  })

  it('should include autoplay and muted attributes', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/bg.mp4', autoplay: true, muted: true, controls: false },
      { isDev: true },
    )

    expect(result.html).toContain('autoplay')
    expect(result.html).toContain('muted')
  })

  it('should include loop attribute', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/loop.mp4', loop: true },
      { isDev: true },
    )

    expect(result.html).toContain('loop')
  })

  it('should include poster attribute', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/movie.mp4', poster: '/images/poster.jpg' },
      { isDev: true },
    )

    expect(result.html).toContain('poster')
    expect(result.html).toContain('/images/poster.jpg')
  })

  it('should include custom class and id', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/clip.mp4', class: 'video-player', id: 'main-video' },
      { isDev: true },
    )

    expect(result.html).toContain('video-player')
    expect(result.html).toContain('main-video')
  })

  it('should include width and height', async () => {
    const result = await renderVideoComponent(
      { src: '/videos/clip.mp4', width: 1280, height: 720 },
      { isDev: true },
    )

    expect(result.html).toContain('1280')
    expect(result.html).toContain('720')
  })

  it('should return html as string', async () => {
    const result = await renderVideoComponent(
      { src: '/test.mp4' },
      { isDev: true },
    )

    expect(typeof result.html).toBe('string')
    expect(result.html.length).toBeGreaterThan(0)
  })
})
