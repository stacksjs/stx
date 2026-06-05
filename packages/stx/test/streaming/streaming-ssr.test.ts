/**
 * Streaming SSR (stacksjs/stx#1746 Phase 3) — the deferred-boundary renderer.
 *
 * `renderStreamingPage(shell, boundaries)` flushes the shell (with fallback
 * placeholders) first, then streams each boundary's HTML as its server-side
 * async `render()` resolves. These tests pin the ordering + error isolation at
 * the stream level, and prove genuine deferral over a real chunked HTTP response
 * (`Bun.serve` + `streamToResponse`): the shell arrives before a boundary whose
 * data is gated behind a delay — so first paint isn't blocked on slow data.
 */
import { describe, expect, it } from 'bun:test'
import { extractStreamBoundaries, processStreamDirectives, renderStreamingPage, streamToResponse, SUSPENSE_RESOLVER_RUNTIME } from '../../src/streaming'

async function collect(stream: ReadableStream<string>): Promise<string[]> {
  const reader = stream.getReader()
  const chunks: string[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    chunks.push(value)
  }
  return chunks
}

describe('renderStreamingPage (#1746 Phase 3)', () => {
  it('flushes the shell first, then streams the boundary + a resolver', async () => {
    const stream = renderStreamingPage(
      '<body><h1>Shell</h1><div data-suspense="a">Loading…</div></body>',
      [{ id: 'a', render: async () => '<p>A</p>' }],
    )
    const chunks = await collect(stream)

    expect(chunks[0]).toContain('<h1>Shell</h1>') // shell is the FIRST chunk
    const full = chunks.join('')
    expect(full).toContain('window.__stxSuspense') // receiver emitted once
    expect(full).toContain('window.__stxSuspense.resolve(\'a\'')
    expect(full).toContain('<p>A</p>')
  })

  it('emits only the shell when there are no boundaries (no receiver overhead)', async () => {
    const chunks = await collect(renderStreamingPage('<p>just shell</p>'))
    expect(chunks).toEqual(['<p>just shell</p>'])
  })

  it('the receiver hydrates the swapped-in content (in-boundary hydration)', () => {
    // The receiver keeps node handles and calls window.stx.hydrate so interactive
    // content inside a streamed boundary comes alive.
    expect(SUSPENSE_RESOLVER_RUNTIME).toContain('window.stx.hydrate')
    expect(SUSPENSE_RESOLVER_RUNTIME).toContain('childNodes')
  })

  it('isolates a boundary error instead of failing the whole stream', async () => {
    const stream = renderStreamingPage(
      '<div data-suspense="x">…</div>',
      [{ id: 'x', render: async () => { throw new Error('boom') } }],
    )
    const full = (await collect(stream)).join('')
    expect(full).toContain('window.__stxSuspense.resolve(\'x\'') // still resolves the boundary
    expect(full).toContain('Error loading content') // with an error UI, stream intact
  })

  it('streams independent boundaries in completion order, not declaration order', async () => {
    const stream = renderStreamingPage(
      '<div data-suspense="slow"></div><div data-suspense="fast"></div>',
      [
        { id: 'slow', render: async () => { await Bun.sleep(40); return '<p>SLOW</p>' } },
        { id: 'fast', render: async () => '<p>FAST</p>' },
      ],
    )
    const full = (await collect(stream)).join('')
    // fast resolves first → its resolve script precedes slow's
    expect(full.indexOf('resolve(\'fast\'')).toBeLessThan(full.indexOf('resolve(\'slow\''))
  })

  it('HTTP: flushes the shell before a slow boundary resolves (real chunked stream)', async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        const stream = renderStreamingPage(
          '<!DOCTYPE html><html><body><h1>Shell</h1><div data-suspense="slow">Loading…</div></body></html>',
          [{ id: 'slow', render: async () => { await Bun.sleep(80); return '<p id="loaded">DATA</p>' } }],
        )
        return streamToResponse(stream)
      },
    })
    try {
      const res = await fetch(`http://localhost:${server.port}/`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let shellBeforeBoundary = false
      let hasBoundary = false
      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        acc += decoder.decode(value, { stream: true })
        // The boundary is gated behind an 80ms await, so on early reads the shell
        // is present but the boundary is not — that's genuine deferral.
        if (acc.includes('<h1>Shell</h1>') && !acc.includes('resolve(\'slow\''))
          shellBeforeBoundary = true
        if (acc.includes('resolve(\'slow\''))
          hasBoundary = true
      }
      expect(shellBeforeBoundary).toBe(true)
      expect(hasBoundary).toBe(true)
      expect(acc).toContain('<p id="loaded">DATA</p>')
    }
    finally {
      server.stop(true)
    }
  })
})

describe('extractStreamBoundaries (serve-app opt-in)', () => {
  it('reads a streamBoundaries export off the server context, in declaration order', () => {
    const b = extractStreamBoundaries({ streamBoundaries: { a: async () => 'A', b: async () => 'B' } })
    expect(b?.map(x => x.id)).toEqual(['a', 'b'])
  })

  it('returns undefined when the page declares no boundaries', () => {
    expect(extractStreamBoundaries({ title: 'x' })).toBeUndefined()
    expect(extractStreamBoundaries(undefined)).toBeUndefined()
    expect(extractStreamBoundaries(null)).toBeUndefined()
    expect(extractStreamBoundaries({ streamBoundaries: {} })).toBeUndefined()
  })

  it('ignores non-function entries', () => {
    const b = extractStreamBoundaries({ streamBoundaries: { a: async () => 'A', bad: 'nope' } })
    expect(b?.map(x => x.id)).toEqual(['a'])
  })
})

describe('processStreamDirectives (@stream sugar)', () => {
  it('emits a placeholder + fallback and stashes the RAW inner template', () => {
    const ctx: Record<string, any> = {}
    const out = processStreamDirectives(
      `<h1>Page</h1>@stream('article')<article>{{ $boundary.title }}</article>@fallback<p>Loading…</p>@endstream<footer>f</footer>`,
      ctx,
    )
    expect(out).toContain('<div data-suspense="article"><p>Loading…</p></div>')
    expect(out).toContain('<h1>Page</h1>')
    expect(out).toContain('<footer>f</footer>')
    expect(out).not.toContain('@stream')
    // template stashed verbatim — its {{ }} stays un-evaluated for later
    expect(ctx.__streamTemplates.article).toBe('<article>{{ $boundary.title }}</article>')
  })

  it('supports a boundary with no @fallback (empty placeholder)', () => {
    const ctx: Record<string, any> = {}
    const out = processStreamDirectives(`@stream('x')<p>{{ $boundary.v }}</p>@endstream`, ctx)
    expect(out).toBe('<div data-suspense="x"></div>')
    expect(ctx.__streamTemplates.x).toBe('<p>{{ $boundary.v }}</p>')
  })

  it('handles multiple boundaries', () => {
    const ctx: Record<string, any> = {}
    processStreamDirectives(`@stream('a')A@fallback fa@endstream @stream('b')B@fallback fb@endstream`, ctx)
    expect(Object.keys(ctx.__streamTemplates)).toEqual(['a', 'b'])
  })

  it('is a no-op without @stream', () => {
    const ctx: Record<string, any> = {}
    expect(processStreamDirectives('<p>plain</p>', ctx)).toBe('<p>plain</p>')
    expect(ctx.__streamTemplates).toBeUndefined()
  })

  it('end-to-end: @stream emits the shell placeholder; the template renders with $boundary', async () => {
    const { processDirectives } = await import('../../src/process')
    const { defaultConfig } = await import('../../src/config')
    const ctx: Record<string, any> = {}
    const page = `<html><head><title>t</title></head><body><h1>Blog</h1>@stream('article')<article>{{ $boundary.title }}</article>@fallback<p>Loading…</p>@endstream</body></html>`
    const shell = await processDirectives(page, ctx, '/tmp/p.stx', { ...defaultConfig } as any, new Set())
    expect(shell).toContain('<div data-suspense="article"><p>Loading…</p></div>')
    expect(ctx.__streamTemplates.article).toBe('<article>{{ $boundary.title }}</article>')

    // Render the captured template with its resolved boundary data (serve-app flow).
    const resolved = await processDirectives(ctx.__streamTemplates.article, { ...ctx, $boundary: { title: 'Hello' } }, '/tmp/p.stx', { ...defaultConfig, autoShell: false } as any, new Set())
    expect(resolved).toContain('Hello')
  })

  it('HTTP: composes extract → renderStreamingPage → streamToResponse like serve-app', async () => {
    // Mirrors the serve-app flow exactly: the page's server context exports
    // streamBoundaries; the (already-pipelined) shell carries the placeholder.
    const context = {
      streamBoundaries: {
        article: async () => { await Bun.sleep(60); return '<article id="a">DATA</article>' },
      },
    }
    const shell = '<!DOCTYPE html><html><body><h1>Page</h1><div data-suspense="article">Loading…</div></body></html>'
    const server = Bun.serve({
      port: 0,
      fetch() {
        const boundaries = extractStreamBoundaries(context)!
        return streamToResponse(renderStreamingPage(shell, boundaries))
      },
    })
    try {
      const res = await fetch(`http://localhost:${server.port}/`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let shellFirst = false
      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        acc += decoder.decode(value, { stream: true })
        if (acc.includes('<h1>Page</h1>') && !acc.includes('resolve(\'article\''))
          shellFirst = true
      }
      expect(shellFirst).toBe(true)
      expect(acc).toContain('<article id="a">DATA</article>')
    }
    finally {
      server.stop(true)
    }
  })
})
