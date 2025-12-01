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

    expect(processedContent).toContain('Line 1<br>')
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
