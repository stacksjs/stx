// Client-side example demonstrating partial hydration with stx
import { initIslands } from 'bun-plugin-stx/client'

// Define the island component types
type IslandComponentHandler = () => Promise<any>
type IslandHandlers = Record<string, IslandComponentHandler>

// Island component handlers
const islands: IslandHandlers = {
  // Notification island
  'notification-panel': () => import('./islands/notification-panel'),

  // Activity feed island
  'activity-feed': () => import('./islands/activity-feed'),

  // Stats panel island (with interactive charts)
  'stats-panel': () => import('./islands/stats-panel'),

  // Search box island
  'search-box': () => import('./islands/search-box'),
}

// Initialize islands with configuration
initIslands(islands, {
  // Automatically start hydration
  autoStart: true,

  // Preload strategy: 'none', 'eager', or 'lazy'
  preload: 'lazy',
})

// Alternatively, you can manually control hydration:
// When DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Hydrate all islands
  // hydrateIslands(islands)

  // Or hydrate specific islands based on custom logic
  // For example, hydrate critical islands first
  const _criticalIslands: IslandHandlers = {
    'search-box': islands['search-box'],
  }

  // Hydrate critical islands immediately
  // hydrateIslands(criticalIslands)

  // Then hydrate the rest after a delay
  // setTimeout(() => {
  //   const nonCriticalIslands = { ...islands }
  //   delete nonCriticalIslands['search-box']
  //   hydrateIslands(nonCriticalIslands)
  // }, 2000)
})

// Example of a custom hydration strategy:
// Hydrate islands when the user interacts with them
function _setupManualHydration(): void {
  document.querySelectorAll('[data-island]').forEach((island: Element) => {
    if (island.getAttribute('data-hydrated') !== 'true') {
      // Add click listener to trigger hydration
      island.addEventListener('click', () => {
        const name = island.getAttribute('data-island')
        if (name && islands[name]) {
          /* eslint-disable no-console */
          console.log(`Hydrating ${name} on user interaction`)
          import(`./islands/${name}`).then((module) => {
            const hydrate = module.default || module.hydrate
            if (typeof hydrate === 'function') {
              // Get props
              const id = island.getAttribute('data-island-id')
              const propsScript = document.querySelector(`script[data-island-props="${id}"]`)
              const props = propsScript ? JSON.parse(propsScript.textContent || '{}') : {}

              // Hydrate the island
              hydrate(island, props)
              island.setAttribute('data-hydrated', 'true')
            }
          })
        }
      }, { once: true })
    }
  })
}

// This is an alternative approach that's commented out
// setupManualHydration()
