import { describe, expect, test } from 'bun:test'
import { directiveDiagnosticAction } from '../src/utils/directive-code-actions'

describe('directive diagnostic actions', () => {
  test('parses the structural diagnostics emitted by the extension', () => {
    expect(directiveDiagnosticAction('Unclosed @errorBoundary directive. Expected @enderrorBoundary'))
      .toEqual({ kind: 'add-closing', directive: 'enderrorBoundary' })
    expect(directiveDiagnosticAction('Mismatched directive. Expected @endforeach but found @endif'))
      .toEqual({ kind: 'replace-closing', directive: 'endforeach' })
    expect(directiveDiagnosticAction('Unexpected @endstream. No matching opening directive found'))
      .toEqual({ kind: 'remove-closing', directive: 'endstream' })
  })

  test('ignores unrelated diagnostics', () => {
    expect(directiveDiagnosticAction("Template file 'missing' not found in any template directory")).toBeUndefined()
  })
})
