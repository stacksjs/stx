/**
 * Fullstack Dev Server Example with API Routes
 *
 * This demonstrates using .stx files alongside API endpoints,
 * following the Bun.serve() fullstack pattern.
 */

import { serve } from 'bun'

import about from './pages/about.stx'
import contact from './pages/contact.stx'
// Import .stx files as routes
import home from './pages/home.stx'

// Mock database (in real app, use a real database)
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]

const server = serve({
  routes: {
    // ** HTML/.stx routes **
    '/': home,
    '/about': about,
    '/contact': contact,

    // ** API endpoints **
    '/api/users': {
      async GET(_req) {
        return Response.json(users)
      },
      async POST(req) {
        const body = await req.json()
        const newUser = {
          id: users.length + 1,
          name: body.name,
          email: body.email,
        }
        users.push(newUser)
        return Response.json(newUser)
      },
    },
    '/api/users/:id': async (req) => {
      const { id } = req.params
      const user = users.find(u => u.id === Number(id))

      if (!user) {
        return new Response('User not found', { status: 404 })
      }

      return Response.json(user)
    },
  },

  development: true,

  fetch(_req) {
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`🚀 Server running at ${server.url}`)
console.log('\n📄 Pages:')
console.log(`   ${server.url}`)
console.log(`   ${server.url}about`)
console.log(`   ${server.url}contact`)
console.log('\n🔌 API Endpoints:')
console.log(`   GET  ${server.url}api/users`)
console.log(`   POST ${server.url}api/users`)
console.log(`   GET  ${server.url}api/users/:id`)
console.log('\n💡 Press Ctrl+C to stop\n')
