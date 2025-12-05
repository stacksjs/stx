/**
 * STX Story - Collection module
 * Discovers and analyzes story files
 */

export {
  analyzeComponent,
  analyzeComponentFile,
  extractCssClasses,
  extractDependencies,
  extractDescription,
  extractDirectives,
  extractProps,
  extractSlots,
} from './analyzer'

export {
  extractScriptContent,
  extractTemplateContent,
  parseStoryContent,
  parseStoryFile,
} from './parser'

export {
  isNonComponentFile,
  scanStoryFiles,
  watchStoryFiles,
} from './scanner'

export {
  buildTree,
  createTreePath,
  findStoryInTree,
  flattenTree,
} from './tree'
