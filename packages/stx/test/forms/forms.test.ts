import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processBasicFormDirectives, processErrorDirective, processFormInputDirectives, processForms } from '../../src/forms'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp')

describe('stx Form Directives', () => {
  // Create temp directory for testing
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  it('should process @csrf directive', () => {
    const template = `<form>@csrf</form>`
    const context = {}
    const result = processBasicFormDirectives(template, context)

    expect(result).toContain('<input type="hidden" name="_token" value="')
    expect(context).toHaveProperty('csrf.token')
  })

  it('should process @csrf directive with custom token', () => {
    const template = `<form>@csrf</form>`
    const context = { csrf: { token: 'custom-token' } }
    const result = processBasicFormDirectives(template, context)

    expect(result).toContain('<input type="hidden" name="_token" value="custom-token">')
  })

  it('should process @method directive for PUT', () => {
    const template = `<form>@method('PUT')</form>`
    const result = processBasicFormDirectives(template, {})

    expect(result).toContain('<input type="hidden" name="_method" value="PUT">')
  })

  it('should process @form directive with defaults', () => {
    const template = `@form()@endform`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<form method="POST" action="">')
    expect(result).toContain('</form>')
  })

  it('should process @form directive with explicit method and action', () => {
    const template = `@form('GET', '/search')@endform`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<form method="GET" action="/search">')
  })

  it('should process @form directive with PUT method', () => {
    const template = `@form('PUT', '/update')@endform`
    const context = {}
    const result = processForms(template, context, '', {})

    // Should use POST with method spoofing for PUT
    expect(result).toContain('<form method="POST" action="/update">')
    expect(result).toContain('<input type="hidden" name="_method" value="PUT">')
  })

  it('should process @form directive with attributes', () => {
    const template = `@form('POST', '/submit', {class: 'form-class', id: 'form-id'})@endform`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<form method="POST" action="/submit" class="form-class" id="form-id">')
  })

  it('should process @input directive', () => {
    const template = `<form>@input('username')</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="text" name="username" value="" class="form-control">')
  })

  it('should process @input directive with value', () => {
    const template = `<form>@input('username', 'default-user')</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="text" name="username" value="default-user" class="form-control">')
  })

  it('should process @input directive with attributes', () => {
    const template = `<form>@input('email', '', {type: 'email', placeholder: 'Enter email'})</form>`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<input type="email" name="email" value="" class="form-control"  placeholder="Enter email">')
  })

  it('should process @input directive with old value from context', () => {
    const template = `<form>@input('username')</form>`
    const context = { username: 'test-user' }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<input type="text" name="username" value="test-user" class="form-control">')
  })

  it('should process @textarea directive', () => {
    const template = `<form>@textarea('description')Default text@endtextarea</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<textarea name="description" class="form-control">Default text</textarea>')
  })

  it('should process @textarea directive with old value', () => {
    const template = `<form>@textarea('description')Default text@endtextarea</form>`
    const context = { description: 'Old description' }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<textarea name="description" class="form-control">Old description</textarea>')
  })

  it('should process @select directive', () => {
    const template = `<form>
      @select('color')
        <option value="red">Red</option>
        <option value="blue">Blue</option>
      @endselect
    </form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<select name="color" class="form-control">')
    expect(result).toContain('<option value="red">Red</option>')
    expect(result).toContain('<option value="blue">Blue</option>')
  })

  it('should process @select directive with selected value', () => {
    const template = `<form>
      @select('color')
        <option value="red">Red</option>
        <option value="blue">Blue</option>
      @endselect
    </form>`
    const context = { color: 'blue' }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<option value="red">Red</option>')
    expect(result).toContain('<option selected value="blue">Blue</option>')
  })

  it('should process @checkbox directive', () => {
    const template = `<form>@checkbox('remember')</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="checkbox" name="remember" value="1" class="form-check-input">')
  })

  it('should process @checkbox directive with custom value', () => {
    const template = `<form>@checkbox('color', 'red')</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="checkbox" name="color" value="red" class="form-check-input">')
  })

  it('should process @checkbox directive with checked state', () => {
    const template = `<form>@checkbox('remember')</form>`
    const context = { remember: true }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<input type="checkbox" name="remember" value="1" class="form-check-input" checked>')
  })

  it('should process @checkbox directive with array values', () => {
    const template = `<form>
      @checkbox('colors[]', 'red')
      @checkbox('colors[]', 'blue')
    </form>`
    const context = { colors: ['red'] }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<input type="checkbox" name="colors[]" value="red" class="form-check-input" checked>')
    expect(result).toContain('<input type="checkbox" name="colors[]" value="blue" class="form-check-input">')
  })

  it('should process @radio directive', () => {
    const template = `<form>
      @radio('color', 'red')
      @radio('color', 'blue')
    </form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="radio" name="color" value="red" class="form-check-input">')
    expect(result).toContain('<input type="radio" name="color" value="blue" class="form-check-input">')
  })

  it('should process @radio directive with checked state', () => {
    const template = `<form>
      @radio('color', 'red')
      @radio('color', 'blue')
    </form>`
    const context = { color: 'blue' }
    const result = processFormInputDirectives(template, context)

    expect(result).toContain('<input type="radio" name="color" value="red" class="form-check-input">')
    expect(result).toContain('<input type="radio" name="color" value="blue" class="form-check-input" checked>')
  })

  it('should process @label directive', () => {
    const template = `<form>@label('name')Your Name@endlabel</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<label for="name" class="form-label">Your Name</label>')
  })

  it('should process @error directive', () => {
    const template = `<form>
      @input('email')
      @error('email')
        <div class="error">{{ $message }}</div>
      @enderror
    </form>`

    const context = {
      errors: {
        email: 'Invalid email address',
        has: (field: string) => field === 'email',
        get: (field: string) => field === 'email' ? 'Invalid email address' : '',
      },
    }

    const result = processErrorDirective(template, context)

    expect(result).toContain('<div class="error">Invalid email address</div>')
  })

  it('should handle @error directive with expressions', () => {
    const template = `<form>
      @input('email')
      @error('email')
        <div class="error">{{ errors.first('email') }}</div>
      @enderror
    </form>`

    const context = {
      errors: {
        email: 'Invalid email address',
        has: (field: string) => field === 'email',
        first: (field: string) => field === 'email' ? 'Invalid email address' : '',
      },
    }

    const result = processErrorDirective(template, context)

    expect(result).toContain('<div class="error">Invalid email address</div>')
  })

  it('should handle @error directive with no errors', () => {
    const template = `<form>
      @input('email')
      @error('email')
        <div class="error">{{ $message }}</div>
      @enderror
    </form>`

    const context = { errors: {} }
    const result = processErrorDirective(template, context)

    expect(result).not.toContain('<div class="error">')
  })

  it('should add is-invalid class to inputs with errors', () => {
    const template = `<form>
      @input('email')
      @textarea('description')@endtextarea
      @select('color')
        <option value="red">Red</option>
      @endselect
    </form>`

    const context = {
      errors: {
        email: 'Invalid email',
        has: (field: string) => field === 'email',
      },
    }

    const result = processFormInputDirectives(template, context)

    expect(result).toContain('class="form-control is-invalid"')
    // Only email should have the is-invalid class
    expect(result).toContain('<input type="text" name="email" value="" class="form-control is-invalid">')
    expect(result).toContain('<textarea name="description" class="form-control">')
    expect(result).toContain('<select name="color" class="form-control">')
  })
})

describe('stx Form Validation', () => {
  it('should validate required field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('name', '', 'required')
    expect(result1.valid).toBe(false)
    expect(result1.errors.length).toBeGreaterThan(0)

    const result2 = validateField('name', 'John', 'required')
    expect(result2.valid).toBe(true)
  })

  it('should validate email field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('email', 'invalid', 'email')
    expect(result1.valid).toBe(false)

    const result2 = validateField('email', 'test@example.com', 'email')
    expect(result2.valid).toBe(true)
  })

  it('should validate numeric field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('age', 'abc', 'numeric')
    expect(result1.valid).toBe(false)

    const result2 = validateField('age', '25', 'numeric')
    expect(result2.valid).toBe(true)
  })

  it('should validate min length', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('password', 'abc', 'min:6')
    expect(result1.valid).toBe(false)

    const result2 = validateField('password', 'password123', 'min:6')
    expect(result2.valid).toBe(true)
  })

  it('should validate max length', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('code', '1234567', 'max:5')
    expect(result1.valid).toBe(false)

    const result2 = validateField('code', '123', 'max:5')
    expect(result2.valid).toBe(true)
  })

  it('should validate multiple rules', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('email', '', 'required|email')
    expect(result1.valid).toBe(false)

    const result2 = validateField('email', 'invalid', 'required|email')
    expect(result2.valid).toBe(false)

    const result3 = validateField('email', 'test@example.com', 'required|email')
    expect(result3.valid).toBe(true)
  })

  it('should validate url field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('website', 'not-a-url', 'url')
    expect(result1.valid).toBe(false)

    const result2 = validateField('website', 'https://example.com', 'url')
    expect(result2.valid).toBe(true)
  })

  it('should validate alpha field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('name', 'John123', 'alpha')
    expect(result1.valid).toBe(false)

    const result2 = validateField('name', 'John', 'alpha')
    expect(result2.valid).toBe(true)
  })

  it('should validate alphanumeric field', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('username', 'user@name', 'alphanumeric')
    expect(result1.valid).toBe(false)

    const result2 = validateField('username', 'user123', 'alphanumeric')
    expect(result2.valid).toBe(true)
  })

  it('should validate in rule', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('status', 'unknown', 'in:active,inactive,pending')
    expect(result1.valid).toBe(false)

    const result2 = validateField('status', 'active', 'in:active,inactive,pending')
    expect(result2.valid).toBe(true)
  })

  it('should validate notIn rule', async () => {
    const { validateField } = await import('../../src/forms')

    const result1 = validateField('word', 'banned', 'notIn:banned,forbidden')
    expect(result1.valid).toBe(false)

    const result2 = validateField('word', 'allowed', 'notIn:banned,forbidden')
    expect(result2.valid).toBe(true)
  })

  it('should validate multiple fields', async () => {
    const { validateFields } = await import('../../src/forms')

    const rules = {
      email: 'required|email',
      password: 'required|min:6',
    }

    const values1 = { email: '', password: '123' }
    const result1 = validateFields(values1, rules)
    // validateFields returns Record<string, string[]> with errors per field
    expect(Object.keys(result1)).toContain('email')
    expect(Object.keys(result1)).toContain('password')
    expect(result1.email.length).toBeGreaterThan(0)
    expect(result1.password.length).toBeGreaterThan(0)

    const values2 = { email: 'test@example.com', password: 'password123' }
    const result2 = validateFields(values2, rules)
    // No errors means empty object
    expect(Object.keys(result2).length).toBe(0)
  })

  it('should register custom validation rule', async () => {
    const { registerValidationRule, validateField } = await import('../../src/forms')

    // Register a custom rule with unique name to avoid conflicts
    // Validator returns error message (string) if invalid, or null if valid
    registerValidationRule('customTestRule', (value) => {
      if (value !== 'valid') {
        return 'Value must be "valid"'
      }
      return null
    })

    const result1 = validateField('test', 'invalid', 'customTestRule')
    expect(result1.valid).toBe(false)
    expect(result1.errors).toContain('Value must be "valid"')

    const result2 = validateField('test', 'valid', 'customTestRule')
    expect(result2.valid).toBe(true)
  })

  it('should process @validate directive', async () => {
    const { processValidateDirective } = await import('../../src/forms')

    const template = `<form>@validate('email', 'required|email')@endvalidate</form>`
    const context = { email: 'invalid' }
    const result = processValidateDirective(template, context)

    // The directive converts to HTML comments with validation info
    expect(result).toContain('<!-- @validate:email:required|email -->')
    expect(result).toContain('@endvalidate')
  })

  it('should generate validation script', async () => {
    const { generateValidationScript } = await import('../../src/forms')

    const script = generateValidationScript('myForm', {
      email: 'required|email',
      password: 'required|min:6',
    })

    expect(script).toContain('myForm')
    expect(script).toContain('email')
    expect(script).toContain('password')
    expect(script).toContain('script')
  })
})

describe('stx Enhanced Validation', () => {
  it('should validate with enhanced rules', async () => {
    const { validateValueEnhanced, enhancedValidationRules } = await import('../../src/forms')

    // Test that enhanced rules exist
    expect(enhancedValidationRules).toBeDefined()
    expect(typeof enhancedValidationRules.required).toBe('object')
  })

  it('should register enhanced validation rule', async () => {
    const { registerEnhancedValidationRule, enhancedValidationRules } = await import('../../src/forms')

    registerEnhancedValidationRule({
      name: 'testEnhanced',
      validate: (value) => value === 'test' ? true : 'Must be test',
      message: 'Must be test',
    })

    expect(enhancedValidationRules.testEnhanced).toBeDefined()
  })

  it('should validate form with enhanced rules', async () => {
    const { validateFormEnhanced } = await import('../../src/forms')

    const result = validateFormEnhanced(
      { email: 'test@example.com' },
      { email: 'required|email' },
    )

    expect(result).toBeDefined()
    expect(typeof result.valid).toBe('boolean')
  })
})

describe('stx File Upload', () => {
  it('should process @file directive', () => {
    const template = `<form>@file('document')</form>`
    const result = processFormInputDirectives(template, {})

    expect(result).toContain('<input type="file" name="document"')
  })

  it('should process @file directive with accept', () => {
    const template = `<form>@file('image', {accept: 'image/*'})</form>`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<input type="file" name="image"')
    expect(result).toContain('accept="image/*"')
  })

  it('should process @file directive with multiple', () => {
    const template = `<form>@file('documents', {multiple: true})</form>`
    const result = processForms(template, {}, '', {})

    expect(result).toContain('<input type="file" name="documents"')
    expect(result).toContain('multiple')
  })
})

describe('stx Markdown Support', () => {
  it('should process @markdown directive with simple content', async () => {
    const template = `<div>@markdown
# Heading

- List item 1
- List item 2

**Bold text**
@endmarkdown</div>`

    const processedContent = await import('../../src/markdown').then(module =>
      module.processMarkdownDirectives(template, {}),
    )

    expect(processedContent).toMatch(/<h1[^>]*>Heading<\/h1>/)
    expect(processedContent).toContain('<ul>')
    expect(processedContent).toContain('<li>List item 1</li>')
    expect(processedContent).toContain('<li>List item 2</li>')
    expect(processedContent).toContain('<strong>Bold text</strong>')
  })

  it('should process @markdown directive with options', async () => {
    const template = `<div>@markdown(breaks)
Line 1
Line 2
@endmarkdown</div>`

    const processedContent = await import('../../src/markdown').then(module =>
      module.processMarkdownDirectives(template, {}),
    )

    // The br tag may be self-closing (<br />) or not (<br>) depending on markdown parser
    expect(processedContent).toMatch(/Line 1<br\s*\/?>/)
  })

  it('should handle @markdown directive with syntax errors gracefully', async () => {
    const template = `<div>@markdown
# Valid markdown

\`\`\`invalid
Unclosed code block
@endmarkdown</div>`

    const processedContent = await import('../../src/markdown').then(module =>
      module.processMarkdownDirectives(template, {}),
    )

    expect(processedContent).toMatch(/<h1[^>]*>Valid markdown<\/h1>/)
    // Despite the syntax error, marked will still render it
    expect(processedContent).toContain('Unclosed code block')
  })

  // Clean up after tests
  afterAll(async () => {
    if (fs.existsSync(TEMP_DIR)) {
      await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
    }
  })
})
