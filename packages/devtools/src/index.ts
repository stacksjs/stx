// stx DevTools
// A powerful dev tools UI for stx templating engine

import type { StxConfig } from '../../stx/src/types'

export { default as PerformanceChart } from './components/PerformanceChart.stx'
// Components
export { default as TemplateDetails } from './components/TemplateDetails.stx'
// Layout
export { default as MainLayout } from './layouts/MainLayout.stx'
export { default as ConfigView } from './views/config.stx'
export { default as DashboardView } from './views/dashboard.stx'
export { default as HelloWorldView } from './views/hello-world.stx'

// NOTE: These imports will resolve at build time with the stx plugin
// Views
export { default as IndexView } from './views/index.stx'
export { default as PerformanceView } from './views/performance.stx'

export { default as TemplatesView } from './views/templates.stx'

// Default export for easy integration
export default {
  routes: {
    '/': 'IndexView',
    '/dashboard': 'DashboardView',
    '/templates': 'TemplatesView',
    '/performance': 'PerformanceView',
    '/config': 'ConfigView',
  },

  // Method to initialize the devtools with a config
  init: (_config?: Partial<StxConfig>): { start: (port?: number) => number } => {
    // Initialize stx DevTools with config
    return {
      start: (port = 3000): number => {
        // Start dev server on specified port
        return port
      },
    }
  },
}
