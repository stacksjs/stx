import { cssIdRE } from '@unocss/core'
import { SKIP_COMMENT_RE } from './constants'

// picomatch patterns, used with rollup's createFilter
export const defaultPipelineExclude: RegExp[] = [cssIdRE]
export const defaultPipelineInclude: RegExp[] = [/\.(stx|vue|svelte|[jt]sx|mdx?|astro|html)($|\?)/]

// micromatch patterns, used in postcss plugin
export const defaultFilesystemGlobs: string[] = [
  '**/*.{html,stx,js,ts,jsx,tsx,vue,svelte,astro,mdx,md}',
]

/**
 * Default match includes in getMatchedPositions for IDE
 */
export const defaultIdeMatchInclude: RegExp[] = [
  // String literals
  // eslint-disable-next-line no-control-regex
  /(['"`])[^\x01]*?\1/g,
  // HTML tags
  /<[^/?<>0-9$_!"'](?:"[^"]*"|'[^']*'|[^>])+>/g,
  // CSS directives
  /(@apply|--uno|--at-apply)[^;]*;/g,
]

/**
 * Default match includes in getMatchedPositions for IDE
 */
export const defaultIdeMatchExclude: RegExp[] = [
  SKIP_COMMENT_RE,
]
