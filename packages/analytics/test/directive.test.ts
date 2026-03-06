import { describe, expect, test } from 'bun:test'
import { processAnalyticsDirective, generateTrackingScript } from '../src/directive'

describe('processAnalyticsDirective', () => {
  test('replaces @analytics with a script tag', () => {
    const input = '<head>@analytics</head>'
    const result = processAnalyticsDirective(input)

    expect(result).toContain('<script>')
    expect(result).toContain('</script>')
    expect(result).not.toContain('@analytics')
  })

  test('replaces multiple @analytics occurrences', () => {
    const input = '@analytics\n<div></div>\n@analytics'
    const result = processAnalyticsDirective(input)

    const scriptCount = (result.match(/<script>/g) || []).length
    expect(scriptCount).toBe(2)
  })

  test('does not replace @analyticsExtra (word boundary)', () => {
    const input = '@analyticsExtra'
    const result = processAnalyticsDirective(input)
    expect(result).toBe('@analyticsExtra')
  })

  test('leaves content without @analytics unchanged', () => {
    const input = '<div>Hello World</div>'
    const result = processAnalyticsDirective(input)
    expect(result).toBe(input)
  })
})

describe('generateTrackingScript', () => {
  test('returns a script tag', () => {
    const script = generateTrackingScript()
    expect(script).toStartWith('<script>')
    expect(script).toEndWith('</script>')
  })

  test('uses default endpoint', () => {
    const script = generateTrackingScript()
    expect(script).toContain('/_stx/analytics/pageview')
  })

  test('uses custom endpoint', () => {
    const script = generateTrackingScript({ endpoint: '/custom/track' })
    expect(script).toContain('/custom/track')
  })

  test('includes fetch call with POST method', () => {
    const script = generateTrackingScript()
    expect(script).toContain('fetch(endpoint')
    expect(script).toContain("method: 'POST'")
  })

  test('sends path and referrer in body', () => {
    const script = generateTrackingScript()
    expect(script).toContain('location.pathname')
    expect(script).toContain('document.referrer')
  })

  test('includes session management', () => {
    const script = generateTrackingScript()
    expect(script).toContain('sessionStorage')
    expect(script).toContain('_stx_sid')
  })

  test('uses custom sessionTimeout', () => {
    const script = generateTrackingScript({ sessionTimeout: 60000 })
    expect(script).toContain('60000')
  })
})
