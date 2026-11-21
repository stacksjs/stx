import type { BunPlugin } from 'bun'
import type { StxOptions } from './types'
import { readMarkdownFile } from './assets'
import { createStxPlugin } from './bun-plugin-factory'
import { cacheTemplate, checkCache } from './caching'
import { processClientScript } from './client-script'
import { withinBundlerCallback } from './client-script-bundler'
import { defaultConfig, loadStxConfig } from './config'
import { insertBeforeBodyClose } from './document-tags'
import { processDirectives } from './process'
import { classifyAllScripts } from './script-classifier'
import { findSfcTemplateBlock } from './sfc-template'
import { extractVariables } from './variable-extractor'
import { buildWebComponents } from './web-components'

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
