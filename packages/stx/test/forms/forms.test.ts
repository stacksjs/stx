import { describe, expect, it } from 'bun:test'
import { processForms, processBasicFormDirectives, processFormInputDirectives, defaultFormClasses } from '../../src/forms'
import type { StxOptions } from '../../src/types'
import { defaultConfig } from '../../src/config'

const defaultOptions = defaultConfig as StxOptions

// =============================================================================
// @csrf Directive
// =============================================================================

describe('@csrf', () => {
  it('generates a hidden input with _token name', () => {
    const result = processBasicFormDirectives('@csrf', {})
    expect(result).toContain('type="hidden"')
    expect(result).toContain('name="_token"')
  })

  it('generates a token in UUID format', () => {
    const context: Record<string, any> = {}
    processBasicFormDirectives('@csrf', context)
    const token = context.csrf.token
    // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('generates a unique token each call with fresh context', () => {
    const context1: Record<string, any> = {}
    const context2: Record<string, any> = {}
    processBasicFormDirectives('@csrf', context1)
    processBasicFormDirectives('@csrf', context2)
    expect(context1.csrf.token).not.toBe(context2.csrf.token)
  })

  it('uses token from context if provided', () => {
    const context = { csrf: { token: 'my-token' } }
    const result = processBasicFormDirectives('@csrf', context)
    expect(result).toContain('value="my-token"')
  })

  it('uses field from context if provided', () => {
    const context = { csrf: { field: '<input type="hidden" name="custom_token" value="abc123">' } }
    const result = processBasicFormDirectives('@csrf', context)
    expect(result).toContain('<input type="hidden" name="custom_token" value="abc123">')
  })

  it('multiple @csrf in same template generate same token (context shared)', () => {
    const context: Record<string, any> = {}
    const result = processBasicFormDirectives('@csrf @csrf', context)
    // Both should have the same token since context.csrf is set on first hit
    const matches = result.match(/value="([^"]+)"/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBe(2)
    expect(matches![0]).toBe(matches![1])
  })

  it('HTML escapes the token value', () => {
    const context = { csrf: { token: '<script>alert("xss")</script>' } }
    const result = processBasicFormDirectives('@csrf', context)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('produces empty token when csrf object has neither field nor token', () => {
    const context = { csrf: {} }
    const result = processBasicFormDirectives('@csrf', context)
    expect(result).toContain('value=""')
  })
})

// =============================================================================
// @method Directive
// =============================================================================

describe('@method', () => {
  it('@method("PUT") generates hidden input with _method=PUT', () => {
    const result = processBasicFormDirectives(`@method('PUT')`, {})
    expect(result).toContain('<input type="hidden" name="_method" value="PUT">')
  })

  it('@method("PATCH") generates hidden input with _method=PATCH', () => {
    const result = processBasicFormDirectives(`@method('PATCH')`, {})
    expect(result).toContain('<input type="hidden" name="_method" value="PATCH">')
  })

  it('@method("DELETE") generates hidden input with _method=DELETE', () => {
    const result = processBasicFormDirectives(`@method('DELETE')`, {})
    expect(result).toContain('<input type="hidden" name="_method" value="DELETE">')
  })

  it('@method("GET") remains unchanged (GET does not need spoofing)', () => {
    const template = `@method('GET')`
    const result = processBasicFormDirectives(template, {})
    expect(result).toBe(template)
  })

  it('@method("POST") remains unchanged (POST does not need spoofing)', () => {
    const template = `@method('POST')`
    const result = processBasicFormDirectives(template, {})
    expect(result).toBe(template)
  })

  it('case insensitive: @method("put") outputs uppercase PUT', () => {
    const result = processBasicFormDirectives(`@method('put')`, {})
    expect(result).toContain('value="PUT"')
  })

  it('case insensitive: @method("delete") outputs uppercase DELETE', () => {
    const result = processBasicFormDirectives(`@method('delete')`, {})
    expect(result).toContain('value="DELETE"')
  })

  it('handles double-quoted method name', () => {
    const result = processBasicFormDirectives(`@method("PATCH")`, {})
    expect(result).toContain('value="PATCH"')
  })
})

// =============================================================================
// @form / @endform Directive
// =============================================================================

describe('@form / @endform', () => {
  it('basic form with POST and action', () => {
    const result = processForms(`@form('POST', '/submit')content@endform`, {}, '', defaultOptions)
    expect(result).toContain('<form method="POST" action="/submit">')
    expect(result).toContain('</form>')
  })

  it('form with auto-CSRF injection', () => {
    const result = processForms(`@form('POST', '/submit')@endform`, {}, '', defaultOptions)
    expect(result).toContain('name="_token"')
    expect(result).toContain('type="hidden"')
  })

  it('form with PUT method adds both CSRF and method spoofing', () => {
    const result = processForms(`@form('PUT', '/update')@endform`, {}, '', defaultOptions)
    expect(result).toContain('<form method="POST" action="/update">')
    expect(result).toContain('name="_token"')
    expect(result).toContain('name="_method" value="PUT"')
  })

  it('form with DELETE method adds CSRF and method spoofing', () => {
    const result = processForms(`@form('DELETE', '/destroy')@endform`, {}, '', defaultOptions)
    expect(result).toContain('<form method="POST" action="/destroy">')
    expect(result).toContain('name="_method" value="DELETE"')
  })

  it('form with attributes object', () => {
    const result = processForms(`@form('POST', '/submit', {class: 'my-form', id: 'main-form'})@endform`, {}, '', defaultOptions)
    expect(result).toContain('class="my-form"')
    expect(result).toContain('id="main-form"')
  })

  it('default method is POST when not specified', () => {
    const result = processForms(`@form()@endform`, {}, '', defaultOptions)
    expect(result).toContain('method="POST"')
  })

  it('empty action URL', () => {
    const result = processForms(`@form('POST')@endform`, {}, '', defaultOptions)
    expect(result).toContain('action=""')
  })

  it('@endform produces </form>', () => {
    const result = processForms(`@form('POST', '/test')body@endform`, {}, '', defaultOptions)
    expect(result).toContain('</form>')
  })

  it('GET form does not add method spoofing', () => {
    const result = processForms(`@form('GET', '/search')@endform`, {}, '', defaultOptions)
    expect(result).toContain('<form method="GET" action="/search">')
    expect(result).not.toContain('name="_method"')
  })

  it('PATCH method uses POST with method spoofing', () => {
    const result = processForms(`@form('PATCH', '/update')@endform`, {}, '', defaultOptions)
    expect(result).toContain('<form method="POST" action="/update">')
    expect(result).toContain('name="_method" value="PATCH"')
  })
})

// =============================================================================
// @input Directive
// =============================================================================

describe('@input', () => {
  it('basic: generates text input with name', () => {
    const result = processFormInputDirectives(`@input('username')`, {})
    expect(result).toContain('<input type="text" name="username" value="" class="form-control">')
  })

  it('with value: sets the value attribute', () => {
    const result = processFormInputDirectives(`@input('username', 'John')`, {})
    expect(result).toContain('value="John"')
  })

  it('with attributes: type and placeholder', () => {
    const result = processFormInputDirectives(`@input('email', '', {type: 'email', placeholder: 'Enter email'})`, {})
    expect(result).toContain('type="email"')
    expect(result).toContain('name="email"')
    expect(result).toContain('placeholder="Enter email"')
  })

  it('old value from context.old object', () => {
    const context = { old: { username: 'saved-value' } }
    const result = processFormInputDirectives(`@input('username')`, context)
    expect(result).toContain('value="saved-value"')
  })

  it('old value from context.old function', () => {
    const context = { old: (field: string) => field === 'username' ? 'fn-value' : '' }
    const result = processFormInputDirectives(`@input('username')`, context)
    expect(result).toContain('value="fn-value"')
  })

  it('old value from direct context property', () => {
    const context = { username: 'direct-value' }
    const result = processFormInputDirectives(`@input('username')`, context)
    expect(result).toContain('value="direct-value"')
  })

  it('error state: adds is-invalid class when field has error', () => {
    const context = { errors: { username: ['Required'] } }
    const result = processFormInputDirectives(`@input('username')`, context)
    expect(result).toContain('class="form-control is-invalid"')
  })

  it('no error state when errors object is empty', () => {
    const context = { errors: {} }
    const result = processFormInputDirectives(`@input('username')`, context)
    expect(result).toContain('class="form-control"')
    expect(result).not.toContain('is-invalid')
  })

  it('type extraction from attributes: password', () => {
    const result = processFormInputDirectives(`@input('pass', '', {type: 'password'})`, {})
    expect(result).toContain('type="password"')
  })

  it('default type is text when no type attribute', () => {
    const result = processFormInputDirectives(`@input('field')`, {})
    expect(result).toContain('type="text"')
  })

  it('custom class replaces default class', () => {
    const result = processFormInputDirectives(`@input('field', '', {class: 'my-input'})`, {})
    expect(result).toContain('class="my-input"')
    expect(result).not.toContain('form-control')
  })

  it('custom class with error appends error class', () => {
    const context = { errors: { field: ['err'] } }
    const result = processFormInputDirectives(`@input('field', '', {class: 'my-input'})`, context)
    expect(result).toContain('class="my-input is-invalid"')
  })

  it('XSS prevention in value: escapes script tags', () => {
    const result = processFormInputDirectives(`@input('name', '<script>alert(1)</script>')`, {})
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('XSS prevention in value from context', () => {
    const context = { name: '"><img src=x onerror=alert(1)>' }
    const result = processFormInputDirectives(`@input('name')`, context)
    // The double-quote is escaped so the value attribute cannot break out
    expect(result).toContain('&quot;')
    expect(result).toContain('&gt;')
    // The raw unescaped sequence should not appear
    expect(result).not.toContain('value=""><img')
  })

  it('handles double-quoted name', () => {
    const result = processFormInputDirectives(`@input("username")`, {})
    expect(result).toContain('name="username"')
  })

  it('old value takes precedence over default value', () => {
    const context = { old: { username: 'old-val' } }
    const result = processFormInputDirectives(`@input('username', 'default-val')`, context)
    expect(result).toContain('value="old-val"')
  })
})

// =============================================================================
// @textarea Directive
// =============================================================================

describe('@textarea', () => {
  it('basic textarea with content', () => {
    const result = processFormInputDirectives(`@textarea('bio')Default bio@endtextarea`, {})
    expect(result).toContain('<textarea name="bio" class="form-control">Default bio</textarea>')
  })

  it('with attributes: rows', () => {
    const result = processFormInputDirectives(`@textarea('bio', {rows: '5'})content@endtextarea`, {})
    expect(result).toContain('rows="5"')
    expect(result).toContain('name="bio"')
  })

  it('old value restoration replaces content', () => {
    const context = { old: { bio: 'Restored bio text' } }
    const result = processFormInputDirectives(`@textarea('bio')Original@endtextarea`, context)
    expect(result).toContain('>Restored bio text</textarea>')
    expect(result).not.toContain('Original')
  })

  it('error state adds is-invalid class', () => {
    const context = { errors: { bio: ['Too short'] } }
    const result = processFormInputDirectives(`@textarea('bio')text@endtextarea`, context)
    expect(result).toContain('class="form-control is-invalid"')
  })

  it('content escaping prevents XSS', () => {
    const context = { old: { bio: '<script>alert("xss")</script>' } }
    const result = processFormInputDirectives(`@textarea('bio')safe@endtextarea`, context)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('empty content uses trimmed default', () => {
    const result = processFormInputDirectives(`@textarea('notes')   @endtextarea`, {})
    expect(result).toContain('></textarea>')
  })

  it('custom class attribute', () => {
    const result = processFormInputDirectives(`@textarea('bio', {class: 'custom-textarea'})text@endtextarea`, {})
    expect(result).toContain('class="custom-textarea"')
    expect(result).not.toContain('form-control')
  })

  it('old value from direct context', () => {
    const context = { bio: 'Context bio value' }
    const result = processFormInputDirectives(`@textarea('bio')placeholder@endtextarea`, context)
    expect(result).toContain('>Context bio value</textarea>')
  })
})

// =============================================================================
// @select Directive
// =============================================================================

describe('@select', () => {
  it('basic with options', () => {
    const template = `@select('country')<option value="us">US</option><option value="uk">UK</option>@endselect`
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('<select name="country" class="form-control">')
    expect(result).toContain('<option value="us">US</option>')
    expect(result).toContain('<option value="uk">UK</option>')
    expect(result).toContain('</select>')
  })

  it('old value marks option as selected', () => {
    const template = `@select('color')<option value="red">Red</option><option value="blue">Blue</option>@endselect`
    const context = { old: { color: 'blue' } }
    const result = processFormInputDirectives(template, context)
    expect(result).toContain('<option selected value="blue">Blue</option>')
    expect(result).not.toContain('<option selected value="red">')
  })

  it('array old value for multi-select', () => {
    const template = `@select('colors')<option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option>@endselect`
    const context = { old: { colors: ['red', 'green'] } }
    const result = processFormInputDirectives(template, context)
    expect(result).toContain('<option selected value="red">Red</option>')
    expect(result).not.toContain('<option selected value="blue">')
    expect(result).toContain('<option selected value="green">Green</option>')
  })

  it('error state adds is-invalid', () => {
    const template = `@select('country')<option value="us">US</option>@endselect`
    const context = { errors: { country: ['Required'] } }
    const result = processFormInputDirectives(template, context)
    expect(result).toContain('class="form-control is-invalid"')
  })

  it('custom attributes', () => {
    const template = `@select('country', {class: 'custom-select', id: 'country-select'})<option value="us">US</option>@endselect`
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('class="custom-select"')
    expect(result).toContain('id="country-select"')
  })

  it('no selection when old value does not match any option', () => {
    const template = `@select('color')<option value="red">Red</option><option value="blue">Blue</option>@endselect`
    const context = { old: { color: 'green' } }
    const result = processFormInputDirectives(template, context)
    expect(result).not.toContain('selected')
  })

  it('does not double-add selected if already present', () => {
    const template = `@select('color')<option value="red" selected>Red</option>@endselect`
    const context = { old: { color: 'red' } }
    const result = processFormInputDirectives(template, context)
    // Should not have double selected
    const matches = result.match(/selected/g)
    expect(matches!.length).toBe(1)
  })

  it('old value from direct context', () => {
    const template = `@select('color')<option value="red">Red</option><option value="blue">Blue</option>@endselect`
    const context = { color: 'red' }
    const result = processFormInputDirectives(template, context)
    expect(result).toContain('<option selected value="red">Red</option>')
  })
})

// =============================================================================
// @checkbox Directive
// =============================================================================

describe('@checkbox', () => {
  it('basic: default value is "1"', () => {
    const result = processFormInputDirectives(`@checkbox('agree')`, {})
    expect(result).toContain('type="checkbox"')
    expect(result).toContain('name="agree"')
    expect(result).toContain('value="1"')
  })

  it('with custom value', () => {
    const result = processFormInputDirectives(`@checkbox('color', 'red')`, {})
    expect(result).toContain('value="red"')
  })

  it('checked state from old value: string match', () => {
    const context = { old: { color: 'red' } }
    const result = processFormInputDirectives(`@checkbox('color', 'red')`, context)
    expect(result).toContain('checked')
  })

  it('not checked when old value does not match', () => {
    const context = { old: { color: 'blue' } }
    const result = processFormInputDirectives(`@checkbox('color', 'red')`, context)
    expect(result).not.toContain('checked')
  })

  it('checked state from old value: boolean true', () => {
    const context = { old: { remember: true } }
    const result = processFormInputDirectives(`@checkbox('remember')`, context)
    expect(result).toContain('checked')
  })

  it('not checked when boolean false', () => {
    const context = { old: { remember: false } }
    const result = processFormInputDirectives(`@checkbox('remember')`, context)
    expect(result).not.toContain('checked')
  })

  it('checked state from old value: array includes', () => {
    const context = { old: { 'colors[]': ['red', 'blue'] } }
    const result = processFormInputDirectives(`@checkbox('colors[]', 'red')`, context)
    expect(result).toContain('checked')
  })

  it('not checked when array does not include value', () => {
    const context = { old: { 'colors[]': ['blue', 'green'] } }
    const result = processFormInputDirectives(`@checkbox('colors[]', 'red')`, context)
    expect(result).not.toContain('checked')
  })

  it('custom class', () => {
    const result = processFormInputDirectives(`@checkbox('agree', '1', {class: 'custom-check'})`, {})
    expect(result).toContain('class="custom-check"')
    expect(result).not.toContain('form-check-input')
  })

  it('additional attributes', () => {
    const result = processFormInputDirectives(`@checkbox('agree', '1', {id: 'agree-box', disabled: 'true'})`, {})
    expect(result).toContain('id="agree-box"')
    expect(result).toContain('disabled="true"')
  })

  it('default class is form-check-input', () => {
    const result = processFormInputDirectives(`@checkbox('field')`, {})
    expect(result).toContain('class="form-check-input"')
  })

  it('checked via direct context for array notation', () => {
    const context = { colors: ['red', 'green'] }
    const result = processFormInputDirectives(`@checkbox('colors[]', 'red')`, context)
    expect(result).toContain('checked')
  })
})

// =============================================================================
// @radio Directive
// =============================================================================

describe('@radio', () => {
  it('basic radio button', () => {
    const result = processFormInputDirectives(`@radio('gender', 'male')`, {})
    expect(result).toContain('type="radio"')
    expect(result).toContain('name="gender"')
    expect(result).toContain('value="male"')
  })

  it('checked state from old value match', () => {
    const context = { old: { gender: 'male' } }
    const result = processFormInputDirectives(`@radio('gender', 'male')`, context)
    expect(result).toContain('checked')
  })

  it('not checked when value does not match', () => {
    const context = { old: { gender: 'female' } }
    const result = processFormInputDirectives(`@radio('gender', 'male')`, context)
    expect(result).not.toContain('checked')
  })

  it('custom class', () => {
    const result = processFormInputDirectives(`@radio('gender', 'male', {class: 'custom-radio'})`, {})
    expect(result).toContain('class="custom-radio"')
  })

  it('default class is form-check-input', () => {
    const result = processFormInputDirectives(`@radio('gender', 'male')`, {})
    expect(result).toContain('class="form-check-input"')
  })

  it('only matching radio is checked among multiple', () => {
    const context = { old: { size: 'medium' } }
    const template = `@radio('size', 'small') @radio('size', 'medium') @radio('size', 'large')`
    const result = processFormInputDirectives(template, context)
    // Count checked occurrences
    const checkedCount = (result.match(/checked/g) || []).length
    expect(checkedCount).toBe(1)
    expect(result).toContain('value="medium" class="form-check-input" checked')
  })

  it('additional attributes', () => {
    const result = processFormInputDirectives(`@radio('gender', 'male', {id: 'gender-male'})`, {})
    expect(result).toContain('id="gender-male"')
  })

  it('checked via direct context property', () => {
    const context = { gender: 'female' }
    const result = processFormInputDirectives(`@radio('gender', 'female')`, context)
    expect(result).toContain('checked')
  })
})

// =============================================================================
// @file Directive
// =============================================================================

describe('@file', () => {
  it('basic file input', () => {
    const result = processFormInputDirectives(`@file('avatar')`, {})
    expect(result).toContain('type="file"')
    expect(result).toContain('name="avatar"')
  })

  it('with accept attribute', () => {
    const result = processFormInputDirectives(`@file('avatar', {accept: 'image/*'})`, {})
    expect(result).toContain('accept="image/*"')
  })

  it('with multiple attribute', () => {
    const result = processFormInputDirectives(`@file('docs', {multiple: true})`, {})
    expect(result).toContain('multiple')
  })

  it('with accept and multiple combined', () => {
    // Note: the attribute parser splits on commas, so accept values with commas
    // need to be quoted properly. Use a value without internal commas or test separately.
    const result = processFormInputDirectives(`@file('docs', {accept: '.pdf', multiple: true})`, {})
    expect(result).toContain('accept=".pdf"')
    expect(result).toContain('multiple')
  })

  it('custom class attribute', () => {
    const result = processFormInputDirectives(`@file('avatar', {class: 'custom-file'})`, {})
    expect(result).toContain('class="custom-file"')
  })

  it('default class is form-control', () => {
    const result = processFormInputDirectives(`@file('avatar')`, {})
    expect(result).toContain('class="form-control"')
  })

  it('error state adds is-invalid class', () => {
    const context = { errors: { avatar: ['File too large'] } }
    const result = processFormInputDirectives(`@file('avatar')`, context)
    expect(result).toContain('class="form-control is-invalid"')
  })

  it('additional custom attributes', () => {
    const result = processFormInputDirectives(`@file('avatar', {id: 'avatar-input', accept: 'image/*'})`, {})
    expect(result).toContain('id="avatar-input"')
    expect(result).toContain('accept="image/*"')
  })
})

// =============================================================================
// @label Directive
// =============================================================================

describe('@label', () => {
  it('basic label with content', () => {
    const result = processFormInputDirectives(`@label('username')Username@endlabel`, {})
    expect(result).toContain('<label for="username" class="form-label">Username</label>')
  })

  it('with custom attributes: class', () => {
    const result = processFormInputDirectives(`@label('email', {class: 'required'})Email@endlabel`, {})
    expect(result).toContain('class="required"')
    expect(result).toContain('for="email"')
  })

  it('for attribute matches the provided field name', () => {
    const result = processFormInputDirectives(`@label('user_email')Email Address@endlabel`, {})
    expect(result).toContain('for="user_email"')
  })

  it('default class is form-label', () => {
    const result = processFormInputDirectives(`@label('field')Text@endlabel`, {})
    expect(result).toContain('class="form-label"')
  })

  it('preserves HTML content inside label', () => {
    const result = processFormInputDirectives(`@label('name')<strong>Name</strong>@endlabel`, {})
    expect(result).toContain('<strong>Name</strong>')
  })

  it('additional attributes like id', () => {
    const result = processFormInputDirectives(`@label('name', {id: 'name-label'})Name@endlabel`, {})
    expect(result).toContain('id="name-label"')
  })
})

// =============================================================================
// @error / @enderror Directive
// =============================================================================

describe('@error / @enderror', () => {
  it('shows error message when field has error', () => {
    const template = `@error('username'){{ $message }}@enderror`
    const context = { errors: { username: ['Username is required'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('Username is required')
  })

  it('hides content when no error for the field', () => {
    const template = `@error('username')<span>Error</span>@enderror`
    const context = { errors: {} }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).not.toContain('Error')
    expect(result).toBe('')
  })

  it('hides content when no errors object at all', () => {
    const template = `@error('username')<span>Error</span>@enderror`
    const context = {}
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toBe('')
  })

  it('$message variable is replaced with actual error message', () => {
    const template = `@error('email'){{ $message }}@enderror`
    const context = { errors: { email: 'Invalid email' } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('Invalid email')
  })

  it('first error from array is used as $message', () => {
    const template = `@error('email'){{ $message }}@enderror`
    const context = { errors: { email: ['First error', 'Second error'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('First error')
  })

  it('works with Laravel-style errors object (has/get methods)', () => {
    const template = `@error('email'){{ $message }}@enderror`
    const context = {
      errors: {
        email: 'Bad email',
        has: (field: string) => field === 'email',
        get: (field: string) => field === 'email' ? 'Bad email' : '',
      },
    }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('Bad email')
  })

  it('renders static content when error exists (no expression)', () => {
    const template = `@error('name')<div class="err">This field has an error</div>@enderror`
    const context = { errors: { name: ['Required'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('<div class="err">This field has an error</div>')
  })

  it('multiple error blocks for different fields', () => {
    const template = `@error('name'){{ $message }}@enderror @error('email'){{ $message }}@enderror`
    const context = { errors: { name: ['Name required'], email: ['Email required'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('Name required')
    expect(result).toContain('Email required')
  })

  it('only shows error for the correct field', () => {
    const template = `@error('name')name-error@enderror @error('email')email-error@enderror`
    const context = { errors: { email: ['Bad'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).not.toContain('name-error')
    expect(result).toContain('email-error')
  })
})

// =============================================================================
// @validate Directive
// =============================================================================

describe('@validate', () => {
  it('required rule generates required attribute', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('email', 'required')`, {})
    expect(result).toContain('required')
  })

  it('email rule generates type="email"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('email', 'email')`, {})
    expect(result).toContain('type="email"')
  })

  it('url rule generates type="url"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('website', 'url')`, {})
    expect(result).toContain('type="url"')
  })

  it('numeric rule generates type="number"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('age', 'numeric')`, {})
    expect(result).toContain('type="number"')
  })

  it('min:5 rule generates minlength="5"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('name', 'min:5')`, {})
    expect(result).toContain('minlength="5"')
  })

  it('max:100 rule generates maxlength="100"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('bio', 'max:100')`, {})
    expect(result).toContain('maxlength="100"')
  })

  it('multiple rules combined', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('email', 'required|email|max:255')`, {})
    expect(result).toContain('required')
    expect(result).toContain('type="email"')
    expect(result).toContain('maxlength="255"')
  })

  it('regex:pattern rule generates pattern attribute', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('code', 'regex:[A-Z]{3}')`, {})
    expect(result).toContain('pattern="[A-Z]{3}"')
  })

  it('integer rule generates type="number" and step="1"', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('count', 'integer')`, {})
    expect(result).toContain('type="number"')
    expect(result).toContain('step="1"')
  })

  it('outputs HTML comment with validation info', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('field', 'required')`, {})
    expect(result).toContain('<!-- @validate:field:required -->')
  })

  it('rules without HTML5 mapping produce no attrs comment', () => {
    const { processValidateDirective } = require('../../src/forms')
    const result = processValidateDirective(`@validate('field', 'in:a,b,c')`, {})
    expect(result).toContain('<!-- @validate:field:in:a,b,c -->')
    // No attrs comment since 'in' does not map to an HTML5 attribute
    expect(result).not.toContain('<!-- attrs:')
  })
})

// =============================================================================
// Form Class Configuration
// =============================================================================

describe('form class configuration', () => {
  it('default Bootstrap classes are used', () => {
    expect(defaultFormClasses.input).toBe('form-control')
    expect(defaultFormClasses.inputError).toBe('is-invalid')
    expect(defaultFormClasses.checkInput).toBe('form-check-input')
    expect(defaultFormClasses.label).toBe('form-label')
    expect(defaultFormClasses.errorFeedback).toBe('invalid-feedback')
  })

  it('custom classes via options override defaults', () => {
    const customClasses = {
      input: 'custom-input',
      inputError: 'custom-error',
      checkInput: 'custom-check',
      label: 'custom-label',
      errorFeedback: 'custom-feedback',
    }
    const result = processFormInputDirectives(
      `@input('field')`,
      {},
      customClasses,
    )
    expect(result).toContain('class="custom-input"')
  })

  it('error class appended correctly with custom classes', () => {
    const customClasses = {
      input: 'custom-input',
      inputError: 'custom-error',
      checkInput: 'custom-check',
      label: 'custom-label',
      errorFeedback: 'custom-feedback',
    }
    const context = { errors: { field: ['err'] } }
    const result = processFormInputDirectives(
      `@input('field')`,
      context,
      customClasses,
    )
    expect(result).toContain('class="custom-input custom-error"')
  })

  it('custom input class via processForms options', () => {
    const options = {
      ...defaultOptions,
      forms: { classes: { input: 'tailwind-input' } },
    } as StxOptions
    const result = processForms(`@input('name')`, {}, '', options)
    expect(result).toContain('class="tailwind-input"')
  })

  it('buildClassString: existing class + error produces combined string', () => {
    // Test through processFormInputDirectives with custom class and error
    const context = { errors: { email: ['bad'] } }
    const result = processFormInputDirectives(`@input('email', '', {class: 'specific-class'})`, context)
    expect(result).toContain('class="specific-class is-invalid"')
  })

  it('buildClassString: no existing class uses default with error', () => {
    const context = { errors: { email: ['bad'] } }
    const result = processFormInputDirectives(`@input('email')`, context)
    expect(result).toContain('class="form-control is-invalid"')
  })

  it('custom checkbox class via classes parameter', () => {
    const customClasses = {
      ...defaultFormClasses,
      checkInput: 'my-checkbox',
    }
    const result = processFormInputDirectives(`@checkbox('agree')`, {}, customClasses)
    expect(result).toContain('class="my-checkbox"')
  })

  it('custom label class via classes parameter', () => {
    const customClasses = {
      ...defaultFormClasses,
      label: 'my-label',
    }
    const result = processFormInputDirectives(`@label('name')Name@endlabel`, {}, customClasses)
    expect(result).toContain('class="my-label"')
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  it('special characters in field names: dots', () => {
    const result = processFormInputDirectives(`@input('user.name')`, {})
    expect(result).toContain('name="user.name"')
  })

  it('special characters in field names: brackets', () => {
    const result = processFormInputDirectives(`@input('items[0]')`, {})
    expect(result).toContain('name="items[0]"')
  })

  it('special characters in field names: hyphens', () => {
    const result = processFormInputDirectives(`@input('first-name')`, {})
    expect(result).toContain('name="first-name"')
  })

  it('empty attribute objects produce no extra attributes', () => {
    // When attributes string is empty, parseAttributes returns ''
    const result = processFormInputDirectives(`@input('field')`, {})
    expect(result).toContain('<input type="text" name="field" value="" class="form-control">')
  })

  it('multiple forms in one template', () => {
    const template = `@form('POST', '/form1')@endform @form('GET', '/form2')@endform`
    const result = processForms(template, {}, '', defaultOptions)
    expect(result).toContain('action="/form1"')
    expect(result).toContain('action="/form2"')
    const formCount = (result.match(/<form /g) || []).length
    expect(formCount).toBe(2)
    const endFormCount = (result.match(/<\/form>/g) || []).length
    expect(endFormCount).toBe(2)
  })

  it('nested form elements: input inside form', () => {
    const template = `@form('POST', '/submit')@input('name')@endform`
    const result = processForms(template, {}, '', defaultOptions)
    expect(result).toContain('<form')
    expect(result).toContain('<input type="text" name="name"')
    expect(result).toContain('</form>')
  })

  it('HTML in textarea default content', () => {
    const result = processFormInputDirectives(`@textarea('html')<p>Hello</p>@endtextarea`, {})
    // Content should be escaped
    expect(result).toContain('&lt;p&gt;Hello&lt;/p&gt;')
  })

  it('long form with many fields', () => {
    const fields = Array.from({ length: 20 }, (_, i) => `@input('field${i}')`).join('\n')
    const template = `@form('POST', '/big')${fields}@endform`
    const result = processForms(template, {}, '', defaultOptions)
    for (let i = 0; i < 20; i++) {
      expect(result).toContain(`name="field${i}"`)
    }
  })

  it('double quote handling in attributes', () => {
    const result = processFormInputDirectives(`@input("username", "John")`, {})
    expect(result).toContain('name="username"')
    expect(result).toContain('value="John"')
  })

  it('single and double quotes in @method', () => {
    const result1 = processBasicFormDirectives(`@method('PUT')`, {})
    const result2 = processBasicFormDirectives(`@method("PUT")`, {})
    expect(result1).toContain('value="PUT"')
    expect(result2).toContain('value="PUT"')
  })

  it('csrf token does not change within same context across multiple calls', () => {
    const context: Record<string, any> = {}
    const template = `@csrf`
    const result1 = processBasicFormDirectives(template, context)
    const savedToken = context.csrf.token
    const result2 = processBasicFormDirectives(template, context)
    expect(result1).toContain(savedToken)
    expect(result2).toContain(savedToken)
  })

  it('form processing does not affect non-directive content', () => {
    const template = `<div>Hello World</div>`
    const result = processForms(template, {}, '', defaultOptions)
    expect(result).toBe('<div>Hello World</div>')
  })

  it('@endform outside of @form just produces </form>', () => {
    const result = processForms(`@endform`, {}, '', defaultOptions)
    expect(result).toBe('</form>')
  })

  it('input with all arguments: name, value, and attributes', () => {
    const result = processFormInputDirectives(
      `@input('email', 'test@example.com', {type: 'email', id: 'email-input', placeholder: 'Email'})`,
      {},
    )
    expect(result).toContain('type="email"')
    expect(result).toContain('name="email"')
    expect(result).toContain('value="test@example.com"')
    expect(result).toContain('id="email-input"')
    expect(result).toContain('placeholder="Email"')
  })

  it('select with no matching old value leaves all options unselected', () => {
    const template = `@select('fruit')<option value="apple">Apple</option><option value="banana">Banana</option>@endselect`
    const result = processFormInputDirectives(template, {})
    expect(result).not.toContain('selected')
  })

  it('checkbox value is properly escaped', () => {
    const result = processFormInputDirectives(`@checkbox('opt', '<b>xss</b>')`, {})
    expect(result).toContain('value="&lt;b&gt;xss&lt;/b&gt;"')
  })

  it('radio value is properly escaped', () => {
    const result = processFormInputDirectives(`@radio('opt', '<script>')`, {})
    expect(result).toContain('value="&lt;script&gt;"')
  })

  it('label for attribute escapes special HTML chars', () => {
    // Name regex only supports [^'"]+ so we test escapeAttr with < and &
    const result = processFormInputDirectives(`@label('a&b')Text@endlabel`, {})
    expect(result).toContain('for="a&amp;b"')
  })

  it('file input name escapes special HTML chars', () => {
    const result = processFormInputDirectives(`@file('f<ile')`, {})
    expect(result).toContain('name="f&lt;ile"')
  })

  it('textarea name escapes special HTML chars', () => {
    const result = processFormInputDirectives(`@textarea('n<ame')content@endtextarea`, {})
    expect(result).toContain('name="n&lt;ame"')
  })

  it('select name escapes special HTML chars', () => {
    const template = `@select('n&ame')<option value="a">A</option>@endselect`
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('name="n&amp;ame"')
  })

  it('processForms runs all directive processors in correct order', () => {
    // A comprehensive template that exercises multiple directives
    const template = `@validate('email', 'required|email')@form('POST', '/submit')@csrf @input('email') @error('email'){{ $message }}@enderror@endform`
    const context = { errors: { email: ['Invalid'] } }
    const result = processForms(template, context, '', defaultOptions)
    expect(result).toContain('<form')
    expect(result).toContain('name="_token"')
    expect(result).toContain('name="email"')
    expect(result).toContain('Invalid')
    expect(result).toContain('</form>')
    // @validate should have been processed first, producing a comment
    expect(result).toContain('<!-- @validate:email:required|email -->')
  })
})
