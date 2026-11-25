import { describe, expect, test } from 'bun:test'
import { clientBlockFailureMessage } from '../src/client-script'

describe('the client block failure message', () => {
  test('names a file inside the project by its project path, not the machine path', () => {
    const message = clientBlockFailureMessage('/Users/someone/app/resources/components/Session.stx', '/Users/someone/app')
    expect(message).toContain('(resources/components/Session.stx)')
    expect(message).not.toContain('/Users/someone')
  })

  test('a file outside the project shows only its name', () => {
    const message = clientBlockFailureMessage('/opt/elsewhere/lib/Widget.stx', '/Users/someone/app')
    expect(message).toContain('(Widget.stx)')
    expect(message).not.toContain('/opt/elsewhere')
  })

  test('a relative path is kept, and no path means no parentheses', () => {
    expect(clientBlockFailureMessage('views/home.stx', '/x')).toContain('(views/home.stx)')
    expect(clientBlockFailureMessage(undefined, '/x')).toBe(JSON.stringify('[stx] client block failed; this block will not hydrate'))
  })
})
