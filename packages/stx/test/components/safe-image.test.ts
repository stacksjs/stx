/**
 * Tests for the <SafeImage> builtin (stacksjs/stx#1732).
 *
 * SafeImage is a drop-in <img> wrapper that swaps to a fallback image
 * (and optionally a fallback class) when the primary src 404s, via an
 * inline onerror= handler that calls a single window-level function.
 */
import { describe, expect, it } from 'bun:test'
import { processComponents } from '../../src/component-renderer'
import { defaultConfig } from '../../src/config'

async function render(template: string, context: Record<string, any> = {}): Promise<string> {
  const deps = new Set<string>()
  return processComponents(template, context, '/tmp/page.stx', { ...defaultConfig, debug: false }, deps)
}

describe('SafeImage builtin (#1732)', () => {
  it('renders an <img> with src, alt, and the onerror handler hook', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="Avatar" />`)
    expect(out).toContain('<img')
    expect(out).toContain('src="/a.png"')
    expect(out).toContain('alt="Avatar"')
    expect(out).toContain('onerror="window.__stxSafeImageHandler(this)"')
  })

  it('defaults the fallback when none is provided', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="x" />`)
    expect(out).toContain('data-fallback="/images/safe-image-default.svg"')
  })

  it('uses a per-instance fallback when provided', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="x" fallback="/avatars/default-judge.svg" />`)
    expect(out).toContain('data-fallback="/avatars/default-judge.svg"')
  })

  it('passes className through as class and fallbackClassName as data-fallback-class', async () => {
    const out = await render(
      `<SafeImage src="/a.png" alt="x" className="h-12 w-12 rounded-full grayscale filter" fallbackClassName="h-12 w-12 rounded-full" />`,
    )
    expect(out).toContain('class="h-12 w-12 rounded-full grayscale filter"')
    expect(out).toContain('data-fallback-class="h-12 w-12 rounded-full"')
  })

  it('omits the data-fallback-class attribute on the <img> when no fallbackClassName is given', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="x" />`)
    // The handler <script> mentions data-fallback-class (it reads the attr),
    // so scope the assertion to the <img> tag itself.
    const imgTag = out.match(/<img\b[^>]*>/)?.[0] ?? ''
    expect(imgTag).not.toContain('data-fallback-class')
  })

  it('emits the window handler script exactly once per page render', async () => {
    const out = await render(`
      <SafeImage src="/a.png" alt="a" />
      <SafeImage src="/b.png" alt="b" />
      <SafeImage src="/c.png" alt="c" />
    `)
    // Three images...
    expect((out.match(/<img/g) || []).length).toBe(3)
    // ...but only one handler registration script.
    expect((out.match(/__stxSafeImageHandler=/g) || []).length).toBe(1)
  })

  it('handler script is idempotent and guards against infinite fallback loops', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="x" />`)
    // Idempotent registration: the `||` short-circuit.
    expect(out).toContain('window.__stxSafeImageHandler||(window.__stxSafeImageHandler=')
    // Loop guard: the `__stx_fb` flag is set before the src swap so the
    // fallback's own error event is a no-op.
    expect(out).toContain('if(i.__stx_fb)return;i.__stx_fb=1;')
  })

  it('escapes attribute values to prevent breaking out of the tag', async () => {
    const out = await render(`<SafeImage src="/a.png&quot; onload=&quot;alert(1)" alt="x" />`)
    // The raw quote-breaking sequence must not appear unescaped in a way
    // that introduces a new attribute. We assert the dangerous literal
    // isn't present verbatim as an executable attribute.
    expect(out).not.toContain('onload="alert(1)"')
  })

  it('forwards extra attributes (loading, width, height)', async () => {
    const out = await render(`<SafeImage src="/a.png" alt="x" loading="lazy" width="48" height="48" />`)
    expect(out).toContain('loading="lazy"')
    expect(out).toContain('width="48"')
    expect(out).toContain('height="48"')
  })

  it('resolves the safe-image and safe-img aliases', async () => {
    const kebab = await render(`<safe-image src="/a.png" alt="x" />`)
    expect(kebab).toContain('onerror="window.__stxSafeImageHandler(this)"')
    const short = await render(`<safe-img src="/a.png" alt="x" />`)
    expect(short).toContain('onerror="window.__stxSafeImageHandler(this)"')
  })

  it('evaluates a server-dynamic :src binding', async () => {
    const out = await render(`<SafeImage :src="photo" alt="x" />`, { photo: '/from-server.png' })
    expect(out).toContain('src="/from-server.png"')
  })
})
