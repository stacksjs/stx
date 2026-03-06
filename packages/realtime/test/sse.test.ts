import { describe, expect, test } from 'bun:test'
import { SSEStream, createSSEResponse, createSSEStream } from '../src/sse'

describe('SSEStream', () => {
  test('toResponse returns proper headers', () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
    expect(response.headers.get('Connection')).toBe('keep-alive')

    stream.close()
  })

  test('send formats SSE message correctly', async () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    stream.send('message', 'hello world')
    stream.close()

    const text = await response.text()
    expect(text).toContain('event: message\n')
    expect(text).toContain('data: hello world\n')
  })

  test('send with id includes id field', async () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    stream.send('update', 'data', '123')
    stream.close()

    const text = await response.text()
    expect(text).toContain('id: 123\n')
    expect(text).toContain('event: update\n')
    expect(text).toContain('data: data\n')
  })

  test('send serializes objects as JSON', async () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    stream.send('data', { key: 'value' })
    stream.close()

    const text = await response.text()
    expect(text).toContain('data: {"key":"value"}\n')
  })

  test('send handles multiline data', async () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    stream.send('msg', 'line1\nline2')
    stream.close()

    const text = await response.text()
    expect(text).toContain('data: line1\n')
    expect(text).toContain('data: line2\n')
  })

  test('retry config is sent at start', async () => {
    const stream = new SSEStream({ retry: 5000 })
    const response = stream.toResponse()

    stream.send('test', 'data')
    stream.close()

    const text = await response.text()
    expect(text).toContain('retry: 5000\n')
  })

  test('close prevents further sends', async () => {
    const stream = new SSEStream()
    const response = stream.toResponse()

    stream.send('msg', 'before')
    stream.close()
    stream.send('msg', 'after')

    const text = await response.text()
    expect(text).toContain('data: before\n')
    expect(text).not.toContain('data: after\n')
  })

  test('double close does not throw', () => {
    const stream = new SSEStream()
    stream.toResponse()

    expect(() => {
      stream.close()
      stream.close()
    }).not.toThrow()
  })
})

describe('createSSEStream', () => {
  test('creates an SSEStream instance', () => {
    const stream = createSSEStream()
    expect(stream).toBeInstanceOf(SSEStream)
    stream.close()
  })
})

describe('createSSEResponse', () => {
  test('returns a Response with correct headers', () => {
    const response = createSSEResponse((stream) => {
      stream.send('init', 'hello')
      stream.close()
    })

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
  })

  test('handler receives a stream and can send data', async () => {
    const response = createSSEResponse((stream) => {
      stream.send('msg', 'test-data')
      stream.close()
    })

    const text = await response.text()
    expect(text).toContain('event: msg\n')
    expect(text).toContain('data: test-data\n')
  })
})
