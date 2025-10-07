import type { SanitizerOptions } from './types'

/**
 * Strict preset - Only safe, basic formatting
 */
export const strict: SanitizerOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
  ],
  allowedAttributes: {
    '*': ['class', 'id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowDataAttributes: false,
  allowAriaAttributes: true,
  stripTags: true,
  allowComments: false,
}

/**
 * Basic preset - Common safe HTML elements
 */
export const basic: SanitizerOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'span',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'code',
    'pre',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: {
    '*': ['class', 'id'],
    'a': ['class', 'id', 'href', 'title', 'target', 'rel'],
    'img': ['class', 'id', 'src', 'alt', 'title', 'width', 'height'],
    'td': ['class', 'id', 'colspan', 'rowspan', 'align'],
    'th': ['class', 'id', 'colspan', 'rowspan', 'align', 'scope'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowDataAttributes: false,
  allowAriaAttributes: true,
  stripTags: true,
  allowComments: false,
}

/**
 * Relaxed preset - More permissive, includes media and interactive elements
 */
export const relaxed: SanitizerOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'span',
    'div',
    'section',
    'article',
    'aside',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    'a',
    'img',
    'figure',
    'figcaption',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'blockquote',
    'q',
    'cite',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'del',
    'ins',
    'sub',
    'sup',
    'abbr',
    'address',
    'time',
    'hr',
    'video',
    'audio',
    'source',
    'track',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'title'],
    'a': ['class', 'id', 'href', 'title', 'target', 'rel'],
    'img': ['class', 'id', 'src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    'video': ['class', 'id', 'src', 'width', 'height', 'controls', 'preload', 'poster'],
    'audio': ['class', 'id', 'src', 'controls', 'preload'],
    'source': ['src', 'type'],
    'track': ['src', 'kind', 'srclang', 'label'],
    'td': ['class', 'id', 'colspan', 'rowspan', 'align'],
    'th': ['class', 'id', 'colspan', 'rowspan', 'align', 'scope'],
    'time': ['class', 'id', 'datetime'],
    'abbr': ['class', 'id', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  allowDataAttributes: true,
  allowAriaAttributes: true,
  stripTags: true,
  allowComments: false,
}

/**
 * Markdown preset - Optimized for markdown-generated HTML
 */
export const markdown: SanitizerOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'code',
    'pre',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'del',
    'ins',
    'hr',
    'input', // For task lists
  ],
  allowedAttributes: {
    '*': ['class', 'id'],
    'a': ['class', 'id', 'href', 'title'],
    'img': ['class', 'id', 'src', 'alt', 'title'],
    'code': ['class'], // For syntax highlighting
    'td': ['align'],
    'th': ['align', 'scope'],
    'input': ['type', 'checked', 'disabled'], // For task lists
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowDataAttributes: false,
  allowAriaAttributes: false,
  stripTags: true,
  allowComments: false,
}

/**
 * Get preset by name
 */
export function getPreset(name: string): SanitizerOptions {
  switch (name) {
    case 'strict':
      return strict
    case 'basic':
      return basic
    case 'relaxed':
      return relaxed
    case 'markdown':
      return markdown
    default:
      return basic
  }
}
