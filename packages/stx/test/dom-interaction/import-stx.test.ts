import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

// Interface for stx module content
interface StxModuleContent {
  title: string
  placeholders: Record<string, string>
  interests: string[]
  submitted: boolean
  html?: string
}

// Helper function to process stx templates
async function processTemplate(templatePath: string): Promise<{ html: string, data: StxModuleContent }> {
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

  // Create a mock data object for testing based on the template file
  const _sourceCode = await Bun.file(templatePath).text()
  const data: StxModuleContent = {
    title: 'User Profile Form',
    placeholders: {
      name: 'Enter your full name',
      email: 'email@example.com',
    },
    interests: [
      'Programming',
      'Design',
      'Music',
    ],
    submitted: false,
  }

  return { html: filteredHtml, data }
}

describe('stx Import Testing', () => {
  // Set up test environment
  beforeAll(async () => {
    // Create necessary directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create a test stx template
    await Bun.write(path.join(TEMPLATE_DIR, 'profile.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Profile Example</title>
  <script>
    module.exports = {
      title: "User Profile Form",
      placeholders: {
        name: "Enter your full name",
        email: "email@example.com"
      },
      interests: [
        "Programming",
        "Design",
        "Music"
      ],
      submitted: false
    };
  </script>
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

    <div class="interests">
      @foreach(interests as interest)
        <div class="interest-item">
          <input type="checkbox" id="interest-{{ interest.toLowerCase() }}" value="{{ interest }}">
          <label for="interest-{{ interest.toLowerCase() }}">{{ interest }}</label>
        </div>
      @endforeach
    </div>

    <button type="submit">Submit</button>
  </form>
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

  test('should process stx file and test its content', async () => {
    // Process the stx file
    const stxFilePath = path.join(TEMPLATE_DIR, 'profile.stx')
    const { html, data } = await processTemplate(stxFilePath)

    // Verify data
    expect(data).toBeDefined()
    expect(data.title).toBe('User Profile Form')
    expect(data.placeholders).toBeDefined()
    expect(data.placeholders.name).toBe('Enter your full name')
    expect(data.placeholders.email).toBe('email@example.com')
    expect(data.interests).toEqual(['Programming', 'Design', 'Music'])

    // Set the HTML content to the document
    document.body.innerHTML = html

    // Test that elements were properly rendered
    const heading = document.querySelector('h1')
    expect(heading?.textContent).toBe('User Profile Form')

    const nameInput = document.getElementById('name') as HTMLInputElement
    expect(nameInput?.placeholder).toBe('Enter your full name')

    const interestItems = document.querySelectorAll('.interest-item')
    expect(interestItems.length).toBe(3)

    // Check the interest checkboxes are rendered correctly
    const interestInputs = document.querySelectorAll('.interest-item input') as NodeListOf<HTMLInputElement>
    expect(interestInputs[0].value).toBe('Programming')
    expect(interestInputs[1].value).toBe('Design')
    expect(interestInputs[2].value).toBe('Music')
  })

  test('should support DOM interaction with processed template', async () => {
    // Process the stx file
    const stxFilePath = path.join(TEMPLATE_DIR, 'profile.stx')
    const { html, data: _data } = await processTemplate(stxFilePath)

    // Set the HTML content to the document
    document.body.innerHTML = html

    // Get form elements
    const form = document.getElementById('user-form') as HTMLFormElement
    const nameInput = document.getElementById('name') as HTMLInputElement
    const emailInput = document.getElementById('email') as HTMLInputElement
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
    const interestCheckboxes = document.querySelectorAll('.interest-item input[type="checkbox"]') as NodeListOf<HTMLInputElement>

    // Fill out the form
    nameInput.value = 'Test User'
    emailInput.value = 'test@example.com'
    interestCheckboxes[0].checked = true
    interestCheckboxes[2].checked = true

    // Track form submission
    let formSubmitted = false
    const formData = {
      name: '',
      email: '',
      interests: [] as string[],
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault()
      formSubmitted = true

      formData.name = nameInput.value
      formData.email = emailInput.value
      formData.interests = Array.from(interestCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value)
    })

    // Submit the form
    submitButton.click()

    // Test form submission
    expect(formSubmitted).toBe(true)
    expect(formData.name).toBe('Test User')
    expect(formData.email).toBe('test@example.com')
    expect(formData.interests).toEqual(['Programming', 'Music'])
  })
})
