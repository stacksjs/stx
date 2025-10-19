/**
 * Stats Panel Island Component
 * This adds interactive functionality to the server-rendered stats panel
 */

interface StatsPanelProps {
  refreshInterval?: number
  animateChanges?: boolean
}

interface _Stat {
  label: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
}

// Default export is the hydration function
export default function hydrate(element: HTMLElement, props: StatsPanelProps): void {
  console.log('Hydrating stats panel with props:', props)

  // Add refresh functionality
  const refreshButton = element.querySelector('.refresh-stats')
  if (refreshButton) {
    refreshButton.addEventListener('click', () => refreshStats(element, props.animateChanges))

    // Show the button since we now have JS capability
    refreshButton.classList.remove('hidden')
  }

  // Set up auto-refresh if configured
  if (props.refreshInterval) {
    setupAutoRefresh(element, props.refreshInterval, props.animateChanges)
  }

  // Make stats interactive
  setupInteractiveStats(element)
}

/**
 * Refresh stats with the latest data
 */
function refreshStats(element: HTMLElement, animate: boolean = false): void {
  console.log('Refreshing stats...')

  // Simulate API call
  setTimeout(() => {
    const statItems = element.querySelectorAll('.stat-item')

    statItems.forEach((item) => {
      const valueElement = item.querySelector('.stat-value')
      const changeElement = item.querySelector('.stat-change')

      if (valueElement) {
        const currentValue = Number.parseInt(valueElement.textContent || '0', 10)
        const newValue = getRandomChange(currentValue)

        if (animate) {
          animateValue(valueElement, currentValue, newValue)
        }
        else {
          valueElement.textContent = newValue.toString()
        }

        // Update change indicator
        if (changeElement) {
          const change = ((newValue - currentValue) / currentValue * 100).toFixed(1)
          const isPositive = newValue > currentValue

          changeElement.textContent = `${isPositive ? '+' : ''}${change}%`

          // Update trend indicator
          const trendElement = item.querySelector('.trend-indicator')
          if (trendElement) {
            trendElement.classList.remove('up', 'down', 'neutral')
            if (newValue > currentValue) {
              trendElement.classList.add('up')
            }
            else if (newValue < currentValue) {
              trendElement.classList.add('down')
            }
            else {
              trendElement.classList.add('neutral')
            }
          }
        }
      }
    })
  }, 500)
}

/**
 * Animate value change
 */
function animateValue(element: Element, start: number, end: number): void {
  let current = start
  const increment = (end - start) / 20
  const timer = setInterval(() => {
    current += increment
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      clearInterval(timer)
      element.textContent = end.toString()
    }
    else {
      element.textContent = Math.round(current).toString()
    }
  }, 20)
}

/**
 * Set up auto-refresh
 */
function setupAutoRefresh(element: HTMLElement, interval: number, animate: boolean = false): void {
  setInterval(() => {
    refreshStats(element, animate)
  }, interval)
}

/**
 * Setup interactive stats (hover effects, etc.)
 */
function setupInteractiveStats(element: HTMLElement): void {
  const statItems = element.querySelectorAll('.stat-item')

  statItems.forEach((item) => {
    item.addEventListener('mouseover', () => {
      item.classList.add('highlight')
    })

    item.addEventListener('mouseout', () => {
      item.classList.remove('highlight')
    })

    item.addEventListener('click', () => {
      showStatDetails(item)
    })
  })
}

/**
 * Show detailed information about a stat
 */
function showStatDetails(statItem: Element): void {
  const label = statItem.querySelector('.stat-label')?.textContent
  const value = statItem.querySelector('.stat-value')?.textContent

  console.log(`Showing detailed view for: ${label} (${value})`)

  // In a real implementation, this might show a modal or expanded view
  // eslint-disable-next-line no-alert
  alert(`${label}: ${value}\nClick OK to close`)
}

// Helper function for generating random changes
function getRandomChange(currentValue: number): number {
  const maxChange = Math.round(currentValue * 0.2) // Max 20% change
  const change = Math.floor(Math.random() * maxChange * 2) - maxChange
  return Math.max(0, currentValue + change) // Ensure value doesn't go below zero
}
