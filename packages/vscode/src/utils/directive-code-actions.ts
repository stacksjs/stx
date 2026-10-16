export type DirectiveDiagnosticAction =
  | { kind: 'add-closing', directive: string }
  | { kind: 'replace-closing', directive: string }
  | { kind: 'remove-closing', directive: string }

export function directiveDiagnosticAction(message: string): DirectiveDiagnosticAction | undefined {
  const unclosed = message.match(/^Unclosed @\w+ directive\. Expected @(\w+)$/)
  if (unclosed)
    return { kind: 'add-closing', directive: unclosed[1] }

  const mismatched = message.match(/^Mismatched directive\. Expected @(\w+) but found @\w+$/)
  if (mismatched)
    return { kind: 'replace-closing', directive: mismatched[1] }

  const unexpected = message.match(/^Unexpected @(\w+)\. No matching opening directive found$/)
  if (unexpected)
    return { kind: 'remove-closing', directive: unexpected[1] }

  return undefined
}
