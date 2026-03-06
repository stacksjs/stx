import { afterEach, describe, expect, test } from 'bun:test'
import { configureAI, resetAI, useAI } from '../src/ai'
import { MockProvider } from '../src/providers/mock'

afterEach(() => {
  resetAI()
})

describe('configureAI / useAI', () => {
  test('configureAI sets up providers and default', () => {
    const mock = new MockProvider()
    configureAI({
      default: 'mock',
      providers: { mock },
    })

    const provider = useAI()
    expect(provider.name).toBe('mock')
  })

  test('useAI returns specific provider by name', () => {
    const mock1 = new MockProvider(['response1'])
    const mock2 = new MockProvider(['response2'])
    mock2.name = 'mock2'

    configureAI({
      default: 'mock',
      providers: { mock: mock1, mock2 },
    })

    const provider = useAI('mock2')
    expect(provider.name).toBe('mock2')
  })

  test('useAI defaults to first provider if no default specified', () => {
    const mock = new MockProvider()
    configureAI({
      providers: { mock },
    })

    const provider = useAI()
    expect(provider.name).toBe('mock')
  })

  test('useAI throws if not configured', () => {
    expect(() => useAI()).toThrow('AI not configured')
  })

  test('useAI throws for unknown provider', () => {
    const mock = new MockProvider()
    configureAI({
      default: 'mock',
      providers: { mock },
    })

    expect(() => useAI('nonexistent')).toThrow('not found')
  })

  test('resetAI clears configuration', () => {
    const mock = new MockProvider()
    configureAI({
      default: 'mock',
      providers: { mock },
    })

    resetAI()
    expect(() => useAI()).toThrow('AI not configured')
  })
})
