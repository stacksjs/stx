import { describe, expect, test } from 'bun:test'
import { ErrorBoundary, defineErrorBoundary } from '../src/boundary'

describe('ErrorBoundary', () => {
  test('catch calls handler with error and info', () => {
    let capturedError: Error | null = null
    let capturedInfo: any = null

    const boundary = new ErrorBoundary({
      catch: (error, info) => {
        capturedError = error
        capturedInfo = info
        return `Error: ${error.message}`
      },
    })

    const error = new Error('test error')
    const result = boundary.catch(error, { filePath: '/test.stx', line: 5 })

    expect(result).toBe('Error: test error')
    expect(capturedError).toBe(error)
    expect(capturedInfo.filePath).toBe('/test.stx')
    expect(capturedInfo.line).toBe(5)
    expect(capturedInfo.timestamp).toBeInstanceOf(Date)
  })

  test('catch calls onError side effect', () => {
    let sideEffectCalled = false

    const boundary = new ErrorBoundary({
      catch: () => 'handled',
      onError: () => {
        sideEffectCalled = true
      },
    })

    boundary.catch(new Error('test'))
    expect(sideEffectCalled).toBe(true)
  })

  test('catch provides timestamp in info', () => {
    let capturedInfo: any = null

    const boundary = new ErrorBoundary({
      catch: (_error, info) => {
        capturedInfo = info
        return 'ok'
      },
    })

    boundary.catch(new Error('test'))
    expect(capturedInfo.timestamp).toBeInstanceOf(Date)
  })

  test('wrap returns value on success', () => {
    const boundary = new ErrorBoundary({
      catch: () => 'fallback',
    })

    const result = boundary.wrap(() => 42)
    expect(result).toBe(42)
  })

  test('wrap catches errors and returns handler result', () => {
    const boundary = new ErrorBoundary({
      catch: (error) => `Caught: ${error.message}`,
    })

    const result = boundary.wrap(() => {
      throw new Error('oops')
    })

    expect(result).toBe('Caught: oops')
  })

  test('wrap converts non-Error throws to Error', () => {
    let capturedError: Error | null = null

    const boundary = new ErrorBoundary({
      catch: (error) => {
        capturedError = error
        return 'handled'
      },
    })

    boundary.wrap(() => {
      throw 'string error' // eslint-disable-line no-throw-literal
    })

    expect(capturedError).toBeInstanceOf(Error)
    expect(capturedError!.message).toBe('string error')
  })

  test('wrap uses fallback when catch returns Response', () => {
    const boundary = new ErrorBoundary({
      catch: () => new Response('redirect', { status: 302 }),
      fallback: '<p>Fallback content</p>',
    })

    const result = boundary.wrap(() => {
      throw new Error('test')
    })

    expect(result).toBe('<p>Fallback content</p>')
  })

  test('wrap returns empty string when catch returns Response and no fallback', () => {
    const boundary = new ErrorBoundary({
      catch: () => new Response('', { status: 500 }),
    })

    const result = boundary.wrap(() => {
      throw new Error('test')
    })

    expect(result).toBe('')
  })

  test('wrapAsync returns value on success', async () => {
    const boundary = new ErrorBoundary({
      catch: () => 'fallback',
    })

    const result = await boundary.wrapAsync(async () => 42)
    expect(result).toBe(42)
  })

  test('wrapAsync catches errors and returns handler result', async () => {
    const boundary = new ErrorBoundary({
      catch: (error) => `Caught: ${error.message}`,
    })

    const result = await boundary.wrapAsync(async () => {
      throw new Error('async oops')
    })

    expect(result).toBe('Caught: async oops')
  })

  test('wrapAsync uses fallback when catch returns Response', async () => {
    const boundary = new ErrorBoundary({
      catch: () => new Response('', { status: 500 }),
      fallback: '<p>Async fallback</p>',
    })

    const result = await boundary.wrapAsync(async () => {
      throw new Error('test')
    })

    expect(result).toBe('<p>Async fallback</p>')
  })
})

describe('defineErrorBoundary', () => {
  test('returns an ErrorBoundary instance', () => {
    const boundary = defineErrorBoundary({
      catch: () => 'handled',
    })

    expect(boundary).toBeInstanceOf(ErrorBoundary)
  })

  test('returned boundary works correctly', () => {
    const boundary = defineErrorBoundary({
      catch: (error) => `Error: ${error.message}`,
    })

    const result = boundary.wrap(() => {
      throw new Error('test')
    })

    expect(result).toBe('Error: test')
  })
})
