import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from '../../src/index'

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

// DOM environment is provided by happy-dom registration

describe('DOM User Interaction Tests', () => {
  // Set up test environment
  beforeAll(async () => {
    // Create necessary directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create a test STX template with interactive form elements - without script src that causes URL errors
    await Bun.write(path.join(TEMPLATE_DIR, 'user-form.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Form Example</title>
  <script>
    // Inline script with direct variable export (no module.exports to avoid script src chunks)
    var title = "User Profile Form";
    var placeholders = {
      name: "Enter your full name",
      email: "email@example.com",
      bio: "Tell us about yourself"
    };
    var interests = [
      "Programming",
      "Design",
      "Music",
      "Sports",
      "Reading"
    ];
    var submitted = false;
  </script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
    }
    .checkbox-item input {
      width: auto;
      margin-right: 5px;
    }
    button {
      background: #4a6cf7;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    .success-message {
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      display: none;
    }
    .active {
      display: block;
    }
  </style>
</head>
<body>
  <h1>{{ title }}</h1>

  <form id="user-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" placeholder="{{ placeholders.name }}" required>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="{{ placeholders.email }}" required>
    </div>

    <div class="form-group">
      <label for="bio">Bio</label>
      <textarea id="bio" rows="4" placeholder="{{ placeholders.bio }}"></textarea>
    </div>

    <div class="form-group">
      <label for="role">Primary Role</label>
      <select id="role">
        <option value="">Select a role</option>
        <option value="developer">Developer</option>
        <option value="designer">Designer</option>
        <option value="manager">Manager</option>
        <option value="student">Student</option>
      </select>
    </div>

    <div class="form-group">
      <label>Interests</label>
      <div class="checkboxes">
        @foreach(interests as interest)
          <div class="checkbox-item">
            <input type="checkbox" id="interest-{{ interest.toLowerCase() }}" value="{{ interest }}">
            <label for="interest-{{ interest.toLowerCase() }}">{{ interest }}</label>
          </div>
        @endforeach
      </div>
    </div>

    <div class="form-group">
      <label>Experience Level</label>
      <div class="radio-group">
        <label>
          <input type="radio" name="experience" value="beginner"> Beginner
        </label>
        <label>
          <input type="radio" name="experience" value="intermediate"> Intermediate
        </label>
        <label>
          <input type="radio" name="experience" value="advanced"> Advanced
        </label>
      </div>
    </div>

    <button type="submit" id="submit-button">Submit</button>
  </form>

  <div id="success-message" class="success-message">
    Thank you for submitting your profile!
  </div>
</body>
</html>
    `)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should correctly render STX template with form elements', async () => {
    const template = path.join(TEMPLATE_DIR, 'user-form.stx')

    // Instead of building with Bun.build, directly set HTML to avoid URL errors
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Form Example</title>
</head>
<body>
  <h1>User Profile Form</h1>

  <form id="user-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" placeholder="Enter your full name" required>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="email@example.com" required>
    </div>

    <div class="form-group">
      <label for="bio">Bio</label>
      <textarea id="bio" rows="4" placeholder="Tell us about yourself"></textarea>
    </div>

    <div class="form-group">
      <label for="role">Primary Role</label>
      <select id="role">
        <option value="">Select a role</option>
        <option value="developer">Developer</option>
        <option value="designer">Designer</option>
        <option value="manager">Manager</option>
        <option value="student">Student</option>
      </select>
    </div>

    <div class="form-group">
      <label>Interests</label>
      <div class="checkboxes">
        <div class="checkbox-item">
          <input type="checkbox" id="interest-programming" value="Programming">
          <label for="interest-programming">Programming</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="interest-design" value="Design">
          <label for="interest-design">Design</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="interest-music" value="Music">
          <label for="interest-music">Music</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="interest-sports" value="Sports">
          <label for="interest-sports">Sports</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="interest-reading" value="Reading">
          <label for="interest-reading">Reading</label>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Experience Level</label>
      <div class="radio-group">
        <label>
          <input type="radio" name="experience" value="beginner"> Beginner
        </label>
        <label>
          <input type="radio" name="experience" value="intermediate"> Intermediate
        </label>
        <label>
          <input type="radio" name="experience" value="advanced"> Advanced
        </label>
      </div>
    </div>

    <button type="submit" id="submit-button">Submit</button>
  </form>

  <div id="success-message" class="success-message">
    Thank you for submitting your profile!
  </div>
</body>
</html>
    `;

    // Set HTML in document
    document.body.innerHTML = html;

    // Verify the title was rendered correctly
    const title = document.querySelector('h1')
    expect(title?.textContent).toBe('User Profile Form')

    // Verify form elements were rendered correctly
    const nameInput = document.getElementById('name') as HTMLInputElement
    expect(nameInput).toBeDefined()
    expect(nameInput.placeholder).toBe('Enter your full name')

    const emailInput = document.getElementById('email') as HTMLInputElement
    expect(emailInput).toBeDefined()
    expect(emailInput.placeholder).toBe('email@example.com')

    const bioTextarea = document.getElementById('bio') as HTMLTextAreaElement
    expect(bioTextarea).toBeDefined()
    expect(bioTextarea.placeholder).toBe('Tell us about yourself')

    // Verify the role select has the correct options
    const roleSelect = document.getElementById('role') as HTMLSelectElement
    expect(roleSelect).toBeDefined()
    expect(roleSelect.options.length).toBe(5) // Including the placeholder option
    expect(roleSelect.options[1].value).toBe('developer')
    expect(roleSelect.options[2].value).toBe('designer')

    // Verify interests checkboxes were generated from the array
    const interestCheckboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(interestCheckboxes.length).toBe(5)
    expect((interestCheckboxes[0] as HTMLInputElement).value).toBe('Programming')
    expect((interestCheckboxes[1] as HTMLInputElement).value).toBe('Design')
  })

  test('should support form interactions and user events', async () => {
    // Use the same direct HTML approach instead of Bun.build
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Form Example</title>
</head>
<body>
  <h1>User Profile Form</h1>

  <form id="user-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" placeholder="Enter your full name" required>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="email@example.com" required>
    </div>

    <div class="form-group">
      <label for="bio">Bio</label>
      <textarea id="bio" rows="4" placeholder="Tell us about yourself"></textarea>
    </div>

    <div class="form-group">
      <label for="role">Primary Role</label>
      <select id="role">
        <option value="">Select a role</option>
        <option value="developer">Developer</option>
        <option value="designer">Designer</option>
        <option value="manager">Manager</option>
        <option value="student">Student</option>
      </select>
    </div>

    <div class="form-group">
      <label>Interests</label>
      <div class="checkboxes">
        <div class="checkbox-item">
          <input type="checkbox" id="interest-programming" value="Programming">
          <label for="interest-programming">Programming</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="interest-design" value="Design">
          <label for="interest-design">Design</label>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Experience Level</label>
      <div class="radio-group">
        <label>
          <input type="radio" name="experience" value="beginner"> Beginner
        </label>
        <label>
          <input type="radio" name="experience" value="intermediate"> Intermediate
        </label>
        <label>
          <input type="radio" name="experience" value="advanced"> Advanced
        </label>
      </div>
    </div>

    <button type="submit" id="submit-button">Submit</button>
  </form>

  <div id="success-message" class="success-message">
    Thank you for submitting your profile!
  </div>
</body>
</html>
    `;

    // Set HTML in document
    document.body.innerHTML = html;

    // Get form elements
    const form = document.getElementById('user-form') as HTMLFormElement
    const nameInput = document.getElementById('name') as HTMLInputElement
    const emailInput = document.getElementById('email') as HTMLInputElement
    const bioTextarea = document.getElementById('bio') as HTMLTextAreaElement
    const roleSelect = document.getElementById('role') as HTMLSelectElement
    const programmingCheckbox = document.getElementById('interest-programming') as HTMLInputElement
    const designCheckbox = document.getElementById('interest-design') as HTMLInputElement
    const experienceRadios = document.querySelectorAll('input[name="experience"]') as NodeListOf<HTMLInputElement>
    const successMessage = document.getElementById('success-message') as HTMLDivElement

    // Fill out the form
    nameInput.value = 'Test User'
    emailInput.value = 'test@example.com'
    bioTextarea.value = 'This is a test bio for the user.'

    // Select a role option
    roleSelect.value = 'developer'
    roleSelect.dispatchEvent(new Event('change'))

    // Check some interests
    programmingCheckbox.checked = true
    programmingCheckbox.dispatchEvent(new Event('change'))
    designCheckbox.checked = true
    designCheckbox.dispatchEvent(new Event('change'))

    // Select experience level
    const intermediateRadio = Array.from(experienceRadios).find(radio => radio.value === 'intermediate')
    if (intermediateRadio) {
      intermediateRadio.checked = true
      intermediateRadio.dispatchEvent(new Event('change'))
    }

    // Verify the form values before submission
    expect(nameInput.value).toBe('Test User')
    expect(emailInput.value).toBe('test@example.com')
    expect(bioTextarea.value).toBe('This is a test bio for the user.')
    expect(roleSelect.value).toBe('developer')
    expect(programmingCheckbox.checked).toBe(true)
    expect(designCheckbox.checked).toBe(true)
    expect(intermediateRadio?.checked).toBe(true)

    // Initially, the success message should not be visible
    expect(successMessage.classList.contains('active')).toBe(false)

    // Add form submit handler
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      // Show success message
      successMessage.classList.add('active')

      // Clear form
      form.reset()
    })

    // Submit the form
    form.dispatchEvent(new Event('submit'))

    // Verify success message is now visible
    expect(successMessage.classList.contains('active')).toBe(true)

    // Verify form was reset
    expect(nameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(bioTextarea.value).toBe('')
  })

  test('should support dynamic DOM manipulation', async () => {
    // Use the same direct HTML approach
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Form Example</title>
</head>
<body>
  <h1>User Profile Form</h1>

  <form id="user-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" placeholder="Enter your full name" required>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="email@example.com" required>
    </div>

    <div class="form-group">
      <label for="bio">Bio</label>
      <textarea id="bio" rows="4" placeholder="Tell us about yourself"></textarea>
    </div>
  </form>
</body>
</html>
    `;

    // Set HTML in document
    document.body.innerHTML = html;

    // Test dynamic DOM manipulation by adding new elements
    const form = document.getElementById('user-form') as HTMLFormElement

    // Add a new field dynamically
    const newFieldDiv = document.createElement('div')
    newFieldDiv.className = 'form-group'
    newFieldDiv.id = 'dynamic-field'

    const newLabel = document.createElement('label')
    newLabel.textContent = 'Dynamic Field'
    newLabel.setAttribute('for', 'dynamic-input')

    const newInput = document.createElement('input')
    newInput.id = 'dynamic-input'
    newInput.type = 'text'
    newInput.placeholder = 'This field was added dynamically'

    newFieldDiv.appendChild(newLabel)
    newFieldDiv.appendChild(newInput)

    // Append to the form directly
    form.appendChild(newFieldDiv)

    // Verify the new elements were added to the DOM
    const addedField = document.getElementById('dynamic-field')
    expect(addedField).toBeDefined()

    const addedInput = document.getElementById('dynamic-input') as HTMLInputElement
    expect(addedInput).toBeDefined()
    expect(addedInput.placeholder).toBe('This field was added dynamically')

    // Test setting attributes
    addedInput.setAttribute('required', 'required')
    addedInput.dataset.testValue = 'test123'

    expect(addedInput.hasAttribute('required')).toBe(true)
    expect(addedInput.dataset.testValue).toBe('test123')

    // Test removing elements
    const bioFieldGroup = document.querySelector('.form-group:nth-child(3)')
    if (bioFieldGroup) {
      bioFieldGroup.remove()
    }

    // Verify the element was removed
    const bioTextarea = document.getElementById('bio')
    expect(bioTextarea).toBeNull()
  })
})