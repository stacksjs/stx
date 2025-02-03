/**
 * Activity Feed Island Component
 * This adds interactive functionality to the server-rendered activity feed
 */

interface ActivityFeedProps {
  maxItems?: number;
  refreshInterval?: number;
}

// Default export is the hydration function
export default function hydrate(element: HTMLElement, props: ActivityFeedProps): void {
  console.log('Hydrating activity feed with props:', props)

  // Add load more functionality
  const loadMoreButton = element.querySelector('.load-more')
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => loadMoreActivities(element))

    // Show the button since we now have JS capability
    loadMoreButton.classList.remove('hidden')
  }

  // Set up auto-refresh if configured
  if (props.refreshInterval) {
    setupAutoRefresh(element, props.refreshInterval)
  }
}

/**
 * Load more activities
 */
function loadMoreActivities(element: HTMLElement): void {
  console.log('Loading more activities...')

  // Simulate API call
  setTimeout(() => {
    // Add some mock items
    const activityList = element.querySelector('.activity-list')
    if (activityList) {
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('li')
        item.className = 'activity-item'

        const time = document.createElement('span')
        time.className = 'activity-time'
        time.textContent = getRandomTime()

        const desc = document.createElement('span')
        desc.className = 'activity-desc'
        desc.textContent = getRandomActivity()

        const user = document.createElement('span')
        user.className = 'activity-user'
        user.textContent = getRandomUser()

        item.appendChild(time)
        item.appendChild(desc)
        item.appendChild(user)

        activityList.appendChild(item)
      }
    }
  }, 500)
}

/**
 * Set up auto-refresh
 */
function setupAutoRefresh(element: HTMLElement, interval: number): void {
  setInterval(() => {
    console.log('Auto-refreshing activity feed...')

    // Simulate adding a new item occasionally
    if (Math.random() < 0.3) {
      const activityList = element.querySelector('.activity-list')
      if (activityList) {
        const item = document.createElement('li')
        item.className = 'activity-item new-activity'

        const time = document.createElement('span')
        time.className = 'activity-time'
        time.textContent = new Date().toLocaleTimeString()

        const desc = document.createElement('span')
        desc.className = 'activity-desc'
        desc.textContent = getRandomActivity()

        const user = document.createElement('span')
        user.className = 'activity-user'
        user.textContent = getRandomUser()

        item.appendChild(time)
        item.appendChild(desc)
        item.appendChild(user)

        // Add at the top
        activityList.insertBefore(item, activityList.firstChild)

        // Highlight briefly
        setTimeout(() => {
          item.classList.remove('new-activity')
        }, 3000)
      }
    }
  }, interval)
}

// Helper functions for generating random content
function getRandomTime(): string {
  const hours = Math.floor(Math.random() * 12) + 1
  const minutes = Math.floor(Math.random() * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function getRandomActivity(): string {
  const activities = [
    'Logged in',
    'Created a new post',
    'Updated profile',
    'Commented on post',
    'Liked an article',
    'Shared content',
    'Uploaded a file',
    'Changed settings'
  ]
  return activities[Math.floor(Math.random() * activities.length)]
}

function getRandomUser(): string {
  const users = [
    'John Smith',
    'Emma Wilson',
    'Michael Brown',
    'Sophia Davis',
    'James Johnson',
    'Olivia Martinez'
  ]
  return users[Math.floor(Math.random() * users.length)]
}