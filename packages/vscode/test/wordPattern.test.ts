import { describe, expect, test } from 'bun:test'

describe('Word Pattern Tests', () => {
  // The word pattern from stx.configuration.json
  const wordPattern = /(@[a-z_]\w*)|([a-z_]\w*)/gi

  test('should match directives with @ prefix', () => {
    const text = '@if @foreach @endif @component'
    const matches = text.match(wordPattern)

    expect(matches).toContain('@if')
    expect(matches).toContain('@foreach')
    expect(matches).toContain('@endif')
    expect(matches).toContain('@component')
  })

  test('should match regular words without @ prefix', () => {
    const text = 'user name isAdmin value'
    const matches = text.match(wordPattern)

    expect(matches).toContain('user')
    expect(matches).toContain('name')
    expect(matches).toContain('isAdmin')
    expect(matches).toContain('value')
  })

  test('should match both directives and regular words in mixed content', () => {
    const text = '@if (user.isAdmin)'
    const matches = text.match(wordPattern)

    expect(matches).toContain('@if')
    expect(matches).toContain('user')
    expect(matches).toContain('isAdmin')
  })

  test('should match directive with parentheses', () => {
    const text = '@foreach (items as item)'
    const matches = text.match(wordPattern)

    expect(matches).toContain('@foreach')
    expect(matches).toContain('items')
    expect(matches).toContain('as')
    expect(matches).toContain('item')
  })

  test('should not match @ alone', () => {
    const text = '@ symbol alone'
    const matches = text.match(wordPattern)

    // Should match "symbol" and "alone" but not "@"
    expect(matches).toContain('symbol')
    expect(matches).toContain('alone')
    expect(matches).not.toContain('@')
  })

  test('should match camelCase identifiers', () => {
    const text = '@endForeach @endIf camelCase'
    const matches = text.match(wordPattern)

    expect(matches).toContain('@endForeach')
    expect(matches).toContain('@endIf')
    expect(matches).toContain('camelCase')
  })

  test('should match snake_case identifiers', () => {
    const text = 'user_name is_admin'
    const matches = text.match(wordPattern)

    expect(matches).toContain('user_name')
    expect(matches).toContain('is_admin')
  })

  test('should handle directives in HTML context', () => {
    const text = '<div>@if</div>'
    const matches = text.match(wordPattern)

    expect(matches).toContain('@if')
    expect(matches).toContain('div')
  })
})
