/**
 * STX Story - Component showcase and testing
 *
 * Native component explorer for stx, providing:
 * - Automatic component discovery
 * - Interactive prop editing
 * - Visual regression testing
 * - Documentation generation
 */

// Collection (scanner, analyzer, tree)
export * from './collect'

// Commands
export * from './commands'

// Configuration
export {
  defaultBackgroundPresets,
  defaultResponsivePresets,
  defaultStoryConfig,
  getDefaultStoryConfig,
  resolveStoryConfig,
} from './config'

// Context
export {
  createContext,
  updateContextStoryFiles,
  updateContextTree,
} from './context'
export type { CreateContextOptions } from './context'

// Server
export { createStoryServer } from './server'
export type { ServerOptions, StoryServer } from './server'

// Types
export * from './types'
