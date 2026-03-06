import { afterEach, describe, expect, test } from 'bun:test'
import { configureAI, resetAI } from '../src/ai'
import { ask, chat } from '../src/chat'
import { MockProvider } from '../src/providers/mock'

afterEach(() => {
  resetAI()
})

describe('chat', () => {
  test('delegates to the default provider', async () => {
    const mock = new MockProvider(['Hello back!'])
    configureAI({ default: 'mock', providers: { mock } })

    const response = await chat([{ role: 'user', content: 'Hello' }])
    expect(response.content).toBe('Hello back!')
    expect(response.model).toBe('mock-model')
    expect(response.finishReason).toBe('stop')
  })

  test('passes options to provider', async () => {
    const mock = new MockProvider(['response'])
    configureAI({ default: 'mock', providers: { mock } })

    await chat([{ role: 'user', content: 'Hi' }], { temperature: 0.5, maxTokens: 100 })

    const lastCall = mock.getLastCall()
    expect(lastCall?.options?.temperature).toBe(0.5)
    expect(lastCall?.options?.maxTokens).toBe(100)
  })

  test('uses specified provider', async () => {
    const mock1 = new MockProvider(['from mock1'])
    const mock2 = new MockProvider(['from mock2'])
    mock2.name = 'mock2'

    configureAI({ default: 'mock', providers: { mock: mock1, mock2 } })

    const response = await chat([{ role: 'user', content: 'Hi' }], { provider: 'mock2' })
    expect(response.content).toBe('from mock2')
  })

  test('includes usage information', async () => {
    const mock = new MockProvider(['Hi'])
    configureAI({ default: 'mock', providers: { mock } })

    const response = await chat([{ role: 'user', content: 'Hello' }])
    expect(response.usage).toBeDefined()
    expect(response.usage!.inputTokens).toBeGreaterThan(0)
    expect(response.usage!.outputTokens).toBeGreaterThan(0)
    expect(response.usage!.totalTokens).toBe(response.usage!.inputTokens + response.usage!.outputTokens)
  })
})

describe('ask', () => {
  test('returns just the content string', async () => {
    const mock = new MockProvider(['The answer is 42'])
    configureAI({ default: 'mock', providers: { mock } })

    const result = await ask('What is the answer?')
    expect(result).toBe('The answer is 42')
  })

  test('wraps prompt as user message', async () => {
    const mock = new MockProvider(['ok'])
    configureAI({ default: 'mock', providers: { mock } })

    await ask('test prompt')

    const lastCall = mock.getLastCall()
    expect(lastCall?.messages).toHaveLength(1)
    expect(lastCall?.messages[0].role).toBe('user')
    expect(lastCall?.messages[0].content).toBe('test prompt')
  })

  test('prepends system message when provided', async () => {
    const mock = new MockProvider(['ok'])
    configureAI({ default: 'mock', providers: { mock } })

    await ask('test prompt', { system: 'You are helpful.' })

    const lastCall = mock.getLastCall()
    expect(lastCall?.messages).toHaveLength(2)
    expect(lastCall?.messages[0].role).toBe('system')
    expect(lastCall?.messages[0].content).toBe('You are helpful.')
    expect(lastCall?.messages[1].role).toBe('user')
  })

  test('uses specified provider', async () => {
    const mock1 = new MockProvider(['from mock1'])
    const mock2 = new MockProvider(['from mock2'])
    mock2.name = 'mock2'

    configureAI({ default: 'mock', providers: { mock: mock1, mock2 } })

    const result = await ask('Hi', { provider: 'mock2' })
    expect(result).toBe('from mock2')
  })
})
