/**
 * Form controls expose their error to assistive tech (stacksjs/stx#1861).
 *
 * `@label` already emits `for="<id>"` and every control now emits a matching
 * `id`, but an invalid field carried only a CSS class: no `aria-invalid`, and no
 * `aria-describedby` pointing at the `@error` message — so a screen reader user
 * was never told the field was invalid or why. stx's own a11y checker flagged
 * the markup its own directives produced.
 *
 * The control now sets `aria-invalid` + `aria-describedby="<id>-error"` when the
 * field has an error, and `@error('field')` emits a `role="alert"` block with
 * the matching `id`, so the association resolves exactly when an error exists.
 */
import { describe, expect, it } from 'bun:test'
import { processErrorDirective, processFormInputDirectives } from '../../src/forms'

const invalid = { errors: { email: ['Email is required'] } }

describe('control error attributes (#1861)', () => {
  it('marks an invalid @input aria-invalid and points it at the error block', () => {
    const out = processFormInputDirectives(`@input('email', '', { type: 'email' })`, invalid)
    expect(out).toContain('id="email"')
    expect(out).toContain('aria-invalid="true"')
    expect(out).toContain('aria-describedby="email-error"')
  })

  it('marks @textarea and @select the same way', () => {
    const ta = processFormInputDirectives(`@textarea('email')@endtextarea`, invalid)
    expect(ta).toContain('aria-invalid="true"')
    expect(ta).toContain('aria-describedby="email-error"')

    const sel = processFormInputDirectives(`@select('email')<option value="us">US</option>@endselect`, invalid)
    expect(sel).toContain('aria-invalid="true"')
    expect(sel).toContain('aria-describedby="email-error"')
  })

  it('adds nothing to a valid field (no dangling describedby)', () => {
    const out = processFormInputDirectives(`@input('username')`, invalid)
    expect(out).not.toContain('aria-invalid')
    expect(out).not.toContain('aria-describedby')
  })
})

describe('@error block target (#1861)', () => {
  it('carries the matching id and announces via role=alert', () => {
    const out = processErrorDirective(`@error('email')<span>{{ $message }}</span>@enderror`, invalid)
    expect(out).toContain('id="email-error"')
    expect(out).toContain('role="alert"')
    expect(out).toContain('Email is required')
  })

  it('renders nothing when the field is valid', () => {
    const out = processErrorDirective(`@error('email')<span>{{ $message }}</span>@enderror`, { errors: {} })
    expect(out.trim()).toBe('')
  })
})

describe('the association actually resolves (#1861)', () => {
  it('the control aria-describedby matches the @error block id', () => {
    const control = processFormInputDirectives(`@input('email')`, invalid)
    const block = processErrorDirective(`@error('email')<span>{{ $message }}</span>@enderror`, invalid)
    const target = control.match(/aria-describedby="([^"]+)"/)?.[1]
    expect(target).toBe('email-error')
    expect(block).toContain(`id="${target}"`)
  })
})
