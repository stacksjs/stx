import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearComponents,
  clearSuspenseState,
  createStreamingRenderer,
  createSuspenseBoundary,
  getSuspenseState,
  registerClientComponent,
  registerServerComponent,
} from '../../src/server-components'

describe('createSuspenseBoundary', () => {
  afterEach(() => {
    clearSuspenseState()
  })

  it('should create a suspense boundary', () => {
    const boundary = createSuspenseBoundary('test-1', 'Loading...')
    expect(boundary.wrap).toBeDefined()
    expect(boundary.getFallback).toBeDefined()
  })

  it('should return fallback text', () => {
    const boundary = createSuspenseBoundary('test-2', 'Please wait...')
    expect(boundary.getFallback()).toBe('Please wait...')
  })

  it('should wrap and resolve promises', async () => {
    const boundary = createSuspenseBoundary('test-3', 'Loading...')
    const result = await boundary.wrap(Promise.resolve('<div>Loaded</div>'))
    expect(result).toBe('<div>Loaded</div>')
  })

  it('should update state on resolution', async () => {
    const boundary = createSuspenseBoundary('test-4', 'Loading...')
    await boundary.wrap(Promise.resolve('<p>Done</p>'))

    const state = getSuspenseState('test-4')
    expect(state?.status).toBe('resolved')
    expect(state?.result).toBe('<p>Done</p>')
  })

  it('should update state on error', async () => {
    const boundary = createSuspenseBoundary('test-5', 'Loading...')

    try {
      await boundary.wrap(Promise.reject(new Error('Failed')))
    }
    catch {
      // Expected
    }

    const state = getSuspenseState('test-5')
    expect(state?.status).toBe('error')
    expect(state?.error?.message).toBe('Failed')
  })

  it('should rethrow errors', async () => {
    const boundary = createSuspenseBoundary('test-6', 'Loading...')

    await expect(boundary.wrap(Promise.reject(new Error('Oops')))).rejects.toThrow('Oops')
  })
})

describe('getSuspenseState', () => {
  afterEach(() => {
    clearSuspenseState()
  })

  it('should return undefined for non-existent state', () => {
    expect(getSuspenseState('not-exists')).toBeUndefined()
  })

  it('should return state after boundary creation', () => {
    createSuspenseBoundary('exists', 'Loading...')
    const state = getSuspenseState('exists')
    expect(state).toBeDefined()
    expect(state?.status).toBe('pending')
  })
})

describe('clearSuspenseState', () => {
  it('should clear all suspense states', () => {
    createSuspenseBoundary('a', 'Loading...')
    createSuspenseBoundary('b', 'Loading...')

    expect(getSuspenseState('a')).toBeDefined()
    expect(getSuspenseState('b')).toBeDefined()

    clearSuspenseState()

    expect(getSuspenseState('a')).toBeUndefined()
    expect(getSuspenseState('b')).toBeUndefined()
  })

  it('should clear specific suspense state', () => {
    createSuspenseBoundary('keep', 'Loading...')
    createSuspenseBoundary('remove', 'Loading...')

    clearSuspenseState('remove')

    expect(getSuspenseState('keep')).toBeDefined()
    expect(getSuspenseState('remove')).toBeUndefined()
  })
})

describe('createStreamingRenderer', () => {
  afterEach(() => {
    clearComponents()
  })

  it('should create a streaming renderer', () => {
    const renderer = createStreamingRenderer(['comp1'])
    expect(renderer.renderToStream).toBeDefined()
    expect(renderer.renderToString).toBeDefined()
  })

  it('should render to string', async () => {
    registerServerComponent({
      name: 'header',
      template: '<header>Header</header>',
    })
    registerServerComponent({
      name: 'footer',
      template: '<footer>Footer</footer>',
    })

    const renderer = createStreamingRenderer(['header', 'footer'])
    const html = await renderer.renderToString()

    expect(html).toContain('<header>Header</header>')
    expect(html).toContain('<footer>Footer</footer>')
  })

  it('should render multiple components in order', async () => {
    registerServerComponent({
      name: 'first',
      template: '<div>First</div>',
    })
    registerServerComponent({
      name: 'second',
      template: '<div>Second</div>',
    })

    const renderer = createStreamingRenderer(['first', 'second'])
    const html = await renderer.renderToString()

    const firstIndex = html.indexOf('First')
    const secondIndex = html.indexOf('Second')
    expect(firstIndex).toBeLessThan(secondIndex)
  })

  it('should include hydration scripts for client components', async () => {
    registerClientComponent({
      name: 'interactive',
      template: '<button>Click</button>',
      clientScript: 'console.log("hydrated")',
    })

    const renderer = createStreamingRenderer(['interactive'])
    const html = await renderer.renderToString()

    expect(html).toContain('data-client-component="interactive"')
    expect(html).toContain('console.log("hydrated")')
  })

  it('should handle errors gracefully in stream', async () => {
    registerServerComponent({
      name: 'good',
      template: '<div>Good</div>',
    })
    // 'bad' component not registered

    const renderer = createStreamingRenderer(['good', 'bad'])
    const html = await renderer.renderToString()

    expect(html).toContain('Good')
    expect(html).toContain('<!-- Error rendering bad:')
  })

  it('should create a readable stream', async () => {
    registerServerComponent({
      name: 'stream-test',
      template: '<p>Streamed</p>',
    })

    const renderer = createStreamingRenderer(['stream-test'])
    const stream = renderer.renderToStream()

    expect(stream).toBeInstanceOf(ReadableStream)

    const reader = stream.getReader()
    const chunks: string[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break
      chunks.push(value)
    }

    expect(chunks.join('')).toContain('Streamed')
  })

  it('should pass props to all components', async () => {
    registerServerComponent({
      name: 'with-prop',
      template: '<span>{{name}}</span>',
    })

    const renderer = createStreamingRenderer(['with-prop'], {
      props: { name: 'Test' },
    })
    const html = await renderer.renderToString()

    expect(html).toContain('Test')
  })
})
