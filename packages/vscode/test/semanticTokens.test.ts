import { describe, expect, test } from 'bun:test'
import { semanticTokenSpans } from '../src/providers/semanticTokenSpans'

// Every `{{ expression }}` and `@directive(...)` line used to loop forever: the
// two regexes driving those loops had no `g` flag, so `exec` returned the same
// match each time, and a keyword skipped with `continue` never advanced. In
// VS Code the provider pushed tokens until the extension host ran out of
// memory ("RangeError: Invalid array length") on any ordinary template.

describe('VSCODE: semantic tokens', () => {
  test('finds every variable in every expression on a line', () => {
    const spans = semanticTokenSpans('<h1>{{ title }} and {{ user.name }}</h1>')
    expect(spans.filter(span => span.type === 'variable')).toEqual([
      { start: 7, end: 12, type: 'variable' },
      { start: 23, end: 27, type: 'variable' },
      { start: 28, end: 32, type: 'variable' },
    ])
  })

  test('skips keywords inside an expression and carries on', () => {
    expect(semanticTokenSpans('{{ true ? label : null }}')).toEqual([{ start: 10, end: 15, type: 'variable' }])
  })

  test('finds the strings in a directive\'s arguments, on every directive', () => {
    const spans = semanticTokenSpans('@include(\'partials/header\', \'x\') @include(\'y\')')
    expect(spans.filter(span => span.type === 'string').map(span => span.start)).toEqual([9, 28, 42])
    expect(spans.filter(span => span.type === 'function')).toHaveLength(2)
  })
})
