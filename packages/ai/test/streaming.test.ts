import { afterEach, describe, expect, test } from 'bun:test'
import { configureAI, resetAI } from '../src/ai'
import { MockProvider } from '../src/providers/mock'
import { collectStream, streamChat } from '../src/streaming'

afterEach(() => {
  resetAI()
})

describe('streamChat', () => {
  test('yields StreamChunk objects', async () => {
    const mock = new MockProvider(['Hi!'])
    configureAI({ default: 'mock', providers: { mock } })

    const chunks: Array<{ content: string, done: boolean }> = []
    for await (const chunk of streamChat([{ role: 'user', content: 'Hello' }])) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBe(3) // 'H', 'i', '!'
    expect(chunks[0].content).toBe('H')
    expect(chunks[0].done).toBe(false)
    expect(chunks[2].content).toBe('!')
    expect(chunks[2].done).toBe(true)
  })

  test('uses specified provider', async () => {
    const mock1 = new MockProvider(['abc'])
    const mock2 = new MockProvider(['xy'])
    mock2.name = 'mock2'

    configureAI({ default: 'mock', providers: { mock: mock1, mock2 } })

    const chunks: string[] = []
    for await (const chunk of streamChat([{ role: 'user', content: 'Hi' }], { provider: 'mock2' })) {
      chunks.push(chunk.content)
    }

    expect(chunks.join('')).toBe('xy')
  })

  test('throws if provider does not support streaming', async () => {
    const provider = {
      name: 'no-stream',
      chat: async () => ({ content: 'ok', model: 'test' }),
    }

    configureAI({ default: 'no-stream', providers: { 'no-stream': provider } })

    const gen = streamChat([{ role: 'user', content: 'Hi' }])
    try {
      // eslint-disable-next-line ts/no-unused-vars
      for await (const _chunk of gen) {
        // should not reach here
      }
      expect(true).toBe(false) // should not reach
    }
    catch (err: any) {
      expect(err.message).toContain('does not support streaming')
    }
  })
})

describe('collectStream', () => {
  test('concatenates all chunks into a string', async () => {
    const mock = new MockProvider(['Hello world'])
    configureAI({ default: 'mock', providers: { mock } })

    const stream = streamChat([{ role: 'user', content: 'Hi' }])
    const result = await collectStream(stream)
    expect(result).toBe('Hello world')
  })

  test('handles empty stream', async () => {
    async function* emptyStream() {
      // yields nothing
    }

    const result = await collectStream(emptyStream())
    expect(result).toBe('')
  })
})
