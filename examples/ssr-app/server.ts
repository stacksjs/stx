/**
 * STX SSR Example - Traditional Server-Rendered Web App
 *
 * Run with: bun run examples/ssr-app/server.ts
 */

import { createApp } from '../../packages/stx/src/ssr'

const app = createApp({
  viewsDir: './examples/ssr-app/views',
  sessionSecret: 'my-secret-key-change-in-production',
})

// Home page
app.get('/', async (ctx) => {
  return app.render('home.stx', {
    title: 'Welcome to STX SSR',
  }, ctx)
})

// Login page
app.get('/login', async (ctx) => {
  return app.render('login.stx', {
    title: 'Login',
  }, ctx)
})

// Handle login form submission
app.post('/login', async (ctx) => {
  const form = await ctx.formData()
  const email = form.email as string
  const password = form.password as string

  // Simple validation
  const errors: Record<string, string[]> = {}

  if (!email) {
    errors.email = ['Email is required']
  }
  if (!password) {
    errors.password = ['Password is required']
  }

  if (Object.keys(errors).length > 0) {
    return app.back(ctx, errors, { email })
  }

  // Fake authentication (replace with real auth)
  if (email === 'user@example.com' && password === 'password') {
    ctx.session.set('user', {
      id: 1,
      name: 'John Doe',
      email: email,
    })
    return app.redirect('/dashboard')
  }

  return app.back(ctx, { email: ['Invalid credentials'] }, { email })
})

// Dashboard (protected)
app.get('/dashboard', async (ctx) => {
  if (!ctx.isAuthenticated()) {
    return app.redirect('/login')
  }

  const user = ctx.user() as { name: string, email: string }

  return app.render('dashboard.stx', {
    title: 'Dashboard',
    user,
  }, ctx)
})

// Logout
app.post('/logout', async (ctx) => {
  ctx.session.destroy()
  return app.redirect('/')
})

// Start server
const server = app.listen(3000)
console.log(`SSR app running at http://localhost:3000`)
