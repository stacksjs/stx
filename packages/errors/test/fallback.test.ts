import { describe, expect, test } from 'bun:test'
import { generate404Page, generate500Page, generateMaintenancePage } from '../src/fallback'

describe('generate404Page', () => {
  test('returns valid HTML', () => {
    const html = generate404Page()

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })

  test('contains default title and message', () => {
    const html = generate404Page()

    expect(html).toContain('Page Not Found')
    expect(html).toContain('does not exist or has been moved')
  })

  test('contains 404 status code', () => {
    const html = generate404Page()

    expect(html).toContain('404')
  })

  test('accepts custom title and message', () => {
    const html = generate404Page({
      title: 'Missing Resource',
      message: 'We could not find that.',
    })

    expect(html).toContain('Missing Resource')
    expect(html).toContain('We could not find that.')
  })
})

describe('generate500Page', () => {
  test('returns valid HTML', () => {
    const html = generate500Page()

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  test('contains default title and message', () => {
    const html = generate500Page()

    expect(html).toContain('Internal Server Error')
    expect(html).toContain('Something went wrong')
  })

  test('contains 500 status code', () => {
    const html = generate500Page()

    expect(html).toContain('500')
  })

  test('accepts custom title and message', () => {
    const html = generate500Page({
      title: 'Server Error',
      message: 'An unexpected error occurred.',
    })

    expect(html).toContain('Server Error')
    expect(html).toContain('An unexpected error occurred.')
  })

  test('shows error details when showError is true', () => {
    const error = new Error('Database connection failed')
    const html = generate500Page({
      showError: true,
      error,
    })

    expect(html).toContain('Database connection failed')
  })

  test('does not show error details by default', () => {
    const html = generate500Page()

    expect(html).not.toContain('<pre')
  })
})

describe('generateMaintenancePage', () => {
  test('returns valid HTML', () => {
    const html = generateMaintenancePage()

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  test('contains default title and message', () => {
    const html = generateMaintenancePage()

    expect(html).toContain('Under Maintenance')
    expect(html).toContain('scheduled maintenance')
  })

  test('accepts custom title and message', () => {
    const html = generateMaintenancePage({
      title: 'Be Right Back',
      message: 'Upgrading systems.',
    })

    expect(html).toContain('Be Right Back')
    expect(html).toContain('Upgrading systems.')
  })

  test('shows retry time when retryAfter provided', () => {
    const html = generateMaintenancePage({ retryAfter: 300 })

    expect(html).toContain('5 minutes')
  })

  test('shows singular minute for short durations', () => {
    const html = generateMaintenancePage({ retryAfter: 30 })

    expect(html).toContain('1 minute')
    expect(html).not.toContain('1 minutes')
  })

  test('does not show retry time when not provided', () => {
    const html = generateMaintenancePage()

    expect(html).not.toContain('Estimated time')
  })
})
