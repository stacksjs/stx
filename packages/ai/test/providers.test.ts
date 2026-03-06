import { afterEach, describe, expect, test } from 'bun:test'
import { MockProvider } from '../src/providers/mock'
import { anthropicProvider } from '../src/providers/anthropic'
import { openaiProvider } from '../src/providers/openai'
import { configureAI, resetAI } from '../src/ai'

afterEach(() => {
  resetAI()
})

describe('MockProvider', () => {
  test('chat returns responses in order', async () => {
    const mock = new MockProvider(['first', 'second', 'third'])

    const r1 = await mock.chat([{ role: 'user', content: 'a' }])
    const r2 = await mock.chat([{ role: 'user', content: 'b' }])
    const r3 = await mock.chat([{ role: 'user', content: 'c' }])

    expect(r1.content).toBe('first')
    expect(r2.content).toBe('second')
    expect(r3.content).toBe('third')
  })

  test('chat cycles through responses', async () => {
    const mock = new MockProvider(['a', 'b'])

    await mock.chat([{ role: 'user', content: '1' }])
    await mock.chat([{ role: 'user', content: '2' }])
    const r3 = await mock.chat([{ role: 'user', content: '3' }])

    expect(r3.content).toBe('a') // cycles back
  })

  test('records calls', async () => {
    const mock = new MockProvider()

    await mock.chat([{ role: 'user', content: 'hello' }], { temperature: 0.5 })

    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0].messages[0].content).toBe('hello')
    expect(mock.calls[0].options?.temperature).toBe(0.5)
  })

  test('getLastCall returns the most recent call', async () => {
    const mock = new MockProvider()

    await mock.chat([{ role: 'user', content: 'first' }])
    await mock.chat([{ role: 'user', content: 'second' }])

    expect(mock.getLastCall()?.messages[0].content).toBe('second')
  })

  test('getLastCall returns undefined when no calls', () => {
    const mock = new MockProvider()
    expect(mock.getLastCall()).toBeUndefined()
  })

  test('reset clears state', async () => {
    const mock = new MockProvider(['custom'])

    await mock.chat([{ role: 'user', content: 'test' }])
    mock.reset()

    expect(mock.calls).toHaveLength(0)
    expect(mock.responses).toEqual(['Mock response'])

    const r = await mock.chat([{ role: 'user', content: 'after reset' }])
    expect(r.content).toBe('Mock response')
  })

  test('addResponse appends to responses', () => {
    const mock = new MockProvider()
    mock.addResponse('new response')

    expect(mock.responses).toContain('new response')
  })

  test('stream yields chunks character by character', async () => {
    const mock = new MockProvider(['Hi!'])

    const chunks: Array<{ content: string, done: boolean, finishReason?: string }> = []
    for await (const chunk of mock.stream!([{ role: 'user', content: 'test' }])) {
      chunks.push(chunk)
    }

    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toEqual({ content: 'H', done: false, finishReason: undefined })
    expect(chunks[1]).toEqual({ content: 'i', done: false, finishReason: undefined })
    expect(chunks[2]).toEqual({ content: '!', done: true, finishReason: 'stop' })
  })

  test('stream records the call', async () => {
    const mock = new MockProvider(['ok'])

    // eslint-disable-next-line ts/no-unused-vars
    for await (const _chunk of mock.stream!([{ role: 'user', content: 'stream test' }])) {
      // consume
    }

    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0].messages[0].content).toBe('stream test')
  })

  test('embed returns an embedding array', async () => {
    const mock = new MockProvider()

    const result = await mock.embed!('test text')

    expect(result.embedding).toHaveLength(128)
    expect(result.model).toBe('mock-embedding')
    expect(result.usage?.totalTokens).toBeGreaterThan(0)
    expect(typeof result.embedding[0]).toBe('number')
  })

  test('embed returns consistent results for same input', async () => {
    const mock = new MockProvider()

    const r1 = await mock.embed!('same text')
    const r2 = await mock.embed!('same text')

    expect(r1.embedding).toEqual(r2.embedding)
  })

  test('default constructor provides Mock response', async () => {
    const mock = new MockProvider()
    const r = await mock.chat([{ role: 'user', content: 'hi' }])
    expect(r.content).toBe('Mock response')
  })
})

describe('anthropicProvider', () => {
  test('creates a provider with name "anthropic"', () => {
    const provider = anthropicProvider({ apiKey: 'test-key' })
    expect(provider.name).toBe('anthropic')
  })

  test('chat is a function', () => {
    const provider = anthropicProvider({ apiKey: 'test-key' })
    expect(typeof provider.chat).toBe('function')
  })

  test('stream is a function', () => {
    const provider = anthropicProvider({ apiKey: 'test-key' })
    expect(typeof provider.stream).toBe('function')
  })

  test('throws without API key', async () => {
    const provider = anthropicProvider({ apiKey: '' })
    await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow('API key is required')
  })

  test('can be registered with configureAI', () => {
    const provider = anthropicProvider({ apiKey: 'test-key' })
    configureAI({ default: 'anthropic', providers: { anthropic: provider } })

    const result = require('../src/ai').useAI()
    expect(result.name).toBe('anthropic')
  })
})

describe('openaiProvider', () => {
  test('creates a provider with name "openai"', () => {
    const provider = openaiProvider({ apiKey: 'test-key' })
    expect(provider.name).toBe('openai')
  })

  test('chat is a function', () => {
    const provider = openaiProvider({ apiKey: 'test-key' })
    expect(typeof provider.chat).toBe('function')
  })

  test('stream is a function', () => {
    const provider = openaiProvider({ apiKey: 'test-key' })
    expect(typeof provider.stream).toBe('function')
  })

  test('embed is a function', () => {
    const provider = openaiProvider({ apiKey: 'test-key' })
    expect(typeof provider.embed).toBe('function')
  })

  test('throws without API key', async () => {
    const provider = openaiProvider({ apiKey: '' })
    await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow('API key is required')
  })

  test('accepts custom baseUrl', () => {
    const provider = openaiProvider({ apiKey: 'key', baseUrl: 'https://custom.api.com/v1' })
    expect(provider.name).toBe('openai')
    // Just verifying it constructs without error
  })
})
