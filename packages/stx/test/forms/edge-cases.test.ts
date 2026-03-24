/**
 * Form edge case tests - redistributed from bugs/ directory.
 *
 * Covers: @input, @textarea, @checkbox, @radio, @select, @file, @form,
 * @error, @label, @validate, validation rules, CSRF, and form XSS prevention.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processBasicFormDirectives, processErrorDirective, processFormInputDirectives, processForms, processValidateDirective, defaultFormClasses, validateField } from '../../src/forms'
import { processDirectives } from '../../src/process'

const opts = defaultConfig as any as StxOptions
const fp = 'test.stx'
const formOpts: StxOptions = { debug: false }

async function render(template: string, context: Record<string, any> = {}) {
  return processDirectives(template, context, fp, opts, new Set<string>())
}

// =============================================================================
// 1. Form Directive Edge Cases (from deep-edge-cases.ts)
// =============================================================================

describe('Form Directive Edge Cases', () => {
  it('BUG: @input with type attribute via { type: email } syntax', () => {
    const template = `@input('email', '', { type: email })`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('type="email"')
    expect(result).toContain('name="email"')
  })

  it('@input generates input with name and value', () => {
    const template = `@input('age', '25')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('name="age"')
    expect(result).toContain('value="25"')
    expect(result).toContain('type="text"')
  })

  it('@input with default type is text', () => {
    const template = `@input('birthday', '2024-01-01')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('type="text"')
    expect(result).toContain('value="2024-01-01"')
  })

  it('@input with empty value', () => {
    const template = `@input('website', '')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('name="website"')
    expect(result).toContain('<input')
  })

  it('@input renders form-control class by default', () => {
    const template = `@input('phone', '+1234567890')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('class="form-control"')
  })

  it('@textarea with plain content', () => {
    const template = `@textarea('bio')Some bio text@endtextarea`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('<textarea')
    expect(result).toContain('name="bio"')
    expect(result).toContain('Some bio text')
  })

  it('@checkbox array pattern: multiple checkboxes with name="colors[]"', () => {
    const template = `
      @checkbox('colors[]', 'red')
      @checkbox('colors[]', 'blue')
      @checkbox('colors[]', 'green')
    `
    const result = processForms(template, { colors: ['red', 'green'] }, 'test.stx', formOpts)
    expect(result).toContain('name="colors[]"')
  })

  it('@radio with preselected from context', () => {
    const template = `
      @radio('size', 'small')
      @radio('size', 'medium')
      @radio('size', 'large')
    `
    const result = processForms(template, { size: 'medium' }, 'test.stx', formOpts)
    const radioLines = result.split('\n').filter(l => l.includes('radio'))
    const mediumLine = radioLines.find(l => l.includes('value="medium"'))
    expect(mediumLine).toContain('checked')
  })

  it('@form with PATCH method adds method spoofing', () => {
    const template = `@form('PATCH', '/update')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('method="POST"')
    expect(result).toContain('_method')
    expect(result).toContain('PATCH')
  })

  it('@error with field name', () => {
    const template = `@error('email')<span>{{ $message }}</span>@enderror`
    const result = processForms(template, {
      errors: { email: 'Email is required' },
    }, 'test.stx', formOpts)
    expect(result).toContain('Email is required')
  })

  it('multiple @error blocks for different fields', () => {
    const template = `
      @error('name')<span class="err">{{ $message }}</span>@enderror
      @error('email')<span class="err">{{ $message }}</span>@enderror
    `
    const result = processForms(template, {
      errors: {
        name: 'Name is required',
        email: 'Email is required',
      },
    }, 'test.stx', formOpts)
    expect(result).toContain('Name is required')
    expect(result).toContain('Email is required')
  })

  it('@input with disabled attribute', () => {
    const template = `@input('readonly_field', 'val', { disabled: true })`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('disabled')
  })

  it('@input with required attribute', () => {
    const template = `@input('required_field', '', { required: true })`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('required')
  })

  it('@form with no method specified defaults to POST', () => {
    const template = `@form()`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('method="POST"')
  })

  it('@file generates file input', () => {
    const template = `@file('documents')`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('type="file"')
    expect(result).toContain('name="documents"')
  })

  it('BUG: @file with accept attribute via {accept: ...} syntax', () => {
    const template = `@file('documents', { multiple: true })`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('type="file"')
    expect(result).toContain('multiple')
  })

  it('@select with content', () => {
    const template = `@select('country')
      <option value="us">US</option>
      <option value="uk">UK</option>
    @endselect`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('<select')
    expect(result).toContain('name="country"')
    expect(result).toContain('<option')
  })

  it('@select with preselected value from context', () => {
    const template = `@select('country')
      <option value="us">US</option>
      <option value="uk">UK</option>
    @endselect`
    const result = processForms(template, { country: 'uk' }, 'test.stx', formOpts)
    expect(result).toContain('selected')
  })

  it('@label directive', () => {
    const template = `@label('username')Username@endlabel`
    const result = processForms(template, {}, 'test.stx', formOpts)
    expect(result).toContain('<label')
    expect(result).toContain('for="username"')
    expect(result).toContain('Username')
  })
})

// =============================================================================
// 2. Validation Rule Edge Cases (from deep-edge-cases.ts)
// =============================================================================

describe('Validation Rule Edge Cases', () => {
  it('required rule with empty string', () => {
    const result = validateField('name', '', 'required')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('required rule with null', () => {
    const result = validateField('name', null, 'required')
    expect(result.valid).toBe(false)
  })

  it('required rule with undefined', () => {
    const result = validateField('name', undefined, 'required')
    expect(result.valid).toBe(false)
  })

  it('email rule with valid email', () => {
    const result = validateField('email', 'test@example.com', 'email')
    expect(result.valid).toBe(true)
  })

  it('email rule with invalid email', () => {
    const result = validateField('email', 'not-an-email', 'email')
    expect(result.valid).toBe(false)
  })

  it('min rule for string length', () => {
    const result = validateField('name', 'ab', 'min:3')
    expect(result.valid).toBe(false)
  })

  it('max rule for string length', () => {
    const result = validateField('name', 'a'.repeat(300), 'max:255')
    expect(result.valid).toBe(false)
  })

  it('in rule with valid value', () => {
    const result = validateField('color', 'red', 'in:red,green,blue')
    expect(result.valid).toBe(true)
  })

  it('in rule with invalid value', () => {
    const result = validateField('color', 'yellow', 'in:red,green,blue')
    expect(result.valid).toBe(false)
  })

  it('regex rule with matching pattern', () => {
    const result = validateField('code', 'abc', 'regex:^[a-z]+$')
    expect(result.valid).toBe(true)
  })

  it('regex rule with non-matching pattern', () => {
    const result = validateField('code', 'ABC123', 'regex:^[a-z]+$')
    expect(result.valid).toBe(false)
  })

  it('after date rule', () => {
    const result = validateField('date', '2025-06-01', 'after:2024-01-01')
    expect(result.valid).toBe(true)
  })

  it('after date rule fails for earlier date', () => {
    const result = validateField('date', '2023-06-01', 'after:2024-01-01')
    expect(result.valid).toBe(false)
  })

  it('url rule with valid URL', () => {
    const result = validateField('website', 'https://example.com', 'url')
    expect(result.valid).toBe(true)
  })

  it('url rule with invalid URL', () => {
    const result = validateField('website', 'not a url', 'url')
    expect(result.valid).toBe(false)
  })

  it('numeric rule with valid number', () => {
    const result = validateField('age', '25', 'numeric')
    expect(result.valid).toBe(true)
  })

  it('numeric rule with non-numeric value', () => {
    const result = validateField('age', 'abc', 'numeric')
    expect(result.valid).toBe(false)
  })

  it('multiple rules combined: required|email|max:255', () => {
    const result = validateField('email', '', 'required|email|max:255')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(1)
  })
})

// =============================================================================
// 3. @validate Directive Tests (from deep-edge-cases.ts)
// =============================================================================

describe('@validate Directive Tests', () => {
  it('@validate with required rule generates required attribute', () => {
    const template = `@validate('email', 'required')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('required')
  })

  it('@validate with email rule generates type=email', () => {
    const template = `@validate('email', 'email')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('type="email"')
  })

  it('@validate with url rule generates type=url', () => {
    const template = `@validate('website', 'url')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('type="url"')
  })

  it('@validate with numeric rule generates type=number', () => {
    const template = `@validate('age', 'numeric')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('type="number"')
  })

  it('@validate with min rule generates minlength', () => {
    const template = `@validate('password', 'min:8')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('minlength="8"')
  })

  it('@validate with max rule generates maxlength', () => {
    const template = `@validate('bio', 'max:500')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('maxlength="500"')
  })

  it('@validate with multiple rules', () => {
    const template = `@validate('email', 'required|email|max:255')`
    const result = processValidateDirective(template, {})
    expect(result).toContain('required')
    expect(result).toContain('type="email"')
    expect(result).toContain('maxlength="255"')
  })
})

// =============================================================================
// 4. @input old value with falsy values (from discovered-bugs.ts)
// =============================================================================

describe('@input old value with falsy values', () => {
  it('BUG: should preserve old value of 0 instead of falling back to explicit value', () => {
    const ctx = { old: { age: 0 }, errors: {} }
    const result = processFormInputDirectives("@input('age', '25')", ctx, defaultFormClasses)
    expect(result).toContain('value="0"')
  })

  it('BUG: should preserve old value of empty string instead of falling back', () => {
    const ctx = { old: { name: '' }, errors: {} }
    const result = processFormInputDirectives("@input('name', 'default')", ctx, defaultFormClasses)
    expect(result).toContain('value=""')
  })

  it('BUG: should preserve old value of false instead of falling back', () => {
    const ctx = { old: { active: false }, errors: {} }
    const result = processFormInputDirectives("@input('active', 'yes')", ctx, defaultFormClasses)
    expect(result).toContain('value="false"')
  })
})

// =============================================================================
// 5. @select type coercion (from discovered-bugs.ts)
// =============================================================================

describe('@select type coercion', () => {
  it('BUG: should select option when old value is number 1 and option value is string "1"', () => {
    const ctx = { old: { priority: 1 }, errors: {} }
    const template = '@select(\'priority\')<option value="1">High</option><option value="2">Low</option>@endselect'
    const result = processFormInputDirectives(template, ctx, defaultFormClasses)
    expect(result).toContain('selected')
  })

  it('BUG: should select option when old value is number 0', () => {
    const ctx = { old: { rating: 0 }, errors: {} }
    const template = '@select(\'rating\')<option value="0">None</option><option value="1">One</option>@endselect'
    const result = processFormInputDirectives(template, ctx, defaultFormClasses)
    expect(result).toContain('selected')
  })
})

// =============================================================================
// 6. @checkbox type coercion (from discovered-bugs.ts)
// =============================================================================

describe('@checkbox type coercion', () => {
  it('BUG: should check checkbox when old value is number 1 and checkbox value is string "1"', () => {
    const ctx = { old: { level: 1 }, errors: {} }
    const result = processFormInputDirectives("@checkbox('level', '1')", ctx, defaultFormClasses)
    expect(result).toContain('checked')
  })

  it('BUG: should check checkbox when old value is array of numbers [1,2] and value is string "1"', () => {
    const ctx = { old: { levels: [1, 2] }, errors: {} }
    const result = processFormInputDirectives("@checkbox('levels', '1')", ctx, defaultFormClasses)
    expect(result).toContain('checked')
  })
})

// =============================================================================
// 7. XSS prevention in forms (from discovered-bugs.ts)
// =============================================================================

describe('XSS prevention in forms', () => {
  it('should escape HTML in input values from old context', () => {
    const ctx = { old: { name: '"><script>alert(1)</script>' }, errors: {} }
    const result = processFormInputDirectives("@input('name')", ctx, defaultFormClasses)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should escape HTML in textarea content', () => {
    const ctx = { old: { bio: '<img onerror="alert(1)" src=x>' }, errors: {} }
    const result = processFormInputDirectives("@textarea('bio')default@endtextarea", ctx, defaultFormClasses)
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
  })
})

// =============================================================================
// 8. CSRF token format (from discovered-bugs.ts)
// =============================================================================

describe('CSRF token format', () => {
  it('should generate valid UUID format tokens', () => {
    const ctx: Record<string, any> = {}
    const result = processBasicFormDirectives('@csrf', ctx)
    const token = result.match(/value="([^"]+)"/)?.[1]
    expect(token).toBeDefined()
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('should reuse token across multiple @csrf in same context', () => {
    const ctx: Record<string, any> = {}
    const result = processBasicFormDirectives('@csrf @csrf', ctx)
    const tokens = [...result.matchAll(/value="([^"]+)"/g)].map(m => m[1])
    expect(tokens.length).toBe(2)
    expect(tokens[0]).toBe(tokens[1])
  })
})

// =============================================================================
// 9. Form validation edge cases (from edge-case-bugs.ts)
// =============================================================================

describe('Form validation edge cases', () => {
  it('should handle @input with type=number and value 0 (falsy)', () => {
    const ctx = { errors: {} }
    const result = processFormInputDirectives("@input('count', '0')", ctx, defaultFormClasses)
    expect(result).toContain('value="0"')
    expect(result).toContain('type="text"')
  })

  it('BUG: @input with type=hidden in attributes should output type=hidden', () => {
    const ctx = { errors: {} }
    const result = processFormInputDirectives("@input('token', 'abc123', { type: 'hidden' })", ctx, defaultFormClasses)
    expect(result).toContain('type="hidden"')
  })

  it('BUG: @input with placeholder in attributes should include placeholder', () => {
    const ctx = { errors: {} }
    const result = processFormInputDirectives("@input('email', '', { placeholder: 'user@example.com' })", ctx, defaultFormClasses)
    expect(result).toContain('placeholder')
  })

  it('should handle @textarea with very long content', () => {
    const longContent = 'x'.repeat(10000)
    const ctx = { errors: {} }
    const result = processFormInputDirectives(`@textarea('bio')${longContent}@endtextarea`, ctx, defaultFormClasses)
    expect(result).toContain('<textarea')
    expect(result).toContain('</textarea>')
  })

  it('should handle @select with many options (performance)', () => {
    const options = Array.from({ length: 100 }, (_, i) => `<option value="${i}">Option ${i}</option>`).join('\n')
    const ctx = { old: { category: '50' }, errors: {} }
    const template = `@select('category')${options}@endselect`
    const result = processFormInputDirectives(template, ctx, defaultFormClasses)
    expect(result).toContain('<select')
    expect(result).toContain('Option 50')
    expect(result).toContain('selected')
  })

  it('should handle @checkbox with value containing special HTML chars', () => {
    const ctx = { errors: {} }
    const result = processFormInputDirectives("@checkbox('agree', '<script>alert(1)</script>')", ctx, defaultFormClasses)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should handle @radio group with no old value (nothing checked)', () => {
    const ctx = { errors: {} }
    const r1 = processFormInputDirectives("@radio('color', 'red')", ctx, defaultFormClasses)
    const r2 = processFormInputDirectives("@radio('color', 'blue')", ctx, defaultFormClasses)
    expect(r1).not.toContain('checked')
    expect(r2).not.toContain('checked')
  })

  it('should handle @error for field with empty error array', () => {
    const ctx = { errors: { email: [] } }
    const result = processErrorDirective("@error('email')<span>{{ $message }}</span>@enderror", ctx)
    expect(result).toBeDefined()
  })

  it('should handle @error for field with non-array error (string)', () => {
    const ctx = { errors: { email: 'Invalid email' } }
    const result = processErrorDirective("@error('email')<span>{{ $message }}</span>@enderror", ctx)
    expect(result).toContain('Invalid email')
  })

  it('should handle @form with method POST', () => {
    const ctx = {}
    const result = processFormInputDirectives("@form('POST', '/submit')", ctx, defaultFormClasses)
    expect(result).toContain('<form')
    expect(result).toContain('method="POST"')
    expect(result).toContain('action="/submit"')
  })

  it('BUG: @form with file upload enctype should include enctype attribute', () => {
    const ctx = {}
    const result = processFormInputDirectives("@form('POST', '/upload', { enctype: 'multipart/form-data' })", ctx, defaultFormClasses)
    expect(result).toContain('enctype="multipart/form-data"')
  })

  it('should handle @label with HTML content', () => {
    const ctx = { errors: {} }
    const result = processFormInputDirectives("@label('name')<strong>Name</strong> <em>(required)</em>@endlabel", ctx, defaultFormClasses)
    expect(result).toContain('<label')
    expect(result).toContain('<strong>Name</strong>')
    expect(result).toContain('for="name"')
  })

  it('should handle double @csrf in same form (same token)', () => {
    const ctx: Record<string, any> = {}
    const result = processBasicFormDirectives('@csrf @csrf', ctx)
    const tokens = [...result.matchAll(/value="([^"]+)"/g)].map(m => m[1])
    expect(tokens.length).toBe(2)
    expect(tokens[0]).toBe(tokens[1])
  })

  it('should handle @input with error state (adds error class)', () => {
    const ctx = { errors: { email: 'Required' } }
    const result = processFormInputDirectives("@input('email')", ctx, defaultFormClasses)
    expect(result).toContain(defaultFormClasses.inputError)
  })

  it('should handle @endform correctly', () => {
    const ctx = {}
    const result = processFormInputDirectives('@endform', ctx, defaultFormClasses)
    expect(result).toBe('</form>')
  })
})

// =============================================================================
// 10. Form Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('Form Regression Tests', () => {
  it('should render a registration form with all fields', () => {
    const template = `@form('POST', '/register')
  @input('name', '', { placeholder: 'Full Name' })
  @input('email', '', { type: 'email', placeholder: 'Email' })
  @input('password', '', { type: 'password', placeholder: 'Password' })
  @input('password_confirmation', '', { type: 'password', placeholder: 'Confirm Password' })
  <button type="submit">Register</button>
@endform`
    const context: Record<string, any> = {}
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('<form method="POST" action="/register">')
    expect(result).toContain('name="name"')
    expect(result).toContain('name="email"')
    expect(result).toContain('name="password"')
    expect(result).toContain('name="password_confirmation"')
    expect(result).toContain('name="_token"')
    expect(result).toContain('</form>')
  })

  it('should render an edit profile form with old values populated', () => {
    const context = {
      old: { name: 'Jane Smith', email: 'jane@example.com', bio: 'Developer' },
      errors: {},
    }
    const result = processFormInputDirectives(
      `@input('name', 'placeholder')
@input('email', 'placeholder', { type: 'email' })`,
      context,
      defaultFormClasses,
    )
    expect(result).toContain('value="Jane Smith"')
    expect(result).toContain('value="jane@example.com"')
  })

  it('should render a form with DELETE method spoofing', () => {
    const template = `@form('DELETE', '/items/42')
  <button type="submit">Delete Item</button>
@endform`
    const context: Record<string, any> = {}
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('method="POST"')
    expect(result).toContain('name="_method" value="DELETE"')
    expect(result).toContain('name="_token"')
  })

  it('should render address form with select', () => {
    const template = `<form>
@input('street', '', { placeholder: 'Street Address' })
@input('city', '', { placeholder: 'City' })
@select('state')
  <option value="">Select State</option>
  <option value="CA">California</option>
  <option value="NY">New York</option>
  <option value="TX">Texas</option>
@endselect
</form>`
    const context: Record<string, any> = { old: { state: 'NY' }, errors: {} }
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('name="street"')
    expect(result).toContain('name="city"')
    expect(result).toContain('name="state"')
    expect(result).toContain('selected')
  })

  it('should render a file upload form', () => {
    const template = `@form('POST', '/upload', { enctype: 'multipart/form-data' })
  @file('avatar')
  @file('documents', { multiple: true })
  <button type="submit">Upload</button>
@endform`
    const context: Record<string, any> = {}
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('type="file"')
    expect(result).toContain('name="avatar"')
    expect(result).toContain('name="documents"')
    expect(result).toContain('multiple')
  })

  it('should render a search form with GET method', () => {
    const result = processBasicFormDirectives(
      `<form method="GET" action="/search">@csrf<input name="q"></form>`,
      {},
    )
    expect(result).toContain('name="_token"')
  })

  it('should render checkboxes from array', () => {
    const context: Record<string, any> = {
      old: { 'colors[]': ['red', 'blue'] },
      errors: {},
    }
    const result = processFormInputDirectives(
      `@checkbox('colors[]', 'red')
@checkbox('colors[]', 'green')
@checkbox('colors[]', 'blue')`,
      context,
      defaultFormClasses,
    )
    expect(result).toContain('value="red"')
    expect(result).toContain('value="green"')
    expect(result).toContain('value="blue"')
  })

  it('should render radio buttons for payment method', () => {
    const result = processFormInputDirectives(
      `@radio('payment', 'credit')
@radio('payment', 'paypal')
@radio('payment', 'bank')`,
      { old: { payment: 'paypal' }, errors: {} },
      defaultFormClasses,
    )
    expect(result).toContain('value="credit"')
    expect(result).toContain('value="paypal"')
    expect(result).toContain('value="bank"')
    expect(result).toMatch(/value="paypal"[^>]*checked/)
  })

  it('should render form with conditional fields based on context', async () => {
    const template = `<form>
  <input name="name">
  @if(showCompany)
    <input name="company" placeholder="Company Name">
  @endif
  <button type="submit">Submit</button>
</form>`
    const context1 = { showCompany: true }
    const result1 = await render(template, context1)
    expect(result1).toContain('name="company"')

    const context2 = { showCompany: false }
    const result2 = await render(template, context2)
    expect(result2).not.toContain('name="company"')
  })

  it('should render form inputs with various types via processFormInputDirectives', () => {
    const textResult = processFormInputDirectives(
      `@input('username')`,
      { errors: {} },
      defaultFormClasses,
    )
    expect(textResult).toContain('type="text"')
    expect(textResult).toContain('name="username"')

    const multiResult = processFormInputDirectives(
      `@input('first_name')
@input('last_name')
@input('age')`,
      { errors: {} },
      defaultFormClasses,
    )
    expect(multiResult).toContain('name="first_name"')
    expect(multiResult).toContain('name="last_name"')
    expect(multiResult).toContain('name="age"')
  })

  it('should render form inside an @if block', async () => {
    const template = `@if(canSubmit)
  <form method="POST" action="/submit">
    @csrf
    <input name="data">
    <button>Go</button>
  </form>
@endif`
    const result = await render(template, { canSubmit: true })
    expect(result).toContain('<form')
    expect(result).toContain('name="data"')
    expect(result).toContain('</form>')
  })

  it('should render error display for multiple fields', () => {
    const template = `@error('username')
  <span class="err">{{ $message }}</span>
@enderror
@error('password')
  <span class="err">{{ $message }}</span>
@enderror
@error('email')
  <span class="err">{{ $message }}</span>
@enderror`
    const context = {
      errors: {
        username: 'Username is taken',
        password: 'Too short',
      },
    }
    const result = processErrorDirective(template, context, defaultFormClasses)
    expect(result).toContain('Username is taken')
    expect(result).toContain('Too short')
    expect(result).not.toContain('email')
  })

  it('should render input with is-invalid class when field has error', () => {
    const context = {
      errors: { name: 'Required field' },
      old: { name: 'test' },
    }
    const result = processFormInputDirectives(
      `@input('name')`,
      context,
      defaultFormClasses,
    )
    expect(result).toContain('is-invalid')
    expect(result).toContain('form-control')
  })

  it('should render a newsletter subscription form', () => {
    const template = `@form('POST', '/subscribe')
  @input('email', '', { type: 'email', placeholder: 'Enter your email' })
  <button type="submit">Subscribe</button>
@endform`
    const context: Record<string, any> = {}
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('action="/subscribe"')
    expect(result).toContain('type="email"')
    expect(result).toContain('name="email"')
    expect(result).toContain('Subscribe')
  })

  it('should render a textarea for comments', () => {
    const context = { old: { comment: 'My previous comment' }, errors: {} }
    const result = processFormInputDirectives(
      `@textarea('comment')Default text@endtextarea`,
      context,
      defaultFormClasses,
    )
    expect(result).toContain('<textarea')
    expect(result).toContain('name="comment"')
    expect(result).toContain('My previous comment')
  })
})
