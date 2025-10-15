import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// Interface for our processed template results
interface ProcessedTemplate {
  html: string
}

// Helper function to process stx templates
async function processTemplate(templatePath: string): Promise<ProcessedTemplate> {
  // Create a temporary output directory
  const outputDir = path.join(path.dirname(templatePath), 'out')
  await fs.promises.mkdir(outputDir, { recursive: true })

  // Build the template using the stx plugin
  const result = await Bun.build({
    entrypoints: [templatePath],
    outdir: outputDir,
    plugins: [stxPlugin()],
  })

  // Get the HTML output
  const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
  if (!htmlOutput) {
    throw new Error(`Failed to process template: ${templatePath}`)
  }

  const html = await Bun.file(htmlOutput.path).text()

  // Filter out script chunks from the HTML to prevent happy-dom URL errors
  const filteredHtml = html.replace(/<script src="\.\/chunk-[^"]+\.js"><\/script>/g, '')

  return { html: filteredHtml }
}

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')

// DOM environment is provided by very-happy-dom registration

describe('stx Form Interaction Tests', () => {
  // Set up test environment
  beforeAll(async () => {
    // Create necessary directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })

    // Create a form template for direct import testing
    await Bun.write(path.join(TEMPLATE_DIR, 'form-template.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>stx Form Test</title>
  <script>
    module.exports = {
      title: "User Registration",
      formSubmitted: false,
      validationErrors: {},
      formData: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        interests: []
      },
      interestOptions: [
        "Development",
        "Design",
        "Marketing",
        "Product Management"
      ],
      validateForm: function() {
        const errors = {};
        const { username, email, password, confirmPassword } = this.formData;

        if (!username) errors.username = "Username is required";
        else if (username.length < 3) errors.username = "Username must be at least 3 characters";

        if (!email) errors.email = "Email is required";
        else if (!email.includes('@')) errors.email = "Email must be valid";

        if (!password) errors.password = "Password is required";
        else if (password.length < 6) errors.password = "Password must be at least 6 characters";

        if (password !== confirmPassword) errors.confirmPassword = "Passwords must match";

        return errors;
      }
    };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>

  <div id="form-container">
    <form id="registration-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Enter username">
        <div class="error-message" id="username-error"></div>
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Enter email">
        <div class="error-message" id="email-error"></div>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter password">
        <div class="error-message" id="password-error"></div>
      </div>

      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input type="password" id="confirm-password" name="confirmPassword" placeholder="Confirm password">
        <div class="error-message" id="confirm-password-error"></div>
      </div>

      <div class="form-group">
        <label>Interests</label>
        <div class="checkboxes">
          @foreach(interestOptions as interest)
            <div class="checkbox-item">
              <input type="checkbox" id="interest-{{ interest.toLowerCase().replace(' ', '-') }}" name="interests" value="{{ interest }}">
              <label for="interest-{{ interest.toLowerCase().replace(' ', '-') }}">{{ interest }}</label>
            </div>
          @endforeach
        </div>
      </div>

      <button type="submit" id="submit-button">Register</button>
    </form>
  </div>

  <div id="success-message" style="display: none;">
    <h2>Registration Successful!</h2>
    <p>Thank you for registering.</p>
    <button id="back-button">Back to Form</button>
  </div>
</body>
</html>
    `)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should handle form validation and submission with stx template', async () => {
    // Process the stx file
    const templatePath = path.join(TEMPLATE_DIR, 'form-template.stx')
    const { html } = await processTemplate(templatePath)

    // Set the HTML content to the document
    document.body.innerHTML = html

    // Get form elements
    const form = document.getElementById('registration-form') as HTMLFormElement
    const usernameInput = document.getElementById('username') as HTMLInputElement
    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement
    const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement
    const interestDevCheckbox = document.getElementById('interest-development') as HTMLInputElement
    const interestDesignCheckbox = document.getElementById('interest-design') as HTMLInputElement
    const successMessage = document.getElementById('success-message') as HTMLDivElement

    // Create an object to track validation errors and form state
    const formState = {
      formSubmitted: false,
      validationErrors: {} as Record<string, string>,
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        interests: [] as string[],
      },
    }

    // Add form submit handler with validation logic
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      // Update form data from input values
      formState.formData.username = usernameInput.value
      formState.formData.email = emailInput.value
      formState.formData.password = passwordInput.value
      formState.formData.confirmPassword = confirmPasswordInput.value
      formState.formData.interests = []

      // Collect selected interests
      document.querySelectorAll('input[name="interests"]:checked').forEach((checkbox) => {
        formState.formData.interests.push((checkbox as HTMLInputElement).value)
      })

      // Validate form
      const errors: Record<string, string> = {}
      const { username, email, password, confirmPassword } = formState.formData

      if (!username)
        errors.username = 'Username is required'
      else if (username.length < 3)
        errors.username = 'Username must be at least 3 characters'

      if (!email)
        errors.email = 'Email is required'
      else if (!email.includes('@'))
        errors.email = 'Email must be valid'

      if (!password)
        errors.password = 'Password is required'
      else if (password.length < 6)
        errors.password = 'Password must be at least 6 characters'

      if (password !== confirmPassword)
        errors.confirmPassword = 'Passwords must match'

      formState.validationErrors = errors

      // Clear previous error messages
      document.querySelectorAll('.error-message').forEach((el) => {
        el.textContent = ''
      })

      // Display validation errors if any
      if (Object.keys(errors).length > 0) {
        for (const [field, message] of Object.entries(errors)) {
          const errorEl = document.getElementById(`${field}-error`)
            || document.getElementById(`${field.toLowerCase()}-error`)
          if (errorEl) {
            errorEl.textContent = message
          }
        }
        return
      }

      // If form is valid, show success message
      formState.formSubmitted = true
      form.style.display = 'none'
      successMessage.style.display = 'block'
    })

    // Set up back button handler
    const backButton = document.getElementById('back-button') as HTMLButtonElement
    backButton?.addEventListener('click', () => {
      // Reset form and hide success message
      form.reset()
      formState.formSubmitted = false
      formState.formData = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        interests: [],
      }
      form.style.display = 'block'
      successMessage.style.display = 'none'
    })

    // Test invalid form submission
    form.__dispatchEvent_safe(new Event('submit'))

    // Check validation errors
    expect(Object.keys(formState.validationErrors).length).toBeGreaterThan(0)
    expect(formState.validationErrors.username).toBe('Username is required')
    expect(formState.validationErrors.email).toBe('Email is required')
    expect(formState.validationErrors.password).toBe('Password is required')

    // Check error messages in DOM
    const usernameError = document.getElementById('username-error')
    expect(usernameError?.textContent).toBe('Username is required')

    // Fill in invalid data
    usernameInput.value = 'ab' // Too short
    emailInput.value = 'invalid-email' // No @ symbol
    passwordInput.value = '12345' // Too short
    confirmPasswordInput.value = '123456' // Doesn't match

    // Submit form again
    form.__dispatchEvent_safe(new Event('submit'))

    // Check validation errors for invalid data
    expect(formState.validationErrors.username).toBe('Username must be at least 3 characters')
    expect(formState.validationErrors.email).toBe('Email must be valid')
    expect(formState.validationErrors.password).toBe('Password must be at least 6 characters')
    expect(formState.validationErrors.confirmPassword).toBe('Passwords must match')

    // Fill in valid data
    usernameInput.value = 'testuser'
    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'
    confirmPasswordInput.value = 'password123'
    interestDevCheckbox.checked = true
    interestDesignCheckbox.checked = true

    // Submit form with valid data
    form.__dispatchEvent_safe(new Event('submit'))

    // Check validation passes
    expect(Object.keys(formState.validationErrors).length).toBe(0)

    // Check form data was updated
    expect(formState.formData.username).toBe('testuser')
    expect(formState.formData.email).toBe('test@example.com')
    expect(formState.formData.password).toBe('password123')
    expect(formState.formData.confirmPassword).toBe('password123')
    expect(formState.formData.interests).toEqual(['Development', 'Design'])

    // Check form submission state
    expect(formState.formSubmitted).toBe(true)
    expect(form.style.display).toBe('none')
    expect(successMessage.style.display).toBe('block')

    // Test back button
    backButton.click()

    // Check form is reset
    expect(formState.formSubmitted).toBe(false)
    expect(form.style.display).toBe('block')
    expect(successMessage.style.display).toBe('none')
    expect(usernameInput.value).toBe('')
  })
})
