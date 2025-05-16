import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateCsrfToken, resetCsrfToken, setCsrfToken, verifyCsrfToken } from '../../src/csrf'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, setupTestDirs } from '../utils'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

// Helper function to process a template with our test options
async function processTemplate(template: string, context: Record<string, any> = {}, filePath: string = 'test.stx', options: StxOptions = defaultOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('STX Security Tests', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  beforeEach(() => {
    resetCsrfToken()
  })

  describe('XSS Prevention', () => {
    it('should escape HTML in curly braces expressions by default', async () => {
      const maliciousScript = '<script>alert("XSS")</script>'

      const template = `<div>{{ scriptContent }}</div>`
      const result = await processTemplate(template, { scriptContent: maliciousScript })

      // The script content should be escaped
      expect(result).not.toContain(maliciousScript)
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&gt;')
    })

    it('should allow unescaped HTML with triple braces', async () => {
      const htmlContent = '<strong>Bold Text</strong>'

      const template = `<div>{{{ htmlContent }}}</div>`
      const result = await processTemplate(template, { htmlContent })

      // The HTML should be rendered unescaped
      expect(result).toContain(htmlContent)
    })

    it('should escape HTML in attribute expressions', async () => {
      const maliciousAttr = '" onmouseover="alert(\'XSS\')" "'

      const template = `<div id="{{ attributeContent }}">Content</div>`
      const result = await processTemplate(template, { attributeContent: maliciousAttr })

      // The attribute should be properly HTML escaped (may still contain the attack vector but escaped)
      expect(result).toContain('&quot;') // Escaped quotes
      expect(result).toContain('&#039;') // Escaped single quotes
      // The resulting HTML should not be executable JS
      expect(result).not.toContain('" onmouseover="alert(\'XSS\')" "')
    })

    it('should escape HTML in data passed to directives', async () => {
      const xssInDirective = '<script>alert("XSS")</script>'

      const template = `
      @if(showContent)
        <div>{{ content }}</div>
      @endif
      `
      const result = await processTemplate(template, {
        showContent: true,
        content: xssInDirective,
      })

      // The content should be escaped
      expect(result).not.toContain(xssInDirective)
      expect(result).toContain('&lt;script&gt;')
    })
  })

  describe('CSRF Protection', () => {
    it('should automatically generate a CSRF token when using @csrf directive', async () => {
      const template = `<form method="POST">@csrf</form>`
      const result = await processTemplate(template)

      expect(result).toMatch(/<input type="hidden" name="_token" value="[a-f0-9]+"/)
    })

    it('should use the same token value for multiple @csrf directives', async () => {
      const template = `
      <form method="POST" action="/form1">
        @csrf
      </form>
      <form method="POST" action="/form2">
        @csrf
      </form>
      `
      const result = await processTemplate(template)

      // Extract both token values
      const tokenMatches = result.match(/value="([a-f0-9]+)"/g)
      expect(tokenMatches?.length).toBe(2)

      // Both should have same token value
      expect(tokenMatches![0]).toBe(tokenMatches![1])
    })

    it('should properly verify token matches', async () => {
      const token = 'secure-token-123456'
      setCsrfToken(token)

      // Correct token should verify
      expect(verifyCsrfToken(token)).toBe(true)

      // Different token should fail
      resetCsrfToken()
      setCsrfToken('different-token-123')
      expect(verifyCsrfToken(token)).toBe(false)
    })

    it('should generate cryptographically secure tokens', async () => {
      // Generate multiple tokens and ensure they're different
      const tokens = new Set<string>()
      for (let i = 0; i < 10; i++) {
        tokens.add(generateCsrfToken())
      }

      // All 10 tokens should be unique
      expect(tokens.size).toBe(10)

      // Each token should be at least 20 chars for security
      for (const token of tokens) {
        expect(token.length).toBeGreaterThanOrEqual(20)
      }
    })
  })

  describe('HTML Sanitization', () => {
    it('should sanitize expressions that may create JavaScript events', async () => {
      const template = `
      <div id="content">
        <a href="{{ url }}">Click me</a>
      </div>
      `

      // Test with potential JavaScript URL
      const result = await processTemplate(template, {
        url: 'javascript:alert("XSS")',
      })

      // JavaScript URL might be present but should be escaped
      expect(result).not.toContain('javascript:alert("XSS")')
      expect(result).toContain('javascript:alert(&quot;XSS&quot;)')
    })

    it('should escape nested XSS vectors', async () => {
      const maliciousData = {
        user: {
          name: '<script>alert("XSS")</script>',
          profile: {
            bio: '<img src="x" onerror="alert(\'nested-xss\')">',
          },
        },
      }

      const template = `
      <div>
        <h1>{{ user.name }}</h1>
        <p>{{ user.profile.bio }}</p>
      </div>
      `

      const result = await processTemplate(template, maliciousData)

      // Both levels of nesting should be properly escaped
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&lt;/script&gt;')
      expect(result).toContain('&lt;img')
      expect(result).toContain('onerror=')

      // No unescaped tags should be present
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
      expect(result).not.toContain('<img src="x" onerror=')
    })

    it('should handle data structures with prototype properties safely', async () => {
      // Complex nested object with prototype properties
      const nestedData = {
        user: {
          name: 'Test User',
          bio: '<script>alert("bio")</script>',
        },
        __proto__: {
          polluted: true,
        },
        constructor: {
          prototype: {
            polluted: true,
          },
        },
      }

      const template = `
      <div>
        <h1>{{ user.name }}</h1>
        <p>{{ user.bio }}</p>
        <!-- Prototype access behavior varies by implementation -->
        <p>proto: {{ __proto__.polluted }}</p>
        <p>constructor: {{ constructor.prototype.polluted }}</p>
      </div>
      `

      const result = await processTemplate(template, nestedData)

      // User data should be rendered but script tags should be escaped
      expect(result).toContain('Test User')
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&lt;/script&gt;')

      // Ensure no executable script tags
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
    })
  })

  describe('Template Injection', () => {
    it('should not compile user-provided template strings', async () => {
      // A template that contains STX directive syntax provided by a user
      const userProvidedTemplate = '@if(true)<script>alert("Injected!")</script>@endif'

      const template = `
      <div>
        <h1>User Content:</h1>
        <div class="user-content">{{ userContent }}</div>
      </div>
      `

      const result = await processTemplate(template, { userContent: userProvidedTemplate })

      // The directive should not be interpreted, just escaped and displayed
      expect(result).toContain('@if(true)')
      expect(result).not.toContain('<script>alert("Injected!")</script>')
    })

    it('should not allow execution of dynamic code through expressions', async () => {
      // A test for potential string evaluation as code
      const template = `
      <div>
        <!-- This should show the string, not evaluate it as template -->
        {{ badTemplate }}
      </div>
      `

      const result = await processTemplate(template, {
        badTemplate: '{{ secretValue }}',
        secretValue: 'SECRET DATA',
      })

      // The expression should be treated as a string, not evaluated
      expect(result).toContain('{{ secretValue }}')
      expect(result).not.toContain('SECRET DATA')
    })
  })

  describe('Integration Security Tests', () => {
    it('should handle basic security features correctly', async () => {
      // Create a simpler test that doesn't rely on the template having specific behaviors
      const template = `
      <form method="POST" action="/submit">
        @csrf

        <div class="user-content">
          <h1>{{ username }}</h1>
          <div>{{{ allowedHtml }}}</div>
        </div>

        <input type="text" name="search" value="{{ searchQuery }}">
        <button type="submit">Submit</button>
      </form>
      `

      const context = {
        username: '<script>alert("xss")</script>User',
        allowedHtml: '<strong>Allowed HTML</strong>',
        searchQuery: '" onfocus="alert(\'attack\')" "',
      }

      const result = await processTemplate(template, context)

      // Check CSRF token exists
      expect(result).toMatch(/<input type="hidden" name="_token" value="[a-f0-9]+"/)

      // Check HTML is escaped properly in text context
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&lt;/script&gt;')

      // Check explicitly unescaped HTML works
      expect(result).toContain('<strong>Allowed HTML</strong>')

      // Check attribute context is escaped
      expect(result).toContain('value="')
      expect(result).toContain('&quot;')
      expect(result).toContain('onfocus=')
    })
  })
})
