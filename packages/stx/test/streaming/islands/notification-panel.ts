/* eslint-disable no-console */
/**
 * Notification Panel Island Component
 * This adds interactive functionality to the server-rendered notification panel
 */

interface NotificationProps {
  realtime?: boolean
  autoRefresh?: boolean
}

interface Notification {
  id: number | string
  message: string
  read: boolean
}

// Default export is the hydration function
export default function hydrate(element: HTMLElement, props: NotificationProps): void {
  console.log('Hydrating notification panel with props:', props)

  // Find all notification items
  const notifications = element.querySelectorAll('.notification')

  // Add click handlers to mark as read
  notifications.forEach((notification: Element) => {
    // Skip if already interactive
    if (notification.getAttribute('data-interactive') === 'true')
      return

    // Add click handler
    notification.addEventListener('click', () => {
      const id = notification.getAttribute('data-id')
      if (id)
        markAsRead(id, notification as HTMLElement)
    })

    // Add hover effect
    notification.addEventListener('mouseenter', () => {
      notification.classList.add('hover')
    })

    notification.addEventListener('mouseleave', () => {
      notification.classList.remove('hover')
    })

    // Mark as interactive
    notification.setAttribute('data-interactive', 'true')
  })

  // Add mark all as read button if not already present
  if (!element.querySelector('.mark-all-read')) {
    const header = element.querySelector('h3') || element.querySelector('header')
    if (header) {
      const button = document.createElement('button')
      button.className = 'mark-all-read'
      button.textContent = 'Mark all as read'
      button.addEventListener('click', markAllAsRead)
      header.appendChild(button)
    }
  }

  // Add websocket connection for real-time updates if specified
  if (props.realtime) {
    setupRealtimeUpdates(element)
  }
}

/**
 * Mark a notification as read
 */
function markAsRead(id: string | number, element: HTMLElement): void {
  console.log(`Marking notification ${id} as read`)

  // Add visual indication
  element.classList.add('read')
  element.classList.remove('unread')

  // Send API request to mark as read
  fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch((error) => {
    console.error('Error marking notification as read:', error)
    // Revert visual state on error
    element.classList.remove('read')
    element.classList.add('unread')
  })
}

/**
 * Mark all notifications as read
 */
function markAllAsRead(): void {
  console.log('Marking all notifications as read')

  // Find all unread notifications
  const unread = document.querySelectorAll('.notification.unread')

  // Mark each as read
  unread.forEach((notification: Element) => {
    const id = notification.getAttribute('data-id')
    if (id)
      markAsRead(id, notification as HTMLElement)
  })
}

/**
 * Set up realtime updates for notifications
 */
function setupRealtimeUpdates(element: HTMLElement): void {
  console.log('Setting up realtime updates for notifications')

  // Simulate websocket with setInterval for the example
  setInterval(() => {
    // 20% chance of new notification in this demo
    if (Math.random() < 0.2) {
      addNewNotification(element, {
        id: Date.now(),
        message: `New notification ${new Date().toLocaleTimeString()}`,
        read: false,
      })
    }
  }, 10000) // Check every 10 seconds
}

/**
 * Add a new notification to the panel
 */
function addNewNotification(element: HTMLElement, notification: Notification): void {
  console.log('Adding new notification:', notification)

  // Find the notification list
  const list = element.querySelector('.notification-list')
  if (!list)
    return

  // Create new notification element
  const item = document.createElement('li')
  item.className = `notification ${notification.read ? 'read' : 'unread'}`
  item.setAttribute('data-id', String(notification.id))
  item.textContent = notification.message

  // Add interactive behavior
  item.addEventListener('click', () => {
    markAsRead(notification.id, item)
  })

  // Add to the list (at the top)
  list.insertBefore(item, list.firstChild)

  // Highlight briefly
  item.classList.add('highlight')
  setTimeout(() => {
    item.classList.remove('highlight')
  }, 2000)
}
