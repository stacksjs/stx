import { expect, test, describe, beforeAll } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { processDirectives } from '../../src/process'
import { checkA11y, getScreenReaderOnlyStyle, processA11yDirectives, scanA11yIssues } from '../../src/a11y'
import { defaultConfig } from '../../src/config'
import path from 'node:path'
import fs from 'node:fs'

const TEST_DIR = path.join(import.meta.dir, 'templates')

// Create test directory if it doesn't exist
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true })
}

describe('Accessibility Features', () => {
  beforeAll(() => {
    // Create test files for scanning
    fs.writeFileSync(
      path.join(TEST_DIR, 'good-a11y.stx'),
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Good A11y Test</title>
      </head>
      <body>
        <h1>Accessible Page</h1>
        <img src="image.jpg" alt="An accessible image">
        <button aria-label="Close">X</button>
        <label>
          Name: <input type="text" id="name">
        </label>
      </body>
      </html>`
    )

    fs.writeFileSync(
      path.join(TEST_DIR, 'bad-a11y.stx'),
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bad A11y Test</title>
      </head>
      <body>
        <h1>Inaccessible Page</h1>
        <h3>Skipped heading level</h3>
        <img src="image.jpg">
        <button></button>
        <input type="text">
      </body>
      </html>`
    )
  })

  describe('A11y Directives', () => {
    test('should process @a11y directive', async () => {
      const template = `<div @a11y('aria-label')>This needs a label</div>`
      const result = processA11yDirectives(template, {}, 'test.stx', defaultConfig)

      expect(result).toContain('<!-- a11y-hint: Ensure interactive elements have accessible labels -->')
    })

    test('should process @a11y directive with custom message', async () => {
      const template = `<div @a11y('focus', 'Make sure this is keyboard focusable')>Keyboard-accessible element</div>`
      const result = processA11yDirectives(template, {}, 'test.stx', defaultConfig)

      expect(result).toContain('<!-- a11y-hint: Make sure this is keyboard focusable -->')
    })

    test('should process @screenReader directive', async () => {
      const template = `<div>Visible content @screenReader(Screen reader only text)@endScreenReader</div>`
      const result = processA11yDirectives(template, {}, 'test.stx', defaultConfig)

      expect(result).toContain('<span class="sr-only">Screen reader only text</span>')
    })

    test('should process @ariaDescribe directive', async () => {
      const template = `<button id="submit-btn">Submit</button>
      @ariaDescribe('submit-btn', 'This will submit the form and cannot be undone')`
      const result = processA11yDirectives(template, {}, 'test.stx', defaultConfig)

      expect(result).toContain('<span id="desc-submit-btn" class="sr-only">This will submit the form and cannot be undone</span>')
    })

    test('should generate proper screen reader only style', () => {
      const style = getScreenReaderOnlyStyle()

      expect(style).toContain('position: absolute')
      expect(style).toContain('width: 1px')
      expect(style).toContain('height: 1px')
      expect(style).toContain('clip: rect(0, 0, 0, 0)')
    })
  })

  describe('A11y Checks', () => {
    test('should detect missing alt text', async () => {
      const html = `<img src="test.jpg">`
      const violations = await checkA11y(html, 'test.stx')

      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('missing-alt')
    })

    test('should detect missing accessible names on interactive elements', async () => {
      const html = `<button></button>`
      const violations = await checkA11y(html, 'test.stx')

      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('missing-accessible-name')
    })

    test('should detect unlabeled form inputs', async () => {
      const html = `<input type="text">`
      const violations = await checkA11y(html, 'test.stx')

      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('input-missing-label')
    })

    test('should detect skipped heading levels', async () => {
      const html = `<h1>Title</h1><h3>Subtitle</h3>`
      const violations = await checkA11y(html, 'test.stx')

      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('heading-skip')
    })

    test('should detect missing language attribute', async () => {
      const html = `<html><body>Content</body></html>`
      const violations = await checkA11y(html, 'test.stx')

      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('missing-lang')
    })

    test('should not report issues for accessible content', async () => {
      const html = `
      <html lang="en">
        <body>
          <h1>Title</h1>
          <h2>Subtitle</h2>
          <img src="test.jpg" alt="Test image">
          <button aria-label="Close">X</button>
          <label>
            Name: <input type="text">
          </label>
        </body>
      </html>`;

      const violations = await checkA11y(html, 'test.stx')
      expect(violations.length).toBe(0)
    })
  })

  describe('A11y File Scanning', () => {
    test('should scan files for a11y issues', async () => {
      const results = await scanA11yIssues(TEST_DIR)

      // The good file should have no issues
      expect(Object.keys(results).length).toBeGreaterThan(0)

      // Get the relative paths
      const filePaths = Object.keys(results).map(p => path.basename(p))

      // Good file should not be in results (no violations)
      expect(filePaths).not.toContain('good-a11y.stx')

      // Bad file should have violations
      expect(filePaths).toContain('bad-a11y.stx')

      // The bad file should have multiple issues
      const badFileKey = Object.keys(results).find(p => p.endsWith('bad-a11y.stx'))
      if (badFileKey) {
        const violations = results[badFileKey]
        expect(violations.length).toBeGreaterThan(2)

        // Check for specific violation types
        const violationTypes = violations.map(v => v.type)
        expect(violationTypes).toContain('missing-alt')
        expect(violationTypes).toContain('missing-accessible-name')
        expect(violationTypes).toContain('input-missing-label')
        expect(violationTypes).toContain('missing-lang')
      }
    })
  })

  describe('Integration with Template Processing', () => {
    test('should process a11y directives during template rendering', async () => {
      const template = `
      <div>
        <button @a11y('aria-label')></button>
        @screenReader(This is only for screen readers)@endScreenReader
      </div>`

      const result = await processDirectives(template, {}, 'test.stx', defaultConfig, new Set())

      expect(result).toContain('<!-- a11y-hint: Ensure interactive elements have accessible labels -->')
      expect(result).toContain('<span class="sr-only">This is only for screen readers</span>')
    })

    test('should work with other directives', async () => {
      const template = `
      <div>
        @if(true)
          <button @a11y('aria-label')>Click me</button>
        @endif

        @foreach([1, 2] as item)
          <p @a11y('aria-label', 'Item {{item}} description')>Item {{item}}</p>
        @endforeach
      </div>`

      const result = await processDirectives(template, {}, 'test.stx', defaultConfig, new Set())

      expect(result).toContain('<!-- a11y-hint: Ensure interactive elements have accessible labels -->')
      expect(result).toContain('<!-- a11y-hint: Item 1 description -->')
      expect(result).toContain('<!-- a11y-hint: Item 2 description -->')
      expect(result).toContain('Item 1')
      expect(result).toContain('Item 2')
    })
  })
})