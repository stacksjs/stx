// Example server demonstrating stx streaming functionality

import { createStreamRenderer } from '../../src/streaming'

interface UserData {
  name: string
  role: string
  avatar: string
}

interface StatItem {
  label: string
  value: number
}

interface Stats {
  items: StatItem[]
}

interface ActivityItem {
  time: string
  description: string
  user: string
}

interface Notification {
  id: number
  message: string
  read: boolean
}

// Mock data fetch functions (in a real app, these would hit a database or API)
async function fetchUserData(): Promise<UserData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return {
    name: 'Jane Doe',
    role: 'Admin',
    avatar: 'https://example.com/avatar.jpg',
  }
}

async function fetchStats(): Promise<Stats> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    items: [
      { label: 'Users', value: 1284 },
      { label: 'Posts', value: 5462 },
      { label: 'Comments', value: 23156 },
    ],
  }
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  return [
    { time: '10:45', description: 'New user registered', user: 'John Smith' },
    { time: '09:32', description: 'Comment posted', user: 'Emma Wilson' },
    { time: '08:17', description: 'Post published', user: 'Michael Brown' },
  ]
}

async function fetchNotifications(): Promise<Notification[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700))
  return [
    { id: 1, message: 'Your post was featured', read: false },
    { id: 2, message: 'New comment on your post', read: true },
    { id: 3, message: 'System maintenance scheduled', read: false },
  ]
}

// Main server function
async function startServer(): Promise<void> {
  // Initialize stream renderer for dashboard template
  const renderer = await createStreamRenderer('templates/dashboard.stx')

  // Create server
  const server = Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === '/dashboard') {
        // Use streaming for dashboard
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // Initial data and shell
              const userData = await fetchUserData()
              const initialData = {
                title: 'Dashboard',
                user: userData,
              }

              // Render the shell first for fast initial load
              const shell = await renderer.renderShell(initialData)
              controller.enqueue(shell)

              // Render header section (quick to load)
              const header = await renderer.renderSection('header', { user: userData })
              controller.enqueue(header)

              // Fetch stats and render when available
              const stats = await fetchStats()
              const statsSection = await renderer.renderSection('stats', { stats })
              controller.enqueue(statsSection)

              // Fetch both activity and notifications in parallel
              const [activity, notifications] = await Promise.all([
                fetchRecentActivity(),
                fetchNotifications(),
              ])

              // Render remaining sections
              const activitySection = await renderer.renderSection('activity', { activity })
              controller.enqueue(activitySection)

              const notificationsSection = await renderer.renderSection('notifications', { notifications })
              controller.enqueue(notificationsSection)

              // Complete the response
              controller.close()
            }
            catch (error) {
              console.error('Error rendering stream:', error)
              controller.error(error)
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/html',
            'Transfer-Encoding': 'chunked',
          },
        })
      }

      // Default response for other routes
      return new Response('Not found', { status: 404 })
    },
  })

  /* eslint-disable no-console */
  console.log(`stx streaming example server running at ${server.url}`)
}

// Start the server
startServer().catch(console.error)
