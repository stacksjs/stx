import type { StxOptions } from '@stacksjs/stx'
import type { BunPlugin } from 'bun'
import { buildWebComponents, cacheTemplate, checkCache, classifyAllScripts, defaultConfig, extractVariables, findSfcTemplateBlock, insertBeforeBodyClose, loadStxConfig, processClientScript, processDirectives, readMarkdownFile, withinBundlerCallback } from '@stacksjs/stx'
import { createStxPlugin } from '../../stx/src/bun-plugin-factory'

// Bundle the factory while using the runtime from the consumer's installed STX.
const runtime = {
  readMarkdownFile,
  cacheTemplate,
  checkCache,
  processClientScript,
  withinBundlerCallback,
  defaultConfig,
  loadStxConfig,
  insertBeforeBodyClose,
  processDirectives,
  classifyAllScripts,
  findSfcTemplateBlock,
  extractVariables,
  buildWebComponents,
}

export function stxPlugin(options?: StxOptions): BunPlugin {
  return createStxPlugin(runtime, options)
}

export default stxPlugin

// Export watch functionality
export { createWatcher, startWatchMode, watchAndBuild } from './watch'
export type {
  WatchAndBuildOptions,
  WatchBuildResult,
  WatcherInstance,
  WatchEvent,
  WatchOptions,
} from './watch'

// Re-export functions and types that consumers might need
// Note: serve is exported from ./serve.ts, not here (to avoid duplicate export names when bundled)
export { createMiddleware, createRoute, readMarkdownFile } from '@stacksjs/stx'
export type { CustomDirective, CustomDirectiveHandler, ServeOptions, ServeResult, StxOptions } from '@stacksjs/stx'
