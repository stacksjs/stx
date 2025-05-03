import { describe, test, expect, beforeEach } from 'bun:test'
import { StxOptions } from '../../src/types'
import { processDirectives } from '../../src/process'
import { resetCsrfToken, setCsrfToken } from '../../src/csrf'
import { defineRoute, resetRoutes } from '../../src/routes'
import { clearComposers, composer } from '../../src/view-composers'

// Helper function to process a template with our test options
async function processTemplate(template: string, context: Record<string, any>, filePath: string, options: StxOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('Laravel-like Features', () => {
  const options: StxOptions = {
    debug: false,
    componentsDir: 'components',
  }

  describe('View Composers', () => {
    beforeEach(() => {
      clearComposers()
    })

    test('composers can add data to all views matching a specific name', async () => {
      // Register a composer
      composer('test-view', (context) => {
        context.title = 'Composed Title'
        context.viewSpecific = 'This data was added by a composer'
      })

      // Process a template with the name
      const template = '{{ title }} - {{ viewSpecific }}'
      const result = await processTemplate(template, {}, 'test-view.stx', options)

      expect(result).toBe('Composed Title - This data was added by a composer')
    })

    test('composers work with full file paths', async () => {
      // Register a composer for a specific path
      composer('/views/user/profile.stx', (context) => {
        context.userName = 'John Doe'
      })

      // Process a template with that path
      const template = 'Hello, {{ userName }}!'
      const result = await processTemplate(template, {}, '/views/user/profile.stx', options)

      expect(result).toBe('Hello, John Doe!')
    })
  })

  describe('Environment Directives', () => {
    test('@production directive works correctly', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV

      try {
        // Set environment to production
        process.env.NODE_ENV = 'production'

        const template = `
        @production
          <script>console.log('Production mode')</script>
        @else
          <script>console.log('Development mode')</script>
        @endproduction
        `

        const result = await processTemplate(template, {}, 'env-test.stx', options)
        expect(result.trim()).toBe('<script>console.log(\'Production mode\')</script>')

        // Test with different environment
        process.env.NODE_ENV = 'development'
        const devResult = await processTemplate(template, {}, 'env-test.stx', options)
        expect(devResult.trim()).toBe('<script>console.log(\'Development mode\')</script>')
      }
      finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
    })

    test('@development directive works correctly', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV

      try {
        // Set environment to development
        process.env.NODE_ENV = 'development'

        const template = `
        @development
          <div>Development Tools</div>
        @else
          <div>Production Mode</div>
        @enddevelopment
        `

        const result = await processTemplate(template, {}, 'env-test.stx', options)
        expect(result.trim()).toBe('<div>Development Tools</div>')
      }
      finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
    })
  })

  describe('CSRF Protection', () => {
    beforeEach(() => {
      resetCsrfToken()
    })

    test('@csrf directive adds CSRF token field to forms', async () => {
      // Set a fixed token for testing
      setCsrfToken('test-csrf-token')

      const template = '<form>@csrf</form>'
      const result = await processTemplate(template, {}, 'form.stx', options)

      expect(result).toBe('<form><input type="hidden" name="_token" value="test-csrf-token"></form>')
    })

    test('@csrf directive with custom name works', async () => {
      setCsrfToken('custom-token-value')

      const template = '<form>@csrf("csrf_token")</form>'
      const result = await processTemplate(template, {}, 'form.stx', options)

      expect(result).toBe('<form><input type="hidden" name="csrf_token" value="custom-token-value"></form>')
    })
  })

  describe('Form Method Spoofing', () => {
    test('@method directive adds method spoofing for non-standard HTTP methods', async () => {
      const template = '<form method="POST">@method("PUT")</form>'
      const result = await processTemplate(template, {}, 'form.stx', options)

      expect(result).toBe('<form method="POST"><input type="hidden" name="_method" value="PUT"></form>')
    })

    test('@method directive with custom field name works', async () => {
      const template = '<form method="POST">@method("DELETE", "http_method")</form>'
      const result = await processTemplate(template, {}, 'form.stx', options)

      expect(result).toBe('<form method="POST"><input type="hidden" name="http_method" value="DELETE"></form>')
    })

    test('@method directive does nothing for standard HTTP methods', async () => {
      const template = '<form method="POST">@method("POST")</form>'
      const result = await processTemplate(template, {}, 'form.stx', options)

      expect(result).toBe('<form method="POST"></form>')
    })
  })

  describe('Named Routes', () => {
    beforeEach(() => {
      resetRoutes()
    })

    test('@route directive generates URLs for named routes', async () => {
      // Define some routes
      defineRoute('home', '/')
      defineRoute('users.show', '/users/:id')
      defineRoute('posts.show', '/posts/:id/comments/:commentId')

      const template = `
      <a href="@route('home')">Home</a>
      <a href="@route('users.show', {id: 1})">User 1</a>
      <a href="@route('posts.show', {id: 5, commentId: 10})">Post 5, Comment 10</a>
      `

      const result = await processTemplate(template, {}, 'routes.stx', options)

      expect(result).toContain('<a href="/">Home</a>')
      expect(result).toContain('<a href="/users/1">User 1</a>')
      expect(result).toContain('<a href="/posts/5/comments/10">Post 5, Comment 10</a>')
    })

    test('@route directive handles query parameters', async () => {
      defineRoute('search', '/search')

      const template = '<a href="@route(\'search\', {q: \'test query\', page: 2})">Search</a>'
      const result = await processTemplate(template, {}, 'routes.stx', options)

      expect(result).toBe('<a href="/search?q=test%20query&page=2">Search</a>')
    })

    test('@route directive returns error placeholder for undefined routes', async () => {
      const template = '<a href="@route(\'undefined\')">Undefined</a>'
      const result = await processTemplate(template, {}, 'routes.stx', options)

      expect(result).toBe('<a href="#undefined-route">Undefined</a>')
    })
  })
})