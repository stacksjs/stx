/**
 * STX Story - Component showcase and testing
 *
 * Native component explorer for stx, providing:
 * - Automatic component discovery
 * - Interactive prop editing
 * - Visual regression testing
 * - Documentation generation
 */

// Addons
export * from './addons'

// Analytics
export * from './analytics'

// Auto-generate Stories
export * from './auto-stories'

// Bookmarks
export * from './bookmarks'

// Bun Test Integration
export * from './bun-test'

// CLI
export * from './cli'

// Collection (scanner, analyzer, tree)
export * from './collect'

// Commands
export * from './commands'

// Compiled Output
export * from './compiled-output'

// Composition (dependency graph)
export * from './composition'

// Configuration
export {
  defaultBackgroundPresets,
  defaultResponsivePresets,
  defaultStoryConfig,
  getDefaultStoryConfig,
  resolveStoryConfig,
} from './config'
// Config Watcher
export * from './config-watcher'

// Context
export {
  createContext,
  updateContextStoryFiles,
  updateContextTree,
} from './context'

export type { CreateContextOptions } from './context'

// Controls
export * from './controls'

// Desktop Preview
export * from './desktop-preview'

// Docs Generator
export * from './docs-generator'

// Errors
export * from './errors'

// Figma Export
export * from './figma-export'

// Generator
export * from './generator'

// Headwind CSS
export * from './headwind'

// HMR
export * from './hmr'

// Hot Swap
export * from './hot-swap'

// Interactions
export * from './interactions'

// Keyboard Shortcuts
export * from './keyboard-shortcuts'

// Output (terminal styling)
export * from './output'

// Performance Profiling
export * from './performance'

// Presets
export * from './presets'

// Props Validation
export * from './props-validation'

// Renderer
export * from './renderer'

// Search
export * from './search'

// Search Index
export * from './search-index'

// Server
export { createStoryServer } from './server'

export type { ServerOptions, StoryServer } from './server'

// Setup
export * from './setup'

// Snapshots
export * from './snapshots'

// Testing
export * from './testing'

// Theme
export * from './theme'

// Types
export * from './types'

// UI Components
export * from './ui'

// Visual Testing
export * from './visual-testing'
