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
import { extractStreamBoundaries, renderStreamingPage, streamToResponse } from '../../src/streaming'

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
