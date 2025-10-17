import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

// Helper function to process a template with our test options
async function processTemplate(template: string, context: Record<string, any> = {}, filePath: string = 'test.stx', options: StxOptions = defaultOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('stx Form Validation Tests', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  describe('Form Input Rendering', () => {
    it('should correctly render form inputs with validation states', async () => {
      const template = `
      <form method="POST" action="/register">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" name="email" class="form-control {{ errors.email ? 'is-invalid' : '' }}" value="{{ email }}">
          @if(errors.email)
            <div class="invalid-feedback">{{ errors.email }}</div>
          @endif
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" name="password" class="form-control {{ errors.password ? 'is-invalid' : '' }}">
          @if(errors.password)
            <div class="invalid-feedback">{{ errors.password }}</div>
          @endif
        </div>

        <button type="submit">Register</button>
      </form>
      `

      // Test with validation errors
      const contextWithErrors = {
        email: 'invalid-email',
        errors: {
          email: 'Please enter a valid email address',
          password: 'Password must be at least 8 characters',
        },
      }

      const resultWithErrors = await processTemplate(template, contextWithErrors)

      // Should include error classes and messages
      expect(resultWithErrors).toContain('value="invalid-email"')
      expect(resultWithErrors).toContain('class="form-control is-invalid"')
      expect(resultWithErrors).toContain('<div class="invalid-feedback">Please enter a valid email address</div>')
      expect(resultWithErrors).toContain('<div class="invalid-feedback">Password must be at least 8 characters</div>')

      // Test without validation errors
      const contextWithoutErrors = {
        email: 'user@example.com',
        errors: {},
      }

      const resultWithoutErrors = await processTemplate(template, contextWithoutErrors)

      // Should not include error classes or messages
      expect(resultWithoutErrors).toContain('value="user@example.com"')
      expect(resultWithoutErrors).toContain('class="form-control "') // Note the space after form-control
      expect(resultWithoutErrors).not.toContain('is-invalid')
      expect(resultWithoutErrors).not.toContain('invalid-feedback')
    })

    it('should correctly render checkboxes with validation states', async () => {
      const template = `
      <form method="POST" action="/preferences">
        <div class="form-check">
          <input type="checkbox" name="terms" class="form-check-input {{ errors.terms ? 'is-invalid' : '' }}" {{ terms ? 'checked' : '' }}>
          <label class="form-check-label" for="terms">I agree to the terms</label>
          @if(errors.terms)
            <div class="invalid-feedback">{{ errors.terms }}</div>
          @endif
        </div>

        <div class="form-check">
          <input type="checkbox" name="newsletter" class="form-check-input" {{ newsletter ? 'checked' : '' }}>
          <label class="form-check-label" for="newsletter">Subscribe to newsletter</label>
        </div>
      </form>
      `

      // Test with validation errors
      const contextWithErrors = {
        newsletter: true,
        errors: {
          terms: 'You must agree to the terms',
        },
      }

      const resultWithErrors = await processTemplate(template, contextWithErrors)

      // Terms checkbox should have error class but not be checked
      expect(resultWithErrors).toContain('name="terms" class="form-check-input is-invalid"')
      expect(resultWithErrors).not.toContain('name="terms" class="form-check-input is-invalid" checked')

      // Newsletter checkbox should be checked but no error
      expect(resultWithErrors).toContain('name="newsletter" class="form-check-input" checked')

      // Error message should be displayed
      expect(resultWithErrors).toContain('<div class="invalid-feedback">You must agree to the terms</div>')
    })

    it('should handle select fields with validation', async () => {
      const template = `
      <form method="POST" action="/profile">
        <div class="form-group">
          <label for="country">Country</label>
          <select name="country" class="form-control {{ errors.country ? 'is-invalid' : '' }}">
            <option value="">Select a country</option>
            <option value="us" {{ country === 'us' ? 'selected' : '' }}>United States</option>
            <option value="ca" {{ country === 'ca' ? 'selected' : '' }}>Canada</option>
            <option value="uk" {{ country === 'uk' ? 'selected' : '' }}>United Kingdom</option>
          </select>
          @if(errors.country)
            <div class="invalid-feedback">{{ errors.country }}</div>
          @endif
        </div>
      </form>
      `

      // Test with validation errors
      const contextWithErrors = {
        errors: {
          country: 'Please select a country',
        },
      }

      const resultWithErrors = await processTemplate(template, contextWithErrors)

      // Select should have error class
      expect(resultWithErrors).toContain('class="form-control is-invalid"')
      expect(resultWithErrors).toContain('<div class="invalid-feedback">Please select a country</div>')

      // No option should be selected
      expect(resultWithErrors).not.toContain('selected')

      // Test with selected value
      const contextWithValue = {
        country: 'ca',
        errors: {},
      }

      const resultWithValue = await processTemplate(template, contextWithValue)

      // Canada should be selected
      expect(resultWithValue).toContain('<option value="ca" selected>Canada</option>')

      // No error classes or messages
      expect(resultWithValue).toContain('class="form-control "')
      expect(resultWithValue).not.toContain('is-invalid')
      expect(resultWithValue).not.toContain('invalid-feedback')
    })
  })

  describe('Old Input Preservation', () => {
    it('should preserve old input values after validation failure', async () => {
      const testFile = await createTestFile('old-input.stx', `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Form with Old Input</title>
          <script>
            module.exports = {
              // Simulate flash old input data from a previous request
              old: {
                name: 'John Doe',
                email: 'invalid@email',
                interests: ['music', 'sports']
              },
              errors: {
                email: 'Please enter a valid email address'
              }
            };
          </script>
        </head>
        <body>
          <form method="POST" action="/submit">
            <div class="form-group">
              <label>Name</label>
              <input type="text" name="name" value="{{ old.name }}">
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" value="{{ old.email }}" class="{{ errors.email ? 'is-invalid' : '' }}">
              @if(errors.email)
                <div class="invalid-feedback">{{ errors.email }}</div>
              @endif
            </div>

            <div class="form-group">
              <label>Interests</label>
              <div>
                <input type="checkbox" name="interests[]" value="music" {{ old.interests && old.interests.includes('music') ? 'checked' : '' }}>
                <label>Music</label>
              </div>
              <div>
                <input type="checkbox" name="interests[]" value="sports" {{ old.interests && old.interests.includes('sports') ? 'checked' : '' }}>
                <label>Sports</label>
              </div>
              <div>
                <input type="checkbox" name="interests[]" value="movies" {{ old.interests && old.interests.includes('movies') ? 'checked' : '' }}>
                <label>Movies</label>
              </div>
            </div>

            <button type="submit">Submit</button>
          </form>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      // Form should contain old input values
      expect(outputHtml).toContain('value="John Doe"')
      expect(outputHtml).toContain('value="invalid@email"')

      // Checkboxes should maintain state
      expect(outputHtml).toContain('value="music" checked')
      expect(outputHtml).toContain('value="sports" checked')
      expect(outputHtml).not.toContain('value="movies" checked')

      // Error message should be shown
      expect(outputHtml).toContain('class="is-invalid"')
      expect(outputHtml).toContain('<div class="invalid-feedback">Please enter a valid email address</div>')
    })
  })

  describe('Form Macros', () => {
    it('should create compliant HTML5 validation attributes', async () => {
      const template = `
      <form method="POST" action="/register">
        <input type="text" name="username" required minlength="3" maxlength="20">

        <input type="email" name="email" required>

        <input type="number" name="age" min="18" max="120">

        <input type="password" name="password" required minlength="8"
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$">

        <button type="submit">Register</button>
      </form>
      `

      const result = await processTemplate(template)

      // HTML5 validation attributes should be preserved
      expect(result).toContain('required minlength="3" maxlength="20"')
      expect(result).toContain('type="email" name="email" required')
      expect(result).toContain('min="18" max="120"')
      expect(result).toContain('pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$"')
    })

    it('should handle custom validation messages', async () => {
      const template = `
      <form method="POST" action="/register">
        <div class="form-group">
          <input type="email" name="email" required data-error-message="Please enter your email">
          @if(errors.email)
            <div class="invalid-feedback">{{ errors.email }}</div>
          @endif
        </div>

        <div class="form-group">
          <input type="password" name="password" required
            data-error-message="Password is required"
            data-pattern-message="Password must contain letters and numbers">
          @if(errors.password)
            <div class="invalid-feedback">{{ errors.password }}</div>
          @endif
        </div>
      </form>
      `

      const result = await processTemplate(template, {
        errors: {
          email: 'The email must be a valid email address',
          password: 'The password must be at least 8 characters',
        },
      })

      // Custom error attribute should be preserved
      expect(result).toContain('data-error-message="Please enter your email"')
      expect(result).toContain('data-error-message="Password is required"')
      expect(result).toContain('data-pattern-message="Password must contain letters and numbers"')

      // Server-side validation errors should also be shown
      expect(result).toContain('<div class="invalid-feedback">The email must be a valid email address</div>')
      expect(result).toContain('<div class="invalid-feedback">The password must be at least 8 characters</div>')
    })
  })

  describe('Conditional Form Elements', () => {
    it('should conditionally show form elements based on data', async () => {
      const template = `
      <form method="POST" action="/order">
        <div class="form-group">
          <label>Shipping Method</label>
          <select name="shipping_method" id="shipping">
            <option value="standard" {{ shipping_method === 'standard' ? 'selected' : '' }}>Standard</option>
            <option value="express" {{ shipping_method === 'express' ? 'selected' : '' }}>Express</option>
            <option value="pickup" {{ shipping_method === 'pickup' ? 'selected' : '' }}>Local Pickup</option>
          </select>
        </div>

        @if(shipping_method === 'pickup')
          <div class="form-group" id="pickup-location">
            <label>Pickup Location</label>
            <select name="pickup_location">
              <option value="store1" {{ pickup_location === 'store1' ? 'selected' : '' }}>Main Store</option>
              <option value="store2" {{ pickup_location === 'store2' ? 'selected' : '' }}>Downtown</option>
            </select>
          </div>
        @else
          <div class="form-group" id="shipping-address">
            <label>Shipping Address</label>
            <textarea name="address">{{ address }}</textarea>
          </div>
        @endif

        @if(shipping_method === 'express')
          <div class="form-group" id="phone">
            <label>Phone Number (for express delivery)</label>
            <input type="tel" name="phone" value="{{ phone }}">
          </div>
        @endif
      </form>
      `

      // Test with standard shipping
      const standardResult = await processTemplate(template, { shipping_method: 'standard', address: '123 Main St' })

      expect(standardResult).toContain('value="standard" selected')
      expect(standardResult).toContain('<div class="form-group" id="shipping-address">')
      expect(standardResult).toContain('<textarea name="address">123 Main St</textarea>')
      expect(standardResult).not.toContain('<div class="form-group" id="pickup-location">')
      expect(standardResult).not.toContain('<div class="form-group" id="phone">')

      // Test with local pickup
      const pickupResult = await processTemplate(template, {
        shipping_method: 'pickup',
        pickup_location: 'store2',
      })

      expect(pickupResult).toContain('value="pickup" selected')
      expect(pickupResult).toContain('<div class="form-group" id="pickup-location">')
      expect(pickupResult).toContain('value="store2" selected')
      expect(pickupResult).not.toContain('<div class="form-group" id="shipping-address">')

      // Test with express shipping
      const expressResult = await processTemplate(template, {
        shipping_method: 'express',
        address: '456 Oak St',
        phone: '555-1234',
      })

      expect(expressResult).toContain('value="express" selected')
      expect(expressResult).toContain('<div class="form-group" id="shipping-address">')
      expect(expressResult).toContain('<textarea name="address">456 Oak St</textarea>')
      expect(expressResult).toContain('<div class="form-group" id="phone">')
      expect(expressResult).toContain('value="555-1234"')
    })
  })
})
