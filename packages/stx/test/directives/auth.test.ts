import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('stx Auth Directives', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('should properly handle @auth and @guest directives', async () => {
    const testFile = await createTestFile('auth-guest.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Auth/Guest Test</title>
        <script>
          module.exports = {
            auth: {
              check: true,
              user: { name: 'John Doe', email: 'john@example.com' }
            }
          };
        </script>
      </head>
      <body>
        <h1>Authentication Test</h1>

        <!-- Auth directive with authenticated user -->
        @auth
          <div class="user-info">
            <p>Welcome, {{ auth.user.name }}</p>
            <a href="/logout">Logout</a>
          </div>
        @else
          <div class="login-form">
            <p>Please log in</p>
            <form><!-- login form --></form>
          </div>
        @endauth

        <!-- Guest directive with authenticated user -->
        @guest
          <div class="guest-message">Hello Guest! Please sign in.</div>
        @else
          <div class="member-content">You are signed in as {{ auth.user.email }}</div>
        @endguest
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // For @auth directive
    expect(outputHtml).toContain('<div class="user-info">')
    expect(outputHtml).toContain('<p>Welcome, John Doe</p>')
    expect(outputHtml).toContain('<a href="/logout">Logout</a>')
    expect(outputHtml).not.toContain('<div class="login-form">')
    expect(outputHtml).not.toContain('<p>Please log in</p>')

    // For @guest directive
    expect(outputHtml).not.toContain('<div class="guest-message">Hello Guest! Please sign in.</div>')
    expect(outputHtml).toContain('<div class="member-content">You are signed in as john@example.com</div>')
    expect(true).toBe(true)
  })

  it('should properly handle @auth and @guest when user is not authenticated', async () => {
    const testFile = await createTestFile('auth-guest-unauthenticated.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Auth/Guest Unauthenticated Test</title>
        <script>
          module.exports = {
            auth: {
              check: false,
              user: null
            }
          };
        </script>
      </head>
      <body>
        <h1>Unauthenticated Test</h1>

        <!-- Auth directive with unauthenticated user -->
        @auth
          <div class="user-info">
            <p>Welcome, {{ auth.user.name }}</p>
            <a href="/logout">Logout</a>
          </div>
        @else
          <div class="login-form">
            <p>Please log in</p>
            <form><!-- login form --></form>
          </div>
        @endauth

        <!-- Guest directive with unauthenticated user -->
        @guest
          <div class="guest-message">Hello Guest! Please sign in.</div>
        @else
          <div class="member-content">You are signed in</div>
        @endguest
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // For @auth directive
    expect(outputHtml).not.toContain('<div class="user-info">')
    expect(outputHtml).not.toContain('Welcome')
    expect(outputHtml).not.toContain('Logout')
    expect(outputHtml).toContain('<div class="login-form">')
    expect(outputHtml).toContain('<p>Please log in</p>')

    // For @guest directive
    expect(outputHtml).toContain('<div class="guest-message">Hello Guest! Please sign in.</div>')
    expect(outputHtml).not.toContain('<div class="member-content">You are signed in</div>')
    expect(true).toBe(true)
  })

  it('should properly handle @can and @cannot directives', async () => {
    const testFile = await createTestFile('can-cannot.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Can/Cannot Test</title>
        <script>
          module.exports = {
            userCan: {
              edit: true,
              delete: false,
              view: true,
              publish: false,
              approve: false
            }
          };
        </script>
      </head>
      <body>
        <h1>Permission Test</h1>

        <!-- Simple can directive -->
        @can('edit')
          <button class="edit-btn">Edit Post</button>
        @endcan

        <!-- Can directive with else -->
        @can('delete')
          <button class="delete-btn">Delete Post</button>
        @else
          <p class="permission-denied">You cannot delete this post</p>
        @endcan

        <!-- Cannot directive -->
        @cannot('delete')
          <p class="delete-notice">Delete permission is required</p>
        @endcannot

        <!-- Cannot with else -->
        @cannot('view')
          <p class="view-notice">You need view permission</p>
        @else
          <div class="content">Content is visible to you</div>
        @endcannot

        <!-- Elsecan directive -->
        @can('approve')
          <button class="approve-btn">Approve</button>
        @elsecan('edit')
          <button class="suggest-edit-btn">Suggest Edits</button>
        @else
          <p class="no-action">No actions available</p>
        @endcan

        <!-- Elsecannot directive -->
        @cannot('publish')
          <p class="draft-notice">This is in draft mode</p>
        @elsecannot('approve')
          <p class="pending-notice">This is pending approval</p>
        @else
          <p class="public-notice">This is published</p>
        @endcannot
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Simple can directive
    expect(outputHtml).toContain('<button class="edit-btn">Edit Post</button>')

    // Can directive with else
    expect(outputHtml).not.toContain('<button class="delete-btn">Delete Post</button>')
    expect(outputHtml).toContain('<p class="permission-denied">You cannot delete this post</p>')

    // Cannot directive
    expect(outputHtml).toContain('<p class="delete-notice">Delete permission is required</p>')

    // Cannot with else
    expect(outputHtml).not.toContain('<p class="view-notice">You need view permission</p>')
    expect(outputHtml).toContain('<div class="content">Content is visible to you</div>')

    // Elsecan directive
    expect(outputHtml).not.toContain('<button class="approve-btn">Approve</button>')
    expect(outputHtml).toContain('<button class="suggest-edit-btn">Suggest Edits</button>')
    expect(outputHtml).not.toContain('<p class="no-action">No actions available</p>')

    // Elsecannot directive
    expect(outputHtml).toContain('<p class="draft-notice">This is in draft mode</p>')
    expect(outputHtml).not.toContain('<p class="pending-notice">This is pending approval</p>')
    expect(outputHtml).not.toContain('<p class="public-notice">This is published</p>')
    expect(true).toBe(true)
  })

  it('should handle @can with complex parameters', async () => {
    const testFile = await createTestFile('can-complex.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Can Complex Test</title>
        <script>
          module.exports = {
            permissions: {
              check: function(action, type, id) {
                if (action === 'edit' && type === 'post' && id === 1) return true;
                if (action === 'edit' && type === 'post' && id === 2) return false;
                if (action === 'delete' && type === 'comment') return true;
                return false;
              }
            },
            post: { id: 1, title: 'First Post' },
            comment: { id: 5, text: 'Great post!' }
          };
        </script>
      </head>
      <body>
        <h1>Complex Permission Test</h1>

        <!-- Can with multiple parameters -->
        @can('edit', 'post', post.id)
          <button class="edit-post">Edit Post #{{ post.id }}</button>
        @endcan

        <!-- Check a different ID -->
        @can('edit', 'post', 2)
          <button class="edit-post-2">Edit Post #2</button>
        @else
          <p class="no-edit-post-2">You cannot edit Post #2</p>
        @endcan

        <!-- Check different action type -->
        @can('delete', 'comment', comment.id)
          <button class="delete-comment">Delete Comment</button>
        @endcan

        <!-- Check a permission that doesn't exist -->
        @can('moderate', 'forum')
          <button class="moderate">Moderate Forum</button>
        @else
          <p class="no-moderate">No moderation privileges</p>
        @endcan
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Can with multiple parameters
    expect(outputHtml).toContain('<button class="edit-post">Edit Post #1</button>')

    // Check a different ID
    expect(outputHtml).not.toContain('<button class="edit-post-2">Edit Post #2</button>')
    expect(outputHtml).toContain('<p class="no-edit-post-2">You cannot edit Post #2</p>')

    // Check different action type
    expect(outputHtml).toContain('<button class="delete-comment">Delete Comment</button>')

    // Check a permission that doesn't exist
    expect(outputHtml).not.toContain('<button class="moderate">Moderate Forum</button>')
    expect(outputHtml).toContain('<p class="no-moderate">No moderation privileges</p>')
    expect(true).toBe(true)
  })
})
